import React from 'react';
import { Mic2, Scale, History, Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenTos: () => void;
  onOpenHistory: () => void;
  tosAccepted: boolean;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTos,
  onOpenHistory,
  tosAccepted,
  historyCount
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* LOGO & BRANDING */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 flex items-center justify-center text-zinc-950 font-black text-xl shadow-xl shadow-amber-500/25 border border-amber-300/40">
            <Mic2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white font-mono">
                LYRIC PRO <span className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">STUDIO</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                PRO ELITE
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <span>Engineered by</span>
              <span className="text-zinc-200 font-semibold underline decoration-amber-500/50">indiebrotherhood</span>
            </p>
          </div>
        </div>

        {/* CENTER / HEADER ACTIONS */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* SLOW BLINKING LIVE SESSION INDICATOR */}
          <div className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 card-3d-depth">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 live-light-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-white uppercase font-mono leading-none">
                LIVE SESSION
              </span>
              <span className="text-[9px] font-mono text-rose-400/90 leading-tight">
                STUDIO REC ACTIVE
              </span>
            </div>
          </div>

          {/* HISTORY BUTTON */}
          <button
            onClick={onOpenHistory}
            className="relative px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Saved Vault</span>
            {historyCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* TOS & IMMUNITY BADGE */}
          <button
            onClick={onOpenTos}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
              tosAccepted 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse hover:bg-amber-500/20'
            }`}
          >
            {tosAccepted ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">TOS & Immunity Active</span>
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Accept Terms</span>
              </>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
