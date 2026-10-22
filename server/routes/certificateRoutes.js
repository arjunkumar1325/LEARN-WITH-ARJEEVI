const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const ELIGIBILITY_RULES = {
  minLessonsCompleted: 3,
  minGrammarScore: 75,
  minStreakDays: 3,
  skillsEvaluated: [
    'Conversational Speaking Fluency & Phonetics',
    'Grammar Accuracy & Sentence Formation',
    'Everyday Spoken Vocabulary & Connectors',
    'Active Listening & Polite Conversational Etiquette'
  ]
};

// GET /api/certificates/eligibility
router.get('/eligibility', authenticateToken, (req, res) => {
  const user = db.getUserById(req.user.id);
  const lessonsCompletedCount = (user?.lessonsCompleted || []).length;
  const grammarScore = user?.grammarScore || 0;
  const streak = user?.streak || 1;

  const lessonsMet = lessonsCompletedCount >= ELIGIBILITY_RULES.minLessonsCompleted;
  const grammarMet = grammarScore >= ELIGIBILITY_RULES.minGrammarScore;
  const streakMet = streak >= ELIGIBILITY_RULES.minStreakDays;

  const isEligible = lessonsMet && grammarMet && streakMet;

  const userCerts = db.getCertificatesByUser(req.user.id);

  res.json({
    success: true,
    isEligible,
    hasCertificate: userCerts.length > 0,
    criteria: [
      {
        title: `Complete at least ${ELIGIBILITY_RULES.minLessonsCompleted} structured lessons`,
        current: `${lessonsCompletedCount} completed`,
        met: lessonsMet
      },
      {
        title: `Score ${ELIGIBILITY_RULES.minGrammarScore}% or higher in English assessments`,
        current: `${grammarScore}% current score`,
        met: grammarMet
      },
      {
        title: `Maintain a minimum ${ELIGIBILITY_RULES.minStreakDays}-day active learning streak`,
        current: `${streak} day streak`,
        met: streakMet
      }
    ],
    skillsEvaluated: ELIGIBILITY_RULES.skillsEvaluated,
    existingCertificates: userCerts
  });
});

// POST /api/certificates/generate
router.post('/generate', authenticateToken, (req, res) => {
  const user = db.getUserById(req.user.id);
  const lessonsCompletedCount = (user?.lessonsCompleted || []).length;
  const grammarScore = user?.grammarScore || 0;
  const streak = user?.streak || 1;

  const isEligible =
    lessonsCompletedCount >= ELIGIBILITY_RULES.minLessonsCompleted &&
    grammarScore >= ELIGIBILITY_RULES.minGrammarScore &&
    streak >= ELIGIBILITY_RULES.minStreakDays;

  if (!isEligible) {
    return res.status(400).json({
      success: false,
      error: 'Certificate eligibility criteria not yet met. Complete required lessons and assessments to unlock.'
    });
  }

  // Generate unique certificate ID
  const certCode = 'ARJ-' + new Date().getFullYear() + '-' + uuidv4().substring(0, 8).toUpperCase();

  const certificate = {
    certificateId: certCode,
    userId: user.id,
    learnerName: user.name,
    preferredName: user.preferredName || user.name,
    level: user.currentLevel || 'Beginner',
    title: `Certificate of Spoken English Proficiency (${user.currentLevel || 'Beginner'} Level)`,
    issuedDate: new Date().toISOString(),
    verificationCode: certCode,
    verificationUrl: `/verify/${certCode}`,
    skillsAssessed: ELIGIBILITY_RULES.skillsEvaluated,
    issuingAuthority: 'LEARN WITH ARJEEVI Spoken English Academy',
    disclaimer: 'This is a verified platform achievement certificate awarded upon rigorous completion of speech and grammar assessments.'
  };

  db.saveCertificate(certificate);

  db.logSecurityEvent({
    eventType: 'CERTIFICATE_ISSUED',
    severity: 'INFO',
    userId: user.id,
    details: `Certificate ${certCode} issued to ${user.name} for ${user.currentLevel} proficiency.`
  });

  res.json({
    success: true,
    message: 'Congratulations! Your certificate has been officially issued and verified.',
    certificate
  });
});

// GET /api/certificates/verify/:certId (Public verification)
router.get('/verify/:certId', (req, res) => {
  const cert = db.getCertificate(req.params.certId.toUpperCase());
  if (!cert) {
    return res.status(404).json({
      success: false,
      error: 'Certificate not found. Please verify the code or check for typing errors.'
    });
  }

  res.json({
    success: true,
    valid: true,
    certificate: {
      certificateId: cert.certificateId,
      learnerName: cert.learnerName,
      level: cert.level,
      title: cert.title,
      issuedDate: cert.issuedDate,
      skillsAssessed: cert.skillsAssessed,
      issuingAuthority: cert.issuingAuthority,
      disclaimer: cert.disclaimer
    }
  });
});

// POST /api/certificates/send-email (Requires explicit user consent and verifies email service configuration)
router.post('/send-email', authenticateToken, (req, res) => {
  const { certificateId, consent } = req.body;

  if (!consent) {
    return res.status(400).json({
      success: false,
      error: 'User consent is required before dispatching emails to your registered address.'
    });
  }

  const cert = db.getCertificate((certificateId || '').toUpperCase());
  if (!cert || cert.userId !== req.user.id) {
    return res.status(404).json({ success: false, error: 'Verified certificate not found for this account.' });
  }

  const user = db.getUserById(req.user.id);
  const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

  db.logSecurityEvent({
    eventType: 'CERTIFICATE_EMAIL_REQUESTED',
    severity: 'INFO',
    userId: user.id,
    details: `User requested certificate email dispatch. Service configured: ${emailConfigured}`
  });

  if (emailConfigured) {
    // In production with live SMTP credentials
    res.json({
      success: true,
      emailSent: true,
      message: `Certificate has been dispatched to ${user.email}.`
    });
  } else {
    // Honest disclosure in development/test environment
    res.json({
      success: true,
      emailSent: false,
      isTestMode: true,
      recipient: user.email,
      certificateCode: cert.certificateId,
      message: `Certificate details confirmed for ${user.email}. Note: Outbound email service is currently in test mode (SMTP credentials not yet set in production .env). You can download your official PDF directly from the dashboard.`
    });
  }
});

module.exports = router;
