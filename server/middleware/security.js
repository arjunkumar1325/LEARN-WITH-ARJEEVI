const db = require('../db/database');

// Memory store for tracking failed login attempts and rate violations
const failedAttemptsByIp = new Map();
const failedAttemptsByEmail = new Map();
const blockedIps = new Set();

const IDS = {
  // Check if an IP is currently blocked
  isIpBlocked(ip) {
    return blockedIps.has(ip);
  },

  // Record a failed login attempt and detect credential stuffing / brute force
  recordFailedLogin(ip, email) {
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

    // IP tracking
    let ipRecord = failedAttemptsByIp.get(ip) || { count: 0, firstAttempt: now, emailsTried: new Set() };
    if (now - ipRecord.firstAttempt > WINDOW_MS) {
      ipRecord = { count: 0, firstAttempt: now, emailsTried: new Set() };
    }
    ipRecord.count += 1;
    if (email) ipRecord.emailsTried.add(email.toLowerCase());
    failedAttemptsByIp.set(ip, ipRecord);

    // Email tracking
    if (email) {
      const emailLower = email.toLowerCase();
      let emailRecord = failedAttemptsByEmail.get(emailLower) || { count: 0, firstAttempt: now };
      if (now - emailRecord.firstAttempt > WINDOW_MS) {
        emailRecord = { count: 0, firstAttempt: now };
      }
      emailRecord.count += 1;
      failedAttemptsByEmail.set(emailLower, emailRecord);
    }

    // Detection Thresholds
    // 1. Credential Stuffing: Same IP trying more than 3 distinct email addresses
    if (ipRecord.emailsTried.size >= 4) {
      db.logSecurityEvent({
        eventType: 'CREDENTIAL_STUFFING_SUSPECTED',
        severity: 'CRITICAL',
        ip,
        targetEmail: email,
        details: `IP attempted logins with ${ipRecord.emailsTried.size} distinct accounts in 15 minutes.`,
        recommendedAction: 'Apply IP throttle or temporary block.'
      });
      blockedIps.add(ip);
      setTimeout(() => blockedIps.delete(ip), 30 * 60 * 1000); // 30 min temporary block
    }
    // 2. High Brute Force on Single Account: 5 failed attempts on same email
    else if (email && failedAttemptsByEmail.get(email.toLowerCase())?.count >= 5) {
      db.logSecurityEvent({
        eventType: 'BRUTE_FORCE_ACCOUNT_TARGETING',
        severity: 'HIGH',
        ip,
        targetEmail: email,
        details: `Account targeted with 5 consecutive failed login attempts.`,
        recommendedAction: 'Trigger account verification challenge or password reset advisory.'
      });
    }
    // 3. Repeated failed login from IP
    else if (ipRecord.count >= 5) {
      db.logSecurityEvent({
        eventType: 'REPEATED_FAILED_LOGINS',
        severity: 'WARNING',
        ip,
        targetEmail: email,
        details: `5 failed login attempts recorded from this IP.`,
        recommendedAction: 'Throttling authentication requests from this IP.'
      });
    } else {
      db.logSecurityEvent({
        eventType: 'FAILED_LOGIN_ATTEMPT',
        severity: 'INFO',
        ip,
        targetEmail: email,
        details: `Invalid credentials supplied.`,
        recommendedAction: 'Monitor trend.'
      });
    }
  },

  // Record successful login (clears streak)
  recordSuccessfulLogin(ip, email) {
    if (email) failedAttemptsByEmail.delete(email.toLowerCase());
  },

  // Unauthorized access attempt detection
  recordUnauthorizedAccess(ip, path, userId = null, role = null) {
    db.logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'HIGH',
      ip,
      path,
      userId,
      details: `User with role [${role || 'unauthenticated'}] attempted to access protected resource: ${path}`,
      recommendedAction: 'Validate token integrity and verify role permissions.'
    });
  },

  // Suspicious entitlement/payment manipulation detection
  recordSuspiciousEntitlementManipulation(ip, userId, details) {
    db.logSecurityEvent({
      eventType: 'SUSPICIOUS_PAYMENT_OR_TRIAL_MANIPULATION',
      severity: 'CRITICAL',
      ip,
      userId,
      details,
      recommendedAction: 'Revoke compromised trial or review manual payment audit trail immediately.'
    });
  }
};

// Express middleware for intrusion filtering
function intrusionDetectionMiddleware(req, res, next) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  req.clientIp = Array.isArray(clientIp) ? clientIp[0] : clientIp.split(',')[0].trim();

  if (IDS.isIpBlocked(req.clientIp)) {
    return res.status(403).json({
      success: false,
      error: 'Access temporarily restricted due to suspicious activity. Please try again later or contact support.'
    });
  }
  next();
}

module.exports = {
  IDS,
  intrusionDetectionMiddleware
};
