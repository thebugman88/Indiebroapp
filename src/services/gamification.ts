import confetti from 'canvas-confetti';
import { soundFx } from './audioEffects';

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  color: string;
  perks: string[];
}

export const LEVEL_TIERS: LevelInfo[] = [
  {
    level: 1,
    title: 'Novice Beatmaker',
    minXp: 0,
    maxXp: 500,
    color: 'from-zinc-400 to-zinc-600',
    perks: ['Access to all 10 core studio modules', 'Basic metadata exports', 'Community hub access']
  },
  {
    level: 2,
    title: 'Studio Apprentice',
    minXp: 500,
    maxXp: 1200,
    color: 'from-emerald-400 to-teal-600',
    perks: ['Bronze reviewer status in Judgement Zone', 'Multi-rhyme cadence scoring', '+5% daily XP boost']
  },
  {
    level: 3,
    title: 'Underground Specialist',
    minXp: 1200,
    maxXp: 2200,
    color: 'from-cyan-400 to-blue-600',
    perks: ['Unlock rap battle arena host mode in Hang Out', 'Advanced OCR parsing', 'Custom profile flair']
  },
  {
    level: 4,
    title: 'Studio Pioneer',
    minXp: 2200,
    maxXp: 3500,
    color: 'from-amber-400 to-orange-600',
    perks: ['Gold juror badge in Judgement Zone', 'Full stems analysis audit in Hit Analyzer', 'Pipeline automation']
  },
  {
    level: 5,
    title: 'Master Arranger',
    minXp: 3500,
    maxXp: 5200,
    color: 'from-purple-400 to-pink-600',
    perks: ['Dual-direction AI lyric model acceleration', 'Priority PRO statement batch processing', '+10% XP boost']
  },
  {
    level: 6,
    title: 'Executive Producer',
    minXp: 5200,
    maxXp: 7500,
    color: 'from-rose-400 to-red-600',
    perks: ['Parliamentary chair role in Meeting Room', 'Master ISRC verification suite', 'Platinum badges']
  },
  {
    level: 7,
    title: 'Label Mogul',
    minXp: 7500,
    maxXp: 10500,
    color: 'from-indigo-400 to-violet-600',
    perks: ['Unlimited bulk catalogue sync', 'Custom AI battle bot profiles', 'Executive suite themes']
  },
  {
    level: 8,
    title: 'Sonic Architect',
    minXp: 10500,
    maxXp: 14500,
    color: 'from-fuchsia-400 to-purple-600',
    perks: ['VIP Cypher chamber host', 'Deep ERA Synthesis Matrix breakdown', '+15% XP boost']
  },
  {
    level: 9,
    title: 'Platinum Visionary',
    minXp: 14500,
    maxXp: 20000,
    color: 'from-amber-300 via-yellow-400 to-orange-500',
    perks: ['Exclusive Diamond producer badge', 'Custom audio stem normalizer presets', 'Priority AI generation']
  },
  {
    level: 10,
    title: 'indiebrotherhood Icon',
    minXp: 20000,
    maxXp: 30000,
    color: 'from-amber-400 via-rose-500 to-purple-600',
    perks: ['Master of the 10-Tool Ecosystem', 'Honorary Lifetime Fellow', 'Max Level Custom Crown']
  }
];

export type BadgeTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Badge {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tier: BadgeTier;
  category: 'Creation' | 'Intelligence' | 'Operations' | 'Community' | 'Mastery';
  icon: string; // Icon identifier
  xpReward: number;
  unlockedAt: number | null; // Timestamp or null
  progress: number; // 0 to max
  maxProgress: number;
  progressLabel: string;
}

export interface XpActivity {
  id: string;
  title: string;
  amount: number;
  sourceApp: string;
  timestamp: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  targetApp: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed: boolean;
}

export interface UserProfileState {
  displayName: string;
  artistHandle: string;
  avatarType: 'initials' | 'preset' | 'url';
  avatarSeed: string; // Emoji or Initials
  avatarUrl?: string; // Optional custom avatar image URL
  avatarBg: string;
  subscriptionTier: 'free' | 'pro';
  subscriptionExpiresAt: number | null; // Timestamp or null
  stripeCustomerId?: string | null;
  totalXp: number;
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  badges: Badge[];
  activities: XpActivity[];
  dailyQuests: DailyQuest[];
  lastQuestDate: string; // YYYY-MM-DD
  pipelineCompletedToday: boolean;
}

export function getInitials(name: string): string {
  if (!name || !name.trim()) return 'IC';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STORAGE_KEY = 'ib_gamification_profile_v2';

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'lyricist-supreme',
    name: 'Lyricist Supreme',
    tagline: 'Dual-Set AI & Flow Master',
    description: 'Generate over 10 dual-set lyric concepts or cadence matrices in Lyric Pro Studio.',
    tier: 'Gold',
    category: 'Creation',
    icon: 'PenTool',
    xpReward: 250,
    unlockedAt: null,
    progress: 0,
    maxProgress: 10,
    progressLabel: 'Lyric Sets Created'
  },
  {
    id: 'audit-master',
    name: 'Audit Master',
    tagline: 'PRO & ISRC Extractions',
    description: 'Process 5+ split sheets, cue sheets, or ISRC extractions in RoyaltyOps.',
    tier: 'Platinum',
    category: 'Operations',
    icon: 'Database',
    xpReward: 350,
    unlockedAt: null,
    progress: 0,
    maxProgress: 5,
    progressLabel: 'Documents Processed'
  },
  {
    id: 'hitmaker',
    name: 'Hitmaker',
    tagline: 'Algorithmic Hit Calibrator',
    description: 'Audit 5 tracks through Hit Analyzer with 2026 streaming velocity checks.',
    tier: 'Gold',
    category: 'Intelligence',
    icon: 'Flame',
    xpReward: 300,
    unlockedAt: null,
    progress: 0,
    maxProgress: 5,
    progressLabel: 'Tracks Analyzed'
  },
  {
    id: 'battle-tested',
    name: 'Battle Tested',
    tagline: 'Arena Cypher Champion',
    description: 'Participate in or win 3 rap battles or cyphers in Hang Out.',
    tier: 'Silver',
    category: 'Community',
    icon: 'Radio',
    xpReward: 200,
    unlockedAt: null,
    progress: 0,
    maxProgress: 3,
    progressLabel: 'Battles Completed'
  },
  {
    id: 'pipeline-perfect',
    name: 'Pipeline Perfect',
    tagline: 'End-to-End Suite Workflow',
    description: 'Complete a full 4-step production workflow connecting multiple studio tools.',
    tier: 'Platinum',
    category: 'Mastery',
    icon: 'Sparkles',
    xpReward: 500,
    unlockedAt: null,
    progress: 0,
    maxProgress: 2,
    progressLabel: 'Pipelines Completed'
  },
  {
    id: 'juror-supreme',
    name: 'Consensus Juror',
    tagline: '10-Judge Blind Reviewer',
    description: 'Submit 5 anonymous consensus peer-reviews in Judgement Zone.',
    tier: 'Silver',
    category: 'Intelligence',
    icon: 'Gavel',
    xpReward: 200,
    unlockedAt: null,
    progress: 0,
    maxProgress: 5,
    progressLabel: 'Reviews Submitted'
  },
  {
    id: 'sonic-genius',
    name: 'Sonic Genius',
    tagline: 'Lyrical Memory Champion',
    description: 'Score a perfect round in Sonic IQ Lab Finish-the-Song or Trivia.',
    tier: 'Bronze',
    category: 'Creation',
    icon: 'Brain',
    xpReward: 150,
    unlockedAt: null,
    progress: 0,
    maxProgress: 3,
    progressLabel: 'Trivia Rounds'
  },
  {
    id: 'parliamentarian',
    name: 'Parliamentarian',
    tagline: 'Democratic Floor Leader',
    description: 'Conduct a voting roll call or pass a formal motion in Meeting Room.',
    tier: 'Bronze',
    category: 'Operations',
    icon: 'Users',
    xpReward: 150,
    unlockedAt: null,
    progress: 0,
    maxProgress: 2,
    progressLabel: 'Motions Passed'
  },
  {
    id: 'cadence-maestro',
    name: 'Cadence Maestro',
    tagline: 'ERA Synthesis Analyst',
    description: 'Run deep semantic and phonological matrix scans in Semantic Lab.',
    tier: 'Silver',
    category: 'Intelligence',
    icon: 'Dna',
    xpReward: 200,
    unlockedAt: null,
    progress: 0,
    maxProgress: 4,
    progressLabel: 'Scans Performed'
  },
  {
    id: 'streak-champion',
    name: 'Streak Champion',
    tagline: '7-Day Studio Dedication',
    description: 'Maintain an active login and creative streak for 7 consecutive days.',
    tier: 'Gold',
    category: 'Mastery',
    icon: 'Zap',
    xpReward: 300,
    unlockedAt: null,
    progress: 1,
    maxProgress: 7,
    progressLabel: 'Consecutive Days'
  }
];

export const QUEST_POOL: Omit<DailyQuest, 'id' | 'progress' | 'completed' | 'claimed'>[] = [
  {
    title: 'Scan 1 Track in Hit Analyzer',
    description: 'Run an audio demo or lyrics through 2026 streaming algorithm audit.',
    targetApp: 'hit-analyzer',
    xpReward: 75,
    maxProgress: 1
  },
  {
    title: 'Craft Lyrics in Lyric Pro Studio',
    description: 'Generate a dual-set lyric direction with custom flow cadence.',
    targetApp: 'lyric-pro',
    xpReward: 60,
    maxProgress: 1
  },
  {
    title: 'Play 1 Round of Sonic IQ Trivia',
    description: 'Test your musical ear and lyric memory in the Quiz Studio.',
    targetApp: 'sonic-iq',
    xpReward: 50,
    maxProgress: 1
  },
  {
    title: 'Run Quick Tools Pitch or BPM Finder',
    description: 'Tap tempo or detect the musical key for your track production.',
    targetApp: 'quick-tools',
    xpReward: 40,
    maxProgress: 1
  },
  {
    title: 'Extract ISRC or Splits in RoyaltyOps',
    description: 'Parse a document, cue sheet, or split agreement.',
    targetApp: 'royaltyops',
    xpReward: 80,
    maxProgress: 1
  },
  {
    title: 'Participate in Hang Out Cypher',
    description: 'Step into the live room or drop battle bars with an MC.',
    targetApp: 'hang-out',
    xpReward: 90,
    maxProgress: 1
  },
  {
    title: 'Review a Track in Judgement Zone',
    description: 'Provide an un-biased 10-point peer rating on a community submission.',
    targetApp: 'judgement-zone',
    xpReward: 70,
    maxProgress: 1
  },
  {
    title: 'Catalog Song in Artist Assistant',
    description: 'Save or update track release metadata and marketing notes.',
    targetApp: 'artist-assistant',
    xpReward: 60,
    maxProgress: 1
  }
];

export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function generateDailyQuests(dateStr: string): DailyQuest[] {
  // Deterministic rotation based on day
  const dayNum = new Date(dateStr).getDate() || 1;
  const quests: DailyQuest[] = [];

  for (let i = 0; i < 3; i++) {
    const templateIdx = (dayNum + i * 2) % QUEST_POOL.length;
    const template = QUEST_POOL[templateIdx];
    quests.push({
      id: `quest-${dateStr}-${i}`,
      title: template.title,
      description: template.description,
      targetApp: template.targetApp,
      xpReward: template.xpReward,
      progress: 0,
      maxProgress: template.maxProgress,
      completed: false,
      claimed: false
    });
  }

  return quests;
}

export function getLevelDetails(totalXp: number): {
  currentTier: LevelInfo;
  nextTier: LevelInfo | null;
  progressPct: number;
  xpInLevel: number;
  xpRequiredForLevel: number;
} {
  let currentTier = LEVEL_TIERS[0];
  let nextTier: LevelInfo | null = LEVEL_TIERS[1] || null;

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
      nextTier = LEVEL_TIERS[i + 1] || null;
      break;
    }
  }

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPct: 100,
      xpInLevel: totalXp - currentTier.minXp,
      xpRequiredForLevel: currentTier.maxXp - currentTier.minXp
    };
  }

  const xpInLevel = totalXp - currentTier.minXp;
  const xpRequiredForLevel = currentTier.maxXp - currentTier.minXp;
  const progressPct = Math.min(100, Math.max(0, Math.round((xpInLevel / xpRequiredForLevel) * 100)));

  return {
    currentTier,
    nextTier,
    progressPct,
    xpInLevel,
    xpRequiredForLevel
  };
}

export function getInitialState(): UserProfileState {
  const today = getTodayString();
  const defaultDisplayName = 'Independent Creator';
  return {
    displayName: defaultDisplayName,
    artistHandle: '@creator',
    avatarType: 'initials',
    avatarSeed: getInitials(defaultDisplayName),
    avatarUrl: '',
    avatarBg: 'from-amber-500 to-orange-600',
    subscriptionTier: 'free',
    subscriptionExpiresAt: null,
    stripeCustomerId: null,
    totalXp: 0,
    currentStreak: 1,
    lastActiveDate: today,
    badges: INITIAL_BADGES.map((b) => ({
      ...b,
      progress: 0,
      unlockedAt: null
    })),
    activities: [],
    dailyQuests: generateDailyQuests(today),
    lastQuestDate: today,
    pipelineCompletedToday: false
  };
}

export function loadProfileState(): UserProfileState {
  if (typeof window === 'undefined') return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialState();
      saveProfileState(init);
      return init;
    }
    const parsed = JSON.parse(raw) as UserProfileState;
    const today = getTodayString();

    // Default migration fields for real user state
    if (!parsed.displayName) parsed.displayName = 'Independent Creator';
    if (!parsed.artistHandle) parsed.artistHandle = '@creator';
    if (!parsed.avatarType) parsed.avatarType = 'initials';
    if (!parsed.avatarSeed) parsed.avatarSeed = getInitials(parsed.displayName);
    if (!parsed.avatarBg) parsed.avatarBg = 'from-amber-500 to-orange-600';
    if (!parsed.subscriptionTier) parsed.subscriptionTier = 'free';
    if (!parsed.activities) parsed.activities = [];

    // Check streak
    if (parsed.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (parsed.lastActiveDate === yesterday) {
        parsed.currentStreak = (parsed.currentStreak || 0) + 1;
      } else {
        parsed.currentStreak = 1;
      }
      parsed.lastActiveDate = today;
    }

    // Check daily quests refresh
    if (parsed.lastQuestDate !== today || !parsed.dailyQuests || parsed.dailyQuests.length === 0) {
      parsed.dailyQuests = generateDailyQuests(today);
      parsed.lastQuestDate = today;
      parsed.pipelineCompletedToday = false;
    }

    // Ensure all badges exist
    if (!parsed.badges || parsed.badges.length < INITIAL_BADGES.length) {
      const existingIds = new Set((parsed.badges || []).map((b) => b.id));
      const missing = INITIAL_BADGES.filter((b) => !existingIds.has(b.id));
      parsed.badges = [...(parsed.badges || []), ...missing];
    }

    return parsed;
  } catch (err) {
    console.error('Error loading gamification profile:', err);
    return getInitialState();
  }
}

export function saveProfileState(state: UserProfileState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Dispatch global event for cross-component synchrony
    window.dispatchEvent(new CustomEvent('ib_profile_updated', { detail: state }));
  } catch (err) {
    console.error('Error saving profile state:', err);
  }
}

export function activateProSubscription(expiresAt?: number, customerId?: string): UserProfileState {
  const current = loadProfileState();
  current.subscriptionTier = 'pro';
  current.subscriptionExpiresAt = expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000;
  if (customerId) current.stripeCustomerId = customerId;
  saveProfileState(current);
  return current;
}

export function cancelProSubscription(): UserProfileState {
  const current = loadProfileState();
  current.subscriptionTier = 'free';
  current.subscriptionExpiresAt = null;
  saveProfileState(current);
  return current;
}

// Global XP and Achievement Granting Core
export interface GrantXpOptions {
  amount: number;
  actionTitle: string;
  sourceApp: string;
  badgeId?: string; // Optional badge progress target
  badgeIncrement?: number;
}

export interface GrantXpResult {
  newTotalXp: number;
  xpGranted: number;
  streakBonus: number;
  proBonus: number;
  leveledUp: boolean;
  newLevel?: LevelInfo;
  unlockedBadge?: Badge;
  completedQuest?: DailyQuest;
}

export function grantUserXP(options: GrantXpOptions): GrantXpResult {
  const current = loadProfileState();
  const oldLevelDetails = getLevelDetails(current.totalXp);

  // Pro Multiplier (2.5x)
  const isPro = current.subscriptionTier === 'pro';
  const proMultiplier = isPro ? 2.5 : 1.0;
  const baseMultiplied = Math.round(options.amount * proMultiplier);
  const proBonus = isPro ? baseMultiplied - options.amount : 0;

  // Calculate streak bonus multiplier (e.g. 7+ day streak = +15% bonus, 3+ day = +10%)
  const streakBonusPct = current.currentStreak >= 7 ? 0.15 : current.currentStreak >= 3 ? 0.1 : 0;
  const streakBonus = Math.round(baseMultiplied * streakBonusPct);
  const totalAward = baseMultiplied + streakBonus;

  current.totalXp += totalAward;

  // Add activity log
  const bonusTags = [
    isPro ? '⚡ 2.5x Pro' : '',
    streakBonus > 0 ? `🔥 +${streakBonus} Streak` : ''
  ].filter(Boolean).join(' | ');

  const newActivity: XpActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: options.actionTitle + (bonusTags ? ` (${bonusTags})` : ''),
    amount: totalAward,
    sourceApp: options.sourceApp,
    timestamp: Date.now()
  };

  current.activities = [newActivity, ...(current.activities || []).slice(0, 49)];

  // Update badge progress if targeted
  let unlockedBadge: Badge | undefined;
  if (options.badgeId) {
    const badgeIdx = current.badges.findIndex((b) => b.id === options.badgeId);
    if (badgeIdx !== -1) {
      const b = current.badges[badgeIdx];
      const inc = options.badgeIncrement || 1;
      const newProg = Math.min(b.maxProgress, b.progress + inc);
      b.progress = newProg;
      if (b.progress >= b.maxProgress && !b.unlockedAt) {
        b.unlockedAt = Date.now();
        unlockedBadge = { ...b };
        // Grant bonus XP for badge unlock
        current.totalXp += b.xpReward;
        current.activities.unshift({
          id: `badge-act-${Date.now()}`,
          title: `🏆 Badge Unlocked: ${b.name}`,
          amount: b.xpReward,
          sourceApp: 'Trophy Room',
          timestamp: Date.now()
        });
      }
    }
  }

  // Check Daily Quests matching sourceApp
  let completedQuest: DailyQuest | undefined;
  const questAppMap: Record<string, string> = {
    'Hit Analyzer': 'hit-analyzer',
    'Lyric Pro': 'lyric-pro',
    'Sonic IQ': 'sonic-iq',
    'Quick Tools': 'quick-tools',
    'RoyaltyOps': 'royaltyops',
    'Hang Out': 'hang-out',
    'Judgement Zone': 'judgement-zone',
    'Artist Assistant': 'artist-assistant',
    'Meeting Room': 'meeting-room',
    'Semantic Lab': 'semantic-lab'
  };

  const appKey = questAppMap[options.sourceApp] || options.sourceApp.toLowerCase();
  current.dailyQuests.forEach((q) => {
    if (q.targetApp === appKey && !q.completed) {
      q.progress = Math.min(q.maxProgress, q.progress + 1);
      if (q.progress >= q.maxProgress) {
        q.completed = true;
        completedQuest = { ...q };
      }
    }
  });

  const newLevelDetails = getLevelDetails(current.totalXp);
  const leveledUp = newLevelDetails.currentTier.level > oldLevelDetails.currentTier.level;

  saveProfileState(current);

  // Play audio effects & confetti
  if (leveledUp) {
    soundFx.playLevelUp();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  } else if (unlockedBadge) {
    soundFx.playAchievementUnlock();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }
  } else {
    soundFx.playXpGain();
  }

  const result: GrantXpResult = {
    newTotalXp: current.totalXp,
    xpGranted: totalAward,
    streakBonus,
    proBonus,
    leveledUp,
    newLevel: leveledUp ? newLevelDetails.currentTier : undefined,
    unlockedBadge,
    completedQuest
  };

  // Dispatch toast event
  window.dispatchEvent(
    new CustomEvent('ib_xp_granted_toast', {
      detail: {
        actionTitle: options.actionTitle,
        amount: totalAward,
        sourceApp: options.sourceApp,
        leveledUp,
        newLevel: result.newLevel,
        unlockedBadge,
        completedQuest
      }
    })
  );

  return result;
}

// Preset avatars for custom selection
export const AVATAR_OPTIONS = [
  { emoji: '🎧', name: 'Studio Head' },
  { emoji: '🎤', name: 'Lead MC' },
  { emoji: '🎹', name: 'Keys Maestro' },
  { emoji: '⚡', name: 'Beat Voltage' },
  { emoji: '🔥', name: 'Fire Producer' },
  { emoji: '👑', name: 'Label Exec' },
  { emoji: '💎', name: 'Diamond Artist' },
  { emoji: '🚀', name: 'Sonic Pioneer' },
  { emoji: '🌌', name: 'Acoustic Mystic' },
  { emoji: '🦉', name: 'Sound Master' }
];

export const AVATAR_BG_OPTIONS = [
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-zinc-700 to-zinc-900'
];
