import React, { useEffect, useState } from 'react';
import { ShieldAlert, Sparkles, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface GenerationDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  genre: string;
  vibe: string;
  explicit: boolean;
}

export const GenerationDisclaimerModal: React.FC<GenerationDisclaimerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  genre,
  vibe,
  explicit
}) => {
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    if (isOpen) setUnderstood(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Artistic Ownership & Content Policy
              </h2>
              <p className="text-xs text-zinc-400">
                Pre-Generation Confirmation • <span className="text-amber-400 font-semibold">{genre} ({vibe})</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY DISCLAIMER POINTS */}
        <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
          
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[11px] font-medium">
              Please confirm your acknowledgement of content ownership and responsibility before generating your dual lyric sets.
            </span>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px]">
            
            <div className="flex items-start space-x-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">1. Review & Protect Your Work:</strong>
                <p className="text-zinc-400 mt-0.5">
                  Review generated lyrics before recording or releasing them. AI output is not a guarantee of originality, copyright protection, or clearance. Cloud generation sends your submitted text to the configured AI provider; provider handling is separate from our 24-hour app cache.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">2. Fiction, Safety & Law:</strong>
                <p className="text-zinc-400 mt-0.5">
                  Lyrics may explore adult language, conflict, crime, death, or other dark fictional themes. The service does not endorse harmful or unlawful conduct and may refuse targeted threats, encouragement of real-world harm, or actionable instructions for self-harm, violence, weapons, or crime.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">3. Your Direction, Your Release Decision:</strong>
                <p className="text-zinc-400 mt-0.5">
                  You are responsible for reviewing, editing, recording, publishing, and using the result. AI output may be inaccurate, offensive, or unsuitable. IndieBrotherhood does not provide legal clearance or guarantee originality, safety, copyright protection, or commercial results. The Terms and applicable law still apply.
                </p>
              </div>
            </div>

            {explicit && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px]">
                <strong>Explicit Content Enabled:</strong> Unfiltered raw artist language and profanity may be included in the generated output as selected by your session settings.
              </div>
            )}

          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-0.5 accent-amber-400 w-4 h-4 rounded cursor-pointer shrink-0"
            />
            <span className="text-[11px] text-zinc-300 leading-tight">
              I supplied the creative direction and accept responsibility for reviewing, editing, publishing, and using the result. I understand AI output may be inaccurate, offensive, or unsuitable; no originality, legal, safety, or commercial guarantee is made; and the Terms and applicable law still apply.
            </span>
          </label>

          <button
            type="button"
            disabled={!understood}
            onClick={() => {
              if (understood) {
                onConfirm();
                onClose();
              }
            }}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-xl ${
              understood
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-amber-500/20 cursor-pointer'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-current shrink-0" />
            <span>CONFIRM & GENERATE ELITE LYRICS</span>
          </button>
        </div>

      </div>
    </div>
  );
};
