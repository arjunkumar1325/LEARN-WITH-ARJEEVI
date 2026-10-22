import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  Download,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Volume2,
  Languages,
  Trophy,
  Award,
  Check,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function CurriculumView({ token, user, onClose, onLessonCompleted }) {
  const [activeTab, setActiveTab] = useState(user.currentLevel || 'Beginner');
  const [curriculum, setCurriculum] = useState({ Beginner: [], Intermediate: [], Advanced: [] });
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonDetail, setLessonDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showLessonKannada, setShowLessonKannada] = useState(user.explanationLanguage?.includes('Kannada') || false);

  // Quiz in lesson state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/lessons', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurriculum(data.lessons);
      }
    } catch (err) {
      console.error('Fetch lessons error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLesson = async (lessonSummary) => {
    setSelectedLesson(lessonSummary);
    setDetailLoading(true);
    setQuizAnswers({});
    setQuizResult(null);

    try {
      const res = await fetch(`/api/lessons/${lessonSummary.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLessonDetail(data.lesson);
      }
    } catch (err) {
      console.error('Lesson detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitLessonQuiz = async () => {
    if (!selectedLesson) return;
    setSubmittingQuiz(true);
    try {
      const res = await fetch(`/api/lessons/${selectedLesson.id}/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: quizAnswers })
      });
      const data = await res.json();
      if (data.success) {
        setQuizResult(data);
        if (data.passed) {
          fetchLessons();
          if (onLessonCompleted) onLessonCompleted();
        }
      }
    } catch (err) {
      console.error('Quiz submit error:', err);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Audio pronunciation
  const speakSentence = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const downloadLessonPdf = () => {
    if (!lessonDetail) return;
    const doc = new jsPDF();

    doc.setFillColor(11, 19, 43);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(56, 189, 248);
    doc.setFontSize(22);
    doc.text('LEARN WITH ARJEEVI', 20, 25);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(lessonDetail.title, 20, 36);

    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text(`Level: ${lessonDetail.level} • Module ${lessonDetail.order}`, 20, 44);

    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    doc.setFontSize(13);
    doc.setTextColor(103, 232, 249);
    doc.text('Summary:', 20, 58);

    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    const summaryLines = doc.splitTextToSize(lessonDetail.content?.summary || '', 170);
    doc.text(summaryLines, 20, 66);

    let curY = 66 + summaryLines.length * 6 + 6;

    doc.setFontSize(13);
    doc.setTextColor(167, 139, 250);
    doc.text('Golden Rules:', 20, curY);
    curY += 8;

    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    (lessonDetail.content?.rules || []).forEach(r => {
      const ruleLines = doc.splitTextToSize(`• ${r}`, 170);
      doc.text(ruleLines, 20, curY);
      curY += ruleLines.length * 6 + 2;
    });

    curY += 4;
    doc.setFontSize(13);
    doc.setTextColor(252, 211, 77);
    doc.text('Examples:', 20, curY);
    curY += 8;

    doc.setFontSize(10);
    doc.setTextColor(241, 245, 249);
    (lessonDetail.content?.examples || []).forEach(ex => {
      doc.text(`"${ex.english}"`, 20, curY);
      curY += 6;
      if (ex.kannada) {
        doc.setTextColor(196, 181, 253);
        doc.text(`Kannada: ${ex.kannada}`, 24, curY);
        doc.setTextColor(241, 245, 249);
        curY += 6;
      }
      curY += 2;
    });

    doc.save(`${lessonDetail.title.replace(/\s+/g, '_')}_StudyGuide.pdf`);
  };

  const lessonsForTab = curriculum[activeTab] || [];
  const completedInTab = lessonsForTab.filter(l => l.isCompleted).length;
  const tabProgressPct = lessonsForTab.length > 0 ? Math.round((completedInTab / lessonsForTab.length) * 100) : 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>

        {/* 1. Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-cyan)'
            }}>
              <BookOpen size={22} color="#38BDF8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF' }}>Structured English Pathways</h2>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>Phase 3 Curriculum</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Beginner, Intermediate & Advanced structured lessons with audio, Kannada aids & PDF sheets
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              Close
            </button>
          </div>
        </div>

        {/* 2. Pathway Tabs & Visual Level Progress */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(7, 13, 24, 0.85)',
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '14px',
          border: '1px solid var(--border-subtle)'
        }}>
          {['Beginner', 'Intermediate', 'Advanced'].map((tab) => {
            const isCurrent = activeTab === tab;
            const tabLessons = curriculum[tab] || [];
            const done = tabLessons.filter(l => l.isCompleted).length;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedLesson(null); }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isCurrent ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : 'transparent',
                  color: isCurrent ? '#FFF' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{tab} Pathway</span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: isCurrent ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#FFF'
                }}>
                  {done}/{tabLessons.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. Level Progress Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {activeTab} Progress: <strong style={{ color: '#38BDF8' }}>{completedInTab} / {lessonsForTab.length} completed ({tabProgressPct}%)</strong>
          </div>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${tabProgressPct}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #06B6D4)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* 4. Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selectedLesson ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '14px' }}>
              {lessonsForTab.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => openLesson(lesson)}
                  className="glass-card"
                  style={{
                    padding: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: lesson.isCompleted ? '4px solid var(--emerald-success)' : '4px solid var(--violet-light)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-violet">Module {lesson.order}</span>
                      {lesson.isCompleted ? (
                        <span className="badge badge-emerald"><CheckCircle2 size={12} /> Completed</span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{lesson.estimatedMinutes} mins</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: '#FFF' }}>{lesson.title}</h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {lesson.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '14px', gap: '4px', color: 'var(--cyan-bright)', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>{lesson.isCompleted ? 'Review Lesson' : 'Start Lesson'}</span> <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Selected Lesson Detail View */
            <div style={{ padding: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  ← Back to {activeTab} Pathway
                </button>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#67E8F9' }}>
                  <input
                    type="checkbox"
                    checked={showLessonKannada}
                    onChange={(e) => setShowLessonKannada(e.target.checked)}
                  />
                  <span>ಕನ್ನಡ ವಿವರಣೆ (Kannada Aids)</span>
                </label>
              </div>

              {detailLoading || !lessonDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading lesson details...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Title and Download Card */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(7, 13, 24, 0.85)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div className="badge badge-cyan" style={{ marginBottom: '6px' }}>
                        {lessonDetail.level} • Module {lessonDetail.order}
                      </div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF' }}>{lessonDetail.title}</h2>
                    </div>

                    <button
                      onClick={downloadLessonPdf}
                      className="btn btn-cyan"
                      style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={15} /> Download Study PDF
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', color: '#67E8F9', fontWeight: 700 }}>Concept Summary</h3>
                    <p style={{ fontSize: '0.92rem', color: '#E2E8F0', lineHeight: 1.6 }}>
                      {lessonDetail.content?.summary}
                    </p>
                  </div>

                  {/* Rules */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', color: '#A78BFA', fontWeight: 700 }}>Golden Spoken Rules & Formula</h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(lessonDetail.content?.rules || []).map((rule, idx) => (
                        <li key={idx} style={{ display: 'flex', gap: '10px', fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--cyan-bright)', fontWeight: 700 }}>•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Examples (English + Audio + Kannada) */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', color: '#FCD34D', fontWeight: 700 }}>
                      Everyday Conversational Examples (Listen & Repeat)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(lessonDetail.content?.examples || []).map((ex, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(7, 13, 24, 0.65)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 600, color: '#38BDF8', fontSize: '0.95rem' }}>
                              "{ex.english}"
                            </div>
                            <button
                              onClick={() => speakSentence(ex.english)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#67E8F9', padding: '4px' }}
                              title="Listen to pronunciation"
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                          {showLessonKannada && ex.kannada && (
                            <div style={{ color: '#C4B5FD', fontSize: '0.84rem', marginTop: '4px' }}>
                              ಕನ್ನಡ: {ex.kannada}
                            </div>
                          )}
                          {ex.note && (
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '4px' }}>
                              Tip: {ex.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Practice Prompts */}
                  {lessonDetail.content?.practicePrompts?.length > 0 && (
                    <div style={{
                      padding: '16px 20px',
                      background: 'rgba(124, 58, 237, 0.12)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '14px'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', marginBottom: '6px' }}>
                        🎙️ Spoken Practice Exercises (Speak Aloud)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {lessonDetail.content.practicePrompts.map((p, idx) => (
                          <div key={idx} style={{ fontSize: '0.9rem', color: '#F1F5F9' }}>
                            {idx + 1}. {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assessment Quiz */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', color: '#34D399', fontWeight: 700 }}>
                      Lesson Assessment Quiz
                    </h3>

                    {(lessonDetail.content?.quiz || []).map((q, idx) => (
                      <div key={idx} style={{ marginBottom: '18px' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', color: '#FFF' }}>
                          {idx + 1}. {q.q}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {q.options.map((opt, oIdx) => (
                            <label
                              key={oIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                background: quizAnswers[idx] === oIdx ? 'rgba(124, 58, 237, 0.25)' : 'rgba(7, 13, 24, 0.6)',
                                border: quizAnswers[idx] === oIdx ? '1px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              <input
                                type="radio"
                                name={`q_${idx}`}
                                checked={quizAnswers[idx] === oIdx}
                                onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: oIdx })}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>

                        {/* Individual Feedback if graded */}
                        {quizResult && quizResult.feedback && quizResult.feedback[idx] && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: quizResult.feedback[idx].isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            fontSize: '0.82rem',
                            color: quizResult.feedback[idx].isCorrect ? '#6EE7B7' : '#FDA4AF'
                          }}>
                            {quizResult.feedback[idx].isCorrect ? '✓ Correct! ' : `✗ Incorrect. Correct: "${quizResult.feedback[idx].correctAnswer}". `}
                            {quizResult.feedback[idx].explanation}
                          </div>
                        )}
                      </div>
                    ))}

                    {quizResult && (
                      <div style={{
                        padding: '14px',
                        background: quizResult.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        border: quizResult.passed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(244, 63, 94, 0.4)',
                        borderRadius: '12px',
                        marginBottom: '14px',
                        fontSize: '0.9rem',
                        color: quizResult.passed ? '#6EE7B7' : '#FDA4AF'
                      }}>
                        {quizResult.passed ? '🎉 Congratulations! You passed this lesson assessment and your profile progress was saved.' : 'Keep practicing! Review the rules above and try again.'}
                      </div>
                    )}

                    <button
                      onClick={submitLessonQuiz}
                      disabled={submittingQuiz || Object.keys(quizAnswers).length < (lessonDetail.content?.quiz || []).length}
                      className="btn btn-primary"
                      style={{ marginTop: '8px', padding: '10px 20px' }}
                    >
                      {submittingQuiz ? 'Grading Assessment...' : 'Submit Quiz & Complete Lesson'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
