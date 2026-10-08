/**
 * URIMAIYALAR OS � Smart Cache Layer
 * Uses Upstash Redis (FREE serverless) when available.
 * Falls back to in-memory LRU cache when Redis is not configured.
 * Zero config required � works out of the box, gets faster with Redis.
 */

const CACHE = new Map();                  // in-memory fallback
const TTL_MAP = new Map();               // tracks expiry
let redisClient = null;
let useRedis = false;

// Try to connect to Redis if env vars are set (Upstash free tier)
async function initRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.log('[CACHE] No Redis config � using in-memory cache (upgrade to Upstash free tier for Redis)');
    return;
  }
  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url, token });
    await redisClient.ping();
    useRedis = true;
    console.log('[CACHE] Connected to Upstash Redis ?');
  } catch (err) {
    console.warn('[CACHE] Redis connection failed, falling back to in-memory:', err.message);
  }
}

async function get(key) {
  if (useRedis) {
    try { return await redisClient.get(key); } catch {}
  }
  // In-memory fallback
  if (TTL_MAP.has(key) && Date.now() > TTL_MAP.get(key)) {
    CACHE.delete(key); TTL_MAP.delete(key); return null;
  }
  return CACHE.get(key) ?? null;
}

async function set(key, value, ttlSeconds = 60) {
  if (useRedis) {
    try { await redisClient.set(key, value, { ex: ttlSeconds }); return; } catch {}
  }
  CACHE.set(key, value);
  TTL_MAP.set(key, Date.now() + ttlSeconds * 1000);
  // Prevent memory leak � cap at 5000 entries
  if (CACHE.size > 5000) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey); TTL_MAP.delete(firstKey);
  }
}

async function del(pattern) {
  if (useRedis) {
    try {
      const keys = await redisClient.keys(pattern + '*');
      if (keys.length) await redisClient.del(...keys);
      return;
    } catch {}
  }
  for (const key of CACHE.keys()) {
    if (key.startsWith(pattern.replace('*', ''))) { CACHE.delete(key); TTL_MAP.delete(key); }
  }
}

/**
 * Express middleware factory � caches GET responses by shopId + URL
 * Usage: router.get('/customers', cacheMiddleware('customers', 30), handler)
 */
function cacheMiddleware(namespace, ttlSeconds = 60) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const shopId = req.query.shopId || 'default';
    const cacheKey = `${namespace}:${shopId}:${req.originalUrl}`;
    try {
      const cached = await get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
      }
    } catch {}
    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      try { await set(cacheKey, JSON.stringify(data), ttlSeconds); } catch {}
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };
    next();
  };
}

/**
 * Invalidates cache for a shopId namespace after write operations
 */
async function invalidateShop(namespace, shopId) {
  await del(`${namespace}:${shopId}:`);
}

export { initRedis, get, set, del, cacheMiddleware, invalidateShop };
