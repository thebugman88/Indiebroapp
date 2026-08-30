import { authenticatedFetch } from '../../../src/services/authService';
import React, { useState } from "react";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
  Bell,
  Trash2,
  Share2,
  TrendingUp,
  Tag,
  Zap,
} from "lucide-react";
import { ArtistProfile, ScheduledEvent, EventCategory, SongMetadata, SettingsState } from "../types";
import { playNotificationChime } from "../lib/notificationEngine";
import confetti from "canvas-confetti";

interface ReleaseSchedulerProps {
  events: ScheduledEvent[];
  songs: SongMetadata[];
  profile: ArtistProfile;
  settings: SettingsState;
  onAddEvent: (event: ScheduledEvent) => void;
  onUpdateEvent: (event: ScheduledEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export const ReleaseScheduler: React.FC<ReleaseSchedulerProps> = ({
  events,
  songs,
  profile,
  settings,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Form State for Manual Event
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState("10:00");
  const [formCategory, setFormCategory] = useState<EventCategory>("pitch");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState<"high" | "medium" | "low">("high");
  const [formSongId, setFormSongId] = useState<string>("");
  const [formReminder, setFormReminder] = useState<number>(1440); // 1 day before

  // Roadmap Generator State
  const [roadmapTitle, setRoadmapTitle] = useState(songs[0]?.title || "Upcoming Single");
  const [roadmapReleaseDate, setRoadmapReleaseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45); // ~6 weeks out
    return d.toISOString().slice(0, 10);
  });
  const [roadmapType, setRoadmapType] = useState<"Single" | "EP" | "Album">("Single");
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  // Filtered and sorted events
  const filteredEvents = events
    .filter((e) => (categoryFilter === "all" ? true : e.category === categoryFilter))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleToggleComplete = (event: ScheduledEvent) => {
    const updated = { ...event, completed: !event.completed };
    onUpdateEvent(updated);
    if (updated.completed) {
      if (settings.enableSoundAlerts) {
        playNotificationChime();
      }
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleSaveManualEvent = () => {
    if (!formTitle.trim()) {
      alert("Event title is required.");
      return;
    }

    const newEvent: ScheduledEvent = {
      id: `evt_${Date.now()}`,
      title: formTitle.trim(),
      date: formDate,
      time: formTime,
      category: formCategory,
      description: formDescription.trim(),
      completed: false,
      priority: formPriority,
      songId: formSongId || undefined,
      reminderMinutesBefore: formReminder,
      createdAt: new Date().toISOString(),
    };

    onAddEvent(newEvent);
    setShowAddModal(false);
    setFormTitle("");
    setFormDescription("");
  };

  const [roadmapError,setRoadmapError]=useState('');
  // 8-Week Release Roadmap Generator
  const handleGenerate8WeekRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    setRoadmapError('');

    try {
      // Call server strategy endpoint
      const res = await authenticatedFetch("/api/ai/strategy-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseType: roadmapType,
          songTitle: roadmapTitle,
          releaseDate: roadmapReleaseDate,
          genre: profile.genre || "Indie",
          artistProfile: profile,
          customApiKey: settings.customApiKey,
        }),
      });

      const json = await res.json();
      const targetDate = new Date(roadmapReleaseDate);

      // Helper to compute date offset in days relative to release date
      const makeDate = (daysBeforeRelease: number) => {
        const d = new Date(targetDate);
        d.setDate(d.getDate() - daysBeforeRelease);
        return d.toISOString().slice(0, 10);
      };

      if(!res.ok||!Array.isArray(json.plan?.timelineWeeks))throw new Error(json.error||'No valid roadmap was returned.');
      const tasks=json.plan.timelineWeeks.flatMap((week:any)=>Array.isArray(week.checklist)?week.checklist:[]).slice(0,100);
      if(!tasks.length)throw new Error('The provider returned an empty roadmap.');
      const events:ScheduledEvent[]=tasks.map((task:any,index:number)=>{
        if(typeof task.task!=='string'||!Number.isFinite(task.recommendedDaysBefore)||Math.abs(task.recommendedDaysBefore)>365)throw new Error('The provider returned an invalid milestone.');
        return {id:`evt_${Date.now()}_${index}`,title:task.task,date:makeDate(task.recommendedDaysBefore),time:'12:00',category:['pitch','marketing','registration','social','sync'].includes(task.category)?task.category:'marketing',description:String(task.details||''),completed:false,priority:['high','medium','low'].includes(task.priority)?task.priority:'medium',reminderMinutesBefore:1440,createdAt:new Date().toISOString()};
      });
      for(const event of events)onAddEvent(event);

      setShowRoadmapModal(false);
      if (settings.enableSoundAlerts) {
        playNotificationChime();
      }
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    } catch (e:any) {
      setRoadmapError(e.message);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const getCategoryBadge = (cat: EventCategory) => {
    switch (cat) {
      case "pitch":
        return <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Editorial Pitch</span>;
      case "release":
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Release Drop</span>;
      case "registration":
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Royalty Registration</span>;
      case "marketing":
        return <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Marketing / PR</span>;
      case "social":
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Social Teasers</span>;
      case "sync":
        return <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Sync Licensing</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Milestone</span>;
    }
  };

  return (
    <div id="release-scheduler-view" className="space-y-6 animate-fadeIn">
      {roadmapError && <p role="alert" className="text-red-400">{roadmapError}</p>}
      {/* Top Header & Strategy Launcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Release Timeline & Active Reminders
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                  {events.filter((e) => !e.completed).length} Upcoming Milestones
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track Spotify pitch deadlines, PRO registrations, marketing teasers, and sync rollouts with desktop alerts.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowRoadmapModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Generate 8-Week Release Roadmap</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Custom Event</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800 text-xs">
          <span className="text-slate-400 self-center text-[11px] mr-1">Filter by:</span>
          {["all", "pitch", "release", "registration", "marketing", "social", "sync"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full capitalize transition-colors ${
                categoryFilter === cat
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat === "all" ? `All Events (${events.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Timeline / List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const isOverdue = !evt.completed && new Date(evt.date).getTime() < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={evt.id}
                className={`bg-slate-900 border rounded-2xl p-4 transition-all flex items-start justify-between gap-4 ${
                  evt.completed
                    ? "border-slate-800/60 opacity-60 bg-slate-950/40"
                    : isOverdue
                    ? "border-rose-800/60 bg-rose-950/20"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Left: Checkbox & Content */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleToggleComplete(evt)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {evt.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm font-bold ${evt.completed ? "line-through text-slate-400" : "text-slate-100"}`}>
                        {evt.title}
                      </h4>
                      {getCategoryBadge(evt.category)}
                      {evt.priority === "high" && (
                        <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/50">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{evt.description}</p>

                    {/* Date / Time / Reminder Badges */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <strong className="text-slate-200">{evt.date}</strong>
                        {evt.time && <span>@ {evt.time}</span>}
                      </span>

                      {evt.reminderMinutesBefore > 0 && (
                        <span className="flex items-center gap-1 text-indigo-300">
                          <Bell className="w-3.5 h-3.5" />
                          Alert: {evt.reminderMinutesBefore >= 1440 ? `${evt.reminderMinutesBefore / 1440}d before` : `${evt.reminderMinutesBefore}m before`}
                        </span>
                      )}

                      {isOverdue && (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> OVERDUE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Delete Action */}
                <button
                  onClick={() => onDeleteEvent(evt.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No scheduled release events.</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto">
            Click 'Generate 8-Week Release Roadmap' to auto-populate your complete rollout timeline.
          </p>
        </div>
      )}

      {/* GENERATE 8-WEEK ROADMAP MODAL */}
      {showRoadmapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                8-Week Release Roadmap Generator
              </h3>
              <button onClick={() => setShowRoadmapModal(false)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <p className="text-slate-400">
              Auto-generate the standard 8-week music industry rollout roadmap covering master deliveries, Spotify editorial pitch deadlines, PRO registration, and social teaser schedule.
            </p>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Song / Project Title</label>
              <input
                type="text"
                value={roadmapTitle}
                onChange={(e) => setRoadmapTitle(e.target.value)}
                placeholder="e.g. Neon Horizon"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Release Type</label>
                <select
                  value={roadmapType}
                  onChange={(e) => setRoadmapType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="Single">Single (Lead Track)</option>
                  <option value="EP">EP (4-6 Tracks)</option>
                  <option value="Album">Full-Length Album</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Release Date</label>
                <input
                  type="date"
                  value={roadmapReleaseDate}
                  onChange={(e) => setRoadmapReleaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRoadmapModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingRoadmap}
                title={roadmapError || undefined} onClick={handleGenerate8WeekRoadmap}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                {isGeneratingRoadmap ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Building Schedule...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Rollout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MANUAL EVENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Add Milestone / Reminder
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-100">✕</button>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Event Title *</label>
              <input
                type="text"
                autoFocus
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Submit Spotify Pitch, Film TikTok Hook #2"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Time</label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value="pitch">Editorial Pitch</option>
                  <option value="release">Release Drop</option>
                  <option value="registration">Royalty Registration</option>
                  <option value="marketing">Marketing / PR</option>
                  <option value="social">Social Teaser</option>
                  <option value="sync">Sync Licensing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Desktop Reminder</label>
                <select
                  value={formReminder}
                  onChange={(e) => setFormReminder(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  <option value={0}>At time of event</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                  <option value={4320}>3 days before</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Description / Action Items</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Specific tasks, curator names, or links..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManualEvent}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
