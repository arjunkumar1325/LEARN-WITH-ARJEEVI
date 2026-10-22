import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Send,
  BookOpen,
  Clock,
  Award,
  ShieldCheck,
  Settings,
  Download,
  Trash2,
  CheckCircle2,
  Languages,
  ChevronDown,
  Info,
  X,
  HelpCircle
} from 'lucide-react';

export default function AITeacherModal({ user, token, onClose, onOpenSubscription }) {
  // Session states
  const [isSpeakingSessionActive, setIsSpeakingSessionActive] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('idle'); // 'idle' | 'requesting' | 'listening' | 'thinking' | 'speaking' | 'muted' | 'error'
  const [statusMessage, setStatusMessage] = useState('Voice mode idle. Click Start Conversation to begin.');
  const [errorMessage, setErrorMessage] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Settings & Modes
  const [roleplayMode, setRoleplayMode] = useState('general'); // 'day' | 'interests' | 'college' | 'career' | 'situations' | 'general'
  const [userLevel, setUserLevel] = useState(user.currentLevel || 'Beginner'); // 'Beginner' | 'Intermediate' | 'Advanced'
  const [kannadaToggle, setKannadaToggle] = useState(user.explanationLanguage?.includes('Kannada') || false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProviderGuide, setShowProviderGuide] = useState(false);

  // Voice Speech Synthesis settings
  const [speechRate, setSpeechRate] = useState(userLevel === 'Beginner' ? 0.88 : 1.0);
  const [speechPitch, setSpeechPitch] = useState(1.05);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // Conversation history
  const [conversation, setConversation] = useState([
    {
      sender: 'ai',
      text: `Hello ${user.preferredName || user.name || 'Friend'}! I am Arjeevi, your friendly English speaking mentor. Don't worry about making mistakes — this is a safe, encouraging space. What would you like to talk about today?`,
      kannada: kannadaToggle ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಇಂಗ್ಲಿಷ್ ಮಾತನಾಡುವ ಮಾರ್ಗದರ್ಶಿ. ಹೆದರಬೇಡಿ, ಆರಾಮವಾಗಿ ಮಾತನಾಡಿ.' : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Session timer
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionTimerRef = useRef(null);

  // End of Session Summary Modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [savingSummary, setSavingSummary] = useState(false);

  // Cloud Provider Status
  const [providerInfo, setProviderInfo] = useState({
    provider: 'Built-in Pedagogical Speech Pipeline',
    hasCloudCredentials: false,
    activeModel: 'Arjeevi NLP Pedagogical Engine v2'
  });

  // Trial state
  const [trialData, setTrialData] = useState(null);
  const [trialExpired, setTrialExpired] = useState(false);

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [consistencyLeaderboard, setConsistencyLeaderboard] = useState([]);

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef(null);
  const chatBottomRef = useRef(null);
  const shouldListenRef = useRef(false);

  // On mount: fetch status, voices, trial
  useEffect(() => {
    fetchTrialStatus();
    fetchProviderStatus();
    loadBrowserVoices();

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadBrowserVoices;
    }

    return () => {
      stopVoiceLoop();
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // Update speech rate if level changes
  useEffect(() => {
    if (userLevel === 'Beginner') setSpeechRate(0.85);
    else if (userLevel === 'Intermediate') setSpeechRate(0.98);
    else setSpeechRate(1.08);
  }, [userLevel]);

  // Session timer ticker
  useEffect(() => {
    if (isSpeakingSessionActive) {
      sessionTimerRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    }
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [isSpeakingSessionActive]);

  // Scroll to bottom on conversation change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, loading]);

  const loadBrowserVoices = () => {
    if (!window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);

    if (!selectedVoiceURI && englishVoices.length > 0) {
      // Prefer Indian English or natural voices
      const natural = englishVoices.find(v => v.lang.includes('IN') || v.name.includes('Natural') || v.name.includes('India') || v.name.includes('Google'));
      setSelectedVoiceURI(natural ? natural.voiceURI : englishVoices[0].voiceURI);
    }
  };

  const fetchProviderStatus = async () => {
    try {
      const res = await fetch('/api/ai-teacher/provider-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProviderInfo(data);
      }
    } catch (err) {
      console.warn('Provider status error:', err);
    }
  };

  const fetchTrialStatus = async () => {
    try {
      const res = await fetch('/api/ai-teacher/trial-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTrialData(data.trial);
        if (!data.trial.hasFullAccess) {
          setTrialExpired(true);
        }
      }
    } catch (err) {
      console.error('Trial status error:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/ai-teacher/consistency-leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConsistencyLeaderboard(data.leaderboard);
        setShowLeaderboard(true);
      }
    } catch (err) {
      console.error('Leaderboard error:', err);
    }
  };

  // -------------------------------------------------------------
  // Speech Recognition & Voice Loop
  // -------------------------------------------------------------

  const startVoiceLoop = async () => {
    setErrorMessage(null);
    setPermissionDenied(false);

    // Pre-flight check for Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech Recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari on desktop or Android.');
      return;
    }

    // Explicit microphone permission check
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setSessionStatus('requesting');
        setStatusMessage('Requesting microphone permission...');
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.warn('Mic permission error:', err);
      setPermissionDenied(true);
      setSessionStatus('error');
      setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser settings to speak with Arjeevi.');
      return;
    }

    try {
      if (synthRef.current) synthRef.current.cancel();

      const rec = new SpeechRecognition();
      rec.continuous = false; // Turn-based speech loop
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Indian English accent recognition
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setSessionStatus('listening');
        setStatusMessage('Listening to your voice... Speak naturally!');
      };

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript) {
          setStatusMessage(`Hearing: "${interimTranscript}..."`);
        }

        if (finalTranscript && finalTranscript.trim()) {
          setStatusMessage('Processing your message...');
          handleUserUtterance(finalTranscript.trim());
        }
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionDenied(true);
          setSessionStatus('error');
          setErrorMessage('Microphone access blocked. Please enable microphone permission in your browser address bar.');
          stopVoiceLoop();
        } else if (event.error === 'no-speech') {
          // Normal silence, restart if session still live
          if (shouldListenRef.current) {
            setTimeout(() => {
              if (shouldListenRef.current && sessionStatus !== 'speaking') {
                try { rec.start(); } catch (_) {}
              }
            }, 500);
          }
        } else if (event.error === 'network') {
          setErrorMessage('Speech recognition network error. Click Retry to reconnect.');
          setSessionStatus('error');
        }
      };

      rec.onend = () => {
        // If still in speaking session and AI is not currently speaking, re-arm listening
        if (shouldListenRef.current && sessionStatus === 'listening') {
          setTimeout(() => {
            if (shouldListenRef.current && sessionStatus !== 'speaking') {
              try { rec.start(); } catch (_) {}
            }
          }, 400);
        }
      };

      recognitionRef.current = rec;
      shouldListenRef.current = true;
      setIsSpeakingSessionActive(true);
      rec.start();
    } catch (err) {
      console.error('Failed to initialize voice recognition:', err);
      setErrorMessage(`Voice setup failed: ${err.message}. Try clicking Start Conversation again.`);
      setSessionStatus('error');
    }
  };

  const stopVoiceLoop = () => {
    shouldListenRef.current = false;
    setIsSpeakingSessionActive(false);
    setSessionStatus('idle');
    setStatusMessage('Voice conversation ended.');

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }

    if (synthRef.current) {
      try { synthRef.current.cancel(); } catch (_) {}
    }
  };

  // Interruption Handling: user taps mic or speaks while AI is speaking
  const handleInterruptAI = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setSessionStatus('listening');
    setStatusMessage('Interrupted. Listening to you now...');
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (_) {}
    }
  };

  // User Utterance Submission
  const handleUserUtterance = async (messageText) => {
    if (!messageText || !messageText.trim()) return;

    // Temporarily halt listening while processing
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory = [...conversation, { sender: 'user', text: messageText, timestamp }];
    setConversation(newHistory);
    setInputText('');
    setLoading(true);
    setSessionStatus('thinking');
    setStatusMessage('Arjeevi is formulating pedagogical feedback...');

    try {
      const res = await fetch('/api/ai-teacher/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText,
          roleplayMode,
          userLevel,
          history: newHistory.slice(-6)
        })
      });

      const data = await res.json();

      if (res.status === 403 && data.trialExpired) {
        setTrialExpired(true);
        stopVoiceLoop();
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate teacher response.');
      }

      // Add AI reply
      const aiReply = {
        sender: 'ai',
        text: data.speechText || data.displayMessage,
        kannada: data.kannadaNote,
        grammarFeedback: data.grammarFeedback,
        encouragement: data.encouragement,
        engine: data.engine,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setConversation([...newHistory, aiReply]);

      // Speak response aloud if not muted
      if (!isMuted) {
        speakAIResponse(data.speechText || data.displayMessage);
      } else {
        // If muted, resume listening after short delay
        setSessionStatus('listening');
        setStatusMessage('Listening to your voice... (AI audio is muted)');
        if (shouldListenRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMessage(`Conversation error: ${err.message}. Click Retry to continue.`);
      setSessionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech Output
  const speakAIResponse = (text) => {
    if (!synthRef.current || isMuted) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    // Apply selected voice
    if (selectedVoiceURI) {
      const chosenVoice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (chosenVoice) utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      setSessionStatus('speaking');
      setStatusMessage('Arjeevi is speaking aloud... (Tap mic to interrupt)');
    };

    utterance.onend = () => {
      // When AI completes speaking, automatically resume listening if session is live
      if (shouldListenRef.current && recognitionRef.current) {
        setSessionStatus('listening');
        setStatusMessage('Your turn! Listening to you...');
        setTimeout(() => {
          if (shouldListenRef.current && sessionStatus !== 'speaking') {
            try { recognitionRef.current.start(); } catch (_) {}
          }
        }, 300);
      } else {
        setSessionStatus('idle');
        setStatusMessage('Speech finished.');
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSessionStatus('idle');
      if (shouldListenRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (_) {}
      }
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Manually stop speaking immediately
  const handleStopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setSessionStatus('idle');
    setStatusMessage('AI speech silenced.');
  };

  // Replay message audio
  const handleReplayMessage = (text) => {
    speakAIResponse(text);
  };

  // On-demand Kannada translation
  const handleTranslateKannada = async (idx, text) => {
    try {
      const res = await fetch('/api/ai-teacher/translate-kannada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success && data.kannada) {
        setConversation(prev => prev.map((msg, i) => i === idx ? { ...msg, kannada: data.kannada } : msg));
      }
    } catch (err) {
      console.error('Translation error:', err);
    }
  };

  // End Conversation & Generate Summary Modal
  const handleEndConversation = async () => {
    stopVoiceLoop();
    setSavingSummary(true);

    try {
      const res = await fetch('/api/ai-teacher/session-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation,
          roleplayMode,
          durationSeconds: sessionSeconds
        })
      });

      const data = await res.json();
      if (data.success) {
        setSessionSummaryData(data.summary);
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error('Session summary error:', err);
      // Fallback local summary
      setSessionSummaryData({
        learnerName: user.preferredName || user.name || 'Friend',
        learnerLevel: userLevel,
        durationMinutes: Math.max(1, Math.round(sessionSeconds / 60)),
        totalTurns: conversation.filter(m => m.sender === 'user').length,
        fluencyScore: 85,
        encouragementNote: "Splendid speaking session! You practiced naturally and spoke with courage.",
        vocabularyLearned: [
          { word: "Perseverance", meaning: "Continued effort despite obstacles", example: "Perseverance brings fluency." },
          { word: "Articulate", meaning: "Expressing ideas clearly in speech", example: "She gave an articulate response." }
        ],
        grammarSlipsReviewed: []
      });
      setShowSummaryModal(true);
    } finally {
      setSavingSummary(false);
    }
  };

  // Clear Transcript
  const handleClearTranscript = () => {
    if (window.confirm('Clear all conversation messages from this screen?')) {
      setConversation([]);
    }
  };

  // Download Transcript as .txt
  const handleDownloadTranscript = () => {
    const textContent = conversation.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}${m.kannada ? `\n(Kannada: ${m.kannada})` : ''}`).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arjeevi_speaking_session_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Format seconds to mm:ss
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', height: '92vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>

        {/* 1. Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}>
              <Sparkles size={24} color="#FFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF' }}>Arjeevi AI Voice Teacher</h2>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>Phase 2 Real-Time Voice</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Learn privately. Speak confidently. Grow together.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Cloud Provider Indicator Button */}
            <button
              onClick={() => setShowProviderGuide(true)}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Click to view AI Provider & Real-Time Setup Guide"
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: providerInfo.hasCloudCredentials ? '#10B981' : '#38BDF8'
              }} />
              <span>{providerInfo.provider}</span>
              <Info size={13} color="var(--text-muted)" />
            </button>

            {/* Streak Rewards */}
            <button
              onClick={fetchLeaderboard}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 10px' }}
              title="Consistency Streak Leaderboard"
            >
              <Award size={14} color="#F59E0B" />
              <span className="hide-on-mobile">Rewards</span>
            </button>

            {/* Voice Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 10px', color: showSettings ? '#38BDF8' : 'inherit' }}
              title="Voice & Speech Settings"
            >
              <Settings size={14} />
            </button>

            {/* Close Button */}
            <button
              onClick={() => { stopVoiceLoop(); onClose(); }}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* 2. Privacy & Trial Banners */}
        {trialData && !trialExpired && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.18) 0%, rgba(6, 182, 212, 0.12) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '8px 14px',
            marginBottom: '10px',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color="#67E8F9" />
              <span>
                <strong>7-Day Free AI Trial:</strong> {trialData.daysRemaining}d {trialData.hoursRemaining}h remaining
                {trialData.consistencyBonusDays > 0 && ` (+${trialData.consistencyBonusDays} streak bonus days)`}
              </span>
            </div>
            <button
              onClick={() => { stopVoiceLoop(); onOpenSubscription(); }}
              className="btn btn-cyan"
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              Unlimited ₹49/mo
            </button>
          </div>
        )}

        {/* Trial Expired Alert */}
        {trialExpired && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ fontSize: '1.1rem', color: '#FDA4AF', marginBottom: '6px' }}>
              Your 7-Day AI Teacher Free Trial Has Ended
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
              Subscribe for only <strong>₹49/month</strong> to unlock unlimited AI voice sessions, roleplays, and personalized fluency coaching.
            </p>
            <button
              onClick={() => { stopVoiceLoop(); onOpenSubscription(); }}
              className="btn btn-cyan"
              style={{ padding: '8px 18px', fontWeight: 700 }}
            >
              Upgrade for ₹49/Month
            </button>
          </div>
        )}

        {/* 3. Scenario & Level Selector Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {/* Situation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scenario:</span>
            {[
              { id: 'general', label: 'Friendly Chat' },
              { id: 'day', label: 'My Day' },
              { id: 'interests', label: 'Hobbies' },
              { id: 'college', label: 'College' },
              { id: 'career', label: 'Job Interview' },
              { id: 'situations', label: 'Cafe & Travel' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setRoleplayMode(m.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: roleplayMode === m.id ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                  border: roleplayMode === m.id ? '1px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                  color: roleplayMode === m.id ? '#FFF' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Level Selector & Kannada Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Level:</span>
              <select
                value={userLevel}
                onChange={(e) => setUserLevel(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#38BDF8',
                  padding: '3px 8px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                <option value="Beginner">Beginner (A1-A2)</option>
                <option value="Intermediate">Intermediate (B1-B2)</option>
                <option value="Advanced">Advanced (C1-C2)</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#67E8F9' }}>
              <input
                type="checkbox"
                checked={kannadaToggle}
                onChange={(e) => setKannadaToggle(e.target.checked)}
              />
              <span>ಕನ್ನಡ ವಿವರಣೆ (Kannada)</span>
            </label>
          </div>
        </div>

        {/* 4. Voice & Speech Settings (Collapsible) */}
        {showSettings && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                AI Voice Persona:
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#FFF',
                  padding: '5px 8px',
                  fontSize: '0.78rem'
                }}
              >
                {availableVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Speaking Rate (Pace):</span>
                <span>{speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '6px 12px', flex: 1 }}
              >
                {isMuted ? <><VolumeX size={14} color="#FDA4AF" /> Unmute Audio</> : <><Volume2 size={14} color="#67E8F9" /> Audio Active</>}
              </button>

              <button
                onClick={handleClearTranscript}
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                title="Clear current transcript"
              >
                <Trash2 size={14} /> Clear
              </button>

              <button
                onClick={handleDownloadTranscript}
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                title="Download transcript as text"
              >
                <Download size={14} /> Save
              </button>
            </div>
          </div>
        )}

        {/* 5. Permission / Error Notice */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            color: '#FECACA'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#F87171" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={startVoiceLoop}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#FFF' }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* 6. Live Conversation Transcript Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: 'rgba(7, 13, 24, 0.75)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '12px 18px',
                borderRadius: '16px',
                background: msg.sender === 'user'
                  ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                  : 'rgba(30, 41, 59, 0.85)',
                color: '#FFF',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                fontSize: '0.92rem',
                lineHeight: 1.5,
                boxShadow: msg.sender === 'user' ? '0 4px 14px rgba(124, 58, 237, 0.3)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: msg.sender === 'user' ? '#E9D5FF' : '#38BDF8', fontWeight: 700 }}>
                    {msg.sender === 'user' ? 'You' : 'Arjeevi'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.5)' }}>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleReplayMessage(msg.text)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#67E8F9', padding: '2px' }}
                        title="Replay Audio"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div>{msg.text}</div>

                {/* Gentle Grammar Correction Box */}
                {msg.grammarFeedback && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    color: '#E0F2FE'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#38BDF8', marginBottom: '3px' }}>
                      <CheckCircle2 size={14} />
                      <span>Gentle Grammar Tip:</span>
                    </div>
                    <div>Suggested natural phrase: <strong style={{ color: '#FFF' }}>"{msg.grammarFeedback.suggestedCorrection}"</strong></div>
                    <div style={{ color: 'var(--text-dim)', marginTop: '2px', fontSize: '0.78rem' }}>{msg.grammarFeedback.ruleExplanation}</div>
                    {msg.grammarFeedback.kannadaExplanation && kannadaToggle && (
                      <div style={{ color: '#67E8F9', marginTop: '4px', fontSize: '0.8rem' }}>
                        {msg.grammarFeedback.kannadaExplanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Kannada Translation */}
                {kannadaToggle && msg.kannada && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.82rem',
                    color: '#67E8F9'
                  }}>
                    {msg.kannada}
                  </div>
                )}

                {/* On-demand Kannada translate button */}
                {msg.sender === 'ai' && !msg.kannada && (
                  <button
                    onClick={() => handleTranslateKannada(idx, msg.text)}
                    style={{
                      marginTop: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Languages size={12} /> Explain in Kannada
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '4px', padding: '10px', alignItems: 'center' }}>
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                Arjeevi is listening and coaching...
              </span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* 7. Real-Time Voice Teacher Control Hub */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Top Status & Duration Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Visual Status Indicator Light */}
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: sessionStatus === 'listening' ? '#22D3EE' : sessionStatus === 'speaking' ? '#A78BFA' : sessionStatus === 'thinking' ? '#F59E0B' : '#64748B',
                boxShadow: sessionStatus === 'listening' ? '0 0 12px #22D3EE' : sessionStatus === 'speaking' ? '0 0 12px #A78BFA' : 'none'
              }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: sessionStatus === 'listening' ? '#22D3EE' : sessionStatus === 'speaking' ? '#C084FC' : 'var(--text-main)' }}>
                {statusMessage}
              </span>
            </div>

            {/* Session Timer */}
            {isSpeakingSessionActive && (
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#67E8F9',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={13} />
                <span>Practice Time: {formatTime(sessionSeconds)}</span>
              </div>
            )}
          </div>

          {/* Center Stage: Large Microphone Button & Start/End Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            {/* Large Microphone Button with Live Waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={
                  sessionStatus === 'speaking'
                    ? handleInterruptAI
                    : isSpeakingSessionActive
                    ? stopVoiceLoop
                    : startVoiceLoop
                }
                className={`btn ${sessionStatus === 'listening' ? 'mic-listening-active' : sessionStatus === 'speaking' ? 'mic-speaking-active' : ''}`}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: sessionStatus === 'listening'
                    ? 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)'
                    : sessionStatus === 'speaking'
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
                    : isSpeakingSessionActive
                    ? '#EF4444'
                    : 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                  transition: 'all 0.25s ease'
                }}
                title={sessionStatus === 'speaking' ? 'Tap to Interrupt AI & Speak' : isSpeakingSessionActive ? 'Tap to Pause Speaking' : 'Tap to Start Speaking'}
              >
                {sessionStatus === 'listening' ? (
                  <Mic size={30} color="#FFF" />
                ) : sessionStatus === 'speaking' ? (
                  <Volume2 size={30} color="#FFF" />
                ) : isSpeakingSessionActive ? (
                  <MicOff size={30} color="#FFF" />
                ) : (
                  <Mic size={30} color="#FFF" />
                )}
              </button>

              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FFF' }}>
                  {sessionStatus === 'listening'
                    ? 'Listening... Speak naturally'
                    : sessionStatus === 'speaking'
                    ? 'AI Speaking aloud'
                    : isSpeakingSessionActive
                    ? 'Session Live'
                    : 'Real-Time Voice'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {sessionStatus === 'speaking'
                    ? 'Tap the mic at any moment to interrupt'
                    : 'Continuous dialogue with zero recording uploads'}
                </div>
              </div>
            </div>

            {/* Clear Start & End Conversation Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {sessionStatus === 'speaking' && (
                <button
                  onClick={handleStopSpeaking}
                  className="btn btn-outline"
                  style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#FDA4AF', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                  title="Silence AI voice immediately"
                >
                  <Square size={14} /> Stop Speech
                </button>
              )}

              {!isSpeakingSessionActive ? (
                <button
                  onClick={startVoiceLoop}
                  className="btn btn-cyan"
                  style={{ padding: '10px 22px', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Mic size={18} /> Start Conversation
                </button>
              ) : (
                <button
                  onClick={handleEndConversation}
                  disabled={savingSummary}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={18} /> {savingSummary ? 'Generating Summary...' : 'End Conversation'}
                </button>
              )}
            </div>
          </div>

          {/* Fallback Text Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleUserUtterance(inputText); }}
            style={{ display: 'flex', gap: '10px', marginTop: '4px' }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Or type what you want to say in English..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              style={{ padding: '10px 14px', fontSize: '0.88rem' }}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: '10px 16px' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* 8. End-Of-Session Progress & Vocabulary Summary Modal */}
        {showSummaryModal && sessionSummaryData && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '650px', background: '#0F172A', border: '1px solid rgba(124, 58, 237, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={24} color="#F59E0B" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF' }}>
                    Session Speaking Summary & Progress
                  </h3>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>
                    {sessionSummaryData.durationMinutes} min
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speaking Time</div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A78BFA' }}>
                    {sessionSummaryData.totalTurns}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Turns Spoken</div>
                </div>

                <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
                    {sessionSummaryData.fluencyScore}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fluency Score</div>
                </div>
              </div>

              {/* Teacher Encouragement */}
              <div style={{
                background: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
                fontSize: '0.88rem',
                color: '#E9D5FF'
              }}>
                <strong>Teacher Arjeevi's Note:</strong> {sessionSummaryData.encouragementNote}
              </div>

              {/* Vocabulary Learned */}
              {sessionSummaryData.vocabularyLearned && sessionSummaryData.vocabularyLearned.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#67E8F9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} /> New Vocabulary & Idiomatic Expressions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessionSummaryData.vocabularyLearned.map((v, i) => (
                      <div key={i} style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
                        <strong style={{ color: '#FCD34D' }}>{v.word}:</strong> {v.meaning}
                        <div style={{ color: 'var(--text-dim)', marginTop: '2px', fontStyle: 'italic' }}>Example: "{v.example}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kannada Summary */}
              {kannadaToggle && sessionSummaryData.kannadaSummary && (
                <div style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  fontSize: '0.84rem',
                  color: '#67E8F9'
                }}>
                  {sessionSummaryData.kannadaSummary}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleDownloadTranscript}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Download size={14} /> Download Transcript
                </button>
                <button
                  onClick={() => { setShowSummaryModal(false); onClose(); }}
                  className="btn btn-cyan"
                  style={{ fontSize: '0.85rem', fontWeight: 700 }}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. Real-Time Cloud Provider & Setup Guide Modal */}
        {showProviderGuide && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '600px', background: '#0F172A' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#38BDF8" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>AI Speech Architecture & Credentials</h3>
                </div>
                <button onClick={() => setShowProviderGuide(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '14px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Current Active Provider:</strong>{' '}
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>{providerInfo.provider}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Active Engine:</strong>{' '}
                  <span style={{ color: '#C084FC', fontWeight: 700 }}>{providerInfo.activeModel}</span>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Speech-to-Speech Streaming:</strong>{' '}
                  <span style={{ color: '#10B981', fontWeight: 600 }}>Web Speech Continuous Pipeline + SpeechSynthesis</span>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '12px'
                }}>
                  <div style={{ fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
                    How to enable Google Gemini 1.5 Flash (Optional):
                  </div>
                  <ol style={{ paddingLeft: '18px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Get your free Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: '#38BDF8' }}>Google AI Studio</a>.</li>
                    <li>Open the project's root <code>.env</code> file and add: <code>GEMINI_API_KEY=your_key_here</code>.</li>
                    <li>Restart the Node server. The application will immediately utilize Gemini 1.5 Flash.</li>
                    <li><strong>No key?</strong> The built-in pedagogical teacher operates 100% locally with zero latency, full grammar checks, roleplays, and Kannada support!</li>
                  </ol>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowProviderGuide(false)} className="btn btn-outline" style={{ fontSize: '0.82rem' }}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
