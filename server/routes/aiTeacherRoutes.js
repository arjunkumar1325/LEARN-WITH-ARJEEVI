const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const trialService = require('../services/trialService');
const aiTeacherService = require('../services/aiTeacherService');

const router = express.Router();

// GET /api/ai-teacher/provider-status
// Reports real-time AI credentials status and configuration instructions
router.get('/provider-status', authenticateToken, (req, res) => {
  const status = aiTeacherService.getProviderStatus();
  res.json(status);
});

// GET /api/ai-teacher/trial-status
router.get('/trial-status', authenticateToken, (req, res) => {
  const trialInfo = trialService.getOrInitTrial(req.user.id);
  res.json({
    success: true,
    trial: trialInfo,
    pricing: {
      monthlyInr: 49,
      planTitle: 'AI English Teacher Unlimited',
      currency: 'INR'
    }
  });
});

// POST /api/ai-teacher/chat
// Real-time voice utterance exchange with pedagogical analysis
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, roleplayMode = 'general', history = [], userLevel } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A spoken or written message is required.' });
    }

    // Server-enforced trial / entitlement verification
    const trialInfo = trialService.getOrInitTrial(req.user.id);
    if (!trialInfo.hasFullAccess) {
      return res.status(403).json({
        success: false,
        trialExpired: true,
        error: 'Your 7-day AI Teacher free trial has ended. Subscribe for only ₹49/month to continue unlimited voice conversations.',
        freeFeaturesAvailable: [
          'Peer-to-Peer Speaking with real people (100% Free)',
          'Structured Lessons and Topic study guides',
          'Fill-in-the-Blanks & Sentence Builder exercises',
          'Weekly Quiz Arena and Debate Club'
        ]
      });
    }

    const user = db.getUserById(req.user.id);
    const activeLevel = userLevel || user?.currentLevel || 'Beginner';

    const aiResult = await aiTeacherService.generateResponse({
      userMessage: message,
      conversationHistory: history,
      learnerLevel: activeLevel,
      preferredLanguage: user?.explanationLanguage || 'English',
      roleplayMode,
      learnerName: user?.preferredName || user?.name || 'Friend'
    });

    res.json({
      success: true,
      trialStatus: {
        daysRemaining: trialInfo.daysRemaining,
        hoursRemaining: trialInfo.hoursRemaining,
        isTrialActive: trialInfo.isTrialActive
      },
      ...aiResult
    });
  } catch (err) {
    console.error('AI Teacher error:', err);
    res.status(500).json({ success: false, error: 'Unable to generate AI Teacher reply. Please retry in a moment.' });
  }
});

// POST /api/ai-teacher/session-summary
// Generates session review (vocabulary, grammar corrections, fluency score) and saves practice minutes
router.post('/session-summary', authenticateToken, (req, res) => {
  try {
    const { conversation = [], roleplayMode = 'general', durationSeconds = 120 } = req.body;
    const user = db.getUserById(req.user.id);

    const summaryResult = aiTeacherService.generateSessionSummary({
      conversation,
      learnerLevel: user?.currentLevel || 'Beginner',
      durationSeconds,
      learnerName: user?.preferredName || user?.name || 'Friend'
    });

    // Update user stats in DB (practice minutes + streak)
    if (user) {
      const minutesAdded = Math.max(1, Math.round(durationSeconds / 60));
      const newMinutes = (user.practiceMinutes || 0) + minutesAdded;
      const updatedUser = db.updateUser(user.id, {
        practiceMinutes: newMinutes,
        streak: (user.streak || 1)
      });
      summaryResult.summary.totalPracticeMinutes = updatedUser.practiceMinutes;
      summaryResult.summary.streakDays = updatedUser.streak;
    }

    res.json(summaryResult);
  } catch (err) {
    console.error('Session summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate session summary.' });
  }
});

// POST /api/ai-teacher/translate-kannada
// Provides on-demand Kannada explanation for any phrase or sentence
router.post('/translate-kannada', authenticateToken, (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

    // Known grammar slips mapping or general Kannada guidance
    const grammarCheck = aiTeacherService.analyzeGrammar(text);
    if (grammarCheck && grammarCheck.kannadaExplanation) {
      return res.json({
        success: true,
        kannada: grammarCheck.kannadaExplanation,
        rule: grammarCheck.ruleExplanation
      });
    }

    res.json({
      success: true,
      kannada: "ಈ ವಾಕ್ಯವನ್ನು ನಿಧಾನವಾಗಿ ಮತ್ತು ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ. ತಪ್ಪುಗಳ ಬಗ್ಗೆ ಚಿಂತಿಸಬೇಡಿ!"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Translation error' });
  }
});

// GET /api/ai-teacher/consistency-leaderboard
router.get('/consistency-leaderboard', authenticateToken, (req, res) => {
  const data = db.read();
  const eligibleLearners = (data.users || [])
    .filter(u => u.role === 'learner' && u.onboardingCompleted)
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 10)
    .map((u, idx) => ({
      rank: idx + 1,
      name: u.preferredName || u.name,
      streakDays: u.streak || 1,
      level: u.currentLevel || 'Beginner',
      isTop3: idx < 3,
      rewardEligible: idx < 3 && (u.streak || 0) >= 3
    }));

  res.json({
    success: true,
    rewardDescription: 'The top 3 consistent learners with the highest active streaks receive an additional 14 days of free AI Teacher access!',
    currentPeriod: new Date().toISOString().substring(0, 7),
    leaderboard: eligibleLearners
  });
});

// POST /api/ai-teacher/evaluate-consistency-rewards (Internal/Admin)
router.post('/evaluate-consistency-rewards', authenticateToken, (req, res) => {
  const result = trialService.evaluateAndAwardConsistencyBonuses();
  res.json(result);
});

module.exports = router;
