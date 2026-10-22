import React from 'react';
import { Sparkles, Users, MessageSquare, BookOpen, Trophy, ShieldCheck, ArrowRight, CheckCircle2, Lock, Flame } from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)', position: 'relative', overflowX: 'hidden' }}>
      {/* Background Radial Glow Accents */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '5%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />

      {/* TOP NAVIGATION BAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(7, 13, 24, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)'
          }}>
            <Sparkles size={22} color="#FFF" />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.04em', color: '#FFF' }}>
              LEARN WITH ARJEEVI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#67E8F9', fontWeight: 600 }}>
              Learn privately. Speak confidently. Grow together.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onOpenAuth('login')}
            className="btn btn-outline"
            style={{ fontSize: '0.9rem', padding: '8px 18px' }}
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="btn btn-cyan"
            style={{ fontSize: '0.9rem', padding: '8px 20px', fontWeight: 700 }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px 60px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(6, 182, 212, 0.15) 100%)',
          padding: '8px 20px',
          borderRadius: '999px',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          marginBottom: '24px'
        }}>
          <Sparkles size={16} color="#38BDF8" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', color: '#67E8F9' }}>
            AI-POWERED SPOKEN ENGLISH STARTUP
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '20px',
          letterSpacing: '-0.02em'
        }}>
          Overcome the Fear of Speaking English.
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: '#38BDF8',
          fontWeight: 600,
          marginBottom: '16px',
          fontFamily: 'var(--font-display)'
        }}>
          “Learn privately. Speak confidently. Grow together.”
        </p>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-muted)',
          maxWidth: '720px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          A private, judgment-free space built for learners who freeze or hesitate when speaking English.
          Practice conversation in real-time with our friendly AI voice teacher, join supportive human speaking clubs, and master interview-ready fluency.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          <button
            onClick={() => onOpenAuth('register')}
            className="btn btn-cyan"
            style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700 }}
          >
            Start Your Free Journey <ArrowRight size={18} />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="btn btn-outline"
            style={{ padding: '14px 28px', fontSize: '1.05rem' }}
          >
            Sign In with Demo Account
          </button>
        </div>

        {/* TRUST & IMPACT METRICS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38BDF8' }}>100%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Judgment-Free Safe Space</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#A78BFA' }}>7-Day</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Free AI Voice Teacher Trial</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399' }}>Free Forever</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Peer-to-Peer Speaking Club</div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FCD34D' }}>ಕನ್ನಡ + English</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Dual Explanation Support</div>
          </div>
        </div>
      </section>

      {/* CORE FEATURE CARDS */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>
            Built Specifically for Anxious English Learners
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            No public embarrassment. No intimidating classrooms. Just practical, friendly speaking practice that works.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: '28px 24px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Sparkles size={24} color="#C4B5FD" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
              Friendly AI Voice Teacher
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Speak naturally via microphone. Arjeevi listens warmly, compliments your attempts, and offers polite corrections without interrupting your flow.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: '28px 24px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(14, 165, 233, 0.1) 100%)',
              border: '1px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Users size={24} color="#67E8F9" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
              Free Human Speaking Club
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Connect 1-on-1 with real learners who share your goals. Protected with age-based safety filters (minors match strictly with minors) and instant block controls.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: '28px 24px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <BookOpen size={24} color="#38BDF8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
              Structured Pathways & PDFs
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Complete 27 guided modules across Beginner, Intermediate, and Advanced tiers. Download printable summary study guides and track grammar mastery.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card" style={{ padding: '28px 24px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Trophy size={24} color="#6EE7B7" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
              Quizzes & Verified Certificates
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Compete in weekly championships, maintain daily streaks, and earn verifiable completion certificates with unique verification IDs for your career.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section style={{ maxWidth: '900px', margin: '0 auto 80px auto', padding: '0 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
          border: '1.5px solid var(--violet-light)',
          borderRadius: '24px',
          padding: '40px 32px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '10px' }}>
            Ready to Speak Without Fear?
          </h2>
          <p style={{ color: '#E2E8F0', fontSize: '1rem', maxWidth: '540px', margin: '0 auto 24px auto' }}>
            Join thousands of learners discovering conversational confidence in a warm, friendly community.
          </p>
          <button
            onClick={() => onOpenAuth('register')}
            className="btn btn-cyan"
            style={{ padding: '14px 36px', fontSize: '1.05rem', fontWeight: 700 }}
          >
            Create Your Account Today
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '30px 24px',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-dim)',
        background: 'rgba(7, 13, 24, 0.95)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
          LEARN WITH ARJEEVI Spoken English Academy
        </div>
        <div>“Learn privately. Speak confidently. Grow together.” • Encrypted Sessions • Safe & Moderated</div>
      </footer>
    </div>
  );
}
