// Phase 2 Test Suite for LEARN WITH ARJEEVI — AI Voice Teacher
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

async function runPhase2Tests() {
  console.log('======================================================');
  console.log('--- STARTING LEARN WITH ARJEEVI PHASE 2 TEST SUITE ---');
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

  // 2. Provider Status & Setup Guide Check
  total++;
  const providerRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai-teacher/provider-status',
    method: 'GET',
    headers: authHeaders
  });

  if (providerRes.status === 200 && providerRes.json && providerRes.json.provider && providerRes.json.setupGuide) {
    console.log(`[PASS] 2. Provider status returned: "${providerRes.json.provider}" (Model: ${providerRes.json.activeModel})`);
    passed++;
  } else {
    console.error('[FAIL] 2. Provider status failed:', providerRes.body);
  }

  // 3. Situational Dialogs & Beginner Level Speech Rate
  total++;
  const chatRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai-teacher/chat',
    method: 'POST',
    headers: authHeaders
  }, {
    message: "Hello Arjeevi, I am learning English for my campus job interviews.",
    roleplayMode: 'career',
    userLevel: 'Beginner'
  });

  if (chatRes.status === 200 && chatRes.json && chatRes.json.speechText && chatRes.json.followUpQuestion) {
    console.log(`[PASS] 3. Conversational AI voice exchange succeeded (Speech rate: ${chatRes.json.speechRate}x for Beginner)`);
    passed++;
  } else {
    console.error('[FAIL] 3. Conversational AI exchange failed:', chatRes.body);
  }

  // 4. Gentle Grammar Slip Detection & Re-try Invitation
  total++;
  const grammarRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai-teacher/chat',
    method: 'POST',
    headers: authHeaders
  }, {
    message: "Yesterday I go to college and I am 21 year old",
    roleplayMode: 'college',
    userLevel: 'Beginner'
  });

  if (grammarRes.status === 200 && grammarRes.json && grammarRes.json.grammarFeedback) {
    console.log(`[PASS] 4. Grammar error gently detected: "${grammarRes.json.grammarFeedback.suggestedCorrection}"`);
    console.log(`       Explanation: ${grammarRes.json.grammarFeedback.ruleExplanation}`);
    passed++;
  } else {
    console.error('[FAIL] 4. Grammar error detection failed:', grammarRes.body);
  }

  // 5. On-Demand Kannada Translation & Guidance
  total++;
  const kannadaRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai-teacher/translate-kannada',
    method: 'POST',
    headers: authHeaders
  }, {
    text: "Yesterday I go to market"
  });

  if (kannadaRes.status === 200 && kannadaRes.json && kannadaRes.json.kannada) {
    console.log(`[PASS] 5. Kannada explanation provided: "${kannadaRes.json.kannada}"`);
    passed++;
  } else {
    console.error('[FAIL] 5. Kannada explanation failed:', kannadaRes.body);
  }

  // 6. Session Summary Generation & Practice Minutes Persistence
  total++;
  const summaryRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai-teacher/session-summary',
    method: 'POST',
    headers: authHeaders
  }, {
    conversation: [
      { sender: 'ai', text: 'Hello! What would you like to talk about today?' },
      { sender: 'user', text: 'I am preparing for an IT job interview.' },
      { sender: 'ai', text: 'Great! Could you tell me about yourself and your aspirations?' },
      { sender: 'user', text: 'My friend and I built an articulate web project.' }
    ],
    roleplayMode: 'career',
    durationSeconds: 180
  });

  if (summaryRes.status === 200 && summaryRes.json && summaryRes.json.summary) {
    const s = summaryRes.json.summary;
    console.log(`[PASS] 6. End-of-session summary generated: Fluency Score ${s.fluencyScore}%, Vocabulary: ${s.vocabularyLearned?.length} words, Practice Minutes: ${s.totalPracticeMinutes || s.durationMinutes}`);
    passed++;
  } else {
    console.error('[FAIL] 6. End-of-session summary failed:', summaryRes.body);
  }

  // 7. Security: Unauthenticated Access Rejected
  total++;
  const unauthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/ai-teacher/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    message: 'Hello'
  });

  if (unauthRes.status === 401) {
    console.log('[PASS] 7. Security verification: Unauthenticated requests strictly rejected with HTTP 401');
    passed++;
  } else {
    console.error('[FAIL] 7. Security verification failed:', unauthRes.status);
  }

  console.log('\n======================================================');
  console.log(`PHASE 2 RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log('======================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase2Tests().catch(err => {
  console.error('Fatal error in Phase 2 test suite:', err);
  process.exit(1);
});
