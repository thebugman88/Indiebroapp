import React, { useState } from 'react';
import { Network, Copy, Check, Sparkles, Clock, Music4, Zap, Activity } from 'lucide-react';
import { FlowMatrixData } from '../types';
import { playHudClick } from '../utils/audio';

interface FlowMatrixViewProps {
  flowMatrix: FlowMatrixData | null;
  isSynthesizing: boolean;
  synthesizedText: string;
}

export const FlowMatrixView: React.FC<FlowMatrixViewProps> = ({
  flowMatrix,
  isSynthesizing,
  synthesizedText,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'BARS' | 'CADENCE_PULSE'>('BARS');

  const handleCopy = () => {
    if (!synthesizedText) return;
    navigator.clipboard.writeText(synthesizedText);
    setCopied(true);
    playHudClick('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getSchemeColor = (schemeTag: string) => {
    switch (schemeTag) {
      case 'A':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
      case 'B':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
      case 'C':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'D':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  if (!flowMatrix) {
    return (
      <div id="ai-rhyme-flow-matrix" className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-6 backdrop-blur-md text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
          <Network className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider mb-1">
          AI RHYME SCHEME & FLOW MATRIX
        </h3>
        <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto">
          Execute a write synthesis above to generate multi-syllabic rhyme mapping, cadence delivery speed, and pocket drift analysis.
        </p>
      </div>
    );
  }

  return (
    <div id="ai-rhyme-flow-matrix" className="bg-zinc-950/90 border border-purple-900/40 rounded-xl p-5 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
                AI RHYME SCHEME & FLOW MATRIX
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800/50">
                {flowMatrix.schemeType.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Syllabic cadence decomposition & harmonic rhyme topology
            </p>
          </div>
        </div>

        {/* Copy & View switcher */}
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button
              onClick={() => setActiveTab('BARS')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                activeTab === 'BARS'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Bar Breakdown
            </button>
            <button
              onClick={() => setActiveTab('CADENCE_PULSE')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                activeTab === 'CADENCE_PULSE'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cadence Pulse (16-Step)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Refactored'}</span>
          </button>
        </div>
      </div>

      {/* Cadence Telemetry Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex items-center gap-3">
          <Music4 className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Cadence Speed / BPM Fit</span>
            <span className="text-xs font-mono font-bold text-zinc-200">{flowMatrix.bpmFitLabel}</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex items-center gap-3">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Pocket Drift Tolerance</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {flowMatrix.pocketDriftMs >= 0 ? `+${flowMatrix.pocketDriftMs}` : flowMatrix.pocketDriftMs} ms (Tight Lock)
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex items-center gap-3">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Flow Topology</span>
            <span className="text-xs font-mono font-bold text-emerald-300">{flowMatrix.cadenceDescription}</span>
          </div>
        </div>
      </div>

      {/* Main View: Bar Comparison or 16-Step Beat Grid */}
      {activeTab === 'BARS' ? (
        <div className="space-y-2.5">
          {flowMatrix.bars.map((bar) => (
            <div
              key={bar.barNumber}
              className="p-3 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 rounded-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                {/* Bar ID + Scheme Tag */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300">
                    BAR {bar.barNumber.toString().padStart(2, '0')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSchemeColor(bar.schemeTag)}`}>
                    RHYME ANCHOR [{bar.schemeTag}]
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {bar.syllableCount} syllables
                  </span>
                </div>

                {/* Stress Rhythm Pattern */}
                <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400/80 bg-zinc-950/70 px-2 py-0.5 rounded border border-zinc-800/80">
                  <span className="text-[9px] text-zinc-500 uppercase mr-1">Rhythm:</span>
                  <span>{bar.stressPattern}</span>
                </div>
              </div>

              {/* Refactored Text vs Original */}
              <div className="pl-2 border-l-2 border-purple-500/60 my-1.5">
                <p className="text-sm font-mono font-bold text-white tracking-wide">
                  {bar.refactoredText}
                </p>
                {bar.originalText && bar.originalText !== bar.refactoredText && (
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">
                    Orig: {bar.originalText}
                  </p>
                )}
              </div>

              {/* Rhyme Tokens / Phoneme Anchors */}
              {bar.rhymingTokens && bar.rhymingTokens.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Rhyme Anchors:</span>
                  {bar.rhymingTokens.map((token, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/40"
                    >
                      #{token}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Cadence Pulse 16-Step Grid Visualization */
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-400">
            <span>16-Step Cadence Pulse Matrix (4/4 Beat Grid)</span>
            <span className="text-purple-400 font-bold">{flowMatrix.recommendedBpm} BPM Sync</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-16 gap-1.5 mb-3">
            {Array.from({ length: 16 }).map((_, step) => {
              const isKickDownbeat = step % 4 === 0;
              const isSnareHit = step === 4 || step === 12;
              const isAccent = step % 2 === 0;

              return (
                <div
                  key={step}
                  className={`h-12 rounded border flex flex-col items-center justify-between p-1 select-none transition-all ${
                    isSnareHit
                      ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
                      : isKickDownbeat
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : isAccent
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-600'
                  }`}
                >
                  <span className="text-[9px] font-mono font-bold">{step + 1}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isSnareHit ? 'bg-purple-400' : isKickDownbeat ? 'bg-cyan-400' : 'bg-zinc-700'
                  }`} />
                  <span className="text-[8px] font-mono uppercase">
                    {isSnareHit ? 'SNARE' : isKickDownbeat ? 'KICK' : '16TH'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 border-t border-zinc-900 pt-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-cyan-400" /> Downbeat Accent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-purple-400" /> Snare Climax
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-zinc-700" /> Off-beat Syllable Pocket
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
