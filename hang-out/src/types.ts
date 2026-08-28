export type RoomId = 
  | 'rap-battle'
  | 'rap-battle-flow'
  | 'rap-battle-fluent'
  | 'rap-battle-fanatic'
  | 'collaboration'
  | 'lounge'
  | 'marketing'
  | 'beat-showcase';

export type SubRoomTier = 'Flow' | 'Fluent' | 'Fanatic';

export type GenreType = 
  | 'Hip-Hop'
  | 'R&B'
  | 'Trap'
  | 'Lo-Fi'
  | 'Pop/Indie'
  | 'Rock/Alternative'
  | 'EDM'
  | 'Drill'
  | 'Afrobeat';

export interface UserProfile {
  id: string;
  nickname: string;
  role: 'Master Admin' | 'Artist' | 'Rapper' | 'Producer' | 'Singer/Songwriter' | 'Audio Engineer' | 'Designer' | 'Marketer';
  avatarUrl: string;
  favoriteGenre?: GenreType;
  primaryGenre?: GenreType;
  joinedAt?: number;
  battlesWon?: number;
  battlesTotal?: number;
  reputation?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  subRoomId?: string;
  sender: UserProfile;
  content: string;
  audioUrl?: string;
  timestamp: number;
  type?: 'text' | 'audio' | 'system' | 'beat' | 'verse';
  beatData?: {
    title: string;
    bpm: number;
    genre: GenreType;
    audioUrl: string;
  };
}

export interface RapVerse {
  id: string;
  battleId: string;
  round: number;
  authorId: string;
  authorName: string;
  text: string;
  audioUrl?: string;
  timestamp: number;
}

export interface JudgeScore {
  rhymeAndFlow: number; // 0-10
  punchlinesAndDelivery: number; // 0-10
  wordplayAndCadence: number; // 0-10
  totalScore: number;
  judgeFeedback: string;
  winnerId: string;
}

export interface BattleState {
  id: string;
  tier: SubRoomTier;
  player1: UserProfile;
  player2: UserProfile;
  status: 'waiting' | 'in-progress' | 'judging' | 'finished';
  currentRound: number; // 1, 2, 3
  turnPlayerId: string;
  timeRemaining: number;
  verses: RapVerse[];
  spectatorVotes: {
    p1Votes: number;
    p2Votes: number;
    voterIds: string[];
  };
  judgeScore?: JudgeScore;
  createdAt: number;
}

export interface SharedPad {
  roomId: string;
  content: string;
  lastUpdatedBy: string;
  timestamp: number;
}

export interface MarketingStrategy {
  title: string;
  trackName: string;
  genre: GenreType;
  playlistPitching: string[];
  tikTokHooks: string[];
  rolloutTimeline: {
    week: string;
    tasks: string[];
  }[];
  epkTips: string;
}
