import React from 'react';
import {
  Users,
  Hand,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Crown,
  UserCheck,
  Circle,
  Clock,
  Sparkles,
  Shield,
  Volume2,
} from 'lucide-react';
import type { Attendee, UserRole, VoteChoice } from '../types';

interface AttendeeListProps {
  attendees: Attendee[];
  currentUserId: string;
  userRole: UserRole;
  isVoteActive: boolean;
  hasHandRaised: boolean;
  onToggleHandRaise: () => void;
  onUpdateRole?: (newRole: UserRole) => void;
}

export function AttendeeList({
  attendees,
  currentUserId,
  userRole,
  isVoteActive,
  hasHandRaised,
  onToggleHandRaise,
  onUpdateRole,
}: AttendeeListProps) {
  const raisedHandsCount = attendees.filter((a) => a.hasHandRaised).length;

  return (
    <div id="attendee-list-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Meeting Attendees</span>
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full">
                {attendees.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">Live participant attendance & voting queue</p>
          </div>
        </div>

        {/* Hand Raise Trigger for Attendee */}
        <button
          id="toggle-hand-raise-btn"
          type="button"
          onClick={onToggleHandRaise}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            hasHandRaised
              ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-400/40 animate-pulse'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-amber-600'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>{hasHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
        </button>
      </div>

      {/* Raised hands banner if any */}
      {raisedHandsCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 text-xs font-medium text-amber-800">
          <Hand className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
          <span>{raisedHandsCount} attendee{raisedHandsCount > 1 ? 's' : ''} requested to speak</span>
        </div>
      )}

      {/* Attendee Roster Grid / List */}
      <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-[500px]">
        {attendees.map((attendee) => {
          const isSelf = attendee.id === currentUserId;
          return (
            <div
              key={attendee.id}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isSelf
                  ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-500/20'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Left: Avatar & Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ backgroundColor: attendee.avatarColor || '#3B82F6' }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs relative"
                >
                  {attendee.name.charAt(0).toUpperCase()}
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {attendee.name}
                    </span>
                    {isSelf && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/80 px-1.5 py-0.2 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="capitalize">{attendee.role}</span>
                    {attendee.hasHandRaised && (
                      <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                        • <Hand className="w-2.5 h-2.5 inline" /> Raised
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Status / Active Vote indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isVoteActive ? (
                  attendee.currentVote ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        attendee.currentVote === 'ya'
                          ? 'bg-emerald-100 text-emerald-800'
                          : attendee.currentVote === 'na'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {attendee.currentVote === 'ya' ? (
                        <ThumbsUp className="w-3 h-3 text-emerald-600" />
                      ) : attendee.currentVote === 'na' ? (
                        <ThumbsDown className="w-3 h-3 text-rose-600" />
                      ) : (
                        <MinusCircle className="w-3 h-3 text-slate-600" />
                      )}
                      <span>{attendee.currentVote}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      Pending
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Attending</span>
                  </span>
                )}

                {attendee.role === 'host' && (
                  <span title="Host Moderator">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Role Quick Switch */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between gap-2">
        <span className="text-[11px]">
          Role: <strong className="text-slate-800 capitalize">{userRole}</strong>
        </span>
        {onUpdateRole && (
          <button
            id="switch-role-toggle-btn"
            type="button"
            onClick={() => onUpdateRole(userRole === 'host' ? 'attendee' : 'host')}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            {userRole === 'host' ? 'Switch to Attendee Mode' : 'Become Host Moderator'}
          </button>
        )}
      </div>
    </div>
  );
}
