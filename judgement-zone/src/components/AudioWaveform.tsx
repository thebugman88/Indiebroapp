import React, { useEffect, useRef } from 'react';
import { Lock, RotateCcw, AlertTriangle } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface AudioWaveformProps {
  isPlaying: boolean;
  currentTime: number;
  maxListenedTime: number;
  duration: number;
  onSeekAttempt: (time: number) => void;
  onRewind: () => void;
  isBlindMode?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  currentTime,
  maxListenedTime,
  duration,
  onSeekAttempt,
  onRewind,
  isBlindMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate 48 procedural bar heights
  const barsCount = 48;
  const barHeightsRef = useRef<number[]>(
    Array.from({ length: 48 }, (_, i) => 0.25 + 0.7 * Math.abs(Math.sin((i * 0.4) + 1.2) * Math.cos(i * 0.2)))
  );

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = audioEngine.getAnalyser();
      let freqData: Uint8Array | null = null;
      if (analyser && isPlaying) {
        freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
      }

      const barWidth = Math.max(3, (width - (barsCount - 1) * 3) / barsCount);
      const progressRatio = duration > 0 ? currentTime / duration : 0;
      const maxListenRatio = duration > 0 ? maxListenedTime / duration : 0;
      const threshold50Ratio = 0.5;

      for (let i = 0; i < barsCount; i++) {
        const barRatio = i / barsCount;
        const x = i * (barWidth + 3);

        let dynamicScale = barHeightsRef.current[i];
        if (freqData && isPlaying) {
          const freqIndex = Math.floor((i / barsCount) * freqData.length);
          const val = freqData[freqIndex] / 255;
          dynamicScale = Math.max(0.15, val * 0.9 + dynamicScale * 0.3);
        } else if (isPlaying) {
          dynamicScale = Math.max(0.2, dynamicScale + 0.15 * Math.sin(Date.now() * 0.008 + i));
        }

        const barHeight = Math.max(6, dynamicScale * (height - 12));
        const y = (height - barHeight) / 2;

        // Color coding
        if (barRatio <= progressRatio) {
          // Active playing (Amber Gold)
          ctx.fillStyle = '#f59e0b';
        } else if (barRatio <= maxListenRatio) {
          // Already listened territory (Teal/Emerald)
          ctx.fillStyle = '#10b981';
        } else {
          // Locked unlistened territory (Dim Zinc)
          ctx.fillStyle = '#3f3f46';
        }

        // Draw rounded rectangle bar
        ctx.beginPath();
        const radius = Math.min(2, barWidth / 2);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentTime, maxListenedTime, duration]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;
    onSeekAttempt(targetTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const maxPercent = duration > 0 ? Math.min(100, (maxListenedTime / duration) * 100) : 0;
  const is50PercentReached = maxListenedTime >= duration * 0.5;
  const is100PercentReached = maxListenedTime >= duration * 0.99;

  return (
    <div id="audio-waveform-container" className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Top Indicators */}
      <div className="flex items-center justify-between text-xs font-mono mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {isBlindMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              <Lock className="w-3 h-3 text-amber-400" /> Fast-Forward Locked
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${is50PercentReached ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className={is50PercentReached ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
              50% Gate {is50PercentReached ? '✓ Met' : `(${Math.round((maxListenedTime / (duration * 0.5)) * 100)}%)`}
            </span>
          </div>

          <button
            id="waveform-rewind-btn"
            onClick={onRewind}
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition active:scale-95 text-xs"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>-10s</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas with Interactive Overlay */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="relative w-full h-20 sm:h-24 cursor-pointer group select-none"
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={96}
          className="w-full h-full block"
        />

        {/* 50% Threshold Gate Marker Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-dashed border-r border-dashed border-emerald-500/70 pointer-events-none z-10"
          style={{ left: '50%' }}
        >
          <div className="absolute -top-1 -translate-x-1/2 bg-emerald-950 text-emerald-300 text-[10px] font-mono px-1.5 py-0.2 rounded border border-emerald-600/50 shadow">
            50% Gate
          </div>
        </div>

        {/* Lock Overlay on Unlistened Segment */}
        {maxPercent < 98 && (
          <div
            className="absolute top-0 bottom-0 right-0 bg-zinc-950/40 pointer-events-none border-l border-zinc-700/50 flex items-center justify-end pr-2 transition-all"
            style={{ width: `${100 - maxPercent}%` }}
          >
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
              <Lock className="w-2.5 h-2.5 text-zinc-400" />
              <span className="hidden sm:inline">Locked</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress & Milestone Bar */}
      <div className="mt-3 relative">
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800 relative">
          {/* Max listened territory background */}
          <div
            className="h-full bg-emerald-900/50 transition-all duration-200"
            style={{ width: `${maxPercent}%` }}
          />
          {/* Current playback head */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 absolute top-0 left-0 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center justify-between mt-2.5 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          {is100PercentReached ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              ★ 100% Full Listen (+50 XP Bonus Unlocked)
            </span>
          ) : is50PercentReached ? (
            <span className="text-emerald-400">
              ✓ 50% Threshold Unlocked (Judgement Ready)
            </span>
          ) : (
            <span className="text-zinc-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Listen to at least 50% to submit verdict
            </span>
          )}
        </span>
        <span className="font-mono text-zinc-500">
          Audition Progress: {Math.round(progressPercent)}%
        </span>
      </div>
    </div>
  );
};
