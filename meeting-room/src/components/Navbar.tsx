import React, { useState } from 'react';
import {
  Vote,
  Layers,
  Users,
  FileText,
  Copy,
  Check,
  Share2,
  Settings,
  Crown,
  ChevronDown,
  Shield,
  Circle,
  Hash,
} from 'lucide-react';
import type { UserRole, MeetingRoomState } from '../types';

interface NavbarProps {
  roomId: string;
  roomTitle: string;
  userRole: UserRole;
  userName: string;
  attendeeCount: number;
  meetingStatus: MeetingRoomState['meetingStatus'];
  connected: boolean;
  isAdmin?: boolean;
  onOpenHostDialog: () => void;
  onOpenMinutesModal: () => void;
  onOpenAdminControlRoom?: () => void;
  onChangeRoom: (newRoomId: string) => void;
  onUpdateRole: (newRole: UserRole) => void;
}

export function Navbar({
  roomId,
  roomTitle,
  userRole,
  userName,
  attendeeCount,
  meetingStatus,
  connected,
  isAdmin,
  onOpenHostDialog,
  onOpenMinutesModal,
  onOpenAdminControlRoom,
  onChangeRoom,
  onUpdateRole,
}: NavbarProps) {
  const [copied, setCopied] = useState(false);
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState('');

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoomInput.trim()) {
      onChangeRoom(customRoomInput.trim().toLowerCase());
      setCustomRoomInput('');
      setIsRoomMenuOpen(false);
    }
  };

  return (
    <header id="app-header" className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Room Indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 font-bold text-base tracking-tight text-white shrink-0">
            <div className="p-2 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Vote className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline">Assembly Meeting</span>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Room Switcher Dropdown */}
          <div className="relative">
            <button
              id="room-selector-btn"
              type="button"
              onClick={() => setIsRoomMenuOpen(!isRoomMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <Hash className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{roomId}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoomMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
                  Switch or Create Room
                </span>

                <form onSubmit={handleSwitchRoomSubmit} className="space-y-2 mb-3">
                  <input
                    type="text"
                    value={customRoomInput}
                    onChange={(e) => setCustomRoomInput(e.target.value)}
                    placeholder="Enter room ID..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Join Room
                  </button>
                </form>

                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 block px-1">Standard Rooms:</span>
                  {['general', 'governance', 'board', 'finance'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        onChangeRoom(r);
                        setIsRoomMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                        roomId === r ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>#{r}</span>
                      {roomId === r && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Session Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-[11px] font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                meetingStatus === 'in_session'
                  ? 'bg-emerald-400 animate-pulse'
                  : meetingStatus === 'scheduled'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
              }`}
            />
            <span className="capitalize">{meetingStatus.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Right: Actions, Role Indicator, Host Console */}
        <div className="flex items-center gap-2.5">
          {/* Minutes Button */}
          <button
            id="open-minutes-btn"
            type="button"
            onClick={onOpenMinutesModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            title="View & Export Meeting Minutes"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Minutes & Records</span>
          </button>

          {/* Share Room Button */}
          <button
            id="share-room-btn"
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Copy Meeting Room Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Link Copied' : 'Share Room'}</span>
          </button>

          {/* Master Founder Admin Control Room Trigger (Only visible to Christopher Ray) */}
          {isAdmin && onOpenAdminControlRoom && (
            <button
              id="open-founder-admin-control-room-btn"
              type="button"
              onClick={onOpenAdminControlRoom}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 ring-2 ring-amber-400/50 cursor-pointer animate-pulse"
              title="Open Master Founder Admin Control Room"
            >
              <Crown className="w-3.5 h-3.5 text-zinc-950" />
              <span>Admin Room</span>
            </button>
          )}

          {/* Host Moderator Console Button */}
          {userRole === 'host' ? (
            <button
              id="open-host-console-btn"
              type="button"
              onClick={onOpenHostDialog}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 ring-2 ring-blue-400/30"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Moderator Console</span>
            </button>
          ) : (
            <button
              id="attendee-role-badge-btn"
              type="button"
              onClick={() => onUpdateRole('host')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Click to switch to Host role"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Attendee Mode</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
