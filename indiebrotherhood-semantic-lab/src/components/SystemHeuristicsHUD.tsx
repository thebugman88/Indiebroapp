import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, Radio, Zap, Server, Shield, Layers } from 'lucide-react';
import { SystemHeuristics, EngineMode } from '../types';

interface SystemHeuristicsHUDProps {
  engineMode: EngineMode;
  unleashedDrive: boolean;
  isSynthesizing: boolean;
}

export const SystemHeuristicsHUD: React.FC<SystemHeuristicsHUDProps> = ({
  engineMode,
  unleashedDrive,
  isSynthesizing,
}) => {
  const [heuristics, setHeuristics] = useState<SystemHeuristics>({
    cachePurity: 99.8,
    eraSyncLagMs: 1.2,
    soulCompression: 'ACTIVE',
    bufferDepth: 128,
    quantumEntropy: 4.6,
    lastSyncTimestamp: new Date().toLocaleTimeString(),
  });

  // Micro-fluctuations to represent a live running synthesis matrix
  useEffect(() => {
    const interval = setInterval(() => {
      setHeuristics(prev => {
        const jitter = (Math.random() * 0.4 - 0.2);
        const lagJitter = (Math.random() * 0.3 - 0.15);
        const purity = Number(Math.min(99.9, Math.max(98.4, prev.cachePurity + jitter * 0.1)).toFixed(1));
        const lag = Number(Math.max(0.6, Math.min(3.2, (unleashedDrive ? 0.9 : 1.4) + lagJitter)).toFixed(2));
        const entropy = Number((4.0 + Math.random() * 2.5 + (engineMode === 'UNLEASHED' ? 3.0 : 0)).toFixed(1));

        return {
          ...prev,
          cachePurity: purity,
          eraSyncLagMs: lag,
          quantumEntropy: entropy,
          soulCompression: unleashedDrive ? 'WARM_SATURATION' : (engineMode === 'UNLEASHED' ? 'ACTIVE' : 'NONE'),
          lastSyncTimestamp: new Date().toLocaleTimeString(),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [engineMode, unleashedDrive]);

  return (
    <div id="system-heuristics-hud" className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
            SYSTEM HEURISTICS // ENGINE HEALTH
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-500">
            DSP SYNCHRONIZED ({heuristics.lastSyncTimestamp})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Cache Purity */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-2 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">Cache Purity</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {heuristics.cachePurity}%
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
        </div>

        {/* Era Sync Lag */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-2 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">Era Sync Lag</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {heuristics.eraSyncLagMs} ms
            </span>
          </div>
          <Wifi className="w-3 h-3 text-cyan-400" />
        </div>

        {/* Soul Compression */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-2 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">Soul Compression</span>
            <span className={`text-[11px] font-mono font-bold ${
              heuristics.soulCompression === 'WARM_SATURATION'
                ? 'text-amber-300'
                : heuristics.soulCompression === 'ACTIVE'
                ? 'text-purple-300'
                : 'text-zinc-400'
            }`}>
              {heuristics.soulCompression}
            </span>
          </div>
          <Zap className="w-3 h-3 text-amber-400" />
        </div>

        {/* Quantum Entropy */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 p-2 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block">Quantum Entropy</span>
            <span className="text-xs font-mono font-bold text-zinc-300">
              {heuristics.quantumEntropy}%
            </span>
          </div>
          <Layers className="w-3 h-3 text-zinc-500" />
        </div>
      </div>
    </div>
  );
};
