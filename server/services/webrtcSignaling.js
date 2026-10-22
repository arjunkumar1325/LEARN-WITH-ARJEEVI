const db = require('../db/database');

// Active matchmaking queues categorized by criteria
const waitingUsers = []; // [{ socketId, userId, name, preferredName, age, level, goals, mode, joinedAt }]
const proposedCalls = new Map(); // callId -> { callId, user1, user2, starterPrompt, timeoutId, createdAt }
const activeCalls = new Map(); // callId -> { caller, callee, startTime, callId, mode }
const debateRooms = new Map(); // roomId -> { topic, participants: [], round: 1, timer: 60, intervalId }

const CONVERSATION_PROMPTS = [
  'Icebreaker: "What is your favorite memory from school or college?"',
  'Practice Question: "If you could visit any city in the world tomorrow, where would you go and why?"',
  'Everyday English: "What is one English word or phrase you learned this week?"',
  'Career & Ambition: "What kind of work or projects do you enjoy doing the most?"',
  'Hobbies: "What is a movie, book, or hobby that inspired you recently?"',
  'Confidence: "What makes speaking English challenging for you, and how are you overcoming it?"'
];

function getRandomPrompt() {
  return CONVERSATION_PROMPTS[Math.floor(Math.random() * CONVERSATION_PROMPTS.length)];
}

function setupWebRTCSignaling(io) {
  io.on('connection', (socket) => {
    // 1. Identify connected user with sanitized public profile (No phone, no exact location)
    socket.on('register_user', (userData) => {
      socket.userData = {
        userId: userData.userId,
        name: userData.name || 'Learner',
        preferredName: userData.preferredName || userData.name || 'Learner',
        age: Number(userData.age) || 20,
        level: userData.level || 'Beginner',
        goals: Array.isArray(userData.goals) ? userData.goals : [],
        explanationLanguage: userData.explanationLanguage || 'English'
      };
    });

    // 2. Peer Matchmaking Queue with Mutual Consent Flow
    socket.on('start_speaking_match', (preferences = {}) => {
      const user = socket.userData;
      if (!user) {
        socket.emit('match_error', { message: 'Please register your session before matchmaking.' });
        return;
      }

      // Remove from any prior queue position or pending proposal
      const existingIdx = waitingUsers.findIndex(u => u.socketId === socket.id || u.userId === user.userId);
      if (existingIdx !== -1) waitingUsers.splice(existingIdx, 1);

      cleanupPendingProposalsForSocket(socket.id, 'User restarted matchmaking.');

      const isMinor = (user.age && user.age < 18);
      const data = db.read();
      const blockedList = data.blockedPairs || [];

      // Find compatible match adhering to community safety guidelines
      let matchIdx = -1;
      for (let i = 0; i < waitingUsers.length; i++) {
        const candidate = waitingUsers[i];
        if (candidate.userId === user.userId) continue;

        // Safety Safeguard: Minor Protection (<18 only match with <18)
        const candidateIsMinor = (candidate.age && candidate.age < 18);
        if (isMinor !== candidateIsMinor) {
          continue; // Incompatible age group for minor protection
        }

        // Safety Safeguard: Blocklist check
        const isBlocked = blockedList.some(
          pair => (pair.user1 === user.userId && pair.user2 === candidate.userId) ||
                  (pair.user2 === user.userId && pair.user1 === candidate.userId)
        );
        if (isBlocked) continue;

        matchIdx = i;
        break;
      }

      if (matchIdx !== -1) {
        const matchedPeer = waitingUsers.splice(matchIdx, 1)[0];
        const callId = `call_prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const prompt = getRandomPrompt();

        // 18-second timeout timer for proposal (gives a 15-second visual countdown)
        const timeoutId = setTimeout(() => {
          const prop = proposedCalls.get(callId);
          if (prop) {
            proposedCalls.delete(callId);
            io.to(prop.user1.socketId).emit('call_declined', { reason: 'Match proposal timed out. Partner did not respond in time.' });
            io.to(prop.user2.socketId).emit('call_declined', { reason: 'Match proposal timed out. Partner did not respond in time.' });
          }
        }, 18000);

        // Record proposal pending mutual consent
        proposedCalls.set(callId, {
          callId,
          user1: {
            socketId: socket.id,
            userId: user.userId,
            name: user.preferredName,
            level: user.level,
            goals: user.goals,
            accepted: null
          },
          user2: {
            socketId: matchedPeer.socketId,
            userId: matchedPeer.userId,
            name: matchedPeer.preferredName,
            level: matchedPeer.level,
            goals: matchedPeer.goals,
            accepted: null
          },
          starterPrompt: prompt,
          timeoutId,
          createdAt: Date.now()
        });

        // Emit match_proposed to BOTH sockets (Strictly privacy scrubbed: name, level, goals ONLY)
        socket.emit('match_proposed', {
          callId,
          peer: {
            name: matchedPeer.preferredName,
            level: matchedPeer.level,
            goals: matchedPeer.goals
          },
          starterPrompt: prompt,
          timeoutSeconds: 15
        });

        const peerSocket = io.sockets.sockets.get(matchedPeer.socketId);
        if (peerSocket) {
          peerSocket.emit('match_proposed', {
            callId,
            peer: {
              name: user.preferredName,
              level: user.level,
              goals: user.goals
            },
            starterPrompt: prompt,
            timeoutSeconds: 15
          });
        }
      } else {
        // Enqueue user
        waitingUsers.push({
          socketId: socket.id,
          userId: user.userId,
          name: user.preferredName,
          preferredName: user.preferredName,
          age: user.age,
          level: user.level,
          goals: user.goals,
          mode: preferences.mode || 'audio',
          joinedAt: Date.now()
        });

        socket.emit('match_waiting', {
          message: 'Looking for a friendly speaking partner at your level...',
          queuePosition: waitingUsers.length
        });
      }
    });

    // 3. Respond to Match Proposal (Accept / Reject Flow)
    socket.on('respond_match_proposal', ({ callId, accept }) => {
      const prop = proposedCalls.get(callId);
      if (!prop) {
        socket.emit('call_declined', { reason: 'Call proposal has expired or is no longer available.' });
        return;
      }

      if (!accept) {
        // User explicitly rejected the call
        clearTimeout(prop.timeoutId);
        proposedCalls.delete(callId);

        const isUser1 = prop.user1.socketId === socket.id;
        const otherSocketId = isUser1 ? prop.user2.socketId : prop.user1.socketId;

        socket.emit('call_declined', { reason: 'You declined the speaking invitation.' });
        io.to(otherSocketId).emit('call_declined', { reason: 'Speaking partner declined the call invitation.' });
        return;
      }

      // User accepted the call
      if (prop.user1.socketId === socket.id) {
        prop.user1.accepted = true;
      } else if (prop.user2.socketId === socket.id) {
        prop.user2.accepted = true;
      }

      // Check if both users have consented
      if (prop.user1.accepted === true && prop.user2.accepted === true) {
        clearTimeout(prop.timeoutId);
        proposedCalls.delete(callId);

        activeCalls.set(callId, {
          callId,
          caller: { socketId: prop.user1.socketId, userId: prop.user1.userId, name: prop.user1.name, level: prop.user1.level },
          callee: { socketId: prop.user2.socketId, userId: prop.user2.userId, name: prop.user2.name, level: prop.user2.level },
          startTime: new Date().toISOString()
        });

        const sock1 = io.sockets.sockets.get(prop.user1.socketId);
        const sock2 = io.sockets.sockets.get(prop.user2.socketId);

        if (sock1) sock1.join(callId);
        if (sock2) sock2.join(callId);

        // Notify both peers to initiate WebRTC audio negotiation
        io.to(prop.user1.socketId).emit('match_found', {
          callId,
          isCaller: true,
          peer: { name: prop.user2.name, level: prop.user2.level, userId: prop.user2.userId },
          starterPrompt: prop.starterPrompt
        });

        io.to(prop.user2.socketId).emit('match_found', {
          callId,
          isCaller: false,
          peer: { name: prop.user1.name, level: prop.user1.level, userId: prop.user1.userId },
          starterPrompt: prop.starterPrompt
        });
      } else {
        // User accepted, waiting for partner
        socket.emit('waiting_for_peer_consent', {
          message: 'You accepted! Waiting for your speaking partner to confirm...'
        });
      }
    });

    // 4. Cancel speaking match
    socket.on('cancel_speaking_match', () => {
      const idx = waitingUsers.findIndex(u => u.socketId === socket.id);
      if (idx !== -1) waitingUsers.splice(idx, 1);
      cleanupPendingProposalsForSocket(socket.id, 'Partner cancelled the request.');
      socket.emit('match_cancelled');
    });

    // 5. WebRTC Signaling Exchanges
    socket.on('webrtc_offer', ({ callId, offer }) => {
      socket.to(callId).emit('webrtc_offer', { offer });
    });

    socket.on('webrtc_answer', ({ callId, answer }) => {
      socket.to(callId).emit('webrtc_answer', { answer });
    });

    socket.on('webrtc_ice_candidate', ({ callId, candidate }) => {
      socket.to(callId).emit('webrtc_ice_candidate', { candidate });
    });

    // 6. In-call Controls
    socket.on('peer_control_update', ({ callId, micMuted, cameraOff }) => {
      socket.to(callId).emit('peer_control_update', { micMuted, cameraOff });
    });

    socket.on('request_new_prompt', ({ callId }) => {
      const prompt = getRandomPrompt();
      io.to(callId).emit('new_prompt', { starterPrompt: prompt });
    });

    // 7. End Call (Immediate leave)
    socket.on('end_call', ({ callId, notes }) => {
      const call = activeCalls.get(callId);
      if (call) {
        const data = db.read();
        data.peerCallLogs = data.peerCallLogs || [];
        data.peerCallLogs.push({
          callId,
          callerId: call.caller.userId,
          calleeId: call.callee.userId,
          startTime: call.startTime,
          endTime: new Date().toISOString(),
          durationSeconds: Math.floor((Date.now() - new Date(call.startTime).getTime()) / 1000)
        });
        db.write(data);
        activeCalls.delete(callId);
      }
      socket.to(callId).emit('call_ended', { reason: 'Partner left the conversation.' });
      socket.leave(callId);
    });

    // 8. Community Safety: Block and Report
    socket.on('block_and_report_user', ({ callId, reportedUserId, reason, comments }) => {
      const reporterId = socket.userData?.userId || 'unknown';
      const data = db.read();

      // Save report
      data.userReports = data.userReports || [];
      data.userReports.push({
        id: `rep_${Date.now()}`,
        reporterId,
        reportedUserId,
        reason,
        comments,
        createdAt: new Date().toISOString()
      });

      // Save block pair
      data.blockedPairs = data.blockedPairs || [];
      if (!data.blockedPairs.some(p => (p.user1 === reporterId && p.user2 === reportedUserId))) {
        data.blockedPairs.push({
          user1: reporterId,
          user2: reportedUserId,
          createdAt: new Date().toISOString()
        });
      }
      db.write(data);

      // Immediately terminate call
      if (callId) {
        socket.to(callId).emit('call_ended', { reason: 'Call terminated due to community safety moderation.' });
        socket.leave(callId);
        activeCalls.delete(callId);
      }

      cleanupPendingProposalsForSocket(socket.id, 'Call proposal terminated for moderation.');

      db.logSecurityEvent({
        eventType: 'USER_REPORTED_AND_BLOCKED',
        severity: 'HIGH',
        userId: reporterId,
        details: `User reported ${reportedUserId} for reason: ${reason}. Blocklist updated.`
      });

      socket.emit('report_confirmed', {
        message: 'Thank you. The user has been blocked permanently and our safety moderation team has logged your report.'
      });
    });

    // 9. Debate Club Live Turn Management
    socket.on('join_debate_room', ({ roomId, topicId, role }) => {
      socket.join(roomId);
      let room = debateRooms.get(roomId);
      if (!room) {
        const data = db.read();
        const topic = (data.debateTopics || []).find(t => t.id === topicId) || (data.debateTopics || [])[0];
        room = {
          roomId,
          topic,
          participants: [],
          currentRound: 1,
          activeSpeakerRole: 'proposition',
          timerSeconds: 60,
          status: 'waiting'
        };
        debateRooms.set(roomId, room);
      }

      if (!room.participants.some(p => p.socketId === socket.id)) {
        room.participants.push({
          socketId: socket.id,
          userId: socket.userData?.userId,
          name: socket.userData?.preferredName || 'Speaker',
          role: role || (room.participants.length % 2 === 0 ? 'proposition' : 'opposition')
        });
      }

      io.to(roomId).emit('debate_room_update', {
        topic: room.topic,
        participants: room.participants,
        currentRound: room.currentRound,
        activeSpeakerRole: room.activeSpeakerRole,
        timerSeconds: room.timerSeconds,
        status: room.status
      });
    });

    socket.on('start_debate_round', ({ roomId }) => {
      const room = debateRooms.get(roomId);
      if (!room) return;

      room.status = 'live';
      room.timerSeconds = 60;

      if (room.intervalId) clearInterval(room.intervalId);

      room.intervalId = setInterval(() => {
        room.timerSeconds -= 1;
        if (room.timerSeconds <= 0) {
          if (room.activeSpeakerRole === 'proposition') {
            room.activeSpeakerRole = 'opposition';
            room.timerSeconds = 60;
          } else {
            room.currentRound += 1;
            room.activeSpeakerRole = 'proposition';
            room.timerSeconds = 60;
          }

          if (room.currentRound > 3) {
            clearInterval(room.intervalId);
            room.status = 'completed';
            io.to(roomId).emit('debate_completed', {
              message: 'Debate concluded! Review your speaking notes and feedback.'
            });
            return;
          }
        }
        io.to(roomId).emit('debate_timer_tick', {
          currentRound: room.currentRound,
          activeSpeakerRole: room.activeSpeakerRole,
          timerSeconds: room.timerSeconds
        });
      }, 1000);
    });

    // Helper: Cleanup proposed calls for socket
    function cleanupPendingProposalsForSocket(socketId, reason) {
      for (const [cId, prop] of proposedCalls.entries()) {
        if (prop.user1.socketId === socketId || prop.user2.socketId === socketId) {
          clearTimeout(prop.timeoutId);
          proposedCalls.delete(cId);
          const otherId = (prop.user1.socketId === socketId) ? prop.user2.socketId : prop.user1.socketId;
          io.to(otherId).emit('call_declined', { reason });
        }
      }
    }

    // 10. Disconnect cleanup
    socket.on('disconnect', () => {
      const qIdx = waitingUsers.findIndex(u => u.socketId === socket.id);
      if (qIdx !== -1) waitingUsers.splice(qIdx, 1);

      cleanupPendingProposalsForSocket(socket.id, 'Speaking partner disconnected.');

      for (const [callId, call] of activeCalls.entries()) {
        if (call.caller.socketId === socket.id || call.callee.socketId === socket.id) {
          socket.to(callId).emit('call_ended', { reason: 'Speaking partner disconnected.' });
          activeCalls.delete(callId);
        }
      }
    });
  });
}

module.exports = {
  setupWebRTCSignaling
};
