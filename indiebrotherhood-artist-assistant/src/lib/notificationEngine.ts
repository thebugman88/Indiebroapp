import { ScheduledEvent } from "../types";

// Dynamic audio chime synthesizer using Web Audio API
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic indie chime (C6 -> E6 -> G6)
    const freqs = [1046.5, 1318.51, 1567.98];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  } catch (err) {
    // Audio context error or user has not interacted with page yet
  }
}

// Request Browser Desktop Notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Send browser notification
export function sendDesktopNotification(title: string, body: string, icon?: string) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(`IndieArtist OS: ${title}`, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
      });
    } catch (e) {
      console.warn("Desktop notification failed:", e);
    }
  }
}

// Check events and dispatch alerts
export function checkUpcomingEvents(
  events: ScheduledEvent[],
  soundEnabled = true,
  onNotify?: (event: ScheduledEvent) => void
): ScheduledEvent[] {
  const now = new Date().getTime();
  let triggered = false;

  const updatedEvents = events.map((event) => {
    if (event.completed || event.notified) return event;

    const eventDate = new Date(`${event.date}T${event.time || "09:00"}:00`).getTime();
    const reminderTime = eventDate - (event.reminderMinutesBefore || 0) * 60 * 1000;

    // If within 5 minutes or past due
    if (now >= reminderTime && now <= eventDate + 86400000) {
      triggered = true;
      sendDesktopNotification(
        `Upcoming: ${event.title}`,
        `Scheduled for ${event.date} (${event.category.toUpperCase()}): ${event.description}`
      );
      if (onNotify) onNotify(event);
      return { ...event, notified: true };
    }

    return event;
  });

  if (triggered && soundEnabled) {
    playNotificationChime();
  }

  return updatedEvents;
}

export function checkAndTriggerEventReminders(
  events: ScheduledEvent[],
  settings: { desktopNotificationsEnabled?: boolean; enableSoundAlerts?: boolean }
): void {
  const now = new Date().getTime();
  let chimeTriggered = false;

  for (const event of events) {
    if (event.completed || event.notified) continue;

    const eventDate = new Date(`${event.date}T${event.time || "09:00"}:00`).getTime();
    const reminderTime = eventDate - (event.reminderMinutesBefore || 0) * 60 * 1000;

    if (now >= reminderTime && now <= eventDate + 86400000) {
      if (settings.desktopNotificationsEnabled) {
        sendDesktopNotification(
          `Upcoming Deadline: ${event.title}`,
          `Milestone due on ${event.date}: ${event.description}`
        );
      }
      chimeTriggered = true;
    }
  }

  if (chimeTriggered && settings.enableSoundAlerts) {
    playNotificationChime();
  }
}

// Positive affirmations & indie music mindset boosts
export const INDIE_CAREER_AFFIRMATIONS: string[] = [
  "✨ '1,000 true engaged fans creates a sustainable lifelong indie music career.'",
  "🎯 'Accurate metadata is your retirement fund: always verify your ISRCs, ISWCs, and split sheets.'",
  "🚀 'Spotify editorial pitch window: Submit at least 7 to 14 days before your Friday release.'",
  "💡 'Don't just release music — tell the human story behind every lyric on short-form video.'",
  "⚡ 'Remember to register sound recordings with SoundExchange to claim your 45% featured artist digital royalties.'",
  "🔥 'Consistency in authentic content compounds into streaming catalog growth over time.'",
  "🎵 'The Mechanical Licensing Collective (The MLC) pays 100% of US streaming mechanical royalties directly to you with zero commission.'",
  "🌟 'Your unique sonic identity and taste is your highest leverage competitive moat.'",
  "📈 'Pre-save campaigns build algorithmic day-one momentum: focus on your direct core community first.'",
  "🛡️ 'Protect your master and publishing splits: sign your split sheets during the recording session, not months later.'",
  "🎙️ 'Independent sync licensing supervisors look for clean instrumental stems and high-quality 24-bit masters.'",
  "💎 'Every stream counts, every fan matters. Keep building your independent legacy with IndieBrotherhood.'",
];
