import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Mic,
  MicOff,
  PhoneOff,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function PeerSpeakingRoom({ user, token, onClose, onOpenAITeacher }) {
  const [socket, setSocket] = useState(null);
  // States: 'idle', 'searching', 'proposed', 'connecting', 'connected', 'ended'
  const [matchStatus, setMatchStatus] = useState('idle');
  const [callId, setCallId] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [starterPrompt, setStarterPrompt] = useState('');
  const [queueCount, setQueueCount] = useState(1);

  // Proposal Accept/Reject State
  const [proposalData, setProposalData] = useState(null);
  const [proposalCountdown, setProposalCountdown] = useState(15);
  const [hasAcceptedProposal, setHasAcceptedProposal] = useState(false);
  const proposalIntervalRef = useRef(null);

  // Audio & Hardware States
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [peerMicMuted, setPeerMicMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState('new'); // new, connecting, connected, disconnected, failed

  // Safety & Moderation States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate language or abuse');
  const [reportComments, setReportComments] = useState('');
  const [safetyNotice, setSafetyNotice] = useState(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // WebRTC ICE servers configuration (STUN for NAT traversal)
  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('register_user', {
        userId: user.id,
        name: user.name,
        preferredName: user.preferredName || user.name,
        age: user.age || 20,
        level: user.currentLevel || 'Beginner',
        goals: user.goals || [],
        explanationLanguage: user.explanationLanguage
      });
    });

    // 1. User is waiting in queue
    newSocket.on('match_waiting', (data) => {
      setMatchStatus('searching');
      setQueueCount(data.queuePosition || 1);
      setSafetyNotice(null);
    });

    // 2. Mutual Consent Handshake: Match Proposed
    newSocket.on('match_proposed', (data) => {
      setCallId(data.callId);
      setProposalData(data);
      setMatchStatus('proposed');
      setHasAcceptedProposal(false);
      setProposalCountdown(data.timeoutSeconds || 15);

      if (proposalIntervalRef.current) clearInterval(proposalIntervalRef.current);
      proposalIntervalRef.current = setInterval(() => {
        setProposalCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(proposalIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // 3. User accepted, waiting for partner
    newSocket.on('waiting_for_peer_consent', () => {
      setHasAcceptedProposal(true);
    });

    // 4. Partner or self declined
    newSocket.on('call_declined', (data) => {
      if (proposalIntervalRef.current) clearInterval(proposalIntervalRef.current);
      endCallCleanup();
      setMatchStatus('idle');
      setSafetyNotice(data.reason || 'Call invitation was declined.');
    });

    // 5. Both Accepted: Match Found & WebRTC Connection Initiated
    newSocket.on('match_found', async (data) => {
      if (proposalIntervalRef.current) clearInterval(proposalIntervalRef.current);
      setMatchStatus('connecting');
      setCallId(data.callId);
      setPeerInfo(data.peer);
      setStarterPrompt(data.starterPrompt);
      setCallDuration(0);

      // Start in-call duration timer
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Initialize WebRTC
      await setupWebRTC(newSocket, data.callId, data.isCaller);
    });

    // 6. Topic Prompt Update
    newSocket.on('new_prompt', (data) => {
      setStarterPrompt(data.starterPrompt);
    });

    // 7. Remote Peer Hardware Controls
    newSocket.on('peer_control_update', (data) => {
      if (data.micMuted !== undefined) setPeerMicMuted(data.micMuted);
    });

    // 8. Call Ended
    newSocket.on('call_ended', (data) => {
      endCallCleanup();
      setMatchStatus('ended');
      setSafetyNotice(data.reason || 'The speaking session has ended.');
    });

    // 9. Report Confirmation
    newSocket.on('report_confirmed', (data) => {
      setShowReportModal(false);
      setSafetyNotice(data.message);
    });

    newSocket.on('match_cancelled', () => {
      setMatchStatus('idle');
    });

    setSocket(newSocket);

    return () => {
      if (proposalIntervalRef.current) clearInterval(proposalIntervalRef.current);
      endCallCleanup();
      newSocket.disconnect();
    };
  }, []);

  const setupWebRTC = async (sock, cId, isCaller) => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'connected') {
          setMatchStatus('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setSafetyNotice('Connection issue detected. Reconnecting or terminating session...');
        }
      };

      // Add local audio track
      stream.getAudioTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote incoming audio track
      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((err) => {
            console.warn('Remote audio autoplay waiting for user interaction:', err);
          });
        }
      };

      // ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sock.emit('webrtc_ice_candidate', { callId: cId, candidate: event.candidate });
        }
      };

      sock.on('webrtc_ice_candidate', async ({ candidate }) => {
        try {
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (e) {
          console.warn('ICE Candidate exchange note:', e);
        }
      });

      sock.on('webrtc_offer', async ({ offer }) => {
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sock.emit('webrtc_answer', { callId: cId, answer });
      });

      sock.on('webrtc_answer', async ({ answer }) => {
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      // If caller, create and dispatch offer
      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sock.emit('webrtc_offer', { callId: cId, offer });
      }

      // Optimistic connect status
      setTimeout(() => {
        setMatchStatus('connected');
      }, 800);
    } catch (err) {
      console.error('WebRTC initialization error:', err);
      setSafetyNotice('Microphone access was denied or is unavailable. Please grant microphone permissions in your browser.');
      setMatchStatus('idle');
    }
  };

  // Action Handlers
  const startMatchmaking = () => {
    setSafetyNotice(null);
    setCallDuration(0);
    setMatchStatus('searching');
    socket?.emit('start_speaking_match', { mode: 'audio' });
  };

  const cancelMatchmaking = () => {
    if (proposalIntervalRef.current) clearInterval(proposalIntervalRef.current);
    socket?.emit('cancel_speaking_match');
    setMatchStatus('idle');
  };

  const handleAcceptProposal = () => {
    if (!proposalData) return;
    setHasAcceptedProposal(true);
    socket?.emit('respond_match_proposal', { callId: proposalData.callId, accept: true });
  };

  const handleDeclineProposal = () => {
    if (!proposalData) return;
    if (proposalIntervalRef.current) clearInterval(proposalIntervalRef.current);
    socket?.emit('respond_match_proposal', { callId: proposalData.callId, accept: false });
    setMatchStatus('idle');
    setProposalData(null);
  };

  const requestNewTopicPrompt = () => {
    if (callId) {
      socket?.emit('request_new_prompt', { callId });
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      const newMuted = !micMuted;
      setMicMuted(newMuted);
      socket?.emit('peer_control_update', { callId, micMuted: newMuted });
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !speakerMuted;
      setSpeakerMuted(!speakerMuted);
    }
  };

  const endCall = () => {
    socket?.emit('end_call', { callId });
    endCallCleanup();
    setMatchStatus('ended');
  };

  const endCallCleanup = () => {
    if (proposalIntervalRef.current) {
      clearInterval(proposalIntervalRef.current);
      proposalIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const submitReportAndBlock = () => {
    if (!peerInfo) return;
    socket?.emit('block_and_report_user', {
      callId,
      reportedUserId: peerInfo.userId || 'peer',
      reason: reportReason,
      comments: reportComments
    });
    endCallCleanup();
    setMatchStatus('ended');
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" style={{ maxWidth: '640px', position: 'relative' }}>
        {/* Hidden Remote Audio Element */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Volume2 size={22} color="#22D3EE" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Free Peer Speaking Practice</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Connect safely with supportive English learners • 100% Free
              </div>
            </div>
          </div>
          <button
            onClick={() => { endCallCleanup(); onClose(); }}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>

        {/* Community Safety Guarantee */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(124, 58, 237, 0.12)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          borderRadius: '10px',
          fontSize: '0.78rem',
          color: '#C4B5FD',
          marginBottom: '18px'
        }}>
          <ShieldCheck size={16} color="#A78BFA" style={{ flexShrink: 0 }} />
          <span>
            <strong>Safe Community:</strong> Minors only match with minors. Phone numbers & locations are hidden. Both users must accept before calling.
          </span>
        </div>

        {/* Safety Alert Notification Banner */}
        {safetyNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '10px',
            color: '#FDA4AF',
            fontSize: '0.86rem',
            marginBottom: '18px'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>{safetyNotice}</div>
          </div>
        )}

        {/* STATE 1: IDLE */}
        {matchStatus === 'idle' && (
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <Mic size={38} color="#67E8F9" />
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Find an English Speaking Partner</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
              Practise real conversations at your level ({user.currentLevel || 'Beginner'}). We will introduce you with an icebreaker so you never feel stuck.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={startMatchmaking}
                className="btn btn-cyan"
                style={{ padding: '14px 32px', fontSize: '1.02rem', fontWeight: 700, borderRadius: '12px' }}
              >
                Find Speaking Partner
              </button>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Audio-first WebRTC peer connection • No phone numbers exposed
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: SEARCHING */}
        {matchStatus === 'searching' && (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '24px' }}>
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Looking for a Safe Match...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Matching based on your level ({user.currentLevel}) and verified safety criteria.
            </p>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: '#38BDF8',
              fontSize: '0.8rem',
              marginBottom: '28px'
            }}>
              Position in queue: {queueCount}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={cancelMatchmaking} className="btn btn-outline">
                Cancel
              </button>
              <button
                onClick={() => { cancelMatchmaking(); onClose(); onOpenAITeacher(); }}
                className="btn btn-primary"
              >
                <Sparkles size={16} /> Practise with AI Teacher Instead
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: MATCH PROPOSED (ACCEPT / REJECT MUTUAL CONSENT FLOW) */}
        {matchStatus === 'proposed' && proposalData && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(7, 13, 24, 0.95) 100%)',
            border: '2px solid rgba(34, 211, 238, 0.4)',
            borderRadius: '18px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: 'rgba(34, 211, 238, 0.15)',
              color: '#38BDF8',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '16px'
            }}>
              <Sparkles size={14} /> Speaking Partner Found!
            </div>

            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              margin: '0 auto 12px auto',
              color: '#FFF'
            }}>
              {proposalData.peer?.name?.charAt(0) || 'P'}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>
              {proposalData.peer?.name || 'Speaking Partner'}
            </h3>
            <div style={{ fontSize: '0.85rem', color: '#38BDF8', marginBottom: '14px', fontWeight: 600 }}>
              {proposalData.peer?.level} Level Learner
            </div>

            {/* Partner's Selected Goals / Topics */}
            {proposalData.peer?.goals && proposalData.peer.goals.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {proposalData.peer.goals.slice(0, 3).map((g, idx) => (
                  <span key={idx} style={{
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    fontSize: '0.74rem',
                    color: '#E2E8F0'
                  }}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Conversation Starter Preview */}
            <div style={{
              padding: '12px 16px',
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '12px',
              fontSize: '0.86rem',
              color: '#E2E8F0',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.72rem', color: '#22D3EE', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                Suggested Conversation Topic
              </div>
              <div>{proposalData.starterPrompt}</div>
            </div>

            {/* Consent Notice */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {hasAcceptedProposal ? (
                <span style={{ color: '#6EE7B7', fontWeight: 600 }}>
                  You accepted! Waiting for {proposalData.peer?.name} to accept...
                </span>
              ) : (
                <span>
                  Would you like to start a peer audio call with {proposalData.peer?.name}? Both users must consent.
                </span>
              )}
            </div>

            {/* 15-second visual countdown */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: proposalCountdown <= 5 ? '#FDA4AF' : '#94A3B8',
              fontSize: '0.8rem',
              marginBottom: '20px'
            }}>
              <Clock size={14} /> Request expires in <strong>{proposalCountdown}s</strong>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleDeclineProposal}
                className="btn btn-outline"
                style={{ padding: '12px 24px', flex: 1, borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <XCircle size={16} /> Decline
              </button>

              <button
                onClick={handleAcceptProposal}
                disabled={hasAcceptedProposal}
                className="btn btn-cyan"
                style={{ padding: '12px 24px', flex: 1, fontWeight: 700 }}
              >
                {hasAcceptedProposal ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Accepted
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> Accept Call
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: CONNECTING */}
        {matchStatus === 'connecting' && (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <RefreshCw size={36} color="#22D3EE" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Establishing WebRTC Connection...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Negotiating peer-to-peer audio stream with {peerInfo?.name || 'partner'}.
            </p>
          </div>
        )}

        {/* STATE 5: CONNECTED LIVE CALL */}
        {matchStatus === 'connected' && (
          <div>
            {/* Call Status Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(7, 13, 24, 0.8)',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C3AED, #22D3EE)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#FFF'
                }}>
                  {peerInfo?.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{peerInfo?.name || 'Speaking Partner'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    {peerInfo?.level} Level • Connected Live
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#6EE7B7',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {formatSeconds(callDuration)}
              </div>
            </div>

            {/* Conversation Starter & Prompt Cycling */}
            {starterPrompt && (
              <div style={{
                padding: '16px 18px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(124, 58, 237, 0.08) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: '14px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
                    Discussion Icebreaker
                  </div>
                  <button
                    onClick={requestNewTopicPrompt}
                    className="btn btn-outline"
                    style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Get a new conversation starter"
                  >
                    <RefreshCw size={12} /> New Topic
                  </button>
                </div>
                <div style={{ fontSize: '0.92rem', color: '#F1F5F9', fontWeight: 500, lineHeight: 1.4 }}>
                  {starterPrompt}
                </div>
              </div>
            )}

            {/* Live Audio Activity Display */}
            <div style={{
              background: 'rgba(7, 13, 24, 0.5)',
              padding: '20px',
              borderRadius: '14px',
              textAlign: 'center',
              marginBottom: '22px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', height: '36px' }}>
                <span className="wave-bar" style={{ height: micMuted ? '6px' : '26px' }} />
                <span className="wave-bar" style={{ height: micMuted ? '6px' : '34px' }} />
                <span className="wave-bar" style={{ height: micMuted ? '6px' : '20px' }} />
                <span className="wave-bar" style={{ height: micMuted ? '6px' : '32px' }} />
                <span className="wave-bar" style={{ height: micMuted ? '6px' : '24px' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: micMuted ? '#FDA4AF' : 'var(--text-muted)', marginTop: '10px' }}>
                {micMuted ? 'Your microphone is muted.' : 'Live audio connected. Speak clearly and politely.'}
                {peerMicMuted && <span style={{ color: '#FCD34D', marginLeft: '6px' }}>• Partner is muted</span>}
              </div>
            </div>

            {/* Clear Call Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              {/* Mic Mute / Unmute */}
              <button
                onClick={toggleMic}
                className={micMuted ? 'btn btn-danger' : 'btn btn-outline'}
                style={{ width: '50px', height: '50px', borderRadius: '50%', padding: 0 }}
                title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {micMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {/* Speaker Volume Mute Toggle */}
              <button
                onClick={toggleSpeaker}
                className={speakerMuted ? 'btn btn-danger' : 'btn btn-outline'}
                style={{ width: '50px', height: '50px', borderRadius: '50%', padding: 0 }}
                title={speakerMuted ? 'Unmute Partner Audio' : 'Mute Partner Audio'}
              >
                {speakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>

              {/* Immediate End Call / Leave Button */}
              <button
                onClick={endCall}
                className="btn btn-danger"
                style={{ borderRadius: '999px', padding: '12px 26px', fontWeight: 700 }}
              >
                <PhoneOff size={18} /> End Call
              </button>

              {/* Block & Report Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="btn btn-outline"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  padding: 0,
                  color: '#FDA4AF',
                  borderColor: 'rgba(244, 63, 94, 0.4)'
                }}
                title="Report & Block User"
              >
                <AlertTriangle size={20} />
              </button>
            </div>

            {/* Honest Implementation Disclosure */}
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
              WebRTC Audio via Google STUN. Do not share sensitive personal information (passwords, bank info, or exact addresses).
            </div>
          </div>
        )}

        {/* STATE 6: CALL ENDED */}
        {matchStatus === 'ended' && (
          <div style={{ textAlign: 'center', padding: '28px 16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={32} color="#10B981" />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Speaking Session Completed</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '22px' }}>
              Awesome job practicing spoken English today! Daily 10-minute sessions boost long-term fluency.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={startMatchmaking} className="btn btn-cyan">
                <RefreshCw size={16} /> Practise with Another Partner
              </button>
              <button onClick={onClose} className="btn btn-outline">
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Block & Report Safety Modal */}
        {showReportModal && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.96)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 20
          }}>
            <h3 style={{ fontSize: '1.18rem', color: '#FDA4AF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} /> Block and Report User
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              This will immediately terminate the conversation, prevent this user from ever matching with you again, and submit a high-priority report to safety moderation.
            </p>

            <div className="form-group">
              <label className="form-label">Reason for Report</label>
              <select
                className="form-select"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="Inappropriate language or abuse">Inappropriate language or abuse</option>
                <option value="Asking for personal contact details">Asking for personal contact details</option>
                <option value="Harassment or making me uncomfortable">Harassment or making me uncomfortable</option>
                <option value="Spamming or advertising">Spamming or advertising</option>
                <option value="Other safety concern">Other safety concern</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Comments (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Please describe what occurred..."
                value={reportComments}
                onChange={(e) => setReportComments(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={submitReportAndBlock} className="btn btn-danger" style={{ flex: 1, fontWeight: 700 }}>
                Confirm Block & Report
              </button>
              <button onClick={() => setShowReportModal(false)} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
