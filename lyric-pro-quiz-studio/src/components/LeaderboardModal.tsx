import React from 'react';
import { UserStatsVault } from '../types';
import { Trophy, Zap, BarChart2, X, Trash2 } from 'lucide-react';

interface LeaderboardModalProps {
  vault: UserStatsVault;
  onClearVault: () => void;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  vault,
  onClearVault,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e0e15] border border-white/10 rounded-[36px] shadow-2xl shadow-purple-500/20 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block text-purple-200">
                SCORE VAULT & STATS
              </span>
              <h2 className="text-lg font-black tracking-tight uppercase leading-none font-sans">
                SAVED PERFORMANCE VAULT
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                TOTAL POINTS
              </span>
              <span className="text-xl font-black text-purple-400 font-sans">
                {vault.totalPoints.toLocaleString()}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                QUIZZES DONE
              </span>
              <span className="text-xl font-black text-white font-sans">
                {vault.totalQuizzesCompleted}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                BEST STREAK
              </span>
              <span className="text-xl font-black text-amber-400 font-sans flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 fill-amber-400" />
                {vault.highestStreak}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                AVG ACCURACY
              </span>
              <span className="text-xl font-black text-emerald-400 font-sans">
                {vault.accuracyRate}%
              </span>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                Recent Quiz Attempts:
              </h3>
              {vault.completedResults.length > 0 && (
                <button
                  onClick={onClearVault}
                  className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
              )}
            </div>

            {vault.completedResults.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-gray-400 text-xs">
                No saved quiz records yet! Play a timed quiz to log your high scores here.
              </div>
            ) : (
              <div className="space-y-2.5">
                {vault.completedResults.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-sans">
                          {rec.quizTitle}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {rec.difficulty}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(rec.dateTimestamp).toLocaleDateString()} • Accuracy:{' '}
                        <span className="text-emerald-400 font-bold">{rec.accuracyPercentage}%</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-purple-400">
                        +{rec.score.toLocaleString()} PTS
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {rec.correctAnswersCount}/{rec.totalQuestions} Correct
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
