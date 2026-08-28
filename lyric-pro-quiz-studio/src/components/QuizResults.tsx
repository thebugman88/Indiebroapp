import React from 'react';
import { QuizResultRecord } from '../types';
import { Trophy, RotateCcw, Home, CheckCircle2, XCircle, Clock, Sparkles } from 'lucide-react';

interface QuizResultsProps {
  result: QuizResultRecord;
  onRetry: () => void;
  onHome: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  onRetry,
  onHome,
}) => {
  // Determine Grade Rank
  let rankGrade = 'C-RANK';
  let rankColor = 'text-gray-400 border-gray-500/40 bg-gray-500/10';
  if (result.accuracyPercentage >= 90) {
    rankGrade = 'S-RANK ELITE';
    rankColor = 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/20';
  } else if (result.accuracyPercentage >= 75) {
    rankGrade = 'A-RANK PRO';
    rankColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
  } else if (result.accuracyPercentage >= 50) {
    rankGrade = 'B-RANK MAESTRO';
    rankColor = 'text-blue-400 border-blue-500/50 bg-blue-500/10';
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fadeIn space-y-6 font-sans">
      {/* Hero Performance Card */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>QUIZ PERFORMANCE REPORT</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight font-sans">
            {result.quizTitle}
          </h2>

          {/* Grade Badge */}
          <div className="pt-2">
            <span
              className={`inline-block px-5 py-2 rounded-2xl text-lg font-black tracking-widest border uppercase ${rankColor}`}
            >
              {rankGrade}
            </span>
          </div>

          {/* Score & Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <span className="text-[10px] text-gray-400 font-bold block">FINAL SCORE</span>
              <span className="text-2xl font-black text-purple-400 font-sans">
                {result.score.toLocaleString()}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <span className="text-[10px] text-gray-400 font-bold block">ACCURACY</span>
              <span className="text-2xl font-black text-white font-sans">
                {result.accuracyPercentage}%
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <span className="text-[10px] text-gray-400 font-bold block">CORRECT</span>
              <span className="text-2xl font-black text-emerald-400 font-sans">
                {result.correctAnswersCount} / {result.totalQuestions}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <span className="text-[10px] text-gray-400 font-bold block">TIME TAKEN</span>
              <span className="text-2xl font-black text-gray-200 font-sans">
                {result.totalTimeTakenSeconds}s
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onRetry}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span>RETRY THIS QUIZ</span>
            </button>

            <button
              onClick={onHome}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs tracking-wide uppercase hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 fill-white" />
              <span>EXPLORE ALL QUIZZES</span>
            </button>
          </div>
        </div>
      </div>

      {/* Answer Breakdown Vault */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-xl space-y-4 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          QUESTION ANSWER REVIEW
        </h3>

        <div className="space-y-3">
          {result.userAnswers.map((ans, idx) => {
            return (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">
                      Q{idx + 1}.
                    </span>
                    {ans.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{ans.pointsEarned} pts)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-400 bg-pink-950/50 px-2.5 py-1 rounded-full border border-pink-500/30">
                        <XCircle className="w-3.5 h-3.5" /> {ans.selectedIndex === null ? 'Timed Out' : 'Incorrect'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-medium text-gray-400 shrink-0">
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                  {ans.timeSpentSeconds}s
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
