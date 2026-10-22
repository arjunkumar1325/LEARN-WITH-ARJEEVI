const db = require('../db/database');

const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
const CONSISTENCY_BONUS_DAYS = 14;

const TrialService = {
  // Get or initialize trial status strictly on the server
  getOrInitTrial(userId) {
    let trial = db.getTrial(userId);
    const now = new Date();

    if (!trial) {
      // First activation of AI Teacher
      const startDate = now;
      const endDate = new Date(startDate.getTime() + TRIAL_DURATION_MS);

      trial = {
        userId,
        trialStartDate: startDate.toISOString(),
        trialEndDate: endDate.toISOString(),
        isTrialActive: true,
        consistencyBonusDays: 0,
        bonusHistory: []
      };
      db.saveTrial(trial);

      db.logSecurityEvent({
        eventType: 'TRIAL_ACTIVATED',
        severity: 'INFO',
        userId,
        details: `7-Day AI Teacher trial initiated. Expires: ${endDate.toISOString()}`
      });
    }

    // Server-side non-tamperable calculation
    const endTimestamp = new Date(trial.trialEndDate).getTime();
    const currentTimestamp = now.getTime();
    const msRemaining = Math.max(0, endTimestamp - currentTimestamp);
    const isExpired = currentTimestamp >= endTimestamp;

    // Check if user has an active paid subscription
    const activeSub = db.getSubscription(userId);
    const hasActiveSubscription = !!(activeSub && new Date(activeSub.expiryDate).getTime() > currentTimestamp);

    const daysRemaining = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
    const hoursRemaining = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutesRemaining = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));

    return {
      userId,
      trialStartDate: trial.trialStartDate,
      trialEndDate: trial.trialEndDate,
      isTrialActive: !isExpired,
      isExpired,
      hasActiveSubscription,
      hasFullAccess: !isExpired || hasActiveSubscription,
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
      msRemaining,
      consistencyBonusDays: trial.consistencyBonusDays || 0,
      bonusHistory: trial.bonusHistory || []
    };
  },

  // Consistency Streak Reward Engine
  // Calculates top 3 learners with highest genuine streaks and awards +14 bonus days
  evaluateAndAwardConsistencyBonuses() {
    const data = db.read();
    const eligibleLearners = (data.users || [])
      .filter(u => u.role === 'learner' && (u.streak || 0) >= 3 && u.onboardingCompleted)
      .sort((a, b) => {
        // Tie-breaker: higher streak first, then higher lessons completed count, then earlier account creation
        if ((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0);
        const bLessons = (b.lessonsCompleted || []).length;
        const aLessons = (a.lessonsCompleted || []).length;
        if (bLessons !== aLessons) return bLessons - aLessons;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    const top3 = eligibleLearners.slice(0, 3);
    const awardedList = [];

    for (const learner of top3) {
      let trial = db.getTrial(learner.id);
      if (!trial) {
        trial = this.getOrInitTrial(learner.id);
      }

      // Check if already awarded for the current period
      const currentPeriodKey = new Date().toISOString().substring(0, 7); // e.g., "2026-10"
      const alreadyAwarded = (trial.bonusHistory || []).some(b => b.period === currentPeriodKey);

      if (!alreadyAwarded) {
        const currentEnd = new Date(trial.trialEndDate).getTime();
        const newEnd = new Date(currentEnd + CONSISTENCY_BONUS_DAYS * 24 * 60 * 60 * 1000);

        trial.trialEndDate = newEnd.toISOString();
        trial.consistencyBonusDays = (trial.consistencyBonusDays || 0) + CONSISTENCY_BONUS_DAYS;
        trial.bonusHistory = trial.bonusHistory || [];
        trial.bonusHistory.push({
          period: currentPeriodKey,
          daysAdded: CONSISTENCY_BONUS_DAYS,
          reason: `Top 3 Learning Streak Rank with ${learner.streak} active streak days!`,
          awardedAt: new Date().toISOString()
        });
        db.saveTrial(trial);

        db.logSecurityEvent({
          eventType: 'CONSISTENCY_REWARD_AWARDED',
          severity: 'INFO',
          userId: learner.id,
          details: `Awarded 14-day trial extension to ${learner.name} for consistent learning (Streak: ${learner.streak}).`
        });

        awardedList.push({
          userId: learner.id,
          name: learner.name,
          streak: learner.streak,
          newTrialEndDate: newEnd.toISOString()
        });
      }
    }

    return {
      success: true,
      rewardPeriod: new Date().toISOString().substring(0, 7),
      awardedLearners: awardedList,
      leaderboard: top3.map(l => ({ id: l.id, name: l.name, streak: l.streak, level: l.currentLevel }))
    };
  }
};

module.exports = TrialService;
