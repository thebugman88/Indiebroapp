import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Vote,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Users,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { Motion, VoteChoice, UserRole, Topic } from '../types';

interface VotingAreaProps {
  activeMotion: Motion | null;
  recentMotions: Motion[];
  currentTopic?: Topic;
  myVote?: VoteChoice;
  userRole: UserRole;
  attendeeCount: number;
  onCastVote: (choice: VoteChoice) => void;
  onCloseMotion: (motionId: string) => void;
  onOpenHostDialog: () => void;
}

export function VotingArea({
  activeMotion,
  recentMotions,
  currentTopic,
  myVote,
  userRole,
  attendeeCount,
  onCastVote,
  onCloseMotion,
  onOpenHostDialog,
}: VotingAreaProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Countdown timer calculation
  useEffect(() => {
    if (!activeMotion || !activeMotion.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((activeMotion.expiresAt! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && userRole === 'host') {
        // Auto close if host
        onCloseMotion(activeMotion.id);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeMotion?.id, activeMotion?.expiresAt, userRole]);

  // Trigger confetti when a recent motion passed
  useEffect(() => {
    if (recentMotions.length > 0 && recentMotions[0].status === 'passed') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // ignore if not supported
      }
    }
  }, [recentMotions[0]?.id, recentMotions[0]?.status]);

  if (!activeMotion) {
    return (
      <div id="voting-area-idle" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Assembly Voting Floor</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-full">
                  Floor Idle
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                No active ballot at this moment. The floor is open for floor debate and discussions.
              </p>
            </div>
          </div>

          {userRole === 'host' ? (
            <button
              id="idle-start-motion-btn"
              onClick={onOpenHostDialog}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Vote className="w-4 h-4" />
              <span>Put Up Topic for Vote</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Users className="w-4 h-4 text-blue-600" />
              <span>You are attending. When a vote starts, Ya/Na options appear here.</span>
            </div>
          )}
        </div>

        {/* Current Topic Under Discussion */}
        {currentTopic && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded">
                  Current Discussion
                </span>
                <h3 className="text-sm font-semibold text-slate-900">{currentTopic.title}</h3>
              </div>
              {currentTopic.description && (
                <p className="text-xs text-slate-600 max-w-2xl">{currentTopic.description}</p>
              )}
            </div>
            {userRole === 'host' && (
              <button
                type="button"
                onClick={onOpenHostDialog}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0"
              >
                <span>Manage Topics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Recent Decisions History */}
        {recentMotions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Recent Voting Resolutions</span>
            </h3>

            <div className="grid gap-2.5">
              {recentMotions.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.status === 'passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.status === 'passed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{m.status.toUpperCase()}</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate">{m.title}</span>
                    </div>
                    {m.resultSummary && (
                      <p className="text-xs text-slate-500">{m.resultSummary}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-medium shrink-0">
                    <span className="text-emerald-700 font-bold">{m.tally.ya} Ya</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-700 font-bold">{m.tally.na} Na</span>
                    {m.tally.abstain > 0 && (
                      <>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-500">{m.tally.abstain} Abstain</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Motion State
  const { tally, requiredMajority } = activeMotion;
  const activeVotes = tally.ya + tally.na;
  const yaPercentage = activeVotes > 0 ? Math.round((tally.ya / activeVotes) * 100) : 0;
  const naPercentage = activeVotes > 0 ? Math.round((tally.na / activeVotes) * 100) : 0;

  return (
    <div id="active-voting-stage" className="bg-white rounded-2xl border-2 border-blue-500 shadow-md p-6 space-y-6 animate-fade-in relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold uppercase rounded-full tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Live Voting Ballot</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Proposed by: <span className="text-slate-800">{activeMotion.proposedBy}</span>
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded uppercase">
              {requiredMajority === 'two_thirds' ? '2/3 Majority Required' : requiredMajority === 'unanimous' ? 'Unanimous Required' : 'Simple Majority'}
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 pt-1 tracking-tight">{activeMotion.title}</h2>
          {activeMotion.description && (
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{activeMotion.description}</p>
          )}
        </div>

        {/* Timer / Host Conclude controls */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                timeLeft <= 10
                  ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                  : timeLeft <= 30
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s Remaining</span>
            </div>
          )}

          {userRole === 'host' && (
            <button
              id="conclude-motion-btn"
              onClick={() => onCloseMotion(activeMotion.id)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conclude Vote</span>
            </button>
          )}
        </div>
      </div>

      {/* Main YA or NA or ABSTAIN Voting Buttons Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Cast Your Vote (Tap Option to Record / Change)
          </span>
          {myVote ? (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              Your Current Vote: <strong className="uppercase">{myVote}</strong>
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100">
              Vote Pending
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* YA (YES) BUTTON */}
          <button
            id="vote-ya-btn"
            type="button"
            onClick={() => onCastVote('ya')}
            className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 transition-all transform active:scale-[0.98] ${
              myVote === 'ya'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-400/30'
                : 'border-emerald-200 bg-white hover:bg-emerald-50/60 text-slate-800 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-base font-extrabold text-emerald-900 tracking-tight">YA (Yes)</span>
                <span className="block text-[11px] text-emerald-700 font-medium">In favor of motion</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-700">{tally.ya}</span>
              <span className="block text-[10px] text-emerald-600 font-semibold">{yaPercentage}%</span>
            </div>
          </button>

          {/* NA (NO) BUTTON */}
          <button
            id="vote-na-btn"
            type="button"
            onClick={() => onCastVote('na')}
            className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 transition-all transform active:scale-[0.98] ${
              myVote === 'na'
                ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-md ring-2 ring-rose-400/30'
                : 'border-rose-200 bg-white hover:bg-rose-50/60 text-slate-800 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
                <ThumbsDown className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-base font-extrabold text-rose-900 tracking-tight">NA (No)</span>
                <span className="block text-[11px] text-rose-700 font-medium">Opposed to motion</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-rose-700">{tally.na}</span>
              <span className="block text-[10px] text-rose-600 font-semibold">{naPercentage}%</span>
            </div>
          </button>

          {/* ABSTAIN BUTTON */}
          <button
            id="vote-abstain-btn"
            type="button"
            onClick={() => onCastVote('abstain')}
            className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 transition-all transform active:scale-[0.98] ${
              myVote === 'abstain'
                ? 'border-slate-600 bg-slate-100 text-slate-950 shadow-md ring-2 ring-slate-400/30'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
                <MinusCircle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-base font-extrabold text-slate-800 tracking-tight">Abstain</span>
                <span className="block text-[11px] text-slate-500 font-medium">Present / Neutral</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-700">{tally.abstain}</span>
              <span className="block text-[10px] text-slate-500 font-semibold">
                {tally.total > 0 ? Math.round((tally.abstain / tally.total) * 100) : 0}%
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Live Visual Progress Tally Breakdown */}
      <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Live Tally Results ({tally.total} Cast Votes)</span>
          <span>Attendance Quorum: {tally.total} / {attendeeCount} Participants</span>
        </div>

        {/* Dual Colored Progress Bar */}
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${yaPercentage}%` }}
            className="bg-emerald-500 transition-all duration-300 h-full"
            title={`Ya: ${tally.ya} (${yaPercentage}%)`}
          />
          <div
            style={{ width: `${naPercentage}%` }}
            className="bg-rose-500 transition-all duration-300 h-full"
            title={`Na: ${tally.na} (${naPercentage}%)`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Ya: {tally.ya} votes ({yaPercentage}%)
          </span>
          <span className="flex items-center gap-1 text-rose-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Na: {tally.na} votes ({naPercentage}%)
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
            Abstain: {tally.abstain}
          </span>
        </div>
      </div>
    </div>
  );
}
