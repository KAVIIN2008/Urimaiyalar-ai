// scripts/test-groq-whisper.mjs
import fs from 'fs';

// Check if Groq Whisper transcriptions endpoint is responsive
const key = process.env.GROQ_API_KEY

console.log('Testing Groq audio transcriptions availability...');
try {
  // Test with an empty/dummy post to see the error signature (e.g. 400 bad request vs 404 or 401)
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` }
  });
  const data = await res.json();
  console.log('Response status:', res.status);
  console.log('Response body:', data);
} catch (e) {
  console.error('Fetch error:', e);
}
