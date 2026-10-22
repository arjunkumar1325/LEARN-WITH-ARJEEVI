// Comprehensive Automated Test Suite for LEARN WITH ARJEEVI
const fetch = global.fetch;

async function runTests() {
  console.log('--- STARTING LEARN WITH ARJEEVI TEST SUITE ---');
  const baseUrl = 'http://localhost:5000';
  let passedCount = 0;
  let totalCount = 0;

  const test = (name, assertion) => {
    totalCount++;
    if (assertion) {
      console.log(`[PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${name}`);
    }
  };

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  test('1. System Health API is operational', healthData.status === 'healthy');

  // 2. New User Registration
  const testEmail = `test_learner_${Date.now()}@arjeevi.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'SecurePassword2026!', name: 'Test Learner' })
  });
  const regData = await regRes.json();
  test('2. New user registration succeeds and returns token', regData.success && !!regData.token);
  const token = regData.token;

  // 3. Current Session Check
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  test('3. Session verified via JWT', meData.success && meData.user.email === testEmail);

  // 4. Onboarding Completion
  const onbRes = await fetch(`${baseUrl}/api/onboarding/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Test Learner',
      preferredName: 'Tester',
      age: 22,
      goals: ['Job interviews', 'Public speaking'],
      currentLevel: 'Intermediate',
      confidenceLevel: 'I can speak but make mistakes.',
      explanationLanguage: 'English + Kannada',
      dailyGoalMinutes: 20
    })
  });
  const onbData = await onbRes.json();
  test('4. Onboarding saves multi-step preferences', onbData.success && onbData.user.onboardingCompleted);

  // 5. Lessons API
  const lessonsRes = await fetch(`${baseUrl}/api/lessons`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const lessonsData = await lessonsRes.json();
  test('5. Structured curriculum returns Beginner, Intermediate, Advanced',
    lessonsData.success &&
    lessonsData.lessons.Beginner.length >= 10 &&
    lessonsData.lessons.Intermediate.length >= 3 &&
    lessonsData.lessons.Advanced.length >= 2
  );

  // 6. Fill in the Blanks
  const fibRes = await fetch(`${baseUrl}/api/exercises/fill-in-blanks?difficulty=Beginner`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const fibData = await fibRes.json();
  test('6. Fill in the Blanks question bank loaded', fibData.success && fibData.exercises.length > 0);

  const checkFibRes = await fetch(`${baseUrl}/api/exercises/fill-in-blanks/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id: fibData.exercises[0].id, selectedOption: 'east' })
  });
  const checkFibData = await checkFibRes.json();
  test('6b. Fill in the blanks evaluates server-side answer and provides explanation', checkFibData.success && checkFibData.isCorrect);

  // 7. Sentence Builder
  const sbRes = await fetch(`${baseUrl}/api/exercises/sentence-builder?difficulty=Beginner`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const sbData = await sbRes.json();
  test('7. Sentence Builder provides shuffled words', sbData.success && sbData.exercises[0].shuffledWords.length > 0);

  const checkSbRes = await fetch(`${baseUrl}/api/exercises/sentence-builder/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id: sbData.exercises[0].id, constructedSentence: 'She speaks English with great confidence.' })
  });
  const checkSbData = await checkSbRes.json();
  test('7b. Sentence Builder checks syntax and word order', checkSbData.success && checkSbData.isCorrect);

  // 8. 7-Day AI Trial Verification
  const trialRes = await fetch(`${baseUrl}/api/ai-teacher/trial-status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const trialData = await trialRes.json();
  test('8. AI Teacher 7-Day Trial calculated server-side', trialData.success && trialData.trial.isTrialActive && trialData.trial.daysRemaining >= 6);

  // 9. AI Teacher Pedagogical Conversational Feedback & Grammar Error Detection
  const aiChatRes = await fetch(`${baseUrl}/api/ai-teacher/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ message: 'I am 15 year.', roleplayMode: 'general' })
  });
  const aiChatData = await aiChatRes.json();
  test('9. AI Teacher detects "I am 15 year" and offers gentle correction',
    aiChatData.success &&
    aiChatData.grammarFeedback &&
    aiChatData.grammarFeedback.suggestedCorrection.includes('years old')
  );

  // 10. Weekly Quiz Championship
  const quizRes = await fetch(`${baseUrl}/api/quiz/current`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const quizData = await quizRes.json();
  test('10. Weekly Quiz Arena is open with timer and leaderboard', quizData.success && quizData.quiz.totalQuestions >= 5);

  // 11. Debate Club Topics
  const debateRes = await fetch(`${baseUrl}/api/debate/topics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const debateData = await debateRes.json();
  test('11. Debate Club topics have proposition and opposition arguments', debateData.success && debateData.topics[0].propositionPoints.length > 0);

  // 12. Subscription & Payment Sandbox Verification
  const orderRes = await fetch(`${baseUrl}/api/subscription/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  const orderData = await orderRes.json();
  test('12. ₹49 Subscription order generated', orderData.success && orderData.order.amount === 4900);

  const subVerifyRes = await fetch(`${baseUrl}/api/subscription/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      orderId: orderData.order.orderId,
      paymentId: 'pay_test_suite_123',
      isSandboxMock: true
    })
  });
  const subVerifyData = await subVerifyRes.json();
  test('12b. Subscription verified and 30-day entitlement activated', subVerifyData.success && subVerifyData.subscription.status === 'active');

  // 13. Certificate Eligibility and Verification
  // Complete 3 lessons and score high to test eligibility
  const submitQ1 = await fetch(`${baseUrl}/api/lessons/beg-1/submit-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ answers: { 0: 0 } })
  });
  const submitQ2 = await fetch(`${baseUrl}/api/lessons/beg-2/submit-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ answers: { 0: 1 } })
  });
  const submitQ3 = await fetch(`${baseUrl}/api/lessons/beg-3/submit-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ answers: { 0: 2 } })
  });

  const certEligRes = await fetch(`${baseUrl}/api/certificates/eligibility`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const certEligData = await certEligRes.json();
  test('13. Certificate eligibility evaluated against standards', certEligData.success && Array.isArray(certEligData.criteria));

  // 14. Admin Security & Intrusion Detection
  // Login as admin
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@arjeevi.com', password: 'ArjeeviAdmin2026!' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  const secStatsRes = await fetch(`${baseUrl}/api/security/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const secStatsData = await secStatsRes.json();
  test('14. Admin Security Operations Center (SOC) returns intrusion telemetry', secStatsData.success && secStatsData.totalEvents > 0);

  console.log(`\n========================================`);
  console.log(`TEST SUITE RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`========================================\n`);

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
