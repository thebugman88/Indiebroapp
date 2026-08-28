import React from 'react';
import { Mic, ShieldCheck, Rocket, Music, Flame } from 'lucide-react';

interface Props {
  onOpenHelp: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<Props> = ({ onOpenHelp, onOpenTerms }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 mt-16 pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Mic className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Skill-Tiered Battle Ring</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flow, Fluent, and Fanatic sub-rooms paired with real-time 1v1 matchmaking and Gemini AI Master Judge rhyme analysis.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">100% Artist IP Rights</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every verse, beat, and lyric co-written in Hang Out remains 100% owned by the artist with zero label commissions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Rocket className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">AI Rollout Accelerator</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Custom 4-week Spotify playlist pitching, TikTok viral reel hooks, and press kit strategies built for indie single releases.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 hover:border-amber-500/40 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Music className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Real-Time Multi-User Sync</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synchronized beat streaming, live collaborative lyric pads, and crowd judging to bring independent creators together.
            </p>
          </div>
        </div>

        {/* Footer Brand Line & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 pt-8 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-black">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-sm text-white">Hang Out</p>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">by indiebrotherhood</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <button onClick={onOpenHelp} className="hover:text-amber-400 transition">
              Help & Room Guide
            </button>
            <button onClick={onOpenTerms} className="hover:text-amber-400 transition">
              Terms of Service
            </button>
          </div>

          <p className="text-xs text-slate-500 font-semibold tracking-wide">
            2026 All rights reserved by indiebrotherhood
          </p>
        </div>
      </div>
    </footer>
  );
};
