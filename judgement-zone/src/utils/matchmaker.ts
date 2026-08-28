import {
  ArtistTrack,
  JudgeReview,
  JudgeTier,
  ScoreBreakdown,
  SonicTasteProfile,
  TierConfig,
  TrackGenre,
  UserJudgeProfile
} from '../types';

export const JUDGE_TIERS: Record<JudgeTier, TierConfig> = {
  'Apprentice Ear': {
    tier: 'Apprentice Ear',
    level: 1,
    minXp: 0,
    multiplier: 1.0,
    title: 'Tier I: Apprentice Ear',
    badgeColor: 'from-zinc-500 to-zinc-600 border-zinc-400 text-zinc-200',
    iconName: 'Ear',
    perks: ['Access to Blind Judging Chambers', '3 Skips per 24h cycle', 'Save up to 50 tracks to Vault']
  },
  'Cadet Critic': {
    tier: 'Cadet Critic',
    level: 2,
    minXp: 250,
    multiplier: 1.15,
    title: 'Tier II: Cadet Critic',
    badgeColor: 'from-emerald-600 to-teal-700 border-emerald-400 text-emerald-100',
    iconName: 'ShieldCheck',
    perks: ['1.15x XP Multiplier on all reviews', 'Unlock Lyricist Highlight Filter', 'Priority chamber matchmaking']
  },
  'Verified Auditor': {
    tier: 'Verified Auditor',
    level: 3,
    minXp: 750,
    multiplier: 1.3,
    title: 'Tier III: Verified Auditor',
    badgeColor: 'from-cyan-600 to-blue-700 border-cyan-400 text-cyan-100',
    iconName: 'Award',
    perks: ['1.30x XP Multiplier', 'Weight +15% on consensus scoring', 'Early access to newly queued unmastered stems']
  },
  'Master Tastemaker': {
    tier: 'Master Tastemaker',
    level: 4,
    minXp: 1600,
    multiplier: 1.5,
    title: 'Tier IV: Master Tastemaker',
    badgeColor: 'from-purple-600 to-indigo-700 border-purple-400 text-purple-100',
    iconName: 'Sparkles',
    perks: ['1.50x XP Multiplier', 'Master Auditor badge displayed in artist dossiers', 'Access to exclusive master feedback tools']
  },
  'Grand Arbiter': {
    tier: 'Grand Arbiter',
    level: 5,
    minXp: 3000,
    multiplier: 2.0,
    title: 'Tier V: Grand Arbiter of the Zone',
    badgeColor: 'from-amber-500 to-yellow-600 border-amber-300 text-amber-950 font-bold',
    iconName: 'Crown',
    perks: ['2.0x XP Multiplier', 'Golden Gavel badge on artist reports', 'Unanimous Tiebreaker Authority', 'Direct artist endorsement privileges']
  }
};

// Calculate Judge Level and Tier from total XP
export function calculateTierFromXp(xp: number): { tier: JudgeTier; level: number; nextTier?: TierConfig; progressPercent: number } {
  const tiers = Object.values(JUDGE_TIERS).sort((a, b) => a.minXp - b.minXp);
  let currentTier = tiers[0];
  let nextTier: TierConfig | undefined = tiers[1];

  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].minXp) {
      currentTier = tiers[i];
      nextTier = tiers[i + 1];
    }
  }

  let progressPercent = 100;
  if (nextTier) {
    const currentBase = currentTier.minXp;
    const targetBase = nextTier.minXp;
    progressPercent = Math.min(100, Math.max(0, Math.round(((xp - currentBase) / (targetBase - currentBase)) * 100)));
  }

  return {
    tier: currentTier.tier,
    level: currentTier.level,
    nextTier,
    progressPercent
  };
}

// Calculate Sonic Match Drift Score (0 - 100%)
export function calculateSonicDrift(taste: SonicTasteProfile, track: ArtistTrack): number {
  let score = 50; // base compatibility

  // 1. Genre alignment (+30%)
  if (taste.preferredGenres.includes(track.genre)) {
    score += 30;
  } else {
    score -= 10;
  }

  // 2. Mood alignment (+15%)
  if (taste.preferredMoods.some(m => track.mood.toLowerCase().includes(m.toLowerCase()))) {
    score += 15;
  }

  // 3. Tempo alignment (+10%)
  if (track.bpm) {
    if (taste.tempoPreference === 'all') score += 5;
    else if (taste.tempoPreference === 'slow' && track.bpm < 95) score += 10;
    else if (taste.tempoPreference === 'mid' && track.bpm >= 95 && track.bpm <= 130) score += 10;
    else if (taste.tempoPreference === 'fast' && track.bpm > 130) score += 10;
  }

  return Math.min(99, Math.max(25, score));
}

// Calculate Review XP & Judge Score Earned
export function calculateReviewReward(params: {
  listenPercentage: number;
  writtenFeedback: string;
  userTier: JudgeTier;
}): { xp: number; depthMultiplier: number; listenMultiplier: number; breakdown: string } {
  const tierConfig = JUDGE_TIERS[params.userTier];
  const baseXP = 50;

  // Listen completion factor
  let listenMultiplier = 1.0;
  if (params.listenPercentage >= 0.99) {
    listenMultiplier = 1.6; // 100% full song listen bonus
  } else if (params.listenPercentage >= 0.75) {
    listenMultiplier = 1.25;
  } else {
    listenMultiplier = 1.0; // At least 50%
  }

  // Written feedback depth analysis (encourages rich, constructive critiques)
  const charCount = params.writtenFeedback.trim().length;
  let depthMultiplier = 1.0;
  if (charCount > 250) {
    depthMultiplier = 1.75; // In-depth detailed critique
  } else if (charCount > 120) {
    depthMultiplier = 1.4;
  } else if (charCount > 50) {
    depthMultiplier = 1.15;
  }

  const finalXP = Math.round(baseXP * listenMultiplier * depthMultiplier * tierConfig.multiplier);

  return {
    xp: finalXP,
    depthMultiplier,
    listenMultiplier,
    breakdown: `Base ${baseXP} XP × ${listenMultiplier}x Listen × ${depthMultiplier}x Depth × ${tierConfig.multiplier}x ${params.userTier}`
  };
}

// Recompute Aggregated Scores for a Track
export function recalculateTrackScores(reviews: JudgeReview[]): ArtistTrack['aggregatedScores'] {
  if (reviews.length === 0) {
    return {
      overall: 0,
      lyrics: 0,
      vocals: 0,
      instrumentation: 0,
      vibe: 0,
      totalReviews: 0,
      fullListenRate: 0
    };
  }

  let sumLyrics = 0;
  let sumVocals = 0;
  let sumInst = 0;
  let sumVibe = 0;
  let sumOverall = 0;
  let fullListenCount = 0;

  reviews.forEach(r => {
    sumLyrics += r.scores.lyrics;
    sumVocals += r.scores.vocals;
    sumInst += r.scores.instrumentation;
    sumVibe += r.scores.vibe;
    sumOverall += r.overallScore;
    if (r.completedFullListen) fullListenCount++;
  });

  const count = reviews.length;
  return {
    overall: parseFloat((sumOverall / count).toFixed(1)),
    lyrics: parseFloat((sumLyrics / count).toFixed(1)),
    vocals: parseFloat((sumVocals / count).toFixed(1)),
    instrumentation: parseFloat((sumInst / count).toFixed(1)),
    vibe: parseFloat((sumVibe / count).toFixed(1)),
    totalReviews: count,
    fullListenRate: Math.round((fullListenCount / count) * 100)
  };
}

// 24h Quota & Skips calculation
export function checkAndRefreshDailyCycle(profile: UserJudgeProfile): UserJudgeProfile {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (!profile.lastCycleTimestamp || now - profile.lastCycleTimestamp >= TWENTY_FOUR_HOURS) {
    return {
      ...profile,
      dailyAuditsRemaining: profile.dailyAuditsMax || 20,
      skipsRemaining: 3,
      lastCycleTimestamp: now
    };
  }
  return profile;
}

export function getTimeUntilReset(lastCycleTimestamp: number): { hours: number; minutes: number; seconds: number; formatted: string } {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const nextReset = (lastCycleTimestamp || Date.now()) + TWENTY_FOUR_HOURS;
  const diff = Math.max(0, nextReset - Date.now());

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return { hours, minutes, seconds, formatted };
}
