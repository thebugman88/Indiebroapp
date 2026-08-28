import React, { useState } from 'react';
import { useGamification } from '../context/GamificationContext';
import { Flame, Trophy, ChevronRight, Crown } from 'lucide-react';
import { getInitials } from '../services/gamification';

export const ProfileBadge: React.FC = () => {
  const { profile, levelDetails, setIsProfileModalOpen } = useGamification();
  const { currentTier, progressPct } = levelDetails;
  const [imgError, setImgError] = useState(false);

  const unlockedBadgesCount = profile.badges.filter((b) => b.unlockedAt !== null).length;
  const isPro = profile.subscriptionTier === 'pro';
  const displayInitials = profile.avatarSeed || getInitials(profile.displayName);

  return (
    <button
      onClick={() => setIsProfileModalOpen(true)}
      className={`group relative flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border ${
        isPro ? 'border-amber-500/60 shadow-amber-500/10' : 'border-zinc-800 hover:border-amber-500/40'
      } transition-all duration-200 text-left shadow-lg cursor-pointer`}
      title="Open Profile & Progression OS"
      id="profile-progression-badge"
    >
      {/* Avatar with level badge ring */}
      <div className="relative flex-shrink-0">
        {profile.avatarUrl && !imgError ? (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-md border border-white/15 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr ${
              profile.avatarBg || 'from-amber-500 to-orange-600'
            } flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-md border border-white/15 group-hover:scale-105 transition-transform select-none`}
          >
            {displayInitials}
          </div>
        )}

        {/* Pro Crown or Level */}
        {isPro ? (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-zinc-950 shadow">
            <Crown className="w-2.5 h-2.5 fill-zinc-950" />
          </div>
        ) : (
          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-zinc-950 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-400 leading-none">
            L{currentTier.level}
          </div>
        )}
      </div>

      {/* Profile info & XP progress bar */}
      <div className="hidden sm:flex flex-col min-w-[120px] lg:min-w-[150px] max-w-[170px]">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors flex items-center gap-1">
            {profile.displayName}
            {isPro && <Crown className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
          </span>
          <span className="text-[10px] font-mono font-semibold text-amber-400 flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
            {profile.currentStreak}d
          </span>
        </div>

        {/* Level Title & XP numbers */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-0.5 leading-tight">
          <span className="truncate text-zinc-300 font-medium">
            {isPro ? 'Artist Pro • ' : ''}Lvl {currentTier.level} • {currentTier.title}
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-zinc-950/80 rounded-full h-1.5 mt-1 border border-zinc-800 overflow-hidden relative">
          <div
            className={`h-full bg-gradient-to-r ${currentTier.color} transition-all duration-500 ease-out`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Quick Trophy counter / Chevron */}
      <div className="hidden md:flex items-center gap-1 pl-1 text-zinc-500 group-hover:text-amber-400 transition-colors">
        <Trophy className="w-3.5 h-3.5" />
        <span className="text-[10px] font-mono font-bold text-zinc-300">{unlockedBadgesCount}</span>
        <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
};
