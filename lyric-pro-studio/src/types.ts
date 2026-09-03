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

export interface LyricLine {
  text: string;
  syllables: number;
  rhyme_markers: string;
}

export interface LyricSection {
  section_name: string;
  rhyme_scheme: string;
  energy_level: number;
  lines: LyricLine[];
}

export interface SongMetadata {
  title: string;
  genre_style: string;
  target_bpm: number;
  vocal_delivery_notes: string;
}

export interface HookBreakdown {
  core_earworm: string;
  rhythmic_motif: string;
}

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
  creativePrompt?: string;
  userId?: string;
  userEmail?: string;
}

export interface LyricSet {
  title: string;
  genre: string;
  vibe: string;
  structure: string;
  explicit: boolean;
  content: string;
  summaryNote?: string;
  song_metadata?: SongMetadata;
  lyrics?: LyricSection[];
  hook_breakdown?: HookBreakdown;
}

export interface SecurityRule {
  id: string;
  title: string;
  description: string;
  penalty: string;
}

export interface SecurityState {
  status: 'ACTIVE' | 'PAUSED' | 'QUARANTINED';
  pausedUntil?: number;
  remainingSeconds?: number;
  pauseReason?: string;
  trustScore?: number;
  guidelinesAccepted?: boolean;
}

export interface LyricGenerateResponse {
  setA: LyricSet;
  setB: LyricSet;
  rawBlueprint?: any;
  isAiGenerated: boolean;
  timestamp: number;
  _telemetry?: {
    modelUsed?: string;
    fallbackTriggered?: boolean;
    latencyMs?: number;
    securityStatus?: string;
    trustScore?: number;
  };
}

export interface SavedLyricEntry {
  id: string;
  timestamp: number;
  genre: string;
  vibe: string;
  explicit: boolean;
  mode: CreationMode;
  creativePrompt?: string;
  setA: LyricSet;
  setB: LyricSet;
}
