import React, { useState, useEffect } from 'react';
import {
  Crown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Radio,
  Send,
  Zap,
  UserX,
  UserCheck,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sliders,
  Activity,
  MessageSquare,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
  Volume2,
} from 'lucide-react';
import {
  ManagedUser,
  getManagedUsers,
  grantFreeAccessToUser,
  revokeFreeAccessFromUser,
  whitelistUser,
  blacklistUser,
  kickOutUser,
  getActivityLogs,
  UserActivityLog,
  isMasterAdminLoggedIn,
} from '../services/adminService';
import { ADMIN_EMAIL, RegisteredUser } from '../services/authService';
import { sendAdminBroadcast } from '../services/notificationService';

interface AdminControlRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: RegisteredUser;
  onNavigateTo?: (appId: string) => void;
}

export function AdminControlRoomModal({
  isOpen,
  onClose,
  currentUser,
  onNavigateTo,
}: AdminControlRoomModalProps) {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'users' | 'logs' | 'system'>('broadcast');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchLog, setSearchLog] = useState('');

  // Live Broadcast Composer State
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 Assembly Meeting Starting Now');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'All collective members and artists: Please join the Assembly Meeting Room for live agenda motions and board voting.'
  );
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('#meeting-room');
  const [broadcastActionLabel, setBroadcastActionLabel] = useState('Join Meeting Room');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  // Status feedback toast inside modal
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Security gate: ONLY Christopher Ray / Master Admin
  const isAuthorized = currentUser.isAdmin === true && isMasterAdminLoggedIn();

  const loadData = () => {
    setUsers(getManagedUsers());
    setLogs(getActivityLogs());
  };

  useEffect(() => {
    if (isOpen && isAuthorized) {
      loadData();
    }
  }, [isOpen, isAuthorized]);

  // Real-time listener for log/user changes
  useEffect(() => {
    const handleUpdate = () => {
      if (isOpen && isAuthorized) {
        loadData();
      }
    };
    window.addEventListener('ib_activity_logged', handleUpdate);
    window.addEventListener('ib_user_overrides_changed', handleUpdate);
    window.addEventListener('ib_auth_changed', handleUpdate);

    return () => {
      window.removeEventListener('ib_activity_logged', handleUpdate);
      window.removeEventListener('ib_user_overrides_changed', handleUpdate);
      window.removeEventListener('ib_auth_changed', handleUpdate);
    };
  }, [isOpen, isAuthorized]);

  if (!isOpen) return null;

  // If unauthorized user somehow triggers modal, block with absolute refusal
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-rose-600/80 rounded-2xl p-6 text-center text-white shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-white mb-1">Restricted Founder Area</h3>
          <p className="text-xs text-zinc-400 mb-6">
            The Admin Control Room is strictly reserved for Master Founder Christopher Ray ({ADMIN_EMAIL}). Your account does not possess the requisite clearance.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Exit Control Room
          </button>
        </div>
      </div>
    );
  }

  // Broadcast Preset Templates
  const applyPreset = (preset: {
    title: string;
    message: string;
    priority: 'normal' | 'high' | 'urgent';
    url: string;
    label: string;
  }) => {
    setBroadcastTitle(preset.title);
    setBroadcastMessage(preset.message);
    setBroadcastPriority(preset.priority);
    setBroadcastActionUrl(preset.url);
    setBroadcastActionLabel(preset.label);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setBroadcastFeedback('Please enter both a title and message for the broadcast.');
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastFeedback(null);

    const result = await sendAdminBroadcast({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      senderName: currentUser.displayName || 'Christopher Ray (Founder)',
      senderEmail: currentUser.email,
      priority: broadcastPriority,
      actionUrl: broadcastActionUrl.trim() || undefined,
      actionLabel: broadcastActionLabel.trim() || undefined,
    });

    setIsSendingBroadcast(false);

    if (result.success) {
      setBroadcastFeedback('🚀 Live Broadcast successfully dispatched to all active users and notification centers!');
      loadData();
      setTimeout(() => setBroadcastFeedback(null), 5000);
    } else {
      setBroadcastFeedback(`Error dispatching broadcast: ${result.error}`);
    }
  };

  // User Actions
  const handleGrantFreeAccess = (user: ManagedUser) => {
    const res = grantFreeAccessToUser(user.email);
    setActionFeedback({ message: res.message, type: 'success' });
    loadData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleRevokeFreeAccess = (user: ManagedUser) => {
    const res = revokeFreeAccessFromUser(user.email);
    setActionFeedback({ message: res.message, type: res.success ? 'success' : 'error' });
    loadData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleWhitelist = (user: ManagedUser) => {
    const res = whitelistUser(user.email);
    setActionFeedback({ message: res.message, type: 'success' });
    loadData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleBlacklist = (user: ManagedUser) => {
    const res = blacklistUser(user.email, 'Administrative sanction by Founder Christopher Ray');
    setActionFeedback({ message: res.message, type: 'success' });
    loadData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleKick = (user: ManagedUser) => {
    const res = kickOutUser(user.email, 'Session terminated by Founder Christopher Ray');
    setActionFeedback({ message: res.message, type: 'success' });
    loadData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchUser.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.artistHandle.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const filteredLogs = logs.filter((l) => {
    const q = searchLog.toLowerCase();
    return (
      l.userEmail.toLowerCase().includes(q) ||
      l.displayName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.appLocation.toLowerCase().includes(q) ||
      (l.details && l.details.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b0e14] border border-amber-500/50 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Master Control Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-950 via-amber-950/30 to-zinc-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-[1.5px] shadow-lg shadow-amber-500/30">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  FOUNDER ADMIN CONTROL ROOM
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                  SUPREME AUTHORITY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Exclusive console for <strong className="text-amber-400">{ADMIN_EMAIL}</strong> • Real user rosters, live broadcast dispatch & session controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition"
              title="Refresh live data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Close Control Room"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner if present */}
        {actionFeedback && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between border-b ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button type="button" onClick={() => setActionFeedback(null)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'broadcast', label: '📢 Live Broadcast Dispatcher', icon: Radio },
            { id: 'users', label: `👥 User Directory & Roster (${users.length})`, icon: Users },
            { id: 'logs', label: `📜 Real Activity Logs (${logs.length})`, icon: Activity },
            { id: 'system', label: '🛡️ Security Sentinel & Telemetry', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border-amber-400 text-amber-400 font-bold bg-amber-500/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#080b11]">
          {/* TAB 1: LIVE BROADCAST DISPATCHER */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>Broadcast Live Studio Notification</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Type in any meeting notice or studio announcement. This goes live immediately to all users via WebSocket and their persistent notification feeds.
                    </p>
                  </div>
                </div>

                {/* Preset Fast-Pick Buttons */}
                <div className="mb-4">
                  <span className="text-[11px] font-mono font-bold text-amber-400/80 uppercase tracking-wider block mb-2">
                    Quick Broadcast Templates:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset({
                          title: '🚨 Emergency Assembly Meeting Call',
                          message: 'All collective members and artists: Please report to Assembly Meeting Room #general immediately for urgent motion voting.',
                          priority: 'urgent',
                          url: '#meeting-room',
                          label: 'Join Meeting Now',
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>🚨 Assembly Meeting Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset({
                          title: '⚡ New Studio Features Deployed',
                          message: 'Supreme Gemini 3.7 Ghostwriter engine, Live Prosody Cadence, and Admin telemetry have been deployed.',
                          priority: 'normal',
                          url: '#lyric-pro',
                          label: 'Open Lyric Pro',
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>⚡ Studio Feature Update</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset({
                          title: '👑 VIP Free Access Pass Activated',
                          message: 'Founder Christopher Ray has granted special unlimited Pro access passes to registered creators. Enjoy zero limits!',
                          priority: 'high',
                          url: '#artist-profile',
                          label: 'Check Profile',
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>👑 Free VIP Announcement</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset({
                          title: '🎤 Live Cypher & Rap Battle Starting',
                          message: 'The Hang Out cypher is live! Jump in the arena to drop 16 bars against the AI Battle Judge.',
                          priority: 'normal',
                          url: '#hang-out',
                          label: 'Enter Cypher',
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>🎤 Hang Out Cypher Call</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Notification Title:
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Meeting starting in 5 minutes..."
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Notification Message / Information for Everyone:
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Type the full message you want delivered to all users..."
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Alert Priority:
                      </label>
                      <select
                        value={broadcastPriority}
                        onChange={(e) => setBroadcastPriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="normal">Normal (Feed + Toast)</option>
                        <option value="high">High (Chime Sound + Banner)</option>
                        <option value="urgent">🚨 Urgent (Emergency Siren + Gold Ring)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Action Destination Hash:
                      </label>
                      <input
                        type="text"
                        value={broadcastActionUrl}
                        onChange={(e) => setBroadcastActionUrl(e.target.value)}
                        placeholder="#meeting-room or #hub"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Action Button Label:
                      </label>
                      <input
                        type="text"
                        value={broadcastActionLabel}
                        onChange={(e) => setBroadcastActionLabel(e.target.value)}
                        placeholder="e.g. Join Meeting"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {broadcastFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold ${
                        broadcastFeedback.startsWith('🚀')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {broadcastFeedback}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Plays synthesized audio chime on all connected devices</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingBroadcast}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSendingBroadcast ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Live Broadcast to Everybody</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE USER DIRECTORY & ROSTER */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>
                    Showing <strong className="text-white">{filteredUsers.length}</strong> registered & active users
                  </span>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Search by email, name, role..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Users Table / Grid */}
              <div className="space-y-2.5">
                {filteredUsers.map((user) => {
                  const isMaster = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        isMaster
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/5'
                          : user.isBlacklisted
                          ? 'bg-rose-950/20 border-rose-600/40 opacity-75'
                          : user.isWhitelisted
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Left: Identity & Badges */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400 shrink-0 text-sm relative">
                          {isMaster ? <Crown className="w-5 h-5 text-amber-400" /> : user.displayName.slice(0, 2).toUpperCase()}
                          <span
                            className={`w-2.5 h-2.5 rounded-full border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5 ${
                              user.activeStatus === 'online'
                                ? 'bg-emerald-500 animate-pulse'
                                : user.activeStatus === 'away'
                                ? 'bg-amber-500'
                                : 'bg-zinc-600'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white truncate">{user.displayName}</span>
                            <span className="text-xs text-zinc-400 font-mono">({user.email})</span>

                            {isMaster && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                Master Admin
                              </span>
                            )}

                            {user.isUnlimited && !isMaster && (
                              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                ⚡ Unlimited VIP Pass
                              </span>
                            )}

                            {user.isWhitelisted && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                🛡️ Whitelisted
                              </span>
                            )}

                            {user.isBlacklisted && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                                🚫 Banned / Blacklisted
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 flex-wrap">
                            <span>Handle: @{user.artistHandle}</span>
                            <span>•</span>
                            <span className="capitalize">Role: {user.role}</span>
                            <span>•</span>
                            <span className="text-zinc-300">
                              Status: <strong className={user.activeStatus === 'online' ? 'text-emerald-400' : 'text-zinc-400'}>{user.activeStatus.toUpperCase()}</strong> ({user.currentApp})
                            </span>
                            <span>•</span>
                            <span>Trust Score: <strong className="text-amber-400">{user.trustScore}%</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Master Admin Control Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {isMaster ? (
                          <span className="text-xs font-mono text-amber-400 font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            Founder (Full Authority)
                          </span>
                        ) : (
                          <>
                            {/* Free Access Button */}
                            {user.isUnlimited ? (
                              <button
                                type="button"
                                onClick={() => handleRevokeFreeAccess(user)}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                title="Revoke Unlimited Pro Access"
                              >
                                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Revoke VIP</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleGrantFreeAccess(user)}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black transition shadow-sm flex items-center gap-1 cursor-pointer"
                                title="Give Free Unlimited Access to Everything"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Give Free Access</span>
                              </button>
                            )}

                            {/* Whitelist Button */}
                            {!user.isWhitelisted ? (
                              <button
                                type="button"
                                onClick={() => handleWhitelist(user)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                title="Add to Whitelist (100% Trust)"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Whitelist</span>
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                                Verified Safe
                              </span>
                            )}

                            {/* Blacklist / Ban Button */}
                            {!user.isBlacklisted ? (
                              <button
                                type="button"
                                onClick={() => handleBlacklist(user)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-600/40 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                title="Blacklist & Ban User"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Blacklist</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleWhitelist(user)}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
                              >
                                Unban User
                              </button>
                            )}

                            {/* Kick Out Button */}
                            <button
                              type="button"
                              onClick={() => handleKick(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-500/50 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              title="Forcibly kick user from current session / meeting room"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Kick Out</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: REAL ACTIVITY AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>
                    Actual Live Activity Logs (<strong className="text-white">{filteredLogs.length}</strong> events logged)
                  </span>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
                    placeholder="Search logs by action, user, studio..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Logs Stream */}
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    No activity logs recorded yet. All actions taken in the studios will stream here automatically.
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-white">{log.action}</span>
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                              {log.appLocation}
                            </span>
                            <span className="text-[11px] text-amber-400/90 font-medium">
                              User: {log.displayName} ({log.userEmail})
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-[11px] text-zinc-400 break-words font-mono bg-zinc-950/60 p-1.5 rounded-lg border border-zinc-800">
                              {log.details}
                            </p>
                          )}
                        </div>

                        <div className="text-[10px] text-zinc-500 font-mono shrink-0 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY SENTINEL & TELEMETRY */}
          {activeTab === 'system' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold block mb-1">AI Sentinel Guard</span>
                  <div className="text-xl font-black text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5" />
                    <span>ACTIVE & IMMUNE</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Autonomous threat detection & self-repair</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold block mb-1">Assembly Meeting Quorum</span>
                  <div className="text-xl font-black text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-5 h-5" />
                    <span>OVERRIDE ENABLED</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Founder veto & direct motion closure active</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-semibold block mb-1">Master Engine</span>
                  <div className="text-xl font-black text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5" />
                    <span>GEMINI 3.7</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Dual cadence takes & pure structured JSON</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Administrative Privilege Summary:
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>Infinite Access:</strong> Account <span className="text-amber-400">{ADMIN_EMAIL}</span> is permanently whitelisted, paywall-exempt, and rate-limit exempt.
                  </li>
                  <li>
                    <strong>Global Notification Control:</strong> Ability to broadcast emergency sirens, meeting alerts, and studio messages directly to all client machines.
                  </li>
                  <li>
                    <strong>Real-Time Session Enforcer:</strong> 1-click kick, whitelist, blacklist, and free access grants update live across the entire distributed network.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Authenticated as <strong>{currentUser.displayName}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateTo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTo('meeting-room');
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Jump to Assembly Meeting Room</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
