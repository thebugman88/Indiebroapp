import React from 'react';
import { Sliders, ShieldCheck, FileAudio, Disc3, Award, Info, FileText, Lock, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'mastering' | 'metadata' | 'storeAudit' | 'production' | 'terms' | 'privacy';
  setActiveTab: (tab: 'mastering' | 'metadata' | 'storeAudit' | 'production' | 'terms' | 'privacy') => void;
  hasTrack: boolean;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasTrack,
  onOpenExport,
}) => {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Brand & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/40 shadow-lg shadow-amber-500/10">
              <Sliders className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" title="DSP Engine Ready" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100 font-['Space_Grotesk']">
                  Mastering suite <span className="text-amber-400 font-normal">by indiebrotherhood 2026</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Phase 1 WAV DSP
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Local Processing</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">Browser-Local WAV Workflow</span>
              </p>
            </div>
          </div>

          {/* Quick Export Trigger on Mobile */}
          {hasTrack && (
            <button
              onClick={onOpenExport}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition"
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          <button
            id="tab-mastering"
            onClick={() => setActiveTab('mastering')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'mastering'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Mastering Suite</span>
          </button>

          <button
            id="tab-metadata"
            onClick={() => setActiveTab('metadata')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'metadata'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Release Metadata</span>
          </button>

          <button
            id="tab-store-audit"
            onClick={() => setActiveTab('storeAudit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'storeAudit'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Delivery References</span>
          </button>

          <button
            id="tab-production"
            onClick={() => setActiveTab('production')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'production'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Production Manifesto</span>
          </button>

          <button
            id="tab-privacy"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Notes</span>
          </button>

          <button
            id="tab-terms"
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'terms'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
        </nav>

        {/* Header Action */}
        <div className="hidden md:flex items-center gap-3">
          {hasTrack && (
            <button
              id="header-export-btn"
              onClick={onOpenExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-zinc-950 font-bold text-xs tracking-wide uppercase shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 active:scale-95 transition"
            >
              <FileAudio className="w-4 h-4" />
              <span>Export Master</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
