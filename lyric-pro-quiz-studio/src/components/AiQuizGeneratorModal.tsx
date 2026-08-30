import { authenticatedFetch } from '../../../src/services/authService';
import React, { useState } from 'react';
import { Quiz, QuizType, DifficultyLevel } from '../types';
import { Sparkles, Music, Mic, X, Loader2, AlertCircle, Radio } from 'lucide-react';
import { generateRealAudioQuiz } from '../services/itunesMusic';

interface AiQuizGeneratorModalProps {
  onQuizGenerated: (quiz: Quiz) => void;
  onClose: () => void;
}

export const AiQuizGeneratorModal: React.FC<AiQuizGeneratorModalProps> = ({
  onQuizGenerated,
  onClose,
}) => {
  const [topic, setTopic] = useState('');
  const [quizType, setQuizType] = useState<QuizType>('audio_snip');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presetTopics = [
    'Top Chart Hits 2026',
    'Drake Hits',
    'Taylor Swift Greatest Hits',
    '80s Rock Anthems',
    '90s Hip Hop Classics',
    '2010s Pop Chart Hits',
    'Modern R&B Hits',
    'EDM Festival Bangers',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Please enter an artist, genre, decade, or topic!');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (quizType === 'audio_snip') {
        // Generate real audio quiz from iTunes Search API with 100% authentic song preview clips
        const realQuiz = await generateRealAudioQuiz(
          `Real Songs: ${topic.trim()}`,
          topic.trim(),
          'guess_song',
          numQuestions
        );
        onQuizGenerated(realQuiz as Quiz);
      } else {
        const response = await authenticatedFetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic.trim(),
            quizType,
            difficulty,
            numberOfQuestions: numQuestions,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate custom quiz');
        }

        const generatedQuiz: Quiz = {
          id: `custom-quiz-${Date.now()}`,
          title: data.quiz.title || `Custom: ${topic}`,
          subtitle: 'Sonic Studio Generator',
          description: data.quiz.description || `Custom generated music quiz for ${topic}`,
          quizType,
          genre: 'all',
          difficulty,
          iconName: 'Sparkles',
          totalQuestions: data.quiz.questions.length,
          questions: data.quiz.questions,
        };

        onQuizGenerated(generatedQuiz);
      }
    } catch (err: any) {
      console.error('Quiz Generation failed:', err);
      setErrorMsg(err.message || 'An error occurred while generating the quiz. Please try another search topic.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0e0e15] border border-white/10 rounded-[36px] shadow-2xl shadow-purple-500/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block text-purple-200">
                SONIC STUDIO GENERATOR
              </span>
              <h2 className="text-lg font-black tracking-tight uppercase leading-none font-sans">
                CUSTOM QUIZ GENERATOR
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

        {/* Modal Body Form */}
        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-200 uppercase tracking-wider block">
              1. Enter Artist, Song, Genre, or Decade:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Drake, Taylor Swift, 90s Rap, Chart Hits, EDM..."
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-2xl p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors font-sans"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {presetTopics.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTopic(preset)}
                  className="px-3 py-1 text-[11px] font-medium bg-white/5 hover:bg-white/10 text-gray-300 rounded-full border border-white/10 transition-colors cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-200 uppercase tracking-wider block">
              2. Quiz Mode / Format:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuizType('audio_snip')}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                  quizType === 'audio_snip'
                    ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold font-sans">Real Song Clips</div>
                  <div className="text-[10px] text-emerald-300 font-mono">iTunes 30s Audio</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuizType('finish_the_song')}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                  quizType === 'finish_the_song'
                    ? 'bg-purple-950/60 border-purple-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <Mic className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xs font-bold font-sans">Finish Lyrics</div>
                  <div className="text-[10px] text-gray-400 font-mono">Missing Lines</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuizType('whats_the_artist')}
                className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                  quizType === 'whats_the_artist'
                    ? 'bg-purple-950/60 border-purple-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <Music className="w-5 h-5 text-pink-400" />
                <div>
                  <div className="text-xs font-bold font-sans">Guess Artist</div>
                  <div className="text-[10px] text-gray-400 font-mono">Artist Match</div>
                </div>
              </button>
            </div>
          </div>

          {/* Difficulty & Question Count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-200 uppercase tracking-wider block mb-1">
                Difficulty:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none"
              >
                <option value="easy">Easy (20s Timer)</option>
                <option value="medium">Medium (12s Timer)</option>
                <option value="expert">Expert (7s Timer)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-200 uppercase tracking-wider block mb-1">
                Questions Count:
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none"
              >
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-black text-sm uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>FETCHING REAL AUDIO CLIPS & CREATING QUIZ...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-white text-white" />
                <span>GENERATE CUSTOM MUSIC QUIZ</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
