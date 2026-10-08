// ============================================================================
// URIMAIYALAR OS — MULTILINGUAL STT (Speech-to-Text) ENGINE
// Supports 22 Constitutional Indian Languages + Code-switching
// Level 2 of the AI Architecture: Voice -> STT -> Intent -> Action
// ============================================================================

export interface LanguageSTTConfig {
  code: string;          // ISO 639-1 code
  name: string;          // English name
  nativeName: string;    // Native script name
  speechLocale: string;  // BCP-47 locale for Web Speech API
  flag: string;
  keywords: string[];    // Sample voice command keywords
  ttsLang: string;       // TTS language tag for SpeechSynthesis
  romanized?: string;    // Romanized name for display
}

export const MULTILINGUAL_STT_CONFIG: Record<string, LanguageSTTConfig> = {
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechLocale: 'ta-IN', flag: 'IN', ttsLang: 'ta-IN', romanized: 'Tamil', keywords: ['sales','expense','add','stock'] },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLocale: 'hi-IN', flag: 'IN', ttsLang: 'hi-IN', romanized: 'Hindi', keywords: ['sales','add','jodo','kharcha'] },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLocale: 'te-IN', flag: 'IN', ttsLang: 'te-IN', romanized: 'Telugu', keywords: ['sales','add','stock'] },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechLocale: 'kn-IN', flag: 'IN', ttsLang: 'kn-IN', romanized: 'Kannada', keywords: ['sales','add','stock'] },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechLocale: 'ml-IN', flag: 'IN', ttsLang: 'ml-IN', romanized: 'Malayalam', keywords: ['sales','add','stock'] },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechLocale: 'bn-IN', flag: 'IN', ttsLang: 'bn-IN', romanized: 'Bengali', keywords: ['bikriy','add','stock'] },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLocale: 'mr-IN', flag: 'IN', ttsLang: 'mr-IN', romanized: 'Marathi', keywords: ['vikri','add','stock'] },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechLocale: 'gu-IN', flag: 'IN', ttsLang: 'gu-IN', romanized: 'Gujarati', keywords: ['vechan','add','stock'] },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechLocale: 'pa-IN', flag: 'IN', ttsLang: 'pa-IN', romanized: 'Punjabi', keywords: ['vikri','add','stock'] },
  or: { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speechLocale: 'or-IN', flag: 'IN', ttsLang: 'or-IN', romanized: 'Odia', keywords: ['bikray','add'] },
  as: { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', speechLocale: 'as-IN', flag: 'IN', ttsLang: 'as-IN', romanized: 'Assamese', keywords: ['bikri','add'] },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', speechLocale: 'ur-IN', flag: 'IN', ttsLang: 'ur-IN', romanized: 'Urdu', keywords: ['faroukht','add'] },
  ne: { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', speechLocale: 'ne-NP', flag: 'IN', ttsLang: 'ne-NP', romanized: 'Nepali', keywords: ['bikri','add'] },
  sa: { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', speechLocale: 'sa-IN', flag: 'IN', ttsLang: 'sa-IN', romanized: 'Sanskrit', keywords: ['add'] },
  en: { code: 'en', name: 'English', nativeName: 'English', speechLocale: 'en-IN', flag: 'IN', ttsLang: 'en-IN', romanized: 'English', keywords: ['add','sale','expense','stock','payment','customer'] },
};

export const PRIMARY_STT_LANGUAGES = ['ta', 'hi', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'en'];

export interface VoiceSessionConfig {
  primaryLocale: string;
  fallbackLocale: string;
  languageCode: string;
  languageName: string;
  nativeName: string;
}

export function getVoiceSessionConfig(langCode: string): VoiceSessionConfig {
  const config = MULTILINGUAL_STT_CONFIG[langCode] || MULTILINGUAL_STT_CONFIG['en'];
  return {
    primaryLocale: config.speechLocale,
    fallbackLocale: 'en-IN',
    languageCode: config.code,
    languageName: config.name,
    nativeName: config.nativeName,
  };
}

export function detectVoiceLanguageFromText(text: string): string | null {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or';
  if (/[\u0600-\u06FF]/.test(text)) return 'ur';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return null;
}

export function buildSpeechRecognitionConfig(langCode: string) {
  const cfg = MULTILINGUAL_STT_CONFIG[langCode] || MULTILINGUAL_STT_CONFIG['en'];
  return { lang: cfg.speechLocale, continuous: true, interimResults: true, maxAlternatives: 3 };
}

export const VOICE_LANGUAGE_PICKER = PRIMARY_STT_LANGUAGES.map((code) => {
  const cfg = MULTILINGUAL_STT_CONFIG[code];
  return { code, label: cfg.nativeName, sublabel: cfg.name, locale: cfg.speechLocale };
});
