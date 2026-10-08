import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Periodic cleanup of expired rate limit windows
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);

/**
 * High-performance sliding window rate limiter
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests, please slow down.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: retryAfter,
      });
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
    next();
  };
}

// In-Memory Idempotency Store to prevent duplicate mutations on retries
const idempotencyStore = new Map<string, { status: number; body: any; timestamp: number }>();

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return next();
  }

  const cached = idempotencyStore.get(idempotencyKey);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes TTL
    return res.status(cached.status).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(idempotencyKey, {
        status: res.statusCode,
        body,
        timestamp: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}
