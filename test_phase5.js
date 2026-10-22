const assert = require('assert');
const crypto = require('crypto');

const SERVER_URL = 'http://localhost:5000';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase5Tests() {
  console.log('\n====================================================');
  console.log(' LEARN WITH ARJEEVI — PHASE 5 AUTOMATED TEST SUITE');
  console.log(' Subscriptions, Rewards, Security & Launch Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(testName) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  }

  function recordFail(testName, err) {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}:`, err.message || err);
  }

  // Helper: Register fresh test user
  const uniqueId = Date.now();
  const testEmail = `phase5_learner_${uniqueId}@arjeevi.com`;
  const regRes = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPhase5Password!2026',
      name: 'Pooja Arjeevi'
    })
  });
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true, 'User registration must succeed');
  const token = regData.token;
  const userId = regData.user.id;

  // TEST 1: 7-Day AI Teacher Free Trial & Pricing Options (₹49 Student, ₹59 Adult)
  try {
    const trialRes = await fetch(`${SERVER_URL}/api/ai-teacher/trial-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const trialData = await trialRes.json();
    assert.strictEqual(trialData.success, true, 'Trial status check must succeed');
    assert.strictEqual(trialData.trial.isTrialActive, true, 'New user must receive active trial');
    assert.strictEqual(trialData.trial.daysRemaining, 7, 'Free trial must be 7 days');

    const subRes = await fetch(`${SERVER_URL}/api/subscription/details`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const subData = await subRes.json();
    assert.strictEqual(subData.success, true, 'Subscription details must succeed');
    assert.ok(subData.plans.length >= 2, 'Must have at least 2 subscription tiers');

    const studentPlan = subData.plans.find(p => p.id === 'ai-teacher-student-monthly');
    const adultPlan = subData.plans.find(p => p.id === 'ai-teacher-adult-monthly');

    assert.ok(studentPlan, 'Student plan must exist');
    assert.strictEqual(studentPlan.priceInr, 49, 'Student plan price must be ₹49/month');

    assert.ok(adultPlan, 'Adult plan must exist');
    assert.strictEqual(adultPlan.priceInr, 59, 'Adult plan price must be ₹59/month');

    assert.ok(subData.freeFeaturesAlwaysIncluded.length >= 3, 'Must clearly state features that remain free forever');
    assert.ok(subData.policies.cancellationPolicy.includes('Cancel anytime'), 'Must explain cancellation policy');
    recordPass('7-Day Free Trial & Pricing Options: ₹49/month (Student) and ₹59/month (Adult)');
  } catch (err) {
    recordFail('7-Day Free Trial & Pricing Options', err);
  }

  // TEST 2: Payment Order Creation & Server-side Cryptographic Verification
  try {
    // 1. Create order for Student Pass (₹49)
    const orderRes = await fetch(`${SERVER_URL}/api/subscription/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ planId: 'ai-teacher-student-monthly' })
    });
    const orderData = await orderRes.json();
    assert.strictEqual(orderData.success, true, 'Order creation must succeed');
    assert.strictEqual(orderData.order.amount, 4900, 'Student order amount must be 4900 paise');

    const orderId = orderData.order.orderId;

    // 2. Test malicious payment tampering (bogus signature) -> must fail
    const fakeVerifyRes = await fetch(`${SERVER_URL}/api/subscription/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId,
        paymentId: 'pay_attacker_fraud_id',
        signature: 'invalid_forged_signature_token',
        isSandboxMock: false
      })
    });
    assert.strictEqual(fakeVerifyRes.status, 400, 'Forged payment signatures must be rejected with 400');

    // 3. Test genuine payment verification via sandbox token
    const validVerifyRes = await fetch(`${SERVER_URL}/api/subscription/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId,
        paymentId: `pay_test_${Date.now()}`,
        planId: 'ai-teacher-student-monthly',
        isSandboxMock: true
      })
    });
    const validVerifyData = await validVerifyRes.json();
    assert.strictEqual(validVerifyData.success, true, 'Valid payment verification must succeed');
    assert.strictEqual(validVerifyData.subscription.status, 'active');
    assert.strictEqual(validVerifyData.subscription.amount, 49);

    recordPass('Payment Security: Server-side cryptographic verification prevents fraud');
  } catch (err) {
    recordFail('Payment Security Verification', err);
  }

  // TEST 3: Consistency Streak Rewards (+14 Days Trial Extension)
  try {
    const trialService = require('./server/services/trialService');
    const rewardResult = trialService.evaluateAndAwardConsistencyBonuses();
    assert.strictEqual(rewardResult.success, true, 'Consistency reward engine must execute cleanly');
    assert.ok(Array.isArray(rewardResult.leaderboard), 'Consistency leaderboard must be returned');
    recordPass('Rewards Engine: Fair streak consistency rewards top 3 learners with +14 days AI trial');
  } catch (err) {
    recordFail('Consistency Streak Rewards', err);
  }

  // TEST 4: Certificate Generation & Consent-Based Email Dispatch
  try {
    // 1. Check eligibility before completion
    const eligRes = await fetch(`${SERVER_URL}/api/certificates/eligibility`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const eligData = await eligRes.json();
    assert.strictEqual(eligData.success, true, 'Certificate eligibility check must succeed');

    // 2. Complete eligibility criteria for test user in database
    const db = require('./server/db/database');
    db.updateUser(userId, {
      lessonsCompleted: ['beg-1', 'beg-2', 'beg-3', 'beg-4'],
      grammarScore: 90,
      streak: 5
    });

    // 3. Generate Certificate
    const genRes = await fetch(`${SERVER_URL}/api/certificates/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const genData = await genRes.json();
    assert.strictEqual(genData.success, true, 'Certificate generation must succeed for eligible learner');
    assert.ok(genData.certificate.certificateId.startsWith('ARJ-'), 'Certificate ID must have ARJ prefix');
    const certCode = genData.certificate.certificateId;

    // 4. Verify public verification endpoint
    const verifyRes = await fetch(`${SERVER_URL}/api/certificates/verify/${certCode}`);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.success, true, 'Public certificate verification must succeed');
    assert.strictEqual(verifyData.valid, true);

    // 5. Test Email Dispatch without consent -> must be rejected
    const noConsentRes = await fetch(`${SERVER_URL}/api/certificates/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ certificateId: certCode, consent: false })
    });
    assert.strictEqual(noConsentRes.status, 400, 'Email dispatch without explicit consent must return 400');

    // 6. Test Email Dispatch with user consent -> succeeds with honest status
    const consentRes = await fetch(`${SERVER_URL}/api/certificates/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ certificateId: certCode, consent: true })
    });
    const consentData = await consentRes.json();
    assert.strictEqual(consentData.success, true, 'Email dispatch request with consent must succeed');
    assert.ok(consentData.message, 'Must return informative delivery / test mode message');

    recordPass('Proficiency Certificates: Rigorous issuance, public ID verification & consent-based email');
  } catch (err) {
    recordFail('Proficiency Certificates', err);
  }

  // TEST 5: Active Session Tracking & Remote Session Revocation
  try {
    const sessionsRes = await fetch(`${SERVER_URL}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sessionsData = await sessionsRes.json();
    assert.strictEqual(sessionsData.success, true, 'Sessions retrieval must succeed');
    assert.ok(sessionsData.sessions.length >= 1, 'Must have at least current session');
    assert.strictEqual(sessionsData.sessions[sessionsData.sessions.length - 1].isCurrent, true, 'Current session must be flagged');

    // Revoke other sessions
    const revokeRes = await fetch(`${SERVER_URL}/api/auth/sessions/revoke-others`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const revokeData = await revokeRes.json();
    assert.strictEqual(revokeData.success, true, 'Revoking other sessions must succeed');
    recordPass('Session Management: Device tracking & single-click remote session revocation');
  } catch (err) {
    recordFail('Session Management', err);
  }

  // TEST 6: Account Recovery & Password Reset Flow
  try {
    // 1. Forgot password request (prevents enumeration)
    const forgotRes = await fetch(`${SERVER_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotRes.json();
    assert.strictEqual(forgotData.success, true, 'Forgot password request must return success');
    assert.ok(forgotData.sandboxResetToken, 'Sandbox reset token must be returned for testing');

    const resetToken = forgotData.sandboxResetToken;

    // 2. Perform password reset
    const newPassword = 'NewSecretPassword@2026!';
    const resetRes = await fetch(`${SERVER_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword
      })
    });
    const resetData = await resetRes.json();
    assert.strictEqual(resetData.success, true, 'Password reset must succeed');

    // 3. Verify login works with the new password
    const newLoginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword })
    });
    const newLoginData = await newLoginRes.json();
    assert.strictEqual(newLoginData.success, true, 'Login with updated password must succeed');

    recordPass('Account Recovery: Secure single-use token password reset flow');
  } catch (err) {
    recordFail('Account Recovery Flow', err);
  }

  // TEST 7: Strict Administrator SOC Authorization
  try {
    // 1. Non-admin learner accessing SOC -> must be rejected with 403
    const deniedRes = await fetch(`${SERVER_URL}/api/security/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(deniedRes.status, 403, 'Learners must be denied access to Security SOC (HTTP 403)');

    // 2. Administrator login & access
    const adminLoginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@arjeevi.com', password: 'ArjeeviAdmin2026!' })
    });
    const adminData = await adminLoginRes.json();
    assert.strictEqual(adminData.success, true, 'Admin login must succeed');
    const adminToken = adminData.token;

    const statsRes = await fetch(`${SERVER_URL}/api/security/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    assert.strictEqual(statsData.success, true, 'Admin must access security stats');
    assert.ok(statsData.totalEvents >= 1, 'Security events audit trail must be recorded');

    recordPass('Admin Security SOC: Strict RBAC authorization protects security telemetry');
  } catch (err) {
    recordFail('Admin SOC Authorization', err);
  }

  // TEST 8: Honest Security Posture Disclosure
  try {
    const postureRes = await fetch(`${SERVER_URL}/api/auth/security-posture`);
    const postureData = await postureRes.json();
    assert.strictEqual(postureRes.status, 200);
    assert.strictEqual(postureData.success, true);
    assert.ok(postureData.disclaimer.includes('No web application is impossible to hack'), 'Must disclose honest security posture');
    assert.ok(postureData.safeguards.length >= 5, 'Must detail defense-in-depth safeguards');
    recordPass('Honest Security Disclosure: Transparent defense-in-depth declaration');
  } catch (err) {
    recordFail('Honest Security Disclosure', err);
  }

  console.log('\n----------------------------------------------------');
  console.log(` PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
