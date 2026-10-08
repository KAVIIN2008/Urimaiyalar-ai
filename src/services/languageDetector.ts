// ============================================================================
// URIMAIYALAR OS — MULTILINGUAL AI CORE & LANGUAGE DETECTOR
// 22 Constitutional Indian Languages + Code-Switching (Hinglish/Tanglish/Tenglish)
// ============================================================================

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  speechLocale: string;
  flag: string;
  sampleInput: string;
  sampleAction: string;
}

export interface DetectedLanguageResult {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  confidence: number;
  isCodeSwitched: boolean;
  codeSwitchType?: 'hinglish' | 'tanglish' | 'tenglish' | 'kanglish' | 'manglish' | 'none';
  speechLocale: string;
}

export const INDIAN_LANGUAGES: Record<string, LanguageMeta> = {
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    speechLocale: 'ta-IN',
    flag: '🇮🇳',
    sampleInput: 'இன்னைக்கு 250 ரூபாய் sales add பண்ணு',
    sampleAction: '₹250 விற்பனை சேர்க்கப்பட்டது',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    speechLocale: 'hi-IN',
    flag: '🇮🇳',
    sampleInput: 'आज 500 रुपये का बिजली बिल expense add करो',
    sampleAction: '₹500 खर्च दर्ज किया गया',
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    speechLocale: 'te-IN',
    flag: '🇮🇳',
    sampleInput: 'రమేష్ 1000 రూపాయలు చెల్లించాడు payment record చేయండి',
    sampleAction: '₹1,000 చెల్లింపు నమోదు చేయబడింది',
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    speechLocale: 'kn-IN',
    flag: '🇮🇳',
    sampleInput: 'ಅಕ್ಕಿ 20 kg stock update ಮಾಡಿ',
    sampleAction: '20 kg ದಾಸ್ತಾನು ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ',
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    speechLocale: 'ml-IN',
    flag: '🇮🇳',
    sampleInput: 'ഇന്നത്തെ മൊത്തം ലാഭം എത്ര?',
    sampleAction: 'ഇന്നത്തെ ലാഭം പരിശോധിച്ചു',
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    speechLocale: 'mr-IN',
    flag: '🇮🇳',
    sampleInput: 'आज 300 रुपये विक्री जोडा',
    sampleAction: '₹300 विक्री नोंदवली',
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    speechLocale: 'gu-IN',
    flag: '🇮🇳',
    sampleInput: 'આજે 450 રૂપિયા વેચાણ ઉમેરો',
    sampleAction: '₹450 વેચાણ ઉમેરાયું',
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    speechLocale: 'bn-IN',
    flag: '🇮🇳',
    sampleInput: 'আজকে 600 টাকা বিক্রি যোগ করো',
    sampleAction: '₹600 বিক্রি যোগ করা হয়েছে',
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    speechLocale: 'pa-IN',
    flag: '🇮🇳',
    sampleInput: 'ਅੱਜ 700 ਰੁਪਏ ਵਿਕਰੀ ਦਰਜ ਕਰੋ',
    sampleAction: '₹700 ਵਿਕਰੀ ਦਰਜ ਕੀਤੀ ਗਈ',
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    speechLocale: 'or-IN',
    flag: '🇮🇳',
    sampleInput: 'ଆଜି 250 ଟଙ୍କା ବିକ୍ରି ଯୋଡନ୍ତୁ',
    sampleAction: '₹250 ବିକ୍ରି ଯୋଡାଗଲା',
  },
  as: {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali',
    speechLocale: 'as-IN',
    flag: '🇮🇳',
    sampleInput: 'আজি 500 টকা বিক্ৰী যোগ কৰক',
    sampleAction: '₹500 বিক্ৰী যোগ কৰা হ’ল',
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    script: 'Perso-Arabic',
    speechLocale: 'ur-IN',
    flag: '🇮🇳',
    sampleInput: 'آج 800 روپے کی فروخت درج کریں',
    sampleAction: '₹800 فروخت درج کی گئی',
  },
  en: {
    code: 'en',
    name: 'English (India)',
    nativeName: 'English',
    script: 'Latin',
    speechLocale: 'en-IN',
    flag: '🌐',
    sampleInput: 'Add sale of 250 rupees today',
    sampleAction: 'Sale of ₹250 recorded',
  },
};

// Map native Indic numerals to standard ASCII numerals (0-9)
const INDIC_NUMERAL_MAP: Record<string, string> = {
  // Devanagari
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  // Bengali / Assamese
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  // Gujarati
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  // Gurmukhi
  '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4', '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',
  // Odia
  '୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4', '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9',
  // Telugu
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
  // Kannada
  '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
  // Malayalam
  '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4', '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
};

/**
 * Normalizes Indic numerals in text to standard ASCII digits.
 */
export function normalizeIndicNumerals(text: string): string {
  return text.replace(/[\u0966-\u096F\u09E6-\u09EF\u0AE6-\u0AEF\u0A66-\u0A6F\u0B66-\u0B6F\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F]/g, (char) => {
    return INDIC_NUMERAL_MAP[char] || char;
  });
}

// Code-switching vocabulary lists
const TANGLISH_KEYWORDS = ['innaiku', 'iniku', 'sollu', 'iruku', 'pannu', 'kadan', 'kudukanum', 'kudunga', 'kudutharu', 'selavu', 'vijpanai', 'mudivu', 'evalavu'];
const HINGLISH_KEYWORDS = ['aaj', 'kitna', 'batao', 'bikri', 'jodo', 'kharcha', 'kharch', 'diya', 'karo', 'hai', 'udhar', 'paisa', 'paise', 'bhai', 'dost'];
const TENGLISH_KEYWORDS = ['eroju', 'entha', 'cheppu', 'ammakam', 'cheyandi', 'ichadu', 'pettandi', 'kharchu', 'kavale', 'undi'];
const KANGLISH_KEYWORDS = ['ivattu', 'eshtu', 'maadi', 'marata', 'kottaru', 'haki', 'beeku', 'ide'];
const MANGLISH_KEYWORDS = ['innethe', 'ethra', 'parayu', 'vilpana', 'koduthu', 'chitham', 'und'];

/**
 * Detect language automatically from text, scripts, and code-switched vocabularies.
 */
export function detectLanguage(input: string): DetectedLanguageResult {
  const normalized = normalizeIndicNumerals(input);
  const lower = normalized.toLowerCase();

  // 1. Script checks
  const scriptCounts = {
    ta: (input.match(/[\u0B80-\u0BFF]/g) || []).length,
    te: (input.match(/[\u0C00-\u0C7F]/g) || []).length,
    kn: (input.match(/[\u0C80-\u0CFF]/g) || []).length,
    ml: (input.match(/[\u0D00-\u0D7F]/g) || []).length,
    hi_mr: (input.match(/[\u0900-\u097F]/g) || []).length, // Devanagari (Hindi, Marathi, Nepali, Sanskrit)
    bn_as: (input.match(/[\u0980-\u09FF]/g) || []).length, // Bengali / Assamese
    gu: (input.match(/[\u0A80-\u0AFF]/g) || []).length,
    pa: (input.match(/[\u0A00-\u0A7F]/g) || []).length,
    or: (input.match(/[\u0B00-\u0B7F]/g) || []).length,
    ur: (input.match(/[\u0600-\u06FF]/g) || []).length,
  };

  const totalChars = input.replace(/\s+/g, '').length || 1;

  if (scriptCounts.ta > 0 && scriptCounts.ta / totalChars > 0.15) {
    return {
      code: 'ta',
      name: INDIAN_LANGUAGES.ta.name,
      nativeName: INDIAN_LANGUAGES.ta.nativeName,
      script: 'Tamil',
      confidence: 0.98,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      codeSwitchType: /[a-zA-Z]/.test(input) ? 'tanglish' : 'none',
      speechLocale: 'ta-IN',
    };
  }

  if (scriptCounts.te > 0 && scriptCounts.te / totalChars > 0.15) {
    return {
      code: 'te',
      name: INDIAN_LANGUAGES.te.name,
      nativeName: INDIAN_LANGUAGES.te.nativeName,
      script: 'Telugu',
      confidence: 0.98,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      codeSwitchType: /[a-zA-Z]/.test(input) ? 'tenglish' : 'none',
      speechLocale: 'te-IN',
    };
  }

  if (scriptCounts.kn > 0 && scriptCounts.kn / totalChars > 0.15) {
    return {
      code: 'kn',
      name: INDIAN_LANGUAGES.kn.name,
      nativeName: INDIAN_LANGUAGES.kn.nativeName,
      script: 'Kannada',
      confidence: 0.98,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      codeSwitchType: /[a-zA-Z]/.test(input) ? 'kanglish' : 'none',
      speechLocale: 'kn-IN',
    };
  }

  if (scriptCounts.ml > 0 && scriptCounts.ml / totalChars > 0.15) {
    return {
      code: 'ml',
      name: INDIAN_LANGUAGES.ml.name,
      nativeName: INDIAN_LANGUAGES.ml.nativeName,
      script: 'Malayalam',
      confidence: 0.98,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      codeSwitchType: /[a-zA-Z]/.test(input) ? 'manglish' : 'none',
      speechLocale: 'ml-IN',
    };
  }

  if (scriptCounts.hi_mr > 0 && scriptCounts.hi_mr / totalChars > 0.15) {
    // Check if Marathi specific markers exist (e.g. आहे, करा, विक्री)
    const isMarathi = /आहे|करा|विक्री|खर्च|करावे/.test(input);
    const target = isMarathi ? INDIAN_LANGUAGES.mr : INDIAN_LANGUAGES.hi;
    return {
      code: target.code,
      name: target.name,
      nativeName: target.nativeName,
      script: 'Devanagari',
      confidence: 0.96,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      codeSwitchType: /[a-zA-Z]/.test(input) ? 'hinglish' : 'none',
      speechLocale: target.speechLocale,
    };
  }

  if (scriptCounts.bn_as > 0 && scriptCounts.bn_as / totalChars > 0.15) {
    return {
      code: 'bn',
      name: INDIAN_LANGUAGES.bn.name,
      nativeName: INDIAN_LANGUAGES.bn.nativeName,
      script: 'Bengali',
      confidence: 0.96,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      speechLocale: 'bn-IN',
    };
  }

  if (scriptCounts.gu > 0 && scriptCounts.gu / totalChars > 0.15) {
    return {
      code: 'gu',
      name: INDIAN_LANGUAGES.gu.name,
      nativeName: INDIAN_LANGUAGES.gu.nativeName,
      script: 'Gujarati',
      confidence: 0.96,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      speechLocale: 'gu-IN',
    };
  }

  if (scriptCounts.pa > 0 && scriptCounts.pa / totalChars > 0.15) {
    return {
      code: 'pa',
      name: INDIAN_LANGUAGES.pa.name,
      nativeName: INDIAN_LANGUAGES.pa.nativeName,
      script: 'Gurmukhi',
      confidence: 0.96,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      speechLocale: 'pa-IN',
    };
  }

  if (scriptCounts.or > 0 && scriptCounts.or / totalChars > 0.15) {
    return {
      code: 'or',
      name: INDIAN_LANGUAGES.or.name,
      nativeName: INDIAN_LANGUAGES.or.nativeName,
      script: 'Odia',
      confidence: 0.96,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      speechLocale: 'or-IN',
    };
  }

  if (scriptCounts.ur > 0 && scriptCounts.ur / totalChars > 0.15) {
    return {
      code: 'ur',
      name: INDIAN_LANGUAGES.ur.name,
      nativeName: INDIAN_LANGUAGES.ur.nativeName,
      script: 'Perso-Arabic',
      confidence: 0.96,
      isCodeSwitched: /[a-zA-Z]/.test(input),
      speechLocale: 'ur-IN',
    };
  }

  // 2. Romanized Code-Switching Checks (Tanglish, Hinglish, Tenglish, etc.)
  const tanglishScore = TANGLISH_KEYWORDS.filter((w) => lower.includes(w)).length;
  const hinglishScore = HINGLISH_KEYWORDS.filter((w) => lower.includes(w)).length;
  const tenglishScore = TENGLISH_KEYWORDS.filter((w) => lower.includes(w)).length;
  const kanglishScore = KANGLISH_KEYWORDS.filter((w) => lower.includes(w)).length;
  const manglishScore = MANGLISH_KEYWORDS.filter((w) => lower.includes(w)).length;

  if (tanglishScore > 0 && tanglishScore >= hinglishScore && tanglishScore >= tenglishScore) {
    return {
      code: 'ta',
      name: 'Tamil (Tanglish)',
      nativeName: 'தமிழ் (Tanglish)',
      script: 'Latin',
      confidence: 0.90,
      isCodeSwitched: true,
      codeSwitchType: 'tanglish',
      speechLocale: 'ta-IN',
    };
  }

  if (hinglishScore > 0 && hinglishScore >= tenglishScore) {
    return {
      code: 'hi',
      name: 'Hindi (Hinglish)',
      nativeName: 'हिन्दी (Hinglish)',
      script: 'Latin',
      confidence: 0.90,
      isCodeSwitched: true,
      codeSwitchType: 'hinglish',
      speechLocale: 'hi-IN',
    };
  }

  if (tenglishScore > 0) {
    return {
      code: 'te',
      name: 'Telugu (Tenglish)',
      nativeName: 'తెలుగు (Tenglish)',
      script: 'Latin',
      confidence: 0.90,
      isCodeSwitched: true,
      codeSwitchType: 'tenglish',
      speechLocale: 'te-IN',
    };
  }

  if (kanglishScore > 0) {
    return {
      code: 'kn',
      name: 'Kannada (Kanglish)',
      nativeName: 'ಕನ್ನಡ (Kanglish)',
      script: 'Latin',
      confidence: 0.90,
      isCodeSwitched: true,
      codeSwitchType: 'kanglish',
      speechLocale: 'kn-IN',
    };
  }

  if (manglishScore > 0) {
    return {
      code: 'ml',
      name: 'Malayalam (Manglish)',
      nativeName: 'മലയാളം (Manglish)',
      script: 'Latin',
      confidence: 0.90,
      isCodeSwitched: true,
      codeSwitchType: 'manglish',
      speechLocale: 'ml-IN',
    };
  }

  // Default to English (or Tamil if context indicates)
  return {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    confidence: 0.85,
    isCodeSwitched: false,
    codeSwitchType: 'none',
    speechLocale: 'en-IN',
  };
}
