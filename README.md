# LEARN WITH ARJEEVI — Master Confident Spoken English

A production-ready, full-stack, real-time English-learning web platform engineered to help people who are afraid of speaking English become confident, fluent speakers through friendly AI voice conversations, safe human connections, structured pathways, live debates, competitions, and consistent daily practice.

---

## 🌟 Complete 5-Phase Product Overview

### Phase 1 — First Impression, Architecture & Authentication
- **Visual SaaS Aesthetics:** High-end dark navy (`#070D18`), vivid violet (`#7C3AED`), and cyan (`#06B6D4`) glassmorphism interface.
- **Secure Authentication:** Bcrypt password hashing (10 salt rounds), signed JSON Web Tokens (JWT) with automatic expiration, and rate-limiting against credential stuffing.
- **Demo Credentials:** Instant access via **Learner** (`learner@arjeevi.com` / `Learner2026!`) and **Admin SOC** (`admin@arjeevi.com` / `ArjeeviAdmin2026!`).

### Phase 2 — Real-Time AI English Teacher
- **Interactive Voice Pipeline:** Natural spoken English dialogue with real-time waveform visualization, continuous speech synthesis, and speaking indicators.
- **Pedagogical Corrections:** Gentle, non-judgmental guidance for grammatical blunders (e.g., correcting *"I am 21 year"* to *"I am 21 years old"*).
- **Dual-Language Kannada Explanations (`ಕನ್ನಡ ವಿವರಣೆ`):** Contextual explanations for Karnataka learners who think in Kannada.
- **Roleplay Scenarios:** Job interviews, campus placements, coffee shop ordering, and morning standups.
- **End-of-Session Summary:** Fluency scores, vocabulary acquired, and confidence milestones.

### Phase 3 — Complete Structured Learning Curriculum & Drills
- **21 Structured Modules:** Comprehensive lessons across Beginner, Intermediate, and Advanced tiers.
- **Interactive Practice Arena:**
  - *Fill-in-the-Blanks:* Multi-tier grammar exercises with immediate explanations.
  - *Sentence Builder:* Drag-and-drop / tile-based syntax arrangement.
  - *Error Correction:* Real-world mistake identification and correction drills.
  - *Daily Vocabulary Challenge:* Word-of-the-day retention mechanics and daily streak tracking.
- **Offline Downloadable Study Sheets:** Professional 1-click A4 PDF generation via `jsPDF`.

### Phase 4 — Safe, Interactive English-Speaking Community
- **Mutual Consent Matchmaking:** Sockets pair compatible learners by level and goals, then dispatch a mutual match proposal with a 15-second countdown timer. Both users must click "Accept Call" before audio connects.
- **WebRTC Peer-to-Peer Audio:** Direct browser-to-browser voice streaming via Google STUN servers (`stun:stun.l.google.com:19302`).
- **Privacy & Minor Protection Safeguards:**
  - Phone numbers, personal emails, and exact locations are **never** exposed.
  - Minors (<18) strictly match only with other minors (<18).
- **Clear In-Call Controls:** Mic mute, remote volume toggle, prompt cycler ("New Topic"), and immediate leave button.
- **Community Moderation:** Instant **Block & Report** functionality that records audit incidents and permanently bans paired users from ever matching again.
- **Moderated Discussion & Debate Club:** Synchronized 60-second round timers for proposition and opposition speakers with live turn management.
- **Weekly Quiz Championship:** Anti-cheat question delivery (answers stripped from public API), plausibility timing checks, and real-time leaderboards with celebratory confetti.

### Phase 5 — Subscriptions, Rewards, Security Monitoring & Launch Readiness
- **7-Day Free AI Teacher Trial:** Automatically granted to new users. Server-enforced countdown independent of client time.
- **Tiered Transparent Pricing:**
  - **Student Fluency Pass:** **₹49 / month** (tailored for college students, youth, and entry-level job seekers).
  - **Adult & Professional Fluency Pass:** **₹59 / month** (tailored for working professionals, parents, and career adults).
- **100% Free Core Guarantee:** Peer speaking rooms, all 21 structured lessons, interactive grammar drills, debate club, and weekly quizzes remain **free forever**.
- **Cryptographic Payment Verification:** HMAC-SHA256 signature validation on the server ensures zero client-side payment tampering.
- **Fair Consistency Streak Rewards:** Automated reward engine awards the top 3 learners with the highest genuine streaks an additional **14 free AI trial days**.
- **Proficiency Certificates:**
  - Awarded upon completing defined requirements (minimum 3 lessons, 75%+ assessment score, 3+ day streak).
  - Unique verifiable ID (e.g. `ARJ-2026-XXXX`) with public online verification.
  - Downloadable A4 landscape PDF certificate.
  - Consent-based email dispatch with honest test-mode / production SMTP checks.
- **Active Session Management:** Track logged-in devices with IP address, browser/device info, and single-click remote session revocation ("Sign Out All Other Devices").
- **Intrusion Detection System (IDS) & Admin SOC:** Real-time SOC dashboard displaying threat severity levels (`CRITICAL`, `HIGH`, `WARNING`, `INFO`), brute-force mitigation, and resolution workflows.
- **Honest Security Posture:** Transparent acknowledgement that no system is unhackable, backed by defense-in-depth engineering.

---

## 🚀 Pre-Flight & Production Deployment Guide

### 1. Environment Variables Configuration (`.env`)

Create or update `.env` in the root directory:

```env
# Server Runtime
PORT=5000
NODE_ENV=production

# Cryptographic & Authentication Secrets
JWT_SECRET=your_high_entropy_jwt_secret_minimum_32_characters_here
ADMIN_EMAIL=admin@arjeevi.com
ADMIN_PASSWORD=YourStrongAdminProductionPassword!2026

# AI Voice Teacher (Optional Google Gemini API Key)
GEMINI_API_KEY=your_google_gemini_api_key_here

# Payment Gateway (Razorpay India)
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_key_secret

# Outbound Email Service (Optional SMTP for Certificate Delivery)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_smtp_password_here
SMTP_FROM=no-reply@arjeevi.com
```

### 2. Building for Production

Compile optimized client assets:
```bash
# Install dependencies
npm install
npm --prefix client install

# Build frontend production bundle
npm --prefix client run build
```

The compiled assets will be created in `client/dist/` and automatically served by Express in production mode.

### 3. Production Deployment with PM2

Run the application as a background service with automatic process recovery:

```bash
# Install PM2 globally
npm install -g pm2

# Start production server
NODE_ENV=production pm2 start server/index.js --name "arjeevi-app"

# Monitor application status
pm2 status
pm2 logs arjeevi-app
```

### 4. Reverse Proxy Configuration (Nginx)

When deploying behind Nginx on a Linux VPS (Ubuntu/Debian):

```nginx
server {
    listen 80;
    server_name learn.arjeevi.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name learn.arjeevi.com;

    ssl_certificate /etc/letsencrypt/live/learn.arjeevi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/learn.arjeevi.com/privkey.pem;

    # Security Headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 Comprehensive Automated Test Suites

All 5 development phases include automated test suites. Execute them individually:

```bash
# Phase 1: Authentication, onboarding, profile editing & session persistence
node test_phase1.js

# Phase 2: AI Voice Teacher, speech recognition/synthesis loop, Kannada aids & summaries
node test_phase2.js

# Phase 3: 21 structured lessons, assessments, FIB, sentence builder & streak retention
node test_phase3.js

# Phase 4: Peer matchmaking, mutual accept/reject handshake, WebRTC audio & safety blocks
node test_phase4.js

# Phase 5: Subscriptions (₹49/₹59), HMAC verification, consistency rewards, certificates & session revocation
node test_phase5.js
```

All 39 total test cases across all 5 test suites pass with 0 failures!

---

## 🔐 Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Learner Demo** | `learner@arjeevi.com` | `Learner2026!` | Full learning modules, peer speaking, debate & quizzes |
| **Admin SOC** | `admin@arjeevi.com` | `ArjeeviAdmin2026!` | Intrusion detection telemetry, user reports & security resolution |

---

## 🛡️ Pre-Launch Security Checklist

- [x] Passwords hashed with bcrypt (10 rounds); zero plaintext passwords stored.
- [x] JWT sessions use cryptographically random secrets with automatic expiry.
- [x] Server-side HMAC-SHA256 verification on all payment confirmations.
- [x] Frontend bundles contain no private API keys or server secrets.
- [x] Intrusion Detection System (IDS) alerts on credential stuffing and brute force attempts.
- [x] Under-18 accounts strictly segregated from matching with adult users.
- [x] Immediate 1-click block & report controls to protect community members.
- [x] Active session tracking with single-click remote session revocation.
- [x] Rate limiting enabled across authentication and API routes.
- [x] Honest security disclosure: defense-in-depth principles declared without claiming absolute invulnerability.
