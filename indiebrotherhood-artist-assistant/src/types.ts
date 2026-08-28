export type ProType = "ASCAP" | "BMI" | "SESAC" | "PRS" | "SOCAN" | "GEMA" | "SACEM" | "Other" | "Unregistered";

export type SongRole = "Composer" | "Lyricist" | "Producer" | "Author" | "Arranger";

export interface SongWriter {
  id: string;
  name: string;
  ipi: string;
  pro: ProType | string;
  role: SongRole;
  writerSplitPercent: number; // e.g. 50%
  publisherName: string;
  publisherIpi: string;
  publisherPro: ProType | string;
  publisherSplitPercent: number; // e.g. 50%
}

export interface StreamDataRecord {
  id: string;
  platform: "Spotify" | "Apple Music" | "YouTube" | "Tidal" | "Amazon Music" | "Deezer" | "SoundCloud" | "Other";
  streamCount: number;
  recordedDate: string;
  earnings?: number;
  currency?: string;
  sourceFileId?: string;
}

export interface SongMetadata {
  id: string;
  title: string;
  alternativeTitles: string[];
  primaryArtist: string;
  featuredArtists: string[];
  isrc: string; // International Standard Recording Code (12 chars: CC-XXX-YY-NNNNN)
  iswc: string; // International Standard Musical Work Code (e.g. T-123456789-0)
  upc: string; // Universal Product Code (Barcode)
  releaseDate: string;
  duration: string; // e.g. "03:42"
  genre: string;
  subGenre?: string;
  bpm?: number;
  musicalKey?: string;
  language?: string;
  labelOrDistributor: string;
  pLine: string; // Phonographic copyright (e.g. (P) 2026 IndieBrotherhood Records)
  cLine: string; // Copyright (e.g. (C) 2026 Artist Name)
  explicit: boolean;
  writers: SongWriter[];
  streams: StreamDataRecord[];
  totalEarnings?: number;
  folderId?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  folderId: string;
  size: number;
  mimeType: string;
  fileDataUrl: string;
  ocrRawText?: string;
  parsedSongMetadata?: Partial<SongMetadata>;
  status: "ready" | "processing" | "parsed" | "error";
  errorMessage?: string;
  confidenceScore?: number;
  uploadedAt: string;
}

export type EventCategory =
  | "release"
  | "pitch"
  | "marketing"
  | "registration"
  | "social"
  | "sync"
  | "live"
  | "deadline";

export interface ScheduledEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category: EventCategory;
  description: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  songId?: string;
  reminderMinutesBefore: number; // e.g. 0, 60, 1440 (1 day), 4320 (3 days)
  notified?: boolean;
  createdAt: string;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface ChatMessage {
  id: string;
  role?: "user" | "assistant" | "system";
  sender?: "user" | "assistant" | "system";
  content?: string;
  text?: string;
  timestamp: string;
  sources?: GroundingSource[];
  groundingMetadata?: any;
  isCorrection?: boolean;
  suggestedAction?: {
    type: "create_event" | "add_song" | "export_metadata" | "open_folder";
    payload: any;
    label: string;
  };
}

export interface ArtistProfile {
  artistName: string;
  stageName?: string;
  genre: string;
  stage: "Emerging / Demo Phase" | "Actively Releasing" | "Touring Independent" | "Established Indie";
  pro: ProType;
  ipi: string;
  publisher: string;
  distributor: string;
  soundExchangeId?: string;
  mlcMemberId?: string;
  spotifyArtistUrl?: string;
  appleMusicUrl?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  youtubeChannel?: string;
  bio: string;
  careerGoals: string[];
}

export interface SettingsState {
  customApiKey: string;
  preferredModel: string;
  enableWebSearch: boolean;
  enableSoundAlerts: boolean;
  storageMode: "local_indexeddb" | "localStorage_only";
  desktopNotificationsEnabled: boolean;
}

export type ExportPlatform =
  | "ASCAP"
  | "MLC"
  | "SOUNDEXCHANGE"
  | "BMI"
  | "SONGSPLIT"
  | "FULL_CATALOGUE_CSV";
