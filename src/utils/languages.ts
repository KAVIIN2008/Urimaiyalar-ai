// ============================================================================
// URIMAIYALAR OS — 22 CONSTITUTIONAL INDIAN LANGUAGES REGISTRY
// Complete coverage of the 8th Schedule of the Constitution of India
// + English (Default/Base) & Tanglish (Code-switching)
// ============================================================================

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  speechLocale: string;
  region: string;
  direction: 'ltr' | 'rtl';
  enabled: boolean;
  popular?: boolean;
}

export const INDIAN_LANGUAGES_22: IndianLanguage[] = [
  // Top / Core Business Languages
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', speechLocale: 'en-IN', region: 'Pan-India / Business', direction: 'ltr', enabled: true, popular: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', speechLocale: 'ta-IN', region: 'Tamil Nadu, Puducherry', direction: 'ltr', enabled: true, popular: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', speechLocale: 'hi-IN', region: 'North / Central India', direction: 'ltr', enabled: true, popular: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', speechLocale: 'te-IN', region: 'Andhra Pradesh, Telangana', direction: 'ltr', enabled: true, popular: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', speechLocale: 'kn-IN', region: 'Karnataka', direction: 'ltr', enabled: true, popular: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', speechLocale: 'ml-IN', region: 'Kerala', direction: 'ltr', enabled: true, popular: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', speechLocale: 'mr-IN', region: 'Maharashtra', direction: 'ltr', enabled: true, popular: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', speechLocale: 'bn-IN', region: 'West Bengal, Tripura', direction: 'ltr', enabled: true, popular: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', speechLocale: 'gu-IN', region: 'Gujarat', direction: 'ltr', enabled: true, popular: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', speechLocale: 'pa-IN', region: 'Punjab', direction: 'ltr', enabled: true, popular: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', speechLocale: 'or-IN', region: 'Odisha', direction: 'ltr', enabled: true },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese', speechLocale: 'as-IN', region: 'Assam', direction: 'ltr', enabled: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Perso-Arabic', speechLocale: 'ur-IN', region: 'Pan-India, Telangana, UP', direction: 'rtl', enabled: true, popular: true },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari', speechLocale: 'kok-IN', region: 'Goa, Coastal Karnataka', direction: 'ltr', enabled: true },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari', speechLocale: 'mai-IN', region: 'Bihar, Jharkhand', direction: 'ltr', enabled: true },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari', speechLocale: 'ne-NP', region: 'Sikkim, West Bengal', direction: 'ltr', enabled: true },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari', speechLocale: 'sa-IN', region: 'Classical / Pan-India', direction: 'ltr', enabled: true },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', script: 'Perso-Arabic', speechLocale: 'ks-IN', region: 'Jammu & Kashmir', direction: 'rtl', enabled: true },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي / सिंधी', script: 'Perso-Arabic/Devanagari', speechLocale: 'sd-IN', region: 'Gujarat, Maharashtra', direction: 'rtl', enabled: true },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari', speechLocale: 'doi-IN', region: 'Jammu & Kashmir', direction: 'ltr', enabled: true },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', script: 'Meitei Mayek', speechLocale: 'mni-IN', region: 'Manipur', direction: 'ltr', enabled: true },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', script: 'Devanagari', speechLocale: 'brx-IN', region: 'Assam', direction: 'ltr', enabled: true },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki', speechLocale: 'sat-IN', region: 'Jharkhand, Odisha', direction: 'ltr', enabled: true },
  { code: 'tanglish', name: 'Tanglish', nativeName: 'Tanglish (தமிழ் + Eng)', script: 'Latin/Tamil', speechLocale: 'ta-IN', region: 'Tamil Nadu / Conversational', direction: 'ltr', enabled: true, popular: true },
];

export const INDIAN_LANGUAGES = INDIAN_LANGUAGES_22;

export function getLanguageInfo(code: string): IndianLanguage {
  const normalized = (code || '').toLowerCase().trim();
  const found = INDIAN_LANGUAGES_22.find((l) => l.code === normalized);
  if (found) return found;
  if (normalized.startsWith('ta')) return INDIAN_LANGUAGES_22.find((l) => l.code === 'ta')!;
  if (normalized.startsWith('en')) return INDIAN_LANGUAGES_22.find((l) => l.code === 'en')!;
  return {
    code: normalized || 'en',
    name: (normalized || 'EN').toUpperCase(),
    nativeName: (normalized || 'EN').toUpperCase(),
    script: 'Custom',
    speechLocale: 'en-IN',
    region: 'India',
    direction: isRtlLanguage(normalized) ? 'rtl' : 'ltr',
    enabled: true,
  };
}

export function isRtlLanguage(code: string): boolean {
  const normalized = (code || '').toLowerCase().trim();
  return normalized === 'ur' || normalized === 'ks' || normalized === 'sd';
}
