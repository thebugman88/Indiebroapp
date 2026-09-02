import React from 'react';
import {
  Award,
  Sliders,
  Cpu,
  Waves,
  ShieldCheck,
  Disc3,
  Sparkles,
  Zap,
  Layers,
  Radio,
  Music2,
  CheckCircle2,
  Check
} from 'lucide-react';

export const ProductionStatementsView: React.FC = () => {
  return (
    <div className="w-full space-y-6">

      {/* Hero Statement */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-amber-950/30 border border-zinc-800 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider font-mono">
              Phase 1 Engineering Notes
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 font-['Space_Grotesk'] tracking-tight mt-1">
              Mastering suite <span className="text-amber-400">by indiebrotherhood 2026</span>
            </h2>
          </div>
        </div>

        <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
          A browser-based audio-processing tool for independent artists and producers. Verify listening, loudness, metadata, and distributor requirements before release.
        </p>
      </div>

      {/* Production Statements Grid with Professional Icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Statement 1: Browser DSP */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 font-['Space_Grotesk'] mb-1">
              Browser Web Audio Processing
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Filtering, dynamics, and saturation are built from browser Web Audio nodes. Processing precision follows the browser's Web Audio implementation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Phase 2: engine verification</span>
          </div>
        </div>

        {/* Statement 2: Harmonic Saturation */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 font-['Space_Grotesk'] mb-1">
              Sonic HD 4x Oversampled Saturation
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Emulates the acoustic character of classic vacuum tubes, 1/2-inch analog tape machines, and discrete solid-state console transformers with 4x anti-aliasing to enrich dry digital mixes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-purple-400 font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Analog Warmth & Bus Glue</span>
          </div>
        </div>

        {/* Statement 3: Spatial imager */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 font-['Space_Grotesk'] mb-1">
              Stereo Imaging & Synthetic Room Texture
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Provides mid-side width control and an optional synthetic room texture. No surround or spatial-audio standard is implemented.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-blue-400 font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Check mono compatibility manually</span>
          </div>
        </div>

        {/* Statement 4: True Peak Limiter */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 font-['Space_Grotesk'] mb-1">
              Browser Compressor Limiting
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Uses a browser dynamics compressor and output gain. Standards-grade true-peak and loudness verification remain Phase 2 work.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-amber-400 font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Independent technical verification required</span>
          </div>
        </div>

        {/* Statement 5: Limited RIFF INFO metadata */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Disc3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 font-['Space_Grotesk'] mb-1">
              Limited WAV Text Metadata
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              WAV export writes limited RIFF INFO text fields. It does not embed artwork or complete release metadata.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Verify distributor requirements</span>
          </div>
        </div>

        {/* Statement 6: Local processing */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 font-['Space_Grotesk'] mb-1">
              Local Browser Processing
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This client contains no upload, analytics, or persistence code for audio and metadata. Deployment, browser storage, and network behavior must be assessed separately.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2 text-[11px] text-red-400 font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Review host and browser behavior separately</span>
          </div>
        </div>

      </div>

      {/* Production status */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono">
            26
          </div>
          <div>
            <span className="font-bold text-zinc-200 block">indiebrotherhood mastering application</span>
            <span className="text-[11px] text-zinc-500 font-mono">Phase 1 hardening • verification in progress</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-amber-400/90 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Independent verification required</span>
        </div>
      </div>

    </div>
  );
};
