import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Radio, Zap, Clock, ShieldCheck, Flame } from 'lucide-react';
import { TrajectoryPoint } from '../types';

interface EraTrajectoryChartProps {
  peakProbability: number;
  sonicSaturation: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX_OVERDRIVE';
  eraCompatibility: 'OPTIMAL' | 'SUB-OPTIMAL' | 'BREAKTHROUGH_PIONEER';
  isSynthesizing: boolean;
  unleashedDrive: boolean;
}

export const EraTrajectoryChart: React.FC<EraTrajectoryChartProps> = ({
  peakProbability,
  sonicSaturation,
  eraCompatibility,
  isSynthesizing,
  unleashedDrive,
}) => {
  const [activeRange, setActiveRange] = useState<'6H' | '12H' | '24H'>('6H');
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryPoint[]>([
    { timeLabel: 'T-6h', frequency: 12.4, probability: 74.2, velocity: 1.1 },
    { timeLabel: 'T-5h', frequency: 14.8, probability: 79.5, velocity: 1.4 },
    { timeLabel: 'T-4h', frequency: 13.2, probability: 83.1, velocity: 1.8 },
    { timeLabel: 'T-3h', frequency: 16.5, probability: 87.8, velocity: 2.2 },
    { timeLabel: 'T-2h', frequency: 18.2, probability: 91.4, velocity: 2.6 },
    { timeLabel: 'T-1h', frequency: 19.6, probability: 94.7, velocity: 3.1 },
    { timeLabel: 'NOW', frequency: 22.1, probability: peakProbability || 98.2, velocity: 3.8 },
  ]);

  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryPoint | null>(null);

  // Live update the current "NOW" point when peak probability changes
  useEffect(() => {
    setTrajectoryData(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = {
        ...copy[copy.length - 1],
        probability: peakProbability || 98.2,
        frequency: unleashedDrive ? 24.8 : 22.1,
      };
      return copy;
    });
  }, [peakProbability, unleashedDrive]);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 160;
  const padding = { top: 20, right: 30, bottom: 25, left: 35 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Min/Max for chart scaling
  const minProb = 65;
  const maxProb = 100;

  const points = trajectoryData.map((d, i) => {
    const x = padding.left + (i / (trajectoryData.length - 1)) * graphWidth;
    const y = padding.top + (1 - (d.probability - minProb) / (maxProb - minProb)) * graphHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    // Smooth bezier curve
    const prev = points[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding.bottom} L ${points[0].x} ${svgHeight - padding.bottom} Z`;

  return (
    <div id="era-trajectory-analytics" className="relative bg-zinc-950/80 border border-cyan-900/40 rounded-xl p-5 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header telemetry */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                GLOBAL ERA TRAJECTORY & ANALYTICS
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                v5.0 ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Tracking Frequency Spectrum (kHz) vs. Predictive ERA Probability (T-6h to NOW)
            </p>
          </div>
        </div>

        {/* Range filter buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1 rounded-lg">
          {(['6H', '12H', '24H'] as const).map(range => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-2.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                activeRange === range
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metric Highlights Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Metric 1: Peak Probability */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Peak Probability
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-cyan-300">
                {peakProbability.toFixed(1)}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +4.2%
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className={`w-5 h-5 ${isSynthesizing ? 'animate-spin' : ''}`} />
          </div>
        </div>

        {/* Metric 2: Sonic Saturation */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Sonic Saturation
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-base font-mono font-bold ${
                sonicSaturation === 'HIGH' || sonicSaturation === 'MAX_OVERDRIVE'
                  ? 'text-amber-400'
                  : sonicSaturation === 'MEDIUM'
                  ? 'text-cyan-300'
                  : 'text-emerald-300'
              }`}>
                {sonicSaturation}
              </span>
              {unleashedDrive && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5" /> +6dB
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Era Compatibility */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Era Compatibility
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded inline-block ${
              eraCompatibility === 'BREAKTHROUGH_PIONEER'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                : eraCompatibility === 'OPTIMAL'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                : 'bg-yellow-950 text-yellow-300 border border-yellow-500/50'
            }`}>
              {eraCompatibility.replace('_', ' ')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SVG Trajectory Chart */}
      <div className="relative z-10 w-full bg-zinc-950/90 border border-zinc-800/90 rounded-lg p-2.5">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-36 sm:h-44 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[70, 80, 90, 100].map(val => {
            const y = padding.top + (1 - (val - minProb) / (maxProb - minProb)) * graphHeight;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-zinc-500 font-mono"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Area fill under curve */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Main trajectory path */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Data Points */}
          {points.map((pt, idx) => {
            const isLast = idx === points.length - 1;
            const isHovered = hoveredPoint?.timeLabel === pt.data.timeLabel;

            return (
              <g
                key={pt.data.timeLabel}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(pt.data)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Outer pulsing ring on current point */}
                {isLast && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    className="fill-cyan-400/20 animate-ping"
                  />
                )}

                {/* Point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : isLast ? 4.5 : 3.5}
                  className={`${
                    isLast
                      ? 'fill-cyan-300 stroke-purple-500 stroke-2'
                      : isHovered
                      ? 'fill-cyan-200 stroke-cyan-400 stroke-2'
                      : 'fill-zinc-900 stroke-cyan-400 stroke-[1.5]'
                  } transition-all duration-150`}
                />

                {/* X Axis Time Labels */}
                <text
                  x={pt.x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  className={`text-[9px] font-mono ${
                    isLast ? 'fill-cyan-300 font-bold' : 'fill-zinc-500'
                  }`}
                >
                  {pt.data.timeLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Point Tooltip / Live Inspector HUD */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-zinc-900/95 border border-cyan-500/40 rounded px-2.5 py-1.5 shadow-xl text-[11px] font-mono z-20 pointer-events-none flex items-center gap-3">
            <span className="text-zinc-400 font-semibold">{hoveredPoint.timeLabel}</span>
            <span className="text-cyan-300 font-bold">{hoveredPoint.probability.toFixed(1)}% Prob</span>
            <span className="text-purple-300">{hoveredPoint.frequency.toFixed(1)} kHz</span>
          </div>
        )}
      </div>
    </div>
  );
};
