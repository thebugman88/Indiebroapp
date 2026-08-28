export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface MediaFile {
  id: string;
  folderId: string | null;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 or blob URL
  status: ProcessingStatus;
  ocrProgress: number; // 0 - 100
  rawOcrText?: string;
  errorMessage?: string;
  trackCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SplitShare {
  id: string;
  name: string;
  ipi?: string;
  role: 'Writer' | 'Composer' | 'Author' | 'Publisher' | 'Producer';
  percentage: number;
}

export interface ParsedTrack {
  id: string;
  fileId: string | null;
  folderId: string | null;
  title: string;
  artist: string;
  isrc: string;
  iswc?: string;
  streams?: number;
  revenue?: number;
  currency: string;
  platform?: string; // 'Spotify' | 'Apple Music' | 'YouTube' | 'Amazon' | 'DistroKid' | 'SoundExchange' | 'Other'
  releaseTitle?: string;
  releaseDate?: string;
  duration?: string; // e.g. "03:45"
  label?: string;
  upc?: string;
  pLine?: string; // e.g. "2024 Records Inc."
  writers: SplitShare[];
  publishers: SplitShare[];
  confidence: number; // 0 - 100
  validated: boolean;
  isrcVerifiedOnline?: boolean;
  externalSource?: string;
  coverArtUrl?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type ExportPlatform = 'ASCAP' | 'MLC' | 'SOUNDEXCHANGE' | 'BMI' | 'UNIVERSAL_MASTER' | 'JSON';

export type OcrEngineMode = 'tesseract' | 'gemini';

export interface ByokKeys {
  spotifyClientId?: string;
  spotifyClientSecret?: string;
  discogsToken?: string;
  acoustidApiKey?: string;
  auddApiKey?: string;
  musoAiApiKey?: string;
  customEndpointUrl?: string;
}

export interface AppSettings {
  ocrEngine: OcrEngineMode;
  geminiApiKey: string;
  ocrLanguage: string;
  autoPreprocessImage: boolean;
  enhanceContrast: boolean;
  binarizeThreshold: boolean;
  isrcPrefix: string;
  defaultCurrency: string;
  defaultPlatform: string;
  autoLookupIsrcOnline: boolean;
  byokKeys: ByokKeys;
}

export interface OCRBoundingBox {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  suggestedAction?: {
    type: 'verify_unverified' | 'organize_folders' | 'open_export' | 'open_settings' | 'view_unverified';
    label: string;
  };
}
