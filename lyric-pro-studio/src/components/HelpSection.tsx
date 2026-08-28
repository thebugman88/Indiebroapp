import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Music, Flame, Sliders, ShieldAlert, Sparkles, Award, ShieldCheck, Zap, Star } from 'lucide-react';

export const HelpSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mt-12 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
      {/* HELP HEADER / TOGGLE */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer group select-none"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Help & System Explainer
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                HOW IT WORKS
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Learn how to master Lyric Pro Studio's elite lyricism engine.
            </p>
          </div>
        </div>

        <button className="p-2 rounded-xl bg-zinc-800 text-zinc-400 group-hover:text-white transition">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* EXPLAINER CONTENT */}
      {isOpen && (
        <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs text-zinc-300">
          
          {/* STEP 1 */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Music className="w-4 h-4" />
              <span>1. Genre & Custom Input</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Choose from standard presets (Hip-Hop, Pop, R&B, Rock, Country, EDM, Metal, etc.) or type your own micro-genre in the <strong className="text-zinc-200">Other</strong> box, strictly capped at 10 characters.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>2. Vibe & Creation Mode</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Set your track's energy (Energetic, Melancholic, Aggressive, Smooth, Trippy, Dark). Pick your mode: <strong className="text-zinc-200">6 Ideas</strong>, <strong className="text-zinc-200">Verse/Chorus Starter</strong>, or a <strong className="text-zinc-200">Full Song</strong>.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>3. Explicit Content Mode</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Toggle explicit mode to allow curse words and raw artist bars. By enabling it, you accept sole legal responsibility under the <strong className="text-zinc-200">indiebrotherhood</strong> terms.
            </p>
          </div>

          {/* STEP 4 */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>4. Dual Output (Set A & B)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Every click produces <strong className="text-zinc-200">Two Distinct Sets of Lyrics</strong> simultaneously. Listen to spoken cadences, copy lyrics, download .txt files, or save both to your vault.
            </p>
          </div>

        </div>
      )}
    </section>
  );
};
