import React from 'react';
import { ShieldCheck, FileText, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl scrollbar-thin">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Terms of Service & Artist Legal Agreement</h2>
            <p className="text-xs text-amber-400 font-semibold">Hang Out by indiebrotherhood</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">1. Intellectual Property & 100% Artist Ownership</h3>
            <p>
              All lyrics, rap verses, musical compositions, instrumental beats, audio recordings, artwork, and marketing text posted on Hang Out remain 100% the sole intellectual property of the respective artist or creator. "indiebrotherhood" claims zero ownership over your creative output.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">2. Rap Battle Etiquette & Conduct Policy</h3>
            <p>
              While competitive wordplay, humor, and punchlines are encouraged in the Rap Battle Arena, hate speech, explicit slurs, physical threats, harassment, or personal targeted leaks are strictly prohibited. Violators will be permanently muted or removed.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">3. Platform Limitation of Liability</h3>
            <p>
              Hang Out and indiebrotherhood provide this real-time community hub on an "as-is" basis for networking, entertainment, and collaboration. The platform operators are not liable for informal collaboration disputes, royalty splits negotiated between users outside formal legal contracts, or third-party user transmissions.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">4. DMCA & Copyright Infringement</h3>
            <p>
              Do not post copyrighted audio or artwork that you do not hold rights to. If you believe your copyrighted work was shared without permission, notify our community team for immediate removal.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
          >
            I Accept & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
