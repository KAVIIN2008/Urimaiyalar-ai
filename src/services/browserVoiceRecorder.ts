// src/services/browserVoiceRecorder.ts
// Production-grade browser audio capture & STT transcription client

export type VoiceRecordingState =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'RECORDING'
  | 'STOPPING'
  | 'PROCESSING'
  | 'TRANSCRIBING'
  | 'SUCCESS'
  | 'ERROR';

export interface SupportedAudioFormat {
  mimeType: string;
  extension: string;
}

export interface VoiceRecorderCallbacks {
  onStateChange: (state: VoiceRecordingState) => void;
  onAudioLevel?: (level: number) => void; // 0.0 - 1.0 for waveform animations
  onDurationChange?: (seconds: number) => void;
  onError: (code: string, message: string) => void;
  onTranscriptReady: (transcript: string, language?: string) => void;
}

/**
 * Detects the optimal supported audio MIME type and file extension for this browser
 */
export function getSupportedAudioFormat(): SupportedAudioFormat {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return { mimeType: 'audio/webm', extension: 'webm' };
  }

  const candidateFormats = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/ogg', extension: 'ogg' },
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/aac', extension: 'aac' },
    { mimeType: 'audio/wav', extension: 'wav' },
  ];

  for (const candidate of candidateFormats) {
    if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
      return candidate;
    }
  }

  // Browser default fallback
  return { mimeType: '', extension: 'webm' };
}

/**
 * Maps browser DOMExceptions into actionable, user-friendly diagnostic messages
 */
export function mapMediaError(error: any): { code: string; message: string } {
  const name = error?.name || '';
  const message = error?.message || '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return {
      code: 'MIC_PERMISSION_DENIED',
      message: 'Microphone permission was denied. Please allow microphone access in your browser settings or address bar icon.',
    };
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      code: 'NO_MICROPHONE',
      message: 'No microphone was detected on this device. Please plug in or enable an audio input device.',
    };
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      code: 'MIC_IN_USE',
      message: 'Your microphone is currently being used by another application (e.g. Zoom, Meet, or another browser tab).',
    };
  }

  if (name === 'SecurityError') {
    return {
      code: 'SECURITY_ERROR',
      message: 'Microphone access is blocked by browser security settings. Note: A secure context (HTTPS or localhost) is required.',
    };
  }

  if (name === 'AbortError') {
    return {
      code: 'ABORT_ERROR',
      message: 'Microphone access was interrupted. Please try again.',
    };
  }

  return {
    code: 'UNKNOWN_MEDIA_ERROR',
    message: message ? `Microphone error: ${message}` : 'Could not access microphone. Please check browser permissions.',
  };
}

export class BrowserVoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private timerIntervalId: any = null;

  private audioChunks: Blob[] = [];
  private recordingStartTime = 0;
  private state: VoiceRecordingState = 'IDLE';
  private callbacks: VoiceRecorderCallbacks;
  private activeFormat: SupportedAudioFormat;

  private minDurationMs = 500;
  private maxDurationMs = 60000; // 60 seconds auto-cutoff

  constructor(callbacks: VoiceRecorderCallbacks) {
    this.callbacks = callbacks;
    this.activeFormat = getSupportedAudioFormat();
  }

  public getState(): VoiceRecordingState {
    return this.state;
  }

  private setState(newState: VoiceRecordingState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Starts microphone recording with live audio level visualization & auto-timer
   */
  public async startRecording(): Promise<boolean> {
    if (this.state !== 'IDLE' && this.state !== 'SUCCESS' && this.state !== 'ERROR') {
      console.warn('[VOICE RECORDER] Cannot start: current state is', this.state);
      return false;
    }

    // 1. Verify Browser Support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.setState('ERROR');
      this.callbacks.onError(
        'BROWSER_NOT_SUPPORTED',
        'Your browser does not support audio recording. Please use modern Chrome, Edge, Safari, or Firefox.'
      );
      return false;
    }

    try {
      this.setState('REQUESTING_PERMISSION');
      this.audioChunks = [];

      // 2. Request User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;

      // 3. Audio Visualizer Level Analyzer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const actx = new AudioContextClass();
          this.audioContext = actx;
          const source = actx.createMediaStreamSource(stream);
          const analyser = actx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          this.analyserNode = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const trackAudioLevel = () => {
            if (this.analyserNode && this.state === 'RECORDING') {
              this.analyserNode.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              const normalized = Math.min(1, avg / 60);
              this.callbacks.onAudioLevel?.(normalized);
              this.animFrameId = requestAnimationFrame(trackAudioLevel);
            }
          };
          this.animFrameId = requestAnimationFrame(trackAudioLevel);
        }
      } catch (e) {
        console.warn('[VOICE RECORDER] AudioContext visualizer unavailable:', e);
      }

      // 4. Initialize MediaRecorder
      const options: MediaRecorderOptions = {};
      if (this.activeFormat.mimeType) {
        options.mimeType = this.activeFormat.mimeType;
      }

      const recorder = new MediaRecorder(stream, options);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        this.handleRecordingComplete();
      };

      recorder.start(100); // 100ms chunk interval
      this.recordingStartTime = Date.now();
      this.setState('RECORDING');

      // 5. Setup Live Duration Timer & Max Cutoff
      let secondsCount = 0;
      this.callbacks.onDurationChange?.(0);
      this.timerIntervalId = setInterval(() => {
        secondsCount++;
        this.callbacks.onDurationChange?.(secondsCount);

        // Auto-stop at max duration
        if (Date.now() - this.recordingStartTime >= this.maxDurationMs) {
          this.stopRecording();
        }
      }, 1000);

      return true;
    } catch (err: any) {
      this.cleanup();
      this.setState('ERROR');
      const errInfo = mapMediaError(err);
      this.callbacks.onError(errInfo.code, errInfo.message);
      return false;
    }
  }

  /**
   * Stops recording and initiates the upload + transcription flow
   */
  public stopRecording() {
    if (this.state !== 'RECORDING') return;

    this.setState('STOPPING');
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('[VOICE RECORDER] Stop error:', e);
      }
    }
  }

  /**
   * Called automatically after MediaRecorder finishes writing final audio chunks
   */
  private async handleRecordingComplete() {
    this.setState('PROCESSING');

    const duration = Date.now() - this.recordingStartTime;
    if (duration < this.minDurationMs) {
      this.cleanup();
      this.setState('ERROR');
      this.callbacks.onError(
        'RECORDING_TOO_SHORT',
        'Audio recording was too brief. Please press, speak a full phrase, and stop.'
      );
      return;
    }

    // Create & validate audio blob
    const mimeType = this.activeFormat.mimeType || 'audio/webm';
    const blob = new Blob(this.audioChunks, { type: mimeType });

    if (blob.size === 0) {
      this.cleanup();
      this.setState('ERROR');
      this.callbacks.onError(
        'EMPTY_AUDIO',
        'No audio was captured. Please speak for a moment and try again.'
      );
      return;
    }

    console.log(`[VOICE RECORDER] Audio blob captured: ${blob.size} bytes (${mimeType})`);

    // Clean up mic streams right away so user sees mic indicator turn off in browser tab
    this.cleanupStreamsOnly();

    // 6. Upload to Backend Speech-to-Text API
    this.setState('TRANSCRIBING');

    try {
      const filename = `recording.${this.activeFormat.extension}`;
      const formData = new FormData();
      formData.append('file', blob, filename);

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errJson: any;
        try {
          errJson = await res.json();
        } catch {
          errJson = { error: { message: `HTTP ${res.status} from speech server` } };
        }
        const errMsg = errJson?.error?.message || 'Speech recognition failed.';
        const errCode = errJson?.error?.code || 'STT_FAILED';
        throw { code: errCode, message: errMsg };
      }

      const data = await res.json();

      if (data.success && data.text && data.text.trim()) {
        const cleanedText = data.text.trim();
        this.setState('SUCCESS');
        this.callbacks.onTranscriptReady(cleanedText, data.language);
      } else {
        throw {
          code: 'TRANSCRIPTION_EMPTY',
          message: 'No clear speech was recognized. Please speak closer to the microphone and try again.',
        };
      }
    } catch (err: any) {
      this.setState('ERROR');
      this.callbacks.onError(err.code || 'UPLOAD_ERROR', err.message || 'Speech transcription failed.');
    } finally {
      this.cleanup();
    }
  }

  private cleanupStreamsOnly() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.callbacks.onAudioLevel?.(0);
  }

  public cleanup() {
    this.cleanupStreamsOnly();
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
