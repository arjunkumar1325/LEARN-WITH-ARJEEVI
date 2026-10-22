const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/lessons
router.get('/', authenticateToken, (req, res) => {
  const data = db.read();
  const user = db.getUserById(req.user.id);
  const completedIds = new Set(user?.lessonsCompleted || []);

  const categorized = {
    Beginner: [],
    Intermediate: [],
    Advanced: []
  };

  (data.lessons || []).forEach(lesson => {
    const isDone = completedIds.has(lesson.id);
    const summaryItem = {
      id: lesson.id,
      level: lesson.level,
      order: lesson.order,
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      isCompleted: isDone
    };

    if (categorized[lesson.level]) {
      categorized[lesson.level].push(summaryItem);
    }
  });

  res.json({
    success: true,
    userLevel: user?.currentLevel || 'Beginner',
    totalLessons: data.lessons.length,
    completedCount: completedIds.size,
    lessons: categorized
  });
});

// GET /api/lessons/:id
router.get('/:id', authenticateToken, (req, res) => {
  const data = db.read();
  const lesson = (data.lessons || []).find(l => l.id === req.params.id);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found.' });
  }

  const user = db.getUserById(req.user.id);
  const isCompleted = (user?.lessonsCompleted || []).includes(lesson.id);

  // Exclude raw quiz answers from public payload
  const safeContent = {
    ...lesson.content,
    quiz: (lesson.content.quiz || []).map((q, idx) => ({
      index: idx,
      q: q.q,
      options: q.options
    }))
  };

  res.json({
    success: true,
    lesson: {
      ...lesson,
      content: safeContent,
      isCompleted
    }
  });
});

// POST /api/lessons/:id/submit-quiz
router.post('/:id/submit-quiz', authenticateToken, (req, res) => {
  const data = db.read();
  const lesson = (data.lessons || []).find(l => l.id === req.params.id);
  if (!lesson) {
    return res.status(404).json({ success: false, error: 'Lesson not found.' });
  }

  const { answers } = req.body; // e.g. { "0": 1 }
  const realQuiz = lesson.content.quiz || [];
  let score = 0;
  const feedback = [];

  realQuiz.forEach((q, idx) => {
    const userChoice = answers ? answers[idx] : null;
    const isCorrect = userChoice === q.answer;
    if (isCorrect) score += 1;
    feedback.push({
      index: idx,
      isCorrect,
      explanation: q.explanation,
      correctAnswer: q.options[q.answer]
    });
  });

  const passed = score === realQuiz.length || realQuiz.length === 0;

  // If passed, mark completed
  let user = db.getUserById(req.user.id);
  let updatedLessons = user.lessonsCompleted || [];
  if (passed && !updatedLessons.includes(lesson.id)) {
    updatedLessons.push(lesson.id);
    db.updateUser(user.id, {
      lessonsCompleted: updatedLessons,
      grammarScore: Math.min(100, (user.grammarScore || 0) + 10)
    });
  }

  res.json({
    success: true,
    score,
    total: realQuiz.length,
    passed,
    feedback,
    totalCompletedCount: updatedLessons.length
  });
});

module.exports = router;
