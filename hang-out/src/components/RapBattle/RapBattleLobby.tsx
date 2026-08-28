import React, { useState } from 'react';
import { SubRoomTier, BattleState, UserProfile } from '../../types';
import { RapBattleArena } from './RapBattleArena';
import { Mic, Zap, Flame, Trophy, Users, ShieldAlert, Play, Search, Scale } from 'lucide-react';

interface Props {
  currentUser: UserProfile | null;
  activeBattles: BattleState[];
  onEnterMatchmaking: (tier: SubRoomTier) => void;
  onCancelMatchmaking: (tier: SubRoomTier) => void;
  onSubmitVerse: (battleId: string, verseText: string, audioUrl?: string) => void;
  onVote: (battleId: string, voteForPlayerId: string) => void;
  onRequireNickname: () => void;
}

export const RapBattleLobby: React.FC<Props> = ({
  currentUser,
  activeBattles,
  onEnterMatchmaking,
  onCancelMatchmaking,
  onSubmitVerse,
  onVote,
  onRequireNickname,
}) => {
  const [selectedSubRoom, setSelectedSubRoom] = useState<SubRoomTier>('Fluent');
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const activeBattle = activeBattles.find((b) => b.id === activeBattleId);

  const TIERS: { id: SubRoomTier; name: string; description: string; badge: string; color: string }[] = [
    {
      id: 'Flow',
      name: 'Flow Tier',
      description: 'Rookie & relaxed freestyle tier. Focus on pocket, smooth cadence, and clean rhythm.',
      badge: 'Chill Rhythm',
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-300',
    },
    {
      id: 'Fluent',
      name: 'Fluent Tier',
      description: 'Intermediate wordplay tier. Multi-syllabic rhymes, double entendre, and clever counters.',
      badge: 'Multi-Syllabic',
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300',
    },
    {
      id: 'Fanatic',
      name: 'Fanatic Tier',
      description: 'Hardcore battle tier. Fast double time, heavy punchlines, ruthless schemes, and maximum heat.',
      badge: 'Hardcore Punchlines',
      color: 'from-rose-500/20 to-rose-600/10 border-rose-500/40 text-rose-300',
    },
  ];

  const handleStartMatchmaking = (tier: SubRoomTier) => {
    if (!currentUser) {
      onRequireNickname();
      return;
    }
    setIsSearching(true);
    onEnterMatchmaking(tier);
  };

  const handleCancelSearch = (tier: SubRoomTier) => {
    setIsSearching(false);
    onCancelMatchmaking(tier);
  };

  if (activeBattle) {
    return (
      <RapBattleArena
        battle={activeBattle}
        currentUser={currentUser}
        onSubmitVerse={(verseText, audioUrl) => onSubmitVerse(activeBattle.id, verseText, audioUrl)}
        onVote={(voteForPlayerId) => onVote(activeBattle.id, voteForPlayerId)}
        onLeave={() => setActiveBattleId(null)}
        onRequireNickname={onRequireNickname}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 mb-3">
            <Mic className="h-4 w-4" />
            LIVE BATTLE ARENA
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
            The Rap Battle Ring
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Select your skill level sub-room (<span className="text-amber-400 font-bold">Flow</span>,{' '}
            <span className="text-amber-400 font-bold">Fluent</span>, or{' '}
            <span className="text-amber-400 font-bold">Fanatic</span>). Our matchmaking engine pairs you 1v1 against another artist in real-time, complete with a Gemini AI Master Judge and live crowd voting!
          </p>
        </div>
      </div>

      {/* Sub-Room Tier Selector */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          1. Select Battle Sub-Room Tier
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedSubRoom(tier.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition relative overflow-hidden bg-gradient-to-b ${
                selectedSubRoom === tier.id
                  ? 'border-amber-500 bg-slate-900 shadow-xl shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${tier.color}`}>
                  {tier.badge}
                </span>
                {selectedSubRoom === tier.id && (
                  <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
                )}
              </div>
              <h4 className="text-lg font-black text-white mb-1">{tier.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{tier.description}</p>

              {selectedSubRoom === tier.id ? (
                isSearching ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelSearch(tier.id);
                    }}
                    className="w-full rounded-xl bg-red-500/20 border border-red-500/40 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/30 transition flex items-center justify-center gap-2"
                  >
                    <Search className="h-4 w-4 animate-spin" />
                    Searching Opponent... (Cancel)
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartMatchmaking(tier.id);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition flex items-center justify-center gap-2"
                  >
                    <Flame className="h-4 w-4" />
                    Find 1v1 Battle Opponent
                  </button>
                )
              ) : (
                <button
                  onClick={() => setSelectedSubRoom(tier.id)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 transition"
                >
                  Select Sub-Room
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Battles & Spectator Judging Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Active Rap Battles & Spectator Arena</h3>
          </div>
          <span className="text-xs text-slate-400">
            {activeBattles.length} Ongoing Matches
          </span>
        </div>

        {activeBattles.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <Users className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No active battles in progress right now</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Click 'Find 1v1 Battle Opponent' above in your chosen sub-room (Flow, Fluent, Fanatic) to start a battle!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBattles.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 hover:border-amber-500/40 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-bold text-amber-400 border border-amber-500/20">
                    {b.tier} Tier • Round {b.currentRound}
                  </span>
                  <span className="text-slate-400 font-medium">{b.verses.length} Verses Dropped</span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-center flex-1">
                    <p className="font-bold text-sm text-white">{b.player1.nickname}</p>
                    <p className="text-[10px] text-slate-400">{b.player1.role}</p>
                  </div>
                  <span className="text-xs font-black text-amber-400 italic">VS</span>
                  <div className="text-center flex-1">
                    <p className="font-bold text-sm text-white">{b.player2.nickname}</p>
                    <p className="text-[10px] text-slate-400">{b.player2.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveBattleId(b.id)}
                  className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  <Play className="h-3.5 w-3.5" />
                  Enter Arena & Judge Battle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
