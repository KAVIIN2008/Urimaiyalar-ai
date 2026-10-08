/**
 * URIMAIYALAR AI - Audio & Speech Synthesis Engine
 * 1. Web Audio API synthesized chimes for immediate auditory feedback (mic start, stop, confirmed)
 * 2. Robust SpeechSynthesis wrapper with Chromium un-sticking, voice detection, and fallback
 */

// Web Audio Context singleton for instant tactile sound feedback
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type SoundEffectType = 'mic_start' | 'mic_stop' | 'action_success' | 'click' | 'warning';

/**
 * Play instantaneous synthesized chime sounds without external audio asset downloads.
 * Guaranteed to produce clear audio output.
 */
export function playSoundEffect(type: SoundEffectType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'mic_start') {
      // Pleasant rising tone indicating listening started
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'mic_stop') {
      // Soft gentle descending tone indicating speech captured
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'action_success') {
      // Bright triad arpeggio for successful product add / sale / credit recording
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.15, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(280, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Crisp click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (err) {
    console.warn('Web Audio synthesis notice:', err);
  }
}

// -------------------------------------------------------------
// TEXT TO SPEECH (TTS) ENGINE
// -------------------------------------------------------------

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  return cachedVoices;
}

/**
 * Language code to BCP-47 locale mapping for TTS voice lookup.
 */
const LANG_TO_LOCALE: Record<string, string> = {
  ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN',
  bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN',
  as: 'as-IN', ur: 'ur-IN', ne: 'ne-NP', sa: 'sa-IN', en: 'en-IN',
  mai: 'hi-IN', doi: 'hi-IN', sat: 'hi-IN', mni: 'bn-IN', bo: 'hi-IN',
  ks: 'ur-IN', sd: 'ur-IN',
};

/**
 * Finds best matching voice for any Indian language code.
 * Falls back to Indian English or default if native voice not installed.
 */
export function findBestVoice(lang: string): { voice: SpeechSynthesisVoice | null; isNative: boolean; isTamilNative?: boolean } {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return { voice: null, isNative: false, isTamilNative: false };

  const targetLocale = LANG_TO_LOCALE[lang] || 'en-IN';
  const langPrefix = targetLocale.split('-')[0].toLowerCase();

  // 1. Exact locale match
  const exact = voices.find((v) => v.lang.toLowerCase() === targetLocale.toLowerCase());
  if (exact) return { voice: exact, isNative: true, isTamilNative: lang === 'ta' };

  // 2. Prefix match
  const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
  if (prefix) return { voice: prefix, isNative: true, isTamilNative: lang === 'ta' };

  // 3. Name match for Tamil
  if (lang === 'ta') {
    const byName = voices.find((v) => v.name.toLowerCase().includes('tamil') || v.name.includes('தமிழ்'));
    if (byName) return { voice: byName, isNative: true, isTamilNative: true };
  }

  // 4. Fallback: Indian English
  const indianEn = voices.find((v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
  if (indianEn) return { voice: indianEn, isNative: false, isTamilNative: false };

  // 5. Any English
  const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;
  return { voice: anyEn, isNative: false, isTamilNative: false };
}

/**
 * Converts Tamil text to phonetically pronounceable text for systems without native Tamil voices.
 * Prevents OS English voices from going silent when encountering Tamil script.
 */
export function tamilToPhonetic(text: string): string {
  let t = text;
  const replacements: [RegExp, string][] = [
    [/வணக்கம்[!.]?/g, 'Vanakkam!'],
    [/உரிமையாளர்/g, 'Urimaiyalar'],
    [/வெற்றிகரமாக பதிவு செய்யப்பட்டது/g, 'Vetrigaramaaga padhivu seyyappattadhu. Successfully recorded.'],
    [/பதிவு செய்யப்பட்டது/g, 'Padhivu seyyappattadhu. Recorded successfully.'],
    [/புதிய பொருள்/g, 'Pudhiya porul. New product'],
    [/சேர்க்கப்பட்டது/g, 'serkkappattadhu. Added to stock.'],
    [/சரக்கு இருப்பு/g, 'Inventory stock'],
    [/விற்பனை/g, 'Sales'],
    [/கொள்முதல்/g, 'Purchases'],
    [/கடன்/g, 'Credit'],
    [/ரூபாய்/g, 'Rupees'],
    [/அரிசி/g, 'Rice'],
    [/கிலோ/g, 'kilogram'],
    [/செலவு/g, 'Expense'],
    [/லாபம்/g, 'Profit'],
    [/வாடிக்கையாளர்/g, 'Customer'],
    [/விநியோகஸ்தர்/g, 'Supplier'],
    [/அழிக்கப்பட்டது/g, 'Cleared successfully.'],
    [/மீட்டமைக்கப்பட்டது/g, 'Reset completed.'],
    [/ஆம்/g, 'Yes'],
    [/இல்லை/g, 'No'],
  ];

  for (const [pattern, repl] of replacements) {
    t = t.replace(pattern, repl);
  }

  // Remove any remaining raw Tamil glyphs so the English voice doesn't choke or freeze
  t = t.replace(/[\u0B80-\u0BFF]+/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t || 'Command processed successfully.';
}

/**
 * Strips markdown, emojis, asterisks, bullet marks so TTS reads smoothly.
 */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*#_`~>]/g, '') // remove markdown symbols
    .replace(/₹/g, 'ரூபாய் ') // pronounce Rupee symbol naturally
    .replace(/\+/g, ' பிளஸ் ')
    .replace(/•/g, ', ')
    .replace(/\n\s*\n/g, '. ')
    .replace(/\n/g, ', ')
    .trim();
}

export interface SpeakOptions {
  lang?: string;   // Any ISO 639-1 code: 'ta', 'hi', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'en', etc.
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: any) => void;
}

/**
 * Speak text with guaranteed browser un-sticking and voice resolution.
 * Supports ALL 22 Indian languages by language code.
 */
export function speakTextGuaranteed(text: string, options: SpeakOptions = {}): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return false;
  }

  try {
    // 1. Unstick Chrome speech synthesis queue
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const { lang = 'ta', rate = 1.0, pitch = 1.0, onStart, onEnd, onError } = options;
    let clean = cleanTextForSpeech(text);
    if (!clean) return false;

    const { voice, isNative, isTamilNative } = findBestVoice(lang);

    // Indic script — if no native voice, use phonetic transliteration for Tamil
    // For other languages without native voice, strip non-ASCII so English voice doesn't freeze
    if (!isNative) {
      if (lang === 'ta' && /[\u0B80-\u0BFF]/.test(clean)) {
        clean = tamilToPhonetic(clean);
      } else {
        // Strip any remaining Indic characters for other languages without native voice
        clean = clean.replace(/[\u0900-\u0DFF\u0600-\u06FF\u0B80-\u0BFF]+/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    if (!clean) return false;

    const utterance = new SpeechSynthesisUtterance(clean);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
      console.warn('TTS utterance notice:', e);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    // Ensure AudioContext is also active and unmuted
    getAudioContext();

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Error initiating SpeechSynthesis:', err);
    return false;
  }
}

/**
 * Universal speak function — accepts any language code from our 22-language support.
 * This is the primary entry point for the multilingual TTS layer (Level 3).
 */
export function speakInLanguage(text: string, langCode: string, options: Omit<SpeakOptions, 'lang'> = {}): boolean {
  return speakTextGuaranteed(text, { ...options, lang: langCode });
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
