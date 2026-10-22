import React, { useState } from 'react';
import { User, Target, BarChart3, HeartHandshake, Settings, ArrowRight, ArrowLeft, Check, Sparkles, HelpCircle } from 'lucide-react';

export default function OnboardingFlow({ token, initialUser, onCompleted }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form States
  const [name, setName] = useState(initialUser?.name || '');
  const [preferredName, setPreferredName] = useState(initialUser?.preferredName || initialUser?.name || '');
  const [age, setAge] = useState('');
  const [avatar, setAvatar] = useState('🌟');

  const [goals, setGoals] = useState(['Everyday conversation']);
  const [currentLevel, setCurrentLevel] = useState('Beginner');
  const [confidenceLevel, setConfidenceLevel] = useState('I am afraid to speak.');
  const [explanationLanguage, setExplanationLanguage] = useState('English + Kannada');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15);
  const [preferredPracticeTime, setPreferredPracticeTime] = useState('Evening (6 PM - 9 PM)');

  // Placement Quiz State
  const [showPlacementQuiz, setShowPlacementQuiz] = useState(false);
  const [placementQuestions, setPlacementQuestions] = useState([]);
  const [placementAnswers, setPlacementAnswers] = useState({});
  const [placementResult, setPlacementResult] = useState(null);

  const GOAL_OPTIONS = [
    'Everyday conversation',
    'College and education',
    'Job interviews',
    'IT and software careers',
    'Business and entrepreneurship',
    'Public speaking',
    'Competitive examinations',
    'International communication'
  ];

  const CONFIDENCE_OPTIONS = [
    { title: 'I am afraid to speak.', desc: 'I hesitate or freeze when speaking English.' },
    { title: 'I can speak a little.', desc: 'I know some words but struggle to form full sentences.' },
    { title: 'I can speak but make mistakes.', desc: 'I understand well, but grammar slips hold me back.' },
    { title: 'I want to become fluent and professional.', desc: 'I speak comfortably and want executive polish.' }
  ];

  const AVATARS = ['🌟', '🚀', '🎯', '💡', '🌱', '🏆', '💎', '🔥'];

  const toggleGoal = (goal) => {
    if (goals.includes(goal)) {
      if (goals.length > 1) setGoals(goals.filter(g => g !== goal));
    } else {
      setGoals([...goals, goal]);
    }
  };

  const startPlacementQuiz = async () => {
    try {
      const res = await fetch('/api/onboarding/placement-quiz', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlacementQuestions(data.questions);
        setShowPlacementQuiz(true);
      }
    } catch (err) {
      console.error('Quiz fetch error:', err);
    }
  };

  const submitPlacementQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/evaluate-placement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: placementAnswers })
      });
      const data = await res.json();
      if (data.success) {
        setPlacementResult(data);
        setCurrentLevel(data.assessedLevel);
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          preferredName,
          age: age ? parseInt(age, 10) : 20,
          profilePhoto: avatar,
          goals,
          currentLevel,
          confidenceLevel,
          explanationLanguage,
          dailyGoalMinutes,
          preferredPracticeTime
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to finalize profile.');
      }

      onCompleted(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 35px rgba(124, 58, 237, 0.2)'
      }}>
        {/* Step Progress Indicator */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyan-bright)' }}>
              Step {step} of 5
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {step === 1 && 'Basic Details'}
              {step === 2 && 'Learning Goals'}
              {step === 3 && 'English Level'}
              {step === 4 && 'Speaking Confidence'}
              {step === 5 && 'Preferences & Language'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  background: s <= step ? 'linear-gradient(90deg, #7C3AED, #22D3EE)' : 'transparent',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.15)', color: '#FDA4AF', borderRadius: '10px', marginBottom: '18px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* STEP 1: Basic Details */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Tell us about yourself</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
              We personalize your lessons, conversations, and AI teacher around your voice.
            </p>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Gowda"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">What would you like us to call you?</label>
              <input
                type="text"
                className="form-input"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="e.g. Ramesh"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Age (Years)</label>
              <input
                type="number"
                min="8"
                max="99"
                className="form-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 21"
                required
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Used safely for age-appropriate speaking partner matchmaking. Never shown to strangers.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Choose Your Learning Avatar</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: avatar === av ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                      border: avatar === av ? '2px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                      fontSize: '1.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: English Learning Goals */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Why do you want to learn English?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px' }}>
              Select all options that apply to you. We curate topic vocabulary accordingly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {GOAL_OPTIONS.map((g) => {
                const selected = goals.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGoal(g)}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: selected ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: selected ? '1px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                      color: selected ? '#FFF' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.92rem', fontWeight: selected ? 600 : 400 }}>{g}</span>
                    {selected && <Check size={16} color="#67E8F9" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Current English Level & Placement Quiz */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>What is your current English level?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px' }}>
              Be honest with yourself — our lessons adapt gently to wherever you are today.
            </p>

            {!showPlacementQuiz ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { id: 'Complete beginner', desc: 'I know the alphabet and simple words, but cannot form sentences.' },
                    { id: 'Beginner', desc: 'I understand basic phrases, but get stuck while speaking.' },
                    { id: 'Intermediate', desc: 'I speak reasonably well, but make grammar and tense mistakes.' },
                    { id: 'Advanced', desc: 'I speak comfortably and want polished vocabulary, debate skills, and fluency.' }
                  ].map((lvl) => {
                    const selected = currentLevel === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setCurrentLevel(lvl.id)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '14px',
                          background: selected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: selected ? '1.5px solid var(--cyan-accent)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: selected ? '#67E8F9' : '#FFF', marginBottom: '2px' }}>
                            {lvl.id}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {lvl.desc}
                          </div>
                        </div>
                        {selected && <Check size={20} color="#22D3EE" />}
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  padding: '16px',
                  background: 'rgba(124, 58, 237, 0.1)',
                  border: '1px dashed rgba(139, 92, 246, 0.4)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HelpCircle size={20} color="#A78BFA" />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Not sure of your level?</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Take a quick 1-minute 3-question placement check.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={startPlacementQuiz}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                  >
                    Check Level
                  </button>
                </div>
              </>
            ) : (
              <div style={{ background: 'rgba(7, 13, 24, 0.6)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#67E8F9' }}>Short Placement Assessment</h3>

                {placementQuestions.map((q) => (
                  <div key={q.id} style={{ marginBottom: '18px' }}>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '8px' }}>{q.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {q.options.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            background: placementAnswers[q.id] === oIdx ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.88rem'
                          }}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={placementAnswers[q.id] === oIdx}
                            onChange={() => setPlacementAnswers({ ...placementAnswers, [q.id]: oIdx })}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {placementResult && (
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', color: '#6EE7B7', marginBottom: '14px', fontSize: '0.9rem' }}>
                    🎉 <strong>{placementResult.recommendation}</strong> (Score: {placementResult.score}/{placementResult.total})
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  {!placementResult ? (
                    <button
                      type="button"
                      disabled={loading || Object.keys(placementAnswers).length < placementQuestions.length}
                      onClick={submitPlacementQuiz}
                      className="btn btn-cyan"
                      style={{ fontSize: '0.88rem' }}
                    >
                      {loading ? 'Evaluating...' : 'Submit Answers'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPlacementQuiz(false)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.88rem' }}
                    >
                      Use Recommended Level
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPlacementQuiz(false)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.88rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Speaking Confidence */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Do you feel comfortable speaking with strangers?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px' }}>
              Every learner here is supportive. There is zero embarrassment on LEARN WITH ARJEEVI.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CONFIDENCE_OPTIONS.map((c) => {
                const selected = confidenceLevel === c.title;
                return (
                  <div
                    key={c.title}
                    onClick={() => setConfidenceLevel(c.title)}
                    style={{
                      padding: '16px 18px',
                      borderRadius: '14px',
                      background: selected ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: selected ? '1.5px solid var(--violet-light)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: selected ? '#FFF' : 'var(--text-main)', marginBottom: '3px' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        {c.desc}
                      </div>
                    </div>
                    {selected && <Check size={20} color="#38BDF8" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Learning Preferences & Language */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Learning Preferences</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px' }}>
              Configure your daily commitment and regional language support.
            </p>

            <div className="form-group">
              <label className="form-label">Explanation Language</label>
              <select
                className="form-select"
                value={explanationLanguage}
                onChange={(e) => setExplanationLanguage(e.target.value)}
              >
                <option value="English + Kannada">English + Kannada (Recommended for Karnataka learners)</option>
                <option value="English Only">English Only (Full Immersion)</option>
                <option value="Kannada">Kannada Primary with English Focus</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Daily Spoken Practice Goal</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '10px',
                      background: dailyGoalMinutes === mins ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: dailyGoalMinutes === mins ? '1px solid var(--cyan-accent)' : '1px solid var(--border-subtle)',
                      color: dailyGoalMinutes === mins ? '#67E8F9' : '#FFF',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Practice Time</label>
              <select
                className="form-select"
                value={preferredPracticeTime}
                onChange={(e) => setPreferredPracticeTime(e.target.value)}
              >
                <option value="Morning (7 AM - 10 AM)">Morning (7 AM - 10 AM)</option>
                <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
                <option value="Evening (6 PM - 9 PM)">Evening (6 PM - 9 PM)</option>
                <option value="Night (9 PM - 11 PM)">Night (9 PM - 11 PM)</option>
              </select>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn btn-outline"
              style={{ fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !preferredName.trim()) {
                  setError('Please enter your preferred name.');
                  return;
                }
                setError(null);
                setStep(step + 1);
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.95rem' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="btn btn-cyan"
              style={{ fontSize: '1rem', padding: '12px 24px' }}
            >
              {loading ? 'Setting Up Dashboard...' : 'Enter Main Dashboard'}
              {!loading && <Sparkles size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
