const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { IDS } = require('./security');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_arjeevi_jwt_key_2026_dev_secure';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Session expired or invalid token. Please sign in again.' });
    }

    const user = db.getUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ success: false, error: 'User account not found.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'learner',
      name: user.name,
      preferredName: user.preferredName || user.name,
      currentLevel: user.currentLevel || 'Beginner',
      onboardingCompleted: !!user.onboardingCompleted,
      streak: user.streak || 0,
      sessionId: decoded.sessionId || null
    };
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      IDS.recordUnauthorizedAccess(req.clientIp, req.originalUrl, req.user.id, req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to perform this administrative action.'
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
