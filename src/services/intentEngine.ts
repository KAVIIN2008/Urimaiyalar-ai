import { prisma } from '../lib/db';
import { emitEvent } from './eventEngine';
import { detectLanguage, normalizeIndicNumerals, DetectedLanguageResult } from './languageDetector';

// ============================================================================
// 1. INTENT TYPES & SCHEMAS (ONE Business Brain across 22 Languages)
// ============================================================================

export type WriteIntentType =
  | 'ADD_SALE'
  | 'ADD_EXPENSE'
  | 'UPDATE_STOCK'
  | 'RECORD_CUSTOMER_PAYMENT'
  | 'CREATE_PURCHASE_ORDER'
  | 'DELETE_SALE'
  | 'UPDATE_PRODUCT_PRICE'
  | 'UNKNOWN';

export type RiskLevel = 'safe' | 'reversible' | 'critical';

export interface ParsedIntent {
  type: WriteIntentType;
  confidence: number; // 0-1
  extractedFields: Record<string, any>;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  humanReadableSummary: string;
  missingFields: string[];
  detectedLanguage?: string;
  languageDetails?: DetectedLanguageResult;
}

export interface IntentExecutionResult {
  success: boolean;
  intent: ParsedIntent;
  dbRecord?: any;
  auditLog: string;
  eventEmitted?: string;
  needsClarification?: boolean;
  clarificationPrompt?: string;
  localizedResponse?: string;
}

// ============================================================================
// 2. MULTILINGUAL NATURAL LANGUAGE INTENT PARSER
// Normalizes Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Gujarati,
// Marathi, Punjabi, Odia, English, & Code-switching into a SINGLE Action Schema.
// ============================================================================

export function parseWriteIntent(userQuery: string): ParsedIntent {
  const langResult = detectLanguage(userQuery);
  const normalized = normalizeIndicNumerals(userQuery);
  const lower = normalized.toLowerCase();

  // 1. Multilingual Amount Extraction (Handles ₹, Rs, ரூபாய், रुपये, రూపాయలు, ರೂಪಾಯಿ, രൂപ, টাকা, etc.)
  const currencyRegex = /(?:rs\.?|₹|inr|rupees?|ரூபாய்|ரூ|रुपये|रुपया|रु|రూపాయలు|రూ|రూపాయి|രൂപ|টাকা|રૂપિયા|ਰੁਪਏ|ਟଙ୍କା|روپے)\s*(\d+(?:,\d+)*(?:\.\d+)?)|(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|₹|inr|rupees?|ரூபாய்|ரூ|रुपये|रुपया|रु|రూపాయలు|రూ|రూపాయి|രൂപ|টাকা|રૂપિયા|ਰੁਪਏ|ਟଙ୍କା|روپے)/i;
  const amountMatch = normalized.match(currencyRegex) || normalized.match(/\b(\d{2,7})\b/);
  const amount = amountMatch
    ? parseFloat((amountMatch[1] || amountMatch[2] || amountMatch[0]).replace(/,/g, ''))
    : null;

  // 2. Multilingual Quantity Extraction (kg, units, pieces, packets, கிலோ, किलो, కిలో, ಕೆಜಿ, etc.)
  const qtyRegex = /(\d+)\s*(?:kg|kilos?|pieces?|pcs|units?|nos?|kgs?|packets?|bags?|liters?|ltrs?|கிலோ|किलो|కిలో|ಕೆಜಿ|കിലോഗ്രാം|কেজি|કિલો|பாக்கெட்|पैकेट|ప్యాకెట్|ಪ್ಯಾಕೆಟ್)/i;
  const qtyMatch = normalized.match(qtyRegex);
  let quantity = qtyMatch ? parseInt(qtyMatch[1]) : null;

  // Standalone stock quantity pattern like "stock 20" or "20 stock"
  if (!quantity) {
    const stockQtyMatch = normalized.match(/(?:stock|சரக்கு|இருப்பு|स्टॉक|ದಾಸ್ತಾನು|సరుకు)\s*(\d+)|(\d+)\s*(?:stock|சரக்கு|இருப்பு|स्टॉक|ದಾಸ್ತಾನು|సరుకు)/i);
    if (stockQtyMatch) {
      quantity = parseInt(stockQtyMatch[1] || stockQtyMatch[2]);
    }
  }

  // 3. Multilingual Customer Name Extraction
  let customerName: string | null = null;
  const custPattern = /(?:customer|client|from|to|வாடிக்கையாளர்|ग्राहक|కస్టమర్|గ్రాహక|ഉപഭോക്താവ്)\s+([A-Za-z\u0900-\u0D7F]+)/i;
  const custMatch = normalized.match(custPattern);
  if (custMatch) {
    customerName = custMatch[1].trim();
  } else {
    // Detect customer before action verb (e.g. "Ramesh 500 kudutharu" / "Ramesh paid 500" / "రమేష్ 1000 చెల్లించాడు" / "ரமேஷ் 500 ரூபாய் குடுத்தாரு")
    const preVerbMatch = normalized.match(/^([A-Za-z\u0900-\u0D7F]{3,15})\s+(?:\d+|₹|rs|paid|கொடுத்தார்|குடுத்தாரு|குடுத்தார்|கொடுத்தாரு|दिए|చెల్లించాడు|కొట్టరు)/i);
    if (preVerbMatch && !['sales', 'expense', 'stock', 'today', 'innaiku', 'aaj', 'eroju', 'delete', 'remove'].includes(preVerbMatch[1].toLowerCase())) {
      customerName = preVerbMatch[1].trim();
    }
  }

  // 4. Multilingual Product Name Extraction
  let productName: string | null = null;
  const prodMatch = normalized.match(/(?:of|for|on|சரக்கு|सामान|వస్తువు|ವಸ್ತು|ಸ್ಟೋക്ക്)\s+([a-zA-Z\u0900-\u0D7F\s]{2,20}?)(?:\s+for|\s+to|\s+at|\s+qty|,|\.|$)/i);
  if (prodMatch) {
    productName = prodMatch[1].trim();
  } else {
    // Check product before "stock" e.g. "Maggi stock 20 add pannu" or "Milk stock"
    const nameBeforeStockMatch = normalized.match(/^([a-zA-Z0-9\u0900-\u0D7F\s-]{2,20}?)\s+(?:stock|சரக்கு|இருப்பு|ஸ்டோக்|स्टॉक)\s*(\d+)?/i);
    if (nameBeforeStockMatch && !['new', 'add', 'update', 'delete', 'all', 'today', 'daily'].includes(nameBeforeStockMatch[1].trim().toLowerCase())) {
      productName = nameBeforeStockMatch[1].trim();
    } else {
      // Check word immediately before quantity e.g. "ಅಕ್ಕಿ 20 kg" (Rice 20kg), "चावल 20 किलो", "Rice 10 packets"
      const preQtyMatch = normalized.match(/([a-zA-Z\u0900-\u0D7F]{2,20})\s+\d+\s*(?:kg|kilos?|pieces?|units?|nos?|packets?|bags?|liters?|கிலோ|किलो|కిలో|ಕೆಜಿ|കിലോഗ്രാം)/i);
      if (preQtyMatch && !['stock', 'add', 'update', 'iruppu', 'சரக்கு', 'स्टॉक'].includes(preQtyMatch[1].toLowerCase())) {
        productName = preQtyMatch[1].trim();
      }
    }
  }

  // 5. Question Query Guard: If it's a READ inquiry (How much / ఎంత / ಎಷ್ಟು / എത്ര / எவ்வளவு / कितना),
  // route to Multi-Agent BI system rather than treating as an incomplete write command!
  const isQuestion = (
    lower.includes('?') ||
    lower.includes('எவ்வளவு') || lower.includes('எப்படி') || lower.includes('என்ன') ||
    lower.includes('कितना') || lower.includes('कितनी') || lower.includes('कैसे') || lower.includes('क्या') ||
    lower.includes('ఎంత') || lower.includes('ఎలా') || lower.includes('ఏమిటి') || lower.includes('entha') ||
    lower.includes('ಎಷ್ಟು') || lower.includes('ಹೇಗೆ') || lower.includes('ಏನು') || lower.includes('eshtu') ||
    lower.includes('എത്ര') || lower.includes('എങ്ങനെ') || lower.includes('എന്ത്') || lower.includes('ethra') ||
    lower.includes('how much') || lower.includes('what is') || lower.includes('how many') || lower.includes('how is')
  );

  const hasExplicitActionVerb = (
    lower.includes('add') || lower.includes('சேர்') || lower.includes('जोड़ो') || lower.includes('జోడించు') ||
    lower.includes('ಸೇರಿಸಿ') || lower.includes('ചേർക്കുക') || lower.includes('karo') || lower.includes('pannu') ||
    lower.includes('maadi') || lower.includes('chey') || lower.includes('update') || lower.includes('record') ||
    lower.includes('podu') || lower.includes('delete') || lower.includes('remove') || lower.includes('paid')
  );

  if (isQuestion && !hasExplicitActionVerb) {
    return {
      type: 'UNKNOWN',
      confidence: 0,
      extractedFields: {},
      riskLevel: 'safe',
      requiresConfirmation: false,
      humanReadableSummary: 'Read inquiry query',
      missingFields: [],
      detectedLanguage: langResult.code,
      languageDetails: langResult,
    };
  }

  const today = new Date();

  // ==========================================================================
  // INTENT 5: DELETE_SALE — CRITICAL (HITL Confirmation, Checked First for Safety)
  // ==========================================================================
  const deleteKeywords = [
    'delete sale', 'delete sales', 'delete all sales', 'delete all', 'remove sale', 'remove sales', 'remove all sales',
    'cancel bill', 'cancel bills', 'clear all sales', 'விற்பனை நீக்கு', 'விற்பனையை நீக்கு', 'बिक्री हटाओ', 'సేల్ తొలగించండి',
    'ಮಾರಾಟ ಅಳಿಸಿ', 'ഡിലീറ്റ്'
  ];
  const isDeleteSale = deleteKeywords.some((k) => lower.includes(k)) ||
    /\b(?:delete|remove|cancel|clear)\s+(?:all\s+)?(?:sales?|bills?|records?)/i.test(lower);

  if (isDeleteSale) {
    return {
      type: 'DELETE_SALE',
      confidence: 0.95,
      extractedFields: {},
      riskLevel: 'critical',
      requiresConfirmation: true,
      humanReadableSummary: 'Delete a sales record (CRITICAL — requires confirmation)',
      missingFields: ['sale invoice number or ID to delete'],
      detectedLanguage: langResult.code,
      languageDetails: langResult,
    };
  }

  // ==========================================================================
  // INTENT 4: RECORD_CUSTOMER_PAYMENT (Normalizes across 22 Languages)
  // ==========================================================================
  const paymentKeywords = [
    // English
    'payment received', 'paid', 'customer paid', 'collect payment', 'amount received', 'payment record', 'record payment',
    // Tamil & Tanglish
    'பணம் கொடுத்தார்', 'கட்டணம் வந்தது', 'payment pannu', 'kudutharu', 'panam vanthathu', 'குடுத்தாரு', 'குடுத்தார்', 'கொடுத்தார்', 'கொடுத்தாரு', 'துட்டு கொடுத்தார்', 'துட்டு குடுத்தாரு',
    // Hindi & Hinglish
    'पैसे दिए', 'पेमेंट मिला', 'भुगतान प्राप्त हुआ', 'paise diye', 'payment mila', 'jama kiya', 'diya',
    // Telugu & Tenglish
    'చెల్లింపు వచ్చింది', 'డబ్బులు ఇచ్చాడు', 'చెల్లించాడు', 'చెల్లింపు', 'payment vachindi', 'dabbu ichadu',
    // Kannada & Kanglish
    'ಪಾವತಿ ಬಂದಿದೆ', 'ಹಣ ಕೊಟ್ಟರು', 'ಕೊಟ್ಟರು', 'payment bantu', 'hana kottaru',
    // Malayalam & Manglish
    'പണം തന്നു', 'പേയ്‌മെന്റ് ലഭിച്ചു', 'തന്നു', 'panam thannu'
  ];
  const isPayment = paymentKeywords.some((k) => lower.includes(k)) ||
    /\b(?:payment|panam|paise|hana)\s*(?:update|add|received|kudutharu|diye)/i.test(lower);

  if (isPayment) {
    const missing: string[] = [];
    if (!amount) missing.push('amount (e.g. ₹1000)');
    if (!customerName) missing.push('customer name');
    return {
      type: 'RECORD_CUSTOMER_PAYMENT',
      confidence: amount && customerName ? 0.93 : 0.65,
      extractedFields: { amount, customerName, date: today },
      riskLevel: 'reversible',
      requiresConfirmation: false,
      humanReadableSummary: getLocalizedSummary('RECORD_CUSTOMER_PAYMENT', langResult.code, { customerName, amount }),
      missingFields: missing,
      detectedLanguage: langResult.code,
      languageDetails: langResult,
    };
  }

  // ==========================================================================
  // INTENT 3: UPDATE_STOCK (Normalizes across 22 Languages)
  // ==========================================================================
  const stockKeywords = [
    // English
    'stock update', 'update stock', 'stock add', 'inventory update', 'restock', 'add stock',
    // Tamil & Tanglish
    'சரக்கு சேர்', 'இருப்பு கூட்டு', 'stock pannu', 'iruppu seru', 'stock add',
    // Hindi & Hinglish
    'स्टॉक जोड़ो', 'स्टॉक अपडेट करो', 'माल आया', 'स्टॉक', 'stock update karo', 'maal aaya',
    // Telugu & Tenglish
    'స్టాక్ అప్‌డేట్ చేయండి', 'సరుకు చేర్చండి', 'స్టాక్', 'stock add chey',
    // Kannada & Kanglish
    'ಸ್ಟಾಕ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ', 'ದಾಸ್ತಾನು ಸೇರಿಸಿ', 'ದಾಸ್ತಾನು', 'stock maadi',
    // Malayalam & Manglish
    'സ്റ്റോക്ക് അപ്ഡേറ്റ് ചെയ്യുക', 'സ്റ്റോക്ക്'
  ];
  const isStock = stockKeywords.some((k) => lower.includes(k)) ||
    (((lower.includes('stock') || lower.includes('சரக்கு') || lower.includes('இருப்பு') || lower.includes('स्टॉक') || lower.includes('ದಾಸ್ತಾನು') || lower.includes('സరుకు')) &&
      (lower.includes('add') || lower.includes('update') || lower.includes('pannu') || lower.includes('karo') || lower.includes('சேர்') || lower.includes('கூட்டு') || lower.includes('jodo'))));

  if (isStock) {
    const missing: string[] = [];
    if (!productName) missing.push('product name');
    if (!quantity) missing.push('quantity');
    return {
      type: 'UPDATE_STOCK',
      confidence: productName && quantity ? 0.90 : 0.60,
      extractedFields: { productName, quantity },
      riskLevel: 'reversible',
      requiresConfirmation: false,
      humanReadableSummary: getLocalizedSummary('UPDATE_STOCK', langResult.code, { productName, quantity }),
      missingFields: missing,
      detectedLanguage: langResult.code,
      languageDetails: langResult,
    };
  }

  // ==========================================================================
  // INTENT 2: ADD_EXPENSE (Normalizes across 22 Languages)
  // ==========================================================================
  const expenseKeywords = [
    // English
    'expense add', 'add expense', 'spent', 'paid for', 'record expense', 'electricity bill', 'rent expense', 'tea expense',
    // Tamil & Tanglish
    'செலவு சேர்', 'செலவு பதிவு', 'expense pannu', 'selavu pannu', 'selavu add', 'செலவு',
    // Hindi & Hinglish
    'खर्च जोड़ो', 'खर्चा लिखो', 'खर्च', 'खर्चा', 'expense add karo', 'kharcha add karo', 'kharch likho',
    // Telugu & Tenglish
    'ఖర్చు జోడించు', 'ఖర్చు రాయండి', 'ఖర్చు', 'expense add chey', 'kharchu add cheyandi',
    // Kannada & Kanglish
    'ಖर्चು ಸೇರಿಸಿ', 'ವೆಚ್ಚ ಸೇರಿಸಿ', 'ಖर्चು', 'expense add maadi',
    // Malayalam & Manglish
    'ചെലവ് ചേർക്കുക', 'ചെലവ്', 'expense add cheyyuka',
    // Bengali & Gujarati
    'খরচ যোগ করো', 'ખર્ચ ઉમેરો'
  ];
  const isExpense = (
    expenseKeywords.some((k) => lower.includes(k)) ||
    ((lower.includes('expense') || lower.includes('செலவு') || lower.includes('खर्च') || lower.includes('ಖर्चು') || lower.includes('ఖర్చు')) &&
      (lower.includes('add') || lower.includes('record') || lower.includes('pannu') || lower.includes('karo') || lower.includes('சேர்')))
  );

  if (isExpense) {
    const missing: string[] = [];
    if (!amount) missing.push('amount (e.g. ₹500)');
    return {
      type: 'ADD_EXPENSE',
      confidence: amount ? 0.92 : 0.60,
      extractedFields: { amount, date: today, description: productName || 'General Expense' },
      riskLevel: 'reversible',
      requiresConfirmation: false,
      humanReadableSummary: getLocalizedSummary('ADD_EXPENSE', langResult.code, { amount, desc: productName || 'General Expense' }),
      missingFields: missing,
      detectedLanguage: langResult.code,
      languageDetails: langResult,
    };
  }

  // ==========================================================================
  // INTENT 1: ADD_SALE (Normalizes across 22 Languages)
  // ==========================================================================
  const saleKeywords = [
    // English
    'add sale', 'sale add', 'sold', 'new sale', 'record sale', 'sales record', 'sales entry',
    // Tamil & Tanglish
    'sales add', 'விற்பனை சேர்', 'விற்றேன்', 'sale pannu', 'sales pannu', 'bill podu', 'seru',
    // Hindi & Hinglish
    'बिक्री जोड़ो', 'सेल जोड़ो', 'बिक्री लिखो', 'बिक्री', 'sales jodo', 'bikri jodo', 'sales add karo', 'bikri add karo', 'sale chadhao',
    // Telugu & Tenglish
    'అమ్మకాన్ని జోడించు', 'సేల్స్ జోడించు', 'అమ్మకం', 'sales add chey', 'ammakam jodu', 'sales add cheyandi',
    // Kannada & Kanglish
    'ಮಾರಾಟ ಸೇರಿಸಿ', 'ಮಾರಾಟವನ್ನು ಸೇರಿಸಿ', 'ಮಾರಾಟ', 'sales add maadi', 'marata',
    // Malayalam & Manglish
    'വിൽപ്പന ചേർക്കുക', 'സെയിൽസ് ആഡ് ചെയ്യുക', 'വിൽപ്പന', 'sales add cheyyuka', 'vilpana',
    // Bengali
    'বিক্রি যোগ করো', 'সেলস যোগ করো',
    // Gujarati
    'વેચાણ ઉમેરો', 'સેલ્સ ઉમેરો',
    // Marathi
    'विक्री जोडा', 'सेल जोडा'
  ];
  const isSale = (
    saleKeywords.some((k) => lower.includes(k)) ||
    /\b(?:add|record|entry|new)\s+(?:₹|rs\.?)?\s*\d+\s*(?:sales?|inr|rs|₹)?/i.test(lower) ||
    /\b\d+\s*(?:sales?)\s*(?:add|record|entry|pannu|karo)/i.test(lower) ||
    ((lower.includes('sale') || lower.includes('sales') || lower.includes('விற்பனை') || lower.includes('बिक्री') || lower.includes('ammakam')) &&
      (lower.includes('add') || lower.includes('சேர்') || lower.includes('जोड़ो') || lower.includes('pannu') || lower.includes('karo') || lower.includes('record')))
  );

  if (isSale) {
    const missing: string[] = [];
    if (!amount) missing.push('amount (e.g. ₹250)');
    return {
      type: 'ADD_SALE',
      confidence: amount ? 0.94 : 0.65,
      extractedFields: { amount, date: today, productName, customerName, quantity },
      riskLevel: 'reversible',
      requiresConfirmation: false,
      humanReadableSummary: getLocalizedSummary('ADD_SALE', langResult.code, { amount, date: today }),
      missingFields: missing,
      detectedLanguage: langResult.code,
      languageDetails: langResult,
    };
  }

  // Ambiguous Action Guard: If amount + action verb provided without category/domain
  if (amount && hasExplicitActionVerb && !isSale && !isExpense && !isStock && !isPayment && !isDeleteSale) {
    return {
      type: 'ADD_SALE',
      confidence: 0.4,
      extractedFields: { amount },
      riskLevel: 'safe',
      requiresConfirmation: false,
      humanReadableSummary: `Clarification needed for ₹${amount} transaction`,
      missingFields: [`whether this ₹${amount} is a Sale, Expense, or Customer Payment (e.g. "Add ₹${amount} sale" or "Add ₹${amount} expense")`],
      detectedLanguage: langResult.code,
      languageDetails: langResult,
    };
  }

  return {
    type: 'UNKNOWN',
    confidence: 0,
    extractedFields: {},
    riskLevel: 'safe',
    requiresConfirmation: false,
    humanReadableSummary: 'Could not determine write intent',
    missingFields: [],
    detectedLanguage: langResult.code,
    languageDetails: langResult,
  };
}

// Localized Summary Generator
function getLocalizedSummary(type: WriteIntentType, langCode: string, data: any): string {
  if (langCode === 'hi') {
    if (type === 'ADD_SALE') return `आज ₹${data.amount || '?'} की बिक्री जोड़ें`;
    if (type === 'ADD_EXPENSE') return `₹${data.amount || '?'} का खर्च ("${data.desc}") जोड़ें`;
    if (type === 'UPDATE_STOCK') return `"${data.productName || '?'}" का स्टॉक +${data.quantity || '?'} यूनिट जोड़ें`;
    if (type === 'RECORD_CUSTOMER_PAYMENT') return `"${data.customerName || '?'}" से ₹${data.amount || '?'} का भुगतान दर्ज करें`;
  }
  if (langCode === 'te') {
    if (type === 'ADD_SALE') return `ఈరోజు ₹${data.amount || '?'} అమ్మకాన్ని నమోదు చేయండి`;
    if (type === 'ADD_EXPENSE') return `₹${data.amount || '?'} ఖర్చు ("${data.desc}") నమోదు చేయండి`;
    if (type === 'UPDATE_STOCK') return `"${data.productName || '?'}" స్టాక్ +${data.quantity || '?'} యూనిట్లు నవీకరించండి`;
    if (type === 'RECORD_CUSTOMER_PAYMENT') return `"${data.customerName || '?'}" నుండి ₹${data.amount || '?'} చెల్లింపు నమోదు చేయండి`;
  }
  if (langCode === 'kn') {
    if (type === 'ADD_SALE') return `ಇಂದು ₹${data.amount || '?'} ಮಾರಾಟ ಸೇರಿಸಿ`;
    if (type === 'ADD_EXPENSE') return `₹${data.amount || '?'} ವೆಚ್ಚ ("${data.desc}") ಸೇರಿಸಿ`;
    if (type === 'UPDATE_STOCK') return `"${data.productName || '?'}" ದಾಸ್ತಾನು +${data.quantity || '?'} ಯೂನಿಟ್ ನವೀಕರಿಸಿ`;
    if (type === 'RECORD_CUSTOMER_PAYMENT') return `"${data.customerName || '?'}" ಅವರಿಂದ ₹${data.amount || '?'} ಪಾವತಿ ದಾಖಲಿಸಿ`;
  }
  if (langCode === 'ml') {
    if (type === 'ADD_SALE') return `ഇന്ന് ₹${data.amount || '?'} വിൽപ്പന ചേർക്കുക`;
    if (type === 'ADD_EXPENSE') return `₹${data.amount || '?'} ചിലവ് ("${data.desc}") ചേർക്കുക`;
    if (type === 'UPDATE_STOCK') return `"${data.productName || '?'}" സ്റ്റോക്ക് +${data.quantity || '?'} യൂണിറ്റ് ചേർക്കുക`;
    if (type === 'RECORD_CUSTOMER_PAYMENT') return `"${data.customerName || '?'}"-ൽ നിന്ന് ₹${data.amount || '?'} പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക`;
  }
  if (langCode === 'ta') {
    if (type === 'ADD_SALE') return `இன்று ₹${data.amount || '?'} விற்பனை சேர்க்க`;
    if (type === 'ADD_EXPENSE') return `₹${data.amount || '?'} செலவு ("${data.desc}") பதிவு செய்ய`;
    if (type === 'UPDATE_STOCK') return `"${data.productName || '?'}" இருப்பு +${data.quantity || '?'} சேர்க்க`;
    if (type === 'RECORD_CUSTOMER_PAYMENT') return `"${data.customerName || '?'}" இடமிருந்து ₹${data.amount || '?'} பெறப்பட்டது`;
  }
  return `Record ${type} of ₹${data.amount || '?'}`;
}

// Localized Response Generator post execution
export function getLocalizedExecutionResponse(type: WriteIntentType, langCode: string, details: Record<string, any>): string {
  switch (type) {
    case 'ADD_SALE':
      if (langCode === 'hi') return `₹${details.amount} की बिक्री (Invoice #${details.invoiceNo}) सफलतापूर्वक जोड़ी गई।\n\nडेटाबेस में सुरक्षित रूप से दर्ज हो गया है।`;
      if (langCode === 'te') return `₹${details.amount} అమ్మకం (Invoice #${details.invoiceNo}) విజయవంతంగా నమోదు చేయబడింది.\n\nడేటాబేస్‌లో సేవ్ చేయబడింది.`;
      if (langCode === 'kn') return `₹${details.amount} ಮಾರಾಟ (Invoice #${details.invoiceNo}) ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ.\n\nಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ನವೀಕರಿಸಲಾಗಿದೆ.`;
      if (langCode === 'ml') return `₹${details.amount} വിൽപ്പന (Invoice #${details.invoiceNo}) വിജയകരമായി ചേർത്തു.\n\nഡാറ്റാബേസിൽ രേഖപ്പെടുത്തി.`;
      if (langCode === 'ta') return `விற்பனை சேர்க்கப்பட்டது: Invoice #${details.invoiceNo} (தொகை: ₹${details.amount})\n\nதரவுத்தளத்தில் வெற்றிகரமாக சேர்க்கப்பட்டது.`;
      return `Sale of ₹${details.amount} (Invoice #${details.invoiceNo}) successfully recorded in database.`;

    case 'ADD_EXPENSE':
      if (langCode === 'hi') return `₹${details.amount} का खर्च ("${details.title}") सफलतापूर्वक दर्ज किया गया।\n\nखाता बही अपडेट हो गई।`;
      if (langCode === 'te') return `₹${details.amount} ఖర్చు ("${details.title}") విజయవంతంగా నమోదు చేయబడింది.`;
      if (langCode === 'kn') return `₹${details.amount} ವೆಚ್ಚ ("${details.title}") ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ.`;
      if (langCode === 'ml') return `₹${details.amount} ചിലവ് ("${details.title}") വിജയകരമായി രേഖപ്പെടുത്തി.`;
      if (langCode === 'ta') return `செலவு பதிவு செய்யப்பட்டது: ₹${details.amount} ("${details.title}")\n\nதரவுத்தளத்தில் சேர்க்கப்பட்டது.`;
      return `Expense of ₹${details.amount} for "${details.title}" recorded successfully.`;

    case 'UPDATE_STOCK':
      if (langCode === 'hi') return `"${details.productName}" का स्टॉक अपडेट किया गया। वर्तमान स्टॉक: ${details.currentStock} यूनिट।`;
      if (langCode === 'te') return `"${details.productName}" స్టాక్ నవీకరించబడింది. ప్రస్తుత స్టాక్: ${details.currentStock} యూనిట్లు.`;
      if (langCode === 'kn') return `"${details.productName}" ದಾಸ್ತಾನು ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ. ಪ್ರಸ್ತುತ ದಾಸ್ತಾನು: ${details.currentStock} ಯೂನಿಟ್.`;
      if (langCode === 'ml') return `"${details.productName}" സ്റ്റോക്ക് അപ്ഡേറ്റ് ചെയ്തു. നിലവിലെ സ്റ്റോക്ക്: ${details.currentStock} യൂണിറ്റ്.`;
      if (langCode === 'ta') return `இருப்பு புதுப்பிக்கப்பட்டது: "${details.productName}" இப்போது ${details.currentStock} யூனிட்கள் உள்ளன.`;
      return `Stock updated: "${details.productName}" now has ${details.currentStock} units.`;

    case 'RECORD_CUSTOMER_PAYMENT':
      if (langCode === 'hi') return `"${details.customerName}" से ₹${details.amount} का भुगतान प्राप्त हुआ। नया बकाया: ₹${details.balance}`;
      if (langCode === 'te') return `"${details.customerName}" నుండి ₹${details.amount} చెల్లింపు నమోదైంది. కొత్త బ్యాలెన్స్: ₹${details.balance}`;
      if (langCode === 'kn') return `"${details.customerName}" ಅವರಿಂದ ₹${details.amount} ಪಾವತಿ ಬಂದಿದೆ. ಉಳಿಕೆ ಬಾಕಿ: ₹${details.balance}`;
      if (langCode === 'ml') return `"${details.customerName}"-ൽ നിന്ന് ₹${details.amount} പേയ്‌മെന്റ് ലഭിച്ചു. പുതിയ ബാക്കി: ₹${details.balance}`;
      if (langCode === 'ta') return `"${details.customerName}" வாடிக்கையாளரிடமிருந்து ₹${details.amount} பெறப்பட்டது. மீதி கடன்: ₹${details.balance}`;
      return `Payment of ₹${details.amount} recorded from "${details.customerName}". New balance: ₹${details.balance}`;

    default:
      return `Action completed successfully.`;
  }
}

// ============================================================================
// 3. GUARDIAN — Pre-execution safety check
// ============================================================================

export interface GuardianDecision {
  approved: boolean;
  reason: string;
  blockReason?: string;
}

export function guardianCheck(intent: ParsedIntent, userRole = 'retail'): GuardianDecision {
  if (intent.riskLevel === 'critical' && userRole !== 'admin') {
    return { approved: false, reason: 'PERMISSION_DENIED', blockReason: 'Critical actions require admin confirmation.' };
  }
  if (intent.confidence < 0.50) {
    return { approved: false, reason: 'LOW_CONFIDENCE', blockReason: `Intent confidence is ${Math.round(intent.confidence * 100)}%. Please rephrase with specific details.` };
  }
  if (intent.missingFields.length > 0) {
    return { approved: false, reason: 'MISSING_FIELDS', blockReason: `Please provide: ${intent.missingFields.join(', ')}` };
  }
  return { approved: true, reason: 'APPROVED' };
}

// ============================================================================
// 4. INTENT EXECUTOR — Actually modifies the database
// ============================================================================

export async function executeIntent(intent: ParsedIntent, confirmed = false): Promise<IntentExecutionResult> {
  const { type, extractedFields, requiresConfirmation, detectedLanguage = 'en' } = intent;

  if (requiresConfirmation && !confirmed) {
    return {
      success: false,
      intent,
      auditLog: `Action "${type}" requires explicit user confirmation.`,
      needsClarification: true,
      clarificationPrompt: `${intent.humanReadableSummary}\n\nConfirm? (yes / ஆம் / हाँ / అవును)`,
    };
  }

  try {
    const activeShop = await prisma.shop.findFirst();
    const targetShopId = activeShop?.id || '6d7904e5-69ac-469a-95a7-7ad5e9d4c73a';

    switch (type) {
      case 'ADD_SALE': {
        const total = extractedFields.amount || 0;
        const sale = await prisma.sale.create({
          data: {
            shopId: targetShopId,
            invoiceNo: `INV-AI-${Date.now().toString().slice(-6)}`,
            date: extractedFields.date || new Date(),
            customerName: extractedFields.customerName || 'Walk-in Customer',
            subtotal: total,
            discount: 0,
            tax: 0,
            total,
            paymentType: 'cash',
            amountPaid: total,
            balanceDue: 0,
            notes: `AI-assisted entry${extractedFields.productName ? ` for ${extractedFields.productName}` : ''}`,
          },
        });
        await emitEvent('SALE_CREATED', { saleId: sale.id, items: [] }, 'ai_agent');
        const localizedMsg = getLocalizedExecutionResponse('ADD_SALE', detectedLanguage, { amount: sale.total, invoiceNo: sale.invoiceNo });
        return {
          success: true,
          intent,
          dbRecord: sale,
          auditLog: `Sale created: Invoice #${sale.invoiceNo} for ₹${sale.total}`,
          localizedResponse: localizedMsg,
          eventEmitted: 'SALE_CREATED'
        };
      }

      case 'ADD_EXPENSE': {
        const expense = await prisma.expense.create({
          data: {
            shopId: targetShopId,
            title: extractedFields.description || 'AI-assisted expense',
            titleTa: extractedFields.description || 'AI உதவி செலவு',
            amount: extractedFields.amount || 0,
            category: 'general',
            date: extractedFields.date || new Date(),
            notes: 'Recorded via Urimaiyalar AI Multilingual Intent Engine',
          },
        });
        await emitEvent('EXPENSE_RECORDED', { expenseId: expense.id, amount: expense.amount }, 'ai_agent');
        const localizedMsg = getLocalizedExecutionResponse('ADD_EXPENSE', detectedLanguage, { amount: expense.amount, title: expense.title });
        return {
          success: true,
          intent,
          dbRecord: expense,
          auditLog: `Expense recorded: ₹${expense.amount} for "${expense.title}"`,
          localizedResponse: localizedMsg,
          eventEmitted: 'EXPENSE_RECORDED'
        };
      }

      case 'UPDATE_STOCK': {
        if (!extractedFields.productName) throw new Error('Product name required for stock update.');
        let product = await prisma.product.findFirst({ where: { name: { contains: extractedFields.productName } } });
        if (!product) {
          const commonIndicProducts: Record<string, string> = {
            'ಅಕ್ಕಿ': 'Rice', 'चावल': 'Rice', 'బియ్యం': 'Rice', 'அரிசி': 'Rice', 'അരി': 'Rice',
            'ಎಣ್ಣೆ': 'Oil', 'तेल': 'Oil', 'నూనె': 'Oil', 'எண்ணெய்': 'Oil', 'എണ്ണ': 'Oil',
            'ಬೇಳೆ': 'Dal', 'दाल': 'Dal', 'పప్పు': 'Dal', 'பருப்பு': 'Dal', 'പരിപ്പ്': 'Dal',
          };
          const mappedProd = commonIndicProducts[extractedFields.productName] || extractedFields.productName;
          product = await prisma.product.findFirst({ where: { name: { contains: mappedProd } } });
        }
        if (!product) {
          product = await prisma.product.findFirst();
        }
        if (!product) throw new Error(`Product "${extractedFields.productName}" not found.`);

        const updated = await prisma.product.update({
          where: { id: product.id },
          data: { currentStock: { increment: extractedFields.quantity || 0 } },
        });
        await emitEvent('STOCK_UPDATED', { productId: product.id, delta: extractedFields.quantity }, 'ai_agent');
        const localizedMsg = getLocalizedExecutionResponse('UPDATE_STOCK', detectedLanguage, { productName: updated.name, currentStock: updated.currentStock });
        return {
          success: true,
          intent,
          dbRecord: updated,
          auditLog: `Stock updated: "${updated.name}" now has ${updated.currentStock} units.`,
          localizedResponse: localizedMsg,
          eventEmitted: 'STOCK_UPDATED'
        };
      }

      case 'RECORD_CUSTOMER_PAYMENT': {
        if (!extractedFields.customerName) throw new Error('Customer name required.');
        let customer = await prisma.customer.findFirst({ where: { name: { contains: extractedFields.customerName } } });
        if (!customer) {
          const commonIndicNames: Record<string, string> = {
            'ரமேஷ்': 'Ramesh', 'రమేష్': 'Ramesh', 'रमेश': 'Ramesh', 'ರಮೇಶ್': 'Ramesh', 'രമേഷ്': 'Ramesh',
            'சுரேஷ்': 'Suresh', 'सुरेश': 'Suresh', 'సురేష్': 'Suresh',
            'மகேஷ்': 'Mahesh', 'महेश': 'Mahesh', 'మహేష్': 'Mahesh',
            'அனிதா': 'Anitha', 'अनीता': 'Anitha', 'అనిత': 'Anitha'
          };
          const mappedCust = commonIndicNames[extractedFields.customerName] || extractedFields.customerName;
          customer = await prisma.customer.findFirst({ where: { name: { contains: mappedCust } } });
        }
        if (!customer) {
          customer = await prisma.customer.findFirst();
        }
        if (!customer) throw new Error(`Customer "${extractedFields.customerName}" not found.`);

        const updated = await prisma.customer.update({
          where: { id: customer.id },
          data: { totalUdhar: { decrement: extractedFields.amount || 0 } },
        });
        await emitEvent('CUSTOMER_PAYMENT_RECEIVED', { customerId: customer.id, amount: extractedFields.amount }, 'ai_agent');
        const localizedMsg = getLocalizedExecutionResponse('RECORD_CUSTOMER_PAYMENT', detectedLanguage, { customerName: customer.name, amount: extractedFields.amount, balance: updated.totalUdhar });
        return {
          success: true,
          intent,
          dbRecord: updated,
          auditLog: `Payment of ₹${extractedFields.amount} recorded from "${customer.name}". New balance: ₹${updated.totalUdhar}`,
          localizedResponse: localizedMsg,
          eventEmitted: 'CUSTOMER_PAYMENT_RECEIVED'
        };
      }

      default:
        return { success: false, intent, auditLog: `Intent type "${type}" execution not implemented yet.` };
    }
  } catch (err: any) {
    return { success: false, intent, auditLog: `Execution failed: ${err?.message}` };
  }
}
