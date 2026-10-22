import React, { useState, useEffect } from 'react';
import { Users, Clock, Mic, MessageSquare, ArrowRight, BookOpen, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

export default function DebateClub({ token, user, onClose }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Debate Room State
  const [inRoom, setInRoom] = useState(false);
  const [socket, setSocket] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [myRole, setMyRole] = useState('proposition'); // 'proposition' or 'opposition'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [learningNotes, setLearningNotes] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/debate/topics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTopics(data.topics);
        if (data.topics.length > 0) setSelectedTopic(data.topics[0]);
      }
    } catch (err) {
      console.error('Fetch topics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinDebateRoom = () => {
    if (!selectedTopic) return;
    const roomId = `deb_room_${selectedTopic.id}`;

    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('register_user', {
        userId: user.id,
        preferredName: user.preferredName || user.name,
        level: user.currentLevel
      });

      newSocket.emit('join_debate_room', {
        roomId,
        topicId: selectedTopic.id,
        role: myRole
      });
    });

    newSocket.on('debate_room_update', (data) => {
      setRoomData(data);
    });

    newSocket.on('debate_timer_tick', (data) => {
      setRoomData((prev) => prev ? { ...prev, ...data } : null);
    });

    newSocket.on('debate_completed', (data) => {
      setRoomData((prev) => prev ? { ...prev, status: 'completed' } : null);
    });

    setSocket(newSocket);
    setInRoom(true);
  };

  const leaveDebateRoom = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setInRoom(false);
    setRoomData(null);
  };

  const startRoundTimer = () => {
    if (socket && roomData) {
      socket.emit('start_debate_round', { roomId: `deb_room_${selectedTopic.id}` });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '860px', height: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-cyan)'
            }}>
              <Users size={22} color="#67E8F9" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Spoken Debate Club</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Structured turn-taking speaking debates with live timers & vocabulary prompts
              </div>
            </div>
          </div>
          <button onClick={() => { leaveDebateRoom(); onClose(); }} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            Close
          </button>
        </div>

        {/* MAIN VIEW: TOPIC BROWSER VS LIVE ROOM */}
        {!inRoom ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Topic Select Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '4px' }}>
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: selectedTopic?.id === t.id ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                    border: selectedTopic?.id === t.id ? '1px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                    color: selectedTopic?.id === t.id ? '#FFF' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t.category}
                </button>
              ))}
            </div>

            {selectedTopic && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(7, 13, 24, 0.9) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>Debate Topic</span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>{selectedTopic.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {selectedTopic.description}
                  </p>
                </div>

                {/* Rules of Debate */}
                <div className="glass-panel" style={{ padding: '18px' }}>
                  <h4 style={{ fontSize: '1rem', color: '#A78BFA', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> Round Timing & Rules
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(selectedTopic.rules || []).map((r, idx) => (
                      <li key={idx} style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>
                        • {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Proposition vs Opposition Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)'
                  }}>
                    <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.95rem', marginBottom: '8px' }}>
                      Proposition (FOR the Motion)
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(selectedTopic.propositionPoints || []).map((pt, idx) => (
                        <li key={idx} style={{ fontSize: '0.84rem', color: '#E2E8F0' }}>
                          • {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)'
                  }}>
                    <div style={{ fontWeight: 700, color: '#FDA4AF', fontSize: '0.95rem', marginBottom: '8px' }}>
                      Opposition (AGAINST the Motion)
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(selectedTopic.oppositionPoints || []).map((pt, idx) => (
                        <li key={idx} style={{ fontSize: '0.84rem', color: '#E2E8F0' }}>
                          • {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Vocabulary Suggestions */}
                <div style={{
                  padding: '14px 18px',
                  background: 'rgba(124, 58, 237, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C4B5FD', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Recommended Debate Vocabulary:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(selectedTopic.suggestedVocabulary || []).map((v) => (
                      <span key={v} className="badge badge-violet">{v}</span>
                    ))}
                  </div>
                </div>

                {/* Join Debate Action */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'rgba(7, 13, 24, 0.7)',
                  borderRadius: '14px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Choose your side:</span>
                    <button
                      onClick={() => setMyRole('proposition')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: myRole === 'proposition' ? '#0891B2' : 'rgba(255,255,255,0.05)',
                        color: '#FFF',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Proposition
                    </button>
                    <button
                      onClick={() => setMyRole('opposition')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: myRole === 'opposition' ? '#E11D48' : 'rgba(255,255,255,0.05)',
                        color: '#FFF',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Opposition
                    </button>
                  </div>

                  <button onClick={joinDebateRoom} className="btn btn-cyan" style={{ padding: '10px 22px', fontWeight: 700 }}>
                    Enter Live Debate Room <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* LIVE DEBATE ROOM */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Room Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: 'rgba(7, 13, 24, 0.85)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '4px' }}>Live Room</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{selectedTopic.title}</h3>
              </div>

              {/* Synchronized Turn Timer */}
              <div style={{
                textAlign: 'center',
                padding: '8px 20px',
                borderRadius: '12px',
                background: (roomData?.timerSeconds || 0) <= 10 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(6, 182, 212, 0.2)',
                border: '1px solid currentColor',
                color: (roomData?.timerSeconds || 0) <= 10 ? '#FDA4AF' : '#22D3EE'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Round {roomData?.currentRound || 1} • {roomData?.activeSpeakerRole === 'proposition' ? 'Proposition Speaking' : 'Opposition Speaking'}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                  {roomData?.timerSeconds || 60}s
                </div>
              </div>
            </div>

            {/* Speaking Turn Indicator */}
            <div style={{
              padding: '16px',
              borderRadius: '14px',
              background: roomData?.activeSpeakerRole === myRole ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: roomData?.activeSpeakerRole === myRole ? '1.5px solid #10B981' : '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: roomData?.activeSpeakerRole === myRole ? '#6EE7B7' : '#F1F5F9' }}>
                {roomData?.activeSpeakerRole === myRole
                  ? '🎙️ Your Turn to Speak! Present your arguments clearly and with poise.'
                  : '👂 Listen Actively. Note down points for your rebuttal.'}
              </div>
            </div>

            {/* Participants & Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', flex: 1 }}>
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#38BDF8', marginBottom: '8px' }}>
                  Debaters in Room ({roomData?.participants?.length || 1})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(roomData?.participants || []).map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(7, 13, 24, 0.5)', borderRadius: '8px', fontSize: '0.88rem' }}>
                      <span>{p.name}</span>
                      <span className={p.role === 'proposition' ? 'badge badge-cyan' : 'badge badge-rose'}>
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debate Learning Notes */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#A78BFA', marginBottom: '8px' }}>
                  Your Live Debate Notes & Vocabulary
                </h4>
                <textarea
                  className="form-textarea"
                  style={{ flex: 1, resize: 'none', fontSize: '0.88rem' }}
                  placeholder="Jot down rebuttal points, key statistics, and vocabulary you used..."
                  value={learningNotes}
                  onChange={(e) => setLearningNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Bottom Room Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
              <button onClick={leaveDebateRoom} className="btn btn-outline" style={{ fontSize: '0.88rem' }}>
                Leave Debate
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={startRoundTimer}
                  className="btn btn-cyan"
                  style={{ fontSize: '0.9rem', fontWeight: 700 }}
                >
                  <Clock size={16} /> Start 60s Round Timer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
