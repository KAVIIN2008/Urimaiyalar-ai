import { Router, Request, Response } from 'express';
import multer from 'multer';
import { sttService, getExtensionForMimeType } from '../services/voiceSTTService';

const router = Router();

// Configure Multer with in-memory storage (25MB audio limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accept standard browser audio MIME types
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`UNSUPPORTED_MIME_TYPE: ${file.mimetype}`));
    }
  },
});

/**
 * Common handler for audio transcription from either multipart/form-data or JSON base64
 */
export async function handleTranscriptionRequest(req: Request, res: Response) {
  const start = Date.now();

  try {
    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/webm';
    let originalName = 'recording.webm';
    let language = req.body?.language || 'auto';
    let prompt = req.body?.prompt;

    // 1. Check if multipart file uploaded
    if (req.file) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
      originalName = req.file.originalname || `recording.${getExtensionForMimeType(mimeType)}`;
    } else if (req.body?.audioBase64) {
      // 2. Check if sent as Base64 JSON payload
      const base64Data = req.body.audioBase64;
      const matches = base64Data.match(/^data:([A-Za-z-+/0-9]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        audioBuffer = Buffer.from(matches[2], 'base64');
      } else {
        audioBuffer = Buffer.from(base64Data, 'base64');
      }
      if (req.body.mimeType) {
        mimeType = req.body.mimeType;
      }
      originalName = `recording.${getExtensionForMimeType(mimeType)}`;
    }

    // 3. Validation: Non-empty audio
    if (!audioBuffer || audioBuffer.length === 0) {
      console.warn('[VOICE ROUTE] Rejected: Zero bytes audio received.');
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_AUDIO',
          message: 'No audio was captured. Please speak for a moment and try again.',
        },
      });
    }

    if (audioBuffer.length < 200) {
      console.warn(`[VOICE ROUTE] Rejected: Audio too short (${audioBuffer.length} bytes).`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'RECORDING_TOO_SHORT',
          message: 'Audio recording was too short. Please speak a complete sentence.',
        },
      });
    }

    console.log(`[VOICE ROUTE] Processing audio: ${audioBuffer.length} bytes | MIME: ${mimeType} | Requested Lang: ${language}`);

    // 4. Execute STT Provider
    const result = await sttService.transcribe(audioBuffer, mimeType, originalName, {
      language: language === 'auto' ? undefined : language,
      prompt,
    });

    const latencyMs = Date.now() - start;
    console.log(`[VOICE ROUTE] Completed in ${latencyMs}ms | Result: "${result.text.slice(0, 80)}" | Lang: ${result.language}`);

    return res.json({
      success: true,
      text: result.text,
      language: result.language,
      confidence: result.confidence,
      duration: result.duration,
      provider: result.provider,
      latencyMs,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    console.error('[VOICE ROUTE ERROR]', error);

    const code = error?.code || 'STT_FAILED';
    const message = error?.message || 'Speech transcription failed. Please try speaking again.';

    return res.status(500).json({
      success: false,
      error: {
        code,
        message,
      },
      latencyMs,
    });
  }
}

// Reusable middleware for multipart audio fields
export const voiceUploadMiddleware = [
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]),
  (req: Request, _res: Response, next: any) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.file?.[0]) req.file = files.file[0];
    else if (files?.audio?.[0]) req.file = files.audio[0];
    next();
  },
];

// POST /api/voice/transcribe (supports single file named 'file' or 'audio')
router.post(
  '/transcribe',
  voiceUploadMiddleware,
  handleTranscriptionRequest
);

export default router;
