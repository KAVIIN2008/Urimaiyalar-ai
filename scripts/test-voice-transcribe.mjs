// scripts/test-voice-transcribe.mjs
// Test full multipart audio upload to /api/voice/transcribe

function createWavBuffer(durationSeconds = 1.5, sampleRate = 16000) {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = Math.floor(sampleRate * durationSeconds * blockAlign);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // "data" subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate a soft audible beep (440 Hz concert A) so it's valid audio data
  const frequency = 440;
  for (let i = 0; i < sampleRate * durationSeconds; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.3; // 30% volume
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

async function testWavTranscription() {
  console.log('Generating test WAV audio (1.5 seconds)...');
  const wavBuffer = createWavBuffer(1.5, 16000);
  console.log('Audio buffer size:', wavBuffer.length, 'bytes');

  const formData = new FormData();
  const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  formData.append('file', audioBlob, 'test-audio.wav');
  formData.append('language', 'en');

  console.log('Uploading to http://localhost:3000/api/voice/transcribe ...');
  const res = await fetch('http://localhost:3000/api/voice/transcribe', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Transcription Response:', data);
}

testWavTranscription().catch(console.error);
