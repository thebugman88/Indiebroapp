import React, { useState, useEffect } from 'react';
import { Quiz, QuizType, DifficultyLevel, GenreCategory, QuizResultRecord, UserStatsVault } from './types';
import { FEATURED_QUIZZES } from './data/quizzes';
import { Header } from './components/Header';
import { QuizCard } from './components/QuizCard';
import { TimedModal } from './components/TimedModal';
import { QuizRunner } from './components/QuizRunner';
import { QuizResults } from './components/QuizResults';
import { AiQuizGeneratorModal } from './components/AiQuizGeneratorModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SponsoredAdBanner } from './components/SponsoredAdBanner';
import { Footer } from './components/Footer';
import {
  Mic,
  Music,
  Disc,
  Flame,
  Sparkles,
  Zap,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

const LOCAL_STORAGE_VAULT_KEY = 'sonic_iq_lab_user_stats_vault_2026';
const LEGACY_STORAGE_VAULT_KEY = 'lyric_pro_user_stats_vault_2026';

export default function App() {
  // Navigation & Modal States
  const [viewMode, setViewMode] = useState<'home' | 'running_quiz' | 'quiz_results'>('home');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyLevel>('medium');
  const [showTimedModal, setShowTimedModal] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [latestResult, setLatestResult] = useState<QuizResultRecord | null>(null);

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<GenreCategory>('all');
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType | 'all'>('all');
  const [explainerOpen, setExplainerOpen] = useState(false);

  // Custom AI generated quizzes pool
  const [customAiQuizzes, setCustomAiQuizzes] = useState<Quiz[]>([]);

  // User Stats Vault State
  const [vault, setVault] = useState<UserStatsVault>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VAULT_KEY) || localStorage.getItem(LEGACY_STORAGE_VAULT_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse vault stats:', e);
    }
    return {
      totalQuizzesCompleted: 0,
      totalPoints: 0,
      highestStreak: 0,
      accuracyRate: 0,
      completedResults: [],
    };
  });

  // Save Vault to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_VAULT_KEY, JSON.stringify(vault));
    } catch (e) {
      console.error('Failed to save vault stats:', e);
    }
  }, [vault]);

  // Combine curated + custom AI quizzes
  const allAvailableQuizzes = [...customAiQuizzes, ...FEATURED_QUIZZES];

  // Filtered List
  const filteredQuizzes = allAvailableQuizzes.filter((quiz) => {
    const matchesGenre = selectedGenre === 'all' || quiz.genre === selectedGenre;
    const matchesType = selectedQuizType === 'all' || quiz.quizType === selectedQuizType;
    return matchesGenre && matchesType;
  });

  // Handle Quiz Card Click -> Triggers mandatory pre-quiz timed pop-up modal
  const handleSelectQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setActiveDifficulty(quiz.difficulty);
    setShowTimedModal(true);
  };

  // User confirms timed quiz pop-up -> Start active runner
  const handleConfirmStartQuiz = () => {
    setShowTimedModal(false);
    setViewMode('running_quiz');
  };

  // Complete Quiz Callback
  const handleCompleteQuiz = (result: QuizResultRecord) => {
    setLatestResult(result);

    // Update Vault Stats
    setVault((prev) => {
      const updatedResults = [result, ...prev.completedResults];
      const newTotalPoints = prev.totalPoints + result.score;
      const newQuizzesCount = prev.totalQuizzesCompleted + 1;

      const totalAccuracySum = updatedResults.reduce((acc, r) => acc + r.accuracyPercentage, 0);
      const avgAccuracy = Math.round(totalAccuracySum / updatedResults.length);

      return {
        totalQuizzesCompleted: newQuizzesCount,
        totalPoints: newTotalPoints,
        highestStreak: Math.max(prev.highestStreak, result.correctAnswersCount),
        accuracyRate: avgAccuracy,
        completedResults: updatedResults,
      };
    });

    setViewMode('quiz_results');
  };

  // Handle AI Quiz Generation completed
  const handleAiQuizCreated = (quiz: Quiz) => {
    setCustomAiQuizzes((prev) => [quiz, ...prev]);
    setShowAiGenerator(false);
    setActiveQuiz(quiz);
    setActiveDifficulty(quiz.difficulty);
    setShowTimedModal(true);
  };

  const handleClearVault = () => {
    const emptyVault = {
      totalQuizzesCompleted: 0,
      totalPoints: 0,
      highestStreak: 0,
      accuracyRate: 0,
      completedResults: [],
    };
    setVault(emptyVault);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-gray-100 font-sans selection:bg-purple-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Persistent Header Bar */}
        <Header
          onOpenVault={() => setShowVaultModal(true)}
          onOpenAiGenerator={() => setShowAiGenerator(true)}
          totalPoints={vault.totalPoints}
        />

        {/* Main Content Router View */}
        <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
          {viewMode === 'home' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Hero Banner Section */}
              <div className="bg-gradient-to-r from-purple-950/40 via-black/40 to-indigo-950/40 border border-white/10 rounded-[32px] p-6 md:p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-pink-500/10 blur-3xl pointer-events-none rounded-full" />

                <div className="relative z-10 max-w-3xl space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                      <span>TIMED ANTI-CHEAT MUSIC TRIVIA</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10 text-xs font-medium">
                      <span>Engineered by <strong className="text-purple-300">indiebrotherhood</strong></span>
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
                    SONIC IQ LAB: TEST YOUR MUSIC MASTERIES IN <span className="text-purple-400">REAL-TIME</span>
                  </h1>

                  <p className="text-sm text-gray-300 leading-relaxed font-sans">
                    Choose from Finish the Song lyrics, What's the Artist guessing games, or genre-specific challenges. Every question features a strict anti-cheat timer to ensure pure music intuition and skill.
                  </p>

                  {/* Audio Equalizer Visualizer Strip */}
                  <div className="pt-2 flex items-center gap-3 text-xs text-purple-300 font-mono">
                    <span className="text-gray-400 text-[11px] font-sans">SONIC SIGNAL STATUS:</span>
                    <div className="flex items-end gap-1 h-4 bg-black/40 px-3 py-1 rounded-full border border-purple-500/30">
                      <span className="w-1 bg-purple-500 animate-[bounce_1.2s_infinite_100ms] h-full" />
                      <span className="w-1 bg-pink-500 animate-[bounce_1.2s_infinite_250ms] h-3/4" />
                      <span className="w-1 bg-indigo-400 animate-[bounce_1.2s_infinite_400ms] h-5/6" />
                      <span className="w-1 bg-emerald-400 animate-[bounce_1.2s_infinite_150ms] h-1/2" />
                      <span className="w-1 bg-purple-400 animate-[bounce_1.2s_infinite_300ms] h-full" />
                      <span className="w-1 bg-pink-400 animate-[bounce_1.2s_infinite_200ms] h-2/3" />
                    </div>
                    <span className="text-[11px] text-emerald-400 font-sans font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      LIVE FEED ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Native Sponsored Banner */}
              <SponsoredAdBanner variant="banner" />

              {/* Main Content Layout with Sidebar for Genres */}
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar / Genres section matching Immersive UI pattern */}
                <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
                  {/* Genre Sidebar Box */}
                  <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 space-y-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs uppercase tracking-widest text-purple-400 font-bold flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" /> Genres
                      </h3>
                      <span className="text-[10px] text-gray-400">
                        {filteredQuizzes.length} Quizzes
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {[
                        { id: 'all', label: 'All Genres' },
                        { id: 'hip_hop', label: 'Hip-Hop & Rap' },
                        { id: 'pop', label: 'Pop Icons' },
                        { id: 'rock', label: 'Classic Rock' },
                        { id: 'rnb', label: 'R&B & Soul' },
                        { id: 'nostalgia', label: '90s / 2000s' },
                        { id: 'edm', label: 'EDM & Festival' },
                        { id: 'country', label: 'Country / Folk' },
                      ].map((cat) => {
                        const isSelected = selectedGenre === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedGenre(cat.id as GenreCategory)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-white/10 border border-white/20 text-white font-bold'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-purple-400' : 'bg-gray-600'}`} />
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Quiz Studio Promotion Panel */}
                  <div className="p-5 rounded-[28px] bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 backdrop-blur-md space-y-2">
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Sonic Custom Studio</p>
                    <p className="text-sm text-white font-extrabold leading-snug">Generate custom quizzes for any artist or decade.</p>
                    <button
                      onClick={() => setShowAiGenerator(true)}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                      <span>CREATE CUSTOM QUIZ</span>
                    </button>
                  </div>
                </aside>

                {/* Right Quiz Grid & Filters */}
                <div className="flex-1 space-y-6">
                  {/* Format Filter Bar */}
                  <div className="bg-white/5 border border-white/10 rounded-[28px] p-5 backdrop-blur-md space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                      <ListFilter className="w-4 h-4" />
                      Quiz Format Mode
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setSelectedQuizType('all')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedQuizType === 'all'
                            ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Disc className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold uppercase text-white">
                            All Formats
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Browse both Lyric Completion and Artist Identification.
                        </p>
                      </button>

                      <button
                        onClick={() => setSelectedQuizType('finish_the_song')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedQuizType === 'finish_the_song'
                            ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold uppercase text-white">
                            Finish The Song
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Fill in the missing lyrics or completing lines.
                        </p>
                      </button>

                      <button
                        onClick={() => setSelectedQuizType('whats_the_artist')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedQuizType === 'whats_the_artist'
                            ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-bold uppercase text-white">
                            What's The Artist
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          Identify the famous music icon behind the lyric hook.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Quiz Grid Header */}
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-purple-400" />
                        Featured Quizzes
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">Test your musical intuition across multiple difficulty tiers.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 font-medium">
                      Sort: Popular
                    </span>
                  </div>

                  {/* Quiz Cards Container */}
                  {filteredQuizzes.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-[28px] p-10 text-center space-y-3">
                      <p className="text-gray-400 text-xs">
                        No quizzes found for the selected genre and format combination.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedGenre('all');
                          setSelectedQuizType('all');
                        }}
                        className="px-4 py-2 text-xs font-bold bg-white/10 text-purple-300 rounded-full border border-white/10 cursor-pointer hover:bg-white/20 transition-all"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredQuizzes.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} onSelectQuiz={handleSelectQuiz} />
                      ))}
                    </div>
                  )}

                  {/* Help Explainer Accordion */}
                  <div className="bg-white/5 border border-white/10 rounded-[28px] overflow-hidden backdrop-blur-md">
                    <button
                      onClick={() => setExplainerOpen(!explainerOpen)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Help & System Explainer{' '}
                            <span className="px-2 py-0.5 text-[9px] bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                              HOW IT WORKS
                            </span>
                          </h3>
                          <p className="text-xs text-gray-400">
                            Learn how Sonic IQ Lab's anti-cheat timed quizzes and score multipliers work.
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                          explainerOpen ? 'rotate-180 text-purple-400' : ''
                        }`}
                      />
                    </button>

                    {explainerOpen && (
                      <div className="p-5 border-t border-white/5 bg-black/20 space-y-4 text-xs text-gray-300 leading-relaxed font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                            <span className="text-purple-300 font-bold block">
                              ⏱️ 1. Anti-Cheat Timers
                            </span>
                            <p className="text-gray-400 text-[11px]">
                              Every question features a live countdown timer (20s Easy, 12s Medium, 7s Expert). Questions automatically fail if unanswered when time expires.
                            </p>
                          </div>

                          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                            <span className="text-purple-300 font-bold block">
                              🔥 2. Speed & Streak Multipliers
                            </span>
                            <p className="text-gray-400 text-[11px]">
                              Answering rapidly yields bonus points. Building consecutive streaks activates score multipliers for elite ranks.
                            </p>
                          </div>

                          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                            <span className="text-purple-300 font-bold block">
                              ✨ 3. Custom Quiz Studio
                            </span>
                            <p className="text-gray-400 text-[11px]">
                              Generate custom lyrics and artist quizzes for any artist, genre, or era in seconds.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Running Quiz View */}
          {viewMode === 'running_quiz' && activeQuiz && (
            <QuizRunner
              quiz={activeQuiz}
              difficulty={activeDifficulty}
              onCompleteQuiz={handleCompleteQuiz}
              onExitQuiz={() => setViewMode('home')}
            />
          )}

          {/* Quiz Results View */}
          {viewMode === 'quiz_results' && latestResult && (
            <QuizResults
              result={latestResult}
              onRetry={() => {
                setShowTimedModal(true);
              }}
              onHome={() => setViewMode('home')}
            />
          )}
        </main>
      </div>

      {/* Mandatory Pre-Quiz Anti-Cheat Timed Pop-Up Modal */}
      {showTimedModal && activeQuiz && (
        <TimedModal
          quiz={activeQuiz}
          selectedDifficulty={activeDifficulty}
          onSelectDifficulty={setActiveDifficulty}
          onConfirmStart={handleConfirmStartQuiz}
          onClose={() => setShowTimedModal(false)}
        />
      )}

      {/* AI Quiz Generator Modal */}
      {showAiGenerator && (
        <AiQuizGeneratorModal
          onQuizGenerated={handleAiQuizCreated}
          onClose={() => setShowAiGenerator(false)}
        />
      )}

      {/* Score Vault & Stats Modal */}
      {showVaultModal && (
        <LeaderboardModal
          vault={vault}
          onClearVault={handleClearVault}
          onClose={() => setShowVaultModal(false)}
        />
      )}

      {/* Footer with exact requested copyright line */}
      <Footer />
    </div>
  );
}
