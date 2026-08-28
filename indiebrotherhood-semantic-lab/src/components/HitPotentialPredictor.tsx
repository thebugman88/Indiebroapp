import React from 'react';
import { Target, Sparkles, Heart, Repeat, Radio, Music, Award, HelpCircle } from 'lucide-react';
import { MetricBreakdown } from '../types';

interface HitPotentialPredictorProps {
  metrics: MetricBreakdown | null;
  peakProbability: number;
  suggestedChordsOrKey?: string;
  producerTips?: string[];
  isSynthesizing: boolean;
}

export const HitPotentialPredictor: React.FC<HitPotentialPredictorProps> = ({
  metrics,
  peakProbability,
  suggestedChordsOrKey,
  producerTips,
  isSynthesizing,
}) => {
  if (!metrics) {
    return (
      <div id="smart-hook-hit-predictor" className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-6 backdrop-blur-md text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1">
          SMART HOOK & HIT POTENTIAL PREDICTOR
        </h3>
        <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto">
          Execute write synthesis to calculate sonic catchiness, emotional resonance, replayability loop factor, and production mix suggestions.
        </p>
      </div>
    );
  }

  const subScores = [
    {
      label: 'Catchiness',
      value: metrics.catchiness,
      icon: Sparkles,
      color: 'from-cyan-500 to-sky-400',
      textColor: 'text-cyan-300',
      description: 'Phonetic memorability and melodic contour retention',
    },
    {
      label: 'Emotional Resonance',
      value: metrics.emotionalResonance,
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      textColor: 'text-rose-300',
      description: 'Acoustic frequency depth and visceral lyric resonance',
    },
    {
      label: 'Replayability',
      value: metrics.replayability,
      icon: Repeat,
      color: 'from-purple-500 to-indigo-500',
      textColor: 'text-purple-300',
      description: 'Algorithmic loop endurance and playlist stickiness',
    },
    {
      label: 'Earworm Factor',
      value: metrics.earwormFactor,
      icon: Radio,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-300',
      description: 'Subconscious melodic loop recall and hook penetration',
    },
  ];

  return (
    <div id="smart-hook-hit-predictor" className="bg-zinc-950/90 border border-sky-900/40 rounded-xl p-5 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
                SMART HOOK & HIT POTENTIAL PREDICTOR
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800/50">
                AI SCORING ENGINE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Algorithmic breakdown of viral resonance, earworm retention, and sonic traction
            </p>
          </div>
        </div>

        {/* Global Hit Composite Rating */}
        <div className="text-right">
          <span className="text-[9px] font-mono text-zinc-500 uppercase block">Composite Peak</span>
          <span className="text-lg font-mono font-bold text-sky-300">
            {peakProbability.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Sub-Score Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
        {subScores.map((score) => {
          const Icon = score.icon;
          return (
            <div
              key={score.label}
              className="bg-zinc-900/70 border border-zinc-800/90 rounded-lg p-3.5 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${score.textColor}`} />
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    {score.label}
                  </span>
                </div>
                <span className={`text-sm font-mono font-bold ${score.textColor}`}>
                  {score.value}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden mb-1.5 p-0.5 border border-zinc-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${score.color} transition-all duration-500`}
                  style={{ width: `${score.value}%` }}
                />
              </div>

              <p className="text-[10px] font-mono text-zinc-500 leading-tight">
                {score.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Earworm Hook Highlight Box */}
      {metrics.hookLineHighlight && (
        <div className="bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-zinc-900/60 border border-sky-500/30 rounded-lg p-3.5 mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
              PREDICTED PRIMARY EARWORM HOOK
            </span>
          </div>
          <p className="text-sm font-mono font-bold text-white pl-3 border-l-2 border-amber-400/80 italic">
            "{metrics.hookLineHighlight}"
          </p>
        </div>
      )}

      {/* Suggested Harmonic Key & Producer Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
        {/* Harmonic Key Recommendation */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-zinc-400 uppercase">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>Harmonic Key / Scale Anchor</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {suggestedChordsOrKey || 'F# Minor / D Harmonic Minor'}
          </span>
        </div>

        {/* Producer Mix Tips */}
        {producerTips && producerTips.length > 0 && (
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-lg">
            <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
              Producer Mixing Advice:
            </span>
            <ul className="space-y-1">
              {producerTips.slice(0, 2).map((tip, i) => (
                <li key={i} className="text-[11px] font-mono text-zinc-300 flex items-start gap-1.5">
                  <span className="text-purple-400">›</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
