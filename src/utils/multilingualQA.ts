// ============================================================================
// URIMAIYALAR OS — 22 CONSTITUTIONAL INDIAN LANGUAGES Q&A KNOWLEDGE BASE
// Covers all 22 Eighth Schedule languages + English + Tanglish
// ============================================================================

export interface LanguageQAPair {
  question: string;
  category: 'sales' | 'inventory' | 'customer' | 'finance' | 'expense' | 'action';
  intent: string;
  sampleAnswer: string;
}

export interface LanguageDataset {
  code: string;
  name: string;
  nativeName: string;
  quickQuestions: string[];
  qaPairs: LanguageQAPair[];
}

export const MULTILINGUAL_22_QA: Record<string, LanguageDataset> = {
  // 1. TAMIL (தமிழ்)
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    quickQuestions: [
      'இன்னைக்கு விற்பனை எவ்வளவு?',
      'இன்னைக்கு ₹250 sales add பண்ணு',
      'ரமேஷுக்கு கடன் பாக்கி எவ்வளவு?',
      'Maggi சரக்கு இருப்பு எவ்வளவு?',
      'இந்த மாதம் நிகர லாபம் என்ன?',
      '₹100 டீ செலவு பதிவு பண்ணு',
    ],
    qaPairs: [
      {
        question: 'இன்னைக்கு விற்பனை எவ்வளவு?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'இன்றைய விற்பனை: ₹12,830 (15 பில்கள்). அதிகபட்சமாக பொன்னி அரிசி மற்றும் துவரம் பருப்பு விற்பனையாகியுள்ளது.',
      },
      {
        question: 'இன்னைக்கு ₹250 sales add பண்ணு',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'விற்பனை வெற்றிகரமாக சேர்க்கப்பட்டது: Invoice #INV-AI-250 (தொகை: ₹250). தரவுத்தளத்தில் பதிவாகியுள்ளது.',
      },
      {
        question: 'ரமேஷுக்கு கடன் பாக்கி எவ்வளவு?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'வாடிக்கையாளர் ரமேஷ் நிலுவைத் தொகை: ₹1,500. கடன் வரம்பு: ₹5,000. நினைவூட்டல் அனுப்பவா?',
      },
      {
        question: 'Maggi சரக்கு இருப்பு எவ்வளவு?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'Maggi 2-Minute Noodles இருப்பு: 30 பாக்கெட்டுகள் உள்ளன. குறைந்தபட்ச அளவு: 10.',
      },
      {
        question: 'இந்த மாதம் நிகர லாபம் என்ன?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'நடப்பு மாத வருவாய்: ₹1,45,000, அடக்கவிலை: ₹98,000, செலவுகள்: ₹14,500. நிகர லாபம்: ₹32,500.',
      },
      {
        question: '₹100 டீ செலவு பதிவு பண்ணு',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'செலவு பதிவு செய்யப்பட்டது: ₹100 (டீ & சிற்றுண்டி). கணக்கு லெட்ஜரில் சேர்க்கப்பட்டது.',
      },
    ],
  },

  // 2. HINDI (हिन्दी)
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    quickQuestions: [
      'आज की बिक्री कितनी है?',
      'आज ₹250 की बिक्री जोड़ो',
      'रमेश का उधार कितना बाकी है?',
      'मैगी का स्टॉक कितना है?',
      'इस महीने का मुनाफा कितना हुआ?',
      '₹100 चाय का खर्च जोड़ो',
    ],
    qaPairs: [
      {
        question: 'आज की बिक्री कितनी है?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'आज की कुल बिक्री: ₹12,830 (15 बिल)। सबसे ज्यादा चावल और दाल की बिक्री हुई है।',
      },
      {
        question: 'आज ₹250 की बिक्री जोड़ो',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'बिक्री सफलतापूर्वक दर्ज की गई: ₹250 (Invoice #INV-AI-250)। डेटाबेस में सुरक्षित सहेज लिया गया है।',
      },
      {
        question: 'रमेश का उधार कितना बाकी है?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ग्राहक रमेश का बकाया उधार: ₹1,500। क्या आप WhatsApp भुगतान रिमाइंडर भेजना चाहते हैं?',
      },
      {
        question: 'मैगी का स्टॉक कितना है?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'मैगी नूडल्स का वर्तमान स्टॉक: 30 पैकेट। न्यूनतम स्टॉक स्तर 10 है।',
      },
      {
        question: 'इस महीने का मुनाफा कितना हुआ?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'इस महीने का शुद्ध लाभ (Net Profit): ₹32,500। कुल राजस्व ₹1,45,000 और खर्च ₹14,500 हैं।',
      },
      {
        question: '₹100 चाय का खर्च जोड़ो',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'खर्च सफलतापूर्वक जोड़ा गया: ₹100 (चाय व जलपान)। खाता बही अपडेट हो गई।',
      },
    ],
  },

  // 3. TELUGU (తెలుగు)
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    quickQuestions: [
      'ఈరోజు అమ్మకాలు ఎంత?',
      'ఈరోజు ₹250 అమ్మకం జోడించు',
      'రమేష్ అప్పు ఎంత ఉంది?',
      'మ్యాగీ స్టాక్ ఎంత ఉంది?',
      'ఈ నెల నికర లాభం ఎంత?',
      '₹100 టీ ఖర్చు నమోదు చేయి',
    ],
    qaPairs: [
      {
        question: 'ఈరోజు అమ్మకాలు ఎంత?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'ఈరోజు మొత్తం అమ్మకాలు: ₹12,830 (15 బిల్లులు). బియ్యం మరియు పప్పులు అత్యధికంగా అమ్ముడయ్యాయి.',
      },
      {
        question: 'ఈరోజు ₹250 అమ్మకం జోడించు',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'అమ్మకం విజయవంతంగా నమోదైంది: ₹250 (ఇన్వాయిస్ #INV-AI-250). డేటాబేస్‌లో సేవ్ చేయబడింది.',
      },
      {
        question: 'రమేష్ అప్పు ఎంత ఉంది?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'రమేష్ బాకీ ఉన్న మొత్తం: ₹1,500. క్రెడిట్ పరిమితి: ₹5,000. వాట్సాప్ రిమైండర్ పంపించాలా?',
      },
      {
        question: 'మ్యాగీ స్టాక్ ఎంత ఉంది?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'మ్యాగీ నూడుల్స్ ప్రస్తుత స్టాక్: 30 ప్యాకెట్లు. రీ-ఆర్డర్ లెవెల్: 10.',
      },
      {
        question: 'ఈ నెల నికర లాభం ఎంత?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ఈ నెల నికర లాభం: ₹32,500. మొత్తం ఆదాయం: ₹1,45,000 మరియు ఖర్చులు: ₹14,500.',
      },
      {
        question: '₹100 టీ ఖర్చు నమోదు చేయి',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'ఖర్చు నమోదైంది: ₹100 (టీ & టిఫిన్). లెడ్జర్‌లో చేర్చబడింది.',
      },
    ],
  },

  // 4. KANNADA (ಕನ್ನಡ)
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    quickQuestions: [
      'ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?',
      'ಇಂದು ₹250 ಮಾರಾಟ ಸೇರಿಸಿ',
      'ರಮೇಶ್ ಬಾಕಿ ಹಣ ಎಷ್ಟು?',
      'ಮ್ಯಾಗಿ ದಾಸ್ತಾನು ಎಷ್ಟು ಇದೆ?',
      'ಈ ತಿಂಗಳ ಲಾಭ ಎಷ್ಟು?',
      '₹100 ಟೀ ಖರ್ಚು ಸೇರಿಸಿ',
    ],
    qaPairs: [
      {
        question: 'ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ ಎಷ್ಟು?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ: ₹12,830 (15 ಬಿಲ್ಲುಗಳು). ಅಕ್ಕಿ ಮತ್ತು ಬೇಳೆ ಅತಿ ಹೆಚ್ಚು ಮಾರಾಟವಾಗಿದೆ.',
      },
      {
        question: 'ಇಂದು ₹250 ಮಾರಾಟ ಸೇರಿಸಿ',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'ಮಾರಾಟ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ: ₹250 (ಇನ್‌ವಾಯ್ಸ್ #INV-AI-250). ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ನವೀಕರಿಸಲಾಗಿದೆ.',
      },
      {
        question: 'ರಮೇಶ್ ಬಾಕಿ ಹಣ ಎಷ್ಟು?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ಗ್ರಾಹಕ ರಮೇಶ್ ಅವರ ಬಾಕಿ ಮೊತ್ತ: ₹1,500. ವಾಟ್ಸಾಪ್ ರಿಮೈಂಡರ್ ಕಳುಹಿಸಬೇಕೆ?',
      },
      {
        question: 'ಮ್ಯಾಗಿ ದಾಸ್ತಾನು ಎಷ್ಟು ಇದೆ?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'ಮ್ಯಾಗಿ ನೂಡಲ್ಸ್ ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು: 30 ಪ್ಯಾಕೆಟ್‌ಗಳು ಲಭ್ಯವಿದೆ.',
      },
      {
        question: 'ಈ ತಿಂಗಳ ಲಾಭ ಎಷ್ಟು?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ಈ ತಿಂಗಳ ನಿವ್ವಳ ಲಾಭ: ₹32,500. ಒಟ್ಟು ವಹಿವಾಟು: ₹1,45,000.',
      },
      {
        question: '₹100 ಟೀ ಖರ್ಚು ಸೇರಿಸಿ',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'ಖರ್ಚು ದಾಖಲಾಗಿದೆ: ₹100 (ಟೀ ಮತ್ತು ಉಪಾಹಾರ). ಲೆಡ್ಜರ್ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.',
      },
    ],
  },

  // 5. MALAYALAM (മലയാളം)
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    quickQuestions: [
      'ഇന്നത്തെ വിൽപ്പന എത്രയാണ്?',
      'ഇന്ന് ₹250 വിൽപ്പന ചേർക്കുക',
      'രമേഷിന്റെ കുടിശ്ശിക എത്ര?',
      'മാഗി സ്റ്റോക്ക് എത്രയുണ്ട്?',
      'ഈ മാസത്തെ ലാഭം എത്ര?',
      '₹100 ചായ ചിലവ് രേഖപ്പെടുത്തുക',
    ],
    qaPairs: [
      {
        question: 'ഇന്നത്തെ വിൽപ്പന എത്രയാണ്?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'ഇന്നത്തെ മൊത്തം വിൽപ്പന: ₹12,830 (15 ബില്ലുകൾ). അരിയും പരിപ്പുമാണ് കൂടുതൽ വിറ്റഴിഞ്ഞത്.',
      },
      {
        question: 'ഇന്ന് ₹250 വിൽപ്പന ചേർക്കുക',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'വിൽപ്പന രേഖപ്പെടുത്തി: ₹250 (ഇൻവോയ്സ് #INV-AI-250). ഡാറ്റാബേസിൽ വിജയകരമായി ചേർത്തു.',
      },
      {
        question: 'രമേഷിന്റെ കുടിശ്ശിക എത്ര?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'രമേഷിന്റെ ബാക്കി കുടിശ്ശിക: ₹1,500. വാട്സാപ്പ് ഓർമ്മപ്പെടുത്തൽ അയക്കണോ?',
      },
      {
        question: 'മാഗി സ്റ്റോക്ക് എത്രയുണ്ട്?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'മാഗി നൂഡിൽസ് സ്റ്റോക്ക്: 30 പാക്കറ്റുകൾ ബാക്കിയുണ്ട്.',
      },
      {
        question: 'ഈ മാസത്തെ ലാഭം എത്ര?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ഈ മാസത്തെ അറ്റാദായം (Net Profit): ₹32,500.',
      },
      {
        question: '₹100 ചായ ചിലവ് രേഖപ്പെടുത്തുക',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'ചിലവ് വിജയകരമായി ചേർത്തു: ₹100 (ചായയും പലഹാരവും).',
      },
    ],
  },

  // 6. BENGALI (বাংলা)
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    quickQuestions: [
      'আজকের মোট বিক্রি কত?',
      'আজ ₹250 বিক্রি যোগ করো',
      'রমেশের বাকি টাকা কত?',
      'ম্যাগি স্টক কত আছে?',
      'এই মাসের লাভ কত?',
      '₹100 চা খরচ যোগ করো',
    ],
    qaPairs: [
      {
        question: 'আজকের মোট বিক্রি কত?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'আজকের মোট বিক্রি: ₹12,830 (15টি বিল)। চাল ও ডাল সর্বাধিক বিক্রি হয়েছে।',
      },
      {
        question: 'আজ ₹250 বিক্রি যোগ করো',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'বিক্রি সফলভাবে যুক্ত করা হয়েছে: ₹250 (Invoice #INV-AI-250)। ডাটাবেসে সেভ হয়েছে।',
      },
      {
        question: 'রমেশের বাকি টাকা কত?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'গ্রাহক রমেশের বকেয়া ঋণ: ₹1,500। হোয়াটসঅ্যাপ রিমাইন্ডার পাঠাবেন?',
      },
      {
        question: 'ম্যাগি স্টক কত আছে?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'ম্যাগি নুডুলসের বর্তমান স্টক: 30 প্যাকেট। ন্যূনতম সীমা 10।',
      },
      {
        question: 'এই মাসের লাভ কত?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'চলতি মাসের মোট লাভ (Net Profit): ₹32,500।',
      },
      {
        question: '₹100 চা খরচ যোগ করো',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'খরচ রেকর্ড হয়েছে: ₹100 (চা ও জলখাবার)। খতিয়ান আপডেট হয়েছে।',
      },
    ],
  },

  // 7. MARATHI (मराठी)
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    quickQuestions: [
      'आजची विक्री किती आहे?',
      'आज ₹250 ची विक्री जोडा',
      'रमेशची उधारी किती बाकी आहे?',
      'मॅगीचा साठा किती आहे?',
      'या महिन्याचा नफा किती?',
      '₹100 चहाचा खर्च नोंदवा',
    ],
    qaPairs: [
      {
        question: 'आजची विक्री किती आहे?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'आजची एकूण विक्री: ₹12,830 (15 बिले). तांदूळ आणि डाळीची सर्वाधिक विक्री झाली.',
      },
      {
        question: 'आज ₹250 ची विक्री जोडा',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'विक्री यशस्वीरीत्या नोंदवली गेली: ₹250 (Invoice #INV-AI-250).',
      },
      {
        question: 'रमेशची उधारी किती बाकी आहे?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ग्राहक रमेशची थकबाकी: ₹1,500. WhatsApp पेमेंट रिमाइंडर पाठवायचा का?',
      },
      {
        question: 'मॅगीचा साठा किती आहे?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'मॅगी नूडल्सचा उपलब्ध साठा: 30 पाकिटे.',
      },
      {
        question: 'या महिन्याचा नफा किती?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'या महिन्याचा निव्वळ नफा (Net Profit): ₹32,500.',
      },
      {
        question: '₹100 चहाचा खर्च नोंदवा',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'खर्च नोंदवला गेला: ₹100 (चहा व नाश्ता).',
      },
    ],
  },

  // 8. GUJARATI (ગુજરાતી)
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    quickQuestions: [
      'આજનું વેચાણ કેટલું છે?',
      'આજે ₹250 નું વેચાણ ઉમેરો',
      'રમેશનું ઉધાર કેટલું બાકી છે?',
      'મેગીનો સ્ટોક કેટલો છે?',
      'આ મહિનાનો નફો કેટલો થયો?',
      '₹100 ચાનો ખર્ચ ઉમેરો',
    ],
    qaPairs: [
      {
        question: 'આજનું વેચાણ કેટલું છે?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'આજનું કુલ વેચાણ: ₹12,830 (15 બિલ). ચોખા અને દાળનું સૌથી વધુ વેચાણ થયું.',
      },
      {
        question: 'આજે ₹250 નું વેચાણ ઉમેરો',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'વેચાણ સફળતાપૂર્વક ઉમેરાયું: ₹250 (Invoice #INV-AI-250).',
      },
      {
        question: 'રમેશનું ઉધાર કેટલું બાકી છે?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ગ્રાહક રમેશનું બાકી ઉધાર: ₹1,500. WhatsApp રીમાઇન્ડર મોકલવું છે?',
      },
      {
        question: 'મેગીનો સ્ટોક કેટલો છે?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'મેગી નૂડલ્સનો હાલનો સ્ટોક: 30 પેકેટ.',
      },
      {
        question: 'આ મહિનાનો નફો કેટલો થયો?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ચાલુ મહિનાનો ચોખ્ખો નફો: ₹32,500.',
      },
      {
        question: '₹100 ચાનો ખર્ચ ઉમેરો',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'ખર્ચ નોંધાયો: ₹100 (ચા અને નાસ્તો).',
      },
    ],
  },

  // 9. PUNJABI (ਪੰਜਾਬੀ)
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    quickQuestions: [
      'ਅੱਜ ਦੀ ਵਿਕਰੀ ਕਿੰਨੀ ਹੈ?',
      'ਅੱਜ ₹250 ਦੀ ਵਿਕਰੀ ਜੋੜੋ',
      'ਰਮੇਸ਼ ਦਾ ਉਧਾਰ ਕਿੰਨਾ ਬਾਕੀ ਹੈ?',
      'ਮੈਗੀ ਦਾ ਸਟਾਕ ਕਿੰਨਾ ਹੈ?',
      'ਇਸ ਮਹੀਨੇ ਦਾ ਮੁਨਾਫ਼ਾ ਕਿੰਨਾ ਹੈ?',
      '₹100 ਚਾਹ ਦਾ ਖ਼ਰਚਾ ਜੋੜੋ',
    ],
    qaPairs: [
      {
        question: 'ਅੱਜ ਦੀ ਵਿਕਰੀ ਕਿੰਨੀ ਹੈ?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'ਅੱਜ ਦੀ ਕੁੱਲ ਵਿਕਰੀ: ₹12,830 (15 ਬਿੱਲ)। ਚੌਲ ਅਤੇ ਦਾਲਾਂ ਸਭ ਤੋਂ ਵੱਧ ਵਿਕੀਆਂ ਹਨ।',
      },
      {
        question: 'ਅੱਜ ₹250 ਦੀ ਵਿਕਰੀ ਜੋੜੋ',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'ਵਿਕਰੀ ਸਫ਼ਲਤਾਪੂਰਵਕ ਦਰਜ ਕੀਤੀ ਗਈ: ₹250 (ਇਨਵੌਇਸ #INV-AI-250)।',
      },
      {
        question: 'ਰਮੇਸ਼ ਦਾ ਉਧਾਰ ਕਿੰਨਾ ਬਾਕੀ ਹੈ?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ਗਾਹਕ ਰਮੇਸ਼ ਦਾ ਬਕਾਇਆ: ₹1,500। ਵਟਸਐਪ ਰੀਮਾਈਂਡਰ ਭੇਜਣਾ ਹੈ?',
      },
      {
        question: 'ਮੈਗੀ ਦਾ ਸਟਾਕ ਕਿੰਨਾ ਹੈ?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'ਮੈਗੀ ਨੂਡਲਜ਼ ਦਾ ਮੌਜੂਦਾ ਸਟਾਕ: 30 ਪੈਕੇਟ।',
      },
      {
        question: 'ਇਸ ਮਹੀਨੇ ਦਾ ਮੁਨਾਫ਼ਾ ਕਿੰਨਾ ਹੈ?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ਇਸ ਮਹੀਨੇ ਦਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ: ₹32,500।',
      },
      {
        question: '₹100 ਚਾਹ ਦਾ ਖ਼ਰਚਾ ਜੋੜੋ',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'ਖ਼ਰਚਾ ਦਰਜ ਕੀਤਾ ਗਿਆ: ₹100 (ਚਾਹ ਅਤੇ ਨਾਸ਼ਤਾ)।',
      },
    ],
  },

  // 10. ODIA (ଓଡ଼ିଆ)
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    quickQuestions: [
      'ଆଜିର ବିକ୍ରି କେତେ ହେଲା?',
      'ଆଜି ₹250 ବିକ୍ରି ଯୋଡନ୍ତୁ',
      'ରମେଶଙ୍କ ବାକି ଟଙ୍କା କେତେ?',
      'ମ୍ୟାଗି ଷ୍ଟକ୍ କେତେ ଅଛି?',
      'ଏହି ମାସର ଲାଭ କେତେ?',
      '₹100 ଚା’ ଖର୍ଚ୍ଚ ଲେଖନ୍ତୁ',
    ],
    qaPairs: [
      {
        question: 'ଆଜିର ବିକ୍ରି କେତେ ହେଲା?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'ଆଜିର ମୋଟ ବିକ୍ରି: ₹12,830 (15 ଟି ବିଲ୍)।',
      },
      {
        question: 'ଆଜି ₹250 ବିକ୍ରି ଯୋଡନ୍ତୁ',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'ବିକ୍ରି ସଫଳତାର ସହ ଯୋଡାଗଲା: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'ରମେଶଙ୍କ ବାକି ଟଙ୍କା କେତେ?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ରମେଶଙ୍କ ବକେୟା ଉଧାର: ₹1,500।',
      },
      {
        question: 'ମ୍ୟାଗି ଷ୍ଟକ୍ କେତେ ଅଛି?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'ମ୍ୟାଗି ନୁଡଲ୍ସର ବର୍ତ୍ତମାନ ଷ୍ଟକ୍: 30 ପ୍ୟାକେଟ୍।',
      },
      {
        question: 'ଏହି ମାସର ଲାଭ କେତେ?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ଏହି ମାସର ନିଟ୍ ଲାଭ: ₹32,500।',
      },
      {
        question: '₹100 ଚା’ ଖର୍ଚ୍ଚ ଲେଖନ୍ତୁ',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'ଖର୍ଚ୍ଚ ଯୋଡାଗଲା: ₹100 (ଚା’ ଓ ଜଳଖିଆ)।',
      },
    ],
  },

  // 11. ASSAMESE (অসমীয়া)
  as: {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    quickQuestions: [
      'আজিৰ বিক্ৰী কিমান হ’ল?',
      'আজি ₹250 বিক্ৰী যোগ কৰক',
      'ৰমেশৰ বাকী ধন কিমান?',
      'মেগীৰ মজুত কিমান আছে?',
      'এই মাহৰ লাভ কিমান?',
      '₹100 চাহৰ খৰচ যোগ কৰক',
    ],
    qaPairs: [
      {
        question: 'আজিৰ বিক্ৰী কিমান হ’ল?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'আজিৰ মুঠ বিক্ৰী: ₹12,830 (15 খন বিল)।',
      },
      {
        question: 'আজি ₹250 বিক্ৰী যোগ কৰক',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'বিক্ৰী সফলতাৰে যোগ কৰা হ’ল: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'ৰমেশৰ বাকী ধন কিমান?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'গ্ৰাহক ৰমেশৰ বাকী থকা ধন: ₹1,500।',
      },
      {
        question: 'মেগীৰ মজুত কিমান আছে?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'মেগী নুডলছৰ বৰ্তমান মজুত: 30 পেকেট।',
      },
      {
        question: 'এই মাহৰ লাভ কিমান?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'এই মাহৰ মুঠ লাভ: ₹32,500।',
      },
      {
        question: '₹100 চাহৰ খৰচ যোগ কৰক',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'খৰচ লিপিবদ্ধ হ’ল: ₹100 (চাহ আৰু জলপান)।',
      },
    ],
  },

  // 12. URDU (اردو)
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    quickQuestions: [
      'آج کی فروخت کتنی ہے؟',
      'آج 250 روپے کی فروخت جوڑیں',
      'رمیش کا ادھار کتنا باقی ہے؟',
      'میگی کا اسٹاک کتنا ہے؟',
      'اس مہینے کا خالص منافع کتنا ہوا؟',
      '100 روپے چائے کا خرچ درج کریں',
    ],
    qaPairs: [
      {
        question: 'آج کی فروخت کتنی ہے؟',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'آج کی کل فروخت: 12,830 روپے (15 بل)۔',
      },
      {
        question: 'آج 250 روپے کی فروخت جوڑیں',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'فروخت کامیابی سے درج ہوگئی: 250 روپے (Invoice #INV-AI-250)۔',
      },
      {
        question: 'رمیش کا ادھار کتنا باقی ہے؟',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'رمیش کا بقایا ادھار: 1,500 روپے۔ کیا واٹس ایپ پر یاد دہانی بھیجی جائے؟',
      },
      {
        question: 'میگی کا اسٹاک کتنا ہے؟',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'میگی نوڈلز کا موجودہ اسٹاک: 30 پیکٹ۔',
      },
      {
        question: 'اس مہینے کا خالص منافع کتنا ہوا؟',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'اس مہینے کا خالص منافع: 32,500 روپے۔',
      },
      {
        question: '100 روپے چائے کا خرچ درج کریں',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'خرچ درج ہوگیا: 100 روپے (چائے اور ناشتہ)۔',
      },
    ],
  },

  // 13. SANSKRIT (संस्कृतम्)
  sa: {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    quickQuestions: [
      'अद्यतनं विक्रयधनं कियत्?',
      'अद्य ₹250 विक्रयम् योजयतु',
      'रमेशस्य ऋणशेषं कियत्?',
      'मैगी वस्तुनः सञ्चयः कियत् अस्ति?',
      'अस्मिन् मासे लाभः कति?',
      '₹100 चायव्ययं योजयतु',
    ],
    qaPairs: [
      {
        question: 'अद्यतनं विक्रयधनं कियत्?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'अद्यतनं कुलविक्रयधनम्: ₹12,830 (15 देयकानि)।',
      },
      {
        question: 'अद्य ₹250 विक्रयम् योजयतु',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'विक्रयः सफ़लतया योजितः: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'रमेशस्य ऋणशेषं कियत्?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'रमेशस्य अवशिष्टं ऋणम्: ₹1,500।',
      },
      {
        question: 'मैगी वस्तुनः सञ्चयः कियत् अस्ति?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'मैगी वस्तुनः वर्तमानसञ्चयः: 30 संपुटाः।',
      },
      {
        question: 'अस्मिन् मासे लाभः कति?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'अस्य मासस्य शुद्धलाभः: ₹32,500।',
      },
      {
        question: '₹100 चायव्ययं योजयतु',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'व्ययः योजितः: ₹100 (चायपानव्ययः)।',
      },
    ],
  },

  // 14. NEPALI (नेपाली)
  ne: {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    quickQuestions: [
      'आजको बिक्री कति भयो?',
      'आज ₹250 को बिक्री थप्नुहोस्',
      'रमेशको बाँकी उधारो कति छ?',
      'म्यागीको मौज्दात कति छ?',
      'यो महिनाको नाफा कति भयो?',
      '₹100 चिया खर्च जोड्नुहोस्',
    ],
    qaPairs: [
      {
        question: 'आजको बिक्री कति भयो?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'आजको कुल बिक्री: ₹12,830 (15 बिल)।',
      },
      {
        question: 'आज ₹250 को बिक्री थप्नुहोस्',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'बिक्री सफलतापूर्वक थपियो: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'रमेशको बाँकी उधारो कति छ?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'रमेशको बाँकी उधारो: ₹1,500।',
      },
      {
        question: 'म्यागीको मौज्दात कति छ?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'म्यागी चाउचाउको मौज्दात: 30 प्याकेट।',
      },
      {
        question: 'यो महिनाको नाफा कति भयो?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'यस महिनाको खुद नाफा: ₹32,500।',
      },
      {
        question: '₹100 चिया खर्च जोड्नुहोस्',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'खर्च थपियो: ₹100 (चिया तथा खाजा)।',
      },
    ],
  },

  // 15. KONKANI (कोंकणी)
  kok: {
    code: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    quickQuestions: [
      'आयची विक्री कितली जाली?',
      'आयज ₹250 ची विक्री जोडात',
      'रमेशाचें उधारी कितलें आसा?',
      'मॅगीचो स्टॉक कितलो आसा?',
      'ह्या म्हयन्याचो फायदो कितलो?',
      '₹100 चहाचो खर्च बरोवचो',
    ],
    qaPairs: [
      {
        question: 'आयची विक्री कितली जाली?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'आयची पुराय विक्री: ₹12,830 (15 बिलां)।',
      },
      {
        question: 'आयज ₹250 ची विक्री जोडात',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'विक्री यशस्वीपणे जोडली: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'रमेशाचें उधारी कितलें आसा?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'रमेशाचें बांकी उधारी: ₹1,500।',
      },
      {
        question: 'मॅगीचो स्टॉक कितलो आसा?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'मॅगीचो स्टॉक: 30 पाकिटां उपलब्ध आसात।',
      },
      {
        question: 'ह्या म्हयन्याचो फायदो कितलो?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ह्या म्हयन्याचो निव्वळ नफ़ो: ₹32,500।',
      },
      {
        question: '₹100 चहाचो खर्च बरोवचो',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'खर्च नोंद जालो: ₹100 (चहा आनी खाण)।',
      },
    ],
  },

  // 16. MAITHILI (मैथिली)
  mai: {
    code: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    quickQuestions: [
      'आइ कतेक बिक्री भेल?',
      'आइ ₹250 केर बिक्री जोड़ू',
      'रमेशक बाकी कतेक छै?',
      'मैगीक स्टॉक कतेक अछि?',
      'एहि महिना मुनाफा कतेक भेल?',
      '₹100 चाय केर खर्च जोड़ू',
    ],
    qaPairs: [
      {
        question: 'आइ कतेक बिक्री भेल?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'आइ कुल बिक्री: ₹12,830 (15 टा बिल)।',
      },
      {
        question: 'आइ ₹250 केर बिक्री जोड़ू',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'बिक्री सफलता पूर्वक जोड़ल गेल: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'रमेशक बाकी कतेक छै?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ग्राहक रमेशक बाकी उधार: ₹1,500।',
      },
      {
        question: 'मैगीक स्टॉक कतेक अछि?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'मैगीक वर्तमान स्टॉक: 30 पैकेट।',
      },
      {
        question: 'एहि महिना मुनाफा कतेक भेल?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'एहि महिना कुल मुनाफा: ₹32,500।',
      },
      {
        question: '₹100 चाय केर खर्च जोड़ू',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'खर्च जोड़ल गेल: ₹100 (चाय नाश्ता)।',
      },
    ],
  },

  // 17. KASHMIRI (کٲشُر)
  ks: {
    code: 'ks',
    name: 'Kashmiri',
    nativeName: 'کٲشُر',
    quickQuestions: [
      'از کٔتیا کٔنُن گۆو؟',
      'از 250 رۄپیہ کٔنُن جوڑِو',
      'رمیشس کٔتیا قرض چھُ باقی؟',
      'میگی کٔتیا چھُ اسٹاک؟',
      'امِس ریتھس منٛز کٔتیا منافع گۆو؟',
      '100 رۄپیہ چائے خَرٕچ لؠکِھو',
    ],
    qaPairs: [
      {
        question: 'از کٔتیا کٔنُن گۆو?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'از کُل کٔنُن: 12,830 رۄپیہ (15 بل)۔',
      },
      {
        question: 'از 250 رۄپیہ کٔنُن جوڑِو',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'فروخت درج گۆو: 250 رۄپیہ (Invoice #INV-AI-250)۔',
      },
      {
        question: 'رمیشس کٔتیا قرض چھُ باقی?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'رمیشس چھُ بقایا: 1,500 رۄپیہ।',
      },
      {
        question: 'میگی کٔتیا چھُ اسٹاک?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'میگی اسٹاک: 30 پیکٹ باقی।',
      },
      {
        question: 'امِس ریتھس منٛز کٔتیا منافع گۆو?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'امِس ریتھس خالص منافع: 32,500 رۄپیہ।',
      },
      {
        question: '100 رۄپیہ چائے خَرٕچ لؠکِھو',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'خَرٕچ درج گۆو: 100 رۄپیہ (چائے)۔',
      },
    ],
  },

  // 18. DOGRI (डोगरी)
  doi: {
    code: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    quickQuestions: [
      'अज्जै दी बिक्री कूनी ऐ?',
      'अज्ज ₹250 दी बिक्री जोड़ो',
      'रमेश दा उधार कूंना ऐ?',
      'मैगी दा स्टॉक कूंना ऐ?',
      'इस महीने दा मुनाफा कूंना होआ?',
      '₹100 चा दा खर्चा लिखो',
    ],
    qaPairs: [
      {
        question: 'अज्जै दी बिक्री कूनी ऐ?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'अज्जै दी कुल बिक्री: ₹12,830 (15 बिल)।',
      },
      {
        question: 'अज्ज ₹250 दी बिक्री जोड़ो',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'बिक्री सफलता कन्ने जोड़ी गेई: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'रमेश दा उधार कूंना ऐ?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'रमेश दा बाकी उधार: ₹1,500।',
      },
      {
        question: 'मैगी दा स्टॉक कूंना ऐ?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'मैगी नूडल्स दा मौजूदा स्टॉक: 30 पैकेट।',
      },
      {
        question: 'इस महीने दा मुनाफा कूंना होआ?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'इस महीने दा मुनाफा: ₹32,500।',
      },
      {
        question: '₹100 चा दा खर्चा लिखो',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'खर्चा दर्ज कीता गेआ: ₹100 (चा-नाश्ता)।',
      },
    ],
  },

  // 19. MANIPURI (মৈতৈলোন্)
  mni: {
    code: 'mni',
    name: 'Manipuri',
    nativeName: 'মৈতৈলোন্',
    quickQuestions: [
      'ঙসি য়োল্লিবসি কয়া য়ৌরে?',
      'ঙসি ₹250 য়োল্লিবদা হাপচিল্লু',
      'রমেশকী লমন কয়া লৈরি?',
      'মেগী ষ্টোক কয়া লৈরি?',
      'থা অসিগী কান্নবা কয়া ফংলে?',
      '₹100 চা চাফীগী চাদিং হাপচিল্লু',
    ],
    qaPairs: [
      {
        question: 'ঙসি য়োল্লিবসি কয়া য়ৌরে?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'ঙসিগী অপুনবা য়োল্লিবসি: ₹12,830 (বিল 15)।',
      },
      {
        question: 'ঙসি ₹250 য়োল্লিবদা হাপচিল্লু',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'য়োল্লিবসি মপুং ফানা হাপচিনখ্রে: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'রমেশকী লমন কয়া লৈরি?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'রমেশকী পোত্থোক লমন: ₹1,500।',
      },
      {
        question: 'মেগী ষ্টোক কয়া লৈরি?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'মেগী নুদল্স ষ্টোক: পেকেট 30 লৈরি।',
      },
      {
        question: 'থা অসিগী কান্নবা কয়া ফংলে?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'থা অসিগী অপুনবা কান্নবা: ₹32,500।',
      },
      {
        question: '₹100 চা চাফীগী চাদিং হাপচিল্লু',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'চাদিং হাপচিনখ্রে: ₹100 (চা)।',
      },
    ],
  },

  // 20. BODO (बड़ो)
  brx: {
    code: 'brx',
    name: 'Bodo',
    nativeName: 'बड़ो',
    quickQuestions: [
      'दिनैनि फाननाय बेसेबां जाखो?',
      'दिनै ₹250 फाननाय दाजाब',
      'रमेशनाव बेसेबां धार दं?',
      'मेगिनी स्टक बेसेबां दं?',
      'दाननि मुलाम्फा बेसेबां जाखो?',
      '₹100 साहा खरस दाजाब',
    ],
    qaPairs: [
      {
        question: 'दिनैनि फाननाय बेसेबां जाखो?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'दिनैनि गासै फाननाय: ₹12,830 (15 बिल)।',
      },
      {
        question: 'दिनै ₹250 फाननाय दाजाब',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'फाननाय दाजाबनाय जाबाय: ₹250 (Invoice #INV-AI-250)।',
      },
      {
        question: 'रमेशनाव बेसेबां धार दं?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'रमेशनाव गासै धार: ₹1,500।',
      },
      {
        question: 'मेगिनी स्टक बेसेबां दं?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'मेगिनी स्टक: 30 पिकेट दं।',
      },
      {
        question: 'दाननि मुलाम्फा बेसेबां जाखो?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'दाननि गासै मुलाम्फा: ₹32,500।',
      },
      {
        question: '₹100 साहा खरस दाजाब',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'खरस दाजाबनाय जाबाय: ₹100 (साहा)।',
      },
    ],
  },

  // 21. SANTALI (ᱥᱟᱱᱛᱟᱲᱤ)
  sat: {
    code: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    quickQuestions: [
      'ᱛᱮᱦᱮᱧᱟᱜ ᱟᱹᱠᱷᱨᱤᱧ ᱛᱤᱱᱟᱹᱜ?',
      'ᱛᱮᱦᱮᱧ ₹250 ᱟᱹᱠᱷᱨᱤᱧ ᱥᱮᱞᱮᱫᱽ ᱢᱮ',
      'ᱨᱚᱢᱮᱥᱟᱜ ᱵᱟᱹᱠᱤ ᱛᱤᱱᱟᱹᱜ ᱢᱮᱱᱟᱜᱼᱟ?',
      'ᱢᱮᱜᱤ ᱥᱴᱚᱠ ᱛᱤᱱᱟᱹᱜ ᱢᱮᱱᱟᱜᱼᱟ?',
      'ᱱᱚᱣᱟ ᱪᱟᱸᱫᱚ ᱨᱮᱭᱟᱜ ᱞᱟᱵᱷ ᱛᱤᱱᱟᱹᱜ?',
      '₹100 ᱪᱟ ᱠᱷᱚᱨᱚᱪ ᱚᱞ ᱢᱮ',
    ],
    qaPairs: [
      {
        question: 'ᱛᱮᱦᱮᱧᱟᱜ ᱟᱹᱠᱷᱨᱤᱧ ᱛᱤᱱᱟᱹᱜ?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'ᱛᱮᱦᱮᱧᱟᱜ ᱞᱮᱠᱷᱟ ᱟᱹᱠᱷᱨᱤᱧ: ₹12,830 (15 ᱵᱤᱞ)᱾',
      },
      {
        question: 'ᱛᱮᱦᱮᱧ ₹250 ᱟᱹᱠᱷᱨᱤᱧ ᱥᱮᱞᱮᱫᱽ ᱢᱮ',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'ᱟᱹᱠᱷᱨᱤᱧ ᱥᱮᱞᱮᱫᱽ ᱮᱱᱟ: ₹250 (Invoice #INV-AI-250)᱾',
      },
      {
        question: 'ᱨᱚᱢᱮᱥᱟᱜ ᱵᱟᱹᱠᱤ ᱛᱤᱱᱟᱹᱜ ᱢᱮᱱᱟᱜᱼᱟ?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'ᱨᱚᱢᱮᱥᱟᱜ ᱵᱟᱹᱠᱤ ᱫᱷᱟᱨ: ₹1,500᱾',
      },
      {
        question: 'ᱢᱮᱜᱤ ᱥᱴᱚᱠ ᱛᱤᱱᱟᱹᱜ ᱢᱮᱱᱟᱜᱼᱟ?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'ᱢᱮᱜᱤ ᱱᱩᱰᱚᱞᱥ ᱥᱴᱚᱠ: 30 ᱯᱮᱠᱮᱴ ᱢᱮᱱᱟᱜᱼᱟ᱾',
      },
      {
        question: 'ᱱᱚᱣᱟ ᱪᱟᱸᱫᱚ ᱨᱮᱭᱟᱜ ᱞᱟᱵᱷ ᱛᱤᱱᱟᱹᱜ?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'ᱱᱚᱣᱟ ᱪᱟᱸᱫᱚ ᱨᱮᱭᱟᱜ ᱞᱟᱵᱷ: ₹32,500᱾',
      },
      {
        question: '₹100 ᱪᱟ ᱠᱷᱚᱨᱚᱪ ᱚᱞ ᱢᱮ',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'ᱠᱷᱚᱨᱚᱪ ᱚᱞ ᱮᱱᱟ: ₹100 (ᱪᱟ)᱾',
      },
    ],
  },

  // 22. SINDHI (سنڌي / सिंधी)
  sd: {
    code: 'sd',
    name: 'Sindhi',
    nativeName: 'سنڌي / सिंधी',
    quickQuestions: [
      'اڄوڪي وڪرو ڪيتري آهي؟',
      'اڄ 250 روپيا وڪرو شامل ڪريو',
      'رميش جو اڌارو ڪيترو باقي آهي؟',
      'ميگي جو اسٽاڪ ڪيترو آهي؟',
      'هن مهيني جو نفعو ڪيترو ٿيو؟',
      '100 روپيا چانهه جو خرچ لکو',
    ],
    qaPairs: [
      {
        question: 'اڄوڪي وڪرو ڪيتري آهي؟',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'اڄ جي ڪل وڪرو: 12,830 روپيا (15 بل)۔',
      },
      {
        question: 'اڄ 250 روپيا وڪرو شامل ڪريو',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'وڪرو ڪاميابي سان داخل ٿي ويو: 250 روپيا (Invoice #INV-AI-250)۔',
      },
      {
        question: 'رميش جو اڌارو ڪيترو باقي آهي؟',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'رميش جو باقي اڌارو: 1,500 روپيا۔',
      },
      {
        question: 'ميگي جو اسٽاڪ ڪيترو آهي؟',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'ميگي نوڊلز جو اسٽاڪ: 30 پيڪٽ۔',
      },
      {
        question: 'هن مهيني جو نفعو ڪيترو ٿيو؟',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'هن مهيني جو ڪل نفعو: 32,500 روپيا۔',
      },
      {
        question: '100 روپيا چانهه جو خرچ لکو',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'خرچ داخل ڪيو ويو: 100 روپيا (چانهه)۔',
      },
    ],
  },

  // 23. ENGLISH (English)
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    quickQuestions: [
      'What are today sales and orders?',
      'Add sale of ₹250 for today',
      'How much does Ramesh owe?',
      'What is the current stock of Maggi?',
      'What is this month net profit?',
      'Record expense of ₹100 for tea',
    ],
    qaPairs: [
      {
        question: 'What are today sales and orders?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'Today Total Sales: ₹12,830 across 15 bills. Top selling items are Ponni Rice and Toor Dal.',
      },
      {
        question: 'Add sale of ₹250 for today',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'Sale recorded successfully: ₹250 (Invoice #INV-AI-250). Saved to business database.',
      },
      {
        question: 'How much does Ramesh owe?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'Customer Ramesh outstanding balance: ₹1,500. Credit limit is ₹5,000. Send WhatsApp reminder?',
      },
      {
        question: 'What is the current stock of Maggi?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'Maggi 2-Minute Noodles stock: 30 packets available. Minimum threshold: 10.',
      },
      {
        question: 'What is this month net profit?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'Current Month Net Profit: ₹32,500. Revenue: ₹1,45,000, COGS: ₹98,000, Expenses: ₹14,500.',
      },
      {
        question: 'Record expense of ₹100 for tea',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'Expense recorded: ₹100 for "Tea & Refreshments". Ledger updated.',
      },
    ],
  },

  // 24. TANGLISH (Tanglish)
  tanglish: {
    code: 'tanglish',
    name: 'Tanglish',
    nativeName: 'Tanglish (தமிழ் + Eng)',
    quickQuestions: [
      'Innaiku sales evvalavu aachu?',
      'Innaiku ₹250 sales add pannu',
      'Ramesh balance evvalavu irukku?',
      'Maggi stock evvalavu irukku?',
      'Indha month profit evvalavu?',
      '₹100 tea expense add pannu',
    ],
    qaPairs: [
      {
        question: 'Innaiku sales evvalavu aachu?',
        category: 'sales',
        intent: 'get_daily_sales',
        sampleAnswer: 'Innaiku total sales: ₹12,830 (15 bills). Ponni Rice and Toor Dal top selling items.',
      },
      {
        question: 'Innaiku ₹250 sales add pannu',
        category: 'action',
        intent: 'ADD_SALE',
        sampleAnswer: 'Sales successfully add aayiduchu: ₹250 (Invoice #INV-AI-250). Database-la update aachu.',
      },
      {
        question: 'Ramesh balance evvalavu irukku?',
        category: 'customer',
        intent: 'customer_dues',
        sampleAnswer: 'Ramesh balance: ₹1,500. Credit limit ₹5,000. WhatsApp payment reminder anupalaama?',
      },
      {
        question: 'Maggi stock evvalavu irukku?',
        category: 'inventory',
        intent: 'check_stock',
        sampleAnswer: 'Maggi 2-Minute Noodles stock: 30 packets irukku. Minimum stock: 10.',
      },
      {
        question: 'Indha month profit evvalavu?',
        category: 'finance',
        intent: 'get_net_profit',
        sampleAnswer: 'Indha month net profit: ₹32,500. Revenue: ₹1,45,000, Expenses: ₹14,500.',
      },
      {
        question: '₹100 tea expense add pannu',
        category: 'expense',
        intent: 'ADD_EXPENSE',
        sampleAnswer: 'Expense record aayiduchu: ₹100 for Tea & Refreshments.',
      },
    ],
  },
};

export function getQuickQuestionsForLanguage(langCode: string): string[] {
  const dataset = MULTILINGUAL_22_QA[langCode] || MULTILINGUAL_22_QA['ta'] || MULTILINGUAL_22_QA['en'];
  return dataset.quickQuestions;
}

export function getSampleAnswerForQuery(query: string, langCode: string): string | null {
  const dataset = MULTILINGUAL_22_QA[langCode] || MULTILINGUAL_22_QA['en'];
  const normalized = query.trim().toLowerCase();
  const match = dataset.qaPairs.find((pair) => {
    const q = pair.question.toLowerCase();
    return q === normalized || normalized.includes(q) || q.includes(normalized);
  });
  return match ? match.sampleAnswer : null;
}
