import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Send, Globe, Radio, PlayCircle, StopCircle } from 'lucide-react';
import { AgentStatus, LanguageCode } from '../types/agent';
import { requestAgentTts } from '../services/agentApi';

interface VoiceControllerProps {
  status: AgentStatus;
  setStatus: (status: AgentStatus) => void;
  onSendInstruction: (instruction: string, isVoice: boolean) => Promise<string | void>;
  onAudioStart: (analyser: AnalyserNode) => void;
  onAudioEnd: () => void;
  selectedLanguage: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  onSpeechTextUpdate: (text: string) => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  status,
  setStatus,
  onSendInstruction,
  onAudioStart,
  onAudioEnd,
  selectedLanguage,
  onChangeLanguage,
  onSpeechTextUpdate,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Fenrir' | 'Puck' | 'Zephyr'>('Kore');
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Concurrency & overlap prevention tokens
  const audioSessionIdRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const hasCapturedFinalRef = useRef<boolean>(false);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Set recognition language based on selection
    if (selectedLanguage === 'bn') recognition.lang = 'bn-BD';
    else if (selectedLanguage === 'hi') recognition.lang = 'hi-IN';
    else if (selectedLanguage === 'en') recognition.lang = 'en-US';
    else recognition.lang = 'bn-BD';

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      hasCapturedFinalRef.current = false;
    };

    recognition.onresult = (event: any) => {
      // If already submitted or speaking, ignore any audio pickup
      if (hasCapturedFinalRef.current || isSubmittingRef.current || status === 'speaking') {
        return;
      }

      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          if (finalTranscript && finalTranscript.trim()) {
            hasCapturedFinalRef.current = true;
            setTranscript(finalTranscript);
            // Immediately stop recognition to prevent acoustic feedback loop
            try {
              recognition.stop();
            } catch {}
            setIsListening(false);
            handleVoiceSubmit(finalTranscript.trim());
            return;
          }
        } else {
          currentInterim += event.results[i][0].transcript;
          setTranscript(currentInterim);
        }
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (status === 'listening') setStatus('idle');
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status === 'listening' && !isSubmittingRef.current) {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [selectedLanguage, status]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported by this browser. Please use the text input.');
      return;
    }

    // Never allow mic while agent is speaking to prevent overlap/feedback
    if (status === 'speaking') {
      stopAllAudio();
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      setStatus('idle');
    } else {
      try {
        stopAllAudio();
        setTranscript('');
        hasCapturedFinalRef.current = false;
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleVoiceSubmit = async (spokenText: string) => {
    if (!spokenText.trim() || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setStatus('thinking');

    try {
      const responseText = await onSendInstruction(spokenText, true);
      if (responseText && !voiceMuted) {
        await playVoiceResponse(responseText);
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Instruction processing error:', err);
      setStatus('idle');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || status === 'thinking' || isSubmittingRef.current) return;
    const msg = textInput;
    setTextInput('');
    isSubmittingRef.current = true;
    setStatus('thinking');

    try {
      const responseText = await onSendInstruction(msg, false);
      if (responseText && !voiceMuted) {
        await playVoiceResponse(responseText);
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('Instruction error:', err);
      setStatus('idle');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Completely halts and tears down all playing voice channels
  const stopAllAudio = () => {
    // Invalidate session ID so pending promises never start playing
    audioSessionIdRef.current++;

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
      } catch {}
      currentAudioRef.current = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    onAudioEnd();
    onSpeechTextUpdate('');
    setIsTestingVoice(false);
  };

  // Play voice with single session token to eliminate overlap completely
  const playVoiceResponse = async (text: string) => {
    stopAllAudio();
    const sessionId = ++audioSessionIdRef.current;

    setStatus('speaking');
    onSpeechTextUpdate(text);

    // Ensure speech recognition is fully aborted during voice playback
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      setIsListening(false);
    }

    try {
      // 1. Fetch authentic Gemini Human Voice from server
      const audioDataUri = await requestAgentTts(text, selectedVoice);

      // Verify that no other audio request superceded this one
      if (sessionId !== audioSessionIdRef.current) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const audio = new Audio(audioDataUri);
      currentAudioRef.current = audio;

      // Connect to analyser for full-screen audio reactive animation
      try {
        const source = audioCtx.createMediaElementSource(audio);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        onAudioStart(analyser);
      } catch (nodeErr) {
        // If already connected or CORS, audio still plays
      }

      audio.onended = () => {
        if (sessionId === audioSessionIdRef.current) {
          stopAllAudio();
          setStatus('idle');
        }
      };

      audio.onerror = () => {
        if (sessionId === audioSessionIdRef.current) {
          stopAllAudio();
          setStatus('idle');
        }
      };

      await audio.play();
    } catch {
      if (sessionId === audioSessionIdRef.current) {
        stopAllAudio();
        setStatus('idle');
      }
    }
  };

  // Dedicated test for genuine human voice
  const handleTestHumanVoice = async () => {
    if (isTestingVoice || status === 'speaking') {
      stopAllAudio();
      setStatus('idle');
      return;
    }

    setIsTestingVoice(true);
    const testSample =
      selectedLanguage === 'bn'
        ? 'নমস্কার! এটি AURA এজেন্টের খাঁটি মানুষের কণ্ঠস্বর। আমি যেকোনো নির্দেশ পালন করতে প্রস্তুত।'
        : selectedLanguage === 'hi'
        ? 'नमस्ते! यह AURA एजेंट की प्रामाणिक मानवीय आवाज़ है। मैं आपकी सहायता के लिए तैयार हूँ।'
        : 'Hello! This is the authentic human voice of your AURA personal agent. How can I assist you today?';

    await playVoiceResponse(testSample);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-xl">
      {/* Voice Status & Persona Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 text-xs font-mono text-cyan-400 border border-slate-700">
            <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Voice Engine: Gemini 3.8 Authentic Human Audio</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onChangeLanguage('bn')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                selectedLanguage === 'bn' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              বাংলা (BN)
            </button>
            <button
              onClick={() => onChangeLanguage('en')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                selectedLanguage === 'en' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onChangeLanguage('hi')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                selectedLanguage === 'hi' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी (HI)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Persona Voice selector */}
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value as any)}
            className="bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="Kore">Kore · Natural Female Voice (মহিলা কণ্ঠস্বর)</option>
            <option value="Fenrir">Fenrir · Deep Male Voice (পুরুষ গম্ভীর কণ্ঠস্বর)</option>
            <option value="Puck">Puck · Friendly Natural Male Voice (পুরুষ বন্ধুত্বপূর্ণ কণ্ঠস্বর)</option>
            <option value="Zephyr">Zephyr · Smooth Articulate Voice (স্পষ্ট শান্ত কণ্ঠস্বর)</option>
          </select>

          {/* Test Human Voice Button */}
          <button
            type="button"
            onClick={handleTestHumanVoice}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              status === 'speaking'
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/40 text-cyan-300'
            }`}
            title="Listen to genuine human voice sample"
          >
            {status === 'speaking' ? (
              <>
                <StopCircle className="w-3.5 h-3.5" /> Stop Voice
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5" /> Test Voice
              </>
            )}
          </button>

          {/* Mute button */}
          <button
            onClick={() => {
              if (!voiceMuted) stopAllAudio();
              setVoiceMuted(!voiceMuted);
            }}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              voiceMuted
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={voiceMuted ? 'Voice Muted (Click to Unmute)' : 'Mute Voice'}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Voice Transcript Display */}
      {isListening && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3 animate-pulse">
          <Mic className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="flex-1 italic">
            {transcript || 'Listening... Speak in Bengali, English, or Hindi (e.g. "আমার হোয়াটসঅ্যাপ মেসেজ চেক করো" / "Check my WhatsApp")'}
          </p>
        </div>
      )}

      {/* Main Controls: Mic + Text Input */}
      <form onSubmit={handleTextSubmit} className="flex items-center gap-3">
        {/* Glowing Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`relative p-4 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 scale-105 animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
          }`}
          title={isListening ? 'Stop listening' : 'Start Voice Instruction'}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Text Input for typed instructions */}
        <div className="relative flex-1">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              selectedLanguage === 'bn'
                ? 'ভয়েস দিন অথবা নির্দেশ লিখুন (যেমন: হোয়াটসঅ্যাপে রাহুলকে উত্তর দাও, ইমেইল চেক করো)...'
                : selectedLanguage === 'hi'
                ? 'आवाज़ दें या निर्देश लिखें (उदा: व्हाट्सएप संदेश चेक करो, नया ईमेल भेजो)...'
                : 'Voice or type instruction (e.g., "Reply to Rahul on WhatsApp", "Triage unread emails", "Solve complex problem")...'
            }
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!textInput.trim() || status === 'thinking' || isSubmittingRef.current}
          className="px-5 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Instruct</span>
        </button>
      </form>

      {/* Suggested Quick Prompts */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <span className="text-slate-500">Quick prompts:</span>
        <button
          type="button"
          onClick={() => {
            setTextInput('আমার সকল হোয়াটসঅ্যাপ মেসেজের রিপ্লাই ড্রাফট করো');
          }}
          className="hover:text-cyan-300 transition-colors"
        >
          "হোয়াটসঅ্যাপ মেসেজ রিপ্লাই করো" ·
        </button>
        <button
          type="button"
          onClick={() => {
            setTextInput('Show urgent unread emails and draft professional responses');
          }}
          className="hover:text-cyan-300 transition-colors"
        >
          "Triage unread emails" ·
        </button>
        <button
          type="button"
          onClick={() => {
            setTextInput('राहुल को व्हाट्सएप पर हिंदी में संदेश भेजो कि मैं 5 मिनट में कॉल करूँगा');
          }}
          className="hover:text-cyan-300 transition-colors"
        >
          "व्हाट्सएप पर रिप्लाई करो" ·
        </button>
        <button
          type="button"
          onClick={() => {
            setTextInput('Solve an advanced dynamic programming algorithm problem with time complexity analysis');
          }}
          className="hover:text-cyan-300 transition-colors"
        >
          "Solve Advanced Problem"
        </button>
      </div>
    </div>
  );
};
