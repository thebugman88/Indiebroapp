export type QuizType = 'finish_the_song' | 'whats_the_artist' | 'genre_trivia' | 'audio_snip' | 'ai_custom';

export type DifficultyLevel = 'easy' | 'medium' | 'expert';

export type GenreCategory = 
  | 'all'
  | 'hip_hop'
  | 'pop'
  | 'rock'
  | 'rnb'
  | 'nostalgia'
  | 'country'
  | 'edm';

export interface Question {
  id: string;
  questionText: string;
  songContext?: string; // e.g. "Song: Sicko Mode by Travis Scott"
  artistContext?: string; // e.g. "Year: 2018 | Album: Astroworld"
  audioUrl?: string; // High quality actual audio preview clip URL
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  quizType: QuizType;
  genre: GenreCategory;
  difficulty: DifficultyLevel;
  iconName: string;
  totalQuestions: number;
  questions: Question[];
  featured?: boolean;
  playsCount?: number;
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  secondsPerQuestion: number;
  scoreMultiplier: number;
  badgeColor: string;
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    level: 'easy',
    label: 'Easy Mode',
    secondsPerQuestion: 20,
    scoreMultiplier: 1.0,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: '20s per question • Casual pace with extra thinking time',
  },
  medium: {
    level: 'medium',
    label: 'Medium Mode',
    secondsPerQuestion: 12,
    scoreMultiplier: 1.5,
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: '12s per question • Balanced speed for seasoned music fans',
  },
  expert: {
    level: 'expert',
    label: 'Expert Mode',
    secondsPerQuestion: 7,
    scoreMultiplier: 2.5,
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: '7s per question • Rapid-fire anti-cheat challenge for elites',
  },
};

export interface UserAnswer {
  questionId: string;
  selectedIndex: number | null; // null if timed out
  correctIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  pointsEarned: number;
}

export interface QuizResultRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  quizType: QuizType;
  difficulty: DifficultyLevel;
  score: number;
  maxPossibleScore: number;
  correctAnswersCount: number;
  totalQuestions: number;
  accuracyPercentage: number;
  totalTimeTakenSeconds: number;
  dateTimestamp: number;
  userAnswers: UserAnswer[];
}

export interface UserStatsVault {
  totalQuizzesCompleted: number;
  totalPoints: number;
  highestStreak: number;
  accuracyRate: number;
  completedResults: QuizResultRecord[];
}
