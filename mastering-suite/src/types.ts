export type GenreType =
  | 'hiphop'
  | 'edm'
  | 'rock'
  | 'pop'
  | 'rnb'
  | 'acoustic'
  | 'jazz'
  | 'cinematic'
  | 'podcast'
  | 'custom';

export type AudioFormat = 'wav-24' | 'wav-16';

export interface CleanupSettings {
  enabled: boolean;
  deHum: boolean; // 50/60Hz notch
  highPassFreq: number; // 20Hz - 45Hz sub-rumble filter
  deHarsh: boolean; // 6-8kHz dynamic softening
  deHarshAmount: number; // 0 - 100
  lowPassFreq: number; // 18kHz - 22kHz
}

export interface BassBoostSettings {
  enabled: boolean;
  subBoostDb: number; // 0 to +10 dB
  subFreq: number; // 35Hz - 90Hz
  punchDb: number; // 0 to +8 dB (around 100-140Hz)
  subHarmonics: number; // 0 to 100% (harmonic generation)
  monoBelowFreq: number; // 0 (off) or 80Hz - 160Hz for tight club sub
}

export interface ClaritySettings {
  enabled: boolean;
  airDb: number; // 0 to +10 dB (> 12kHz shelf)
  presenceDb: number; // 0 to +8 dB (3kHz - 6kHz)
  vocalShine: number; // 0 to 100%
}

export interface SonicHDSettings {
  enabled: boolean;
  mode: 'tube' | 'tape' | 'console' | 'solid-state';
  drive: number; // 0 to 100%
  warmth: number; // 0 to 100%
  analogGlue: number; // 0 to 100% (gentle RMS bus compression)
}

export interface SpatialSettings {
  enabled: boolean;
  stereoWidth: number; // 0 (mono) - 100 (normal) - 200 (extra wide)
  mode: 'mid-side' | 'synthetic-room';
  surroundSpread: number; // 0 to 100%
}

export interface LoudnessSettings {
  ceilingDb: number; // e.g. -1.0, -0.2
  inputGainDb: number; // -12 to +12 dB
  limiterRelease: number; // 10ms to 500ms
}

export interface MasteringPreset {
  id: string;
  name: string;
  genre: GenreType;
  description: string;
  cleanup: CleanupSettings;
  bass: BassBoostSettings;
  clarity: ClaritySettings;
  sonicHd: SonicHDSettings;
  spatial: SpatialSettings;
  loudness: LoudnessSettings;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  featuredArtists: string;
  album: string;
  trackNumber: string;
  totalTracks: string;
  discNumber: string;
  year: string;
  genre: string;
  isrc: string;
  upc: string;
  composer: string;
  producer: string;
  label: string;
  copyright: string;
  phonographicCopyright: string;
  explicit: boolean;
  masteringEngineer: string;
  notes: string;
  coverArtUrl: string | null;
  coverArtBlob: Blob | null;
}

export interface AudioMetrics {
  currentLUFS: number;
  shortTermLUFS: number;
  integratedLUFS: number;
  truePeakDb: number;
  peakL: number;
  peakR: number;
  rmsL: number;
  rmsR: number;
  phaseCorrelation: number; // -1 to +1
  dynamicRangePLR: number;
}
