import React from 'react';
import { HelpCircle, Mic, Users, MessageSquare, TrendingUp, Music, X, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
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
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Hang Out Room Guide & Help</h2>
            <p className="text-xs text-amber-400 font-semibold">by indiebrotherhood</p>
          </div>
        </div>

        <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Rap Battle Arena */}
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
              <Mic className="h-4 w-4 text-amber-400" />
              1. Rap Battle Arena & Skill Sub-Rooms
            </h3>
            <p>
              Step into the battle ring! Choose your sub-room tier based on your skill level:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
              <li><strong className="text-emerald-300">Flow Tier:</strong> Relaxed freestyle & smooth rhythmic pocket.</li>
              <li><strong className="text-amber-300">Fluent Tier:</strong> Intermediate multi-syllabic rhymes & double entendres.</li>
              <li><strong className="text-rose-300">Fanatic Tier:</strong> Hardcore fast double time, heavy punchlines & aggressive schemes.</li>
            </ul>
            <p>
              <strong>Matchmaking & AI Opponents:</strong> When you search for a battle, our system pairs you 1v1 with an active artist. If no human player is available in 3.5 seconds, an AI Rap Opponent joins the match so you never wait!
            </p>
            <p>
              <strong>Master AI Judge & Spectators:</strong> Spectators vote live on each round. The Gemini AI Master Judge evaluates all 3 rounds for Rhyme Scheme, Punchlines, and Cadence, issuing a final winner and critique!
            </p>
          </div>

          {/* Collaboration Rooms */}
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              2. Genre-Based Collaboration Hub
            </h3>
            <p>
              Filter by genre (Hip-Hop, R&B, Trap, Lo-Fi, Pop, Rock, EDM, Drill, Afrobeat). Chat with creators, share beat audio tracks, and co-write songs in the real-time shared lyric scratchpad that updates live across all connected artists!
            </p>
          </div>

          {/* Artist Lounge */}
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              3. Artist Lounge
            </h3>
            <p>
              Casual chat space for artists to hang out, plug single releases, talk studio gear, discuss tour stories, and network with indie brotherhood creators worldwide.
            </p>
          </div>

          {/* Marketing Ideas Hub */}
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              4. Marketing Ideas & AI Strategy Hub
            </h3>
            <p>
              Discuss promotion strategies or use our Gemini AI Music Marketer tool. Input your single title and genre to generate a complete 4-week release rollout schedule, Spotify editorial pitch angles, TikTok video concepts, and EPK press kit advice!
            </p>
          </div>

          {/* Beats & Artwork Showcase */}
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2">
            <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
              <Music className="h-4 w-4 text-amber-400" />
              5. Beats & Art Showcase
            </h3>
            <p>
              Producers post instrumental beat demos and graphic designers share cover artwork drafts for instant community critique and placement opportunities.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
          >
            Got It, Let's Hang Out!
          </button>
        </div>
      </div>
    </div>
  );
};
