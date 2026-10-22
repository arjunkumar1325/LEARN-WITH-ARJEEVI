import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Download, ExternalLink, ShieldCheck, Sparkles, Search, Mail, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export default function CertificatesModal({ token, user, onClose }) {
  const [eligibilityData, setEligibilityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCert, setActiveCert] = useState(null);

  // Email Delivery State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);

  // Verification Search State
  const [searchCode, setSearchCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchEligibility();
  }, []);

  const fetchEligibility = async () => {
    try {
      const res = await fetch('/api/certificates/eligibility', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEligibilityData(data);
        if (data.existingCertificates?.length > 0) {
          setActiveCert(data.existingCertificates[0]);
        }
      }
    } catch (err) {
      console.error('Eligibility fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveCert(data.certificate);
        fetchEligibility();
        confetti({ particleCount: 120, spread: 80 });
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/certificates/verify/${searchCode.trim()}`);
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      setVerificationResult({ success: false, error: 'Verification network failure.' });
    } finally {
      setSearching(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailConsent) {
      alert('Please check the consent box to authorize sending the certificate to your email.');
      return;
    }
    setSendingEmail(true);
    setEmailNotice(null);
    try {
      const res = await fetch('/api/certificates/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          certificateId: activeCert.certificateId,
          consent: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailNotice(data.message);
      } else {
        alert(data.error || 'Failed to dispatch email.');
      }
    } catch (err) {
      console.error('Email error:', err);
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadCertificatePdf = (cert) => {
    if (!cert) return;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Elegant deep navy background
    doc.setFillColor(7, 13, 24);
    doc.rect(0, 0, 297, 210, 'F');

    // Outer border with violet glow
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(0.8);
    doc.rect(14, 14, 269, 182);

    // Title & Brand
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(26);
    doc.text('LEARN WITH ARJEEVI', 148.5, 38, { align: 'center' });

    doc.setTextColor(196, 181, 253);
    doc.setFontSize(14);
    doc.text('ACADEMY OF SPOKEN ENGLISH & CONVERSATIONAL MASTERY', 148.5, 48, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('CERTIFICATE OF SPOKEN ENGLISH PROFICIENCY', 148.5, 68, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(12);
    doc.text('This is officially awarded and verified to:', 148.5, 82, { align: 'center' });

    // Recipient Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text(cert.learnerName || user.name, 148.5, 98, { align: 'center' });

    // Level Description
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(13);
    doc.text(`For demonstrating verified fluency and oral comprehension at the ${cert.level || 'Intermediate'} level.`, 148.5, 112, { align: 'center' });

    // Skills Assessed List
    doc.setFontSize(10);
    doc.setTextColor(56, 189, 248);
    doc.text('Competencies Evaluated & Cleared:', 148.5, 126, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    const skills = cert.skillsAssessed || [
      'Conversational Speaking Fluency & Phonetics',
      'Grammar Accuracy & Sentence Formation',
      'Active Listening & Polite Conversational Etiquette'
    ];
    let skillY = 134;
    skills.forEach((s) => {
      doc.text(`• ${s}`, 148.5, skillY, { align: 'center' });
      skillY += 6;
    });

    // Footer Verification
    doc.setDrawColor(255, 255, 255, 0.1);
    doc.line(30, 168, 267, 168);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Certificate ID: ${cert.certificateId}`, 35, 180);
    doc.text(`Issue Date: ${new Date(cert.issuedDate).toLocaleDateString()}`, 35, 186);

    doc.text('Signatory: Arjeevi Chief Academic Mentor', 260, 180, { align: 'right' });
    doc.text('Verification: learn-with-arjeevi.app/verify', 260, 186, { align: 'right' });

    doc.save(`Arjeevi_Certificate_${cert.certificateId}.pdf`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-cyan)'
            }}>
              <Award size={22} color="#38BDF8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Proficiency Certificates</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Assessment-based verifiable spoken English credentials
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            Close
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Evaluating credentials...</div>
        ) : (
          <div>
            {/* EXISTING ISSUED CERTIFICATE DISPLAY */}
            {activeCert ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(7, 13, 24, 0.95) 100%)',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                borderRadius: '20px',
                padding: '28px',
                textAlign: 'center',
                marginBottom: '24px',
                boxShadow: '0 10px 40px rgba(124, 58, 237, 0.25)'
              }}>
                <span className="badge badge-emerald" style={{ marginBottom: '10px' }}>
                  <ShieldCheck size={14} /> Officially Verified Credential
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
                  {activeCert.title}
                </h3>
                <div style={{ fontSize: '1.1rem', color: '#67E8F9', fontWeight: 700, marginBottom: '12px' }}>
                  Awarded to {activeCert.learnerName}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Unique Verification ID: <strong>{activeCert.certificateId}</strong> • Issued on: {new Date(activeCert.issuedDate).toLocaleDateString()}
                </div>

                {emailNotice && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    borderRadius: '10px',
                    color: '#E2E8F0',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    {emailNotice}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => downloadCertificatePdf(activeCert)}
                    className="btn btn-cyan"
                    style={{ fontWeight: 700 }}
                  >
                    <Download size={16} /> Download Official PDF
                  </button>

                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="btn btn-outline"
                    style={{ fontWeight: 600 }}
                  >
                    <Mail size={16} /> Email Certificate
                  </button>
                </div>

                {/* Email Consent Modal */}
                {showEmailModal && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-cyan)',
                    textAlign: 'left'
                  }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '6px' }}>
                      Consent for Email Dispatch
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      We will dispatch your verified certificate and scorecard to: <strong>{user.email}</strong>.
                    </p>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '14px' }}>
                      <input
                        type="checkbox"
                        checked={emailConsent}
                        onChange={(e) => setEmailConsent(e.target.checked)}
                        style={{ marginTop: '2px' }}
                      />
                      <span>
                        I consent to receive my spoken English proficiency certificate and educational updates at my registered email address.
                      </span>
                    </label>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleSendEmail}
                        disabled={!emailConsent || sendingEmail}
                        className="btn btn-cyan"
                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                      >
                        {sendingEmail ? 'Dispatching...' : 'Confirm & Send Email'}
                      </button>
                      <button
                        onClick={() => setShowEmailModal(false)}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ELIGIBILITY CRITERIA CHECKLIST */
              <div style={{
                background: 'rgba(7, 13, 24, 0.8)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
                  Assessment Standard for Certificate Issuance
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Certificates are awarded based on genuine learning achievements, not merely logging in.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {(eligibilityData?.criteria || []).map((crit, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: crit.met ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: crit.met ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {crit.met ? (
                          <CheckCircle2 size={18} color="#10B981" />
                        ) : (
                          <XCircle size={18} color="#94A3B8" />
                        )}
                        <span style={{ fontSize: '0.92rem', color: crit.met ? '#F1F5F9' : 'var(--text-muted)' }}>
                          {crit.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: crit.met ? '#6EE7B7' : 'var(--text-dim)' }}>
                        {crit.current}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    disabled={!eligibilityData?.isEligible || generating}
                    onClick={handleGenerateCertificate}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                  >
                    {generating ? 'Issuing Certificate...' : eligibilityData?.isEligible ? 'Generate My Certificate' : 'Complete Criteria to Unlock'}
                  </button>
                </div>
              </div>
            )}

            {/* PUBLIC VERIFICATION LOOKUP TOOL */}
            <div style={{
              background: 'rgba(7, 13, 24, 0.6)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)'
            }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} color="#67E8F9" /> Public Credential Verification Tool
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Verify authenticity for employers, institutions, and LinkedIn:
              </p>

              <form onSubmit={handleVerifyCode} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Certificate ID (e.g. ARJ-2026-XXXX)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
                <button type="submit" disabled={searching} className="btn btn-cyan" style={{ padding: '10px 18px' }}>
                  {searching ? 'Checking...' : 'Verify'}
                </button>
              </form>

              {verificationResult && (
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: verificationResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: verificationResult.success ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(244, 63, 94, 0.4)',
                  fontSize: '0.88rem'
                }}>
                  {verificationResult.success ? (
                    <div>
                      <div style={{ color: '#6EE7B7', fontWeight: 700, marginBottom: '2px' }}>
                        ✓ Valid & Verified Credential
                      </div>
                      <div style={{ color: '#F1F5F9' }}>
                        Issued to <strong>{verificationResult.certificate.learnerName}</strong> ({verificationResult.certificate.level} Level) on {new Date(verificationResult.certificate.issuedDate).toLocaleDateString()}.
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#FDA4AF' }}>
                      ✗ {verificationResult.error || 'Certificate not found.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
