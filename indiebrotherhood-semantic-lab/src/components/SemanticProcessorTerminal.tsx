import React, { useMemo } from 'react';
import { Terminal, Sparkles, Mic2, Music, Hash, Zap, RefreshCw, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { InputMode, EngineMode } from '../types';
import { analyzeTextDensity } from '../utils/analyzer';
import { playHudClick } from '../utils/audio';
import { useCoinAction } from '../../../src/useCoinAction';

interface SemanticProcessorTerminalProps {
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  inputText: string;
  onInputTextChange: (text: string) => void;
  onExecuteSynthesis: () => void;
  isSynthesizing: boolean;
  engineMode: EngineMode;
  unleashedDrive: boolean;
  bpm: number;
}

export const SemanticProcessorTerminal: React.FC<SemanticProcessorTerminalProps> = ({
  inputMode,
  onInputModeChange,
  inputText,
  onInputTextChange,
  onExecuteSynthesis,
  isSynthesizing,
  engineMode,
  unleashedDrive,
  bpm,
}) => {
  const synthesisCoin = useCoinAction('/api/synthesize');
  // Real-time dynamic syllable and rhyme density calculation
  const densityMetrics = useMemo(() => {
    return analyzeTextDensity(inputText);
  }, [inputText]);

  // Preset lyric/cadence inspiration packs
  const presets = [
    {
      label: 'Cyber-Trap Bar',
      type: 'LYRIC_REFACTOR' as InputMode,
      text: `Stepping out the shadows with the frequency locked\nDigital adrenaline, the system never stopped\nWriting in the matrix where the algorithms bleed\nSonic independence is the only law we need`,
    },
    {
      label: 'Hyper-Pop Hook',
      type: 'LYRIC_REFACTOR' as InputMode,
      text: `Glitched out memories floating in the neon haze\nFast forward everything, lost inside the data maze\nYou can feel the pressure rising in the audio wave\nReinvent the future that we came to save`,
    },
    {
      label: '16th Triplet Cadence',
      type: 'CADENCE_GENERATOR' as InputMode,
      text: `da-da-dum da-da-dum hit the kick with the slide\ntriplet bounce in the pocket cannot hide\nsyllable rush on the two and the four\nbreak down the wall and we take back the floor`,
    },
    {
      label: 'Underground Pocket',
      type: 'CADENCE_GENERATOR' as InputMode,
      text: `boom-bap cadence steady on the ninety-two\nraw lyric injection passing straight right through\ncerebral rhymes stacking up without a flaw\nIndieBrotherhood writing out the new wave law`,
    },
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    playHudClick('subtle');
    onInputModeChange(preset.type);
    onInputTextChange(preset.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSynthesizing) {
        onExecuteSynthesis();
      }
    }
  };

  return (
    <div id="semantic-processor-terminal" className="bg-zinc-950/90 border border-cyan-900/50 rounded-xl p-5 backdrop-blur-md relative overflow-hidden shadow-2xl">
      {/* Laser Scanline Beam Effect during Synthesis */}
      {isSynthesizing && (
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 pointer-events-none animate-[pulse_1s_ease-in-out_infinite]" />
      )}

      {/* Terminal Title & Dual-Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                SEMANTIC INJECTION PROCESSOR
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                DUAL-MODE HUD
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Raw lyrical injection terminal & rhythmic cadence optimization engine
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start sm:self-auto">
          <button
            id="tab-lyric-refactor"
            onClick={() => {
              playHudClick('toggle');
              onInputModeChange('LYRIC_REFACTOR');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-all ${
              inputMode === 'LYRIC_REFACTOR'
                ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            Lyric Refactoring
          </button>
          <button
            id="tab-cadence-gen"
            onClick={() => {
              playHudClick('toggle');
              onInputModeChange('CADENCE_GENERATOR');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded transition-all ${
              inputMode === 'CADENCE_GENERATOR'
                ? 'bg-purple-500 text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Cadence Generator
          </button>
        </div>
      </div>

      {/* Preset Injection Quick Bar */}
      <div className="my-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider shrink-0">
          Presets:
        </span>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handleApplyPreset(p)}
            className="px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/40 shrink-0 transition-colors flex items-center gap-1 text-[11px]"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Live Terminal Input Box */}
      <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-3 mb-4 focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
        {/* Line Numbers + Textarea Layout */}
        <div className="flex gap-3">
          <div className="select-none text-zinc-600 font-mono text-xs pt-1 space-y-1 text-right w-6">
            {Array.from({ length: Math.max(4, densityMetrics.linesCount || 1) }).map((_, i) => (
              <div key={i} className="flex items-center justify-end gap-1">
                <span className="text-[10px] text-zinc-500">{i + 1}</span>
              </div>
            ))}
          </div>

          <textarea
            id="semantic-raw-input"
            rows={5}
            value={inputText}
            onChange={(e) => onInputTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              inputMode === 'LYRIC_REFACTOR'
                ? `// Inject raw lyrics or draft bars here...\n// Real-time phonetics, syllable density, and rhyme anchors compute as you type.`
                : `// Inject cadence syllables, dummy beats, or rhythmic flows...\n// e.g.: "da-da-dum fast 16th flow on the beat"`
            }
            className="w-full bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-y leading-relaxed"
          />
        </div>

        {/* Live Line-by-Line Syllable Pill Indicators */}
        {densityMetrics.syllablesPerLine.length > 0 && (
          <div className="mt-2 pt-2 border-t border-zinc-900 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Syllables / Bar:
            </span>
            {densityMetrics.syllablesPerLine.map((count, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-cyan-300 border border-cyan-800/40"
              >
                Bar {i + 1}: <strong className="text-white">{count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* UPGRADE REQUIREMENT: Live Syllable & Rhyme Density Meter HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/90">
        
        {/* Syllable Count */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Syllables</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {densityMetrics.totalSyllables}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (densityMetrics.totalSyllables / 60) * 100)}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
            {densityMetrics.avgSyllablesPerWord} syl / word
          </span>
        </div>

        {/* Rhyme Density Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Rhyme Density</span>
            <span className="text-xs font-mono font-bold text-purple-300">
              {densityMetrics.rhymeDensityPct}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
              style={{ width: `${densityMetrics.rhymeDensityPct}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
            {densityMetrics.rhymePairsDetected.length} phoneme anchors
          </span>
        </div>

        {/* Cadence Grade */}
        <div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
            Cadence Flow
          </span>
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
            densityMetrics.cadenceGrade === 'ACCELERATED'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              : densityMetrics.cadenceGrade === 'POCKET_HEAVY'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
              : densityMetrics.cadenceGrade === 'BALANCED'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {densityMetrics.cadenceGrade}
          </span>
          <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
            {bpm} BPM target
          </span>
        </div>

        {/* Word Count & Line Stats */}
        <div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
            Structure
          </span>
          <div className="text-xs font-mono text-zinc-200">
            <strong className="text-white">{densityMetrics.totalWords}</strong> words / <strong className="text-white">{densityMetrics.linesCount}</strong> lines
          </div>
          <span className="text-[9px] font-mono text-zinc-500 mt-1 block">
            {densityMetrics.linesCount >= 4 ? 'Full Bar Ready' : 'Draft Injection'}
          </span>
        </div>

      </div>

      {/* CORE ACTION BUTTON: EXECUTE FULL WRITE SYNTHESIS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Engine ready: <strong>{engineMode}</strong> {unleashedDrive ? '(+6dB OVERDRIVE)' : ''}</span>
          <span className="hidden md:inline text-zinc-600">| Press ⌘+Enter to Synthesize</span>
        </div>

        <button
          id="execute-synthesis-btn"
          disabled={isSynthesizing || !inputText.trim() || synthesisCoin.insufficient}
          onClick={() => {
            playHudClick('synthesize');
            onExecuteSynthesis();
          }}
          className={`relative group overflow-hidden px-6 py-3 rounded-lg font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl ${
            isSynthesizing
              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
              : !inputText.trim()
              ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 text-zinc-950 hover:shadow-cyan-500/25 hover:scale-[1.01] active:scale-[0.99] border border-cyan-300'
          }`}
        >
          {isSynthesizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>SYNTHESIZING ERA MATRIX...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-zinc-950 group-hover:scale-110 transition-transform" />
              <span>{synthesisCoin.insufficient ? synthesisCoin.label : `EXECUTE FULL WRITE SYNTHESIS · ${synthesisCoin.action?.cost ?? 15} BC`}</span>
              <ArrowRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};
