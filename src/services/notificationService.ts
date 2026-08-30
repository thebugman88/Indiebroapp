import { authenticatedFetch } from './authService';
/**
 * Universal In-App Notification Service
 * Supports Real-Time WebSocket Announcements, Action Feeds,
 * Web Audio Synthesized Chimes, and Local Storage Persistence.
 */

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'system' | 'meeting' | 'studio' | 'broadcast' | 'achievement' | 'security';
  type: 'info' | 'success' | 'warning' | 'emergency' | 'admin';
  timestamp: number;
  read: boolean;
  sender?: string;
  senderEmail?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

const NOTIFICATIONS_STORAGE_KEY = 'ib_notifications_feed_v2';
const NOTIFICATION_SOUND_ENABLED_KEY = 'ib_notification_sound_enabled';

// Play synthesized notification chime using Web Audio API (crisp, zero external asset dependency)
export function playNotificationSound(type: 'info' | 'success' | 'warning' | 'urgent' | 'admin' = 'info') {
  if (typeof window === 'undefined') return;
  try {
    const soundEnabled = localStorage.getItem(NOTIFICATION_SOUND_ENABLED_KEY) !== 'false';
    if (!soundEnabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'urgent' || type === 'emergency' as any) {
      // 3-tone urgent alert chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1174.66, now + 0.1); // D6
      osc1.frequency.setValueAtTime(1760, now + 0.2); // A6

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(587.33, now + 0.1);
      osc2.frequency.setValueAtTime(880, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else if (type === 'admin') {
      // Imperial royal trumpet style chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.36); // C6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === 'success') {
      // Pleasant high double ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Standard mellow bell ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now); // G5
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.25); // C5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // AudioContext blocked by browser autoplay policy until user interaction
  }
}

/**
 * Load all stored notifications
 */
export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    }
  } catch (e) {
    console.error('Error loading notifications:', e);
  }

  // Clean real-time initial notifications if needed (only essential system welcome or empty)
  const initial: AppNotification[] = [];

  try {
    // If legacy dummy notification exists, remove it
    const legacyRaw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (legacyRaw && legacyRaw.includes('notif_init_2')) {
      const list = JSON.parse(legacyRaw);
      const filtered = Array.isArray(list) ? list.filter((n: any) => n.id !== 'notif_init_2' && n.title !== 'Assembly Meeting Room Ready') : [];
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    }
  } catch {}

  return initial;
}

/**
 * Save notifications list
 */
function saveNotifications(list: AppNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ib_notifications_changed', { detail: list }));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
}

/**
 * Add a new notification
 */
export function addNotification(params: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
  const current = getNotifications();
  const newNotif: AppNotification = {
    ...params,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    read: false,
  };

  const updated = [newNotif, ...current].slice(0, 100); // keep last 100
  saveNotifications(updated);

  // Play audio chime
  playNotificationSound(params.type as any);

  // Dispatch toast event for immediate on-screen popup
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ib_notification_toast', { detail: newNotif }));
  }

  return newNotif;
}

/**
 * Mark notification as read
 */
export function markAsRead(id: string): void {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(): void {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

/**
 * Clear / Delete all notifications
 */
export function clearAllNotifications(): void {
  saveNotifications([]);
}

/**
 * Delete a single notification
 */
export function deleteNotification(id: string): void {
  const current = getNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
}

/**
 * Get count of unread notifications
 */
export function getUnreadNotificationCount(): number {
  const list = getNotifications();
  return list.filter((n) => !n.read).length;
}

/**
 * Sound toggle preference
 */
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(NOTIFICATION_SOUND_ENABLED_KEY) !== 'false';
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Send Live Broadcast from Admin to all users via backend + WebSocket
 */
export async function sendAdminBroadcast(payload: {
  title: string;
  message: string;
  senderName: string;
  senderEmail: string;
  priority?: 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authenticatedFetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      // Also add locally
      addNotification({
        title: payload.title,
        message: payload.message,
        category: 'broadcast',
        type: payload.priority === 'urgent' ? 'emergency' : 'admin',
        sender: payload.senderName,
        senderEmail: payload.senderEmail,
        actionUrl: payload.actionUrl,
        actionLabel: payload.actionLabel,
        priority: payload.priority || 'high',
      });
      return { success: true };
    }
    return { success: false, error: data.error || 'Failed to dispatch broadcast' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Broadcast was not delivered.' };
  }
}
