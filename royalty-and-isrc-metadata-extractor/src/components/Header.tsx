import React from 'react';
import { 
  Upload, 
  Download, 
  Settings as SettingsIcon, 
  Plus, 
  Database,
  Search,
  Sparkles,
  Layers,
  Activity,
  Menu,
  Key,
  Bot
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenAddTrack: () => void;
  onOpenAssistant: () => void;
  onOpenByok: () => void;
  onToggleMobileSidebar?: () => void;
  totalTracks: number;
  totalStreams: number;
  totalRevenue: number;
  currency: string;
  isProcessing: boolean;
  unverifiedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onOpenExport,
  onOpenSettings,
  onOpenAddTrack,
  onOpenAssistant,
  onOpenByok,
  onToggleMobileSidebar,
  totalTracks,
  totalStreams,
  totalRevenue,
  currency,
  isProcessing,
  unverifiedCount,
}) => {
  return (
    <header className="h-14 sm:h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-[#0b0f1a] text-slate-300 sticky top-0 z-30 select-none">
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 md:hidden text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Folders & Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-sm sm:text-base shadow-md shadow-indigo-600/30">
          R
        </div>
        <div className="flex items-center">
          <h1 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight flex items-center">
            RoyaltyOps
            <span className="text-indigo-400 font-mono text-[10px] sm:text-[11px] ml-1.5 sm:ml-2 px-1 sm:px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              v2.1
            </span>
          </h1>
        </div>
      </div>

      {/* Engine Status & Metrics */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          <span className={`text-xs font-mono uppercase tracking-widest ${isProcessing ? 'text-amber-400' : 'text-emerald-500'}`}>
            {isProcessing ? 'OCR Processing' : 'Engine Ready'}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider">Tracks:</span>
            <span className="text-slate-200 font-semibold">{totalTracks}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider">Streams:</span>
            <span className="text-slate-200 font-semibold">
              {totalStreams >= 1000000 
                ? `${(totalStreams / 1000000).toFixed(2)}M` 
                : totalStreams >= 1000 
                ? `${(totalStreams / 1000).toFixed(1)}k` 
                : totalStreams.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider">Gross:</span>
            <span className="text-emerald-400 font-semibold">
              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `}
              {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xs mx-3 sm:mx-6 relative hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter ISRCs, titles, artists..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
        />
      </div>

      {/* Actions & Assistant Triggers */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* AI Assistant Button */}
        <button
          id="header-assistant-btn"
          onClick={onOpenAssistant}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg transition-all shadow-sm"
          title="Open AI Music & Royalty Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* BYOK Hub Button */}
        <button
          id="header-byok-btn"
          onClick={onOpenByok}
          className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 rounded-lg transition-colors"
          title="Bring Your Own Key (BYOK) & Integrations"
        >
          <Key className="w-4 h-4 text-amber-400" />
        </button>

        <button
          id="header-manual-track-btn"
          onClick={onOpenAddTrack}
          className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 rounded-lg transition-colors"
          title="Add track metadata manually"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>Add Track</span>
        </button>

        <button
          id="header-upload-btn"
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md shadow-indigo-600/20"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Upload</span>
        </button>

        <button
          id="header-export-btn"
          onClick={onOpenExport}
          disabled={totalTracks === 0}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            totalTracks > 0
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
              : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-0.5 sm:mx-1 hidden sm:block" />

        <button
          id="header-settings-btn"
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-slate-100"
          title="Settings & OCR Preferences"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
