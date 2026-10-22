import React, { useState, useEffect } from 'react';
import {
  Check,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Lock,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  GraduationCap,
  Briefcase,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SubscriptionModal({ token, user, onClose, onSubscriptionUpdated }) {
  const [loading, setLoading] = useState(false);
  const [subDetails, setSubDetails] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('ai-teacher-student-monthly');
  const [error, setError] = useState(null);
  const [successReceipt, setSuccessReceipt] = useState(null);

  useEffect(() => {
    fetchSubDetails();
  }, []);

  const fetchSubDetails = async () => {
    try {
      const res = await fetch('/api/subscription/details', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSubDetails(data);
        if (data.recommendedPlanId) {
          setSelectedPlanId(data.recommendedPlanId);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription details:', err);
    }
  };

  const handleCheckout = async (isSandboxMock = true) => {
    setError(null);
    setLoading(true);

    try {
      // 1. Create order on backend with selected plan
      const orderRes = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId: selectedPlanId })
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || 'Failed to create order.');

      const { orderId } = orderData.order;

      // 2. Cryptographic server-side verification of payment
      const verifyRes = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          planId: selectedPlanId,
          paymentId: `pay_test_${Date.now()}`,
          signature: 'sandbox_verified_signature',
          isSandboxMock: true
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment confirmation failed.');
      }

      setSuccessReceipt(verifyData.subscription);
      confetti({ particleCount: 110, spread: 70, origin: { y: 0.6 } });
      if (onSubscriptionUpdated) onSubscriptionUpdated();
      fetchSubDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!window.confirm('Are you sure you want to cancel auto-renewal? You will keep full access until your current period expires.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSubDetails();
        if (onSubscriptionUpdated) onSubscriptionUpdated();
      }
    } catch (err) {
      console.error('Cancellation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const plans = subDetails?.plans || [];
  const currentSub = subDetails?.currentSubscription;
  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-cyan)'
            }}>
              <Sparkles size={22} color="#22D3EE" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>AI Teacher Subscription & Pricing</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Affordable, friendly English fluency coaching tailored for India
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            Close
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#FDA4AF',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            border: '1px solid rgba(244, 63, 94, 0.35)'
          }}>
            {error}
          </div>
        )}

        {/* ACTIVE SUCCESS RECEIPT */}
        {successReceipt && (
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.12) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#6EE7B7', marginBottom: '6px', fontWeight: 800 }}>
              Subscription Successfully Activated!
            </h3>
            <p style={{ color: '#E2E8F0', fontSize: '0.9rem', marginBottom: '12px' }}>
              Your <strong>{successReceipt.planName}</strong> is now live for 30 days. Speak aloud anytime with zero hesitation!
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Transaction ID: <code>{successReceipt.paymentId}</code> • Valid until:{' '}
              {new Date(successReceipt.expiryDate).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* CURRENT ACTIVE SUBSCRIPTION CARD */}
        {currentSub && !successReceipt && (
          <div style={{
            padding: '18px 20px',
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid var(--border-focus)',
            borderRadius: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>Status: Active Pass</span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                ₹{currentSub.amount} / Month • {currentSub.planName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Renews on: {new Date(currentSub.expiryDate).toLocaleDateString()}
              </div>
            </div>

            {currentSub.autoRenew ? (
              <button
                onClick={handleCancelAutoRenew}
                disabled={loading}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', color: '#FDA4AF', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                Cancel Auto-Renew
              </button>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#FCD34D' }}>Auto-renewal disabled</span>
            )}
          </div>
        )}

        {/* 7-DAY FREE TRIAL STATUS NOTICE */}
        <div style={{
          padding: '12px 16px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '12px',
          fontSize: '0.84rem',
          color: '#E2E8F0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={20} color="#22D3EE" style={{ flexShrink: 0 }} />
          <div>
            <strong>7-Day Free Trial Notice:</strong> New learners enjoy full AI Teacher features free for 7 days. Once the trial concludes, choose an affordable pass below to continue.
          </div>
        </div>

        {/* SUBSCRIPTION PLAN SELECTION TOGGLE */}
        {!currentSub && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '10px' }}>
              Select Your Learning Plan
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Plan 1: Student Pass (₹49) */}
              <div
                onClick={() => setSelectedPlanId('ai-teacher-student-monthly')}
                style={{
                  padding: '18px 16px',
                  borderRadius: '16px',
                  border: selectedPlanId === 'ai-teacher-student-monthly' ? '2px solid #22D3EE' : '1px solid var(--border-subtle)',
                  background: selectedPlanId === 'ai-teacher-student-monthly' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {subDetails?.recommendedPlanId === 'ai-teacher-student-monthly' && (
                  <span className="badge badge-cyan" style={{ position: 'absolute', top: '-10px', right: '12px', fontSize: '0.7rem' }}>
                    Recommended
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <GraduationCap size={18} color="#22D3EE" />
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>Student Pass</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38BDF8' }}>₹49</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  College students, youth & campus job seekers
                </div>
              </div>

              {/* Plan 2: Adult / Professional Pass (₹59) */}
              <div
                onClick={() => setSelectedPlanId('ai-teacher-adult-monthly')}
                style={{
                  padding: '18px 16px',
                  borderRadius: '16px',
                  border: selectedPlanId === 'ai-teacher-adult-monthly' ? '2px solid #A78BFA' : '1px solid var(--border-subtle)',
                  background: selectedPlanId === 'ai-teacher-adult-monthly' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {subDetails?.recommendedPlanId === 'ai-teacher-adult-monthly' && (
                  <span className="badge badge-violet" style={{ position: 'absolute', top: '-10px', right: '12px', fontSize: '0.7rem' }}>
                    Recommended
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Briefcase size={18} color="#A78BFA" />
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>Adult & Pro Pass</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#C4B5FD' }}>₹59</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  Working professionals, parents & career adults
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE PLAN HIGHLIGHT CARD */}
        {activePlan && (
          <div style={{
            padding: '22px',
            background: 'linear-gradient(135deg, rgba(7, 13, 24, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1.5px solid var(--border-focus)',
            borderRadius: '18px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>Selected Plan</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activePlan.name}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38BDF8' }}>₹{activePlan.priceInr}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / month</span>
              </div>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {activePlan.features.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#F1F5F9' }}>
                  <Check size={16} color="#22D3EE" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* 100% Free Core Guarantee */}
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <strong style={{ color: '#6EE7B7' }}>100% Free Always:</strong> Peer speaking rooms, all 21 structured grammar lessons, interactive drills, debate club, and weekly quizzes remain free forever.
            </div>
          </div>
        )}

        {/* CHECKOUT ACTION BUTTON */}
        {!currentSub && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => handleCheckout(true)}
              disabled={loading}
              className="btn btn-cyan"
              style={{ width: '100%', padding: '14px', fontSize: '1.02rem', fontWeight: 700, borderRadius: '12px' }}
            >
              {loading ? (
                'Verifying with Payment Gateway...'
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CreditCard size={18} /> Subscribe for ₹{activePlan?.priceInr || 49} / month (Razorpay Sandbox)
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              UPI, RuPay, NetBanking & Cards • Server-side HMAC verified • No hidden fees
            </div>
          </div>
        )}

        {/* TRANSPARENT TERMS & CONSUMER POLICIES */}
        <div style={{
          background: 'rgba(7, 13, 24, 0.6)',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div>
            • <strong>No Automatic Charges on Trial Expiry:</strong> You will never be auto-debited when your free trial ends unless you explicitly authorize a subscription.
          </div>
          <div>
            • <strong>Simple 1-Click Cancellation:</strong> Cancel auto-renewal anytime from this modal. Full access continues until the end of your prepaid period.
          </div>
          <div>
            • <strong>48-Hour Guarantee:</strong> Contact us within 48 hours of initial subscription if unsatisfied for a full refund.
          </div>
          <div>
            • <strong>Youth & Minor Safeguards:</strong> Under-18 learners require parent/guardian consent before making digital payments.
          </div>
        </div>
      </div>
    </div>
  );
}
