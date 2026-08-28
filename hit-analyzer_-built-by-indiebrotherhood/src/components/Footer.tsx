import React from 'react';
import { Radio, ShieldCheck, Activity, Sparkles, HelpCircle } from 'lucide-react';

interface FooterProps {
  onOpenHelp: (tab?: 'logic' | 'tos' | 'guide') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHelp }) => {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950/90 text-slate-400 py-12 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* 4 COOL FEATURE ICONS & HIGHLIGHTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              2026 Cross-Platform Logic
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calibrated against top trending songs across TikTok, Spotify Top 50, Apple Music, and Billboard.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Copyright Guard Active
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated refusal for non-original mainstream artist tracks and cover recordings per TOS.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-purple-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Acoustic & Vocal Diagnostics
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              In-depth breakdown of vocal presence, tune, melody catchiness, genre signature, and vibe.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Actionable Tweak Report
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clear, step-by-step production, arrangement, and mix tweaks to maximize hit potential.
            </p>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT & HELP BAR */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide">Hit Analyzer</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-medium">
              built by <strong className="text-indigo-400 font-bold uppercase tracking-wider">indiebrotherhood</strong>
            </span>
          </div>

          <div className="text-slate-400 font-medium">
            © 2026 indiebrotherhood. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenHelp('guide')}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Help & Information Selection
            </button>
            <button
              onClick={() => onOpenHelp('tos')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Service
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
};
