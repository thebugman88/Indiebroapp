import React from "react";
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from "lucide-react";

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Terms of Service & Privacy Policy</h2>
              <p className="text-xs text-slate-400">IndieBrotherhood Artist Rights & Data Sovereignty Guarantee (2026 Edition)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              1. 100% Artist Data Privacy & Local Sovereignty
            </h3>
            <p>
              Your unreleased song metadata, ISRC codes, split sheets, royalty earnings, and personal songwriter identifiers (IPI/CAE numbers) are stored locally in your browser's persistent IndexedDB vault. We do not sell, rent, monetize, or harvest independent artist data.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              2. Intellectual Property & Master Ownership
            </h3>
            <p>
              You retain 100% of all master sound recording rights, underlying composition copyrights, lyrics, trademarks, and publishing equity. Using the IndieArtist Career OS does not grant IndieBrotherhood or any third party any claim or licensing stake in your catalog.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              3. AI Assistance & Model Processing Terms
            </h3>
            <p>
              AI queries, OCR document scans, and strategy roadmaps are processed via high-performance Google Gemini models with strict enterprise privacy protections. Your uploads are processed solely for the ephemeral generation of your metadata exports and career strategy, never for public generative AI model training.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-rose-400" />
              4. Registration & Legal Compliance
            </h3>
            <p>
              While this OS formats metadata according to official ASCAP, The MLC, SoundExchange, and BMI bulk submission specifications, artists remain responsible for submitting their exported files to the respective collecting societies to ensure proper royalty collection.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">© 2026 An IndieBrotherhood Product</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
