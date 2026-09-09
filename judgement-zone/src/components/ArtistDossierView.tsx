import React, { useState } from 'react';
import {
  FileBarChart,
  Award,
  Crown,
  Sparkles,
  ShieldCheck,
  Ear,
  Flame,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  MessageSquareQuote,
  Clock,
  PlusCircle,
  Play,
  Pause,
  Sliders,
  Music2
} from 'lucide-react';
import { ArtistTrack, JudgeReview, JudgeTier } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface ArtistDossierViewProps {
  tracks: ArtistTrack[];
  onUpdateTrack: (updatedTrack: ArtistTrack) => void;
  onNavigateToSubmit: () => void;
}

export const ArtistDossierView: React.FC<ArtistDossierViewProps> = ({
  tracks,
  onUpdateTrack,
  onNavigateToSubmit
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || '');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  // Helper for Judge Tier Badges (NO user names displayed as requested!)
  const renderTierBadge = (tier: JudgeTier) => {
    switch (tier) {
      case 'Grand Arbiter':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 font-bold">
            <Crown className="w-3 h-3 text-amber-300" />
            Tier V: Grand Arbiter
          </span>
        );
      case 'Master Tastemaker':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400 font-bold">
            <Sparkles className="w-3 h-3 text-purple-300" />
            Tier IV: Master Tastemaker
          </span>
        );
      case 'Verified Auditor':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold">
            <Award className="w-3 h-3 text-cyan-300" />
            Tier III: Verified Auditor
          </span>
        );
      case 'Cadet Critic':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-300" />
            Tier II: Cadet Critic
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
            <Ear className="w-3 h-3 text-zinc-400" />
            Tier I: Apprentice Ear
          </span>
        );
    }
  };

  const handleTogglePlay = () => {
    if (!selectedTrack) return;
    if (isPlayingPreview) {
      audioEngine.pause();
      setIsPlayingPreview(false);
    } else {
      audioEngine.loadTrack(selectedTrack.audioBlobUrl, selectedTrack.durationSeconds, selectedTrack.synthPreset);
      audioEngine.play();
      setIsPlayingPreview(true);
    }
  };

  if (!selectedTrack) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-white">No Tracks in Dossier Yet</h2>
        <p className="text-sm text-zinc-400 mt-2">Submit your first original track to begin anonymous peer audits.</p>
        <button
          onClick={onNavigateToSubmit}
          className="mt-6 px-6 py-2.5 rounded-xl bg-amber-500 text-amber-950 font-bold text-sm"
        >
          Submit Track
        </button>
      </div>
    );
  }

  // Count distribution of judge tiers on this track
  const tierCounts: Record<string, number> = {};
  selectedTrack.reviews.forEach((r) => {
    tierCounts[r.judgeTier] = (tierCounts[r.judgeTier] || 0) + 1;
  });

  const scores = selectedTrack.aggregatedScores;

  return (
    <div id="artist-dossier-root" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono mb-2">
            <FileBarChart className="w-3.5 h-3.5" /> 10-JUDGE ANONYMOUS CONSENSUS DOSSIER
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Artist Verdict Reports & Peer Audits
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Inspect blind evaluations from qualified peer judges. Individual auditor names remain strictly anonymous, displaying only verified Judge Tier levels.
          </p>
        </div>

        <button
          id="dossier-submit-new-track-btn"
          onClick={onNavigateToSubmit}
          type="button"
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-2 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Another Master</span>
        </button>
      </div>

      {/* Track Selector Carousel / Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {tracks.map((track) => {
          const isSelected = track.id === selectedTrack.id;
          return (
            <button
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              className={`flex items-center gap-3 p-2.5 pr-4 rounded-2xl border transition text-left shrink-0 select-none ${isSelected
                  ? 'bg-zinc-900 border-amber-500/80 ring-1 ring-amber-500/30 shadow-lg'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                }`}
            >
              <img src={track.coverArt} alt={track.title} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="truncate max-w-[140px]">{track.title}</span>
                  {track.isUserSubmission && (
                    <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                      Your Master
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
                  <span className="text-amber-400 font-bold">
                    ★ {track.aggregatedScores.overall > 0 ? track.aggregatedScores.overall : 'Queued'}
                  </span>
                  <span>•</span>
                  <span>{track.reviews.length}/10 Judges</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Track Dossier Report Card */}
      {selectedTrack.status === 'returned' && (
        <div role="alert" className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-5 text-sm text-rose-100">
          <p className="font-black">Submission returned from the Judgment pool</p>
          <p className="mt-1 text-xs text-rose-200">
            {selectedTrack.returnedReason === 'wrong-ai-room'
              ? 'Five different judges flagged this track as AI-assisted music in the Human-Created room. Review the disclosure and submit it to the AI-Assisted Chamber if appropriate.'
              : 'Five different judges flagged the audio as too low-quality or damaged to judge fairly. Check the exported file, volume, clipping, silence, and playback before submitting a corrected version.'}
          </p>
          <p className="mt-2 text-[11px] text-zinc-400">A flag threshold is community feedback, not proof of AI use or a rights violation.</p>
        </div>
      )}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Track Identity & Audio Player strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <img
              src={selectedTrack.coverArt}
              alt={selectedTrack.title}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-zinc-800 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-800">
                  {selectedTrack.genre}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {selectedTrack.reviews.length}/10 Audits Complete
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">{selectedTrack.title}</h3>
              <p className="text-sm font-bold text-amber-400">{selectedTrack.artistName}</p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {selectedTrack.mood} • {selectedTrack.bpm ? `${selectedTrack.bpm} BPM` : 'Original Mix'}
              </p>
            </div>
          </div>

          {/* Action & Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTogglePlay}
              type="button"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono flex items-center gap-2 transition"
            >
              {isPlayingPreview ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
              <span>{isPlayingPreview ? 'Pause Audio' : 'Play Master'}</span>
            </button>

            <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[10px] font-mono text-zinc-400">
              Quality flags: {selectedTrack.flagCounts?.['bad-quality'] || 0}/5
            </span>
            {selectedTrack.creationType === 'human-created' && (
              <span className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[10px] font-mono text-zinc-400">
                Wrong-room flags: {selectedTrack.flagCounts?.['wrong-ai-room'] || 0}/5
              </span>
            )}

          </div>
        </div>

        {/* 4 Score Pillars + Overall Rating */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-zinc-900 border border-amber-500/30 text-center flex flex-col justify-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Consensus Score</div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono mt-1">
              {scores.overall > 0 ? scores.overall : '--'}
              <span className="text-xs text-zinc-400 font-normal"> / 10</span>
            </div>
            <div className="text-[11px] font-bold text-amber-300 mt-1">
              {scores.overall >= 8.5
                ? '🔥 Certified Heat'
                : scores.overall >= 7.0
                  ? '🎧 Solid Track'
                  : scores.overall > 0
                    ? '🛠️ Needs Polish'
                    : 'Evaluating...'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="text-[10px] font-mono text-zinc-400">1. Lyrics</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{scores.lyrics || '--'}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Wordplay & Depth</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="text-[10px] font-mono text-zinc-400">2. Vocals</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{scores.vocals || '--'}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Pitch & Delivery</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="text-[10px] font-mono text-zinc-400">3. Instrumentation</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{scores.instrumentation || '--'}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Arrangement & Mix</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
            <div className="text-[10px] font-mono text-zinc-400">4. Vibe</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{scores.vibe || '--'}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Energy & Replay</div>
          </div>
        </div>

        {/* Breakdown of Verified Judge Tier Levels (ANONYMOUS) */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Auditor Tier Composition ({selectedTrack.reviews.length} Total Peer Judges):</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Zero Personal Names Leaked • Pure Anonymous Tiers</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(tierCounts).map(([tierName, count]) => (
              <div
                key={tierName}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
              >
                {renderTierBadge(tierName as JudgeTier)}
                <span className="font-mono font-bold text-white">× {count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* List of Individual Anonymous Peer Reviews */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-amber-400" />
              Anonymous Peer Audit Log ({selectedTrack.reviews.length}/10 Submitted)
            </h4>
            <span className="text-xs font-mono text-zinc-400">
              Avg Full Listen Rate: {scores.fullListenRate}%
            </span>
          </div>

          {selectedTrack.reviews.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
              Awaiting first peer auditor in the chamber...
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTrack.reviews.map((rev, idx) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 space-y-3 hover:border-zinc-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                        #{idx + 1}
                      </span>
                      {renderTierBadge(rev.judgeTier)}
                      {rev.completedFullListen && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          ★ 100% Full Listen
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-950 text-amber-400 font-bold border border-zinc-800">
                        Score: {rev.overallScore}/10.0
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {rev.verdict}
                      </span>
                    </div>
                  </div>

                  {/* 4 Dimension sub-scores */}
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-mono bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/60 text-center">
                    <div>
                      <span className="text-zinc-500">Lyrics:</span> <strong className="text-zinc-200">{rev.scores.lyrics}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Vocals:</span> <strong className="text-zinc-200">{rev.scores.vocals}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Inst:</span> <strong className="text-zinc-200">{rev.scores.instrumentation}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Vibe:</span> <strong className="text-zinc-200">{rev.scores.vibe}</strong>
                    </div>
                  </div>

                  {/* Written Feedback Quote */}
                  <p className="text-xs text-zinc-300 italic bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 leading-relaxed">
                    "{rev.writtenFeedback}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                    <span>Evaluated blindly • Drift Alignment: {rev.driftMatchScore}%</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
