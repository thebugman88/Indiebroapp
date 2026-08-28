import React from 'react';
import { Radio, ShieldCheck, HelpCircle, Sparkles, BookOpen } from 'lucide-react';

interface HeaderProps {
  onOpenHelp: (tab?: 'logic' | 'tos' | 'guide') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelp }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white font-sans">
                Hit Analyzer
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                2026 Engine
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 tracking-wide">
              built by <span className="text-indigo-400 font-bold uppercase tracking-wider">indiebrotherhood</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <button
            onClick={() => onOpenHelp('logic')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            2026 Logic
          </button>

          <button
            onClick={() => onOpenHelp('tos')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Terms & Policy
          </button>

          <button
            onClick={() => onOpenHelp('guide')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/25"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Help Center
          </button>
        </div>

      </div>
    </header>
  );
};
