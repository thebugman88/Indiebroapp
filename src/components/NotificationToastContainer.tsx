import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  AlertTriangle,
  Crown,
  Users,
  ChevronRight,
  X,
  Radio,
  Volume2,
} from 'lucide-react';
import { AppNotification } from '../services/notificationService';

interface ToastItem extends AppNotification {
  toastId: string;
}

export function NotificationToastContainer({
  onNavigateTo,
}: {
  onNavigateTo?: (appId: string) => void;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [kickModal, setKickModal] = useState<{ open: boolean; reason: string } | null>(null);

  useEffect(() => {
    // 1. Listen for local toast triggers
    const handleToast = (e: any) => {
      if (!e.detail) return;
      const notif = e.detail as AppNotification;
      const toastItem: ToastItem = {
        ...notif,
        toastId: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };

      setToasts((prev) => [toastItem, ...prev].slice(0, 4));

      // Auto dismiss after 6 seconds if normal, 10 seconds if urgent
      const timeoutMs = notif.priority === 'urgent' || notif.type === 'emergency' ? 10000 : 6000;
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.toastId !== toastItem.toastId));
      }, timeoutMs);
    };

    // 2. Listen for WebSocket messages forwarded by windows or background listeners
    const handleKick = (e: any) => {
      if (e.detail) {
        setKickModal({
          open: true,
          reason: e.detail.reason || 'Your session has been terminated by Master Admin Christopher Ray.',
        });
      }
    };

    window.addEventListener('ib_notification_toast', handleToast);
    window.addEventListener('ib_user_kicked', handleKick);

    return () => {
      window.removeEventListener('ib_notification_toast', handleToast);
      window.removeEventListener('ib_user_kicked', handleKick);
    };
  }, []);

  const handleDismiss = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const handleActionClick = (toast: ToastItem) => {
    handleDismiss(toast.toastId);
    if (toast.actionUrl) {
      if (toast.actionUrl.startsWith('#') && onNavigateTo) {
        onNavigateTo(toast.actionUrl.replace('#', ''));
      } else {
        window.location.hash = toast.actionUrl.replace('#', '');
      }
    }
  };

  return (
    <>
      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => {
          const isUrgent = toast.priority === 'urgent' || toast.type === 'emergency';
          const isAdmin = toast.type === 'admin' || toast.category === 'broadcast';

          return (
            <div
              key={toast.toastId}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-200 transform translate-y-0 animate-in slide-in-from-bottom-5 fade-in ${
                isAdmin
                  ? 'bg-gradient-to-r from-zinc-950 via-amber-950/40 to-zinc-950 border-amber-500/80 shadow-amber-500/20 text-white ring-1 ring-amber-400/40'
                  : isUrgent
                  ? 'bg-gradient-to-r from-zinc-950 via-rose-950/40 to-zinc-950 border-rose-500/80 shadow-rose-500/20 text-white ring-1 ring-rose-400/40'
                  : 'bg-[#0e131d]/95 border-zinc-700 text-zinc-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : isUrgent
                      ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                      : 'bg-zinc-800 text-amber-400'
                  }`}
                >
                  {isAdmin ? (
                    <Crown className="w-5 h-5 animate-bounce" />
                  ) : toast.category === 'meeting' ? (
                    <Users className="w-5 h-5" />
                  ) : isUrgent ? (
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-black tracking-wide uppercase ${
                        isAdmin ? 'text-amber-400' : isUrgent ? 'text-rose-400' : 'text-zinc-300'
                      }`}
                    >
                      {isAdmin ? '👑 Founder Live Broadcast' : toast.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDismiss(toast.toastId)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isAdmin && <h4 className="text-xs font-bold text-white mb-0.5">{toast.title}</h4>}

                  <p className="text-xs text-zinc-300 leading-snug break-words">{toast.message}</p>

                  {toast.actionUrl && (
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleActionClick(toast)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          isAdmin
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 hover:from-amber-300 hover:to-amber-400'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        <span>{toast.actionLabel || 'View Now'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {toast.sender && (
                        <span className="text-[10px] text-zinc-400">
                          by <strong className="text-zinc-200">{toast.sender}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Force Disconnect / Kicked Notice Modal */}
      {kickModal?.open && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-rose-500/60 rounded-2xl p-6 text-center shadow-2xl text-white">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Session Terminated</h3>
            <p className="text-sm text-zinc-300 mb-6">{kickModal.reason}</p>
            <button
              type="button"
              onClick={() => {
                setKickModal(null);
                window.location.reload();
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 font-bold rounded-xl text-white transition cursor-pointer"
            >
              Acknowledge & Refresh
            </button>
          </div>
        </div>
      )}
    </>
  );
}
