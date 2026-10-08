import { IntentRoutingDecision, ConversationMessage } from './intentRouter';
import { generateAiCompletion } from '../lib/aiClient';

export interface ConversationResponse {
  answer: string;
  mode: 'conversation' | 'clarification_needed';
  confidence: number;
  detectedLanguage: any;
  toolsExecuted: string[];
  latencyMs: number;
}

/**
 * Natural, deterministic responses for common conversational modes
 * Used as fast-path or reliable offline fallback
 */
function getDeterministicConversationalReply(
  mode: string,
  userMessage: string,
  langCode: string
): string {
  const lower = userMessage.toLowerCase();
  const isTa = langCode === 'ta';
  const isHi = langCode === 'hi';
  const isTe = langCode === 'te';

  // 1. GREETINGS
  if (mode === 'GREETING') {
    if (lower.includes('morning') || lower.includes('காலை')) {
      if (isTa) return 'காலை வணக்கம்! ☀️ இன்று உங்கள் வியாபாரத்திற்கு என்ன உதவி வேண்டும்?';
      if (isHi) return 'शुभ प्रभात! ☀️ आज मैं आपके व्यवसाय में क्या मदद कर सकता हूँ?';
      if (isTe) return 'శుభోదయం! ☀️ ఈరోజు మీ వ్యాపారానికి నేను ఎలా సహాయపడగలను?';
      return 'Good morning! ☀️ How can I help you with your business today?';
    }
    if (lower.includes('evening') || lower.includes('மாலை')) {
      if (isTa) return 'மாலை வணக்கம்! 🌇 உங்கள் கடை கணக்குகளை பார்க்கவா?';
      if (isHi) return 'शुभ संध्या! 🌇 आज का हिसाब-किताब देखें?';
      return 'Good evening! 🌇 Would you like to review your business records today?';
    }
    if (lower.includes('vanakkam') || lower.includes('வணக்கம்')) {
      return 'வணக்கம்! 🙏 இன்று உங்கள் வியாபாரத்தில் என்ன பார்க்க வேண்டும்? (விற்பனை, வரவு-செலவு, கடன் பாக்கி, இருப்பு)';
    }
    if (isTa) return 'வணக்கம்! 👋 இன்று உங்கள் வியாபாரத்திற்கு என்ன உதவி வேண்டும்?';
    if (isHi) return 'नमस्ते! 👋 आज मैं आपके व्यवसाय में क्या सहायता कर सकता हूँ?';
    if (isTe) return 'నమస్కారం! 👋 ఈరోజు మీ వ్యాపారంలో మీకు ఏమి సహాయం కావాలి?';
    return 'Hi! 👋 How can I help you with your business today?';
  }

  // 2. FAREWELL
  if (mode === 'FAREWELL') {
    if (lower.includes('night') || lower.includes('இரவு')) {
      if (isTa) return 'இனிய இரவு வணக்கம்! 🌙 கடையை பாதுகாப்பாக மூடிவிட்டு நன்றாக ஓய்வெடுங்கள்.';
      if (isHi) return 'शुभ रात्रि! 🌙 ध्यान रखें।';
      return 'Good night! 🌙 Take care and rest well.';
    }
    if (isTa) return 'நன்றி, போய் வாருங்கள்! 👋 நல்ல வியாபாரம் அமைய வாழ்த்துகள். தேவைப்படும்போது அழைக்கவும்.';
    if (isHi) return 'अलविदा! 👋 आपका दिन शुभ हो। जब भी जरूरत हो, मैं यहीं हूँ।';
    if (isTe) return 'వీడ్కోలు! 👋 మీకు మంచి వ్యాపారం జరగాలని కోరుకుంటున్నాను.';
    return 'Bye! 👋 Have a great day ahead. I am here whenever you need me.';
  }

  // 3. THANKS
  if (mode === 'THANKS') {
    if (isTa) return 'மகிழ்ச்சி! 😊 வேறு ஏதேனும் விவரங்கள் அல்லது கணக்குகள் பார்க்க வேண்டுமா?';
    if (isHi) return 'स्वागत है! 😊 क्या आपको किसी और चीज़ में मदद चाहिए?';
    if (isTe) return 'ధన్యవాదాలు! 😊 మీకు ఇంకా ఏదైనా సహాయం కావాలా?';
    return "You're welcome! 😊 Let me know if you need help with anything else.";
  }

  // 4. SMALL TALK ("How are you", "What's up", etc.)
  if (mode === 'SMALL_TALK') {
    if (lower.includes('how are you') || lower.includes('epdi irukinga') || lower.includes('எப்படி இருக்கீங்க')) {
      if (isTa) return 'நான் சிறப்பாக உள்ளேன்! 😊 உங்கள் வியாபாரம் இன்று எப்படி செல்கிறது?';
      if (isHi) return 'मैं बहुत अच्छा हूँ! 😊 आपका व्यवसाय आज कैसा चल रहा है?';
      return "I'm doing great, thank you! 😊 How is business going today?";
    }
    if (lower.includes('who are you') || lower.includes('who r u') || lower.includes('யார் நீ')) {
      if (isTa) return 'நான் உங்கள் உரிமையாளர் AI (Urimaiyalar AI) — உங்கள் வியாபாரத்தை வழிநடத்தும் தனிப்பட்ட AI Business CFO & Manager.';
      return "I'm Urimaiyalar AI — your personal intelligent business assistant designed for Indian MSMEs and merchants.";
    }
    if (isTa) return 'நான் எப்போதும் உங்கள் கடை வேலைகளில் உதவ தயாராக உள்ளேன்! 👍';
    return "I'm right here and ready to assist your store operations! 👍";
  }

  // 5. CASUAL ACKNOWLEDGMENT ("okay", "cool", "super")
  if (mode === 'CASUAL_CONVERSATION') {
    if (isTa) return 'சரிங்க! 👍 தேவைப்படும்போது கேளுங்கள்.';
    if (isHi) return 'ठीक है! 👍 जरूरत पड़ने पर बताइएगा।';
    return 'Got it! 👍 Feel free to ask anytime.';
  }

  // 6. HELP REQUEST
  if (mode === 'HELP') {
    if (isTa) {
      return `🤝 **உரிமையாளர் AI உங்களுக்கு உதவக்கூடியவை:**\n\n1. 📊 **விற்பனை விவரம்:** "இன்றைய விற்பனை எவ்வளவு?"\n2. 💰 **லாப-நஷ்டம்:** "இந்த மாத நிகர லாபம் என்ன?"\n3. 📦 **சரக்கு இருப்பு:** "எந்தெந்த பொருட்கள் ஸ்டாக் குறைவாக உள்ளது?"\n4. 👥 **வாடிக்கையாளர் கடன்:** "ரமேஷ் எவ்வளவு பாக்கி வைத்துள்ளார்?"\n5. ⚡ **தானியங்கி பதிவு:** "₹500 விற்பனை சேர்", "₹200 செலவு சேர்"\n6. 🏛️ **அரசு மானியங்கள்:** "NEEDS திட்டத்திற்கு நான் தகுதியானவனா?"\n\nநீங்கள் எதை அறிய விரும்புகிறீர்கள்?`;
    }
    return `🤝 **Here is what I can do for your business:**\n\n1. 📊 **Sales:** "How much did I sell today?"\n2. 💰 **Finance & P&L:** "Show my profit margin and expenses."\n3. 📦 **Inventory:** "Which products are low on stock?"\n4. 👥 **Customer Dues:** "How much does Ramesh owe me?"\n5. ⚡ **Instant Actions:** "Add ₹500 sale", "Record ₹200 expense"\n6. 🏛️ **Govt Subsidies:** "Am I eligible for NEEDS / PMEGP?"\n\nWhat would you like to check today?`;
  }

  // Default fallback
  return isTa
    ? 'வணக்கம்! உங்கள் கடை விற்பனை, வரவு-செலவு அல்லது அரசு மானிய விவரங்கள் பற்றி என்ன அறிய வேண்டும்?'
    : 'Hello! How can I assist with your sales, inventory, expenses, or government subsidies today?';
}

/**
 * Handles all conversational, greeting, thanks, and small-talk queries
 * Guarantees zero business database calls and zero hallucinated analytics
 */
export async function handleConversation(
  decision: IntentRoutingDecision,
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<ConversationResponse> {
  const start = Date.now();
  const langCode = decision.detected_language.code;

  // If clarification needed
  if (decision.mode === 'CLARIFICATION' && decision.clarification_prompt) {
    return {
      answer: decision.clarification_prompt,
      mode: 'clarification_needed',
      confidence: decision.confidence,
      detectedLanguage: decision.detected_language,
      toolsExecuted: ['conversation_handler'],
      latencyMs: Date.now() - start,
    };
  }

  // Attempt dynamic conversational synthesis using LLM with conversational context
  try {
    const systemPrompt = `You are Urimaiyalar AI, a friendly, courteous, and professional conversational business assistant for MSMEs.
CURRENT USER INTENT: ${decision.mode}
USER DETECTED LANGUAGE: ${decision.detected_language.name} (${langCode})

CRITICAL RULES:
1. Respond naturally, warmly, and concisely in the user's language (${decision.detected_language.name}).
2. NEVER mention or invent any business numbers, revenue figures, stock items, customer dues, or accounting stats!
3. If user says greeting (Hi/Hello/Good morning), give a warm, brief greeting and ask how you can help their business.
4. If user says thanks, say you're welcome warmly.
5. If user says bye/good night, give a polite, warm farewell.
6. Keep the response crisp (1-2 sentences max). Do NOT be overly verbose.`;

    const completion = await generateAiCompletion({
      prompt: `User: "${userMessage}"`,
      systemPrompt,
      conversationHistory: conversationHistory.slice(-3),
      temperature: 0.4,
      maxTokens: 100,
    });

    if (completion.text && completion.text.trim().length > 0) {
      return {
        answer: completion.text.trim(),
        mode: 'conversation',
        confidence: decision.confidence,
        detectedLanguage: decision.detected_language,
        toolsExecuted: ['conversation_handler'],
        latencyMs: Date.now() - start,
      };
    }
  } catch (err) {
    console.warn('[CONVERSATION HANDLER] LLM failover to deterministic reply:', err);
  }

  // High-quality deterministic fallback
  const fallbackReply = getDeterministicConversationalReply(decision.mode, userMessage, langCode);

  return {
    answer: fallbackReply,
    mode: 'conversation',
    confidence: decision.confidence,
    detectedLanguage: decision.detected_language,
    toolsExecuted: ['conversation_handler'],
    latencyMs: Date.now() - start,
  };
}
