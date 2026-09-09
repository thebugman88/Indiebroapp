import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertTriangle, EyeOff, Server, HardDrive, KeyRound } from 'lucide-react';

interface TermsAndPrivacyProps {
  type: 'terms' | 'privacy';
}

export const TermsAndPrivacyView: React.FC<TermsAndPrivacyProps> = ({ type }) => {
  if (type === 'privacy') {
    return (
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-800">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100 font-['Space_Grotesk']">
              Local Processing & Privacy Notes
            </h2>
            <p className="text-xs text-zinc-400">
              Mastering suite by indiebrotherhood 2026 • Phase 1 implementation notes
            </p>
          </div>
        </div>

        {/* Highlight Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
              <EyeOff className="w-4 h-4" />
              <span>Local browser processing</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This client processes selected audio with browser Web Audio APIs and contains no audio-upload code. Deployment and browser extensions are outside this statement's scope.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
              <Server className="w-4 h-4" />
              <span>No client-side upload endpoint</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This feature contains no remote audio API, analytics, localStorage, IndexedDB, Cache API, or service-worker integration. Hosting configuration must be reviewed separately.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Session cleanup</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The application releases its in-memory session on reset and unmount where the browser permits. Downloads and browser-managed caches are not controlled by this code.
            </p>
          </div>

        </div>

        {/* Full Privacy Policy Text */}
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            1. Data Collection & Telemetry Policy
          </h3>
          <p>
            This client does not implement audio fingerprinting, analytics, uploads, or persistence. A complete privacy statement requires review of hosting, logs, third-party scripts, and applicable law.
          </p>

          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            2. Audio Data Processing
          </h3>
          <p>
            Audio is decoded using browser Web Audio APIs; DSP and export encoding occur in the client. Hosting and browser behavior must be reviewed separately.
          </p>

          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            3. User Responsibility & Data Preservation
          </h3>
          <p className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200">
            <strong>Notice:</strong> Save exports promptly. This application is not a backup service, and it does not guarantee recovery after a browser session ends.
          </p>

          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            4. Compliance status
          </h3>
          <p>
            This feature does not make a legal compliance determination. Obtain legal review for the deployed product and its operating practices.
          </p>
        </div>

      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-800">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100 font-['Space_Grotesk']">
            Feature Terms and Limitations
          </h2>
          <p className="text-xs text-zinc-400">
            Mastering suite by indiebrotherhood 2026 • Legal Terms of Use
          </p>
        </div>
      </div>

      <div className="space-y-5 text-xs text-zinc-300 leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-100">1. User content and rights</h3>
          <p>
            This feature does not request a transfer of ownership or implement revenue sharing. Users remain responsible for confirming their rights in all imported audio, artwork, and metadata.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-100">2. Export use</h3>
          <p>
            The application can generate WAV files. Users must verify rights, metadata, file integrity, and destination requirements independently.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-100">3. Ephemeral Storage Acknowledgment</h3>
          <p>
            The application is not a cloud backup service. It attempts to release in-memory sessions on reset and unmount, but cannot control downloads, browser caches, extensions, or hosting infrastructure.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-100">4. Warranties and Limitation of Liability</h3>
          <p>
            The software is provided "as is." It does not yet claim standards-grade LUFS, true-peak analysis, EBU R128, or ITU-R BS.1770 conformance. Those engine-verification items are Phase 2 work.
          </p>
        </section>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Effective Date: 2026 Production Edition</span>
          <span className="text-amber-400 font-semibold font-mono">indiebrotherhood Audio Engineering Labs</span>
        </div>
      </div>

    </div>
  );
};
