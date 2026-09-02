import React from 'react';
import {
  Sliders,
  Sparkles,
  Waves,
  Zap,
  VolumeX,
  Radio,
  Compass,
  Cpu,
  Layers,
  Check,
  RotateCcw,
  AudioWaveform,
  ShieldCheck
} from 'lucide-react';
import { MasteringPreset, GenreType } from '../types';
import { GENRE_PRESETS } from '../audio/presets';

interface MasteringConsoleProps {
  preset: MasteringPreset;
  setPreset: React.Dispatch<React.SetStateAction<MasteringPreset>>;
  onResetPreset: () => void;
}

export const MasteringConsole: React.FC<MasteringConsoleProps> = ({
  preset,
  setPreset,
  onResetPreset,
}) => {
  const handleGenreChange = (genre: GenreType) => {
    const template = GENRE_PRESETS[genre];
    if (template) {
      setPreset({ ...template });
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* 1. GENRE SELECTION & PROFILING BAR */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-['Space_Grotesk']">
                Acoustic Intelligence Genre Profile
              </h3>
              <p className="text-[11px] text-zinc-400">
                Calibrates multiband curves, harmonic saturation, transient punch, and headroom for your exact musical style.
              </p>
            </div>
          </div>

          <button
            onClick={onResetPreset}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Genre Default</span>
          </button>
        </div>

        {/* Genre Pill Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {(Object.keys(GENRE_PRESETS) as GenreType[]).map((gKey) => {
            const g = GENRE_PRESETS[gKey];
            const isSelected = preset.genre === gKey;

            return (
              <button
                key={gKey}
                onClick={() => handleGenreChange(gKey)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                    {g.name.split('&')[0].trim()}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                  {g.description.split(',')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CORE MASTERING MODULES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* MODULE 1: INTELLIGENT AUDIO CLEANUP */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <VolumeX className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Audio Cleanup & De-Noise
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Stage 01 • Dynamic Scrub</span>
                </div>
              </div>

              {/* Power Toggle */}
              <button
                onClick={() =>
                  setPreset((prev) => ({
                    ...prev,
                    cleanup: { ...prev.cleanup, enabled: !prev.cleanup.enabled },
                  }))
                }
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  preset.cleanup.enabled ? 'bg-cyan-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${
                    preset.cleanup.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-3.5 transition-opacity ${preset.cleanup.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

              {/* De-Hum 50/60Hz Notch */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-zinc-300">50Hz / 60Hz Mains De-Hum</span>
                  <p className="text-[10px] text-zinc-500">Applies narrow 50 Hz and 60 Hz notch filters</p>
                </div>
                <input
                  type="checkbox"
                  checked={preset.cleanup.deHum}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      cleanup: { ...prev.cleanup, deHum: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-cyan-500 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Sub-Rumble High Pass */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Sub-Rumble Cutoff</span>
                  <span className="text-cyan-400 font-semibold">{preset.cleanup.highPassFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={60}
                  step={1}
                  value={preset.cleanup.highPassFreq}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      cleanup: { ...prev.cleanup, highPassFreq: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* De-Harsh Sibilance Tamer */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">De-Harsh / De-Esser (6.5kHz)</span>
                  <span className="text-cyan-400 font-semibold">{preset.cleanup.deHarshAmount}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={preset.cleanup.deHarshAmount}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      cleanup: { ...prev.cleanup, deHarsh: true, deHarshAmount: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Ultrasonic Low-Pass */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Ultrasonic Ceiling</span>
                  <span className="text-cyan-400 font-semibold">{(preset.cleanup.lowPassFreq / 1000).toFixed(1)} kHz</span>
                </div>
                <input
                  type="range"
                  min={16000}
                  max={22000}
                  step={500}
                  value={preset.cleanup.lowPassFreq}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      cleanup: { ...prev.cleanup, lowPassFreq: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Web Audio cleanup filters</span>
          </div>
        </div>

        {/* MODULE 2: BASS BOOST & SUB DYNAMICS */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AudioWaveform className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Bass Boost & Sub Dynamics
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Stage 02 • Low-End Drive</span>
                </div>
              </div>

              {/* Power Toggle */}
              <button
                onClick={() =>
                  setPreset((prev) => ({
                    ...prev,
                    bass: { ...prev.bass, enabled: !prev.bass.enabled },
                  }))
                }
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  preset.bass.enabled ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${
                    preset.bass.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-3.5 transition-opacity ${preset.bass.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

              {/* Sub-Bass Boost dB */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Sub-Bass Boost</span>
                  <span className="text-amber-400 font-semibold">+{preset.bass.subBoostDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={9}
                  step={0.2}
                  value={preset.bass.subBoostDb}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      bass: { ...prev.bass, subBoostDb: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Sub Frequency Tuning */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Sub-Bass Center Freq</span>
                  <span className="text-amber-400 font-semibold">{preset.bass.subFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={90}
                  step={1}
                  value={preset.bass.subFreq}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      bass: { ...prev.bass, subFreq: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Punch dB (115Hz) */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Kick & 808 Transient Punch</span>
                  <span className="text-amber-400 font-semibold">+{preset.bass.punchDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={7}
                  step={0.2}
                  value={preset.bass.punchDb}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      bass: { ...prev.bass, punchDb: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Sub Harmonic Generator */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Sub-Harmonic Exciter</span>
                  <span className="text-amber-400 font-semibold">{preset.bass.subHarmonics}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={preset.bass.subHarmonics}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      bass: { ...prev.bass, subHarmonics: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Mono Bass Fold */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Mono Low-End Fold (Club Spec)</span>
                  <span className="text-amber-400 font-semibold">{preset.bass.monoBelowFreq === 0 ? 'OFF' : `${preset.bass.monoBelowFreq} Hz`}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={160}
                  step={10}
                  value={preset.bass.monoBelowFreq}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      bass: { ...prev.bass, monoBelowFreq: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Mono Sub-Phase Coherence Active</span>
          </div>
        </div>

        {/* MODULE 3: CLARITY, PRESENCE & AIR */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Clarity, Air & Presence
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Stage 03 • Top-End Sheen</span>
                </div>
              </div>

              {/* Power Toggle */}
              <button
                onClick={() =>
                  setPreset((prev) => ({
                    ...prev,
                    clarity: { ...prev.clarity, enabled: !prev.clarity.enabled },
                  }))
                }
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  preset.clarity.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${
                    preset.clarity.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-3.5 transition-opacity ${preset.clarity.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

              {/* Air Shelf >12kHz */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Air Band Shelf (&gt;12.5kHz)</span>
                  <span className="text-emerald-400 font-semibold">+{preset.clarity.airDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={0.2}
                  value={preset.clarity.airDb}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      clarity: { ...prev.clarity, airDb: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Presence Boost (4.2kHz) */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Mid Presence (4.2kHz)</span>
                  <span className="text-emerald-400 font-semibold">+{preset.clarity.presenceDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={0.2}
                  value={preset.clarity.presenceDb}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      clarity: { ...prev.clarity, presenceDb: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Vocal Shine */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Vocal Shine & Intelligibility</span>
                  <span className="text-emerald-400 font-semibold">{preset.clarity.vocalShine}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={preset.clarity.vocalShine}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      clarity: { ...prev.clarity, vocalShine: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>High-frequency EQ controls</span>
          </div>
        </div>

        {/* MODULE 4: SONIC HD (ANALOG SATURATION & GLUE) */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Sonic HD & Analog Warmth
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Stage 04 • 4x Oversampled DSP</span>
                </div>
              </div>

              {/* Power Toggle */}
              <button
                onClick={() =>
                  setPreset((prev) => ({
                    ...prev,
                    sonicHd: { ...prev.sonicHd, enabled: !prev.sonicHd.enabled },
                  }))
                }
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  preset.sonicHd.enabled ? 'bg-purple-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${
                    preset.sonicHd.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-3.5 transition-opacity ${preset.sonicHd.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

              {/* Mode Selection */}
              <div>
                <span className="text-xs font-medium text-zinc-400 block mb-1.5">Harmonic Engine Mode</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['tube', 'tape', 'console', 'solid-state'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() =>
                        setPreset((prev) => ({
                          ...prev,
                          sonicHd: { ...prev.sonicHd, mode },
                        }))
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                        preset.sonicHd.mode === mode
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drive % */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Harmonic Saturation Drive</span>
                  <span className="text-purple-400 font-semibold">{preset.sonicHd.drive}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={preset.sonicHd.drive}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      sonicHd: { ...prev.sonicHd, drive: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              {/* Warmth % */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Analog Transformer Warmth</span>
                  <span className="text-purple-400 font-semibold">{preset.sonicHd.warmth}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={preset.sonicHd.warmth}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      sonicHd: { ...prev.sonicHd, warmth: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              {/* Analog Bus Glue Compressor */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Console Bus Glue Compression</span>
                  <span className="text-purple-400 font-semibold">{preset.sonicHd.analogGlue}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={preset.sonicHd.analogGlue}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      sonicHd: { ...prev.sonicHd, analogGlue: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>4x Anti-Aliased WaveShaper</span>
          </div>
        </div>

        {/* MODULE 5: SPATIAL IMAGING */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Spatial Imaging
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Stage 05 • Mid/Side and Room Texture</span>
                </div>
              </div>

              {/* Power Toggle */}
              <button
                onClick={() =>
                  setPreset((prev) => ({
                    ...prev,
                    spatial: { ...prev.spatial, enabled: !prev.spatial.enabled },
                  }))
                }
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                  preset.spatial.enabled ? 'bg-blue-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${
                    preset.spatial.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`space-y-3.5 transition-opacity ${preset.spatial.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

              {/* Spatial Mode */}
              <div>
                <span className="text-xs font-medium text-zinc-400 block mb-1.5">Spatial Imager Topology</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'mid-side', label: 'Mid / Side' },
                      { id: 'synthetic-room', label: 'Synthetic Room' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() =>
                        setPreset((prev) => ({
                          ...prev,
                          spatial: { ...prev.spatial, mode: m.id },
                        }))
                      }
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition truncate ${
                        preset.spatial.mode === m.id
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                          : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stereo Width % */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Stereo Field Width</span>
                  <span className="text-blue-400 font-semibold">{preset.spatial.stereoWidth}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  step={5}
                  value={preset.spatial.stereoWidth}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      spatial: { ...prev.spatial, stereoWidth: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>

              {/* Surround Spread */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">3D Surround Impulse Spread</span>
                  <span className="text-blue-400 font-semibold">{preset.spatial.surroundSpread}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={preset.spatial.surroundSpread}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      spatial: { ...prev.spatial, surroundSpread: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Mid/side width with optional synthetic room texture</span>
          </div>
        </div>

        {/* MODULE 6: STORE TARGET & BRICKWALL LIMITER */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Store Loudness & Limiter
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">Stage 06 • Compressor and Output Ceiling</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">

              {/* Output ceiling */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Output Ceiling</span>
                  <span className="text-emerald-400 font-semibold">{preset.loudness.ceilingDb.toFixed(1)} dBFS</span>
                </div>
                <input
                  type="range"
                  min={-2.0}
                  max={-0.1}
                  step={0.1}
                  value={preset.loudness.ceilingDb}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      loudness: { ...prev.loudness, ceilingDb: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Input Gain Drive */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Limiter Input Drive Gain</span>
                  <span className="text-amber-400 font-semibold">+{preset.loudness.inputGainDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min={-6}
                  max={12}
                  step={0.2}
                  value={preset.loudness.inputGainDb}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      loudness: { ...prev.loudness, inputGainDb: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Limiter Release */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-400">Limiter Release</span>
                  <span className="text-zinc-300 font-semibold">{preset.loudness.limiterRelease} ms</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={300}
                  step={5}
                  value={preset.loudness.limiterRelease}
                  onChange={(e) =>
                    setPreset((prev) => ({
                      ...prev,
                      loudness: { ...prev.loudness, limiterRelease: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample-Peak Output Guard</span>
          </div>
        </div>

      </div>

    </div>
  );
};
