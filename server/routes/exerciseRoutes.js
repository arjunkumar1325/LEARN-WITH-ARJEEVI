const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/exercises/fill-in-blanks
router.get('/fill-in-blanks', authenticateToken, (req, res) => {
  const { difficulty } = req.query;
  const data = db.read();
  let items = data.fillInBlanks || [];

  if (difficulty && difficulty !== 'All') {
    items = items.filter(i => i.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  // Strip answers to prevent client inspecting
  const safeItems = items.map(i => ({
    id: i.id,
    difficulty: i.difficulty,
    sentence: i.sentence,
    options: i.options
  }));

  res.json({ success: true, count: safeItems.length, exercises: safeItems });
});

// POST /api/exercises/fill-in-blanks/check
router.post('/fill-in-blanks/check', authenticateToken, (req, res) => {
  const { id, selectedOption } = req.body;
  if (!id || selectedOption === undefined) {
    return res.status(400).json({ success: false, error: 'Exercise ID and answer required.' });
  }

  const data = db.read();
  const item = (data.fillInBlanks || []).find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Exercise not found.' });
  }

  const isCorrect = item.answer.trim().toLowerCase() === selectedOption.trim().toLowerCase();

  // If correct, record progress for user
  if (isCorrect) {
    const user = db.getUserById(req.user.id);
    if (user) {
      db.updateUser(user.id, {
        drillsCompleted: (user.drillsCompleted || 0) + 1,
        grammarScore: Math.min(100, (user.grammarScore || 70) + 2)
      });
    }
  }

  res.json({
    success: true,
    isCorrect,
    correctAnswer: item.answer,
    explanation: item.explanation
  });
});

// GET /api/exercises/sentence-builder
router.get('/sentence-builder', authenticateToken, (req, res) => {
  const { difficulty } = req.query;
  const data = db.read();
  let items = data.sentenceBuilder || [];

  if (difficulty && difficulty !== 'All') {
    items = items.filter(i => i.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  // Exclude targetSentence to prevent client inspect tampering
  const safeItems = items.map(i => ({
    id: i.id,
    difficulty: i.difficulty,
    shuffledWords: i.shuffledWords,
    wordCount: i.shuffledWords.length
  }));

  res.json({ success: true, count: safeItems.length, exercises: safeItems });
});

// POST /api/exercises/sentence-builder/check
router.post('/sentence-builder/check', authenticateToken, (req, res) => {
  const { id, constructedSentence } = req.body;
  if (!id || !constructedSentence) {
    return res.status(400).json({ success: false, error: 'Exercise ID and constructed sentence required.' });
  }

  const data = db.read();
  const item = (data.sentenceBuilder || []).find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Sentence exercise not found.' });
  }

  const normalize = (str) => str.trim().toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
  const userClean = normalize(constructedSentence);
  const targetClean = normalize(item.targetSentence);

  const isCorrect = userClean === targetClean;

  if (isCorrect) {
    const user = db.getUserById(req.user.id);
    if (user) {
      db.updateUser(user.id, {
        drillsCompleted: (user.drillsCompleted || 0) + 1,
        grammarScore: Math.min(100, (user.grammarScore || 70) + 3)
      });
    }
  }

  res.json({
    success: true,
    isCorrect,
    targetSentence: item.targetSentence,
    explanation: item.explanation
  });
});

// GET /api/exercises/error-correction
// Fetch grammar error correction challenges
router.get('/error-correction', authenticateToken, (req, res) => {
  const { difficulty } = req.query;
  const data = db.read();
  let items = data.errorCorrection || [];

  if (difficulty && difficulty !== 'All') {
    items = items.filter(i => i.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  const safeItems = items.map(i => ({
    id: i.id,
    difficulty: i.difficulty,
    incorrectSentence: i.incorrectSentence,
    options: i.options,
    kannadaHint: i.kannadaHint
  }));

  res.json({ success: true, count: safeItems.length, exercises: safeItems });
});

// POST /api/exercises/error-correction/check
// Check user's selected correction
router.post('/error-correction/check', authenticateToken, (req, res) => {
  const { id, selectedOption } = req.body;
  if (!id || selectedOption === undefined) {
    return res.status(400).json({ success: false, error: 'Exercise ID and selected answer required.' });
  }

  const data = db.read();
  const item = (data.errorCorrection || []).find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Error correction exercise not found.' });
  }

  const isCorrect = item.correctAnswer.trim().toLowerCase() === selectedOption.trim().toLowerCase();

  if (isCorrect) {
    const user = db.getUserById(req.user.id);
    if (user) {
      db.updateUser(user.id, {
        drillsCompleted: (user.drillsCompleted || 0) + 1,
        grammarScore: Math.min(100, (user.grammarScore || 70) + 3)
      });
    }
  }

  res.json({
    success: true,
    isCorrect,
    correctAnswer: item.correctAnswer,
    ruleExplanation: item.ruleExplanation,
    kannadaHint: item.kannadaHint
  });
});

// GET /api/exercises/daily-vocabulary
// Fetch current daily vocabulary challenge
router.get('/daily-vocabulary', authenticateToken, (req, res) => {
  const data = db.read();
  const pool = data.dailyVocabulary || [];
  if (pool.length === 0) {
    return res.status(404).json({ success: false, error: 'No daily vocabulary challenges found.' });
  }

  // Pick challenge based on day of week
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const activeVocab = pool[dayIndex % pool.length];

  const user = db.getUserById(req.user.id);
  const isCompletedToday = (user?.dailyVocabCompletedDates || []).includes(new Date().toISOString().split('T')[0]);

  res.json({
    success: true,
    vocab: {
      id: activeVocab.id,
      day: activeVocab.day,
      word: activeVocab.word,
      phonetic: activeVocab.phonetic,
      partOfSpeech: activeVocab.partOfSpeech,
      meaning: activeVocab.meaning,
      kannada: activeVocab.kannada,
      example: activeVocab.example,
      question: {
        q: activeVocab.question.q,
        options: activeVocab.question.options
      },
      isCompletedToday
    }
  });
});

// POST /api/exercises/daily-vocabulary/submit
// Submit answer to the daily vocabulary challenge
router.post('/daily-vocabulary/submit', authenticateToken, (req, res) => {
  const { id, selectedIndex } = req.body;
  const data = db.read();
  const activeVocab = (data.dailyVocabulary || []).find(v => v.id === id);
  if (!activeVocab) {
    return res.status(404).json({ success: false, error: 'Challenge not found.' });
  }

  const isCorrect = selectedIndex === activeVocab.question.answer;
  const todayStr = new Date().toISOString().split('T')[0];

  let user = db.getUserById(req.user.id);
  if (isCorrect && user) {
    const completedDates = user.dailyVocabCompletedDates || [];
    if (!completedDates.includes(todayStr)) {
      completedDates.push(todayStr);
    }
    user = db.updateUser(user.id, {
      dailyVocabCompletedDates: completedDates,
      streak: (user.streak || 1) + 1,
      drillsCompleted: (user.drillsCompleted || 0) + 1,
      grammarScore: Math.min(100, (user.grammarScore || 70) + 5)
    });
  }

  res.json({
    success: true,
    isCorrect,
    correctAnswer: activeVocab.question.options[activeVocab.question.answer],
    explanation: activeVocab.question.explanation,
    streak: user?.streak || 1,
    grammarScore: user?.grammarScore || 75
  });
});

// POST /api/exercises/record-progress
router.post('/record-progress', authenticateToken, (req, res) => {
  const { scoreDelta = 2 } = req.body;
  const user = db.getUserById(req.user.id);
  if (user) {
    const updated = db.updateUser(user.id, {
      drillsCompleted: (user.drillsCompleted || 0) + 1,
      grammarScore: Math.min(100, (user.grammarScore || 70) + scoreDelta)
    });
    return res.json({ success: true, user: updated });
  }
  res.status(404).json({ success: false, error: 'User not found' });
});

module.exports = router;
