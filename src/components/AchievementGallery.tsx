import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  PenTool,
  Database,
  Flame,
  Radio,
  Gavel,
  Brain,
  Users,
  Dna,
  Zap,
  Filter
} from 'lucide-react';
import { Badge, BadgeTier } from '../services/gamification';
import { useGamification } from '../context/GamificationContext';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  PenTool,
  Database,
  Flame,
  Radio,
  Sparkles,
  Gavel,
  Brain,
  Users,
  Dna,
  Zap
};

export const AchievementGallery: React.FC<{ maxItems?: number; showFilters?: boolean }> = ({
  maxItems,
  showFilters = true
}) => {
  const { profile } = useGamification();
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredBadges = profile.badges.filter((badge) => {
    const matchesTier = selectedTier === 'All' || badge.tier === selectedTier;
    const matchesCategory = selectedCategory === 'All' || badge.category === selectedCategory;
    return matchesTier && matchesCategory;
  });

  const displayedBadges = maxItems ? filteredBadges.slice(0, maxItems) : filteredBadges;
  const unlockedCount = profile.badges.filter((b) => b.unlockedAt !== null).length;

  const tierColors: Record<BadgeTier, { border: string; text: string; bg: string; badge: string }> = {
    Bronze: {
      border: 'border-amber-700/60',
      text: 'text-amber-600',
      bg: 'bg-amber-950/20',
      badge: 'bg-amber-800/30 text-amber-500 border-amber-700/50'
    },
    Silver: {
      border: 'border-zinc-400/60',
      text: 'text-zinc-300',
      bg: 'bg-zinc-800/30',
      badge: 'bg-zinc-700/40 text-zinc-200 border-zinc-500/50'
    },
    Gold: {
      border: 'border-amber-500/60',
      text: 'text-amber-400',
      bg: 'bg-amber-950/30',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
    },
    Platinum: {
      border: 'border-cyan-400/60',
      text: 'text-cyan-300',
      bg: 'bg-cyan-950/30',
      badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Trophy Room & Badges</h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
            {unlockedCount} / {profile.badges.length} Unlocked
          </span>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'Bronze', 'Silver', 'Gold', 'Platinum'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                  selectedTier === tier
                    ? 'bg-zinc-800 text-amber-400 border border-zinc-700 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedBadges.map((badge) => {
          const isUnlocked = badge.unlockedAt !== null;
          const IconComponent = ICON_MAP[badge.icon] || Trophy;
          const tierStyle = tierColors[badge.tier] || tierColors.Bronze;
          const progressPct = Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100));

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                isUnlocked
                  ? `${tierStyle.bg} ${tierStyle.border} shadow-lg shadow-black/40`
                  : 'bg-zinc-950/60 border-zinc-800/80 opacity-75 hover:opacity-100'
              }`}
            >
              {/* Subtle Ambient Glow for unlocked */}
              {isUnlocked && (
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              )}

              <div className="space-y-2.5 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-md transition-transform ${
                        isUnlocked
                          ? `${tierStyle.badge} group-hover:scale-105`
                          : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                      }`}
                    >
                      {isUnlocked ? (
                        <IconComponent className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white tracking-tight">{badge.name}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-medium line-clamp-1">{badge.tagline}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${tierStyle.badge}`}
                  >
                    {badge.tier}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">{badge.description}</p>
              </div>

              {/* Progress or Unlock Status */}
              <div className="pt-3 mt-3 border-t border-zinc-800/80 space-y-1.5 relative z-10">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">
                    {isUnlocked ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span>
                        {badge.progress} / {badge.maxProgress} {badge.progressLabel}
                      </span>
                    )}
                  </span>
                  <span className="text-amber-400 font-bold">+{badge.xpReward} XP</span>
                </div>

                {!isUnlocked && (
                  <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
