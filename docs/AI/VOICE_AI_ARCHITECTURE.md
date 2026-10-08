# 🎙️ URIMAIYALAR OS — VOICE AI & STT ARCHITECTURE

## Overview
Kirana store owners and small merchants in South India frequently manage transactions while handling physical inventory, making voice the primary input interface. Urimaiyalar OS implements an end-to-end multi-provider voice processing pipeline.

---

## 🎙️ The Voice-to-Action Pipeline

```text
  User Speaks (Tamil / Tanglish / English / Hindi)
                    │
                    ▼
     Browser MediaRecorder Web API
     (audio/webm; codecs=opus, 16kHz)
                    │
                    ▼
          POST /api/voice/stt
                    │
                    ▼
        Audio Sanitizer & Validator
   (Size > 100 bytes, duration > 0.2s)
                    │
                    ▼
          STT Provider Router
         ├── 1. Groq Whisper Large v3 (Fastest, ~180ms)
         ├── 2. Google Cloud Speech-to-Text (Indic dialect support)
         └── 3. Local Whisper.cpp (Offline fallback)
                    │
                    ▼
     Raw Transcript + Detected Language
                    │
                    ▼
          Multilingual Normalizer
    (Tanglish / Romanized Indic -> Semantic Meaning)
                    │
                    ▼
          Central Intent Router
                    │
                    ▼
          Approved Tool Execution
                    │
                    ▼
       Database Transaction & Auditing
                    │
                    ▼
          Voice / Text Feedback
```

---

## 🗣️ Supported Voice Dialects
1. **Tamil Pure (`ta-IN`)**: *"இன்றைய மொத்த விற்பனை எவ்வளவு?"*
2. **Tanglish (Tamil in Roman Script)**: *"Innaiku 500 sales add pannunga"*
3. **Hindi (`hi-IN`)**: *"आज की कुल बिक्री कितनी हुई?"*
4. **Hinglish**: *"Aaj 500 rupaye ki sale add karo"*
5. **English (Indian Accent)**: *"Add 500 rupees sale today"*

---

## 🛡️ Fault Tolerance & Edge Cases
1. **Empty / Accidental Clicks**: If audio duration is below 0.2 seconds or under 100 bytes, the endpoint responds immediately with `AUDIO_TOO_SHORT` rather than failing downstream.
2. **Low Confidence Transcripts**: If transcription score is below 0.50, the UI requests: *"மன்னிக்கவும், தெளிவாக கேட்கவில்லை. மீண்டும் கூறுங்கள்"* (Could not hear clearly, please speak again).
3. **Text Fallback**: If browser microphone permissions are blocked, the UI gracefully switches to the natural language text input field.
