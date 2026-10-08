import dotenv from 'dotenv';
dotenv.config();

export interface STTOptions {
  language?: string; // Optional language code (e.g. 'ta', 'hi', 'en')
  prompt?: string;   // Optional prompt/context
  temperature?: number;
}

export interface STTResult {
  text: string;
  language?: string;
  confidence?: number;
  duration?: number;
  provider: string;
  model: string;
}

export interface SpeechToTextProvider {
  name: string;
  transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    filename?: string,
    options?: STTOptions
  ): Promise<STTResult>;
}

/**
 * Maps MIME types to appropriate audio file extensions required by Whisper API
 */
export function getExtensionForMimeType(mimeType: string): string {
  const cleanMime = mimeType.toLowerCase().split(';')[0].trim();
  switch (cleanMime) {
    case 'audio/webm':
      return 'webm';
    case 'audio/ogg':
    case 'audio/opus':
      return 'ogg';
    case 'audio/mp4':
    case 'audio/m4a':
    case 'audio/x-m4a':
      return 'm4a';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/flac':
      return 'flac';
    default:
      return 'webm';
  }
}

/**
 * 🎙️ Groq Whisper Speech-to-Text Provider
 * Utilizes high-performance Whisper LPU instances for ultra-fast multilingual transcription
 */
export class GroqWhisperSTTProvider implements SpeechToTextProvider {
  public name = 'groq-whisper';
  private apiKey: string;
  private primaryModel = 'whisper-large-v3-turbo';
  private fallbackModel = 'whisper-large-v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    filename = 'recording.webm',
    options: STTOptions = {}
  ): Promise<STTResult> {
    const ext = getExtensionForMimeType(mimeType);
    const actualFilename = filename.includes('.') ? filename : `recording.${ext}`;
    const cleanMime = mimeType.split(';')[0].trim() || 'audio/webm';

    if (!this.apiKey || this.apiKey.includes('YOUR_')) {
      throw {
        code: 'STT_AUTH_ERROR',
        message: 'Groq API key is missing or invalid on the server.',
      };
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw {
        code: 'EMPTY_AUDIO',
        message: 'No audio data was received for transcription.',
      };
    }

    const modelsToTry = [this.primaryModel, this.fallbackModel];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[VOICE STT] Uploading ${audioBuffer.length} bytes (${cleanMime}) to Groq model: ${model}`);
        
        // Native Node 18+ FormData & Blob
        const formData = new FormData();
        const audioBlob = new Blob([audioBuffer], { type: cleanMime });
        formData.append('file', audioBlob, actualFilename);
        formData.append('model', model);
        formData.append('response_format', 'verbose_json');

        if (options.language && options.language !== 'auto') {
          // Whisper accepts ISO 639-1 two-letter codes (e.g., 'ta', 'hi', 'en', 'te', 'ml', 'kn', 'bn')
          formData.append('language', options.language);
        }

        if (options.prompt) {
          formData.append('prompt', options.prompt);
        }

        if (typeof options.temperature === 'number') {
          formData.append('temperature', options.temperature.toString());
        }

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: formData,
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          const errText = await res.text();
          let parsedErr: any;
          try {
            parsedErr = JSON.parse(errText);
          } catch {
            parsedErr = { error: { message: errText } };
          }

          const errMsg = parsedErr.error?.message || errText;
          console.warn(`[VOICE STT] Model ${model} returned HTTP ${res.status}:`, errMsg);

          if (res.status === 401) {
            throw { code: 'STT_AUTH_ERROR', message: 'Authentication failed with the voice transcription provider.' };
          }
          if (res.status === 429) {
            lastError = { code: 'STT_RATE_LIMIT', message: 'Voice recognition rate limit reached. Please wait a moment.' };
            continue;
          }
          if (res.status === 400 && errMsg.includes('format')) {
            throw { code: 'UNSUPPORTED_AUDIO_FORMAT', message: `Audio format (${cleanMime}) is not supported.` };
          }

          lastError = { code: 'STT_PROVIDER_ERROR', message: errMsg };
          continue;
        }

        const result: any = await res.json();
        const text = (result.text || '').trim();
        const detectedLanguage = result.language || options.language || 'en';
        const duration = result.duration || 0;

        console.log(`[VOICE STT] Success! Transcribed ${text.length} chars in language "${detectedLanguage}"`);

        return {
          text,
          language: detectedLanguage,
          confidence: 0.96,
          duration,
          provider: 'groq-whisper',
          model,
        };
      } catch (err: any) {
        if (err.code) throw err;
        lastError = err;
      }
    }

    throw lastError || {
      code: 'STT_FAILED',
      message: 'Failed to transcribe audio after trying all available models.',
    };
  }
}

// Singleton STT service instance
export const sttService: SpeechToTextProvider = new GroqWhisperSTTProvider();
