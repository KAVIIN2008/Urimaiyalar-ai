import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Volume1,
  Radio,
  PlusCircle,
  UserPlus,
  Receipt,
  CreditCard,
  MessageCircle,
  Trash2,
  Compass,
  Globe,
  Languages,
} from 'lucide-react';
import { LanguageCode, IntentEntityExtraction } from '../types';
import { playSoundEffect, speakInLanguage, stopSpeaking } from '../utils/audioSpeech';
import { api } from '../lib/api';
import {
  VOICE_LANGUAGE_PICKER,
  getVoiceSessionConfig,
} from '../services/voiceSTT';
import { BrowserVoiceRecorder, VoiceRecordingState } from '../services/browserVoiceRecorder';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onExecuteAction: (extraction: IntentEntityExtraction) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  language,
  onExecuteAction,
  onRefreshData,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  // Active language code for STT: 'ta', 'hi', 'te', 'kn', 'ml', 'bn', etc.
  const [sttLangCode, setSttLangCode] = useState<string>(language === 'ta' ? 'ta' : 'en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  // BCP-47 locale derived from sttLangCode for Web Speech API
  const inputLanguage = getVoiceSessionConfig(sttLangCode).primaryLocale;
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [responseHtml, setResponseHtml] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<IntentEntityExtraction | null>(null);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>('IDLE');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<BrowserVoiceRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Suggested Voice Commands - Full voice control for Products, Customers, Sales, Credit Recovery, Expenses, Navigation & Clearing
  const quickVoiceActions = [
    {
      icon: PlusCircle,
      labelTa: '+ பொருள் சேர் (Add Product)',
      labelEn: '+ Add Product',
      queryTa: 'புதிய பொருள் பொன்னி அரிசி 25 கிலோ விற்பனை விலை 65 அடக்க விலை 55',
      queryEn: 'Add product Ponni Rice 25 kg selling price 65 purchase price 55',
      color: 'border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      icon: UserPlus,
      labelTa: '+ வாடிக்கையாளர் (Add Customer)',
      labelEn: '+ Add Customer',
      queryTa: 'புதிய வாடிக்கையாளர் குமார் போன் 9842100111 கடன் வரம்பு 5000',
      queryEn: 'Add customer Kumar phone 9842100111 credit limit 5000',
      color: 'border-sky-200/80 bg-sky-50/50 hover:bg-sky-100 text-sky-800 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300',
    },
    {
      icon: Receipt,
      labelTa: 'விற்பனை பதிவு (Record Sale)',
      labelEn: 'Record Sale',
      queryTa: 'இன்று 500 ரூபாய் சில்லறை விற்பனை ரொக்கம்',
      queryEn: 'Record cash sale 500 rupees',
      color: 'border-violet-200/80 bg-violet-50/50 hover:bg-violet-100 text-violet-800 dark:border-violet-800/80 dark:bg-violet-950/40 dark:text-violet-300',
    },
    {
      icon: CreditCard,
      labelTa: 'கடன் வசூல் (Debt Payment)',
      labelEn: 'Debt Payment',
      queryTa: 'முருகன் 2000 ரூபாய் கடன் தந்தார்',
      queryEn: 'Murugan paid 2000 rupees credit debt',
      color: 'border-amber-200/80 bg-amber-50/50 hover:bg-amber-100 text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300',
    },
    {
      icon: Compass,
      labelTa: 'சப்ளையர் (Suppliers)',
      labelEn: 'Suppliers',
      queryTa: 'சப்ளையர் பக்கத்திற்கு செல்',
      queryEn: 'Open suppliers list',
      color: 'border-teal-200/80 bg-teal-50/50 hover:bg-teal-100 text-teal-800 dark:border-teal-800/80 dark:bg-teal-950/40 dark:text-teal-300',
    },
    {
      icon: PlusCircle,
      labelTa: '+ சப்ளையர் (Add Supplier)',
      labelEn: '+ Add Supplier',
      queryTa: 'புதிய விநியோகஸ்தர் காவேரி டிரேடர்ஸ் போன் 9840011223',
      queryEn: 'Add supplier Cauvery Traders phone 9840011223',
      color: 'border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-800 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-300',
    },
    {
      icon: Sparkles,
      labelTa: 'இன்றைய லாபம் (Check Profit)',
      labelEn: 'Check Profit',
      queryTa: 'இன்றைய வணிக லாபம் எவ்வளவு?',
      queryEn: 'What is today profit?',
      color: 'border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      icon: MessageCircle,
      labelTa: 'வாடிக்கையாளர் உரையாடல் (Dialogue)',
      labelEn: 'Customer Dialogue',
      queryTa: 'ரமேஷிடம் கடன் பாக்கி வசூலிக்க மரியாதையாக எப்படி பேசுவது?',
      queryEn: 'How to speak politely with Ramesh to collect overdue credit balance?',
      color: 'border-blue-200/80 bg-blue-50/50 hover:bg-blue-100 text-blue-800 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-300',
    },
    {
      icon: Compass,
      labelTa: 'சரக்கு இருப்பு (Go to Stock)',
      labelEn: 'Go to Stock',
      queryTa: 'சரக்கு இருப்பு பக்கத்திற்கு செல்',
      queryEn: 'Go to inventory view',
      color: 'border-sky-200/80 bg-sky-50/50 hover:bg-sky-100 text-sky-800 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300',
    },
    {
      icon: Radio,
      labelTa: 'டார்க் மோட் (Toggle Theme)',
      labelEn: 'Toggle Dark/Light',
      queryTa: 'டார்க் மோட் மாற்று',
      queryEn: 'Toggle dark mode',
      color: 'border-purple-200/80 bg-purple-50/50 hover:bg-purple-100 text-purple-800 dark:border-purple-800/80 dark:bg-purple-950/40 dark:text-purple-300',
    },
    {
      icon: Trash2,
      labelTa: 'தரவை அழி (Clear All Data)',
      labelEn: 'Clear Test Data',
      queryTa: 'அனைத்து சோதனைத் தரவையும் அழி',
      queryEn: 'Clear all test data',
      color: 'border-rose-200/80 bg-rose-50/50 hover:bg-rose-100 text-rose-800 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300',
    },
  ];

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = inputLanguage;

        recog.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
          }
          if (fullText.trim()) {
            setTranscript(fullText);
            transcriptRef.current = fullText;
          }
        };

        recog.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
        };

        recog.onend = () => {
          // Keep continuous until manually stopped
        };

        recognitionRef.current = recog;
      } else {
        setSpeechSupported(false);
      }
    }
  }, [sttLangCode]);

  const cleanupAudioStreams = () => {
    recorderRef.current?.cleanup();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setAudioLevel(0);
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupAudioStreams();
      stopSpeaking();
    }
    return () => {
      cleanupAudioStreams();
      stopSpeaking();
    };
  }, [isOpen]);

  const toggleListening = async () => {
    if (recordingState === 'RECORDING') {
      // STOP RECORDING
      playSoundEffect('mic_stop');
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      recorderRef.current?.stopRecording();
    } else {
      // START RECORDING
      setErrorMessage(null);
      setTranscript('');
      transcriptRef.current = '';
      setResponseHtml(null);
      setPendingAction(null);
      stopSpeaking();
      setIsSpeaking(false);
      playSoundEffect('mic_start');

      recorderRef.current = new BrowserVoiceRecorder({
        onStateChange: (state) => {
          setRecordingState(state);
          setIsListening(state === 'RECORDING');
          setIsTranscribing(state === 'TRANSCRIBING' || state === 'PROCESSING');
        },
        onAudioLevel: (lvl) => setAudioLevel(lvl),
        onDurationChange: (sec) => setRecordingDuration(sec),
        onError: (_code, message) => {
          setErrorMessage(message);
          playSoundEffect('warning');
        },
        onTranscriptReady: (spokenText) => {
          setTranscript(spokenText);
          transcriptRef.current = spokenText;
          setErrorMessage(null);
          playSoundEffect('action_success');
        },
      });

      // Also start Web Speech API for live interim display if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = inputLanguage;
          recognitionRef.current.start();
        } catch (e) {}
      }

      await recorderRef.current.startRecording();
    }
  };

  const speakText = (text: string) => {
    if (speechMuted) return;
    speakInLanguage(text, sttLangCode, {
      rate: 0.95,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleTestAudio = () => {
    playSoundEffect('action_success');
    const testPhrases: Record<string, string> = {
      ta: 'வணக்கம்! உரிமையாளர் AI குரல் ஒலி வெளியீடு சீராக செயல்படுகிறது.',
      hi: 'नमस्ते! उरिमैयालर AI आवाज़ आउटपुट सही तरह से काम कर रहा है।',
      te: 'నమస్కారం! Urimaiyalar AI voice output సరిగ్గా పని చేస్తోంది.',
      kn: 'ನಮಸ್ಕಾರ! Urimaiyalar AI ಧ್ವನಿ ಆಉಟ್‌ಪುಟ್ ಸರಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ.',
      ml: 'നമസ്കാരം! Urimaiyalar AI ശബ്ദ ഔട്ട്‌പുട്ട് ശരിയായി പ്രവർത്തിക്കുന്നു.',
      bn: 'নমস্কার! Urimaiyalar AI ভয়েস আউটপুট সঠিকভাবে কাজ করছে.',
      mr: 'नमस्कार! Urimaiyalar AI आवाज आउटपुट योग्यरित्या कार्य करत आहे.',
      gu: 'નમસ્કાર! Urimaiyalar AI અવાજ આઉટપુટ સારી રીતે ચાલી રહ્યું છે.',
      pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! Urimaiyalar AI ਆਵਾਜ਼ ਆਉਟਪੁੱਟ ਸਹੀ ਢੰਗ ਨਾਲ ਕੰਮ ਕਰ ਰਿਹਾ ਹੈ.',
      en: 'Vanakkam! Urimaiyalar AI voice output is functioning clearly.',
    };
    const phrase = testPhrases[sttLangCode] || testPhrases['en'];
    speakText(phrase);
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || transcript;
    if (!textToSend.trim()) return;

    if (isListening) {
      setIsListening(false);
      cleanupAudioStreams();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      recorderRef.current?.stopRecording();
    }

    setIsLoading(true);
    setPendingAction(null);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const res = await api('/api/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: sttLangCode,
        }),
      });

      const data = await res.json();
      setResponseHtml(data.answer);

      // If server directly executed the action (ADD_PRODUCT, ADD_CUSTOMER, ADD_SALE, ADD_EXPENSE, RECORD_PAYMENT, CLEAR_DATA, LOAD_SAMPLE_DATA, etc.)
      if (data.executed) {
        playSoundEffect('action_success');
        await onRefreshData();
        if (data.targetView) {
          await onExecuteAction({
            intent: 'NAVIGATE',
            language: sttLangCode,
            confidence: 1,
            entities: { targetView: data.targetView },
            requiresConfirmation: false,
            rawText: textToSend,
          });
        }
      } else if (data.actionPrompt && !data.actionPrompt.requiresConfirmation) {
        await onExecuteAction(data.actionPrompt);
      } else if (data.actionPrompt && data.actionPrompt.requiresConfirmation) {
        setPendingAction(data.actionPrompt);
      }

      speakText(data.answer);
    } catch (err) {
      const errMsg =
        inputLanguage === 'ta-IN'
          ? 'மன்னிக்கவும், தகவல் பெறுவதில் தாமதம் ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.'
          : 'Communication delayed. Please retry.';
      setResponseHtml(errMsg);
      speakText(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setIsLoading(true);
    try {
      await onExecuteAction(pendingAction);
      playSoundEffect('action_success');
      const succMsg =
        language === 'ta'
          ? 'வெற்றிகரமாக பதிவு செய்யப்பட்டது! சரக்கு இருப்பு, லெட்ஜர் மற்றும் வணிக நினைவகம் புதுப்பிக்கப்பட்டது.'
          : 'Successfully recorded! Inventory, ledger, and store records updated.';
      setResponseHtml(`✅ **${succMsg}**`);
      setPendingAction(null);
      await onRefreshData();
      speakText(succMsg);
    } catch (err) {
      setResponseHtml('பதிவு செய்வதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-ai-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div
        id="voice-ai-modal-card"
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition dark:border-slate-800 dark:bg-slate-900 sm:p-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'உரிமையாளர் AI குரல் கட்டளை' : 'Voice Control & Intelligence'}
                </h3>
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
                    <Volume1 className="h-3 w-3" />
                    Speaking
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                22 Indian Languages · Voice → Intent → Action · Code-switching enabled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multilingual Language Picker */}
            <div className="relative">
              <button
                id="voice-lang-picker-btn"
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title="Switch Voice Language"
              >
                <Languages className="h-3.5 w-3.5 text-indigo-500" />
                <span>{getVoiceSessionConfig(sttLangCode).nativeName}</span>
              </button>

              {showLangPicker && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="px-3 pt-3 pb-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <Globe className="h-3 w-3" />
                      <span>Select Voice Language</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">Auto-detected from script. Click to override.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-2 max-h-52 overflow-y-auto">
                    {VOICE_LANGUAGE_PICKER.map((lang) => (
                      <button
                        key={lang.code}
                        id={`voice-lang-${lang.code}`}
                        onClick={() => {
                          setSttLangCode(lang.code);
                          setShowLangPicker(false);
                        }}
                        className={`flex flex-col items-start rounded-xl px-3 py-2 text-left transition hover:bg-indigo-50 dark:hover:bg-slate-800 ${
                          sttLangCode === lang.code
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 ring-1 ring-indigo-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-sm font-bold leading-tight">{lang.label}</span>
                        <span className="text-[10px] text-slate-400">{lang.sublabel}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400">🧠 AI auto-detects language from your text</p>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Mute Toggle */}
            <button
              onClick={() => {
                if (!speechMuted) { stopSpeaking(); setIsSpeaking(false); }
                setSpeechMuted(!speechMuted);
              }}
              title={speechMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {speechMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
            </button>

            {/* Test Audio */}
            <button
              id="test-audio-btn"
              onClick={handleTestAudio}
              title="Test Voice Output"
              className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-800"
            >
              <Radio className="h-4 w-4" />
            </button>

            <button
              onClick={() => { stopSpeaking(); setIsSpeaking(false); cleanupAudioStreams(); setShowLangPicker(false); onClose(); }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body & Interactive Content */}
        <div className="my-4 flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Microphone Interactive Pulse Center */}
          <div className="flex flex-col items-center justify-center py-3 text-center">
            <div className="relative mb-3 flex items-center justify-center">
              {recordingState === 'RECORDING' && (
                <div
                  className="absolute h-24 w-24 rounded-full bg-rose-500/20 animate-ping"
                  style={{ animationDuration: '1.4s' }}
                ></div>
              )}
              <button
                id="voice-record-center-btn"
                onClick={toggleListening}
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${
                  recordingState === 'RECORDING'
                    ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30 ring-4 ring-rose-400/30'
                    : isTranscribing
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30 animate-pulse ring-4 ring-amber-400/30'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-emerald-500/30 hover:scale-105'
                }`}
              >
                {recordingState === 'RECORDING' ? (
                  <MicOff className="h-8 w-8 animate-bounce" />
                ) : isTranscribing ? (
                  <Sparkles className="h-8 w-8 animate-spin" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {recordingState === 'REQUESTING_PERMISSION'
                ? '⏳ Requesting microphone permission...'
                : recordingState === 'RECORDING'
                ? `🔴 Listening... (${String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:${String(recordingDuration % 60).padStart(2, '0')}) — click mic to stop`
                : recordingState === 'STOPPING'
                ? '⏳ Processing recorded audio...'
                : recordingState === 'TRANSCRIBING'
                ? '🧠 Converting speech to text with Groq Whisper AI...'
                : recordingState === 'SUCCESS'
                ? '✓ Transcript ready! Edit or click send below.'
                : 'Click mic to speak, or select a quick command below'}
            </p>

            {/* Language & Recording Badge */}
            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                <Languages className="h-3 w-3" />
                {getVoiceSessionConfig(sttLangCode).nativeName} · {getVoiceSessionConfig(sttLangCode).languageName}
              </span>
              {recordingState === 'RECORDING' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
                  🔴 REC {String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:{String(recordingDuration % 60).padStart(2, '0')}
                </span>
              )}
            </div>

            {/* Error Banner with Try Again */}
            {errorMessage && (
              <div className="mt-2.5 max-w-md rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4" />
                  <span>Voice Recognition Notice</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">{errorMessage}</p>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    toggleListening();
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-rose-700 active:scale-95 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Real Audio Wave Visualizer Bars */}
            {recordingState === 'RECORDING' && (
              <div className="mt-3 flex items-center gap-1.5">
                {[0.3, 0.7, 1.0, 0.8, 0.5, 0.9, 0.4].map((mult, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-rose-500 transition-all duration-100"
                    style={{
                      height: `${Math.max(6, Math.round(audioLevel * mult * 36))}px`,
                    }}
                  ></span>
                ))}
              </div>
            )}
          </div>

          {/* Transcript / Input text field */}
          <div className="relative">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                {transcript ? '🎙️ You said:' : 'Transcript preview & manual entry:'}
              </span>
              {transcript && (
                <button
                  onClick={() => {
                    setTranscript('');
                    transcriptRef.current = '';
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              id="voice-transcript-input"
              rows={2}
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                transcriptRef.current = e.target.value;
              }}
              placeholder={
                language === 'ta'
                  ? 'எ.கா: "இன்றைய விற்பனை எவ்வளவு?" அல்லது "₹500 விற்பனை சேர்"...'
                  : 'e.g. "How much did I sell today?" or "Add ₹500 sales"...'
              }
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3.5 pr-14 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:bg-slate-900"
            />
            <button
              id="submit-voice-transcript-btn"
              disabled={isLoading || !transcript.trim()}
              onClick={() => handleSendQuery()}
              title="Send to AI Assistant"
              className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-40 shadow-sm active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 1-Click Quick Voice Command Action Chips */}
          <div>
            <p className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>{language === 'ta' ? 'குரல் கட்டளை மாதிரிகள் (1-Click Test Actions)' : 'Voice Action Triggers'}</span>
              <span className="text-[10px] lowercase font-normal">click to test command instantly</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickVoiceActions.map((action, idx) => {
                const Icon = action.icon;
                const queryText = language === 'ta' ? action.queryTa : action.queryEn;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setTranscript(queryText);
                      transcriptRef.current = queryText;
                      handleSendQuery(queryText);
                    }}
                    className={`flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[11px] font-semibold shadow-xs transition hover:scale-102 dark:bg-slate-800 ${action.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{language === 'ta' ? action.labelTa : action.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading state indicator */}
          {(isLoading || isTranscribing) && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
              <span>
                {isTranscribing
                  ? language === 'ta'
                    ? 'AI குரல் பதிவு எழுத்தாக்கம் செய்யப்படுகிறது...'
                    : 'Transcribing speech with Gemini AI...'
                  : language === 'ta'
                  ? 'வணிக கணக்குகளை சரிபார்த்து பதிலளிக்கிறது...'
                  : 'Verifying database records & formulating response...'}
              </span>
            </div>
          )}

          {/* Assistant Answer Box */}
          {responseHtml && (
            <div
              id="ai-assistant-answer-box"
              className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  {language === 'ta' ? 'சரிபார்க்கப்பட்ட பதில் & கட்டளை முடிவு' : 'Verified Intelligence Response'}
                </span>
                <button
                  onClick={() => speakText(responseHtml)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-100/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  {language === 'ta' ? 'குரலில் கேள்' : 'Listen'}
                </button>
              </div>

              <div className="prose prose-xs max-w-none whitespace-pre-line text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                {responseHtml}
              </div>
            </div>
          )}

          {/* Confirmation Box for High-Impact Actions */}
          {pendingAction && (
            <div
              id="action-confirmation-banner"
              className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-md dark:border-amber-700 dark:bg-amber-950/40"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {language === 'ta' ? 'உறுதிப்படுத்தல் தேவை (Confirmation Required)' : 'Action Confirmation'}
                  </h4>
                  <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {language === 'ta'
                      ? pendingAction.confirmationPromptTa
                      : pendingAction.confirmationPromptEn}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {language === 'ta'
                      ? 'இதனை உறுதிசெய்தால் சரக்கு இருப்பு மற்றும் கணக்கு தானாக புதுப்பிக்கப்படும்.'
                      : 'Confirming will automatically update stock inventory, ledger, and accounts.'}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      id="confirm-voice-action-btn"
                      onClick={handleConfirmAction}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {language === 'ta' ? 'ஆம், பதிவு செய்' : 'Confirm & Save'}
                    </button>
                    <button
                      onClick={() => setPendingAction(null)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Multilingual STT + TTS · 22 Languages Active
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3 text-indigo-400" />
            {getVoiceSessionConfig(sttLangCode).languageName} Mode
          </span>
        </div>
      </div>
    </div>
  );
};
