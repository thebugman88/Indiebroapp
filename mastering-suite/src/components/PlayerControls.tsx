import React from 'react';
import { Play, Pause, RotateCcw, Repeat, Volume2, Split, Check, Sparkles } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  isBypassed: boolean;
  onToggleBypass: () => void;
  masterVolume: number;
  setMasterVolume: (val: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onRestart,
  currentTime,
  duration,
  onSeek,
  isLooping,
  onToggleLoop,
  isBypassed,
  onToggleBypass,
  masterVolume,
  setMasterVolume,
}) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      {/* Scrub Timeline */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-zinc-500">SCRUB TIMELINE</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="relative w-full h-3 flex items-center group cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
          />
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                isBypassed ? 'bg-zinc-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            className="absolute w-3.5 h-3.5 rounded-full bg-amber-400 shadow-md ring-2 ring-zinc-950 pointer-events-none group-hover:scale-125 transition-transform"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">

        {/* Left: Playback Triggers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Restart audio from the beginning"
            onClick={onRestart}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition active:scale-95"
            title="Return to Start (0:00)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="play-pause-btn"
            onClick={onTogglePlay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play Master</span>
              </>
            )}
          </button>

          <button
            type="button"
            aria-label={isLooping ? 'Disable audio loop' : 'Enable audio loop'}
            onClick={onToggleLoop}
            className={`p-2.5 rounded-xl border transition active:scale-95 ${
              isLooping
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-800 text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
            title={isLooping ? 'Loop Active' : 'Enable Loop'}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: A/B Seamless Studio Audition Toggle */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 shadow-inner">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (!isBypassed) onToggleBypass();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                isBypassed
                  ? 'bg-zinc-800 text-zinc-100 shadow border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>A: Raw Source</span>
              {isBypassed && <span className="w-2 h-2 rounded-full bg-zinc-300 inline-block" />}
            </button>

            <button
              onClick={() => {
                if (isBypassed) onToggleBypass();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                !isBypassed
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>B: Mastered Chain</span>
              {!isBypassed && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />}
            </button>
          </div>

        </div>

        {/* Right: Master Output Volume */}
        <div className="flex items-center gap-2 min-w-[130px]">
          <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

      </div>
    </div>
  );
};
