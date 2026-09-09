import React from 'react';
import { ShieldCheck, FileText, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[85vh] overflow-y-auto rounded-3xl border border-amber-500/30 bg-slate-900 p-4 sm:p-6 shadow-2xl scrollbar-thin">
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
            <h2 className="text-xl font-bold text-white">Hang Out safety notice</h2>
            <p className="text-xs text-amber-400 font-semibold">Adult community · 18+ only</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">Adults only</h3>
            <p>Hang Out—including rooms, direct messages, cyphers, and battles—is restricted to members who have declared they are 18 or older.</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">Community conduct</h3>
            <p>No grooming, predatory conduct, sexual exploitation, harassment, threats, hate, doxxing, stalking, fraud, or child endangerment. Messages may be moderated for safety. Report unsafe conduct immediately.</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">Your work</h3>
            <p>You retain rights you already hold. Submit only material you own or have permission to share, and use a written agreement for collaborations and royalty splits.</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300">Master policies</h3>
            <p>This short notice does not replace the <a href="/api/legal/terms-of-service" target="_blank" rel="noreferrer" className="text-amber-300 underline">Terms of Service</a> or <a href="/api/legal/privacy" target="_blank" rel="noreferrer" className="text-amber-300 underline">Privacy Policy</a>. Contact <a href="mailto:xchristopherrayx@gmail.com" className="text-amber-300 underline">xchristopherrayx@gmail.com</a> for safety reports.</p>
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
