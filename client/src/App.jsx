import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import ProfileModal from './components/ProfileModal';
import PeerSpeakingRoom from './components/PeerSpeakingRoom';
import AITeacherModal from './components/AITeacherModal';
import CurriculumView from './components/CurriculumView';
import GrammarExercises from './components/GrammarExercises';
import QuizArena from './components/QuizArena';
import DebateClub from './components/DebateClub';
import SubscriptionModal from './components/SubscriptionModal';
import CertificatesModal from './components/CertificatesModal';
import AdminSecurityDashboard from './components/AdminSecurityDashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('arjeevi_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication screen states when unauthenticated
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  // Active Modals when authenticated: 'profile', 'peer', 'ai-teacher', 'curriculum', 'exercises', 'quiz', 'debate', 'certificates', 'subscription', 'admin-soc'
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    if (token) {
      verifySession();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifySession = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
      } else {
        // Token expired or invalid
        localStorage.removeItem('arjeevi_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Session verify failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser, authToken) => {
    setUser(authenticatedUser);
    setToken(authToken);
    setShowAuthModal(false);
  };

  const handleOnboardingCompleted = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('arjeevi_token');
    setToken(null);
    setUser(null);
    setActiveModal(null);
    setShowAuthModal(false);
  };

  const refreshUser = () => {
    if (token) verifySession();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-deep)',
        color: 'var(--text-main)',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
          <span className="wave-bar" />
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8' }}>
          Connecting to LEARN WITH ARJEEVI...
        </div>
      </div>
    );
  }

  // 1. Not Authenticated -> Show Landing Page or Auth Page
  if (!user || !token) {
    if (showAuthModal) {
      return (
        <AuthModal
          initialMode={authInitialMode}
          onAuthSuccess={handleAuthSuccess}
          onBackToLanding={() => setShowAuthModal(false)}
        />
      );
    }
    return (
      <LandingPage
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode);
          setShowAuthModal(true);
        }}
      />
    );
  }

  // 2. Authenticated but first time -> Show 5-step Onboarding
  if (!user.onboardingCompleted) {
    return (
      <OnboardingFlow
        token={token}
        initialUser={user}
        onCompleted={handleOnboardingCompleted}
      />
    );
  }

  // 3. Authenticated & Onboarded -> Main Dashboard
  return (
    <>
      <Dashboard
        user={user}
        token={token}
        onLogout={handleLogout}
        onOpenPeerRoom={() => setActiveModal('peer')}
        onOpenAITeacher={() => setActiveModal('ai-teacher')}
        onOpenCurriculum={() => setActiveModal('curriculum')}
        onOpenExercises={() => setActiveModal('exercises')}
        onOpenQuiz={() => setActiveModal('quiz')}
        onOpenDebate={() => setActiveModal('debate')}
        onOpenCertificates={() => setActiveModal('certificates')}
        onOpenSubscription={() => setActiveModal('subscription')}
        onOpenAdminSOC={() => setActiveModal('admin-soc')}
        onOpenProfile={() => setActiveModal('profile')}
      />

      {/* Profile & Preferences Modal */}
      {activeModal === 'profile' && (
        <ProfileModal
          user={user}
          token={token}
          onClose={() => setActiveModal(null)}
          onProfileUpdated={(updated) => {
            setUser(updated);
          }}
        />
      )}

      {/* Feature Modals */}
      {activeModal === 'peer' && (
        <PeerSpeakingRoom
          user={user}
          token={token}
          onClose={() => setActiveModal(null)}
          onOpenAITeacher={() => setActiveModal('ai-teacher')}
        />
      )}

      {activeModal === 'ai-teacher' && (
        <AITeacherModal
          user={user}
          token={token}
          onClose={() => setActiveModal(null)}
          onOpenSubscription={() => setActiveModal('subscription')}
        />
      )}

      {activeModal === 'curriculum' && (
        <CurriculumView
          token={token}
          user={user}
          onClose={() => setActiveModal(null)}
          onLessonCompleted={refreshUser}
        />
      )}

      {activeModal === 'exercises' && (
        <GrammarExercises
          token={token}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'quiz' && (
        <QuizArena
          token={token}
          user={user}
          onClose={() => { setActiveModal(null); refreshUser(); }}
        />
      )}

      {activeModal === 'debate' && (
        <DebateClub
          token={token}
          user={user}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'certificates' && (
        <CertificatesModal
          token={token}
          user={user}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'subscription' && (
        <SubscriptionModal
          token={token}
          user={user}
          onClose={() => setActiveModal(null)}
          onSubscriptionUpdated={refreshUser}
        />
      )}

      {activeModal === 'admin-soc' && (
        <AdminSecurityDashboard
          token={token}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
