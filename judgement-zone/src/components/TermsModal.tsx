import React, { useState } from 'react';
import { ShieldAlert, Scale, Check, AlertCircle, FileText, Lock } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
  forceRequired?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onAccept,
  onClose,
  forceRequired = false
}) => {
  const [agreedRights, setAgreedRights] = useState(false);
  const [agreedAnonymous, setAgreedAnonymous] = useState(false);
  const [agreedLiability, setAgreedLiability] = useState(false);

  if (!isOpen) return null;

  const canAccept = agreedRights && agreedAnonymous && agreedLiability;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        id="terms-of-service-card"
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
            <Scale className="w-3.5 h-3.5" /> INDIEBROTHERHOOD PRODUCTION 2026
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Terms of Service & Privacy Policy
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg mx-auto">
            Official legal covenant for Judgement Zone. You must explicitly agree to these covenants before participating as an artist or peer judge.
          </p>
        </div>

        {/* Legal Text Body */}
        <div className="space-y-4 text-xs text-zinc-300 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 max-h-72 overflow-y-auto leading-relaxed">
          <section>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> 1. Direct Artist Rights & Master Ownership Warranty
            </h4>
            <p>
              By uploading or submitting any musical composition, sound recording, vocal stems, or lyrical work to Judgement Zone (an IndieBrotherhood Production 2026), you strictly warrant and represent that you are the sole, direct legal author and copyright owner, or hold valid, irrevocable master recording rights. <strong>Zero third-party songs, unauthorized covers, or uncleared commercial samples are permitted.</strong> Violations result in immediate permanent expulsion and legal indemnification.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> 2. Unanimous Anonymous Peer-Review Judgement Protocol
            </h4>
            <p>
              You acknowledge and agree that all evaluation and scoring in the Judgement Chamber is conducted <strong>unanimously and entirely anonymously by fellow peer users</strong>. Artist identities and track titles remain completely concealed behind the blind veil until an evaluation is recorded. Peer judge individual identities are permanently confidential and never disclosed to artists or third parties (only their verified Judge Tier level is displayed in audit dossiers).
            </p>
          </section>

          <section>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> 3. Fair Play, Anti-Skipping & Integrity Gate
            </h4>
            <p>
              Judges must listen to at least 50% of any audio recording before a verdict can be submitted. Fast-forwarding is restricted to preserve honest artistic evaluations. 24-hour evaluation limits and skip limits are enforced algorithmically to maintain peer integrity.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-1 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" /> 4. Platform Safe Harbor & Limitation of Liability
            </h4>
            <p>
              IndieBrotherhood Production 2026 and Judgement Zone operators provide this evaluation chamber as an artistic feedback and tastemaker community tool. Peer feedback and scores represent subjective artistic opinions of independent users. You agree to hold IndieBrotherhood Production 2026 harmless from any copyright claims, disputes, or outcomes arising from peer evaluations.
            </p>
          </section>
        </div>

        {/* Checkboxes */}
        <div className="mt-5 space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition select-none">
            <input
              type="checkbox"
              id="tos-rights-checkbox"
              checked={agreedRights}
              onChange={e => setAgreedRights(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500 focus:ring-offset-zinc-950"
            />
            <span className="text-xs text-zinc-200">
              <strong>Direct Artist Warranty:</strong> I certify that I only submit 100% original, self-owned tracks where I hold all master rights. No third-party or unauthorized material.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition select-none">
            <input
              type="checkbox"
              id="tos-anonymous-checkbox"
              checked={agreedAnonymous}
              onChange={e => setAgreedAnonymous(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500 focus:ring-offset-zinc-950"
            />
            <span className="text-xs text-zinc-200">
              <strong>Unanimous Anonymous Protocol:</strong> I understand that judging is performed blindly and anonymously by 10 peer users, with identities protected on both sides.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition select-none">
            <input
              type="checkbox"
              id="tos-liability-checkbox"
              checked={agreedLiability}
              onChange={e => setAgreedLiability(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500 focus:ring-offset-zinc-950"
            />
            <span className="text-xs text-zinc-200">
              <strong>IndieBrotherhood 2026 Terms:</strong> I accept the platform terms, privacy policy, and limitation of liability in full.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
          {!forceRequired && onClose && (
            <button
              id="tos-cancel-btn"
              onClick={onClose}
              type="button"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
          )}

          <div className="w-full sm:w-auto flex-1 flex justify-end">
            <button
              id="tos-accept-btn"
              onClick={onAccept}
              disabled={!canAccept}
              type="button"
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                canAccept
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 shadow-amber-500/20 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <Check className="w-4 h-4" />
              I Certify & Agree to Terms (Enter Zone)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
