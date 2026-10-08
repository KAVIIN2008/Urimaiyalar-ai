import { detectLanguage, DetectedLanguageResult } from './languageDetector';
import { generateAiCompletion } from '../lib/aiClient';
import { AgentDomain } from './multiAgentSystem';

export type MessageRoutingMode =
  | 'GREETING'
  | 'FAREWELL'
  | 'THANKS'
  | 'SMALL_TALK'
  | 'CASUAL_CONVERSATION'
  | 'BUSINESS_QUERY'
  | 'BUSINESS_ACTION'
  | 'BUSINESS_ANALYSIS'
  | 'GOVERNMENT_SCHEME_QUERY'
  | 'HELP'
  | 'CLARIFICATION'
  | 'UNSUPPORTED';

export type OperationType = 'READ' | 'WRITE' | 'UPDATE' | 'DELETE' | 'CONVERSATION' | 'NONE';

export interface IntentRoutingDecision {
  mode: MessageRoutingMode;
  confidence: number;
  requires_business_agent: boolean;
  requires_database: boolean;
  requires_rag: boolean;
  requires_action: boolean;
  operation_type: OperationType;
  target_domains: AgentDomain[];
  action_intent?: string;
  extracted_entities?: Record<string, any>;
  clarification_prompt?: string;
  reasoning: string;
  detected_language: DetectedLanguageResult;
  context_reference?: string;
}

export interface ConversationMessage {
  role: string;
  content: string;
}

/**
 * Normalizes input text and trims excessive punctuation
 */
function cleanQuery(text: string): string {
  return text.trim().toLowerCase().replace(/[!?.,;]+$/, '');
}

/**
 * Checks for pure greetings in English, Tamil, Tanglish, Hindi, Telugu, etc.
 */
function isGreeting(text: string): boolean {
  const t = cleanQuery(text);
  const patterns = [
    /^(hi+|hey+|heyy+|hello+|hlo+|hola|hoi|hie)\b/i,
    /^(good\s+(morning|afternoon|evening|day|noon))\b/i,
    /^(vanakkam|vaanakkam|வணக்கம்|namaste|namaskaram|namaskara|namashkar)\b/i,
    /^(hi\s+(there|bro|sir|mam|friend|da|machan|anna|ji))\b/i,
    /^(hello\s+(there|bro|sir|mam|friend|da|ji|anna))\b/i,
    /^(hey\s+(there|bro|sir|mam|da|ji))\b/i,
    /^(vanakkam\s+(bro|sir|anna|ji|da))\b/i,
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Checks for farewells
 */
function isFarewell(text: string): boolean {
  const t = cleanQuery(text);
  const patterns = [
    /^(bye+|goodbye+|bye\s+bye|cya|see\s+ya|see\s+you|see\s+you\s+later)\b/i,
    /^(good\s*night|gn|shubh\s*ratri|இரவு\s*வணக்கம்)\b/i,
    /^(poitu\s*varen|poittu\s*varan|போயிட்டு\s*வரேன்|varata|வரட்டா)\b/i,
    /^(alvida|tata|ta\s*ta)\b/i,
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Checks for thanks / appreciation
 */
function isThanks(text: string): boolean {
  const t = cleanQuery(text);
  const patterns = [
    /^(thanks+|thank\s+you|thank\s+u|thx|thnx|tq|ty)\b/i,
    /^(thanks\s+(a\s+lot|so\s+much|bro|sir|da|ji|anna))\b/i,
    /^(thank\s+you\s+(so\s+much|very\s+much|bro|sir|da))\b/i,
    /^(nandri|nanri|romba\s+nandri|நன்றி|மிக்க\s+நன்றி|dhanyawad|dhanyavadamulu)\b/i,
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Checks for small talk like "how are you", "who are you", etc.
 */
function isSmallTalk(text: string): boolean {
  const t = cleanQuery(text);
  const patterns = [
    /^(how\s+are\s+you|how\s+r\s+u|how\s+are\s+you\s+doing|how's\s+it\s+going|hows\s+it\s+going)\b/i,
    /^(what's\s+up|wassup|sup|watsup)\b/i,
    /^(who\s+are\s+you|who\s+r\s+u|what\s+is\s+your\s+name|what\s+can\s+you\s+do)\b/i,
    /^(eppadi\s+irukinga|eppadi\s+irukka|epdi\s+irukinga|எப்படி\s+இருக்கீங்க|எப்படி\s+இருக்க)\b/i,
    /^(nalla\s+irukingala|nalla\s+irukiya|நல்லா\s+இருக்கீங்களா)\b/i,
    /^(aap\s+kaise\s+hain|kaise\s+ho|tum\s+kaise\s+ho|kela\s+unnav)\b/i,
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Checks for acknowledgment / filler casual phrases
 */
function isCasualAck(text: string): boolean {
  const t = cleanQuery(text);
  const patterns = [
    /^(ok+|okay+|k|kk|alright|cool|great|awesome|perfect|nice|fine|done|got\s+it|understood)\b/i,
    /^(sari+|seri+|சரி|ஆமாம்|aama|aamanga|super|semma|apdiya)\b/i,
    /^(theek\s+hai|accha|acha|sahi\s+hai|theek)\b/i,
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Checks for Help requests
 */
function isHelpRequest(text: string): boolean {
  const t = cleanQuery(text);
  return (
    t === 'help' ||
    t === 'உதவி' ||
    t === 'help me' ||
    t === 'how to use' ||
    t === 'features' ||
    t.includes('what can you do') ||
    t.includes('என்ன செய்ய முடியும்')
  );
}

/**
 * Detects whether the query has an embedded business request despite conversational opening/closing
 * e.g. "hi but tell me today's sales" -> has business query!
 * e.g. "thanks, now add 500 sales" -> has business action!
 */
function hasEmbeddedBusinessRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const businessSignals = [
    'sale', 'sales', 'விற்பனை', 'bill', 'revenue', 'income',
    'expense', 'செலவு', 'rent', 'current bill',
    'profit', 'லாபம்', 'margin',
    'stock', 'சரக்கு', 'இருப்பு', 'inventory', 'item', 'product',
    'customer', 'வாடிக்கையாளர்', 'credit', 'கடன்', 'பாக்கி', 'due', 'udhar',
    'supplier', 'சப்ளையர்', 'purchase', 'கொள்முதல்',
    'scheme', 'திட்டம்', 'subsidy', 'மானியம்', 'needs', 'uyegp', 'pmegp', 'mudra', 'cgtmse',
    'add ', 'சேர்', 'update', 'delete', 'remove', 'record',
    'how much', 'evlo', 'எவ்வளவு', 'kitna',
  ];

  return businessSignals.some((s) => lower.includes(s));
}

/**
 * Checks if query is ambiguous or needs context resolution
 */
function isAmbiguousInstruction(text: string): boolean {
  const t = cleanQuery(text);
  const patterns = [
    /^(make\s+it\s+better|improve\s+it|do\s+that|do\s+it|do\s+this)\b/i,
    /^(add\s+it|add\s+that|remove\s+it|remove\s+that|delete\s+it|update\s+it)\b/i,
    /^(change\s+it|fix\s+it|solve\s+it|try\s+again)\b/i,
  ];
  return patterns.some((p) => p.test(t));
}

/**
 * Checks for contextual follow-up questions referencing previous answers
 * e.g. "Is that good?", "Why?", "What about yesterday?", "Add ₹250 more"
 */
function isContextualFollowUp(text: string, history: ConversationMessage[]): { isFollowUp: boolean; targetTopic?: string } {
  if (history.length === 0) return { isFollowUp: false };
  const lower = text.toLowerCase();

  const isFollowUpPattern = (
    lower.includes('is that') ||
    lower.includes('was that') ||
    lower.includes('adhu nalladha') ||
    lower.includes('nalladha') ||
    lower.includes('adhu epdi') ||
    lower.includes('why') ||
    lower.includes('yen') ||
    lower.includes('ennachi') ||
    lower.includes('what about') ||
    lower.includes('how about') ||
    lower.includes('yesterday') ||
    lower.includes('netru') ||
    lower.includes('last month') ||
    lower.includes('add ') && lower.includes('more') ||
    lower.includes('innum')
  );

  if (!isFollowUpPattern) return { isFollowUp: false };

  // Scan last assistant message for context topic
  const lastBotMsg = [...history].reverse().find((m) => m.role === 'assistant');
  let targetTopic = 'sales';
  if (lastBotMsg) {
    const botText = lastBotMsg.content.toLowerCase();
    if (botText.includes('expense') || botText.includes('செலவு')) targetTopic = 'finance';
    else if (botText.includes('stock') || botText.includes('இருப்பு')) targetTopic = 'inventory';
    else if (botText.includes('customer') || botText.includes('கடன்') || botText.includes('பாக்கி')) targetTopic = 'customer';
    else if (botText.includes('scheme') || botText.includes('மானியம்')) targetTopic = 'rag';
    else if (botText.includes('sale') || botText.includes('விற்பனை')) targetTopic = 'sales';
  }

  return { isFollowUp: true, targetTopic };
}

/**
 * Master Intent Router
 * Classifies any incoming user message into structured routing decision
 */
export async function routeIntent(
  userQuery: string,
  conversationHistory: ConversationMessage[] = []
): Promise<IntentRoutingDecision> {
  const detectedLang = detectLanguage(userQuery);
  const trimmed = userQuery.trim();
  const lower = trimmed.toLowerCase();

  // 1. FAST CASUAL CLASSIFICATION (High-Confidence, No Embedded Business Ask)
  const hasBusinessAsk = hasEmbeddedBusinessRequest(trimmed);

  if (!hasBusinessAsk) {
    // 1A. GREETING
    if (isGreeting(trimmed)) {
      return {
        mode: 'GREETING',
        confidence: 0.99,
        requires_business_agent: false,
        requires_database: false,
        requires_rag: false,
        requires_action: false,
        operation_type: 'CONVERSATION',
        target_domains: [],
        reasoning: 'Direct greeting without business query parameters.',
        detected_language: detectedLang,
      };
    }

    // 1B. FAREWELL
    if (isFarewell(trimmed)) {
      return {
        mode: 'FAREWELL',
        confidence: 0.99,
        requires_business_agent: false,
        requires_database: false,
        requires_rag: false,
        requires_action: false,
        operation_type: 'CONVERSATION',
        target_domains: [],
        reasoning: 'Direct departure or farewell intent.',
        detected_language: detectedLang,
      };
    }

    // 1C. THANKS
    if (isThanks(trimmed)) {
      return {
        mode: 'THANKS',
        confidence: 0.99,
        requires_business_agent: false,
        requires_database: false,
        requires_rag: false,
        requires_action: false,
        operation_type: 'CONVERSATION',
        target_domains: [],
        reasoning: 'User expressing appreciation/gratitude.',
        detected_language: detectedLang,
      };
    }

    // 1D. SMALL TALK ("How are you", "who are you")
    if (isSmallTalk(trimmed)) {
      return {
        mode: 'SMALL_TALK',
        confidence: 0.98,
        requires_business_agent: false,
        requires_database: false,
        requires_rag: false,
        requires_action: false,
        operation_type: 'CONVERSATION',
        target_domains: [],
        reasoning: 'Conversational check-in or assistant identity query.',
        detected_language: detectedLang,
      };
    }

    // 1E. CASUAL ACKNOWLEDGMENT ("okay", "cool", "super")
    if (isCasualAck(trimmed)) {
      return {
        mode: 'CASUAL_CONVERSATION',
        confidence: 0.95,
        requires_business_agent: false,
        requires_database: false,
        requires_rag: false,
        requires_action: false,
        operation_type: 'CONVERSATION',
        target_domains: [],
        reasoning: 'Conversational acknowledgment or confirmation.',
        detected_language: detectedLang,
      };
    }

    // 1F. HELP REQUEST
    if (isHelpRequest(trimmed)) {
      return {
        mode: 'HELP',
        confidence: 0.98,
        requires_business_agent: false,
        requires_database: false,
        requires_rag: false,
        requires_action: false,
        operation_type: 'CONVERSATION',
        target_domains: [],
        reasoning: 'User asking for OS feature directory or capabilities.',
        detected_language: detectedLang,
      };
    }

    // 1G. AMBIGUOUS INSTRUCTION ("Make it better", "Do that")
    if (isAmbiguousInstruction(trimmed)) {
      return {
        mode: 'CLARIFICATION',
        confidence: 0.55,
        requires_business_agent: false,
        requires_database: false,
        requires_rag: false,
        requires_action: false,
        operation_type: 'NONE',
        target_domains: [],
        clarification_prompt:
          detectedLang.code === 'ta'
            ? 'மன்னிக்கவும் — எதை மாற்ற அல்லது செயல்படுத்த விரும்புகிறீர்கள் என்பதை சற்று தெளிவாக கூற முடியுமா?'
            : 'Sure — could you please clarify what specific item or action you would like me to work on?',
        reasoning: 'Under-specified instruction requiring user clarification.',
        detected_language: detectedLang,
      };
    }
  }

  // 2. CONTEXTUAL FOLLOW-UP HANDLING
  const followUpCheck = isContextualFollowUp(trimmed, conversationHistory);
  if (followUpCheck.isFollowUp) {
    // If user says "Add ₹250 more"
    const addMoreMatch = trimmed.match(/(?:add|சேர்|innum)?\s*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:more|innum|ரூபாய்)?/i);
    if (addMoreMatch && (lower.includes('add') || lower.includes('more') || lower.includes('innum'))) {
      const amount = parseFloat(addMoreMatch[1].replace(/,/g, ''));
      return {
        mode: 'BUSINESS_ACTION',
        confidence: 0.94,
        requires_business_agent: true,
        requires_database: true,
        requires_rag: false,
        requires_action: true,
        operation_type: 'WRITE',
        target_domains: ['action'],
        action_intent: 'ADD_SALE',
        extracted_entities: { amount, item: 'Sales adjustment from context' },
        context_reference: `Follow-up addition to previous ${followUpCheck.targetTopic}`,
        reasoning: `Contextual addition of ₹${amount} applied to ${followUpCheck.targetTopic}.`,
        detected_language: detectedLang,
      };
    }

    // If user says "Is that good?" or "Adhu nalladha?"
    if (lower.includes('good') || lower.includes('nalladha') || lower.includes('epdi') || lower.includes('why') || lower.includes('yen')) {
      return {
        mode: 'BUSINESS_ANALYSIS',
        confidence: 0.92,
        requires_business_agent: true,
        requires_database: true,
        requires_rag: false,
        requires_action: false,
        operation_type: 'READ',
        target_domains: ['finance', 'sales', 'insights'],
        context_reference: `Evaluating quality/context of previous ${followUpCheck.targetTopic}`,
        reasoning: `Contextual business health appraisal on ${followUpCheck.targetTopic}.`,
        detected_language: detectedLang,
      };
    }
  }

  // 3. ACTION INTENT CLASSIFICATION (WRITE / UPDATE / DELETE)
  const isActionSignal = (
    /(\badd\b|\binsert\b|\brecord\b|\bseru\b|\bசேர்\b|\bபதிவு\b|\bpannu\b|\bசெய்\b)/i.test(lower) ||
    /(\bdelete\b|\bremove\b|\bcancel\b|\bநீக்கு\b|\brathu\b)/i.test(lower) ||
    /(\bupdate\b|\bchange\b|\bமாற்று\b)/i.test(lower) ||
    /(\bpaid\b|\bsettled\b|\bகொடுத்தார்\b|\bசெலுத்தினார்\b)/i.test(lower)
  );

  if (isActionSignal) {
    let actionIntent = 'GENERAL_ACTION';
    let opType: OperationType = 'WRITE';

    if (/delete|remove|cancel|நீக்கு|ரத்து/i.test(lower)) opType = 'DELETE';
    else if (/update|change|மாற்று/i.test(lower)) opType = 'UPDATE';

    if (/sale|sales|bill|விற்பனை/i.test(lower)) actionIntent = 'ADD_SALE';
    else if (/expense|செலவு|rent|current bill/i.test(lower)) actionIntent = 'ADD_EXPENSE';
    else if (/stock|சரக்கு|inventory|packet|kg|unit/i.test(lower)) actionIntent = 'UPDATE_STOCK';
    else if (/paid|settled|கொடுத்தார்|பணம்/i.test(lower)) actionIntent = 'RECORD_CUSTOMER_PAYMENT';

    return {
      mode: 'BUSINESS_ACTION',
      confidence: 0.95,
      requires_business_agent: true,
      requires_database: true,
      requires_rag: false,
      requires_action: true,
      operation_type: opType,
      target_domains: ['action'],
      action_intent: actionIntent,
      reasoning: `Business mutation action detected: ${actionIntent} (${opType}).`,
      detected_language: detectedLang,
    };
  }

  // 4. GOVERNMENT SCHEMES & SUBSIDIES QUERY
  const isScheme = (
    lower.includes('scheme') || lower.includes('subsidy') || lower.includes('திட்டம்') || lower.includes('மானியம்') ||
    lower.includes('msme') || lower.includes('needs') || lower.includes('நீட்ஸ்') || lower.includes('uyegp') ||
    lower.includes('pmegp') || lower.includes('cgtmse') || lower.includes('beiss') || lower.includes('peace') ||
    lower.includes('mudra') || lower.includes('subvention') || lower.includes('grant') ||
    lower.includes('योजना') || lower.includes('सब्सिडी') || lower.includes('పథకం') || lower.includes('ಯೋಜನೆ') ||
    ((lower.includes('eligible') || lower.includes('தகுதி') || lower.includes('apply') || lower.includes('portal') || lower.includes('website')) &&
     (lower.includes('needs') || lower.includes('uyegp') || lower.includes('pmegp') || lower.includes('subsidy') || lower.includes('scheme') || lower.includes('government') || lower.includes('அரசு')))
  );

  if (isScheme) {
    return {
      mode: 'GOVERNMENT_SCHEME_QUERY',
      confidence: 0.98,
      requires_business_agent: true,
      requires_database: true,
      requires_rag: true,
      requires_action: false,
      operation_type: 'READ',
      target_domains: ['rag'],
      reasoning: 'Government MSME subsidy, loan, or eligibility query.',
      detected_language: detectedLang,
    };
  }

  // 5. SPECIFIC DOMAIN READ QUERIES
  const asksSales = (
    lower.includes('sales') || lower.includes('விற்பனை') || lower.includes('bill') || lower.includes('revenue') ||
    lower.includes('बिक्री') || lower.includes('bikri') || lower.includes('అమ్మకాలు') || lower.includes('ammakam') ||
    lower.includes('ಮಾರಾಟ') || lower.includes('marata') || lower.includes('വിൽപ്പന') || lower.includes('vilpana') ||
    lower.includes('how much did i sell') || lower.includes('today sales')
  );

  const asksFinance = (
    lower.includes('profit') || lower.includes('லாபம்') || lower.includes('expense') || lower.includes('செலவு') ||
    lower.includes('cash') || lower.includes('finance') || lower.includes('मुनाफा') || lower.includes('लाभ') ||
    lower.includes('खर्च') || lower.includes('kharch') || lower.includes('లాభం') || lower.includes('ఖర్చు') ||
    lower.includes('லாப விகிதம்') || lower.includes('margins')
  );

  const asksInventory = (
    lower.includes('stock') || lower.includes('சரக்கு') || lower.includes('இருப்பு') || lower.includes('order') ||
    lower.includes('low stock') || lower.includes('reorder') || lower.includes('ஸ்டாக்') || lower.includes('பொருள்')
  );

  const asksCustomer = (
    lower.includes('customer') || lower.includes('வாடிக்கையாளர்') || lower.includes('கடன்') || lower.includes('பாக்கி') ||
    lower.includes('due') || lower.includes('udhar') || lower.includes('ரமேஷ்') || lower.includes('மகேஷ்') || lower.includes('சுரேஷ்') ||
    lower.includes('owe') || lower.includes('borrow')
  );

  const targetDomains: AgentDomain[] = [];
  if (asksSales) targetDomains.push('sales');
  if (asksFinance) targetDomains.push('finance');
  if (asksInventory) targetDomains.push('inventory');
  if (asksCustomer) targetDomains.push('customer');

  if (targetDomains.length > 0) {
    const isComplex = targetDomains.length > 1 || lower.includes('why') || lower.includes('compare') || lower.includes('analysis');
    return {
      mode: isComplex ? 'BUSINESS_ANALYSIS' : 'BUSINESS_QUERY',
      confidence: 0.95,
      requires_business_agent: true,
      requires_database: true,
      requires_rag: false,
      requires_action: false,
      operation_type: 'READ',
      target_domains: targetDomains,
      reasoning: `Targeted business domain read query: ${targetDomains.join(', ')}.`,
      detected_language: detectedLang,
    };
  }

  // 6. GENERAL BUSINESS OVERVIEW OR FALLBACK
  const asksOverview = (
    lower.includes('business overview') || lower.includes('business status') ||
    lower.includes('வியாபாரம் எப்படி இருக்கு') || lower.includes('overall') ||
    lower.includes('business health') || lower.includes('performance')
  );

  if (asksOverview) {
    return {
      mode: 'BUSINESS_ANALYSIS',
      confidence: 0.90,
      requires_business_agent: true,
      requires_database: true,
      requires_rag: false,
      requires_action: false,
      operation_type: 'READ',
      target_domains: ['sales', 'finance', 'inventory', 'customer'],
      reasoning: 'Comprehensive multi-domain business health overview.',
      detected_language: detectedLang,
    };
  }

  // 7. DEFAULT TO CASUAL CONVERSATION (Prevent Random Business Injections!)
  return {
    mode: 'CASUAL_CONVERSATION',
    confidence: 0.80,
    requires_business_agent: false,
    requires_database: false,
    requires_rag: false,
    requires_action: false,
    operation_type: 'CONVERSATION',
    target_domains: [],
    reasoning: 'Non-business conversational inquiry defaulting to friendly conversation handler.',
    detected_language: detectedLang,
  };
}
