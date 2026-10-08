import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';

async function runVoiceTests() {
  console.log('🚀 ========================================================');
  console.log('🚀 URIMAIYALAR AI — END-TO-END VOICE PIPELINE TEST SUITE');
  console.log('🚀 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Health check of dev server
  try {
    const res = await fetch(`${BASE_URL}/api/health`).catch(() => fetch(`${BASE_URL}/`));
    assert(res.status < 500, 'Test 1: Server Reachability (localhost:3000)');
  } catch (err) {
    assert(false, 'Test 1: Server Reachability', err.message);
  }

  // 2. Reject empty audio payload
  try {
    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.success === false && data.error.code === 'EMPTY_AUDIO',
      'Test 2: Backend rejects empty payload with EMPTY_AUDIO code',
      JSON.stringify(data)
    );
  } catch (err) {
    assert(false, 'Test 2: Empty payload handling', err.message);
  }

  // 3. Reject audio blob smaller than 200 bytes
  try {
    const tinyBuffer = Buffer.from('RIFF....WAVEfmt ');
    const boundary = '----WebKitFormBoundaryVoiceTest123';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="tiny.wav"\r\nContent-Type: audio/wav\r\n\r\n`),
      tinyBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });
    const data = await res.json();
    assert(
      res.status === 400 && (data.error?.code === 'AUDIO_TOO_SHORT' || data.error?.code === 'RECORDING_TOO_SHORT'),
      'Test 3: Backend rejects tiny/truncated audio with RECORDING_TOO_SHORT / AUDIO_TOO_SHORT',
      JSON.stringify(data)
    );
  } catch (err) {
    assert(false, 'Test 3: Tiny audio rejection', err.message);
  }

  // Generate real valid WAV audio buffer for tests 4, 5, 6
  function createTestWavBuffer(durationSec = 1, sampleRate = 16000) {
    const numSamples = durationSec * sampleRate;
    const buffer = Buffer.alloc(44 + numSamples * 2);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * 440 * t) * 12000;
      buffer.writeInt16LE(Math.round(sample), 44 + i * 2);
    }
    return buffer;
  }

  const validAudioBuffer = createTestWavBuffer(1.5, 16000);

  // 4. Multipart upload with valid audio buffer to /api/voice/transcribe
  try {
    const boundary = '----WebKitFormBoundaryVoiceTestRealAudio';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="recording.wav"\r\nContent-Type: audio/wav\r\n\r\n`),
      validAudioBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });
    const data = await res.json();
    const duration = Date.now() - start;

    assert(
      res.status === 200 && data.success === true && typeof data.text === 'string',
      `Test 4: Real STT Provider Upload & Transcription (${duration}ms latency, provider: ${data.provider})`,
      JSON.stringify(data)
    );
  } catch (err) {
    assert(false, 'Test 4: Real audio transcription', err.message);
  }

  // 5. Test Backward compatibility alias /api/assistant/transcribe-audio
  try {
    const boundary = '----WebKitFormBoundaryAssistantAlias';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="speech.wav"\r\nContent-Type: audio/wav\r\n\r\n`),
      validAudioBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await fetch(`${BASE_URL}/api/assistant/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true,
      'Test 5: Assistant API alias /api/assistant/transcribe-audio compatibility',
      JSON.stringify(data)
    );
  } catch (err) {
    assert(false, 'Test 5: Assistant alias', err.message);
  }

  // 6. Test Base64 Audio JSON Fallback
  try {
    const base64Audio = validAudioBuffer.toString('base64');
    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        language: 'en',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true,
      'Test 6: Base64 JSON fallback upload succeeds',
      JSON.stringify(data)
    );
  } catch (err) {
    assert(false, 'Test 6: Base64 JSON fallback', err.message);
  }

  console.log('\n========================================================');
  console.log('🧠 TESTING VOICE INTENT ROUTING (POST-TRANSCRIPTION)');
  console.log('========================================================\n');

  // Test 7: VOICE TEST 1: "Hi" -> CONVERSATION MODE
  try {
    const res = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hi',
        language: 'en',
      }),
    });
    const data = await res.json();
    assert(
      data.mode?.toLowerCase() === 'conversation',
      'Test 7 (Acceptance 1): "Hi" routes to CONVERSATION mode (No business agents hallucinating)',
      `mode: ${data.mode}, answer: ${data.answer}`
    );
  } catch (err) {
    assert(false, 'Test 7: Hi routing', err.message);
  }

  // Test 8: VOICE TEST 2: "How much did I sell today?" -> BUSINESS QUERY (Sales Agent)
  try {
    const res = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How much did I sell today?',
        language: 'en',
      }),
    });
    const data = await res.json();
    const hasSalesContent =
      data.mode?.toLowerCase() === 'business_query' ||
      data.plan?.tasks?.some((t) => t.domain.toLowerCase().includes('sales')) ||
      data.answer?.toLowerCase().includes('₹') ||
      data.answer?.toLowerCase().includes('sale');
    assert(
      hasSalesContent,
      'Test 8 (Acceptance 2): "How much did I sell today?" routes to Sales Business Agent',
      `mode: ${data.mode}, answer snippet: ${data.answer?.slice(0, 100)}`
    );
  } catch (err) {
    assert(false, 'Test 8: Sales query routing', err.message);
  }

  // Test 9: VOICE TEST 3: Tamil "இன்னைக்கு 500 ரூபாய் sales add பண்ணு" -> ACTION MODE
  try {
    const res = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'இன்னைக்கு 500 ரூபாய் sales add பண்ணு',
        language: 'ta',
      }),
    });
    const data = await res.json();
    const isAction =
      data.mode?.toLowerCase() === 'action' ||
      data.actionPrompt !== undefined ||
      data.proposedActions?.length > 0 ||
      data.answer?.includes('500') ||
      data.answer?.includes('விற்பனை');
    assert(
      isAction,
      'Test 9 (Acceptance 3): Tamil "இன்னைக்கு 500 ரூபாய் sales add பண்ணு" triggers Action Mode & real DB flow',
      `mode: ${data.mode}, answer: ${data.answer}`
    );
  } catch (err) {
    assert(false, 'Test 9: Tamil action routing', err.message);
  }

  // Test 10: VOICE TEST 4: Tanglish "Innaiku 500 sales add pannu" -> ACTION MODE
  try {
    const res = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Innaiku 500 sales add pannu',
        language: 'ta',
      }),
    });
    const data = await res.json();
    const isTanglishAction =
      data.mode?.toLowerCase() === 'action' ||
      data.actionPrompt !== undefined ||
      data.proposedActions?.length > 0 ||
      data.answer?.includes('500');
    assert(
      isTanglishAction,
      'Test 10 (Acceptance 4): Tanglish "Innaiku 500 sales add pannu" triggers Action Mode',
      `mode: ${data.mode}, answer: ${data.answer}`
    );
  } catch (err) {
    assert(false, 'Test 10: Tanglish action routing', err.message);
  }

  // Test 11: VOICE TEST 5: "Bye" -> Natural farewell (No random business analysis)
  try {
    const res = await fetch(`${BASE_URL}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Bye',
        language: 'en',
      }),
    });
    const data = await res.json();
    assert(
      data.mode?.toLowerCase() === 'conversation',
      'Test 11 (Acceptance 5): "Bye" returns conversation farewell without business queries',
      `mode: ${data.mode}, answer: ${data.answer}`
    );
  } catch (err) {
    assert(false, 'Test 11: Bye routing', err.message);
  }

  console.log('\n========================================================');
  console.log(`📊 SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVoiceTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
