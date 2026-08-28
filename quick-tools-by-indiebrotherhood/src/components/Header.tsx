import React from 'react';
import { ActiveTool } from '../types';
import {
  Sparkles,
  ArrowLeft,
  Save,
  CheckCircle2,
  Layers,
  Mic2,
  Activity,
  FileText,
  Users,
  Volume2,
  Share2,
  Music,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  activeTool: ActiveTool;
  onNavigate: (tool: ActiveTool) => void;
  lastSaved: Date | null;
  isAutoSaveOn: boolean;
  onToggleAutoSave?: (val: boolean) => void;
}

const TOOL_TITLES: Record<ActiveTool, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = {
  dashboard: {
    title: 'quick tools by indiebrotherhood',
    subtitle: 'lightweight audio & songwriting suite',
    icon: Sparkles,
  },
  lyrics: {
    title: 'dual-mode lyric scratchpad',
    subtitle: 'free write & guided syllable/rhyme analysis',
    icon: FileText,
  },
  bpm: {
    title: 'bpm counter / tap tempo',
    subtitle: 'live tempo calculation & metronome',
    icon: Activity,
  },
  pitch: {
    title: 'key finder & pitch detector',
    subtitle: 'real-time mic pitch tuner & audio key analyzer',
    icon: Mic2,
  },
  rhymes: {
    title: 'rhyme & near-rhyme finder',
    subtitle: 'phonetic matching & syllable filtering',
    icon: BookOpen,
  },
  metadata: {
    title: 'metadata & tagging helper',
    subtitle: 'isrc, iswc, song credits & track registration',
    icon: Music,
  },
  splits: {
    title: 'split sheet calculator',
    subtitle: 'collaborator ownership & signature agreements',
    icon: Users,
  },
  gain: {
    title: 'gain / peak normalizer & lufs checker',
    subtitle: 'client-side peak dbfs & streaming target analysis',
    icon: Volume2,
  },
  smartlink: {
    title: 'epk / smart link generator',
    subtitle: 'release promo micro-page & bio link preview',
    icon: Share2,
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  onNavigate,
  lastSaved,
  isAutoSaveOn,
  onToggleAutoSave,
}) => {
  const currentInfo = TOOL_TITLES[activeTool];
  const IconComponent = currentInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Back Navigation */}
        <div className="flex items-center gap-3 min-w-0">
          {activeTool !== 'dashboard' ? (
            <button
              id="back-to-dashboard-btn"
              onClick={() => onNavigate('dashboard')}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>dashboard</span>
            </button>
          ) : null}

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-colors">
              <IconComponent className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-medium tracking-tight text-white truncate">
                {activeTool === 'dashboard' ? (
                  <>quick tools <span className="text-white/40 font-normal">by indiebrotherhood</span></>
                ) : (
                  <span>{currentInfo.title}</span>
                )}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-emerald-500 font-bold">
                  system: active
                </span>
                <span className="text-white/20 hidden sm:inline">•</span>
                <span className="text-[11px] text-white/40 truncate font-sans hidden sm:inline">
                  {currentInfo.subtitle}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Auto-Save Status Indicator & Quick Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleAutoSave && (
            <button
              id="toggle-autosave-btn"
              onClick={() => onToggleAutoSave(!isAutoSaveOn)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-xs text-white/60 hover:text-white transition-all cursor-pointer"
              title={isAutoSaveOn ? 'Auto-save active' : 'Auto-save disabled'}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all ${isAutoSaveOn ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-white/20'
                  }`}
              />
              <span className="text-[11px] tracking-wide">
                {isAutoSaveOn ? (
                  'auto-save enabled'
                ) : (
                  'auto-save disabled'
                )}
              </span>
            </button>
          )}

          {activeTool !== 'dashboard' && (
            <button
              id="header-all-tools-btn"
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-white text-black hover:bg-gray-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View all launcher tools"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">all tools</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
