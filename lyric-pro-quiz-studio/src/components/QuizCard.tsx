import React from 'react';
import { Quiz, DIFFICULTY_CONFIGS } from '../types';
import { Play, Clock } from 'lucide-react';

interface QuizCardProps {
  quiz: Quiz;
  onSelectQuiz: (quiz: Quiz) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onSelectQuiz }) => {
  const diffConfig = DIFFICULTY_CONFIGS[quiz.difficulty];

  // Difficulty badge styling matching Immersive UI design
  let diffBadgeColor = 'bg-green-500/20 text-green-400';
  if (quiz.difficulty === 'medium') {
    diffBadgeColor = 'bg-yellow-500/20 text-yellow-400';
  } else if (quiz.difficulty === 'expert') {
    diffBadgeColor = 'bg-red-500/20 text-red-400';
  }

  return (
    <div className="group relative p-6 bg-white/5 border border-white/10 rounded-[28px] hover:bg-white/[0.08] transition-all flex flex-col justify-between space-y-4 shadow-xl hover:shadow-purple-500/10">
      {/* Top Header Pill Row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${diffBadgeColor}`}>
            {quiz.difficulty}
          </div>
          <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-medium rounded-full">
            {quiz.quizType === 'finish_the_song'
              ? 'Finish Lyrics'
              : quiz.quizType === 'whats_the_artist'
              ? 'Guess Artist'
              : quiz.quizType === 'audio_snip'
              ? 'Audio Clip'
              : 'Genre Trivia'}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
          {quiz.title}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {quiz.description}
        </p>
      </div>

      {/* Footer Info & Play Action Button */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>{diffConfig.secondsPerQuestion}s / question • {quiz.questions.length} Qs</span>
        </div>

        <button
          onClick={() => onSelectQuiz(quiz)}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>PLAY NOW</span>
        </button>
      </div>
    </div>
  );
};
