export type JudgeTier =
  | 'Apprentice Ear'
  | 'Cadet Critic'
  | 'Verified Auditor'
  | 'Master Tastemaker'
  | 'Grand Arbiter';

export type TrackGenre =
  | 'Hip-Hop / BoomBap'
  | 'Trap / Drill'
  | 'R&B / Neo-Soul'
  | 'Indie Rock / Alt'
  | 'Synthwave / Retro'
  | 'Afrobeats / Dancehall'
  | 'Pop / Electronic'
  | 'Lo-Fi / Chillhop'
  | 'Punk / Grunge'
  | 'Experimental / Ambient';

export type TrackVerdict =
  | 'Certified Heat'
  | 'Solid Track'
  | 'Needs Polish'
  | 'Rethink/Rework';

export type MusicCreationType = 'human-created' | 'ai-assisted';
export type TrackFlagReason = 'bad-quality' | 'wrong-ai-room';

export interface ScoreBreakdown {
  lyrics: number;          // 1-10
  vocals: number;          // 1-10
  instrumentation: number; // 1-10
  vibe: number;            // 1-10
}

export interface JudgeReview {
  id: string;
  trackId: string;
  judgeId: string;
  judgeTier: JudgeTier;
  judgeRankLevel: number; // 1 to 5
  scores: ScoreBreakdown;
  overallScore: number;   // Calculated out of 10.0
  writtenFeedback: string;
  listenPercentage: number; // e.g. 52% or 100%
  completedFullListen: boolean;
  verdict: TrackVerdict;
  xpEarned: number;
  createdAt: string;
  driftMatchScore: number; // Percentage match to taste
}

export interface ArtistTrack {
  ownerId?: string;
  id: string;
  title: string;
  artistName: string;
  genre: TrackGenre;
  subGenre?: string;
  mood: string;
  bpm?: number;
  keySignature?: string;
  durationSeconds: number;
  lyricsText: string;
  coverArt: string;
  audioBlobUrl?: string;
  synthPreset?: string;
  uploadedAt: string;
  isUserSubmission: boolean;
  ownershipConfirmed: boolean;
  rightsHolderSignature: string;
  creationType: MusicCreationType;
  status: 'evaluating' | 'completed' | 'returned';
  flagCounts: Record<TrackFlagReason, number>;
  returnedReason?: TrackFlagReason;
  returnedAt?: string;
  targetJudges: number; // 10
  reviews: JudgeReview[];
  aggregatedScores: {
    overall: number;
    lyrics: number;
    vocals: number;
    instrumentation: number;
    vibe: number;
    totalReviews: number;
    fullListenRate: number;
  };
}

export interface SonicTasteProfile {
  preferredGenres: TrackGenre[];
  preferredMoods: string[];
  productionFocus: ('lyrics' | 'vocals' | 'beat_production' | 'mix_master')[];
  tempoPreference: 'slow' | 'mid' | 'fast' | 'all';
}

export interface UserJudgeProfile {
  id: string;
  name: string;
  judgeTier: JudgeTier;
  judgeTierLevel: number;
  judgeXp: number;
  reputationScore: number;
  auditsCompletedTotal: number;
  fullListensTotal: number;
  skipsRemaining: number;       // max 3 per 24h
  dailyAuditsRemaining: number; // max 20 per 24h
  dailyAuditsMax: number;       // 20
  lastCycleTimestamp: number;   // For 24h reset
  tasteProfile: SonicTasteProfile;
  savedVaultTrackIds: string[];
  submittedTrackIds: string[];
  songsJudgedGoodCount: number; // user tracks with >= 8.0/10
  termsAccepted: boolean;
  termsAcceptedDate?: string;
  judgementCredits: number; // Three validated reviews activate one submission.
}

export interface TierConfig {
  tier: JudgeTier;
  level: number;
  minXp: number;
  multiplier: number;
  title: string;
  badgeColor: string;
  iconName: string;
  perks: string[];
}
