import React, { useEffect, useRef, useState } from 'react';
import { Activity, Radio, BarChart3, Gauge, Eye, Disc3 } from 'lucide-react';
import { AudioMetrics } from '../types';

interface VisualizerPanelProps {
  analyserL: AnalyserNode | null;
  analyserR: AnalyserNode | null;
  analyserPost: AnalyserNode | null;
  isPlaying: boolean;
  metrics: AudioMetrics;
  isBypassed: boolean;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  analyserL,
  analyserR,
  analyserPost,
  isPlaying,
  metrics,
  isBypassed,
}) => {
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'spectrum' | 'goniometer' | 'both'>('both');

  // Real-time animation loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      // 1. Spectrum Analyzer Canvas
      if (spectrumCanvasRef.current && analyserPost) {
        const canvas = spectrumCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const bufferLength = analyserPost.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserPost.getByteFrequencyData(dataArray);

          ctx.fillStyle = '#09090b'; // dark zinc bg
          ctx.fillRect(0, 0, width, height);

          // Draw frequency grid lines
          ctx.strokeStyle = '#27272a';
          ctx.lineWidth = 1;
          const gridFreqs = [60, 250, 1000, 4000, 10000, 16000];
          for (let f of gridFreqs) {
            const x = Math.log10(f / 20) / Math.log10(20000 / 20) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            ctx.fillStyle = '#71717a';
            ctx.font = '9px JetBrains Mono';
            ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x + 2, height - 4);
          }

          // Spectrum Fill Gradient
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          if (isBypassed) {
            gradient.addColorStop(0, 'rgba(161, 161, 170, 0.8)');
            gradient.addColorStop(0.6, 'rgba(113, 113, 122, 0.4)');
            gradient.addColorStop(1, 'rgba(39, 39, 42, 0.05)');
          } else {
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)'); // amber-500
            gradient.addColorStop(0.3, 'rgba(217, 119, 6, 0.7)');
            gradient.addColorStop(0.7, 'rgba(180, 83, 9, 0.4)');
            gradient.addColorStop(1, 'rgba(20, 20, 25, 0.05)');
          }

          ctx.beginPath();
          ctx.moveTo(0, height);

          const barWidth = width / 180;
          for (let i = 0; i < 180; i++) {
            // Logarithmic frequency bin distribution
            const bin = Math.floor(Math.pow(i / 180, 2.2) * (bufferLength * 0.75));
            const value = dataArray[bin] || 0;
            const percent = value / 255;
            const barHeight = percent * (height - 12);
            const x = i * barWidth;
            const y = height - barHeight;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          // Stroke line
          ctx.strokeStyle = isBypassed ? '#d4d4d8' : '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // 2. Goniometer / Stereo Phase Vectorscope
      if (phaseCanvasRef.current && analyserL && analyserR) {
        const canvas = phaseCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const centerY = height / 2;

          const bufferLength = 1024;
          const dataL = new Float32Array(bufferLength);
          const dataR = new Float32Array(bufferLength);
          analyserL.getFloatTimeDomainData(dataL);
          analyserR.getFloatTimeDomainData(dataR);

          // Fade trails
          ctx.fillStyle = 'rgba(9, 9, 11, 0.25)';
          ctx.fillRect(0, 0, width, height);

          // Grid Crosshairs & 45 degree stereo diagonals
          ctx.strokeStyle = '#27272a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Diagonal L / R axes (rotated 45 deg)
          ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
          ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
          ctx.moveTo(centerX - 40, centerY - 40); ctx.lineTo(centerX + 40, centerY + 40);
          ctx.moveTo(centerX - 40, centerY + 40); ctx.lineTo(centerX + 40, centerY - 40);
          ctx.stroke();

          // Plot Lissajous points
          ctx.strokeStyle = isBypassed ? 'rgba(161, 161, 170, 0.7)' : 'rgba(245, 158, 11, 0.85)';
          ctx.fillStyle = isBypassed ? '#e4e4e7' : '#fef08a';
          ctx.lineWidth = 1.2;

          ctx.beginPath();
          for (let i = 0; i < bufferLength; i += 3) {
            const l = dataL[i] || 0;
            const r = dataR[i] || 0;

            // Rotate 45 degrees: X = (L - R) / sqrt(2), Y = -(L + R) / sqrt(2)
            const x = centerX + ((l - r) * 0.707) * (width * 0.42);
            const y = centerY - ((l + r) * 0.707) * (height * 0.42);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyserL, analyserR, analyserPost, isPlaying, isBypassed]);

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 lg:p-5 shadow-2xl backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-['Space_Grotesk']">
              Live Visualizer & Source Estimates
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono">
              FFT Stereo Spectrum • Goniometer Lissajous Phase • Input level estimates
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              viewMode === 'both' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Combined
          </button>
          <button
            onClick={() => setViewMode('spectrum')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              viewMode === 'spectrum' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            FFT
          </button>
          <button
            onClick={() => setViewMode('goniometer')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              viewMode === 'goniometer' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Stereo Phase
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* FFT Spectrum Display */}
        {(viewMode === 'both' || viewMode === 'spectrum') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col gap-1.5`}>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Real-Time FFT Spectrum (20Hz - 20kHz)</span>
              </span>
              <span className={isBypassed ? 'text-zinc-400 font-bold' : 'text-amber-400 font-bold'}>
                {isBypassed ? '[RAW SOURCE AUDITION]' : '[MASTERED CHAIN ACTIVE]'}
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 h-44 shadow-inner">
              <canvas
                ref={spectrumCanvasRef}
                width={720}
                height={200}
                className="w-full h-full block"
              />
              <div className="absolute top-2 left-2 pointer-events-none flex gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-400 border border-zinc-800">
                  0 dB
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-400 border border-zinc-800">
                  -24 dB
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-400 border border-zinc-800">
                  -48 dB
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Goniometer / Phase Scope */}
        {(viewMode === 'both' || viewMode === 'goniometer') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-4' : 'lg:col-span-12'} flex flex-col gap-1.5`}>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Stereo Vectorscope & Phase</span>
              </span>
              <span className="text-zinc-400">
                Input corr: <strong className={metrics.phaseCorrelation >= 0 ? 'text-emerald-400' : 'text-red-400'}>{metrics.phaseCorrelation > 0 ? `+${metrics.phaseCorrelation}` : metrics.phaseCorrelation}</strong>
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 h-44 flex items-center justify-center shadow-inner">
              <canvas
                ref={phaseCanvasRef}
                width={260}
                height={200}
                className="w-full h-full block"
              />
              <div className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[9px] font-mono text-zinc-500 pointer-events-none">
                <span>+L (100%)</span>
                <span>MONO (M)</span>
                <span>+R (100%)</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Phase 1 meters use RMS-derived loudness estimates and sample peaks. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-3 border-t border-zinc-800/80">

        {/* Whole-buffer loudness estimate */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Input Loudness Estimate</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-amber-400 tracking-tight">
              {metrics.integratedLUFS > -60 ? metrics.integratedLUFS : '-∞'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">dB est.</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, (metrics.integratedLUFS + 30) * 3.3))}%` }}
            />
          </div>
        </div>

        {/* Phase 1 uses the same whole-buffer estimate here. */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Input Level Estimate</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-zinc-200 tracking-tight">
              {metrics.shortTermLUFS > -60 ? metrics.shortTermLUFS : '-∞'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">dB est.</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, (metrics.shortTermLUFS + 30) * 3.3))}%` }}
            />
          </div>
        </div>

        {/* Input sample peak */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Input Sample Peak</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-lg font-bold font-mono tracking-tight ${metrics.truePeakDb > -0.1 ? 'text-red-400' : 'text-emerald-400'}`}>
              {metrics.truePeakDb > -60 ? (metrics.truePeakDb > 0 ? `+${metrics.truePeakDb}` : metrics.truePeakDb) : '-∞'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">dBFS</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-150 ${metrics.truePeakDb > -0.1 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, (metrics.truePeakDb + 40) * 2.5))}%` }}
            />
          </div>
        </div>

        {/* Dynamic Range PLR */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Input Peak/RMS Range</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-cyan-400 tracking-tight">
              {metrics.dynamicRangePLR > 0 ? `${metrics.dynamicRangePLR}` : '0.0'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">dB</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, (metrics.dynamicRangePLR / 20) * 100)}%` }}
            />
          </div>
        </div>

        {/* Phase Correlation Bar */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Phase Alignment</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-lg font-bold font-mono tracking-tight ${metrics.phaseCorrelation >= 0.2 ? 'text-emerald-400' : metrics.phaseCorrelation >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {metrics.phaseCorrelation >= 0 ? `+${metrics.phaseCorrelation}` : metrics.phaseCorrelation}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">r</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 relative">
            <div
              className={`h-full rounded-full transition-all duration-150 ${metrics.phaseCorrelation >= 0 ? 'bg-emerald-400' : 'bg-red-500'}`}
              style={{ width: `${((metrics.phaseCorrelation + 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Stereo VU Balance */}
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Stereo L/R RMS</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span>L</span>
                <span>{(metrics.rmsL * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, metrics.rmsL * 180)}%` }} />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span>R</span>
                <span>{(metrics.rmsR * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, metrics.rmsR * 180)}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
