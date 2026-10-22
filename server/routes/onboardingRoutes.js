const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placement test questions bank
const PLACEMENT_QUESTIONS = [
  {
    id: 'p1',
    question: 'Choose the correct sentence:',
    options: [
      'She do not like coffee.',
      'She does not like coffee.',
      'She not likes coffee.',
      'She do like not coffee.'
    ],
    answer: 1
  },
  {
    id: 'p2',
    question: 'I have been living in this city ____ five years.',
    options: ['since', 'for', 'from', 'during'],
    answer: 1
  },
  {
    id: 'p3',
    question: 'If you ____ hard, you will achieve your dreams.',
    options: ['work', 'worked', 'will work', 'working'],
    answer: 0
  }
];

// GET /api/onboarding/placement-quiz
router.get('/placement-quiz', authenticateToken, (req, res) => {
  // Send questions without answers
  const safeQuestions = PLACEMENT_QUESTIONS.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));
  res.json({ success: true, questions: safeQuestions });
});

// POST /api/onboarding/evaluate-placement
router.post('/evaluate-placement', authenticateToken, (req, res) => {
  const { answers } = req.body; // { p1: 1, p2: 1, p3: 0 }
  let score = 0;
  if (answers && typeof answers === 'object') {
    PLACEMENT_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.answer) {
        score += 1;
      }
    });
  }

  let assessedLevel = 'Beginner';
  if (score === 3) assessedLevel = 'Advanced';
  else if (score === 2) assessedLevel = 'Intermediate';
  else assessedLevel = 'Beginner';

  res.json({
    success: true,
    score,
    total: PLACEMENT_QUESTIONS.length,
    assessedLevel,
    recommendation: `Based on your responses, we recommend starting with the ${assessedLevel} pathway.`
  });
});

// POST /api/onboarding/complete
router.post('/complete', authenticateToken, (req, res) => {
  try {
    const {
      name,
      preferredName,
      age,
      profilePhoto,
      goals,
      currentLevel,
      confidenceLevel,
      explanationLanguage,
      dailyGoalMinutes,
      topicsOfInterest,
      preferredPracticeTime
    } = req.body;

    const validatedAge = age ? Math.min(100, Math.max(8, parseInt(age, 10))) : null;

    const updates = {
      name: (name || req.user.name || 'Learner').trim(),
      preferredName: (preferredName || name || req.user.name || 'Learner').trim(),
      age: validatedAge,
      profilePhoto: profilePhoto || null,
      goals: Array.isArray(goals) ? goals : ['Everyday conversation'],
      currentLevel: currentLevel || 'Beginner',
      confidenceLevel: confidenceLevel || 'I am afraid to speak.',
      explanationLanguage: explanationLanguage || 'English',
      dailyGoalMinutes: dailyGoalMinutes ? parseInt(dailyGoalMinutes, 10) : 15,
      topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
      preferredPracticeTime: preferredPracticeTime || 'Evening (6 PM - 9 PM)',
      onboardingCompleted: true
    };

    const updatedUser = db.updateUser(req.user.id, updates);

    res.json({
      success: true,
      message: 'Onboarding completed successfully! Welcome to LEARN WITH ARJEEVI.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        preferredName: updatedUser.preferredName,
        age: updatedUser.age,
        goals: updatedUser.goals,
        currentLevel: updatedUser.currentLevel,
        confidenceLevel: updatedUser.confidenceLevel,
        explanationLanguage: updatedUser.explanationLanguage,
        dailyGoalMinutes: updatedUser.dailyGoalMinutes,
        onboardingCompleted: true,
        streak: updatedUser.streak
      }
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ success: false, error: 'Failed to save onboarding details.' });
  }
});

module.exports = router;
