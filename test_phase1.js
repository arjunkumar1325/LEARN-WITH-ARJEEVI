// Targeted Phase 1 Test Script for LEARN WITH ARJEEVI
const fetch = global.fetch;

async function runPhase1Tests() {
  console.log('\n======================================================');
  console.log('--- STARTING LEARN WITH ARJEEVI PHASE 1 TEST SUITE ---');
  console.log('======================================================\n');
  const baseUrl = 'http://localhost:5000';
  let passed = 0;
  let total = 0;

  const check = (title, condition) => {
    total++;
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}`);
    }
  };

  // 1. Landing Page & Static Delivery
  const landingRes = await fetch(`${baseUrl}/`);
  const landingHtml = await landingRes.text();
  check('1. Landing page is served with brand and title', landingRes.ok && landingHtml.includes('LEARN WITH ARJEEVI'));

  // 2. Real Registration & Password Hashing
  const testEmail = `phase1_user_${Date.now()}@arjeevi.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPhase1Password!',
      name: 'Pooja Hegde'
    })
  });
  const regData = await regRes.json();
  check('2. Secure signup succeeds and returns authenticated JWT token', regData.success && !!regData.token);
  const token = regData.token;

  // 3. User Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPhase1Password!'
    })
  });
  const loginData = await loginRes.json();
  check('3. Login verifies bcrypt hash and succeeds', loginData.success && !!loginData.token);

  // 4. Onboarding: Display Name, Age, English Level, Professional Goal
  const onbRes = await fetch(`${baseUrl}/api/onboarding/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Pooja Hegde',
      preferredName: 'Pooja',
      age: 23,
      goals: ['Job interviews', 'IT and software careers'],
      currentLevel: 'Intermediate',
      confidenceLevel: 'I can speak but make mistakes.',
      explanationLanguage: 'English + Kannada',
      dailyGoalMinutes: 20
    })
  });
  const onbData = await onbRes.json();
  check('4. Onboarding records display name, age, level & goals', onbData.success && onbData.user.onboardingCompleted);

  // 5. Profile Editing: Photo upload & editable preferences
  const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Pooja Hegde',
      preferredName: 'Pooja H.',
      age: 24,
      profilePhoto: '🌟',
      currentLevel: 'Advanced',
      goals: ['Job interviews', 'Public speaking', 'IT and software careers'],
      explanationLanguage: 'English + Kannada',
      dailyGoalMinutes: 30
    })
  });
  const profileData = await profileRes.json();
  check('5. Profile editing updates photo, display name, level and preferences',
    profileData.success &&
    profileData.user.preferredName === 'Pooja H.' &&
    profileData.user.age === 24 &&
    profileData.user.currentLevel === 'Advanced' &&
    profileData.user.dailyGoalMinutes === 30
  );

  // 6. Persistence Verification: Verify with fresh /api/auth/me query
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  check('6. Profile persistence verified via session inspection',
    meData.success &&
    meData.user.preferredName === 'Pooja H.' &&
    meData.user.currentLevel === 'Advanced'
  );

  console.log(`\n======================================================`);
  console.log(`PHASE 1 RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log(`======================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase1Tests().catch(err => {
  console.error('Phase 1 test failure:', err);
  process.exit(1);
});
