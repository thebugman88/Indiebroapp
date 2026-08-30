export type EngineMode = 'CLEAN' | 'UNLEASHED';
export type InputMode = 'LYRIC_REFACTOR' | 'CADENCE_GENERATOR';
export type EraPreset = 'NEO_CYBER_2026' | 'HYPERPOP_GLITCH' | 'DARK_TRAP_WAVE' | 'ANALOG_SYNTHWAVE' | 'INDIE_ALT_GRUNGE' | 'AFRO_FUSION_FUTURE';

export interface TrajectoryPoint {
  timeLabel: string;
  frequency: number; // kHz
  probability: number; // 0-100%
  velocity: number;
}

export interface MetricBreakdown {
  catchiness: number; // 0-100
  emotionalResonance: number; // 0-100
  replayability: number; // 0-100
  earwormFactor: number; // 0-100
  marketVelocity: number; // 0-100
  hookLineHighlight: string;
  sonicNotes: string[];
}

export interface RhymeBar {
  barNumber: number;
  originalText: string;
  refactoredText: string;
  schemeTag: 'A' | 'B' | 'C' | 'D' | 'X';
  syllableCount: number;
  cadenceSpeedBpm: number;
  stressPattern: string; // e.g. "· — · — — ·"
  rhymingTokens: string[];
}

export interface FlowMatrixData {
  schemeType: 'AABB' | 'ABAB' | 'AAAA' | 'ABBA' | 'COMPLEX_MULTI_SYLLABIC' | 'FREE_FLOW';
  recommendedBpm: number;
  bpmFitLabel: string;
  pocketDriftMs: number;
  cadenceDescription: string;
  bars: RhymeBar[];
}

export interface IPRightsRecord {
  isRegistered: boolean;
  registrationId: string;
  eraHash: string;
  timestamp: string;
  workTitle: string;
  artistName: string;
  lyricistShare: number; // e.g. 100%
  publisherShare: number; // e.g. 100%
  iswcCode: string;
  ascapStatus: 'PENDING' | 'SECURED' | 'READY_FOR_SUBMISSION';
  mlcStatus: 'PENDING' | 'SECURED' | 'READY_FOR_BULK_EXPORT';
}

export interface SystemHeuristics {
  cachePurity: number; // e.g. 99.8%
  eraSyncLagMs: number; // e.g. 1.4ms
  soulCompression: 'NONE' | 'ACTIVE' | 'WARM_SATURATION';
  bufferDepth: number; // KB
  quantumEntropy: number; // %
  lastSyncTimestamp: string;
}

export interface SynthesisResult {
  synthesizedText: string;
  peakProbability: number;
  sonicSaturation: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX_OVERDRIVE';
  eraCompatibility: 'OPTIMAL' | 'SUB-OPTIMAL' | 'BREAKTHROUGH_PIONEER';
  metrics: MetricBreakdown;
  flowMatrix: FlowMatrixData;
  ipRegistry?: IPRightsRecord;
  suggestedChordsOrKey: string;
  producerTips: string[];
}
