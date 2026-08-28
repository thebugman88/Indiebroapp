import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  Trash2,
  Volume2,
  VolumeX,
  Radio,
  Users,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  X,
  Clock,
  Crown,
} from 'lucide-react';
import {
  AppNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  getUnreadNotificationCount,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from '../services/notificationService';

interface NotificationCenterProps {
  onNavigateTo?: (appId: string) => void;
}

export function NotificationCenter({ onNavigateTo }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(getNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(getUnreadNotificationCount);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isNotificationSoundEnabled);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize on global event
  useEffect(() => {
    const handleUpdate = () => {
      const list = getNotifications();
      setNotifications(list);
      setUnreadCount(getUnreadNotificationCount());
    };

    window.addEventListener('ib_notifications_changed', handleUpdate);
    return () => window.removeEventListener('ib_notifications_changed', handleUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setNotificationSoundEnabled(next);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      if (notif.actionUrl.startsWith('#') && onNavigateTo) {
        onNavigateTo(notif.actionUrl.replace('#', ''));
      } else {
        window.location.hash = notif.actionUrl.replace('#', '');
      }
      setIsOpen(false);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'broadcasts') return n.category === 'broadcast' || n.type === 'admin';
    if (activeFilter === 'meetings') return n.category === 'meeting';
    if (activeFilter === 'studio') return n.category === 'studio' || n.category === 'achievement';
    return true;
  });

  const getCategoryIcon = (n: AppNotification) => {
    if (n.category === 'broadcast' || n.type === 'admin') return <Crown className="w-4 h-4 text-amber-400" />;
    if (n.category === 'meeting') return <Users className="w-4 h-4 text-blue-400" />;
    if (n.category === 'studio') return <Sparkles className="w-4 h-4 text-emerald-400" />;
    if (n.type === 'emergency' || n.type === 'warning') return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    return <Bell className="w-4 h-4 text-amber-400" />;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-center-trigger-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-amber-400 transition cursor-pointer flex items-center justify-center"
        title="Live Studio Notifications & Broadcasts"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-[10px] font-black text-zinc-950 flex items-center justify-center border-2 border-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0c1017] border border-zinc-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150 text-zinc-100">
          {/* Header */}
          <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Notifications & Feed</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-zinc-400">Real-time studio alerts & broadcasts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition"
                title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-400 hover:bg-amber-500/10 border border-amber-500/30 transition flex items-center gap-1"
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Read all</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 bg-zinc-950/60 border-b border-zinc-800 flex items-center gap-1.5 text-[11px] overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'broadcasts', label: '👑 Broadcasts' },
              { id: 'meetings', label: '👥 Assembly' },
              { id: 'studio', label: '⚡ Studio' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                  activeFilter === tab.id
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1.5 divide-y divide-zinc-800/40">
            {filteredList.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-2 text-zinc-500">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-300">All caught up!</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">No notifications in this category</p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const isUrgent = notif.priority === 'urgent' || notif.type === 'emergency';
                const isAdmin = notif.type === 'admin' || notif.category === 'broadcast';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-xl transition cursor-pointer relative group ${
                      !notif.read
                        ? isAdmin
                          ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15'
                          : isUrgent
                          ? 'bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/15'
                          : 'bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800'
                        : 'bg-zinc-950/40 border border-zinc-900 hover:bg-zinc-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-zinc-800/80 shrink-0 mt-0.5">
                        {getCategoryIcon(notif)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs font-bold truncate ${!notif.read ? 'text-white' : 'text-zinc-300'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                            {formatTimeAgo(notif.timestamp)}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-snug break-words">
                          {notif.message}
                        </p>

                        {/* Action Link Button if present */}
                        {notif.actionUrl && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] transition shadow-xs">
                              <span>{notif.actionLabel || 'Open'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                            {notif.sender && (
                              <span className="text-[10px] text-zinc-500">
                                from <strong className="text-zinc-300">{notif.sender}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete notification on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition rounded"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!notif.read && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <span>{notifications.length} total alerts</span>
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-zinc-500 hover:text-rose-400 text-[10px] flex items-center gap-1 font-medium transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear history</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
