import React, { useState } from 'react';
import { Scale, ShieldCheck, AlertCircle, X } from 'lucide-react';

interface TosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  tosAccepted: boolean;
}

export const TosModal: React.FC<TosModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  tosAccepted
}) => {
  const [agreed, setAgreed] = useState(tosAccepted);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 max-w-2xl w-full rounded-2xl p-6 shadow-2xl flex flex-col justify-between max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Lyric Pro Studio Guidelines & Security Agreement
                </h2>
                <p className="text-xs text-zinc-400">
                  IndieBrotherhood Official Studio Framework & Anti-Bot Sentinel
                </p>
              </div>
            </div>

            {tosAccepted && (
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* LEGAL & SECURITY RULES CLAUSES BODY */}
          <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
            
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                PLEASE READ AND CONFIRM THESE STARTUP RULES BEFORE ACCESSING THE GEMINI 3.7 LYRIC ENGINE.
              </span>
            </div>

            <div className="space-y-3 text-zinc-300">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>1. Anti-Bot Protection & Request Rate Sentinel</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Automated request limits and unsafe request-structure checks protect the service. Abuse can trigger a temporary account cooldown. Any optional AI security review is advisory only; it does not read your lyrics or decide account bans.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>2. Studio Writing Goals & Output Checks</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Lyric Pro aims for natural cadence, internal rhyme, specific imagery, and purposeful song structure. Both sets must pass completeness and repetition checks. Musical quality remains subjective; review and refine each song for your voice.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>3. Originality & Review Before Release</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  AI is instructed to write original lyrics, and outputs are checked against each other and this account’s recent generation history. This is not a search of every released song and cannot guarantee copyright clearance. Only submit material you are authorized to use and review lyrics before publishing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>4. Temporary Storage, Downloads & Sharing</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Download work you want to keep. Temporary lyric history stores up to ten songs (five A/B pairs) for up to 24 hours from generation. Intentionally shared messages and your downloaded copies have separate lifetimes. Creative input is sent to the configured AI provider; app expiry does not control that provider’s retention. These guidelines do not waive your statutory rights.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* MODAL FOOTER & ACCEPTANCE */}
        <div className="border-t border-zinc-800 pt-4 mt-4 space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-amber-400 w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs text-zinc-200 font-medium leading-snug">
              I understand the <strong className="text-amber-400">writing, security, storage, and sharing guidelines</strong>. I will review generated lyrics and download work I want to keep.
            </span>
          </label>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={!agreed}
              onClick={() => {
                if (agreed) {
                  onAccept();
                  onClose();
                }
              }}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                agreed
                  ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-400/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ACCEPT TERMS & CONTINUE TO STUDIO</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
