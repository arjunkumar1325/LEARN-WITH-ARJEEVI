// Phase 3 Test Suite for LEARN WITH ARJEEVI — Structured Lessons & Interactive Practice
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body, json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runPhase3Tests() {
  console.log('======================================================');
  console.log('--- STARTING LEARN WITH ARJEEVI PHASE 3 TEST SUITE ---');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  // 1. Authenticate as Learner
  total++;
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'learner@arjeevi.com',
    password: 'Learner2026!'
  });

  if (loginRes.status === 200 && loginRes.json && loginRes.json.token) {
    console.log('[PASS] 1. Learner authenticated successfully');
    passed++;
  } else {
    console.error('[FAIL] 1. Authentication failed:', loginRes.body);
    process.exit(1);
  }

  const token = loginRes.json.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch Structured Curriculum (Beginner, Intermediate, Advanced)
  total++;
  const lessonsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lessons',
    method: 'GET',
    headers: authHeaders
  });

  if (
    lessonsRes.status === 200 &&
    lessonsRes.json &&
    lessonsRes.json.lessons &&
    lessonsRes.json.lessons.Beginner.length >= 10 &&
    lessonsRes.json.lessons.Intermediate.length >= 7 &&
    lessonsRes.json.lessons.Advanced.length >= 4
  ) {
    console.log(`[PASS] 2. Structured curriculum loaded with ${lessonsRes.json.totalLessons} lessons across 3 proficiency levels:`);
    console.log(`       - Beginner: ${lessonsRes.json.lessons.Beginner.length} modules`);
    console.log(`       - Intermediate: ${lessonsRes.json.lessons.Intermediate.length} modules`);
    console.log(`       - Advanced: ${lessonsRes.json.lessons.Advanced.length} modules`);
    passed++;
  } else {
    console.error('[FAIL] 2. Failed to load full curriculum:', lessonsRes.body);
  }

  // 3. Fetch Lesson Detail with Rules, Spoken Examples & Kannada
  total++;
  const lessonDetailRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lessons/beg-4',
    method: 'GET',
    headers: authHeaders
  });

  if (
    lessonDetailRes.status === 200 &&
    lessonDetailRes.json &&
    lessonDetailRes.json.lesson &&
    lessonDetailRes.json.lesson.content.examples &&
    lessonDetailRes.json.lesson.content.examples.some(e => e.kannada)
  ) {
    const l = lessonDetailRes.json.lesson;
    console.log(`[PASS] 3. Detailed lesson fetched: "${l.title}"`);
    console.log(`       Summary: ${l.content.summary.substring(0, 60)}...`);
    console.log(`       Verified Kannada explanation aids present.`);
    passed++;
  } else {
    console.error('[FAIL] 3. Failed to fetch lesson detail:', lessonDetailRes.body);
  }

  // 4. Submit Lesson Assessment Quiz & Save Progress to User Profile
  total++;
  const submitQuizRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lessons/beg-4/submit-quiz',
    method: 'POST',
    headers: authHeaders
  }, {
    answers: { "0": 1 } // Option 1 is "an"
  });

  if (submitQuizRes.status === 200 && submitQuizRes.json && submitQuizRes.json.passed) {
    console.log(`[PASS] 4. Assessment quiz submitted successfully (Score: ${submitQuizRes.json.score}/${submitQuizRes.json.total}). Progress saved.`);
    passed++;
  } else {
    console.error('[FAIL] 4. Lesson assessment submission failed:', submitQuizRes.body);
  }

  // 5. Test Fill-in-the-Blanks Exercise
  total++;
  const fibListRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/fill-in-blanks?difficulty=Beginner',
    method: 'GET',
    headers: authHeaders
  });

  const fibItem = fibListRes.json?.exercises?.[0];
  const fibCheckRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/fill-in-blanks/check',
    method: 'POST',
    headers: authHeaders
  }, {
    id: fibItem?.id,
    selectedOption: 'east'
  });

  if (fibCheckRes.status === 200 && fibCheckRes.json && fibCheckRes.json.isCorrect) {
    console.log(`[PASS] 5. Fill-in-the-blanks validated: "${fibItem.sentence}" -> Correct!`);
    passed++;
  } else {
    console.error('[FAIL] 5. Fill-in-the-blanks check failed:', fibCheckRes.body);
  }

  // 6. Test Sentence Builder (Word Ordering / Unscramble)
  total++;
  const sbListRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/sentence-builder?difficulty=Beginner',
    method: 'GET',
    headers: authHeaders
  });

  const sbItem = sbListRes.json?.exercises?.[0];
  const sbCheckRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/sentence-builder/check',
    method: 'POST',
    headers: authHeaders
  }, {
    id: sbItem?.id,
    constructedSentence: 'She speaks English with great confidence.'
  });

  if (sbCheckRes.status === 200 && sbCheckRes.json && sbCheckRes.json.isCorrect) {
    console.log(`[PASS] 6. Sentence builder validated: "${sbCheckRes.json.targetSentence}" -> Correct!`);
    passed++;
  } else {
    console.error('[FAIL] 6. Sentence builder check failed:', sbCheckRes.body);
  }

  // 7. Test Grammar Error Correction Drill
  total++;
  const errListRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/error-correction?difficulty=Beginner',
    method: 'GET',
    headers: authHeaders
  });

  const errItem = errListRes.json?.exercises?.[0];
  const errCheckRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/error-correction/check',
    method: 'POST',
    headers: authHeaders
  }, {
    id: errItem?.id,
    selectedOption: errItem?.options?.[0]
  });

  if (errCheckRes.status === 200 && errCheckRes.json && errCheckRes.json.isCorrect && errCheckRes.json.ruleExplanation) {
    console.log(`[PASS] 7. Error correction validated: "${errItem.incorrectSentence}"`);
    console.log(`       Fix: "${errCheckRes.json.correctAnswer}" (Rule: ${errCheckRes.json.ruleExplanation.substring(0, 45)}...)`);
    passed++;
  } else {
    console.error('[FAIL] 7. Error correction drill failed:', errCheckRes.body);
  }

  // 8. Test Daily Vocabulary Challenge & Streak Reward
  total++;
  const vocabRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/daily-vocabulary',
    method: 'GET',
    headers: authHeaders
  });

  const vocabData = vocabRes.json?.vocab;
  const vocabSubmitRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/exercises/daily-vocabulary/submit',
    method: 'POST',
    headers: authHeaders
  }, {
    id: vocabData?.id,
    selectedIndex: 0 // Will test or check explanation
  });

  if (vocabRes.status === 200 && vocabData && vocabSubmitRes.status === 200) {
    console.log(`[PASS] 8. Daily vocabulary challenge accessed for word "${vocabData.word}" (${vocabData.meaning})`);
    console.log(`       Challenge verified. User streak maintained at: ${vocabSubmitRes.json.streak} days.`);
    passed++;
  } else {
    console.error('[FAIL] 8. Daily vocabulary challenge failed:', vocabSubmitRes.body);
  }

  // 9. Inspect Authenticated User Profile for Progress Persistence
  total++;
  const meRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: authHeaders
  });

  if (
    meRes.status === 200 &&
    meRes.json &&
    meRes.json.user &&
    meRes.json.user.lessonsCompleted &&
    meRes.json.user.lessonsCompleted.includes('beg-4') &&
    (meRes.json.user.drillsCompleted || 0) > 0
  ) {
    const u = meRes.json.user;
    console.log(`[PASS] 9. User profile persistence verified:`);
    console.log(`       - Lessons Completed: [${u.lessonsCompleted.join(', ')}]`);
    console.log(`       - Drills Completed: ${u.drillsCompleted}`);
    console.log(`       - Grammar Score: ${u.grammarScore}%`);
    passed++;
  } else {
    console.error('[FAIL] 9. User profile progress persistence failed:', meRes.body);
  }

  console.log('\n======================================================');
  console.log(`PHASE 3 RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log('======================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase3Tests().catch(err => {
  console.error('Fatal error in Phase 3 test suite:', err);
  process.exit(1);
});
