// Test Multi-Agent System orchestration pipeline
import { executeMultiAgentSystem } from '../src/services/multiAgentSystem.ts';

async function run() {
  console.log('--- TEST 1: Complex Multi-Domain Request (Sales + Inventory + Finance) ---');
  const q1 = "இந்த மாதம் விற்பனை எப்படி இருக்கு? மேலும் stock குறைவாக இருக்கும் பொருட்கள் என்ன?";
  const res1 = await executeMultiAgentSystem(q1);
  console.log('Language:', res1.plan.detectedLanguage);
  console.log('Execution Mode:', res1.plan.executionMode);
  console.log('Tasks Planned:', res1.plan.tasks);
  console.log('Agents Executed:', Object.keys(res1.agentResults));
  console.log('Validation:', res1.validation);
  console.log('Answer:\n', res1.answer);
  console.log('Total Latency:', res1.totalLatencyMs, 'ms');

  console.log('\n--- TEST 2: Action Agent & Permission Trigger (Customer Due Reminder for Ramesh) ---');
  const q2 = "ரமேஷுக்கு எவ்வளவு கடன் பாக்கி இருக்கு? WhatsApp reminder அனுப்பலாமா?";
  const res2 = await executeMultiAgentSystem(q2);
  console.log('Proposed Action:', res2.proposedAction);
  console.log('Answer:\n', res2.answer);
}

run().catch(console.error);
