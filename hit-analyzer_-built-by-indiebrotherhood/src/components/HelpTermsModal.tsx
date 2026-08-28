import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, BookOpen, Music, Scale, Radio, CheckCircle2 } from 'lucide-react';

interface HelpTermsModalProps {
  isOpen: boolean;
  initialTab?: 'logic' | 'tos' | 'guide';
  onClose: () => void;
}

export const HelpTermsModal: React.FC<HelpTermsModalProps> = ({
  isOpen,
  initialTab = 'logic',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'logic' | 'tos' | 'guide'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hit Analyzer Information Center</h2>
              <p className="text-xs text-slate-400">built by indiebrotherhood</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('logic')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'logic'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            2026 Algorithmic Logic
          </button>

          <button
            onClick={() => setActiveTab('tos')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'tos'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Terms & Anti-Copyright
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            User Help Guide
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed">
          
          {/* TAB 1: LOGIC */}
          {activeTab === 'logic' && (
            <div className="space-y-4">
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  How Hit Analyzer Logic Works (2026 Cross-Platform Benchmarks)
                </h3>
                <p className="text-xs text-indigo-200/80">
                  Hit Analyzer does not rely on arbitrary scores. Our neural acoustic engine is trained on acoustic telemetry, streaming metadata, and engagement curves across every major music consumption channel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">01. TikTok & Reels Clip Density</div>
                  <p className="text-xs text-slate-300">
                    Measures the immediate 5-to-15 second vocal or melodic payoff. Tracks with hooks appearing within the first 12 seconds receive up to +15% boost in viral potential.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">02. Spotify 30-Second Skip Prevention</div>
                  <p className="text-xs text-slate-300">
                    Evaluates arrangement energy curves. A stream only counts as monetized after 30 seconds. We score how effectively your intro and pre-chorus hook listener attention.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">03. Vocal Presence & LUFS Dynamics</div>
                  <p className="text-xs text-slate-300">
                    Analyzes vocal clarity (2kHz - 5kHz boost) and master loudness dynamics (-9 to -12 LUFS Integrated) required for pristine Apple Music & YouTube Music playback.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">04. Phonetic & Lyrical Bounce Index</div>
                  <p className="text-xs text-slate-300">
                    When lyrics are provided, the engine assesses vowel rhyme cadence, downbeat alignment, and chorus earworm repetition density.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'tos' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  IndieBrotherhood Terms of Service & Content Policy
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Hit Analyzer is strictly built for independent music creators to analyze 100% original, unreleased, or fully licensed original songs.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div>
                  <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Originality & Ownership Requirement
                  </h4>
                  <p className="pl-6">
                    By submitting any audio track or lyrics to Hit Analyzer, you explicitly represent and warrant that you own or possess all requisite rights, licenses, and permissions to the master audio and underlying musical composition.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400" /> 2. Strict Prohibition of Cover Songs & Re-recordings
                  </h4>
                  <p className="pl-6">
                    <strong>NO COVER SONGS.</strong> Uploading re-recordings, vocal covers, acoustic renditions, or tributes of songs originally written or released by other artists is strictly forbidden. The system automatically detects covered compositions and will refuse analysis.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" /> 3. Refusal of Commercial Major-Label Works
                  </h4>
                  <p className="pl-6">
                    Hit Analyzer contains automated fingerprinting and metadata checks that refuse to process existing commercial hits or songs released by mainstream artists. Attempts to analyze copyrighted works will trigger immediate refusal.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> 4. Data Privacy & Confidentiality
                  </h4>
                  <p className="pl-6">
                    Your unreleased audio files and lyrics are processed securely for analysis purposes only. IndieBrotherhood does not claim ownership, re-distribute, or store your music for public playback.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HELP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-4">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  How to Get the Best Results from Hit Analyzer
                </h3>
                <p className="text-xs text-purple-200/80">
                  Follow this quick step-by-step guide to get maximum value out of your song breakdown.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">Select Your Audio Source</h4>
                    <p className="text-xs text-slate-400">
                      Upload an MP3/WAV file, enter a SoundCloud/YouTube URL, or pick one of our built-in IndieBrotherhood demo tracks for a instant preview.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">Paste Song Lyrics (Recommended)</h4>
                    <p className="text-xs text-slate-400">
                      Including lyrics allows the system to analyze rhyme schemes, chorus hook repeat density, and vocal phonetics over downbeats.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-0.5">Review Your Hit Breakdown & Action Plan</h4>
                    <p className="text-xs text-slate-400">
                      Examine your Overall Hit Score, Tier Badge, audio dynamics tab, "What's Working" list, and specific mix/arrangement production tweaks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Hit Analyzer v2.6 • indiebrotherhood
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Got it, Close
          </button>
        </div>

      </div>
    </div>
  );
};
