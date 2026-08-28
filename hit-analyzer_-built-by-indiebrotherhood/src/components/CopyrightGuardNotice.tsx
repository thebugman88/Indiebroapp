import React from 'react';
import { ShieldAlert, AlertTriangle, FileCheck, Ban } from 'lucide-react';

interface CopyrightGuardNoticeProps {
  reason?: string;
  onReset: () => void;
  onOpenTerms: () => void;
}

export const CopyrightGuardRefusalCard: React.FC<CopyrightGuardNoticeProps> = ({
  reason,
  onReset,
  onOpenTerms,
}) => {
  return (
    <div className="bg-rose-950/40 border-2 border-rose-500/50 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden my-6">
      <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
        <Ban className="w-8 h-8" />
      </div>

      <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-widest mb-3">
        Copyright Refusal Activated
      </span>

      <h3 className="text-xl font-black text-white mb-2">
        Analysis Refused: Non-Original or Copyrighted Content
      </h3>

      <p className="text-sm text-rose-200/90 max-w-xl mx-auto leading-relaxed mb-5">
        {reason ||
          "This track appears to match protected commercial metadata or a cover recording of another artist's work. Hit Analyzer strictly enforces a zero-tolerance policy against analyzing copyrighted music or non-original material."}
      </p>

      <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/50 max-w-lg mx-auto text-xs text-slate-300 space-y-2 text-left mb-6">
        <div className="flex items-center gap-2 font-bold text-rose-400">
          <ShieldAlert className="w-4 h-4" />
          <span>IndieBrotherhood Terms of Service Rules:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
          <li><strong>Original Content Only:</strong> You must own 100% of the underlying composition and master recording.</li>
          <li><strong>No Cover Songs:</strong> Re-recorded covers, tributes, or samples without full master clearance are strictly prohibited.</li>
          <li><strong>No Major Label Commercial Uploads:</strong> Hit Analyzer refuses analysis for existing charting hits by established commercial artists.</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30"
        >
          Select Another Original Song
        </button>

        <button
          type="button"
          onClick={onOpenTerms}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
        >
          Read Full TOS & Copyright Policy
        </button>
      </div>
    </div>
  );
};

export const CopyrightGuardBar: React.FC<{ onOpenTerms: () => void }> = ({ onOpenTerms }) => {
  return (
    <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400 gap-3">
      <div className="flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>
          <strong className="text-slate-200">Copyright Protection Guard Active:</strong> By submitting, you certify this track is 100% original unreleased indie content owned by you. <span className="text-rose-400 font-semibold">No covers allowed.</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenTerms}
        className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 flex-shrink-0 whitespace-nowrap"
      >
        View TOS
      </button>
    </div>
  );
};
