import React, { useState, useEffect } from 'react';
import {
  PenTool,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Layers,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Volume2,
  Trophy,
  Flame,
  Award,
  ChevronRight,
  Languages
} from 'lucide-react';

export default function GrammarExercises({ token, onClose }) {
  // 4 Modes: 'fib' (Fill in Blanks), 'sb' (Sentence Builder), 'err' (Error Correction), 'vocab' (Daily Vocabulary Challenge)
  const [activeEngine, setActiveEngine] = useState('fib');
  const [difficulty, setDifficulty] = useState('Beginner'); // 'Beginner' | 'Intermediate' | 'Advanced'
  const [loading, setLoading] = useState(false);
  const [showKannadaHelp, setShowKannadaHelp] = useState(false);

  // 1. Fill in the Blanks State
  const [fibItems, setFibItems] = useState([]);
  const [fibCurrentIdx, setFibCurrentIdx] = useState(0);
  const [fibSelectedOption, setFibSelectedOption] = useState(null);
  const [fibFeedback, setFibFeedback] = useState(null);
  const [fibScore, setFibScore] = useState(0);

  // 2. Sentence Builder State
  const [sbItems, setSbItems] = useState([]);
  const [sbCurrentIdx, setSbCurrentIdx] = useState(0);
  const [placedWords, setPlacedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [sbFeedback, setSbFeedback] = useState(null);
  const [sbScore, setSbScore] = useState(0);

  // 3. Error Correction State
  const [errItems, setErrItems] = useState([]);
  const [errCurrentIdx, setErrCurrentIdx] = useState(0);
  const [errSelectedOption, setErrSelectedOption] = useState(null);
  const [errFeedback, setErrFeedback] = useState(null);
  const [errScore, setErrScore] = useState(0);

  // 4. Daily Vocabulary Challenge State
  const [vocabData, setVocabData] = useState(null);
  const [vocabSelectedOption, setVocabSelectedOption] = useState(null);
  const [vocabFeedback, setVocabFeedback] = useState(null);
  const [vocabSubmitted, setVocabSubmitted] = useState(false);

  useEffect(() => {
    if (activeEngine === 'fib') {
      loadFib();
    } else if (activeEngine === 'sb') {
      loadSb();
    } else if (activeEngine === 'err') {
      loadErr();
    } else if (activeEngine === 'vocab') {
      loadVocab();
    }
  }, [activeEngine, difficulty]);

  // Load Fill-in-the-Blanks
  const loadFib = async () => {
    setLoading(true);
    setFibSelectedOption(null);
    setFibFeedback(null);
    setFibCurrentIdx(0);
    try {
      const res = await fetch(`/api/exercises/fill-in-blanks?difficulty=${difficulty}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFibItems(data.exercises);
      }
    } catch (err) {
      console.error('Error loading FIB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Sentence Builder
  const loadSb = async () => {
    setLoading(true);
    setSbFeedback(null);
    setSbCurrentIdx(0);
    try {
      const res = await fetch(`/api/exercises/sentence-builder?difficulty=${difficulty}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.exercises.length > 0) {
        setSbItems(data.exercises);
        initSbExercise(data.exercises[0]);
      } else {
        setSbItems([]);
      }
    } catch (err) {
      console.error('Error loading SB:', err);
    } finally {
      setLoading(false);
    }
  };

  const initSbExercise = (item) => {
    setPlacedWords([]);
    setAvailableWords([...item.shuffledWords]);
    setSbFeedback(null);
  };

  // Load Error Correction
  const loadErr = async () => {
    setLoading(true);
    setErrSelectedOption(null);
    setErrFeedback(null);
    setErrCurrentIdx(0);
    try {
      const res = await fetch(`/api/exercises/error-correction?difficulty=${difficulty}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setErrItems(data.exercises);
      }
    } catch (err) {
      console.error('Error loading Error Correction:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Daily Vocabulary
  const loadVocab = async () => {
    setLoading(true);
    setVocabFeedback(null);
    setVocabSelectedOption(null);
    try {
      const res = await fetch('/api/exercises/daily-vocabulary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVocabData(data.vocab);
        setVocabSubmitted(data.vocab.isCompletedToday);
      }
    } catch (err) {
      console.error('Error loading Daily Vocab:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Fill-in-the-Blanks Selection
  const handleSelectFibOption = async (option) => {
    if (fibFeedback) return;
    setFibSelectedOption(option);
    const item = fibItems[fibCurrentIdx];

    try {
      const res = await fetch('/api/exercises/fill-in-blanks/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: item.id, selectedOption: option })
      });
      const data = await res.json();
      if (data.success) {
        setFibFeedback(data);
        if (data.isCorrect) setFibScore(prev => prev + 1);
      }
    } catch (err) {
      console.error('Check FIB error:', err);
    }
  };

  const nextFib = () => {
    if (fibCurrentIdx < fibItems.length - 1) {
      setFibCurrentIdx(prev => prev + 1);
      setFibSelectedOption(null);
      setFibFeedback(null);
    }
  };

  // Handle Sentence Builder Word Placement
  const handlePickWord = (word, indexInAvailable) => {
    if (sbFeedback) return;
    const newAvailable = [...availableWords];
    newAvailable.splice(indexInAvailable, 1);
    setPlacedWords([...placedWords, word]);
    setAvailableWords(newAvailable);
  };

  const handleRemovePlacedWord = (word, indexInPlaced) => {
    if (sbFeedback) return;
    const newPlaced = [...placedWords];
    newPlaced.splice(indexInPlaced, 1);
    setPlacedWords(newPlaced);
    setAvailableWords([...availableWords, word]);
  };

  const handleCheckSb = async () => {
    if (placedWords.length === 0 || sbFeedback) return;
    const item = sbItems[sbCurrentIdx];
    const constructed = placedWords.join(' ');

    try {
      const res = await fetch('/api/exercises/sentence-builder/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: item.id, constructedSentence: constructed })
      });
      const data = await res.json();
      if (data.success) {
        setSbFeedback(data);
        if (data.isCorrect) setSbScore(prev => prev + 1);
      }
    } catch (err) {
      console.error('Check SB error:', err);
    }
  };

  const nextSb = () => {
    if (sbCurrentIdx < sbItems.length - 1) {
      const nextIdx = sbCurrentIdx + 1;
      setSbCurrentIdx(nextIdx);
      initSbExercise(sbItems[nextIdx]);
    }
  };

  // Handle Error Correction Selection
  const handleSelectErrOption = async (option) => {
    if (errFeedback) return;
    setErrSelectedOption(option);
    const item = errItems[errCurrentIdx];

    try {
      const res = await fetch('/api/exercises/error-correction/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: item.id, selectedOption: option })
      });
      const data = await res.json();
      if (data.success) {
        setErrFeedback(data);
        if (data.isCorrect) setErrScore(prev => prev + 1);
      }
    } catch (err) {
      console.error('Check Error Correction error:', err);
    }
  };

  const nextErr = () => {
    if (errCurrentIdx < errItems.length - 1) {
      setErrCurrentIdx(prev => prev + 1);
      setErrSelectedOption(null);
      setErrFeedback(null);
    }
  };

  // Handle Daily Vocabulary Submission
  const handleSelectVocabOption = async (idx) => {
    if (vocabFeedback || vocabSubmitted) return;
    setVocabSelectedOption(idx);

    try {
      const res = await fetch('/api/exercises/daily-vocabulary/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: vocabData.id, selectedIndex: idx })
      });
      const data = await res.json();
      if (data.success) {
        setVocabFeedback(data);
        setVocabSubmitted(true);
      }
    } catch (err) {
      console.error('Daily vocab submit error:', err);
    }
  };

  // Spoken Pronunciation
  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '880px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>

        {/* 1. Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(124, 58, 237, 0.25) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-cyan)'
            }}>
              <PenTool size={22} color="#38BDF8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF' }}>Interactive Practice Arena</h2>
                <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>Phase 3 Drills</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Adaptive grammar drills, syntax ordering, error correction & daily vocabulary
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Kannada Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#67E8F9' }}>
              <input
                type="checkbox"
                checked={showKannadaHelp}
                onChange={(e) => setShowKannadaHelp(e.target.checked)}
              />
              <span>ಕನ್ನಡ ವಿವರಣೆ (Kannada Hints)</span>
            </label>

            <button onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              Close
            </button>
          </div>
        </div>

        {/* 2. Practice Activity Modules Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          background: 'rgba(7, 13, 24, 0.85)',
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'fib', label: 'Fill in the Blanks', icon: PenTool },
            { id: 'sb', label: 'Sentence Builder', icon: Layers },
            { id: 'err', label: 'Fix Grammar Slips', icon: AlertTriangle },
            { id: 'vocab', label: 'Daily Vocab Challenge', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeEngine === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveEngine(tab.id)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '8px',
                  background: isActive ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : 'transparent',
                  color: isActive ? '#FFF' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Difficulty Tier Selector (for fib, sb, err) */}
        {activeEngine !== 'vocab' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Difficulty Tier:</span>
              {['Beginner', 'Intermediate', 'Advanced'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: difficulty === diff ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: difficulty === diff ? '1px solid var(--border-cyan)' : '1px solid var(--border-subtle)',
                    color: difficulty === diff ? '#38BDF8' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Score Tracker */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#FCD34D',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '4px 12px',
              borderRadius: '999px'
            }}>
              <Trophy size={14} color="#F59E0B" />
              <span>
                Score: {activeEngine === 'fib' ? fibScore : activeEngine === 'sb' ? sbScore : errScore}
              </span>
            </div>
          </div>
        )}

        {/* 4. Active Activity Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              Loading interactive exercises...
            </div>
          ) : (
            <>
              {/* ========================================================== */}
              {/* MODULE 1: FILL IN THE BLANKS */}
              {/* ========================================================== */}
              {activeEngine === 'fib' && (
                <div>
                  {fibItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>No exercises found for this level.</div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span className="badge badge-violet">
                          Question {fibCurrentIdx + 1} of {fibItems.length}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Click the correct word to fill the blank
                        </span>
                      </div>

                      {/* Sentence Prompt */}
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        lineHeight: 1.6,
                        color: '#FFF',
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(7, 13, 24, 0.7)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {fibItems[fibCurrentIdx]?.sentence}
                      </div>

                      {/* Options Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                        {fibItems[fibCurrentIdx]?.options.map((opt, idx) => {
                          let optBg = 'rgba(30, 41, 59, 0.7)';
                          let optBorder = '1px solid var(--border-subtle)';
                          let optColor = '#FFF';

                          if (fibFeedback && fibSelectedOption === opt) {
                            if (fibFeedback.isCorrect) {
                              optBg = 'rgba(16, 185, 129, 0.25)';
                              optBorder = '1px solid #10B981';
                              optColor = '#6EE7B7';
                            } else {
                              optBg = 'rgba(239, 68, 68, 0.25)';
                              optBorder = '1px solid #EF4444';
                              optColor = '#FCA5A5';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectFibOption(opt)}
                              disabled={Boolean(fibFeedback)}
                              style={{
                                padding: '14px 18px',
                                borderRadius: '12px',
                                background: optBg,
                                border: optBorder,
                                color: optColor,
                                fontSize: '0.96rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                cursor: fibFeedback ? 'default' : 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback Panel */}
                      {fibFeedback && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: fibFeedback.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: fibFeedback.isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px', color: fibFeedback.isCorrect ? '#34D399' : '#F87171' }}>
                            {fibFeedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            <span>{fibFeedback.isCorrect ? 'Correct! Well done.' : `Incorrect. The correct answer is "${fibFeedback.correctAnswer}".`}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '4px' }}>
                            {fibFeedback.explanation}
                          </div>
                        </div>
                      )}

                      {/* Next Button */}
                      {fibFeedback && fibCurrentIdx < fibItems.length - 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={nextFib} className="btn btn-cyan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Next Question</span> <ArrowRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================== */}
              {/* MODULE 2: SENTENCE BUILDER / UNSCRAMBLE */}
              {/* ========================================================== */}
              {activeEngine === 'sb' && (
                <div>
                  {sbItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>No sentence exercises found for this level.</div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span className="badge badge-cyan">
                          Exercise {sbCurrentIdx + 1} of {sbItems.length}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Click word chips in correct order to construct the sentence
                        </span>
                      </div>

                      {/* Target Constructed Sentence Slot */}
                      <div style={{
                        minHeight: '64px',
                        padding: '14px',
                        background: 'rgba(7, 13, 24, 0.85)',
                        borderRadius: '12px',
                        border: '2px dashed var(--border-cyan)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        {placedWords.length === 0 ? (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                            Click words below to place them here...
                          </span>
                        ) : (
                          placedWords.map((word, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleRemovePlacedWord(word, idx)}
                              disabled={Boolean(sbFeedback)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                                color: '#FFF',
                                border: 'none',
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                cursor: sbFeedback ? 'default' : 'pointer'
                              }}
                              title="Click to remove"
                            >
                              {word}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Available Shuffled Words */}
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Available Words:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {availableWords.map((word, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePickWord(word, idx)}
                              disabled={Boolean(sbFeedback)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid var(--border-subtle)',
                                color: '#E2E8F0',
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                cursor: sbFeedback ? 'default' : 'pointer'
                              }}
                            >
                              {word}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action & Feedback */}
                      {!sbFeedback ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={handleCheckSb}
                            disabled={placedWords.length === 0}
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                          >
                            Check Sentence Order
                          </button>
                          <button
                            onClick={() => initSbExercise(sbItems[sbCurrentIdx])}
                            className="btn btn-outline"
                            title="Reset Words"
                          >
                            <RotateCcw size={16} /> Reset
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: sbFeedback.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: sbFeedback.isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                            marginBottom: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px', color: sbFeedback.isCorrect ? '#34D399' : '#F87171' }}>
                              {sbFeedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                              <span>{sbFeedback.isCorrect ? 'Splendid syntax! Sentence is ordered perfectly.' : 'Not quite right yet.'}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#FFF', marginTop: '6px' }}>
                              Target: <strong>"{sbFeedback.targetSentence}"</strong>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#CBD5E1', marginTop: '4px' }}>
                              {sbFeedback.explanation}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => initSbExercise(sbItems[sbCurrentIdx])} className="btn btn-outline">
                              <RotateCcw size={14} /> Try Again
                            </button>
                            {sbCurrentIdx < sbItems.length - 1 && (
                              <button onClick={nextSb} className="btn btn-cyan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Next Sentence</span> <ArrowRight size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================== */}
              {/* MODULE 3: FIND & FIX GRAMMAR SLIPS (Error Correction) */}
              {/* ========================================================== */}
              {activeEngine === 'err' && (
                <div>
                  {errItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>No error correction exercises found for this level.</div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span className="badge badge-rose">
                          Exercise {errCurrentIdx + 1} of {errItems.length}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Find and select the correct natural English sentence
                        </span>
                      </div>

                      {/* Problem Sentence */}
                      <div style={{
                        padding: '16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        marginBottom: '18px'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FDA4AF', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Contains a common spoken mistake:
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FECACA' }}>
                          "{errItems[errCurrentIdx]?.incorrectSentence}"
                        </div>
                        {showKannadaHelp && errItems[errCurrentIdx]?.kannadaHint && (
                          <div style={{ marginTop: '6px', fontSize: '0.84rem', color: '#67E8F9' }}>
                            ಕನ್ನಡ ಸೂಚನೆ: {errItems[errCurrentIdx].kannadaHint}
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        {errItems[errCurrentIdx]?.options.map((opt, idx) => {
                          let optBg = 'rgba(30, 41, 59, 0.7)';
                          let optBorder = '1px solid var(--border-subtle)';
                          let optColor = '#FFF';

                          if (errFeedback && errSelectedOption === opt) {
                            if (errFeedback.isCorrect) {
                              optBg = 'rgba(16, 185, 129, 0.25)';
                              optBorder = '1px solid #10B981';
                              optColor = '#6EE7B7';
                            } else {
                              optBg = 'rgba(239, 68, 68, 0.25)';
                              optBorder = '1px solid #EF4444';
                              optColor = '#FCA5A5';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectErrOption(opt)}
                              disabled={Boolean(errFeedback)}
                              style={{
                                padding: '14px 18px',
                                borderRadius: '12px',
                                background: optBg,
                                border: optBorder,
                                color: optColor,
                                fontSize: '0.92rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                cursor: errFeedback ? 'default' : 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback */}
                      {errFeedback && (
                        <div style={{
                          padding: '16px',
                          borderRadius: '12px',
                          background: errFeedback.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          border: errFeedback.isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px', color: errFeedback.isCorrect ? '#34D399' : '#F87171' }}>
                            {errFeedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            <span>{errFeedback.isCorrect ? 'Spot on! Correct form identified.' : 'Review the grammar rule below:'}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '4px' }}>
                            {errFeedback.ruleExplanation}
                          </div>
                          {errFeedback.kannadaHint && (
                            <div style={{ fontSize: '0.82rem', color: '#67E8F9', marginTop: '6px' }}>
                              {errFeedback.kannadaHint}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Next Button */}
                      {errFeedback && errCurrentIdx < errItems.length - 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={nextErr} className="btn btn-cyan" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Next Exercise</span> <ArrowRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================== */}
              {/* MODULE 4: DAILY VOCABULARY CHALLENGE */}
              {/* ========================================================== */}
              {activeEngine === 'vocab' && (
                <div>
                  {!vocabData ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading today's vocabulary challenge...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Word Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(6, 182, 212, 0.15) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        borderRadius: '16px',
                        padding: '24px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="badge badge-violet">{vocabData.day} Word of the Day</span>
                          <span style={{ fontSize: '0.8rem', color: '#67E8F9', fontWeight: 600 }}>{vocabData.partOfSpeech}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFF' }}>{vocabData.word}</h2>
                          <button
                            onClick={() => speakWord(vocabData.word)}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Hear pronunciation"
                          >
                            <Volume2 size={16} /> Listen
                          </button>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            {vocabData.phonetic}
                          </span>
                        </div>

                        <div style={{ fontSize: '1rem', color: '#E2E8F0', marginBottom: '10px' }}>
                          <strong>Meaning:</strong> {vocabData.meaning}
                        </div>

                        {vocabData.kannada && (
                          <div style={{ fontSize: '0.9rem', color: '#C4B5FD', marginBottom: '10px' }}>
                            <strong>ಕನ್ನಡ ಅರ್ಥ:</strong> {vocabData.kannada}
                          </div>
                        )}

                        <div style={{
                          background: 'rgba(7, 13, 24, 0.6)',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '0.88rem',
                          color: '#38BDF8',
                          fontStyle: 'italic'
                        }}>
                          "{vocabData.example}"
                        </div>
                      </div>

                      {/* Daily Challenge Question */}
                      <div className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Award size={18} color="#F59E0B" />
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF' }}>
                            Daily Streak Challenge Question (+5 Streak Points)
                          </h3>
                        </div>

                        <p style={{ fontSize: '0.95rem', color: '#E2E8F0', marginBottom: '16px' }}>
                          {vocabData.question?.q}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                          {vocabData.question?.options.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectVocabOption(idx)}
                              disabled={vocabSubmitted}
                              style={{
                                padding: '14px 18px',
                                borderRadius: '12px',
                                background: vocabSelectedOption === idx
                                  ? 'rgba(124, 58, 237, 0.35)'
                                  : 'rgba(30, 41, 59, 0.7)',
                                border: vocabSelectedOption === idx
                                  ? '1px solid var(--violet-light)'
                                  : '1px solid var(--border-subtle)',
                                color: '#FFF',
                                fontSize: '0.92rem',
                                fontWeight: 600,
                                textAlign: 'left',
                                cursor: vocabSubmitted ? 'default' : 'pointer'
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>

                        {vocabFeedback && (
                          <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: vocabFeedback.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            border: vocabFeedback.isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px', color: vocabFeedback.isCorrect ? '#34D399' : '#F87171' }}>
                              {vocabFeedback.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                              <span>{vocabFeedback.isCorrect ? 'Congratulations! Daily challenge completed (+5 streak points).' : 'Good attempt!'}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '4px' }}>
                              {vocabFeedback.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
