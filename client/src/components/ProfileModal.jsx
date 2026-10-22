import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Check,
  Sparkles,
  AlertCircle,
  Save,
  X,
  Shield,
  Laptop,
  LogOut,
  RefreshCw,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function ProfileModal({ user, token, onClose, onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'

  // Profile Form States
  const [name, setName] = useState(user.name || '');
  const [preferredName, setPreferredName] = useState(user.preferredName || user.name || '');
  const [age, setAge] = useState(user.age || '');
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || '🌟');
  const [currentLevel, setCurrentLevel] = useState(user.currentLevel || 'Beginner');
  const [goals, setGoals] = useState(user.goals || ['Everyday conversation']);
  const [explanationLanguage, setExplanationLanguage] = useState(user.explanationLanguage || 'English + Kannada');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user.dailyGoalMinutes || 15);

  // Security & Sessions States
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [securityMsg, setSecurityMsg] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);

  const GOAL_OPTIONS = [
    'Everyday conversation',
    'College and education',
    'Job interviews',
    'IT and software careers',
    'Business and entrepreneurship',
    'Public speaking',
    'Competitive examinations',
    'International communication'
  ];

  const AVATAR_PRESETS = ['🌟', '🚀', '🎯', '💡', '🌱', '🏆', '💎', '🔥', '🎓', '👑'];

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!window.confirm('Sign out all other devices and browser sessions?')) return;
    setRevokingSessions(true);
    setSecurityMsg(null);
    try {
      const res = await fetch('/api/auth/sessions/revoke-others', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSecurityMsg(data.message);
        fetchSessions();
      }
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setRevokingSessions(false);
    }
  };

  const toggleGoal = (goal) => {
    if (goals.includes(goal)) {
      if (goals.length > 1) setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Image size should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          preferredName,
          age: age ? parseInt(age, 10) : null,
          profilePhoto,
          currentLevel,
          goals,
          explanationLanguage,
          dailyGoalMinutes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setSuccessMsg('Profile and preferences updated successfully!');
      onProfileUpdated(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-cyan)'
            }}>
              {activeTab === 'profile' ? <User size={20} color="#22D3EE" /> : <Shield size={20} color="#A78BFA" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {activeTab === 'profile' ? 'Profile & Preferences' : 'Security & Active Sessions'}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user.email} • {user.role === 'admin' ? 'Administrator' : 'Learner'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            Close
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? 'btn btn-cyan' : 'btn btn-outline'}
            style={{ fontSize: '0.84rem', padding: '6px 16px' }}
          >
            Learning Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={activeTab === 'security' ? 'btn btn-cyan' : 'btn btn-outline'}
            style={{ fontSize: '0.84rem', padding: '6px 16px' }}
          >
            <Shield size={14} /> Security & Sessions
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', color: '#6EE7B7', borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(244, 63, 94, 0.15)', color: '#FDA4AF', borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            {errorMsg}
          </div>
        )}

        {/* TAB 1: PROFILE & PREFERENCES */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave}>
            {/* AVATAR SELECTION */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Profile Avatar or Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: profilePhoto.startsWith('data:') ? 'transparent' : 'linear-gradient(135deg, #7C3AED, #22D3EE)',
                  border: '2px solid var(--border-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  overflow: 'hidden'
                }}>
                  {profilePhoto.startsWith('data:') ? (
                    <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profilePhoto
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <Camera size={16} /> Upload Photo
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {AVATAR_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setProfilePhoto(emoji)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: profilePhoto === emoji ? '2px solid var(--cyan-accent)' : '1px solid var(--border-subtle)',
                      background: profilePhoto === emoji ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      fontSize: '1.1rem',
                      cursor: 'pointer'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* NAME & PREFERRED NAME */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Preferred Name / Nickname</label>
                <input
                  type="text"
                  className="form-input"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="How AI should address you"
                />
              </div>
            </div>

            {/* AGE & LEVEL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Age (Protects minor safety)</label>
                <input
                  type="number"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="8"
                  max="100"
                  placeholder="e.g. 21"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">English Proficiency Level</label>
                <select
                  className="form-select"
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                >
                  <option value="Beginner">Beginner (Slow, encouraging speech)</option>
                  <option value="Intermediate">Intermediate (Conversational pace)</option>
                  <option value="Advanced">Advanced (Fluency, idioms & nuance)</option>
                </select>
              </div>
            </div>

            {/* LEARNING GOALS */}
            <div className="form-group">
              <label className="form-label">Primary Learning Focus</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {GOAL_OPTIONS.map((g) => {
                  const selected = goals.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGoal(g)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: selected ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: selected ? '1px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                        color: selected ? '#FFF' : 'var(--text-muted)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{g}</span>
                      {selected && <Check size={14} color="#38BDF8" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-cyan"
                style={{ padding: '10px 22px', fontWeight: 700 }}
              >
                <Save size={16} /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY & ACTIVE SESSIONS */}
        {activeTab === 'security' && (
          <div>
            {securityMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', color: '#6EE7B7', borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                {securityMsg}
              </div>
            )}

            {/* HONEST SECURITY DISCLOSURE */}
            <div style={{
              background: 'rgba(124, 58, 237, 0.12)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
              fontSize: '0.82rem',
              color: '#E2E8F0',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C4B5FD', fontWeight: 700, marginBottom: '4px' }}>
                <Shield size={16} /> Honest Security Posture
              </div>
              No system is 100% impossible to hack. LEARN WITH ARJEEVI adheres to defense-in-depth: your password is encrypted via bcrypt with individual salt rounds, payments are verified on the server using cryptographic HMAC signatures, and your session tokens expire automatically.
            </div>

            {/* ACTIVE SESSIONS LIST */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  Active Device Sessions ({sessions.length})
                </h4>
                <button
                  onClick={fetchSessions}
                  disabled={loadingSessions}
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {loadingSessions ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Loading session data...
                </div>
              ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  No session logs found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sessions.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: s.isCurrent ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: s.isCurrent ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Laptop size={18} color={s.isCurrent ? '#22D3EE' : '#94A3B8'} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {s.userAgent} {s.isCurrent && <span style={{ color: '#38BDF8', fontSize: '0.75rem' }}>(Current Device)</span>}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            IP: <code>{s.ip}</code> • Signed in: {new Date(s.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {s.isCurrent ? (
                        <span className="badge badge-emerald">This Device</span>
                      ) : (
                        <span className="badge badge-cyan">Other Device</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REVOKE OTHERS BUTTON */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <button
                onClick={handleRevokeOtherSessions}
                disabled={revokingSessions || sessions.length <= 1}
                className="btn btn-outline"
                style={{
                  width: '100%',
                  padding: '12px',
                  color: '#FDA4AF',
                  borderColor: 'rgba(244, 63, 94, 0.35)',
                  fontSize: '0.88rem'
                }}
              >
                <LogOut size={16} /> Sign Out All Other Devices
              </button>
            </div>

            {/* ACCOUNT RECOVERY NOTICE */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-dim)'
            }}>
              <div>• <strong>Account Recovery:</strong> Password reset tokens are single-use and expire within 60 minutes.</div>
              <div>• <strong>Suspicious Sign-in Alerts:</strong> If a sign-in is observed from an unrecognized IP, security notifications appear on your dashboard.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
