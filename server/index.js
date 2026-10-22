require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const { intrusionDetectionMiddleware } = require('./middleware/security');
const { setupWebRTCSignaling } = require('./services/webrtcSignaling');

// Import routes
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const lessonsRoutes = require('./routes/lessonsRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const aiTeacherRoutes = require('./routes/aiTeacherRoutes');
const quizRoutes = require('./routes/quizRoutes');
const debateRoutes = require('./routes/debateRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const securityRoutes = require('./routes/securityRoutes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Security Headers with relaxed CSP for local WebRTC and Web Audio
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Global Intrusion Detection Middleware
app.use(intrusionDetectionMiddleware);

// API Rate Limiting (Defense against DDoS and scraping)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this address. Please slow down and try again shortly.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 mins for login/register
  message: {
    success: false,
    error: 'Authentication rate limit reached. Please wait a few minutes before trying again.'
  }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'LEARN WITH ARJEEVI Core API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/ai-teacher', aiTeacherRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/debate', debateRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/security', securityRoutes);

// Socket.io for WebRTC signaling and Debate timers
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupWebRTCSignaling(io);

// Serve static frontend files if built
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // In dev mode when client is served by Vite on port 5173
      res.json({
        service: 'LEARN WITH ARJEEVI API Server',
        status: 'Active on port ' + PORT,
        frontendDevUrl: 'http://localhost:5173',
        message: 'Frontend is running in development mode via Vite.'
      });
    }
  });
});

// Safe Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal error occurred. Please try again.'
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` LEARN WITH ARJEEVI — Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
