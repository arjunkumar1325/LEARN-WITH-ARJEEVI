import React, { useState } from 'react';
import { Sparkles, Shield, User, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onAuthSuccess, onBackToLanding }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid email address (e.g., you@example.com).');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Store token & notify app
      localStorage.setItem('arjeevi_token', data.token);
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'learner') {
      setEmail('learner@arjeevi.com');
      setPassword('Learner2026!');
      setIsLogin(true);
      setShowForgot(false);
      setError(null);
    } else if (role === 'admin') {
      setEmail('admin@arjeevi.com');
      setPassword('ArjeeviAdmin2026!');
      setIsLogin(true);
      setShowForgot(false);
      setError(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      background: 'var(--bg-deep)'
    }}>
      {/* Decorative Glow Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 35px rgba(124, 58, 237, 0.25)',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Back to Home Button */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <ArrowLeft size={16} /> Home
          </button>
        )}

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: onBackToLanding ? '16px' : 0 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
            padding: '6px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginBottom: '14px'
          }}>
            <Sparkles size={16} color="#38BDF8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', color: '#67E8F9' }}>
              LEARN WITH ARJEEVI
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px', fontWeight: 800 }}>
            {showForgot ? 'Reset Password' : isLogin ? 'Welcome Back!' : 'Start Your Journey'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            “Learn privately. Speak confidently. Grow together.”
          </p>
        </div>

        {/* Tab Switcher */}
        {!showForgot && (
          <div style={{
            display: 'flex',
            background: 'rgba(7, 13, 24, 0.8)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: isLogin ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : 'transparent',
                color: isLogin ? '#FFF' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                background: !isLogin ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : 'transparent',
                color: !isLogin ? '#FFF' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '10px',
            color: '#FDA4AF',
            fontSize: '0.88rem',
            marginBottom: '18px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Forgot Password Success */}
        {forgotSent && (
          <div style={{
            padding: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            color: '#6EE7B7',
            fontSize: '0.88rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={18} />
            <span>Recovery email dispatched if account exists. Check your inbox.</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={showForgot ? handleForgotPassword : handleSubmit}>
          {!isLogin && !showForgot && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="auth-name"
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="e.g. Ramesh Gowda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="auth-email"
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {!showForgot && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setError(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="form-input"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/* PASSWORD VISIBILITY TOGGLE */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
          >
            {loading ? 'Please wait...' : showForgot ? 'Send Reset Link' : isLogin ? 'Sign In to Learn' : 'Create My Free Account'}
            {!loading && <ArrowRight size={18} />}
          </button>

          {showForgot && (
            <button
              type="button"
              onClick={() => { setShowForgot(false); setForgotSent(false); }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                marginTop: '14px',
                cursor: 'pointer'
              }}
            >
              Back to Sign In
            </button>
          )}
        </form>

        {/* Demo Fast-fill Buttons */}
        <div style={{
          marginTop: '24px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instant Demo Credentials
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fillDemo('learner')}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              Demo Learner
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              Demo Admin (SOC)
            </button>
          </div>
        </div>

        {/* Security Assurance */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '18px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)'
        }}>
          <Shield size={14} color="#10B981" />
          <span>Encrypted sessions • Intrusion detection protected</span>
        </div>
      </div>
    </div>
  );
}
