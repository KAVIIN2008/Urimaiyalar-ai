// scripts/test-chat-routing.mjs
// Automated verification suite for Urimaiyalar AI Intelligent Intent Router & ChatGPT-Style Conversational Layer

const BASE_URL = 'http://localhost:3000';

async function queryAssistant(message, conversationHistory = [], language = 'en') {
  const res = await fetch(`${BASE_URL}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory, language }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  return res.json();
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 TEST SUITE: URIMAIYALAR AI CONVERSATIONAL & ROUTING LAYER');
  console.log('===============================================================\n');

  // TEST 1: CASUAL CONVERSATION TESTS (MUST NOT TOUCH BUSINESS AGENTS OR REVENUE)
  console.log('--- TEST GROUP 1: Casual Conversation (Zero Biz Agents / Zero DB Numbers) ---');
  const casualPhrases = [
    { input: 'Hi', expectedMode: 'conversation' },
    { input: 'Hello', expectedMode: 'conversation' },
    { input: 'Good morning', expectedMode: 'conversation' },
    { input: 'How are you?', expectedMode: 'conversation' },
    { input: 'Thanks', expectedMode: 'conversation' },
    { input: 'Okay', expectedMode: 'conversation' },
    { input: 'Bye', expectedMode: 'conversation' },
    { input: 'Good night', expectedMode: 'conversation' },
    { input: 'Vanakkam bro', expectedMode: 'conversation' },
    { input: 'Romba nandri', expectedMode: 'conversation' },
  ];

  for (const { input, expectedMode } of casualPhrases) {
    const res = await queryAssistant(input);
    const hasRandomFinance = /₹\s*\d{2,}|bill count|revenue|gross profit|margin/i.test(res.answer);
    assert(res.mode === expectedMode, `"${input}" -> mode is "${res.mode}" (expected "${expectedMode}")`);
    assert(!hasRandomFinance, `"${input}" -> does NOT leak random finance numbers (Answer: "${res.answer.slice(0, 60)}...")`);
    assert(!res.agentResults || Object.keys(res.agentResults).length === 0, `"${input}" -> did NOT execute specialist agents`);
  }

  // TEST 2: BUSINESS QUERIES (MUST ROUTE TO SPECIFIC SPECIALIST AGENT)
  console.log('\n--- TEST GROUP 2: Business Queries (Specialist Agent Routing) ---');
  {
    const res = await queryAssistant('How much did I sell today?');
    assert(res.mode === 'multi_agent_query', 'Today sales query -> mode is multi_agent_query');
    assert(res.agentResults?.sales !== undefined, 'Today sales query -> executed Sales Agent');
    assert(/₹|\d+/i.test(res.answer), `Today sales query -> returns real sales data ("${res.answer.slice(0, 80)}...")`);
  }

  {
    const res = await queryAssistant('Show my expenses');
    assert(res.agentResults?.finance !== undefined, 'Show expenses query -> executed Finance Agent');
  }

  {
    const res = await queryAssistant('Which products are low in stock?');
    assert(res.agentResults?.inventory !== undefined, 'Low stock query -> executed Inventory Agent');
  }

  {
    const res = await queryAssistant('What government subsidy can I get under NEEDS?');
    assert(res.agentResults?.rag !== undefined, 'NEEDS scheme query -> executed RAG Agent');
  }

  // TEST 3: BUSINESS ACTION ROUTING (MUTATION VIA TOOLS)
  console.log('\n--- TEST GROUP 3: Business Action Routing ---');
  {
    const res = await queryAssistant('Add ₹500 sales');
    assert(res.mode === 'intent_executed', `Add ₹500 sales -> mode is intent_executed (Answer: "${res.answer.slice(0, 60)}...")`);
    assert(res.execution?.success === true, 'Add ₹500 sales -> executed successfully in database');
  }

  // TEST 4: CONTEXTUAL FOLLOW-UP AWARENESS
  console.log('\n--- TEST GROUP 4: Contextual Follow-Up Awareness ---');
  {
    // Step A: Sales Query
    const stepA = await queryAssistant('How much did I sell today?');
    const history = [
      { role: 'user', content: 'How much did I sell today?' },
      { role: 'assistant', content: stepA.answer },
    ];

    // Step B: Follow-up "Is that good?"
    const stepB = await queryAssistant('Is that good?', history);
    assert(stepB.decision?.mode === 'BUSINESS_ANALYSIS', `Follow-up "Is that good?" -> understood as BUSINESS_ANALYSIS`);
    assert(!stepB.answer.toLowerCase().includes('how can i help you with your business'), `Follow-up "Is that good?" -> did NOT stupidly restart conversation`);

    // Step C: Contextual addition "Add ₹250 more"
    history.push({ role: 'user', content: 'Is that good?' });
    history.push({ role: 'assistant', content: stepB.answer });
    const stepC = await queryAssistant('Add ₹250 more', history);
    assert(stepC.mode === 'intent_executed' || stepC.decision?.action_intent === 'ADD_SALE', `Contextual "Add ₹250 more" -> detected ADD_SALE`);
  }

  // TEST 5: ADVERSARIAL & COMPOUND QUERIES
  console.log('\n--- TEST GROUP 5: Adversarial & Compound Queries ---');
  {
    const res = await queryAssistant("hi but tell me today's sales");
    assert(res.decision?.mode === 'BUSINESS_QUERY' || res.agentResults?.sales !== undefined, '"hi but tell me today\'s sales" -> routed to Sales');
  }

  {
    const res = await queryAssistant('thanks, now add 500 sales');
    assert(res.decision?.mode === 'BUSINESS_ACTION' || res.mode === 'intent_executed', '"thanks, now add 500 sales" -> identified business action');
  }

  {
    const res = await queryAssistant('bye, one more thing, what is my profit?');
    assert(res.decision?.mode === 'BUSINESS_QUERY' || res.agentResults?.finance !== undefined, '"bye, one more thing, what is my profit?" -> answered profit');
  }

  // TEST 6: AMBIGUOUS QUERY (CLARIFICATION REQUIRED)
  console.log('\n--- TEST GROUP 6: Ambiguous Instruction (Clarification) ---');
  {
    const res = await queryAssistant('Make it better');
    assert(res.mode === 'clarification_needed' || res.decision?.mode === 'CLARIFICATION', '"Make it better" -> asked for clarification instead of guessing');
  }

  console.log('\n===============================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
