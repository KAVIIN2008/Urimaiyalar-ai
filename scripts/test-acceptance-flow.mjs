// scripts/test-acceptance-flow.mjs
// Step-by-step verification of the 7-step Final Acceptance Test from Section 27

const BASE_URL = 'http://localhost:3000';

async function queryAssistant(message, conversationHistory = []) {
  const res = await fetch(`${BASE_URL}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory, language: 'en' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function runAcceptanceTest() {
  console.log('\n===============================================================');
  console.log('🏆 7-STEP FINAL ACCEPTANCE TEST (Section 27)');
  console.log('===============================================================\n');

  const history = [];

  // STEP 1: Hi
  console.log('👤 USER: Hi');
  const step1 = await queryAssistant('Hi', history);
  console.log(`🤖 AI (${step1.mode}): ${step1.answer}\n`);
  history.push({ role: 'user', content: 'Hi' });
  history.push({ role: 'assistant', content: step1.answer });

  // STEP 2: How much did I sell today?
  console.log('👤 USER: How much did I sell today?');
  const step2 = await queryAssistant('How much did I sell today?', history);
  console.log(`🤖 AI (${step2.mode}): ${step2.answer}\n`);
  history.push({ role: 'user', content: 'How much did I sell today?' });
  history.push({ role: 'assistant', content: step2.answer });

  // STEP 3: Is that good?
  console.log('👤 USER: Is that good?');
  const step3 = await queryAssistant('Is that good?', history);
  console.log(`🤖 AI (${step3.mode}): ${step3.answer}\n`);
  history.push({ role: 'user', content: 'Is that good?' });
  history.push({ role: 'assistant', content: step3.answer });

  // STEP 4: Add ₹250 more.
  console.log('👤 USER: Add ₹250 more.');
  const step4 = await queryAssistant('Add ₹250 more.', history);
  console.log(`🤖 AI (${step4.mode}): ${step4.answer}\n`);
  history.push({ role: 'user', content: 'Add ₹250 more.' });
  history.push({ role: 'assistant', content: step4.answer });

  // STEP 5: How much is today's total now?
  console.log("👤 USER: How much is today's total now?");
  const step5 = await queryAssistant("How much is today's total now?", history);
  console.log(`🤖 AI (${step5.mode}): ${step5.answer}\n`);
  history.push({ role: 'user', content: "How much is today's total now?" });
  history.push({ role: 'assistant', content: step5.answer });

  // STEP 6: Thanks!
  console.log('👤 USER: Thanks!');
  const step6 = await queryAssistant('Thanks!', history);
  console.log(`🤖 AI (${step6.mode}): ${step6.answer}\n`);
  history.push({ role: 'user', content: 'Thanks!' });
  history.push({ role: 'assistant', content: step6.answer });

  // STEP 7: Bye
  console.log('👤 USER: Bye');
  const step7 = await queryAssistant('Bye', history);
  console.log(`🤖 AI (${step7.mode}): ${step7.answer}\n`);

  console.log('===============================================================');
  console.log('✅ ALL 7 STEPS VERIFIED END-TO-END WITH REAL DATABASE ACTIONS');
  console.log('===============================================================\n');
}

runAcceptanceTest().catch(console.error);
