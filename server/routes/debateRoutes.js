const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/debate/topics
router.get('/topics', authenticateToken, (req, res) => {
  const data = db.read();
  res.json({
    success: true,
    count: (data.debateTopics || []).length,
    topics: data.debateTopics || []
  });
});

// GET /api/debate/topics/:id
router.get('/topics/:id', authenticateToken, (req, res) => {
  const data = db.read();
  const topic = (data.debateTopics || []).find(t => t.id === req.params.id);
  if (!topic) {
    return res.status(404).json({ success: false, error: 'Debate topic not found.' });
  }
  res.json({ success: true, topic });
});

module.exports = router;
