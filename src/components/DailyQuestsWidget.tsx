import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Gift,
  Zap,
  Target,
  Trophy
} from 'lucide-react';
import { useGamification } from '../context/GamificationContext';

interface DailyQuestsWidgetProps {
  onNavigateToApp: (appId: string) => void;
}

export const DailyQuestsWidget: React.FC<DailyQuestsWidgetProps> = ({ onNavigateToApp }) => {
  const { profile, claimQuestReward, completeDailyPipeline, awardXP } = useGamification();
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  const streakMultiplier = profile.currentStreak >= 7 ? '+15%' : profile.currentStreak >= 3 ? '+10%' : '+0%';

  const pipelineSteps = [
    { app: 'quick-tools', label: '1. BPM & Key Finder', xp: 20 },
    { app: 'lyric-pro', label: '2. Dual-Set Lyrics', xp: 25 },
    { app: 'hit-analyzer', label: '3. Hit Velocity Audit', xp: 40 },
    { app: 'judgement-zone', label: '4. Blind Peer Review', xp: 50 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Daily Quests Board (2 Columns on Large Screens) */}
      <div className="lg:col-span-2 p-5 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d101a] border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Daily Studio Quests & Bounties
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Resets at Midnight</span>
          </div>
        </div>

        <div className="space-y-3">
          {profile.dailyQuests.map((quest) => {
            const isDone = quest.progress >= quest.maxProgress || quest.completed;
            const isClaimed = quest.claimed;

            return (
              <div
                key={quest.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isClaimed
                    ? 'bg-zinc-950/40 border-zinc-850 opacity-60'
                    : isDone
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isClaimed
                        ? 'bg-zinc-800 text-zinc-500'
                        : isDone
                        ? 'bg-emerald-500 text-zinc-950 shadow-md'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {isClaimed || isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{quest.title}</h4>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                        +{quest.xpReward} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                      {quest.description}
                    </p>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isClaimed ? (
                    <span className="text-[11px] font-mono text-zinc-500 font-semibold px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      Claimed
                    </span>
                  ) : isDone ? (
                    <button
                      onClick={() => claimQuestReward(quest.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 animate-pulse cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Claim +{quest.xpReward} XP</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigateToApp(quest.targetApp)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                    >
                      <span>Start Quest</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Streak & Production Pipeline Multiplier Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-[#0d101a] border border-zinc-800 space-y-4 shadow-xl flex flex-col justify-between">
        {/* Streak Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Creative Streak</h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400">
              {streakMultiplier} XP Bonus
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold text-white flex items-center gap-1">
                {profile.currentStreak} <span className="text-xs font-mono text-zinc-400 font-normal">days active</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {profile.currentStreak >= 7
                  ? 'Maximum 7-Day Champion tier reached!'
                  : `${7 - profile.currentStreak} more days to unlock +15% XP multiplier`}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-xl">
              🔥
            </div>
          </div>
        </div>

        {/* 4-Step Pipeline Challenge Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-950/30 to-zinc-900/60 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Daily Pipeline Challenge
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">+150 XP</span>
          </div>

          <p className="text-[11px] text-zinc-300">
            Execute all 4 studios in sequence to master the end-to-end creative loop.
          </p>

          {profile.pipelineCompletedToday ? (
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
              <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pipeline Bonus Claimed Today!
              </p>
            </div>
          ) : (
            <button
              onClick={completeDailyPipeline}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Complete Pipeline & Claim +150 XP</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
