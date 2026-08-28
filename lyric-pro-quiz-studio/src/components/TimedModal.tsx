import React from 'react';
import { Quiz, DifficultyLevel, DIFFICULTY_CONFIGS } from '../types';
import { Clock, AlertTriangle, Zap, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface TimedModalProps {
  quiz: Quiz;
  selectedDifficulty: DifficultyLevel;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onConfirmStart: () => void;
  onClose: () => void;
}

export const TimedModal: React.FC<TimedModalProps> = ({
  quiz,
  selectedDifficulty,
  onSelectDifficulty,
  onConfirmStart,
  onClose,
}) => {
  const currentConfig = DIFFICULTY_CONFIGS[selectedDifficulty];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0e0e15] border border-white/10 rounded-[36px] shadow-2xl shadow-purple-500/20 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block text-purple-200">
                PRO ANTI-CHEAT PROTOCOL
              </span>
              <h2 className="text-lg font-black tracking-tight uppercase leading-none font-sans">
                TIMED QUIZ NOTICE
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Quiz Brief */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                  {quiz.quizType === 'finish_the_song'
                    ? 'FINISH THE SONG'
                    : quiz.quizType === 'whats_the_artist'
                    ? 'WHAT\'S THE ARTIST'
                    : 'GENRE TRIVIA'}{' '}
                  • {quiz.questions.length} QUESTIONS
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{quiz.title}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{quiz.description}</p>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-200/90 leading-relaxed font-sans">
              <span className="font-bold text-purple-300 uppercase block text-[11px] mb-0.5">
                Notice: These are timed quizzes!
              </span>
              To maintain fair competition and prevent external lyric lookup, every question runs on an unpauseable countdown timer. If the clock runs out before you answer, the question counts as <span className="text-pink-400 font-bold uppercase underline">WRONG</span> (0 points).
            </div>
          </div>

          {/* Difficulty & Timing Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Select Question Timer Difficulty Level:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['easy', 'medium', 'expert'] as DifficultyLevel[]).map((level) => {
                const config = DIFFICULTY_CONFIGS[level];
                const isSelected = selectedDifficulty === level;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onSelectDifficulty(level)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/50 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                    )}
                    <div className="text-xs font-bold text-white uppercase">
                      {config.label.replace(' Mode', '')}
                    </div>
                    <div className="text-lg font-extrabold text-purple-300 font-mono my-0.5">
                      {config.secondsPerQuestion}s <span className="text-[10px] text-gray-400 font-normal">/ Q</span>
                    </div>
                    <div className="text-[10px] text-gray-400 leading-tight">
                      {level === 'easy' && '20s limit • Casual'}
                      {level === 'medium' && '12s limit • Balanced'}
                      {level === 'expert' && '7s limit • Intense'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Time Allowed Per Question:</span>
            </div>
            <div className="font-bold text-purple-300 text-sm">
              {currentConfig.secondsPerQuestion} Seconds
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3.5 text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmStart}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-extrabold text-xs tracking-wider uppercase hover:opacity-90 active:scale-98 transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 fill-white text-purple-600" />
              <span>START TIMED QUIZ NOW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
