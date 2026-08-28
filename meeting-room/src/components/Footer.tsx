import React from 'react';
import { HelpCircle, Shield, FileText, Wifi, Circle, Radio, Users, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  connected: boolean;
  attendeeCount: number;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export function Footer({
  connected,
  attendeeCount,
  onOpenHelp,
  onOpenTerms,
  onOpenPrivacy,
}: FooterProps) {
  return (
    <footer id="app-footer" className="mt-auto border-t border-slate-200 bg-white text-slate-600 text-xs py-4 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Year info requested by user */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-800 tracking-tight">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>2026 indiebrotherhood</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Real-time Assembly & Voting Portal
          </span>
        </div>

        {/* Center: Live System Status & Connection Telemetry */}
        <div className="flex items-center gap-4 text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-medium">{connected ? 'Live Sync Active' : 'Connecting...'}</span>
          </div>
          <span className="text-slate-200">•</span>
          <div className="flex items-center gap-1 text-[11px]">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{attendeeCount} Connected</span>
          </div>
        </div>

        {/* Right: Help, Terms, Privacy Buttons requested by user */}
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <button
            id="footer-help-btn"
            onClick={onOpenHelp}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors py-1 px-1.5 rounded hover:bg-slate-50"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </button>
          <span className="text-slate-200">•</span>
          <button
            id="footer-terms-btn"
            onClick={onOpenTerms}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors py-1 px-1.5 rounded hover:bg-slate-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms</span>
          </button>
          <span className="text-slate-200">•</span>
          <button
            id="footer-privacy-btn"
            onClick={onOpenPrivacy}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors py-1 px-1.5 rounded hover:bg-slate-50"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
