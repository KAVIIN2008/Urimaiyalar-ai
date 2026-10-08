/**
 * URIMAIYALAR AI - Intent and Entity Extraction Engine
 * Supports Tamil (தமிழ்), English, and Tanglish inputs
 * Prepares verified data structures before passing to confirmation dialogs or LLM
 */

import { IntentEntityExtraction, LanguageCode } from '../types';

export function detectLanguage(text: string): LanguageCode {
  if (!text) return 'en';
  // Check if Tamil Unicode range (U+0B80 - U+0BFF) is present
  const tamilRegex = /[\u0B80-\u0BFF]/;
  if (tamilRegex.test(text)) {
    return 'ta';
  }

  // Tanglish detector keywords
  const tanglishWords = [
    'indha', 'evalo', 'evalavu', 'evvalavu', 'irukku', 'iruku', 'kudukanum', 'tharanum',
    'panam', 'laabam', 'selavu', 'kadai', 'kadan', 'kilo', 'ari', 'muttai', 'vanginen',
    'vitren', 'viththen', 'naalaiku', 'nethu', 'inaiku', 'vanthuchi', 'illai', 'yen',
  ];
  const lower = (text || '').toLowerCase();
  const isTanglish = tanglishWords.some((w) => lower.includes(w));
  if (isTanglish) return 'tanglish';

  return 'en';
}

export function parseBusinessIntent(input: string): IntentEntityExtraction {
  const text = (input || '').trim();
  const lang = detectLanguage(text);
  const lower = text.toLowerCase();

  // Extraction containers
  let intent = 'UNKNOWN';
  let confidence = 0.85;
  const entities: IntentEntityExtraction['entities'] = {};
  let requiresConfirmation = false;
  let confirmationPromptTa = '';
  let confirmationPromptEn = '';

  // Extract numbers / currency amounts
  // Matches "5000", "₹5000", "5,000", "5000 ரூபாய்", "5000 rs"
  const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:ரூபாய்|rs|rupees|rooba)?/i);
  if (amountMatch) {
    const rawVal = amountMatch[1].replace(/,/g, '');
    const num = parseFloat(rawVal);
    if (!isNaN(num) && num > 0) {
      entities.amount = num;
    }
  }

  // Extract quantity & unit
  // e.g. "5 kg", "5 கிலோ", "10 bag", "2 மூட்டை", "10 packet", "2 லிட்டர்", "2 litre"
  const qtyMatch = text.match(/(\d+)\s*(?:கிலோ|kg|பைகள்|பை|bag|bags|மூட்டை|packet|பாக்கெட்|லிட்டர்|litre|litres|ltr|piece|டப்பா)?/i);
  if (qtyMatch) {
    const q = parseInt(qtyMatch[1], 10);
    if (!isNaN(q) && q > 0 && q !== entities.amount) {
      entities.quantity = q;
    }
  }

  if (/கிலோ|kg/i.test(text)) entities.unit = 'kg';
  else if (/மூட்டை|பை|bag/i.test(text)) entities.unit = 'bag';
  else if (/லிட்டர்|litre|ltr/i.test(text)) entities.unit = 'litre';
  else if (/பாக்கெட்|packet/i.test(text)) entities.unit = 'packet';

  // Extract known products
  // Extract known products or dynamic product mentions
  if (/அரிசி|rice|ponni|idli/i.test(text)) entities.product = 'அரிசி (Rice)';
  else if (/எண்ணெய்|oil|sunflower|sesame/i.test(text)) entities.product = 'சமையல் எண்ணெய் (Cooking Oil)';
  else if (/பருப்பு|dal|toor/i.test(text)) entities.product = 'துவரம் பருப்பு (Toor Dal)';
  else if (/சர்க்கரை|sugar/i.test(text)) entities.product = 'சர்க்கரை (Sugar)';
  else if (/வெல்லம்|jaggery/i.test(text)) entities.product = 'நாட்டு வெல்லம் (Jaggery)';
  else if (/மாவு|atta|flour/i.test(text)) entities.product = 'கோதுமை மாவு (Atta)';
  else if (/டீ|தேயிலை|tea/i.test(text)) entities.product = 'தேயிலைத் தூள் (Tea Powder)';
  else if (/தக்காளி|tomato/i.test(text)) entities.product = 'தக்காளி (Tomato)';
  else if (/வெங்காயம்|onion/i.test(text)) entities.product = 'வெங்காயம் (Onion)';
  else if (/சோப்பு|soap/i.test(text)) entities.product = 'சோப்பு (Soap)';
  else if (/மசாலா|masala/i.test(text)) entities.product = 'மசாலா (Spices)';
  else if (/பால்|milk/i.test(text)) entities.product = 'பால் (Milk)';

  // Extract known customer/parties
  if (/ரமேஷ்|ramesh/i.test(text)) entities.customer = 'M. Ramesh';
  else if (/முருகன்|murugan/i.test(text)) entities.customer = 'Murugan Tiffin Center';
  else if (/பிரியா|priya/i.test(text)) entities.customer = 'Priya Selvaraj';
  else if (/கண்ணன்|kannan/i.test(text)) entities.customer = 'Kannan Catering Services';
  else if (/சுந்தரம்|sundaram/i.test(text)) entities.customer = 'G. Sundaram';
  else if (/குமார்|kumar/i.test(text)) entities.customer = 'Kumar';
  else if (/ரவி|ravi/i.test(text)) entities.customer = 'Ravi';
  else if (/செல்வம்|selvam/i.test(text)) entities.customer = 'Selvam';

  // Extract supplier
  if (/மீனாட்சி|meenakshi/i.test(text)) entities.supplier = 'Sri Meenakshi Rice Mill';
  else if (/காவேரி|cauvery/i.test(text)) entities.supplier = 'Cauvery Oil Traders';

  // 0.0 LOAD_SAMPLE_DATA Intent
  if (
    /load sample data|load demo data|load sample|மாதிரி தரவை ஏற்று|மாதிரி தரவு|டெமோ தரவை போடு|மாதிரி வணிகத் தரவு|மாதிரி ஏற்று/i.test(
      text
    )
  ) {
    intent = 'LOAD_SAMPLE_DATA';
    confidence = 0.99;
    requiresConfirmation = false;
    confirmationPromptTa = 'மாதிரி வணிகத் தரவை (மதுரை ஸ்டோர்ஸ்) ஏற்றவா?';
    confirmationPromptEn = 'Load sample demo data?';
    return {
      intent,
      language: lang,
      confidence,
      entities,
      requiresConfirmation,
      confirmationPromptTa,
      confirmationPromptEn,
      rawText: text,
    };
  }

  // 0.00 CLEAR_DATA / RESET_DATA Intent
  if (
    /clear all test data|clear test data|clear data|wipe data|empty store|சோதனைத் தரவை அழி|சோதனை தரவை நீக்கு|தரவை அழி|தரவு நீக்கு|டெமோ தரவை அழி/i.test(
      text
    )
  ) {
    intent = 'CLEAR_DATA';
    confidence = 0.99;
    requiresConfirmation = true;
    confirmationPromptTa = 'அனைத்து சோதனைத் தரவுகளையும் (பொருட்கள், வாடிக்கையாளர்கள், விற்பனை போன்றவை) அழிக்கவா?';
    confirmationPromptEn = 'Clear all demo test data to start fresh?';
    return {
      intent,
      language: lang,
      confidence,
      entities,
      requiresConfirmation,
      confirmationPromptTa,
      confirmationPromptEn,
      rawText: text,
    };
  }

  // 0.0 ROLE SWITCH (Customer Portal vs Store Owner ERP)
  if (
    /customer portal|customer side|customer login|வாடிக்கையாளர் தளம்|வாடிக்கையாளர் பக்கம்|வாடிக்கையாளர் லாகின்|வாடிக்கையாளர் போர்டல்|switch to customer|open customer/i.test(text)
  ) {
    intent = 'SWITCH_ROLE';
    confidence = 0.99;
    entities.role = 'customer';
    entities.targetView = 'customer_portal';
    requiresConfirmation = false;
  } else if (
    /store owner|owner view|owner erp|உரிமையாளர் பக்கம்|கடை உரிமையாளர்|ஓனர் பார்வை|switch to owner|owner login/i.test(text)
  ) {
    intent = 'SWITCH_ROLE';
    confidence = 0.99;
    entities.role = 'owner';
    entities.targetView = 'dashboard';
    requiresConfirmation = false;
  }

  // 0.01 LANGUAGE SWITCH
  else if (
    /switch to tamil|change to tamil|tamil language|தமிழுக்கு மாற்று|தமிழ் மொழிக்கு மாற்று|தமிழுக்கு மாறு/i.test(text)
  ) {
    intent = 'CHANGE_LANGUAGE';
    confidence = 0.99;
    entities.targetLang = 'ta';
    requiresConfirmation = false;
  } else if (
    /switch to english|change to english|english language|ஆங்கிலத்திற்கு மாற்று|ஆங்கில மொழிக்கு மாற்று/i.test(text)
  ) {
    intent = 'CHANGE_LANGUAGE';
    confidence = 0.99;
    entities.targetLang = 'en';
    requiresConfirmation = false;
  }

  // 0. NAVIGATE Intent
  // e.g. "go to inventory", "open sales", "சரக்கு இருப்பு பக்கம்", "sales po", "open reports"
  else if (
    /go to|open|navigate|view|பக்கத்திற்கு செல்|பக்கம் போ|பக்கத்தை திற|காட்டு|போ|திற/i.test(text) &&
    /inventory|sales|purchases|customers|suppliers|credit|expenses|reports|analysis|memory|schemes|market|settings|dashboard|சரக்கு|விற்பனை|கொள்முதல்|வாடிக்கையாளர்|விநியோகஸ்தர்|கடன்|செலவு|அறிக்கை|பகுப்பாய்வு|நினைவகம்|திட்டம்|சந்தை|அமைப்பு|முகப்பு/i.test(text)
  ) {
    intent = 'NAVIGATE';
    confidence = 0.98;
    let targetView = 'dashboard';
    if (/inventory|சரக்கு இருப்பு|சரக்கு|பொருட்கள்/i.test(text)) targetView = 'inventory';
    else if (/sales|விற்பனை|பில்/i.test(text)) targetView = 'sales';
    else if (/purchases|கொள்முதல்/i.test(text)) targetView = 'purchases';
    else if (/customers|வாடிக்கையாளர்/i.test(text)) targetView = 'customers';
    else if (/suppliers|விநியோகஸ்தர்|சப்ளையர்/i.test(text)) targetView = 'suppliers';
    else if (/credit|udhar|khata|கடன்|பாக்கி/i.test(text)) targetView = 'credit';
    else if (/expenses|செலவு/i.test(text)) targetView = 'expenses';
    else if (/reports|analysis|அறிக்கை|பகுப்பாய்வு/i.test(text)) targetView = 'reports';
    else if (/memory|நினைவகம்|குறிப்பு/i.test(text)) targetView = 'memory';
    else if (/schemes|திட்டம்|மானியம்/i.test(text)) targetView = 'schemes';
    else if (/market|சந்தை|மண்டி/i.test(text)) targetView = 'market';
    else if (/settings|அமைப்பு/i.test(text)) targetView = 'settings';
    else if (/dashboard|முகப்பு|ஹோம்/i.test(text)) targetView = 'dashboard';

    entities.targetView = targetView;
    requiresConfirmation = false;
  }

  // 0.1 TOGGLE THEME Intent
  else if (/dark mode|light mode|theme|டார்க் மோட்|லைட் மோட்|தீம் மாற்று/i.test(text)) {
    intent = 'TOGGLE_THEME';
    confidence = 0.98;
    entities.themeTarget = /dark|டார்க்/i.test(text) ? 'dark' : /light|லைட்/i.test(text) ? 'light' : 'toggle';
    requiresConfirmation = false;
  }

  // 0.2 SPEAK WITH CUSTOMER Intent
  // e.g. "ரமேஷிடம் கடன் கேட்க எப்படி பேசுவது", "speak with customer ramesh", "talk to customer"
  else if (
    /பேசுவது|பேச|வாடிக்கையாளரிடம் பேச|உரையாடல்|speak with customer|talk to customer|customer script|how to ask credit/i.test(text)
  ) {
    intent = 'SPEAK_CUSTOMER';
    confidence = 0.95;
    entities.customer = entities.customer || 'M. Ramesh';
    requiresConfirmation = false;
  }

  // 0.3 ADD_PRODUCT Intent (Full voice product entry)
  // e.g. "Add product Ponni Rice 50 kg price 62 purchase price 52"
  // e.g. "புதிய பொருள் பொன்னி அரிசி 50 கிலோ விற்பனை விலை 62 அடக்க விலை 52"
  // e.g. "பொருளை சேர் துவரம் பருப்பு 25 கிலோ விலை 140"
  else if (
    /add product|new product|புதிய பொருள்|பொருளை சேர்|பொருள் சேர்|சரக்கு சேர்|சரக்கில் சேர்|add item/i.test(text) ||
    (/விற்பனை விலை|selling price|price|விலை/i.test(text) && /அடக்க விலை|purchase price|cost/i.test(text))
  ) {
    intent = 'ADD_PRODUCT';
    confidence = 0.96;
    requiresConfirmation = true;

    // Detect prices
    // Selling price: "selling price 62", "விலை 62", "விற்பனை விலை 62", "price 62"
    const sellMatch = text.match(/(?:விற்பனை விலை|selling price|sell price|price|விலை)\s*(?:₹|rs\.?)?\s*(\d+)/i);
    // Purchase/Cost price: "purchase price 52", "அடக்க விலை 52", "cost 52"
    const costMatch = text.match(/(?:அடக்க விலை|purchase price|cost price|cost|வாங்கிய விலை)\s*(?:₹|rs\.?)?\s*(\d+)/i);

    const sellPrice = sellMatch ? parseFloat(sellMatch[1]) : (entities.amount || 60);
    const buyPrice = costMatch ? parseFloat(costMatch[1]) : Math.round(sellPrice * 0.85);

    let prodName = entities.product || 'புதிய பொருள் (New Product)';
    let prodNameTa = 'புதிய மளிகைப் பொருள்';
    let cat = 'grains';

    if (/அரிசி|rice/i.test(text)) {
      prodName = 'Ponni Boiled Rice';
      prodNameTa = 'பொன்னி புழுங்கல் அரிசி';
      cat = 'grains';
    } else if (/எண்ணெய்|oil/i.test(text)) {
      prodName = 'Refined Sunflower Oil';
      prodNameTa = 'சூரியகாந்தி சமையல் எண்ணெய்';
      cat = 'oils';
    } else if (/பருப்பு|dal/i.test(text)) {
      prodName = 'Toor Dal Premium';
      prodNameTa = 'முதல் தர துவரம் பருப்பு';
      cat = 'pulses';
    } else if (/சர்க்கரை|sugar/i.test(text)) {
      prodName = 'Refined Sugar';
      prodNameTa = 'வெள்ளை சர்க்கரை';
      cat = 'general';
    } else if (/டீ|tea/i.test(text)) {
      prodName = 'Dust Tea Powder';
      prodNameTa = 'தேயிலைத் தூள்';
      cat = 'spices';
    }

    const qty = entities.quantity || 25;
    const unit = entities.unit || 'kg';

    entities.productName = prodName;
    entities.productNameTa = prodNameTa;
    entities.category = cat;
    entities.currentStock = qty;
    entities.unit = unit;
    entities.sellingPrice = sellPrice;
    entities.purchasePrice = buyPrice;
    entities.minStock = Math.max(5, Math.round(qty * 0.2));

    confirmationPromptTa = `புதிய பொருள்: "${prodNameTa}" (${qty} ${unit}, விற்பனை விலை: ₹${sellPrice}, அடக்க விலை: ₹${buyPrice}) சரக்கு இருப்பில் சேர்க்கவா?`;
    confirmationPromptEn = `Add new product "${prodName}" (${qty} ${unit} @ ₹${sellPrice}, Cost: ₹${buyPrice}) to inventory?`;
  }

  // 0.4 RECORD PAYMENT from Customer (Credit settlement)
  // e.g. "Murugan paid 5000", "ரமேஷ் 1000 ரூபாய் கடன் தந்தார்", "பணம் பெறப்பட்டது"
  else if (
    (/paid|கொடுத்தார்|தந்தார்|செலுத்தினார்|payment received|வசூல்/i.test(text) && entities.amount) ||
    (/ரமேஷ்|முருகன்|பிரியா/i.test(text) && /கடன் பணம் தந்தார்|கடன் செலுத்துதல்|paid credit/i.test(text))
  ) {
    intent = 'RECORD_PAYMENT';
    confidence = 0.95;
    requiresConfirmation = true;
    const party = entities.customer || 'Customer';
    confirmationPromptTa = `${party}-யிடமிருந்து ₹${entities.amount} கடன் வசூல் பதிவு செய்யவா?`;
    confirmationPromptEn = `Record ₹${entities.amount} debt recovery payment from ${party}?`;
  }

  // 0.5 ADD CUSTOMER
  else if (/add customer|புதிய வாடிக்கையாளர்|வாடிக்கையாளரை சேர்/i.test(text)) {
    intent = 'ADD_CUSTOMER';
    confidence = 0.94;
    requiresConfirmation = true;
    const phoneMatch = text.match(/(?:phone|mobile|எண்|number)?\s*([6-9]\d{9})/);
    const phone = phoneMatch ? phoneMatch[1] : '9842100000';
    entities.customerName = entities.customer || 'New Customer';
    entities.phone = phone;
    entities.creditLimit = entities.amount || 5000;
    confirmationPromptTa = `புதிய வாடிக்கையாளர் "${entities.customerName}" (தொலைபேசி: ${phone}, கடன் வரம்பு: ₹${entities.creditLimit}) சேர்க்கவா?`;
    confirmationPromptEn = `Add customer "${entities.customerName}" (Phone: ${phone}, Limit: ₹${entities.creditLimit})?`;
  }

  // 0.6 ADD SUPPLIER
  else if (/add supplier|புதிய விநியோகஸ்தர்|விநியோகஸ்தரை சேர்|சப்ளையர் சேர்/i.test(text)) {
    intent = 'ADD_SUPPLIER';
    confidence = 0.94;
    requiresConfirmation = true;
    const phoneMatch = text.match(/(?:phone|mobile|எண்|number)?\s*([6-9]\d{9})/);
    const phone = phoneMatch ? phoneMatch[1] : '9840011223';
    entities.supplierName = entities.supplier || 'Cauvery Wholesale Traders';
    entities.phone = phone;
    confirmationPromptTa = `புதிய விநியோகஸ்தர் "${entities.supplierName}" (தொலைபேசி: ${phone}) பட்டியலில் சேர்க்கவா?`;
    confirmationPromptEn = `Add wholesale supplier "${entities.supplierName}" (Phone: ${phone})?`;
  }

  // 0.7 RECORD SUPPLIER PAYMENT
  else if (
    (/paid supplier|செலுத்தினேன்|மில்லுக்கு கொடுத்தேன்|சப்ளையர் பணம்/i.test(text) && entities.amount) ||
    (/மில்|ட்ரேடர்ஸ்|traders|mill/i.test(text) && /செலுத்தினேன்|paid/i.test(text))
  ) {
    intent = 'RECORD_SUPPLIER_PAYMENT';
    confidence = 0.95;
    requiresConfirmation = true;
    const supName = entities.supplier || 'Supplier';
    confirmationPromptTa = `${supName}-க்கு ₹${entities.amount} செலுத்தியதை பதிவு செய்யவா?`;
    confirmationPromptEn = `Record ₹${entities.amount} supplier settlement to ${supName}?`;
  }

  // 0.8 SAVE BUSINESS MEMORY
  else if (/remember|நினைவில் கொள்|குறிப்பு எடு|note down|save note/i.test(text)) {
    intent = 'SAVE_MEMORY';
    confidence = 0.95;
    requiresConfirmation = false;
    entities.memoryContent = text.replace(/remember|நினைவில் கொள்|குறிப்பு எடு|note down|save note/gi, '').trim();
  }

  // 1. ADD_SALE Intent
  // e.g. "விற்றேன்", "விற்பனை", "sold", "sale", "viththen", "vitren"
  else if (
    /விற்றேன்|விற்பனை செய்தேன்|விற்பனை|sale panninen|vitren|viththen|sold|sell|record sale/i.test(text) ||
    (/ரமேஷ்|murugan|priya/i.test(text) && entities.amount && /கு|kku|ku/i.test(text) && !/credit|கடன்/i.test(text))
  ) {
    intent = 'ADD_SALE';
    confidence = 0.94;
    requiresConfirmation = true;
    const cust = entities.customer || 'Customer';
    const prod = entities.product || 'பொருட்கள் (Items)';
    const amt = entities.amount ? `₹${entities.amount}` : '';
    confirmationPromptTa = `${cust}-க்கு ${prod} ${amt} விற்பனை பதிவு செய்யவா?`;
    confirmationPromptEn = `Record sale of ${prod} for ${amt} to ${cust}?`;
  }

  // 2. ADD_PURCHASE Intent
  // e.g. "வாங்கினேன்", "வாங்கியது", "purchased", "bought", "vanginen"
  else if (/வாங்கினேன்|வாங்கியது|கொள்முதல்|purchase|bought|vanginen|load vanthuchi/i.test(text)) {
    intent = 'ADD_PURCHASE';
    confidence = 0.92;
    requiresConfirmation = true;
    const sup = entities.supplier || 'Supplier';
    const prod = entities.product || 'பொருட்கள் (Goods)';
    const amt = entities.amount ? `₹${entities.amount}` : '';
    confirmationPromptTa = `${sup}-லிருந்து ${prod} ${amt} கொள்முதல் (Purchase) பதிவு செய்யவா?`;
    confirmationPromptEn = `Record purchase of ${prod} for ${amt} from ${sup}?`;
  }

  // 3. ADD_EXPENSE Intent
  // e.g. "செலவு", "வாடகை", "மின்சார கட்டணம்", "expense", "selavu", "rent paid", "tea bill"
  else if (
    /செலவு|வாடகை|மின்சாரம்|சம்பளம்|கூலி|expense|rent|eb bill|salary|tea expense|selavu/i.test(text) &&
    entities.amount
  ) {
    intent = 'ADD_EXPENSE';
    confidence = 0.93;
    requiresConfirmation = true;
    let category = 'other';
    if (/வாடகை|rent/i.test(text)) category = 'rent';
    else if (/மின்சாரம்|eb|current|electricity/i.test(text)) category = 'electricity';
    else if (/சம்பளம்|salary/i.test(text)) category = 'salary';
    else if (/டீ|tea|snacks/i.test(text)) category = 'tea_snacks';
    else if (/கூலி|வண்டி|transport/i.test(text)) category = 'transport';
    entities.category = category;

    confirmationPromptTa = `₹${entities.amount} (${category}) செலவு கணக்கில் சேர்க்கவா?`;
    confirmationPromptEn = `Add expense of ₹${entities.amount} under ${category}?`;
  }

  // 4. CHECK_PROFIT Intent
  // e.g. "லாபம்", "profit", "laabam"
  else if (/லாபம்|profit|laabam|margin/i.test(text)) {
    intent = 'CHECK_PROFIT';
    confidence = 0.98;
  }

  // 5. CHECK_SALES Intent
  // e.g. "sales எவ்வளவு", "விற்பனை எவ்வளவு", "today sales", "inaiku sales"
  else if (/sales எவ்வளவு|விற்பனை எவ்வளவு|விற்பனை நிலவரம்|today sales|sales evalo|total sales/i.test(text)) {
    intent = 'CHECK_SALES';
    confidence = 0.97;
  }

  // 6. CHECK_INVENTORY Intent
  // e.g. "குறைவாக இருக்கு", "இருப்பு", "stock", "low stock", "out of stock"
  else if (/இருப்பு|குறைவாக|தீர்ந்து|stock|low stock|inventory|theernthu/i.test(text)) {
    intent = 'CHECK_INVENTORY';
    confidence = 0.96;
  }

  // 7. CHECK_CREDIT Intent
  // e.g. "கடன்", "credit", "kadan", "balance", "kudukanum"
  else if (/கடன்|பாக்கி|credit|udhar|kadan|tharanum|kudukanum|overdue/i.test(text)) {
    intent = 'CHECK_CREDIT';
    confidence = 0.95;
  }

  // 8. SCHEME_QUERY Intent
  // e.g. "scheme", "திட்டம்", "அரசு உதவி", "subsidy", "maniyam"
  else if (/திட்டம்|அரசு|மானியம்|scheme|subsidy|maniyam|pmegp|needs|mudra/i.test(text)) {
    intent = 'SCHEME_QUERY';
    confidence = 0.98;
  }

  // 9. MARKET_QUERY Intent
  // e.g. "சந்தை", "விலை நிலவரம்", "market", "mandi rate"
  else if (/சந்தை|சந்தை விலை|விலை நிலவரம்|market rate|mandi|wholesale price/i.test(text)) {
    intent = 'MARKET_QUERY';
    confidence = 0.95;
  }

  // 10. DAILY_SUMMARY Intent
  // e.g. "சுருக்கம்", "summary", "இன்றைய அறிக்கை"
  else if (/சுருக்கம்|அறிக்கை|summary|daily report|inaiku summary/i.test(text)) {
    intent = 'DAILY_SUMMARY';
    confidence = 0.96;
  }

  // 11. BUSINESS_ADVICE Intent
  // e.g. "வளர்க்க", "வளர்ச்சி", "grow", "advice", "recommendation"
  else if (/வளர்க்க|வளர்ச்சி|grow|advice|recommendation|increase profit|sales adhigam/i.test(text)) {
    intent = 'BUSINESS_ADVICE';
    confidence = 0.92;
  } else {
    // General business question
    intent = 'GENERAL_QUERY';
    confidence = 0.8;
  }

  return {
    intent,
    language: lang,
    confidence,
    entities,
    requiresConfirmation,
    confirmationPromptTa,
    confirmationPromptEn,
    rawText: text,
  };
}
