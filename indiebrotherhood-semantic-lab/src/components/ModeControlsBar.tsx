import React, { useState } from 'react';
import { Sparkles, Flame, Sliders, Volume2, VolumeX, Disc, Gauge, Zap } from 'lucide-react';
import { EngineMode, EraPreset } from '../types';
import { playHudClick, setSoundEnabled, isSoundEnabled } from '../utils/audio';

interface ModeControlsBarProps {
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;
  unleashedDrive: boolean;
  onUnleashedDriveChange: (drive: boolean) => void;
  eraPreset: EraPreset;
  onEraPresetChange: (era: EraPreset) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export const ModeControlsBar: React.FC<ModeControlsBarProps> = ({
  engineMode,
  onEngineModeChange,
  unleashedDrive,
  onUnleashedDriveChange,
  eraPreset,
  onEraPresetChange,
  bpm,
  onBpmChange,
}) => {
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const handleSoundToggle = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playHudClick('toggle');
  };

  const handleModeToggle = (mode: EngineMode) => {
    playHudClick('mode');
    onEngineModeChange(mode);
  };

  const handleDriveToggle = () => {
    playHudClick('toggle');
    onUnleashedDriveChange(!unleashedDrive);
  };

  const handleTapTempo = () => {
    playHudClick('subtle');
    const now = performance.now();
    const newTaps = [...tapTimes.slice(-3), now];
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 60 && calculatedBpm <= 200) {
        onBpmChange(calculatedBpm);
      }
    }
  };

  const eraOptions: Array<{ id: EraPreset; label: string; tag: string }> = [
    { id: 'NEO_CYBER_2026', label: 'Neo-Cyber 2026', tag: 'KINETIC' },
    { id: 'HYPERPOP_GLITCH', label: 'Hyper-Pop Glitch', tag: 'HIGH FREQ' },
    { id: 'DARK_TRAP_WAVE', label: 'Dark Trap Wave', tag: 'HEAVY 808' },
    { id: 'ANALOG_SYNTHWAVE', label: 'Analog Synthwave', tag: 'WARM TAPE' },
    { id: 'INDIE_ALT_GRUNGE', label: 'Indie Alt Grunge', tag: 'RAW DRIVE' },
    { id: 'AFRO_FUSION_FUTURE', label: 'Afro-Fusion 3.0', tag: 'POLYRHYTHM' },
  ];

  return (
    <div id="mode-controls-bar" className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-4 backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Mode Switcher (CLEAN vs UNLEASHED) & UNLEASHED_DRIVE */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Engine Mode Buttons */}
          <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button
              id="mode-clean-btn"
              onClick={() => handleModeToggle('CLEAN')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                engineMode === 'CLEAN'
                  ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              CLEAN MODE
            </button>
            <button
              id="mode-unleashed-btn"
              onClick={() => handleModeToggle('UNLEASHED')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                engineMode === 'UNLEASHED'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              UNLEASHED
            </button>
          </div>

          {/* UNLEASHED_DRIVE Toggle Switch */}
          <button
            id="unleashed-drive-toggle"
            onClick={handleDriveToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              unleashedDrive
                ? 'bg-amber-950/60 border-amber-500/70 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
              unleashedDrive ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-700'
            }`}>
              {unleashedDrive && <Zap className="w-2 h-2 text-zinc-950" />}
            </div>
            <span className="font-bold">UNLEASHED_DRIVE</span>
            <span className={`text-[10px] px-1 rounded ${unleashedDrive ? 'bg-amber-500/20 text-amber-200' : 'bg-zinc-800 text-zinc-500'}`}>
              {unleashedDrive ? '+6dB ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Right: Era Selector, BPM Pocket Control, and Audio FX toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Era Preset Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
            <Disc className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">ERA:</span>
            <select
              id="era-preset-select"
              value={eraPreset}
              onChange={(e) => {
                playHudClick('subtle');
                onEraPresetChange(e.target.value as EraPreset);
              }}
              className="bg-transparent text-xs font-mono text-cyan-300 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {eraOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-zinc-900 text-zinc-200">
                  {opt.label} ({opt.tag})
                </option>
              ))}
            </select>
          </div>

          {/* BPM Pocket slider & Tap Tempo */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
            <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[10px] font-mono text-zinc-500">BPM:</span>
            <input
              id="bpm-slider"
              type="range"
              min="70"
              max="180"
              value={bpm}
              onChange={(e) => onBpmChange(Number(e.target.value))}
              className="w-16 accent-cyan-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <span className="text-xs font-mono font-bold text-cyan-300 w-7 text-right">
              {bpm}
            </span>
            <button
              onClick={handleTapTempo}
              title="Tap tempo to sync"
              className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 active:scale-95 transition-all"
            >
              TAP
            </button>
          </div>

          {/* Audio HUD Mute Toggle */}
          <button
            id="sound-fx-toggle"
            onClick={handleSoundToggle}
            title={soundActive ? 'Mute HUD Audio Feedback' : 'Enable HUD Audio Feedback'}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundActive
                ? 'bg-zinc-900 border-zinc-800 text-cyan-400 hover:border-cyan-500/40'
                : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
