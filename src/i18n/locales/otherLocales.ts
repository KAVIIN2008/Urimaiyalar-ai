import { TranslationSchema } from '../types';
import { en } from './en';
import { hi } from './hi';
import { ta } from './ta';

type DeepPartial<T> = {
  [P in keyof T]?: Partial<T[P]>;
};

// Helper to create locale overlay based on base dictionary
function createLocaleOverlay(base: TranslationSchema, overrides: DeepPartial<TranslationSchema>): TranslationSchema {
  return {
    common: { ...base.common, ...(overrides.common as any) },
    buttons: { ...base.buttons, ...(overrides.buttons as any) },
    navigation: { ...base.navigation, ...(overrides.navigation as any) },
    landing: { ...base.landing, ...(overrides.landing as any) },
    auth: { ...base.auth, ...(overrides.auth as any) },
    dashboard: { ...base.dashboard, ...(overrides.dashboard as any) },
    sales: { ...base.sales, ...(overrides.sales as any) },
    inventory: { ...base.inventory, ...(overrides.inventory as any) },
    finance: { ...base.finance, ...(overrides.finance as any) },
    customers: { ...base.customers, ...(overrides.customers as any) },
    assistant: { ...base.assistant, ...(overrides.assistant as any) },
    schemes: { ...base.schemes, ...(overrides.schemes as any) },
    settings: { ...base.settings, ...(overrides.settings as any) },
  };
}

// Tanglish (Conversational Tamil + English Code-switching used widely in Tamil Nadu)
export const tanglish: TranslationSchema = createLocaleOverlay(ta, {
  common: {
    loading: 'Loading aaguthu...',
    retry: 'Marupadiyum Try pannunga',
    search: 'Thedunga',
    welcome: 'Vanakkam',
    save: 'Save pannu',
    cancel: 'Cancel pannu',
    delete: 'Delete pannu',
  },
  buttons: {
    save: 'Save pannu',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Puthusa Add pannu',
    print: 'Bill Print edukka',
    getStarted: 'Free-ah Start pannunga',
    speakVoice: 'Voice-la Pesunga',
  },
  navigation: {
    dashboard: 'Dashboard (முகப்பு)',
    sales: 'Sales (விற்பனை)',
    purchases: 'Purchases (கொள்முதல்)',
    inventory: 'Stock / Inventory',
    customers: 'Customers',
    credit: 'Kadan Ledger (கடன்)',
    expenses: 'Expenses (செலவுகள்)',
    assistant: 'AI Assistant',
    schemes: 'Govt Schemes & Subsidies',
  },
  dashboard: {
    title: 'Business Dashboard',
    kpiTodayRevenue: "Innaiku Total Sales",
    kpiTodayExpenses: "Innaiku Expenses",
    kpiNetProfit: "Net Profit (லாபம்)",
    actionNewSale: 'New Sale Add pannu',
    actionAddExpense: 'Expense Note pannu',
    actionVoiceCfo: 'Voice AI kitta Kelu',
  },
  assistant: {
    placeholder: 'Innaiku sales evlo? nu Tamil / Tanglish-la kelunga...',
    speechNotice: 'Voice assistant Tamil, Tanglish & English support pannum.',
  },
});

// Sanskrit (sa) - ಶಾಸ್ತ್ರೀಯ ಭಾಷೆ / शास्त्रीय भाषा
export const sa: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'फलकम् (Dashboard)',
    sales: 'विक्रयः (Sales)',
    purchases: 'क्रयणम् (Purchases)',
    inventory: 'वस्तुसञ्चयः (Inventory)',
    customers: 'ग्राहकाः (Customers)',
    credit: 'ऋणलेख्यम् (Credit)',
    expenses: 'व्ययाः (Expenses)',
    schemes: 'शासकीययोजनाः (Govt Schemes)',
    assistant: 'एআই सहायकः',
    settings: 'विन्यासाः (Settings)',
  },
  buttons: {
    save: 'रक्षतु (Save)',
    cancel: 'निरस्यतु (Cancel)',
    search: 'अन्विष्यतु (Search)',
    submit: 'समर्पयतु (Submit)',
  },
});

// Nepali (ne) - नेपाली
export const ne: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'ड्यासबોર્ડ (Dashboard)',
    sales: 'बिक्री (Sales)',
    purchases: 'खਰੀਦ (Purchases)',
    inventory: 'मौజ్दात (Inventory)',
    customers: 'ग्राहकहरू (Customers)',
    credit: 'उधारो खाता (Credit)',
    expenses: 'खर्चहरू (Expenses)',
    schemes: 'सरकारी योजनाहरू (Schemes)',
    assistant: 'एआई सहायक',
    settings: 'सेटिङहरू (Settings)',
  },
  buttons: {
    save: 'बચત गर्नुहोस्',
    cancel: 'रद्द गर्नुहोस्',
    add: 'नयाँ थप्नुहोस्',
    print: 'बिल छाप्नुहोस्',
  },
});

// Konkani (kok) - कोंकणी
export const kok: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'डॅशबोर्ड',
    sales: 'विक्री',
    purchases: 'खरेदी',
    inventory: 'मालसाठो',
    customers: 'गिरायिक',
    credit: 'उधारी खातें',
    expenses: 'खर्च',
    schemes: 'सरकारी येवजण्यो',
    assistant: 'एआई सहाय्यक',
    settings: 'मांडಾವळ',
  },
});

// Maithili (mai) - मैथिली
export const mai: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'डैशबोर्ड',
    sales: 'बिक्री',
    purchases: 'खरीद',
    inventory: 'मालसामान',
    customers: 'ग्राहक',
    credit: 'बाकी खाता',
    expenses: 'खर्चा',
    schemes: 'सरकारी योजना',
    assistant: 'एआई सहायक',
    settings: 'सेटिंग्स',
  },
});

// Dogri (doi) - डोगरी
export const doi: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'डैशबोर्ड',
    sales: 'बिक्री',
    purchases: 'खरीदारी',
    inventory: 'स्टाक',
    customers: 'गाहक',
    credit: 'उधार खाता',
    expenses: 'खर्चे',
    schemes: 'सरकारी स्कीमां',
    assistant: 'एआई सहायक',
    settings: 'सेटिंगां',
  },
});

// Kashmiri (ks) - کٲشُر (Perso-Arabic script, RTL direction)
export const ks: TranslationSchema = createLocaleOverlay(en, {
  navigation: {
    dashboard: 'ڈیش بورڈ',
    sales: 'فروخت (سیلز)',
    purchases: 'خریداری',
    inventory: 'سامان (اسٹاک)',
    customers: 'گاہک',
    credit: 'ادھار کھاتہ',
    expenses: 'خرچہ',
    schemes: 'سرکاری اسکیمیں',
    assistant: 'اے آئی اسسٹنٹ',
    settings: 'ترتیبات',
  },
  buttons: {
    save: 'محفوظ',
    cancel: 'منسوخ',
    search: 'تلاش',
  },
});

// Sindhi (sd) - سنڌي (Perso-Arabic script, RTL direction)
export const sd: TranslationSchema = createLocaleOverlay(en, {
  navigation: {
    dashboard: 'ڊيش بورڊ',
    sales: 'وڪرو (Sales)',
    purchases: 'خريداري',
    inventory: 'اسٽاڪ (Inventory)',
    customers: 'گراهڪ',
    credit: 'اوڌر کاتو',
    expenses: 'خرچ',
    schemes: 'سرڪاري اسڪيمون',
    assistant: 'اي آءِ اسسٽنٽ',
    settings: 'سيٽنگس',
  },
});

// Bodo (brx) - बड़ो
export const brx: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'डैशबोर्ड',
    sales: 'फाननाय (Sales)',
    purchases: 'बायनाय (Purchases)',
    inventory: 'दन्थुम (Stock)',
    customers: 'बायग्राफोर (Customers)',
    credit: 'बाखि (Credit)',
    expenses: 'खरसा (Expenses)',
    schemes: 'सोरखारि बिथांखिफੋਰ (Schemes)',
    assistant: 'AI हेफाजाबगिरि',
    settings: 'सेटिंगफोर',
  },
});

// Santali (sat) - ᱥᱟᱱᱛᱟᱲᱤ
export const sat: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'ᱰᱮᱥᱵᱳᱨᱰ (Dashboard)',
    sales: 'ᱟᱹᱠᱷᱨᱤᱧ (Sales)',
    purchases: 'ᱠᱤᱨᱤᱧ (Purchases)',
    inventory: 'ᱡᱚᱢᱟ (Inventory)',
    customers: 'ᱠᱤᱨᱤᱧᱤᱭᱟᱹ (Customers)',
    credit: 'ᱵᱟᱹᱠᱤ (Credit)',
    expenses: 'ᱠᱷᱚᱨᱚᱪ (Expenses)',
    schemes: 'ᱥᱚᱨᱠᱟᱨᱤ ᱡᱚᱡᱚᱱᱟ (Schemes)',
    assistant: 'AI ᱜᱚᱲᱚᱭᱤᱡ',
    settings: 'ᱥᱟᱡᱟᱣ (Settings)',
  },
});

// Manipuri (mni) - মৈতৈলোন্
export const mni: TranslationSchema = createLocaleOverlay(hi, {
  navigation: {
    dashboard: 'ড্যাশবোর্ড',
    sales: 'য়োলবা (Sales)',
    purchases: 'লৈবা (Purchases)',
    inventory: 'পোৎচৈ (Inventory)',
    customers: 'লৈবশিং (Customers)',
    credit: 'পোৎশেন (Credit)',
    expenses: 'চাদিং (Expenses)',
    schemes: 'লৈঙাক্কী স্কিমশিং (Schemes)',
    assistant: 'AI মতেং পাংবা',
    settings: 'সেটিংস',
  },
});
