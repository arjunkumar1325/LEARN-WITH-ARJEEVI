const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { IDS } = require('../middleware/security');

const router = express.Router();

// Require admin access for all security routes
router.use(authenticateToken, requireRole('admin'));

// GET /api/security/stats
router.get('/stats', (req, res) => {
  const data = db.read();
  const events = data.securityEvents || [];

  const countsBySeverity = {
    CRITICAL: events.filter(e => e.severity === 'CRITICAL').length,
    HIGH: events.filter(e => e.severity === 'HIGH').length,
    WARNING: events.filter(e => e.severity === 'WARNING').length,
    INFO: events.filter(e => e.severity === 'INFO').length
  };

  const failedLogins = events.filter(e =>
    e.eventType === 'FAILED_LOGIN_ATTEMPT' ||
    e.eventType === 'REPEATED_FAILED_LOGINS' ||
    e.eventType === 'CREDENTIAL_STUFFING_SUSPECTED' ||
    e.eventType === 'BRUTE_FORCE_ACCOUNT_TARGETING'
  ).length;

  res.json({
    success: true,
    totalEvents: events.length,
    countsBySeverity,
    failedLogins,
    totalUsers: (data.users || []).length,
    activeSubscriptions: (data.subscriptions || []).filter(s => s.status === 'active').length,
    userReportsCount: (data.userReports || []).length
  });
});

// GET /api/security/events
router.get('/events', (req, res) => {
  const { limit = 50, severity } = req.query;
  const data = db.read();
  let events = data.securityEvents || [];

  if (severity && severity !== 'ALL') {
    events = events.filter(e => e.severity === severity);
  }

  res.json({
    success: true,
    count: events.length,
    events: events.slice(0, parseInt(limit, 10))
  });
});

// POST /api/security/resolve-event
router.post('/resolve-event', (req, res) => {
  const { eventId, resolutionNote } = req.body;
  if (!eventId) return res.status(400).json({ success: false, error: 'Event ID required.' });

  const data = db.read();
  const event = (data.securityEvents || []).find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found.' });

  event.resolved = true;
  event.resolvedBy = req.user.email;
  event.resolvedAt = new Date().toISOString();
  event.resolutionNote = resolutionNote || 'Reviewed and addressed by administrator.';
  db.write(data);

  res.json({ success: true, message: 'Security event marked as resolved.', event });
});

// GET /api/security/users
router.get('/users', (req, res) => {
  const data = db.read();
  const sanitizedUsers = (data.users || []).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    preferredName: u.preferredName,
    role: u.role,
    age: u.age,
    currentLevel: u.currentLevel,
    streak: u.streak,
    lessonsCompletedCount: (u.lessonsCompleted || []).length,
    grammarScore: u.grammarScore,
    createdAt: u.createdAt
  }));

  res.json({ success: true, count: sanitizedUsers.length, users: sanitizedUsers });
});

// GET /api/security/reports
router.get('/reports', (req, res) => {
  const data = db.read();
  res.json({
    success: true,
    reports: data.userReports || [],
    blockedPairs: data.blockedPairs || []
  });
});

module.exports = router;
