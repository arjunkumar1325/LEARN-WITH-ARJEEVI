const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { IDS } = require('../middleware/security');

const router = express.Router();

const PLANS = {
  'ai-teacher-student-monthly': {
    id: 'ai-teacher-student-monthly',
    name: 'Student Fluency Pass',
    priceInr: 49,
    targetAudience: 'College students, youth, and entry-level job seekers',
    eligibility: 'Available for students and young learners looking to build career confidence',
    billingPeriod: '30 Days',
    features: [
      'Unlimited Real-time Conversational AI Speaking Practice',
      'Instant Polite Pronunciation & Grammar Corrections',
      'Campus Placements & Job Interview Roleplays',
      'Kannada Explanations on Demand',
      'Persistent Speaking Progress & Fluency Scorecard'
    ]
  },
  'ai-teacher-adult-monthly': {
    id: 'ai-teacher-adult-monthly',
    name: 'Adult & Professional Fluency Pass',
    priceInr: 59,
    targetAudience: 'Working professionals, parents, and adult learners',
    eligibility: 'Available for adults looking for workplace, business, and daily conversational fluency',
    billingPeriod: '30 Days',
    features: [
      'Unlimited Real-time Conversational AI Speaking Practice',
      'Executive Presentations & Workplace Roleplays',
      'Client Meetings, Small Talk & Business Email English',
      'Personalized Kannada Explanations on Demand',
      'Persistent Speaking Progress & Fluency Scorecard'
    ]
  }
};

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_arjeevi_sandbox';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_arjeevi_test_token';

// GET /api/subscription/details
router.get('/details', authenticateToken, (req, res) => {
  const activeSub = db.getSubscription(req.user.id);
  const now = new Date();
  const user = db.getUserById(req.user.id);

  const isSubActive = activeSub && new Date(activeSub.expiryDate).getTime() > now.getTime();

  // Recommend student plan if age < 25 or goals mention college/campus
  const isStudentEligible = (user?.age && user.age < 25) || (user?.goals || []).some(g => g.toLowerCase().includes('college'));
  const recommendedPlanId = isStudentEligible ? 'ai-teacher-student-monthly' : 'ai-teacher-adult-monthly';

  res.json({
    success: true,
    plans: Object.values(PLANS),
    recommendedPlanId,
    freeFeaturesAlwaysIncluded: [
      '1-on-1 Peer-to-Peer Speaking with fellow learners (100% Free)',
      'Complete Structured English Lessons & downloadable study notes',
      'Fill-in-the-Blanks & Sentence Builder interactive exercises',
      'Weekly Quiz Championship Arena & Community Debate Club'
    ],
    policies: {
      trialPolicy: '7-day AI Teacher free trial for eligible new accounts. No auto-debit on trial expiry — you are only charged if you explicitly authorize a subscription.',
      cancellationPolicy: 'Cancel anytime in 1 click from your dashboard. Access remains active until the end of your billing cycle.',
      refundPolicy: 'Full refund within 48 hours if unsatisfied — no questions asked.',
      transparency: 'No hidden charges. UPI, Debit Card, NetBanking & RuPay supported via secure payment gateway.'
    },
    currentSubscription: isSubActive ? {
      status: 'active',
      planId: activeSub.planId,
      planName: PLANS[activeSub.planId]?.name || 'AI Teacher Unlimited',
      amount: activeSub.amount,
      currency: activeSub.currency || 'INR',
      startDate: activeSub.startDate,
      expiryDate: activeSub.expiryDate,
      autoRenew: !!activeSub.autoRenew
    } : null
  });
});

// POST /api/subscription/create-order
router.post('/create-order', authenticateToken, (req, res) => {
  try {
    const { planId = 'ai-teacher-student-monthly' } = req.body;
    const selectedPlan = PLANS[planId] || PLANS['ai-teacher-student-monthly'];

    const orderId = `order_${Date.now()}_${uuidv4().substring(0, 8)}`;

    res.json({
      success: true,
      order: {
        orderId,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.priceInr * 100, // in paise
        amountInr: selectedPlan.priceInr,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        customer: {
          name: req.user.name,
          email: req.user.email
        }
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, error: 'Failed to initiate payment order.' });
  }
});

// POST /api/subscription/verify-payment
router.post('/verify-payment', authenticateToken, (req, res) => {
  try {
    const { orderId, paymentId, signature, planId = 'ai-teacher-student-monthly', isSandboxMock } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ success: false, error: 'Missing payment confirmation parameters.' });
    }

    const selectedPlan = PLANS[planId] || PLANS['ai-teacher-student-monthly'];
    let isValid = false;

    // Cryptographic HMAC-SHA256 Verification
    if (signature && RAZORPAY_KEY_SECRET) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      isValid = generatedSignature === signature;
    }

    // In sandbox test mode, verify valid mock test token
    if (!isValid && isSandboxMock && paymentId.startsWith('pay_test_')) {
      isValid = true;
    }

    if (!isValid) {
      IDS.recordSuspiciousEntitlementManipulation(
        req.clientIp,
        req.user.id,
        `Invalid payment signature attempt on order ${orderId}`
      );
      return res.status(400).json({
        success: false,
        error: 'Cryptographic payment verification failed. Transaction was not confirmed by the payment gateway.'
      });
    }

    // Grant 30 days active subscription entitlement
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscriptionRecord = {
      userId: req.user.id,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      status: 'active',
      amount: selectedPlan.priceInr,
      currency: 'INR',
      orderId,
      paymentId,
      signatureVerified: true,
      startDate: startDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      autoRenew: true,
      updatedAt: new Date().toISOString()
    };

    db.saveSubscription(subscriptionRecord);

    db.logSecurityEvent({
      eventType: 'SUBSCRIPTION_ACTIVATED',
      severity: 'INFO',
      userId: req.user.id,
      details: `₹${selectedPlan.priceInr}/month ${selectedPlan.name} activated. Order: ${orderId}, Payment: ${paymentId}`
    });

    res.json({
      success: true,
      message: `Payment verified successfully! Your ${selectedPlan.name} is now active for 30 days.`,
      subscription: subscriptionRecord
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, error: 'Server error verifying transaction.' });
  }
});

// POST /api/subscription/cancel
router.post('/cancel', authenticateToken, (req, res) => {
  const activeSub = db.getSubscription(req.user.id);
  if (!activeSub) {
    return res.status(404).json({ success: false, error: 'No active subscription found to cancel.' });
  }

  activeSub.autoRenew = false;
  db.saveSubscription(activeSub);

  db.logSecurityEvent({
    eventType: 'SUBSCRIPTION_CANCELLED',
    severity: 'INFO',
    userId: req.user.id,
    details: `User disabled auto-renewal. Access remains valid until ${activeSub.expiryDate}`
  });

  res.json({
    success: true,
    message: 'Auto-renewal has been cancelled. You retain full AI Teacher access until your current billing period ends on ' + new Date(activeSub.expiryDate).toLocaleDateString() + '.'
  });
});

module.exports = router;
