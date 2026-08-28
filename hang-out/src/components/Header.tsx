import React from 'react';
import { UserProfile, RoomId } from '../types';
import { Mic, Users, MessageSquare, TrendingUp, Music, HelpCircle, FileText, Sparkles, Flame } from 'lucide-react';

interface Props {
  activeRoom: RoomId;
  onSelectRoom: (roomId: RoomId) => void;
  currentUser: UserProfile | null;
  onOpenProfile: () => void;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onlineCount: number;
}

export const Header: React.FC<Props> = ({
  activeRoom,
  onSelectRoom,
  currentUser,
  onOpenProfile,
  onOpenHelp,
  onOpenTerms,
  onlineCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-2 shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Hang Out
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  LIVE HUB
                </span>
              </div>
              <p className="text-[11px] font-semibold text-amber-400/90 tracking-widest uppercase">
                by indiebrotherhood
              </p>
            </div>
          </div>

          {/* User Profile & Global Controls */}
          <div className="flex items-center gap-3">
            {/* Live Counter */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium">{onlineCount} Artists Connected</span>
            </div>

            {/* Help & Terms Trigger */}
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-amber-400 transition py-1.5 px-2 rounded-lg hover:bg-slate-900"
              title="Help & Room Guide"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden md:inline">Help</span>
            </button>

            <button
              onClick={onOpenTerms}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-amber-400 transition py-1.5 px-2 rounded-lg hover:bg-slate-900"
              title="Terms of Service"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Terms</span>
            </button>

            {currentUser && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-slate-900/90 px-3 py-1.5 text-xs text-white hover:border-amber-500/60 transition shadow-sm"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.nickname}
                  className="h-6 w-6 rounded-full object-cover border border-amber-400"
                />
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-amber-300 leading-tight">{currentUser.nickname}</p>
                  <p className="text-[10px] text-slate-400">{currentUser.role}</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Room Tabs */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-800/60 py-2 scrollbar-none">
          <button
            onClick={() => onSelectRoom('rap-battle')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
              activeRoom.startsWith('rap-battle')
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-amber-400'
            }`}
          >
            <Mic className="h-4 w-4" />
            Rap Battle Arena
          </button>

          <button
            onClick={() => onSelectRoom('collaboration')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
              activeRoom === 'collaboration'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-amber-400'
            }`}
          >
            <Users className="h-4 w-4" />
            Collaboration Rooms
          </button>

          <button
            onClick={() => onSelectRoom('lounge')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
              activeRoom === 'lounge'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-amber-400'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Artist Lounge
          </button>

          <button
            onClick={() => onSelectRoom('marketing')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
              activeRoom === 'marketing'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-amber-400'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Marketing Ideas Hub
          </button>

          <button
            onClick={() => onSelectRoom('beat-showcase')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
              activeRoom === 'beat-showcase'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900 hover:text-amber-400'
            }`}
          >
            <Music className="h-4 w-4" />
            Beats & Art Showcase
          </button>
        </div>
      </div>
    </header>
  );
};
