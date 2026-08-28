import React from 'react';
import { ShieldCheck, Sparkles, BarChart2, Radio, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenVault: () => void;
  onOpenAiGenerator: () => void;
  totalPoints: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVault,
  onOpenAiGenerator,
  totalPoints,
}) => {
  return (
    <header className="w-full bg-black/50 border-b border-white/10 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 shadow-2xl shadow-purple-950/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center group">
            <div className="w-full h-full bg-[#08080d] rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black tracking-tight text-white uppercase font-sans flex items-center gap-1.5">
                SONIC <span className="text-purple-400">IQ LAB</span>
              </h1>
              {/* Live Equalizer Pulse Graphic */}
              <div className="flex items-end gap-0.5 h-3 px-1.5 py-0.5 bg-purple-500/20 rounded border border-purple-500/30">
                <span className="w-0.5 bg-purple-400 animate-[bounce_1s_infinite_100ms] h-full" />
                <span className="w-0.5 bg-pink-400 animate-[bounce_1s_infinite_300ms] h-2/3" />
                <span className="w-0.5 bg-purple-300 animate-[bounce_1s_infinite_200ms] h-5/6" />
                <span className="w-0.5 bg-emerald-400 animate-[bounce_1s_infinite_400ms] h-1/2" />
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[11px] text-gray-400 tracking-wide font-sans">
              Engineered by <span className="text-purple-300 font-bold">indiebrotherhood</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Live Sonic Signal Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Sonic Anti-Cheat Engine</span>
          </div>

          {/* AI Custom Quiz CTA */}
          <button
            onClick={onOpenAiGenerator}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-500/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span>Custom Quiz Studio</span>
          </button>

          {/* User Vault / Stats */}
          <button
            onClick={onOpenVault}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition-all cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Score Vault</span>
            {totalPoints > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                {totalPoints.toLocaleString()} PTS
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

