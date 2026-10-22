const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/quiz/current
router.get('/current', authenticateToken, (req, res) => {
  const data = db.read();
  const quiz = (data.weeklyQuizzes || [])[0];
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'No active quiz competition found.' });
  }

  // Strip answers to prevent client tampering
  const safeQuestions = (quiz.questions || []).map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));

  res.json({
    success: true,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      topic: quiz.topic,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      durationMinutes: quiz.durationMinutes,
      totalQuestions: safeQuestions.length,
      questions: safeQuestions,
      leaderboard: quiz.leaderboard || []
    }
  });
});

// POST /api/quiz/submit
router.post('/submit', authenticateToken, (req, res) => {
  const { quizId, answers, timeSpentSeconds } = req.body;
  if (!quizId || !answers) {
    return res.status(400).json({ success: false, error: 'Quiz ID and answers payload required.' });
  }

  const data = db.read();
  const quiz = (data.weeklyQuizzes || []).find(q => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Quiz competition not found.' });
  }

  // Anti-cheating: verify time spent is plausible (at least 5 seconds total)
  if (timeSpentSeconds !== undefined && timeSpentSeconds < 5) {
    return res.status(400).json({ success: false, error: 'Submission rejected: completion time unreasonably short.' });
  }

  let correctCount = 0;
  const detailedResults = [];

  (quiz.questions || []).forEach(q => {
    const userAns = answers[q.id];
    const isCorrect = userAns === q.answer;
    if (isCorrect) correctCount += 1;

    detailedResults.push({
      id: q.id,
      question: q.question,
      isCorrect,
      explanation: q.explanation,
      correctOption: q.options[q.answer]
    });
  });

  const percentageScore = Math.round((correctCount / (quiz.questions.length || 1)) * 100);

  // Update leaderboard
  const user = db.getUserById(req.user.id);
  quiz.leaderboard = quiz.leaderboard || [];

  // Check if user already submitted
  const existingEntryIdx = quiz.leaderboard.findIndex(e => e.userId === user.id || e.name === user.preferredName);
  const entry = {
    userId: user.id,
    name: user.preferredName || user.name,
    score: percentageScore,
    timeSeconds: timeSpentSeconds || 120,
    date: new Date().toISOString().split('T')[0]
  };

  if (existingEntryIdx !== -1) {
    if (percentageScore > quiz.leaderboard[existingEntryIdx].score) {
      quiz.leaderboard[existingEntryIdx] = entry;
    }
  } else {
    quiz.leaderboard.push(entry);
  }

  // Sort by score desc, then timeSeconds asc
  quiz.leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSeconds - b.timeSeconds;
  });

  // Assign ranks
  quiz.leaderboard.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  db.write(data);

  // Update user score in profile
  if (percentageScore > (user.grammarScore || 0)) {
    db.updateUser(user.id, { grammarScore: percentageScore });
  }

  res.json({
    success: true,
    score: percentageScore,
    correctCount,
    totalQuestions: quiz.questions.length,
    timeSpentSeconds,
    detailedResults,
    leaderboard: quiz.leaderboard
  });
});

module.exports = router;
