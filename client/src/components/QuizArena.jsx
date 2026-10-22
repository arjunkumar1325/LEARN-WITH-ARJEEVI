import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, CheckCircle2, XCircle, Award, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuizArena({ token, user, onClose }) {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [quizStarted, setQuizStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    fetchActiveQuiz();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const fetchActiveQuiz = async () => {
    try {
      const res = await fetch('/api/quiz/current', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuizData(data.quiz);
        setTimeRemaining((data.quiz.durationMinutes || 10) * 60);
      }
    } catch (err) {
      console.error('Quiz fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startCompetition = () => {
    setQuizStarted(true);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitQuiz = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setSubmitting(true);

    const timeSpent = Math.max(5, Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000));

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId: quizData.id,
          answers,
          timeSpentSeconds: timeSpent
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
        if (data.score >= 80) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (loading || !quizData) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ textAlign: 'center', padding: '40px' }}>
          Loading Weekly Championship...
        </div>
      </div>
    );
  }

  const questions = quizData.questions || [];
  const currentQ = questions[currentQIdx];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(245, 158, 11, 0.4)'
            }}>
              <Trophy size={22} color="#F59E0B" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Weekly Quiz Arena</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official Spoken English & Grammar Championship
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            Close
          </button>
        </div>

        {/* STATE 1: PRE-START LOBBY */}
        {!quizStarted && !quizResult && (
          <div>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '24px'
            }}>
              <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>Active Competition</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>{quizData.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '16px' }}>
                Topic: <strong style={{ color: '#F1F5F9' }}>{quizData.topic}</strong>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(7, 13, 24, 0.6)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Questions</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38BDF8' }}>{quizData.totalQuestions}</div>
                </div>
                <div style={{ background: 'rgba(7, 13, 24, 0.6)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Time Limit</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#A78BFA' }}>{quizData.durationMinutes} Mins</div>
                </div>
                <div style={{ background: 'rgba(7, 13, 24, 0.6)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Certificate Score</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34D399' }}>80%+</div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <button
                onClick={startCompetition}
                className="btn btn-cyan"
                style={{ padding: '14px 36px', fontSize: '1.05rem', fontWeight: 700 }}
              >
                Begin Championship Quiz
              </button>
            </div>

            {/* Current Top Ranks */}
            <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#F59E0B" /> Current Hall of Fame
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(quizData.leaderboard || []).slice(0, 5).map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 800, color: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#B45309' : '#FFF' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: 600 }}>{entry.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>{entry.score}%</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{entry.timeSeconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATE 2: ACTIVE COMPETITION */}
        {quizStarted && !quizResult && currentQ && (
          <div>
            {/* Top Bar: Progress & Live Timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-violet">
                Question {currentQIdx + 1} of {questions.length}
              </span>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: timeRemaining < 120 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                color: timeRemaining < 120 ? '#FDA4AF' : '#67E8F9',
                fontWeight: 700,
                border: '1px solid currentColor'
              }}>
                <Clock size={16} />
                <span>{formatTimer(timeRemaining)}</span>
              </div>
            </div>

            {/* Question Text */}
            <div style={{
              padding: '24px 20px',
              background: 'rgba(7, 13, 24, 0.85)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 600, lineHeight: 1.5 }}>
                {currentQ.question}
              </h3>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = answers[currentQ.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => setAnswers({ ...answers, [currentQ.id]: oIdx })}
                    style={{
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(124, 58, 237, 0.28)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1.5px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                      color: isSelected ? '#FFF' : 'var(--text-main)',
                      fontWeight: isSelected ? 600 : 400,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckCircle2 size={18} color="#38BDF8" />}
                  </button>
                );
              })}
            </div>

            {/* Nav Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                disabled={currentQIdx === 0}
                onClick={() => setCurrentQIdx(currentQIdx - 1)}
                className="btn btn-outline"
              >
                Previous
              </button>

              {currentQIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIdx(currentQIdx + 1)}
                  className="btn btn-primary"
                >
                  Next Question <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={submitQuiz}
                  className="btn btn-cyan"
                  style={{ fontWeight: 700 }}
                >
                  {submitting ? 'Submitting...' : 'Finish & Submit Exam'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STATE 3: RESULTS & SCORE ANALYSIS */}
        {quizResult && (
          <div>
            <div style={{
              textAlign: 'center',
              padding: '28px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
              borderRadius: '20px',
              border: '1px solid var(--border-cyan)',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: quizResult.score >= 80 ? '#34D399' : '#38BDF8',
                marginBottom: '6px'
              }}>
                {quizResult.score}%
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                {quizResult.score >= 80 ? '🎉 Outstanding Spoken English Mastery!' : 'Well Practised! Keep Pushing.'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                You answered {quizResult.correctCount} out of {quizResult.totalQuestions} questions correctly in {quizResult.timeSpentSeconds} seconds.
              </p>
            </div>

            {/* Answer Breakdown */}
            <h4 style={{ fontSize: '1.05rem', marginBottom: '14px' }}>Question Explanations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {quizResult.detailedResults.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: r.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    border: r.isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                    {r.isCorrect ? <CheckCircle2 size={16} color="#34D399" /> : <XCircle size={16} color="#F43F5E" />}
                    <span>{r.question}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#38BDF8' }}>
                    Correct Answer: {r.correctOption}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {r.explanation}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
