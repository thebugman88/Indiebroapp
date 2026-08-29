import React, { useState, useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';
import { Flame, Trophy, ChevronRight, Crown, Bell, MessageSquare } from 'lucide-react';
import { getInitials } from '../services/gamification';
import { getUnreadNotificationCount } from '../services/notificationService';
import { getUnreadDmCount } from '../services/dmService';
import { getCurrentAuthUser } from '../services/authService';

export const ProfileBadge: React.FC = () => {
  const { profile, levelDetails, setIsProfileModalOpen } = useGamification();
  const { currentTier, progressPct } = levelDetails;
  const [imgError, setImgError] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(getUnreadNotificationCount);
  const [unreadDms, setUnreadDms] = useState<number>(() => {
    const auth = getCurrentAuthUser();
    return getUnreadDmCount(auth.id);
  });

  // Synchronize unread notifications and direct messages
  useEffect(() => {
    const syncStatus = () => {
      setUnreadNotifs(getUnreadNotificationCount());
      const auth = getCurrentAuthUser();
      setUnreadDms(getUnreadDmCount(auth.id));
    };

    window.addEventListener('ib_notifications_changed', syncStatus);
    window.addEventListener('ib_dm_updated', syncStatus);
    window.addEventListener('ib_auth_changed', syncStatus);

    return () => {
      window.removeEventListener('ib_notifications_changed', syncStatus);
      window.removeEventListener('ib_dm_updated', syncStatus);
      window.removeEventListener('ib_auth_changed', syncStatus);
    };
  }, []);

  const unlockedBadgesCount = profile.badges.filter((b) => b.unlockedAt !== null).length;
  const isPro = profile.subscriptionTier === 'pro';
  const displayInitials = profile.avatarSeed || getInitials(profile.displayName);
  const hasAlerts = unreadNotifs > 0 || unreadDms > 0;

  return (
    <button
      onClick={() => setIsProfileModalOpen(true)}
      className={`group relative flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border ${
        unreadDms > 0
          ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20'
          : unreadNotifs > 0
          ? 'border-amber-500/80 shadow-lg shadow-amber-500/20'
          : isPro
          ? 'border-amber-500/60 shadow-amber-500/10'
          : 'border-zinc-800 hover:border-amber-500/40'
      } transition-all duration-200 text-left shadow-lg cursor-pointer max-w-full`}
      title={`Open Creator OS & Activity Hub ${
        unreadDms > 0 ? `(${unreadDms} New Direct Message${unreadDms > 1 ? 's' : ''})` : ''
      } ${unreadNotifs > 0 ? `(${unreadNotifs} New Alert${unreadNotifs > 1 ? 's' : ''})` : ''}`}
      id="profile-progression-badge"
    >
      {/* Avatar with level badge ring & dynamic blinking alert beacons */}
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

        {/* Pro Crown or Level Tag */}
        {isPro ? (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-zinc-950 shadow z-10">
            <Crown className="w-2.5 h-2.5 fill-zinc-950" />
          </div>
        ) : (
          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-zinc-950 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-400 leading-none z-10">
            L{currentTier.level}
          </div>
        )}

        {/* 🌟 BLINKING INDICATORS FOR NOTIFICATIONS & DIRECT MESSAGES */}
        {/* GREEN BLINKING BEACON for Direct Messages */}
        {unreadDms > 0 && (
          <span
            className="absolute -top-1.5 -left-1.5 flex h-3.5 w-3.5 z-20"
            title={`${unreadDms} unread message${unreadDms > 1 ? 's' : ''}`}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-zinc-950 items-center justify-center text-[7px] font-black text-white shadow-sm" />
          </span>
        )}

        {/* YELLOW BLINKING BEACON for Notifications */}
        {unreadNotifs > 0 && (
          <span
            className={`absolute ${
              unreadDms > 0 ? '-bottom-1.5 -left-1.5' : '-top-1.5 -left-1.5'
            } flex h-3.5 w-3.5 z-20`}
            title={`${unreadNotifs} unread notification${unreadNotifs > 1 ? 's' : ''}`}
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-zinc-950 items-center justify-center text-[7px] font-black text-zinc-950 shadow-sm" />
          </span>
        )}
      </div>

      {/* Profile info & XP progress bar (Desktop / Tablet) */}
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

        {/* Dynamic Status / Alerts or Level Title */}
        <div className="flex items-center justify-between text-[10px] font-mono mt-0.5 leading-tight">
          {unreadDms > 0 ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <MessageSquare className="w-2.5 h-2.5" />
              {unreadDms} New DM{unreadDms > 1 ? 's' : ''}
            </span>
          ) : unreadNotifs > 0 ? (
            <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
              <Bell className="w-2.5 h-2.5" />
              {unreadNotifs} New Alert{unreadNotifs > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="truncate text-zinc-300 font-medium">
              {isPro ? 'Artist Pro • ' : ''}Lvl {currentTier.level} • {currentTier.title}
            </span>
          )}
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-zinc-950/80 rounded-full h-1.5 mt-1 border border-zinc-800 overflow-hidden relative">
          <div
            className={`h-full bg-gradient-to-r ${currentTier.color} transition-all duration-500 ease-out`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Quick Trophy counter & alerts pill */}
      <div className="hidden md:flex items-center gap-1 pl-1 text-zinc-500 group-hover:text-amber-400 transition-colors">
        {hasAlerts ? (
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {unreadDms > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                {unreadDms} DM
              </span>
            )}
            {unreadNotifs > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                {unreadNotifs}
              </span>
            )}
          </div>
        ) : (
          <>
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono font-bold text-zinc-300">{unlockedBadgesCount}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
};

