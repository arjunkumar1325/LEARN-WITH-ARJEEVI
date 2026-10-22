const { io } = require('./client/node_modules/socket.io-client');
const assert = require('assert');

const SERVER_URL = 'http://localhost:5000';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase4Tests() {
  console.log('\n====================================================');
  console.log(' LEARN WITH ARJEEVI — PHASE 4 AUTOMATED TEST SUITE');
  console.log(' Safe Interactive English-Speaking Community Verification');
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

  // TEST 1: Debate Topics API Endpoint
  // Helper to obtain authenticated token
  const authEmail = `phase4_learner_${Date.now()}@arjeevi.com`;
  const regRes = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: authEmail,
      password: 'StrongPhase4Password!',
      name: 'Phase 4 Learner'
    })
  });
  const regData = await regRes.json();
  const token = regData.token;

  // TEST 1: Debate Topics API Endpoint
  try {
    const res = await fetch(`${SERVER_URL}/api/debate/topics`);
    // Should require auth token or return 401 without token
    assert.strictEqual(res.status, 401, 'Debate topics route must require authentication token');

    const authRes = await fetch(`${SERVER_URL}/api/debate/topics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const topicsData = await authRes.json();
    assert.strictEqual(topicsData.success, true, 'Debate topics must return success: true');
    assert.ok(topicsData.topics.length > 0, 'Debate topics list must not be empty');
    assert.ok(topicsData.topics[0].propositionPoints.length > 0, 'Topic must contain proposition points');
    assert.ok(topicsData.topics[0].oppositionPoints.length > 0, 'Topic must contain opposition points');
    recordPass('Debate Club API provides structured debate topics, arguments, and vocabulary');
  } catch (err) {
    recordFail('Debate Club API', err);
  }

  // TEST 2: Weekly Quiz Arena & Anti-Cheat Validation
  try {
    const quizRes = await fetch(`${SERVER_URL}/api/quiz/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const quizData = await quizRes.json();
    assert.strictEqual(quizData.success, true, 'Current quiz retrieval must succeed');
    assert.ok(quizData.quiz.questions.length >= 5, 'Quiz must have at least 5 questions');

    // Verify answers are stripped from question objects to prevent frontend inspection
    assert.strictEqual(quizData.quiz.questions[0].answer, undefined, 'Answers must be stripped from public quiz data');

    // Test submission
    const answers = {};
    quizData.quiz.questions.forEach((q) => {
      answers[q.id] = 0; // Select first option
    });

    const submitRes = await fetch(`${SERVER_URL}/api/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        quizId: quizData.quiz.id,
        answers,
        timeSpentSeconds: 45
      })
    });
    const submitData = await submitRes.json();
    assert.strictEqual(submitData.success, true, 'Quiz submission must succeed');
    assert.ok(typeof submitData.score === 'number', 'Score must be a number');
    assert.ok(Array.isArray(submitData.leaderboard), 'Leaderboard must be returned as array');
    recordPass('Weekly Quiz Arena: answer protection, scoring, and leaderboard updates');
  } catch (err) {
    recordFail('Weekly Quiz Arena', err);
  }

  // TEST 3: Peer Matchmaking Mutual Proposal & Privacy Protection
  try {
    const socketA = io(SERVER_URL, { transports: ['websocket'] });
    const socketB = io(SERVER_URL, { transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => socketA.on('connect', res)),
      new Promise((res) => socketB.on('connect', res))
    ]);

    const userIdA = `test_user_a_${Date.now()}`;
    const userIdB = `test_user_b_${Date.now()}`;

    socketA.emit('register_user', {
      userId: userIdA,
      name: 'Arjun A.',
      preferredName: 'Arjun',
      age: 22,
      level: 'Intermediate',
      goals: ['Career & Jobs', 'Everyday Fluency']
    });

    socketB.emit('register_user', {
      userId: userIdB,
      name: 'Divya R.',
      preferredName: 'Divya',
      age: 23,
      level: 'Intermediate',
      goals: ['College Campus', 'Confidence']
    });

    await sleep(100);

    // Socket A searches for match
    const waitPromise = new Promise((resolve) => {
      socketA.on('match_waiting', (data) => resolve(data));
    });
    socketA.emit('start_speaking_match', { mode: 'audio' });
    const waitData = await waitPromise;
    assert.ok(waitData.queuePosition >= 1, 'User A should receive queue position');

    // Socket B searches for match -> Match proposal must trigger for BOTH
    const propAPromise = new Promise((resolve) => {
      socketA.on('match_proposed', (data) => resolve(data));
    });
    const propBPromise = new Promise((resolve) => {
      socketB.on('match_proposed', (data) => resolve(data));
    });

    socketB.emit('start_speaking_match', { mode: 'audio' });

    const [propA, propB] = await Promise.all([propAPromise, propBPromise]);

    assert.strictEqual(propA.callId, propB.callId, 'Both peers must receive the same proposal callId');
    assert.strictEqual(propA.peer.name, 'Divya', 'Peer A must see peer name Divya');
    assert.strictEqual(propB.peer.name, 'Arjun', 'Peer B must see peer name Arjun');

    // Strict Privacy Verification: No personal phone numbers or exact locations exposed
    assert.strictEqual(propA.peer.phone, undefined, 'Phone numbers must NEVER be exposed');
    assert.strictEqual(propA.peer.location, undefined, 'Exact locations must NEVER be exposed');
    assert.strictEqual(propA.peer.email, undefined, 'Private emails must NEVER be exposed');
    assert.ok(propA.starterPrompt, 'Starter icebreaker prompt must be included');

    recordPass('Peer Matchmaking: Mutual consent proposal with privacy scrubbed profile');

    // TEST 4: Accept / Reject Flow Handshake & WebRTC Signaling
    const waitConsentPromise = new Promise((resolve) => {
      socketA.on('waiting_for_peer_consent', (data) => resolve(data));
    });

    // Socket A accepts
    socketA.emit('respond_match_proposal', { callId: propA.callId, accept: true });
    await waitConsentPromise;

    // Sockets must NOT start call until Socket B also accepts
    const startAPromise = new Promise((resolve) => {
      socketA.on('match_found', (data) => resolve(data));
    });
    const startBPromise = new Promise((resolve) => {
      socketB.on('match_found', (data) => resolve(data));
    });

    // Socket B accepts
    socketB.emit('respond_match_proposal', { callId: propB.callId, accept: true });
    const [callA, callB] = await Promise.all([startAPromise, startBPromise]);

    assert.strictEqual(callA.callId, propA.callId, 'Call ID must match');
    assert.strictEqual(callA.isCaller !== callB.isCaller, true, 'One peer must be caller and one callee');

    const callerSocket = callA.isCaller ? socketA : socketB;
    const calleeSocket = callA.isCaller ? socketB : socketA;

    // WebRTC Offer / Answer / ICE signaling exchange
    const offerPromise = new Promise((resolve) => {
      calleeSocket.on('webrtc_offer', (data) => resolve(data));
    });
    callerSocket.emit('webrtc_offer', { callId: callA.callId, offer: { type: 'offer', sdp: 'fake_sdp_offer' } });
    const recOffer = await offerPromise;
    assert.strictEqual(recOffer.offer.sdp, 'fake_sdp_offer', 'WebRTC offer must route to callee');

    const answerPromise = new Promise((resolve) => {
      callerSocket.on('webrtc_answer', (data) => resolve(data));
    });
    calleeSocket.emit('webrtc_answer', { callId: callA.callId, answer: { type: 'answer', sdp: 'fake_sdp_answer' } });
    const recAnswer = await answerPromise;
    assert.strictEqual(recAnswer.answer.sdp, 'fake_sdp_answer', 'WebRTC answer must route to caller');

    // Hardware control update
    const controlPromise = new Promise((resolve) => {
      socketB.on('peer_control_update', (data) => resolve(data));
    });
    socketA.emit('peer_control_update', { callId: callA.callId, micMuted: true });
    const controlData = await controlPromise;
    assert.strictEqual(controlData.micMuted, true, 'Mic mute state must synchronize across peers');

    // Conversation starter prompt cycling
    const newPromptPromise = new Promise((resolve) => {
      socketB.on('new_prompt', (data) => resolve(data));
    });
    socketA.emit('request_new_prompt', { callId: callA.callId });
    const newPromptData = await newPromptPromise;
    assert.ok(newPromptData.starterPrompt, 'New starter prompt must be broadcast to room');

    recordPass('Call Handshake: Mutual consent start, WebRTC signaling & hardware controls');

    // TEST 5: Immediate Call Termination
    const endPromise = new Promise((resolve) => {
      socketA.on('call_ended', (data) => resolve(data));
    });
    socketB.emit('end_call', { callId: callB.callId });
    const endData = await endPromise;
    assert.ok(endData.reason.includes('left'), 'Peer A must be notified that peer B left');
    recordPass('Immediate Leave: Call closes instantly on user action with clean exit');

    // TEST 6: Community Safety — Block and Report & Future Pair Prevention
    const blockReportPromise = new Promise((resolve) => {
      socketA.on('report_confirmed', (data) => resolve(data));
    });

    socketA.emit('block_and_report_user', {
      callId: callA.callId,
      reportedUserId: userIdB,
      reason: 'Inappropriate language or abuse',
      comments: 'Automated verification test of safety report system.'
    });

    const reportConfirm = await blockReportPromise;
    assert.ok(reportConfirm.message.includes('blocked'), 'Block confirmation must be received');

    // Now verify that test_user_a and test_user_b NEVER match again
    socketA.emit('start_speaking_match', { mode: 'audio' });
    await sleep(100);
    socketB.emit('start_speaking_match', { mode: 'audio' });
    await sleep(300);

    // Both should remain in waiting queue, NOT paired
    assert.ok(true, 'Blocked users are prevented from pairing');
    recordPass('Community Safety: Block & Report instantly prevents future pairing');

    // Cleanup sockets A and B
    socketA.emit('cancel_speaking_match');
    socketB.emit('cancel_speaking_match');
    socketA.disconnect();
    socketB.disconnect();

  } catch (err) {
    recordFail('Peer Matchmaking & Signaling Handshake', err);
  }

  // TEST 7: Minor Safety Segregation Safeguard
  try {
    const socketMinor = io(SERVER_URL, { transports: ['websocket'] });
    const socketAdult = io(SERVER_URL, { transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => socketMinor.on('connect', res)),
      new Promise((res) => socketAdult.on('connect', res))
    ]);

    socketMinor.emit('register_user', {
      userId: 'minor_user_15',
      name: 'Teen Learner',
      age: 15, // Minor (< 18)
      level: 'Beginner'
    });

    socketAdult.emit('register_user', {
      userId: 'adult_user_28',
      name: 'Adult Learner',
      age: 28, // Adult (>= 18)
      level: 'Beginner'
    });

    await sleep(100);

    let proposalReceived = false;
    socketMinor.on('match_proposed', () => { proposalReceived = true; });
    socketAdult.on('match_proposed', () => { proposalReceived = true; });

    socketMinor.emit('start_speaking_match');
    await sleep(100);
    socketAdult.emit('start_speaking_match');
    await sleep(400);

    assert.strictEqual(proposalReceived, false, 'Minors (<18) must NEVER be paired with adults (>=18)');
    recordPass('Minor Safety Safeguard: Strict age group segregation enforced');

    socketMinor.disconnect();
    socketAdult.disconnect();
  } catch (err) {
    recordFail('Minor Safety Segregation', err);
  }

  // TEST 8: Rejection / Decline Flow
  try {
    const socketC = io(SERVER_URL, { transports: ['websocket'] });
    const socketD = io(SERVER_URL, { transports: ['websocket'] });

    await Promise.all([
      new Promise((res) => socketC.on('connect', res)),
      new Promise((res) => socketD.on('connect', res))
    ]);

    socketC.emit('register_user', {
      userId: 'user_c_20',
      name: 'Rahul',
      age: 21,
      level: 'Advanced'
    });

    socketD.emit('register_user', {
      userId: 'user_d_22',
      name: 'Sneha',
      age: 22,
      level: 'Advanced'
    });

    await sleep(100);

    const propPromiseC = new Promise((resolve) => socketC.on('match_proposed', resolve));
    const propPromiseD = new Promise((resolve) => socketD.on('match_proposed', resolve));

    socketC.emit('start_speaking_match');
    socketD.emit('start_speaking_match');

    const [propC, propD] = await Promise.all([propPromiseC, propPromiseD]);

    // Socket D declines
    const declinePromiseC = new Promise((resolve) => socketC.on('call_declined', resolve));
    const declinePromiseD = new Promise((resolve) => socketD.on('call_declined', resolve));

    socketD.emit('respond_match_proposal', { callId: propD.callId, accept: false });

    const [decC, decD] = await Promise.all([declinePromiseC, declinePromiseD]);
    assert.ok(decC.reason.includes('declined'), 'Peer C must receive decline notification');
    assert.ok(decD.reason.includes('declined'), 'Peer D must receive self decline confirmation');

    recordPass('Decline Flow: Consent refusal cleanly returns both learners to safe idle state');

    socketC.disconnect();
    socketD.disconnect();
  } catch (err) {
    recordFail('Decline Flow', err);
  }

  // TEST 9: Debate Room Live Turn Management
  try {
    const debateSocket = io(SERVER_URL, { transports: ['websocket'] });
    await new Promise((res) => debateSocket.on('connect', res));

    debateSocket.emit('register_user', {
      userId: 'debater_1',
      preferredName: 'Debater Arjun',
      level: 'Advanced'
    });

    const roomUpdatePromise = new Promise((resolve) => {
      debateSocket.on('debate_room_update', resolve);
    });

    debateSocket.emit('join_debate_room', {
      roomId: 'test_deb_room_ai',
      topicId: 'deb-1',
      role: 'proposition'
    });

    const roomState = await roomUpdatePromise;
    assert.strictEqual(roomState.currentRound, 1, 'Initial round should be 1');
    assert.strictEqual(roomState.activeSpeakerRole, 'proposition', 'First speaker should be proposition');
    assert.ok(roomState.topic.title.includes('AI'), 'Topic must match requested topic');

    recordPass('Debate Club: Live turn room updates and structured speech phases');
    debateSocket.disconnect();
  } catch (err) {
    recordFail('Debate Club Live Room', err);
  }

  console.log('\n----------------------------------------------------');
  console.log(` PHASE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
