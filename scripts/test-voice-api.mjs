// scripts/test-voice-api.mjs
// Test voice endpoints on localhost

const BASE_URL = 'http://localhost:3000';

async function testEndpoint() {
  console.log('Testing /api/voice/transcribe validation...');

  // 1. Test empty body
  try {
    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    console.log('Empty request response:', res.status, data);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testEndpoint();
