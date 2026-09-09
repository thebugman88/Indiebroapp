import React from 'react';
import { Info } from 'lucide-react';

const REFERENCES = [
  { name: 'Streaming services', note: 'Normalization and delivery policies vary by service and can change.' },
  { name: 'Video platforms', note: 'Transcoding and playback gain are controlled by the platform, not this application.' },
  { name: 'Local playback', note: 'Choose gain and peak headroom by listening and verify the exported WAV independently.' },
];

export const StoreReadinessCard: React.FC = () => (
  <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-xl lg:p-6">
    <div className="flex items-start gap-3">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
      <div>
        <h2 className="text-base font-bold text-zinc-100">Informational delivery references</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          This Phase 1 feature does not measure standards-grade loudness or true peak and does not determine platform compliance or approval.
        </p>
      </div>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {REFERENCES.map((reference) => (
        <section key={reference.name} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          <h3 className="text-xs font-bold text-zinc-200">{reference.name}</h3>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">{reference.note}</p>
        </section>
      ))}
    </div>
  </div>
);
