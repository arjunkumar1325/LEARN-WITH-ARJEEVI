import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  BookOpen,
  PenTool,
  Layers,
  MessageSquare,
  Trophy,
  BarChart3,
  Award,
  Settings,
  Flame,
  Clock,
  Shield,
  LogOut,
  ChevronRight,
  Volume2,
  Calendar,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';

export default function Dashboard({
  user,
  token,
  onLogout,
  onOpenPeerRoom,
  onOpenAITeacher,
  onOpenCurriculum,
  onOpenExercises,
  onOpenQuiz,
  onOpenDebate,
  onOpenCertificates,
  onOpenSubscription,
  onOpenAdminSOC,
  onOpenProfile
}) {
  const [trialStatus, setTrialStatus] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetchTrial();
  }, []);

  const fetchTrial = async () => {
    try {
      const res = await fetch('/api/ai-teacher/trial-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTrialStatus(data.trial);
      }
    } catch (err) {
      console.error('Error checking trial:', err);
    }
  };

  // 10 Distinct Feature Cards
  const CARDS = [
    {
      id: 'peer',
      title: 'Speak with People',
      badge: 'Free Forever',
      badgeType: 'badge-emerald',
      desc: 'Free 1-on-1 audio/video calling with supportive learners matched by your English level and interests.',
      icon: Users,
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(14, 165, 233, 0.1) 100%)',
      borderColor: 'rgba(6, 182, 212, 0.4)',
      action: onOpenPeerRoom
    },
    {
      id: 'ai-teacher',
      title: 'AI English Teacher',
      badge: trialStatus?.isTrialActive ? `${trialStatus.daysRemaining}d Trial Left` : 'Unlimited Pass',
      badgeType: 'badge-violet',
      desc: 'Friendly real-time voice conversations. Polite error correction, role-play scenarios & Kannada explanations.',
      icon: Sparkles,
      gradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(168, 85, 247, 0.1) 100%)',
      borderColor: 'rgba(139, 92, 246, 0.5)',
      action: onOpenAITeacher
    },
    {
      id: 'curriculum',
      title: 'Learn English',
      badge: 'Beginner → Advanced',
      badgeType: 'badge-cyan',
      desc: 'Structured grammar lessons, phonetics, tenses, vocabulary, and downloadable PDF study sheets.',
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
      action: onOpenCurriculum
    },
    {
      id: 'fib',
      title: 'Fill in the Blanks',
      badge: '3 Difficulty Tiers',
      badgeType: 'badge-violet',
      desc: 'Interactive grammar drills covering prepositions, articles, tenses, and sentence connectors with instant feedback.',
      icon: PenTool,
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(109, 40, 217, 0.1) 100%)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      action: onOpenExercises
    },
    {
      id: 'sb',
      title: 'Sentence Builder',
      badge: 'Syntax Practice',
      badgeType: 'badge-cyan',
      desc: 'Arrange shuffled words into natural spoken sentences. Understand word order, negative inversion, and syntax.',
      icon: Layers,
      gradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
      borderColor: 'rgba(20, 184, 166, 0.35)',
      action: onOpenExercises
    },
    {
      id: 'debate',
      title: 'Debate Club',
      badge: 'Live Speaking',
      badgeType: 'badge-emerald',
      desc: 'Take turns speaking with proposition & opposition arguments, 60s round countdowns, and live notes.',
      icon: MessageSquare,
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      action: onOpenDebate
    },
    {
      id: 'quiz',
      title: 'Quiz Arena',
      badge: 'Weekly Grand Prize',
      badgeType: 'badge-rose',
      desc: 'Compete in weekly timed English championships. Test vocabulary, listening, idioms, and climb the leaderboard.',
      icon: Trophy,
      gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.1) 100%)',
      borderColor: 'rgba(244, 63, 94, 0.35)',
      action: onOpenQuiz
    },
    {
      id: 'progress',
      title: 'Learning Progress',
      badge: `${user.streak || 1} Day Streak`,
      badgeType: 'badge-violet',
      desc: 'Track speaking practice hours, grammar accuracy, daily streak consistency, and unlock 14-day AI trial rewards.',
      icon: BarChart3,
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)',
      borderColor: 'rgba(99, 102, 241, 0.35)',
      action: onOpenAITeacher
    },
    {
      id: 'certificates',
      title: 'Proficiency Certificates',
      badge: 'Verifiable ID',
      badgeType: 'badge-cyan',
      desc: 'Clear rigorous assessments to earn an official verified certificate with unique ID and PDF download.',
      icon: Award,
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      action: onOpenCertificates
    },
    {
      id: 'profile',
      title: 'Profile & Preferences',
      badge: 'Edit Details',
      badgeType: 'badge-cyan',
      desc: 'Update your display name, profile photo, learning goals, English proficiency level, and language preferences.',
      icon: Settings,
      gradient: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(71, 85, 105, 0.1) 100%)',
      borderColor: 'rgba(148, 163, 184, 0.3)',
      action: onOpenProfile
    }
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Top Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(7, 13, 24, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(124, 58, 237, 0.5)'
          }}>
            <Sparkles size={20} color="#FFF" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.04em', color: '#FFF' }}>
              LEARN WITH ARJEEVI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#67E8F9', fontWeight: 600 }}>
              Learn privately. Speak confidently. Grow together.
            </div>
          </div>
        </div>

        {/* User Stats & Quick Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Daily Streak */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#FCD34D',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <Flame size={16} color="#F59E0B" />
            <span>{user.streak || 1} Day Streak</span>
          </div>

          {/* Admin SOC Shortcut */}
          {user.role === 'admin' && (
            <button
              onClick={onOpenAdminSOC}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#FDA4AF', borderColor: 'rgba(244, 63, 94, 0.4)' }}
            >
              <Shield size={14} /> Security SOC
            </button>
          )}

          {/* User Profile Avatar & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '999px',
                padding: '4px 12px 4px 6px',
                cursor: 'pointer',
                color: '#FFF'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: user.profilePhoto?.startsWith('data:') ? 'transparent' : 'linear-gradient(135deg, #7C3AED, #22D3EE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                overflow: 'hidden'
              }}>
                {user.profilePhoto?.startsWith('data:') ? (
                  <img src={user.profilePhoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : user.profilePhoto ? (
                  user.profilePhoto
                ) : (
                  user.preferredName?.charAt(0) || 'L'
                )}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user.preferredName || user.name}</span>
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '260px',
                background: '#0F172A',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                zIndex: 60
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px' }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{user.email}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  Level: <strong style={{ color: '#67E8F9' }}>{user.currentLevel}</strong> • Goal: {user.dailyGoalMinutes} mins/day
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => { setProfileOpen(false); onOpenProfile(); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#67E8F9', fontSize: '0.85rem', padding: '6px 0', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Edit Profile & Preferences
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); onOpenSubscription(); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.85rem', padding: '6px 0', cursor: 'pointer' }}
                  >
                    Subscription Settings
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#FDA4AF', fontSize: '0.85rem', padding: '6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Welcome Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '24px',
          padding: '32px 28px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '680px', position: 'relative', zIndex: 1 }}>
            <span className="badge badge-cyan" style={{ marginBottom: '10px' }}>
              Spoken English Journey Active
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
              Welcome back, {user.preferredName || user.name}!
            </h1>
            <p style={{ color: '#E2E8F0', fontSize: '1rem', lineHeight: 1.5, marginBottom: '20px' }}>
              You are currently on the <strong>{user.currentLevel} Pathway</strong> with a daily practice target of <strong>{user.dailyGoalMinutes} minutes</strong>. Every small conversation rewires your confidence.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={onOpenPeerRoom}
                className="btn btn-cyan"
                style={{ padding: '12px 24px', fontWeight: 700 }}
              >
                <Users size={18} /> Start Speaking with People (Free)
              </button>
              <button
                onClick={onOpenAITeacher}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                <Sparkles size={18} /> Talk with AI Teacher
              </button>
            </div>
          </div>
        </div>

        {/* Learning Progress & Milestones Widget */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={20} color="#FFF" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF' }}>Your Learning Progress</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Lessons completed, accuracy scores, practice minutes, and consistency streak
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onOpenCurriculum}
                className="btn btn-cyan"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <BookOpen size={14} /> Resume Lessons
              </button>
              <button
                onClick={onOpenExercises}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                <PenTool size={14} /> Practice Drills
              </button>
            </div>
          </div>

          {/* Progress Bar for Completed Lessons */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Curriculum Completion:</span>
              <strong style={{ color: '#38BDF8' }}>
                {(user.lessonsCompleted || []).length} of 21 Lessons Completed ({Math.min(100, Math.round(((user.lessonsCompleted || []).length / 21) * 100))}%)
              </strong>
            </div>
            <div style={{ height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(4, Math.min(100, Math.round(((user.lessonsCompleted || []).length / 21) * 100)))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #7C3AED 0%, #06B6D4 100%)',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* 4 Statistics Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Proficiency Level</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38BDF8' }}>{user.currentLevel || 'Beginner'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Next: Advanced Fluency</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Active Streak</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F59E0B' }}>{user.streak || 1} Days 🔥</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Top 3 earn +14 AI trial days</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Practice Drills Solved</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34D399' }}>{user.drillsCompleted || 0} Drills</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>FIB, Syntax & Vocab</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Speaking Practice</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#A78BFA' }}>{user.practiceMinutes || 0} Mins</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Goal: {user.dailyGoalMinutes} min/day</div>
            </div>
          </div>
        </div>

        {/* 10 DISTINCT FEATURE CARDS */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
            Interactive Practice Modules
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Select an activity to begin your daily conversational practice:
          </p>

          <div className="grid-cards">
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={card.action}
                  className="glass-card"
                  style={{
                    padding: '24px 20px',
                    cursor: 'pointer',
                    background: card.gradient,
                    borderColor: card.borderColor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={22} color="#FFF" />
                      </div>
                      <span className={`badge ${card.badgeType}`}>{card.badge}</span>
                    </div>

                    <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '8px' }}>
                      {card.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                      {card.desc}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    color: '#67E8F9',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginTop: '20px'
                  }}>
                    <span>Open Module</span>
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* PERSISTENT FLOATING AI TEACHER ENTRY POINT */}
      <button
        onClick={onOpenAITeacher}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 40,
          background: 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
          color: '#FFF',
          padding: '14px 22px',
          borderRadius: '999px',
          border: 'none',
          boxShadow: '0 10px 30px rgba(124, 58, 237, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.95rem',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
      >
        <Sparkles size={20} color="#FFF" />
        <span>Talk to AI Teacher</span>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6EE7B7', boxShadow: '0 0 6px #6EE7B7' }} />
      </button>
    </div>
  );
}
