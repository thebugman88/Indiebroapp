import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface ExplicitToggleProps {
  explicit: boolean;
  onToggleExplicit: (val: boolean) => void;
}

export const ExplicitToggle: React.FC<ExplicitToggleProps> = ({
  explicit,
  onToggleExplicit
}) => {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 ${
      explicit 
        ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/40' 
        : 'bg-zinc-900/60 border-zinc-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
            explicit ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Explicit Content Mode
              {explicit && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-500/30 uppercase">
                  UNFILTERED BARS
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Allows curse words, raw swearing, and artist choice of bars.
            </div>
          </div>
        </div>

        {/* TOGGLE SWITCH */}
        <button
          type="button"
          onClick={() => onToggleExplicit(!explicit)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            explicit ? 'bg-rose-600' : 'bg-zinc-700'
          }`}
          role="switch"
          aria-checked={explicit}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              explicit ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* MANDATORY LEGAL DISCLAIMER */}
      <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-start space-x-2.5 text-[11px] leading-relaxed text-rose-200/90">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-rose-300">Explicit Disclaimer & Liability Protection:</strong>
          {" "}By turning on Explicit Content Mode, you acknowledge and agree that you assume sole legal and moral responsibility for any curse words, adult themes, or explicit language produced. The <span className="font-bold underline">indiebrother</span> and <span className="font-bold underline">indiebrotherhood</span> will NOT be held responsible or liable for any content produced with or without red explicit enabled.
        </div>
      </div>
    </div>
  );
};
