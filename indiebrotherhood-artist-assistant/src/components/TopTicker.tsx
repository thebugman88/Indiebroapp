import React, { useState } from "react";
import { INDIE_CAREER_AFFIRMATIONS } from "../lib/notificationEngine";
import { ScheduledEvent } from "../types";
import {
  Calendar,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Pause,
  Play,
  Radio,
  Music2,
  CheckCircle2,
  DollarSign,
  Share2,
} from "lucide-react";

interface TopTickerProps {
  events: ScheduledEvent[];
  enableSound?: boolean;
  onToggleSound?: () => void;
  onEventClick?: (event: ScheduledEvent) => void;
  onOpenScheduler?: () => void;
}

const MUSIC_PRO_TIPS = [
  {
    tag: "Royalties Tip",
    text: "SoundExchange collects non-interactive digital performance royalties for featured artists & master owners.",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    tag: "Pitching Rule",
    text: "Submit your Spotify for Artists editorial pitch at least 7–14 days prior to release date.",
    icon: Music2,
    color: "text-green-400 bg-green-500/10 border-green-500/30",
  },
  {
    tag: "The MLC",
    text: "Register mechanical work splits on The Mechanical Licensing Collective to collect 100% of streaming mechanicals.",
    icon: CheckCircle2,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  },
  {
    tag: "Sync & Splits",
    text: "Always execute signed split sheet agreements with co-writers before submitting tracks to music supervisors.",
    icon: Share2,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
];

export const TopTicker: React.FC<TopTickerProps> = ({
  events,
  onEventClick,
  onOpenScheduler,
}) => {
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "slow" | "fast">("normal");

  // Filter uncompleted upcoming events (sorted by date)
  const upcomingEvents = events
    .filter((e) => !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  // Format relative days remaining
  const getDaysLeftText = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "TODAY";
    if (diffDays === 1) return "TOMORROW";
    if (diffDays < 0) return `${Math.abs(diffDays)}d OVERDUE`;
    return `in ${diffDays}d`;
  };

  const getDuration = () => {
    if (speed === "fast") return "30s";
    if (speed === "slow") return "70s";
    return "48s";
  };

  // Render a complete single block of ticker items
  const renderTickerContent = (prefix: string) => (
    <div key={prefix} className="flex items-center gap-6 shrink-0 pr-6">
      {/* Dynamic Affirmations */}
      {INDIE_CAREER_AFFIRMATIONS.slice(0, 4).map((aff, idx) => (
        <div key={`${prefix}-aff-${idx}`} className="flex items-center gap-2 text-indigo-200 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold tracking-wider uppercase border border-indigo-500/30">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            Mindset
          </span>
          <span className="italic text-slate-100 font-sans tracking-tight">
            {aff}
          </span>
          <span className="text-slate-700 ml-2">✦</span>
        </div>
      ))}

      {/* Live Upcoming Events */}
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((evt) => {
          const daysLabel = getDaysLeftText(evt.date);
          const isUrgent =
            daysLabel === "TODAY" ||
            daysLabel === "TOMORROW" ||
            daysLabel.includes("OVERDUE");

          return (
            <div
              key={`${prefix}-evt-${evt.id}`}
              onClick={() =>
                onEventClick ? onEventClick(evt) : onOpenScheduler?.()
              }
              className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full cursor-pointer transition-all shrink-0 select-none shadow-sm ${
                isUrgent
                  ? "bg-rose-950/80 border border-rose-500/60 text-rose-100 hover:bg-rose-900 hover:border-rose-400"
                  : "bg-slate-800/90 border border-slate-700/80 text-slate-200 hover:bg-slate-700 hover:border-slate-500"
              }`}
              title={`Click to view: ${evt.title} (${evt.description})`}
            >
              {isUrgent ? (
                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0 animate-pulse" />
              ) : (
                <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
              )}
              <span className="font-medium max-w-[200px] truncate">
                {evt.title}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isUrgent
                    ? "bg-rose-500/40 text-rose-200"
                    : "bg-indigo-500/20 text-indigo-300"
                }`}
              >
                {daysLabel}
              </span>
            </div>
          );
        })
      ) : (
        <div
          onClick={onOpenScheduler}
          className="flex items-center gap-1.5 text-slate-400 cursor-pointer hover:text-indigo-300 transition-colors shrink-0"
        >
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>No urgent deadlines scheduled.</span>
          <span className="text-indigo-400 underline text-[11px] flex items-center">
            Create Release Roadmap <ChevronRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      )}

      <span className="text-slate-700">✦</span>

      {/* Music Industry Pro Tips */}
      {MUSIC_PRO_TIPS.map((tip, idx) => {
        const Icon = tip.icon;
        return (
          <div key={`${prefix}-tip-${idx}`} className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${tip.color}`}
            >
              <Icon className="w-2.5 h-2.5 shrink-0" />
              {tip.tag}
            </span>
            <span className="text-slate-300 font-sans tracking-tight">
              {tip.text}
            </span>
            <span className="text-slate-700 ml-2">✦</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      id="top-live-ticker-banner"
      className="w-full bg-slate-950 border-b border-indigo-950/80 text-slate-200 text-xs py-1.5 px-3 select-none relative overflow-hidden flex items-center shadow-md z-30 group"
    >
      {/* Static Lead Badge */}
      <div className="flex items-center gap-2 font-semibold text-indigo-400 shrink-0 pr-3 border-r border-slate-800 mr-2 z-10 bg-slate-950">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-indigo-400" />
          <span className="tracking-wider uppercase text-[11px] font-bold text-slate-200">
            Live Ticker
          </span>
        </div>
      </div>

      {/* Auto Moving Marquee Track with Left & Right Gradient Shadows */}
      <div className="relative flex-1 overflow-hidden h-6 flex items-center">
        {/* Left Gradient Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-10" />

        {/* Continuous Auto-Scrolling Track */}
        <div
          className={`animate-marquee flex items-center ${
            isManualPaused ? "paused" : ""
          }`}
          style={{ animationDuration: getDuration() }}
        >
          {renderTickerContent("set-1")}
          {renderTickerContent("set-2")}
        </div>

        {/* Right Gradient Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10" />
      </div>

      {/* Ticker Controls (Pause/Play & Speed) */}
      <div className="flex items-center gap-2 shrink-0 pl-3 border-l border-slate-800 ml-2 text-[11px] text-slate-400 z-10 bg-slate-950">
        {/* Speed Toggle */}
        <button
          id="ticker-speed-toggle"
          onClick={() =>
            setSpeed((prev) =>
              prev === "normal" ? "fast" : prev === "fast" ? "slow" : "normal"
            )
          }
          className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-slate-700 transition-colors"
          title={`Click to adjust scroll speed (Current: ${speed.toUpperCase()})`}
        >
          {speed}
        </button>

        {/* Pause / Play Toggle */}
        <button
          id="ticker-pause-play-btn"
          onClick={() => setIsManualPaused((prev) => !prev)}
          className={`p-1 rounded transition-colors ${
            isManualPaused
              ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
          title={isManualPaused ? "Resume Auto Scroll" : "Pause Auto Scroll"}
        >
          {isManualPaused ? (
            <Play className="w-3 h-3 fill-current" />
          ) : (
            <Pause className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
};
