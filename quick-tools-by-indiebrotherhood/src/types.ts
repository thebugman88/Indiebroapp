export type ActiveTool =
  | 'dashboard'
  | 'lyrics'
  | 'bpm'
  | 'pitch'
  | 'rhymes'
  | 'metadata'
  | 'splits'
  | 'gain'
  | 'smartlink';

export type LyricMode = 'free' | 'guided';

export interface LyricLine {
  id: string;
  text: string;
  syllables: number;
  rhymeKey: string;
  rhymeColor?: string;
}

export interface RhymeResult {
  word: string;
  score?: number;
  numSyllables: number;
  defs?: string[];
  tags?: string[];
}

export interface DefinitionResult {
  word: string;
  partOfSpeech?: string;
  definition: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  pro: string;
  ipi: string;
  publishingPercentage: number;
  masterPercentage: number;
}

export interface TrackMetadata {
  songTitle: string;
  mainArtist: string;
  featuredArtists: string;
  producers: string;
  songwriters: string;
  publishers: string;
  genre: string;
  subGenre: string;
  isrc: string;
  iswc: string;
  releaseDate: string;
  bpm: string;
  keySignature: string;
  explicit: boolean;
  notes: string;
}

export interface AudioAnalysisResult {
  fileName: string;
  fileSize: number;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  peakDbfs: number;
  rmsDbfs: number;
  estimatedLufs: number;
  targetLufs: number;
  gainAdjustmentDb: number;
  isClipping: boolean;
  peakWaveform: number[];
}

export interface SmartLinkPlatform {
  id: string;
  name: string;
  icon: string;
  url: string;
  enabled: boolean;
  actionText: string;
}

export interface SmartLinkData {
  artistName: string;
  releaseTitle: string;
  releaseType: 'Single' | 'EP' | 'Album' | 'Beat' | 'Mixtape';
  releaseDate: string;
  coverArtUrl: string;
  bio: string;
  socialHandles: {
    instagram: string;
    twitter: string;
    tiktok: string;
    youtube: string;
    spotify: string;
  };
  platforms: SmartLinkPlatform[];
  customMessage: string;
}
