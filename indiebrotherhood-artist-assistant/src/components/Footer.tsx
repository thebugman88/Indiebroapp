import React from "react";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Globe,
  HelpCircle,
  FileText,
  Heart,
  Database,
  ExternalLink,
} from "lucide-react";

interface FooterProps {
  onOpenTerms: () => void;
  onOpenHelp: () => void;
  onOpenSettings?: () => void;
  songsCount?: number;
  songCount?: number;
  filesCount?: number;
  folderCount?: number;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTerms,
  onOpenHelp,
  onOpenSettings,
  songsCount,
  songCount,
  filesCount,
  folderCount,
}) => {
  const activeSongCount = songsCount ?? songCount ?? 0;
  const activeFilesCount = filesCount ?? folderCount ?? 0;
  return (
    <footer id="app-footer" className="w-full bg-slate-950 border-t border-slate-800 text-slate-400 mt-auto">
      {/* Side-by-side Pro Statement Badges */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Certified Metadata Ready</p>
              <p className="text-[11px] text-slate-400">Direct ASCAP, MLC & SoundExchange formats</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Zero-Leak Local Privacy</p>
              <p className="text-[11px] text-slate-400">IndexedDB persistence; your master data is private</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Multimodal OCR & Vision</p>
              <p className="text-[11px] text-slate-400">Extracts ISRCs & splits from screenshots</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <div className="p-2 rounded-md bg-rose-500/10 text-rose-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">Global Indie Standard</p>
              <p className="text-[11px] text-slate-400">Tailored to the 2026 streaming music ecosystem</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Left Brand info */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="font-bold text-slate-200 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            INDIEARTIST CAREER OS
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <p className="text-slate-400">
            © 2026 <strong className="text-slate-300 font-semibold">An IndieBrotherhood Product</strong>. All rights reserved.
          </p>
        </div>

        {/* Local Storage Indicator */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local Vault: <strong>{songsCount}</strong> Tracks, <strong>{filesCount}</strong> Documents</span>
        </div>

        {/* Right Navigation & Legal */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={onOpenHelp}
            className="hover:text-indigo-300 transition-colors flex items-center gap-1 text-slate-300"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & Music Guide</span>
          </button>

          <button
            onClick={onOpenTerms}
            className="hover:text-indigo-300 transition-colors flex items-center gap-1 text-slate-300"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Privacy</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="hover:text-indigo-300 transition-colors text-slate-400 hover:text-slate-200"
          >
            Settings
          </button>
        </div>
      </div>
    </footer>
  );
};
