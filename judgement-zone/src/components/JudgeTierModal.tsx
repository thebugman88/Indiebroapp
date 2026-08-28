import React from 'react';
import { X, Award, Crown, Sparkles, ShieldCheck, Ear, Flame, Zap, CheckCircle2, Music2 } from 'lucide-react';
import { JUDGE_TIERS } from '../utils/matchmaker';
import { UserJudgeProfile } from '../types';

interface JudgeTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserJudgeProfile;
}

export const JudgeTierModal: React.FC<JudgeTierModalProps> = ({ isOpen, onClose, userProfile }) => {
  if (!isOpen) return null;

  const currentTierData = JUDGE_TIERS[userProfile.judgeTier];
  const allTiers = Object.values(JUDGE_TIERS).sort((a, b) => a.level - b.level);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Grand Arbiter':
        return <Crown className="w-5 h-5 text-amber-300" />;
      case 'Master Tastemaker':
        return <Sparkles className="w-5 h-5 text-purple-300" />;
      case 'Verified Auditor':
        return <Award className="w-5 h-5 text-cyan-300" />;
      case 'Cadet Critic':
        return <ShieldCheck className="w-5 h-5 text-emerald-300" />;
      default:
        return <Ear className="w-5 h-5 text-zinc-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="judge-tier-modal-card"
        className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          id="close-judge-tier-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
            <Flame className="w-3.5 h-3.5" /> JUDGE HIERARCHY & REPUTATION ENGINE
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Auditor Tiers & Consensus Multipliers
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
            Earn Judge XP by delivering thorough, constructive audits, listening to 100% of tracks, and authoring highly-rated original songs.
          </p>
        </div>

        {/* Current User Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-6 text-center">
          <div className="p-2">
            <div className="text-xs text-zinc-400 font-mono">Current Tier</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5 truncate">{userProfile.judgeTier}</div>
          </div>
          <div className="p-2">
            <div className="text-xs text-zinc-400 font-mono">Total XP</div>
            <div className="text-sm font-bold text-white mt-0.5">{userProfile.judgeXp} XP</div>
          </div>
          <div className="p-2">
            <div className="text-xs text-zinc-400 font-mono">Audits Complete</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{userProfile.auditsCompletedTotal}</div>
          </div>
          <div className="p-2">
            <div className="text-xs text-zinc-400 font-mono">Songs Judged Good</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5 flex items-center justify-center gap-1">
              <Music2 className="w-3.5 h-3.5" />
              {userProfile.songsJudgedGoodCount}
            </div>
          </div>
        </div>

        {/* Tier Cards List */}
        <div className="space-y-3">
          {allTiers.map(tierItem => {
            const isUserCurrent = userProfile.judgeTier === tierItem.tier;
            const isUnlocked = userProfile.judgeXp >= tierItem.minXp;

            return (
              <div
                key={tierItem.tier}
                className={`p-4 rounded-2xl border transition-all ${
                  isUserCurrent
                    ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/50 ring-1 ring-amber-500/30'
                    : isUnlocked
                    ? 'bg-zinc-900/60 border-zinc-800'
                    : 'bg-zinc-950 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${tierItem.badgeColor} border`}>
                      {getTierIcon(tierItem.tier)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{tierItem.title}</span>
                        {isUserCurrent && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-amber-950 font-black">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">
                        Required: {tierItem.minXp} XP • {tierItem.multiplier}x Multiplier
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-900 text-amber-400 border border-zinc-800">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {tierItem.multiplier}x Multiplier
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80">
                  <div className="text-xs font-mono text-zinc-400 mb-1.5">Tier Privileges:</div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-300">
                    {tierItem.perks.map((perk, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-1.5 text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* How to Rank Up explanation */}
        <div className="mt-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" /> How Judge Score & Multipliers Are Calculated:
          </div>
          <p>
            1. <strong>Listen Integrity</strong>: Complete 100% of a song for a +1.6x multiplier (+50 Bonus XP).
          </p>
          <p>
            2. <strong>Constructive Depth</strong>: Detailed constructive critiques (&gt;250 chars) award up to +1.75x feedback bonus.
          </p>
          <p>
            3. <strong>Creator Quality</strong>: Having your own submitted tracks achieve an overall score of 8.0+ from the 10-Judge peer consensus earns the "Songs Judged Good" creator accolade and boosts your auditor reputation.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            id="close-judge-tier-footer-btn"
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold rounded-xl hover:from-amber-400 hover:to-yellow-400 transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
