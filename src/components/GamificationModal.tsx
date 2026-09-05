import { PlanAndCoins } from './PlanAndCoins';
import { authenticatedFetch } from '../services/authService';
import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Flame,
  Sparkles,
  Shield,
  Clock,
  User,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Edit2,
  Check,
  RotateCcw,
  Crown,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Activity,
  Terminal,
  AlertTriangle,
  Server,
  Bell,
  MessageSquare
} from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import {
  AVATAR_OPTIONS,
  AVATAR_BG_OPTIONS,
  LEVEL_TIERS,
  getInitials
} from '../services/gamification';
import { AchievementGallery } from './AchievementGallery';
import { NotificationFeedList } from './NotificationCenter';
import { DirectMessagesContent } from './DirectMessagesModal';
import { getCurrentAuthUser, RegisteredUser } from '../services/authService';
import { getUnreadNotificationCount } from '../services/notificationService';
import { getUnreadDmCount } from '../services/dmService';

export const GamificationModal: React.FC = () => {
  const {
    profile,
    levelDetails,
    isProfileModalOpen,
    setIsProfileModalOpen,
    updateProfile,
    updateProfileName,
    updateAvatar,
    resetProgress,
  } = useGamification();

  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'messages' | 'billing' | 'badges' | 'history' | 'sentinel' | 'customize'>('overview');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.displayName);
  const [tempHandle, setTempHandle] = useState(profile.artistHandle || '@creator');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(profile.avatarUrl || '');

  const [currentUser, setCurrentUser] = useState<RegisteredUser>(getCurrentAuthUser);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(getUnreadNotificationCount);
  const [unreadDms, setUnreadDms] = useState<number>(() => getUnreadDmCount(getCurrentAuthUser().id));

  useEffect(() => {
    const openPlanAndCoins = () => {
      setActiveTab('billing');
      setIsProfileModalOpen(true);
    };
    window.addEventListener('ib_open_plan_coins', openPlanAndCoins);
    return () => window.removeEventListener('ib_open_plan_coins', openPlanAndCoins);
  }, [setIsProfileModalOpen]);

  // Synchronize unread notifications and DMs
  useEffect(() => {
    const updateCounters = () => {
      const auth = getCurrentAuthUser();
      setUnreadNotifications(getUnreadNotificationCount());
      setUnreadDms(getUnreadDmCount(auth.id));
      setCurrentUser(auth);
    };

    window.addEventListener('ib_notifications_changed', updateCounters);
    window.addEventListener('ib_dm_updated', updateCounters);
    window.addEventListener('ib_auth_changed', updateCounters);

    return () => {
      window.removeEventListener('ib_notifications_changed', updateCounters);
      window.removeEventListener('ib_dm_updated', updateCounters);
      window.removeEventListener('ib_auth_changed', updateCounters);
    };
  }, []);

  // Sentinel & Resiliency Live Telemetry State
  const [sentinelStats, setSentinelStats] = useState<any>(null);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [transactionLogs, setTransactionLogs] = useState<any[]>([]);
  const [resiliencePolicy, setResiliencePolicy] = useState<any>(null);
  const [isLoadingSentinel, setIsLoadingSentinel] = useState(false);

  useEffect(() => {
    if (activeTab === 'sentinel') {
      setIsLoadingSentinel(true);
      Promise.all([
        authenticatedFetch('/api/security/stats').then((r) => r.json()).catch(() => null),
        authenticatedFetch('/api/security/logs').then((r) => r.json()).catch(() => null),
        authenticatedFetch('/api/audit/transactions').then((r) => r.json()).catch(() => null),
        authenticatedFetch('/api/resilience/status').then((r) => r.json()).catch(() => null),
      ]).then(([stats, secLogs, txLogs, resPolicy]) => {
        if (stats) setSentinelStats(stats);
        if (secLogs?.logs) setSecurityLogs(secLogs.logs);
        if (txLogs?.records) setTransactionLogs(txLogs.records);
        if (resPolicy) setResiliencePolicy(resPolicy);
        setIsLoadingSentinel(false);
      });
    }
  }, [activeTab]);

  if (!isProfileModalOpen) return null;

  const { currentTier, nextTier, progressPct, xpInLevel, xpRequiredForLevel } = levelDetails;
  const unlockedBadgesCount = profile.badges.filter((b) => b.unlockedAt !== null).length;
  const isPro = profile.subscriptionTier === 'pro';

  const handleSaveIdentity = () => {
    updateProfile({
      displayName: tempName.trim() || 'Independent Creator',
      artistHandle: tempHandle.trim().startsWith('@') ? tempHandle.trim() : `@${tempHandle.trim()}`,
      avatarUrl: customAvatarUrl.trim() || undefined,
      avatarSeed: getInitials(tempName)
    });
    setEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#0b0e17] border border-zinc-700/80 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 1. Modal Top Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-zinc-900 via-[#101524] to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">indiebrotherhood Creator OS</h2>
                {isPro ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black flex items-center gap-1">
                    <Crown className="w-3 h-3 fill-zinc-950" />
                    ARTIST PRO
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold">
                    STARTER FREE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">Universal XP, level perks, billing, and unlocked studio badges</p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Hero Level Banner */}
        <div className="p-4 sm:p-6 bg-[#0e121e] border-b border-zinc-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Avatar & Display Name */}
            <div className="flex items-center gap-3.5">
              <div className="relative flex-shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl object-cover shadow-xl border-2 border-white/20"
                  />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${
                      profile.avatarBg || 'from-amber-500 to-orange-600'
                    } flex items-center justify-center text-lg font-black text-white shadow-xl border-2 border-white/20 select-none`}
                  >
                    {profile.avatarSeed || getInitials(profile.displayName)}
                  </div>
                )}
                {isPro ? (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-zinc-950 shadow">
                    <Crown className="w-3 h-3 fill-zinc-950" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-zinc-950 border border-amber-500/60 text-[10px] font-mono font-bold text-amber-400 leading-none">
                    L{currentTier.level}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {editingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Creator Name"
                        className="bg-zinc-900 border border-amber-500/60 text-white text-xs font-bold px-2 py-1 rounded-lg focus:outline-none w-36"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={tempHandle}
                        onChange={(e) => setTempHandle(e.target.value)}
                        placeholder="@handle"
                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded-lg focus:outline-none w-24"
                      />
                      <button
                        onClick={handleSaveIdentity}
                        className="p-1 rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                        {profile.displayName}
                        {isPro && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      </h3>
                      <span className="text-xs text-zinc-400 font-mono">{profile.artistHandle || '@creator'}</span>
                      <button
                        onClick={() => {
                          setTempName(profile.displayName);
                          setTempHandle(profile.artistHandle || '@creator');
                          setEditingName(true);
                        }}
                        className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                        title="Edit display identity"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                  <span className="text-amber-400 font-bold">Level {currentTier.level}</span>
                  <span>•</span>
                  <span className="text-zinc-300 font-semibold">{currentTier.title}</span>
                  {isPro && <span className="text-emerald-400 font-bold">• 2.5x XP Boost Active</span>}
                </div>
              </div>
            </div>

            {/* Quick Stat Pill Trio */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex-1 sm:flex-initial">
                <p className="text-[10px] font-mono text-zinc-400 uppercase">Total XP</p>
                <p className="text-sm font-bold text-amber-400">{profile.totalXp.toLocaleString()} XP</p>
              </div>

              <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex-1 sm:flex-initial">
                <p className="text-[10px] font-mono text-zinc-400 uppercase">Streak</p>
                <p className="text-sm font-bold text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  {profile.currentStreak}d
                </p>
              </div>

              <div className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex-1 sm:flex-initial">
                <p className="text-[10px] font-mono text-zinc-400 uppercase">Badges</p>
                <p className="text-sm font-bold text-purple-400">{unlockedBadgesCount} / {profile.badges.length}</p>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">
                Progress: <strong className="text-white">{xpInLevel.toLocaleString()} / {xpRequiredForLevel.toLocaleString()} XP</strong>
              </span>
              <span className="text-amber-400 font-bold">
                {nextTier ? `${progressPct}% to ${nextTier.title}` : 'Max Level Reached'}
              </span>
            </div>

            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800/80 p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${currentTier.color} transition-all duration-500`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex min-h-12 shrink-0 items-center border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 overflow-x-auto text-xs font-medium scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'notifications'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500 text-slate-950 animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeTab === 'messages'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Direct Messages</span>
            {unreadDms > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500 text-slate-950 animate-pulse">
                {unreadDms}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'billing'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Plan & Billing ($14.99 Pro)</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'badges'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Trophy Room ({unlockedBadgesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>XP Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('sentinel')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'sentinel'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sentinel</span>
          </button>

          <button
            onClick={() => setActiveTab('customize')}
            className={`py-3 px-3.5 border-b-2 font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'customize'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Avatar Flair</span>
          </button>
        </div>

        {/* 4. Tab Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Real-Time Notifications & Studio Alerts</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live updates on collaboration requests, achievements, and mastering exports.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
                <NotificationFeedList />
              </div>
            </div>
          )}

          {/* TAB: DIRECT MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Direct Artist Messaging & Voice Notes</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live stems coordination, voice notes, and collaboration chats with fellow producers.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 min-h-[480px]">
                <DirectMessagesContent currentUser={currentUser} />
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW & PERKS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Level Perks */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Current Level {currentTier.level} Unlocked Perks</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentTier.perks.map((perk, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-zinc-200 font-medium">{perk}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Level Teaser */}
              {nextTier && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span>Next Rank: Level {nextTier.level} - {nextTier.title}</span>
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">
                      Requires {nextTier.minXp.toLocaleString()} XP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {nextTier.perks.map((perk, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-2 text-zinc-400"
                      >
                        <Lock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All 10 Tiers Milestone Ladder */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Creator Ladder Hierarchy</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {LEVEL_TIERS.map((tier) => {
                    const isPassed = profile.totalXp >= tier.minXp;
                    const isCurrent = currentTier.level === tier.level;

                    return (
                      <div
                        key={tier.level}
                        className={`p-3 rounded-2xl border text-center space-y-1 transition ${
                          isCurrent
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                            : isPassed
                            ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-600 opacity-60'
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold uppercase">Lvl {tier.level}</p>
                        <p className="text-xs font-bold truncate">{tier.title}</p>
                        <p className="text-[10px] font-mono text-zinc-500">{tier.minXp.toLocaleString()} XP</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BILLING & $14.99 PRO */}
          {activeTab === 'billing' && <PlanAndCoins />}

          {/* TAB 3: BADGES GALLERY */}
          {activeTab === 'badges' && (
            <AchievementGallery maxItems={profile.badges.length} showFilters={true} />
          )}

          {/* TAB 4: XP ACTIVITY LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Chronological Activity Ledger</span>
                </h3>
                <span className="text-xs font-mono text-zinc-400">{profile.activities.length} Recorded</span>
              </div>

              {profile.activities.length === 0 ? (
                <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No XP Activity Recorded Yet</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Launch any of the 10 studio tools, analyze tracks, write lyrics, or complete daily quests to earn creator XP and level up.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.activities.map((act) => {
                    const date = new Date(act.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={act.id}
                        className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{act.title}</p>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
                              <span className="text-amber-400/80 font-semibold">{act.sourceApp}</span>
                              <span>•</span>
                              <span>{date}</span>
                            </div>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl border border-amber-500/20 whitespace-nowrap">
                          +{act.amount} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI SENTINEL, RESILIENCY & TRANSACTION AUDIT */}
          {activeTab === 'sentinel' && (
            <div className="space-y-6">
              {/* Header Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">AI Resiliency Engine</p>
                    <p className="text-base font-black text-white mt-1">Tiered Fallback</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Primary: Gemini 2.5 Pro</p>
                  </div>
                  <Cpu className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-amber-500/30 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">Code Sentinel Observer</p>
                    <p className="text-base font-black text-white mt-1">Active Threat Shield</p>
                    <p className="text-[11px] text-amber-400 font-mono mt-0.5">
                      {sentinelStats?.threatsBlocked ?? 0} Blocked • {sentinelStats?.selfRepairsExecuted ?? 0} Auto-Repairs
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-purple-500/30 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-zinc-400 uppercase">Transaction Audit Shield</p>
                    <p className="text-base font-black text-white mt-1">3-Stage Idempotent</p>
                    <p className="text-[11px] text-purple-400 font-mono mt-0.5">
                      {transactionLogs.length} Audited Transactions
                    </p>
                  </div>
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              {/* Multi-Model Fallback Chain Visualizer */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>Multi-Model API Resilience Chain</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Auto-Retry 429/503/Timeout
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">1. Primary Tier</span>
                    <p className="text-xs font-bold text-white">Gemini 2.5 Pro</p>
                    <p className="text-[10px] text-zinc-400">Deep theory & multimodal analysis</p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">2. Fast Fallback</span>
                    <p className="text-xs font-bold text-white">Gemini 2.5 Flash</p>
                    <p className="text-[10px] text-zinc-400">High speed, versatile generation</p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">3. High Context</span>
                    <p className="text-xs font-bold text-white">Gemini 1.5 Pro</p>
                    <p className="text-[10px] text-zinc-400">Secondary fallback</p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">4. Low Latency</span>
                    <p className="text-xs font-bold text-white">Gemini 1.5 Flash</p>
                    <p className="text-[10px] text-zinc-400">Ultra-fast safety fallback</p>
                  </div>
                </div>
              </div>

              {/* 3-Stage Transaction Audit Ledger */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>Durable payment delivery log</span>
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">Server-verified records</span>
                </div>

                {transactionLogs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
                    No payment records loaded. Verified purchases record initiation, processing, receipt and delivery.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {transactionLogs.slice(0, 5).map((tx) => (
                      <div
                        key={tx.transactionId}
                        className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-white font-bold">{tx.transactionId}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                tx.status === 'fulfilled'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            Idempotency Key: {tx.idempotencyKey.slice(0, 18)}... • Stage: {tx.stage}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-amber-400">${tx.amountUsd.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Code Sentinel Security Findings */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>Code Sentinel Observer & Threat Findings</span>
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400">logs/security-audit.json</span>
                </div>

                {securityLogs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All incoming payloads clear. Zero active threat signatures detected.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {securityLogs.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-start justify-between text-xs gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                  : item.severity === 'HIGH'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {item.severity}
                            </span>
                            <span className="text-white font-semibold">{item.threatType}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({item.actionTaken})</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            Origin: {item.threatOriginIp} • Endpoint: {item.endpoint}
                          </p>
                          <p className="text-[10px] text-zinc-300">
                            Remedy: {item.recommendedRemediation}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AVATAR & CUSTOMIZATION */}
          {activeTab === 'customize' && (
            <div className="space-y-6">
              {/* Profile Photo URL Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  Custom Profile Avatar Photo URL (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="flex-1 bg-zinc-900 border border-zinc-800 text-white text-xs px-3 py-2 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      updateProfile({ avatarUrl: customAvatarUrl.trim() || undefined });
                    }}
                    className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl hover:bg-amber-400 cursor-pointer"
                  >
                    Save Photo
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">Leave blank to use your dynamic monogram initials or preset icons below.</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  Select Preset Icon / Emoji
                </h4>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.emoji}
                      onClick={() => {
                        updateProfile({ avatarUrl: undefined });
                        updateAvatar(opt.emoji, profile.avatarBg, 'preset');
                      }}
                      className={`p-3 rounded-2xl text-2xl flex flex-col items-center justify-center transition border cursor-pointer ${
                        profile.avatarSeed === opt.emoji && !profile.avatarUrl
                          ? 'bg-amber-500/20 border-amber-500 shadow-md scale-105'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                      title={opt.name}
                    >
                      <span>{opt.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  Select Avatar Aura Background Gradient
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_BG_OPTIONS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => updateAvatar(profile.avatarSeed, bg)}
                      className={`h-10 rounded-xl bg-gradient-to-tr ${bg} transition border-2 cursor-pointer ${
                        profile.avatarBg === bg
                          ? 'border-white shadow-lg scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-mono">Reset progression stats:</span>
                <button
                  onClick={() => {
                    if (confirm('Reset your XP and badges to initial empty state?')) {
                      resetProgress();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 text-xs font-mono border border-zinc-800 hover:border-red-500/40 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Profile State</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
