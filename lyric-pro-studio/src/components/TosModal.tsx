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
                  Automated scripts, continuous button hammering, macro repeaters, and headless crawlers are strictly prohibited. The Security AI tracks requests per account and IP in real-time. Accounts that spam the generation button will be automatically paused for cool-off cooldowns (60-90s) to safeguard compute resources.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>2. Multi-Platinum Lyricist Prosody & Output Rules</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Lyric Pro operates under strict prosodic guidelines: syllable counting, slant/internal rhyme schemes, zero tired clichés, visceral imagery, and structured sectional dynamics. Conversational greetings or non-lyric text are strictly filtered out in favor of pure, rhythmically accurate song blueprints.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>3. Absolute Waiver of Legal Action & Court Rights</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  By accepting these terms, you explicitly, irrevocably, and fully agree that you will NOT be able to take <strong>indiebrother</strong>, the <strong>indiebrotherhood</strong>, or any of the owners of the <strong>indiebrotherhood</strong> to court under any circumstances. You covenant and agree never to initiate or maintain any lawsuit, civil action, or legal claim.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>4. Complete Immunity, Commercial Grant & Explicit Content</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  You agree to place zero liability on the creators for generated output. When Explicit Mode is selected, you assume 100% sole responsibility for generated words and their distribution. All generated compositions are granted for commercial recording and release.
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
              I have read, understood, and accept the <strong className="text-amber-400">Startup Security AI Rules & Terms of Service</strong>. I agree to human-paced creation, anti-bot policies, and legal immunity waiver for <strong className="text-amber-400">indiebrother</strong> and <strong className="text-amber-400">indiebrotherhood</strong>.
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
