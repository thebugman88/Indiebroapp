import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Flame,
  Award,
  ArrowUpCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { LevelInfo, Badge, DailyQuest } from '../services/gamification';

interface ToastData {
  id: string;
  actionTitle: string;
  amount: number;
  sourceApp: string;
  leveledUp?: boolean;
  newLevel?: LevelInfo;
  unlockedBadge?: Badge;
  completedQuest?: DailyQuest;
}

export const AchievementToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<ToastData, 'id'>>;
      if (!customEvent.detail) return;

      const newToast: ToastData = {
        ...customEvent.detail,
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    };

    window.addEventListener('ib_xp_granted_toast', handleToastEvent);
    return () => {
      window.removeEventListener('ib_xp_granted_toast', handleToastEvent);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Progression notifications"
      className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const isLevelUp = toast.leveledUp && toast.newLevel;
        const isBadge = !!toast.unlockedBadge;
        const isQuest = !!toast.completedQuest;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in ${
              isLevelUp
                ? 'bg-gradient-to-r from-amber-950/90 to-zinc-900/95 border-amber-500/60 shadow-amber-500/20 text-white ring-1 ring-amber-400/30'
                : isBadge
                ? 'bg-gradient-to-r from-purple-950/90 to-zinc-900/95 border-purple-500/60 shadow-purple-500/20 text-white'
                : isQuest
                ? 'bg-gradient-to-r from-emerald-950/90 to-zinc-900/95 border-emerald-500/60 shadow-emerald-500/20 text-white'
                : 'bg-zinc-900/95 border-zinc-700/80 shadow-black/60 text-zinc-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isLevelUp
                    ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                    : isBadge
                    ? 'bg-purple-500 text-white shadow-md'
                    : isQuest
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isLevelUp ? (
                  <ArrowUpCircle className="w-5 h-5 animate-bounce" />
                ) : isBadge ? (
                  <Trophy className="w-5 h-5" />
                ) : isQuest ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>

              {/* Text Body */}
              <div className="flex-1 min-w-0 pr-1">
                {isLevelUp ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        Level Up!
                      </span>
                      <span className="text-xs font-mono text-zinc-400">Rank {toast.newLevel?.level}</span>
                    </div>
                    <p className="text-sm font-extrabold text-white mt-0.5">
                      {toast.newLevel?.title}
                    </p>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      Unlocked: {toast.newLevel?.perks[0]}
                    </p>
                  </div>
                ) : isBadge ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-300">
                        Achievement Unlocked
                      </span>
                      <span className="text-xs font-mono text-amber-400 font-bold">+{toast.unlockedBadge?.xpReward} XP</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {toast.unlockedBadge?.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {toast.unlockedBadge?.tagline}
                    </p>
                  </div>
                ) : isQuest ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300">
                        Daily Quest Ready
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">+{toast.completedQuest?.xpReward} XP</span>
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {toast.completedQuest?.title}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">
                        {toast.sourceApp}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        +{toast.amount} XP
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-200 mt-0.5 line-clamp-1">
                      {toast.actionTitle}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Dismiss Button */}
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </aside>
  );
};
