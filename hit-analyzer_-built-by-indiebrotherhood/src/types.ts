export interface AudioAnalysis {
  vocalQualityScore: number;
  vocalQualityReview: string;
  tuneMelodyScore: number;
  tuneMelodyReview: string;
  genre: string;
  vibe: string;
  tempoBpm: number;
  structure: string;
  mixDynamic: string;
}

export interface LyricAnalysis {
  rhymeSchemeScore: number;
  narrativeImpact: string;
  phoneticFlow: string;
  hookMemorability: string;
}

export interface AnalysisResult {
  isCopyrightedOrCover: boolean;
  copyrightReason: string;
  hitPotentialScore: number;
  tierBadge: string;
  audioAnalysis: AudioAnalysis;
  lyricAnalysis?: LyricAnalysis | null;
  whatsWorking: string[];
  areasToTweak: string[];
  logicExplanation: string;
}

export interface SampleTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioUrl: string;
  description: string;
  sampleLyrics?: string;
}
