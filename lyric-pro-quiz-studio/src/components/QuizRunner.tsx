import React, { useState, useEffect, useRef } from 'react';
import { Quiz, DifficultyLevel, UserAnswer, QuizResultRecord, DIFFICULTY_CONFIGS } from '../types';
import { Clock, Zap, AlertCircle, Check, X } from 'lucide-react';

interface QuizRunnerProps {
  quiz: Quiz;
  difficulty: DifficultyLevel;
  onCompleteQuiz: (result: QuizResultRecord) => void;
  onExitQuiz: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  quiz,
  difficulty,
  onCompleteQuiz,
  onExitQuiz,
}) => {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const maxTimePerQuestion = config.secondsPerQuestion;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(maxTimePerQuestion);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [accumulatedScore, setAccumulatedScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentQuestion = quiz.questions[currentIndex];

  // Timer loop per question
  useEffect(() => {
    setTimeLeft(maxTimePerQuestion);
    setIsAnswered(false);
    setIsTimedOut(false);
    setSelectedIndex(null);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]);

  // Handle countdown expiration
  const handleTimeExpired = () => {
    setIsTimedOut(true);
    setIsAnswered(true);
    setSelectedIndex(null);
    setCurrentStreak(0);

    const timeSpent = maxTimePerQuestion;
    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      selectedIndex: null,
      correctIndex: currentQuestion.correctIndex,
      isCorrect: false,
      timeSpentSeconds: timeSpent,
      pointsEarned: 0,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);

    // Auto advance after 2 seconds
    setTimeout(() => {
      advanceToNextQuestion();
    }, 1800);
  };

  // Handle user option select
  const handleSelectOption = (index: number) => {
    if (isAnswered) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const isCorrect = index === currentQuestion.correctIndex;

    setSelectedIndex(index);
    setIsAnswered(true);

    let points = 0;
    if (isCorrect) {
      const speedBonus = Math.max(1, maxTimePerQuestion - timeSpent);
      const streakBonus = Math.min(3, 1 + currentStreak * 0.2);
      points = Math.round((100 + speedBonus * 10) * config.scoreMultiplier * streakBonus);

      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > highestStreak) {
        setHighestStreak(newStreak);
      }
      setAccumulatedScore((prev) => prev + points);
    } else {
      setCurrentStreak(0);
    }

    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      selectedIndex: index,
      correctIndex: currentQuestion.correctIndex,
      isCorrect,
      timeSpentSeconds: timeSpent,
      pointsEarned: points,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);

    // Delay to highlight selection
    setTimeout(() => {
      advanceToNextQuestion();
    }, 1600);
  };

  // Move to next question or finalize
  const advanceToNextQuestion = () => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finalizeQuizResult();
    }
  };

  const finalizeQuizResult = () => {
    const finalAnswers = userAnswers;
    const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
    const totalTimeTaken = finalAnswers.reduce((sum, a) => sum + a.timeSpentSeconds, 0);

    const resultRecord: QuizResultRecord = {
      id: `result-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizType: quiz.quizType,
      difficulty,
      score: accumulatedScore,
      maxPossibleScore: quiz.questions.length * 250 * config.scoreMultiplier,
      correctAnswersCount: correctCount,
      totalQuestions: quiz.questions.length,
      accuracyPercentage: accuracy,
      totalTimeTakenSeconds: totalTimeTaken,
      dateTimestamp: Date.now(),
      userAnswers: finalAnswers,
    };

    onCompleteQuiz(resultRecord);
  };

  const timerPercentage = Math.max(0, (timeLeft / maxTimePerQuestion) * 100);
  const isDangerTime = timeLeft <= 3;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Top Runner Header Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quiz Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExitQuiz}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-300 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors cursor-pointer"
          >
            ← Exit
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-300 uppercase">
                {quiz.title}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {config.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Question {currentIndex + 1} of {quiz.questions.length}
            </p>
          </div>
        </div>

        {/* Right: Score & Streak Counters */}
        <div className="flex items-center gap-4 text-xs font-sans">
          {currentStreak >= 2 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-bounce">
              <Zap className="w-3.5 h-3.5 fill-purple-300" />
              <span className="font-bold">{currentStreak}x STREAK!</span>
            </div>
          )}

          <div className="bg-white/5 px-3.5 py-1.5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-gray-400 block leading-none">SCORE</span>
            <span className="text-base font-extrabold text-purple-400 font-mono">
              {accumulatedScore.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Bar Box */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
            <Clock className={`w-4 h-4 ${isDangerTime ? 'text-pink-500 animate-spin' : 'text-purple-400'}`} />
            <span>TIME REMAINING:</span>
          </div>
          <div
            className={`text-xl font-black font-mono tracking-tight ${
              isDangerTime ? 'text-pink-500 animate-pulse' : 'text-purple-300'
            }`}
          >
            {timeLeft}s
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isDangerTime
                ? 'bg-gradient-to-r from-pink-600 to-red-500'
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-md space-y-6">
        {/* Main Question / Lyric Text */}
        <div className="bg-black/30 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed font-sans tracking-wide">
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* Timed Out Notice */}
        {isTimedOut && (
          <div className="bg-pink-950/40 border border-pink-500/50 rounded-2xl p-3.5 text-pink-300 text-xs font-sans flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
            <span>TIME EXPIRED! Question marked as wrong.</span>
          </div>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentQuestion.options.map((optionText, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = selectedIndex === optIdx;
            const isCorrectOption = optIdx === currentQuestion.correctIndex;

            let optionStyle =
              'bg-white/5 border-white/10 hover:bg-white/10 text-gray-200';

            if (isAnswered) {
              if (isCorrectOption) {
                optionStyle =
                  'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-900/30';
              } else if (isSelected && !isCorrectOption) {
                optionStyle =
                  'bg-pink-950/60 border-pink-500 text-pink-200 shadow-lg shadow-pink-900/30';
              } else {
                optionStyle = 'bg-white/5 border-white/5 text-gray-500 opacity-50';
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 relative cursor-pointer ${optionStyle}`}
              >
                {/* Option Letter Tag */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isAnswered && isCorrectOption
                      ? 'bg-emerald-500 text-black'
                      : isAnswered && isSelected && !isCorrectOption
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 text-purple-300'
                  }`}
                >
                  {letter}
                </div>

                {/* Option Text */}
                <div className="flex-1 text-sm font-medium pt-0.5 leading-snug">
                  {optionText}
                </div>

                {/* Icon Indicators */}
                {isAnswered && isCorrectOption && (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {isAnswered && isSelected && !isCorrectOption && (
                  <X className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Trivia Explanation callout when answered */}
        {isAnswered && (
          <div className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-4 animate-fadeIn">
            <span className="text-[10px] font-bold uppercase text-purple-300 block mb-1">
              Musicology Trivia Breakdown:
            </span>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
</div>
    </div>
  );
};
