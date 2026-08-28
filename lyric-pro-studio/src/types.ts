export type GenreOption = 
  | 'Hip-Hop' 
  | 'Pop' 
  | 'R&B / Soul' 
  | 'Rock / Alt' 
  | 'Country' 
  | 'EDM / Dance' 
  | 'Metal' 
  | 'Trap' 
  | 'Indie' 
  | 'Reggae' 
  | 'Other';

export type VibeOption = 
  | 'Energetic' 
  | 'Melancholic' 
  | 'Aggressive' 
  | 'Smooth' 
  | 'Trippy' 
  | 'Motivational' 
  | 'Dark' 
  | 'Romantic' 
  | 'Euphoric' 
  | 'Chill' 
  | 'Other';

export type CreationMode = 'ideas_6' | 'starter' | 'full_song' | 'user_lyrics' | 'auto';

export type UserLyricsOption = 'finish_lyrics' | 'ideas_from_lyrics' | 'enhance_pattern';

export type StarterSection = 'verse' | 'chorus';

export interface LyricGenerateRequest {
  genre: string;
  customGenre?: string;
  vibe: string;
  customVibe?: string;
  explicit: boolean;
  mode: CreationMode;
  starterType?: StarterSection;
  structure: string;
  autoRandomize?: boolean;
  userLyrics?: string;
  userLyricsOption?: UserLyricsOption;
}

export interface LyricSet {
  title: string;
  genre: string;
  vibe: string;
  structure: string;
  explicit: boolean;
  content: string;
  summaryNote?: string;
}

export interface LyricGenerateResponse {
  setA: LyricSet;
  setB: LyricSet;
  isAiGenerated: boolean;
  timestamp: number;
}

export interface SavedLyricEntry {
  id: string;
  timestamp: number;
  genre: string;
  vibe: string;
  explicit: boolean;
  mode: CreationMode;
  setA: LyricSet;
  setB: LyricSet;
}
