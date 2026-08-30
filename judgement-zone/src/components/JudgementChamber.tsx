import { startListening } from '../utils/storage';
import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Lock,
  Flame,
  Gavel,
  Check,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ShieldCheck,
  Sliders,
  FileText,
  Music,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ArtistTrack, JudgeReview, ScoreBreakdown, TrackVerdict, UserJudgeProfile } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { AudioWaveform } from './AudioWaveform';
import { calculateReviewReward, calculateSonicDrift, JUDGE_TIERS } from '../utils/matchmaker';

interface JudgementChamberProps {
  tracks: ArtistTrack[];
  userProfile: UserJudgeProfile;
  onRecordReview: (review: JudgeReview, trackId: string, xpEarned: number) => Promise<JudgeReview>;
  onUseSkip: () => Promise<void>;
  onSaveToVault: (trackId: string) => void;
  onNavigateToSubmit: () => void;
  onNavigateToSonicProfile: () => void;
}

export const JudgementChamber: React.FC<JudgementChamberProps> = ({
  tracks,
  userProfile,
  onRecordReview,
  onUseSkip,
  onSaveToVault,
  onNavigateToSubmit,
  onNavigateToSonicProfile
}) => {
  // Select current candidate track to judge (unjudged by user)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxListenedTime, setMaxListenedTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [seekWarning, setSeekWarning] = useState<string | null>(null);

  // Rubric State
  const [scores, setScores] = useState<ScoreBreakdown>({
    lyrics: 8,
    vocals: 8,
    instrumentation: 8,
    vibe: 8
  });
  const [verdict, setVerdict] = useState<TrackVerdict>('Solid Track');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reveal State after submitting verdict
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedReview, setRevealedReview] = useState<JudgeReview | null>(null);
  const [showLyricsModal, setShowLyricsModal] = useState(false);

  // Filter available queue for blind chamber
  const candidateTracks = tracks.filter(t => t.ownerId!==userProfile.id && (!userProfile.savedVaultTrackIds.includes(t.id) || isRevealed));
  const currentTrack = candidateTracks[currentTrackIndex] || candidateTracks[0];

  const sonicMatchScore = currentTrack ? calculateSonicDrift(userProfile.tasteProfile, currentTrack) : 75;

  // Load track into audio engine when currentTrack changes
  useEffect(() => {
    if (!currentTrack) return;
    setIsRevealed(false);
    setRevealedReview(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setMaxListenedTime(0);
    setFeedbackText('');
    setScores({ lyrics: 8, vocals: 8, instrumentation: 8, vibe: 8 });

    audioEngine.loadTrack(currentTrack.audioBlobUrl, currentTrack.durationSeconds, currentTrack.synthPreset);
    setDuration(currentTrack.durationSeconds);

    audioEngine.setCallbacks(
      (time, maxTime, dur) => {
        setCurrentTime(time);
        setMaxListenedTime(maxTime);
        setDuration(dur);
      },
      () => {
        setIsPlaying(false);
      },
      (msg) => {
        setSeekWarning(msg);
        setTimeout(() => setSeekWarning(null), 3500);
      }
    );

    return () => {
      audioEngine.stop();
    };
  }, [currentTrack?.id]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      try {await startListening(currentTrack.id);}catch(e:any){setSeekWarning(e.message);return;}
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleRewind = () => {
    audioEngine.rewind(10);
  };

  const handleSeekAttempt = (targetTime: number) => {
    audioEngine.attemptSeek(targetTime);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    audioEngine.setVolume(newVol);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioEngine.setVolume(volume || 0.85);
    } else {
      setIsMuted(true);
      audioEngine.setVolume(0);
    }
  };

  const handleSkipTrack = async () => {
    if (userProfile.skipsRemaining <= 0) {
      setSeekWarning('Daily skip limit reached (3/3 used). Complete this evaluation or wait for 24h reset.');
      setTimeout(() => setSeekWarning(null), 3500);
      return;
    }

    try {await onUseSkip();}catch(e:any){setSeekWarning(e.message);return;}
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTrackIndex((prev) => (prev + 1) % Math.max(1, candidateTracks.length));
  };

  // Listen Completion status
  const listenRatio = duration > 0 ? maxListenedTime / duration : 0;
  const is50PercentMet = listenRatio >= 0.5;
  const is100PercentMet = listenRatio >= 0.99;

  // Auto-calculated overall score
  const overallCalculated = parseFloat(
    ((scores.lyrics + scores.vocals + scores.instrumentation + scores.vibe) / 4).toFixed(1)
  );

  // Real-time reward calculator
  const rewardPreview = {xp:50,depthMultiplier:1,listenMultiplier:1,breakdown:'50 XP for a validated review; no unverified listening bonus.'};

  const handleSubmitVerdict = async () => {
    if (!is50PercentMet) {
      setSeekWarning('Integrity Gate: You must listen to at least 50% of the song before submitting your verdict.');
      setTimeout(() => setSeekWarning(null), 3500);
      audioEngine.playWarningSound();
      return;
    }

    if (feedbackText.trim().length < 15) {
      setSeekWarning('Please provide at least 15 characters of constructive explanation for your scores.');
      setTimeout(() => setSeekWarning(null), 3500);
      return;
    }

    setIsSubmitting(true);
    audioEngine.playGavelImpact();

    try {

      const newReview: JudgeReview = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        trackId: currentTrack.id,
        judgeId: userProfile.id,
        judgeTier: userProfile.judgeTier,
        judgeRankLevel: userProfile.judgeTierLevel,
        scores: { ...scores },
        overallScore: overallCalculated,
        writtenFeedback: feedbackText.trim(),
        listenPercentage: Math.round(listenRatio * 100),
        completedFullListen: is100PercentMet,
        verdict,
        xpEarned: rewardPreview.xp,
        createdAt: new Date().toISOString(),
        driftMatchScore: sonicMatchScore
      };

      const confirmed=await onRecordReview(newReview, currentTrack.id, rewardPreview.xp);
      setRevealedReview(confirmed);
      confetti({particleCount:80,spread:70,origin:{y:0.6}});
      setIsRevealed(true);
      setIsSubmitting(false);
      audioEngine.playUnveilSound();
    }catch(e:any){setSeekWarning(e.message);}finally{setIsSubmitting(false);}
  };

  const handleNextTrack = () => {
    setIsRevealed(false);
    setRevealedReview(null);
    setCurrentTrackIndex((prev) => (prev + 1) % Math.max(1, candidateTracks.length));
  };

  const isSavedInVault = userProfile.savedVaultTrackIds.includes(currentTrack?.id);

  if (!currentTrack) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Chamber Queue Clear!</h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
          You have reviewed all currently active blind submissions in your drift queue. Submit your own original master or calibrate your Sonic Drift.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={onNavigateToSubmit}
            type="button"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-bold text-sm shadow-lg hover:from-amber-400 hover:to-yellow-400 transition"
          >
            Submit Original Master Track
          </button>
          <button
            onClick={onNavigateToSonicProfile}
            type="button"
            className="px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-800 transition"
          >
            Adjust Sonic Drift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="judgement-chamber-root" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Toast Alert for Seek Locking / Gate Warnings */}
      {seekWarning && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-950/95 border border-amber-500 text-amber-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md animate-bounce">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{seekWarning}</span>
        </div>
      )}

      {/* Chamber Header & Drift Match Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Gavel className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {isRevealed ? 'Post-Judgement Reveal' : 'The Blind Judging Chamber'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-amber-400 border border-amber-500/30">
                10-Judge Protocol
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isRevealed
                ? 'The blind veil has lifted. You may now inspect artist identity and save to your vault.'
                : 'Evaluating blindly. Artist identity and song title will unlock upon submitting verdict.'}
            </p>
          </div>
        </div>

        {/* Sonic Match drift meter */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-400">Sonic Drift Match</div>
            <div className="text-xs font-bold text-emerald-400">{sonicMatchScore}% Compatibility</div>
          </div>
          <button
            onClick={handleSkipTrack}
            type="button"
            disabled={isRevealed || userProfile.skipsRemaining <= 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-mono transition ${
              userProfile.skipsRemaining > 0 && !isRevealed
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-amber-500/50'
                : 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed'
            }`}
            title="Skip to next blind candidate"
          >
            <span>Skip Track</span>
            <span className="text-amber-400 font-bold">({userProfile.skipsRemaining})</span>
          </button>
        </div>
      </div>

      {/* Main Blind Audition Deck */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Art Cover Area (Redacted vs Revealed) */}
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-2 border-zinc-800 shadow-2xl group">
              {isRevealed ? (
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover animate-fadeIn"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center p-4 relative select-none">
                  {/* Digital glitch blind pattern */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-black/80 pointer-events-none" />
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                    <Lock className="w-7 h-7 animate-pulse" />
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                    BLIND AUDITION
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 mt-1">
                    ENTRY #{currentTrack.id.slice(-4).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-950/90 text-amber-400 border border-zinc-700 backdrop-blur-sm">
                  {currentTrack.genre}
                </span>
              </div>
            </div>

            {/* Title & Artist information */}
            <div className="mt-4 w-full">
              {isRevealed ? (
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <Sparkles className="w-3 h-3" /> Identity Unlocked
                  </div>
                  <h3 className="text-xl font-black text-white">{currentTrack.title}</h3>
                  <p className="text-sm font-bold text-amber-400">{currentTrack.artistName}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    {currentTrack.mood} • {currentTrack.bpm ? `${currentTrack.bpm} BPM` : 'Original Mix'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    <Lock className="w-3 h-3 text-amber-400" /> Identity Redacted
                  </div>
                  <h3 className="text-lg font-bold text-zinc-300 font-mono">
                    [REDACTED CANDIDATE]
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Genre: <span className="text-zinc-300 font-semibold">{currentTrack.genre}</span>
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">
                    Mood: <span className="text-zinc-300 font-semibold">{currentTrack.mood}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right / Audio Playback & Waveform Suite */}
          <div className="lg:col-span-8 space-y-4">
            {/* Waveform with Interactive Restrictions */}
            <AudioWaveform
              isPlaying={isPlaying}
              currentTime={currentTime}
              maxListenedTime={maxListenedTime}
              duration={duration}
              onSeekAttempt={handleSeekAttempt}
              onRewind={handleRewind}
              isBlindMode={!isRevealed}
            />

            {/* Audio Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-3">
                {/* Play/Pause Button */}
                <button
                  id="chamber-play-pause-btn"
                  onClick={handleTogglePlay}
                  type="button"
                  className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>

                {/* Rewind Button */}
                <button
                  id="chamber-rewind-btn"
                  onClick={handleRewind}
                  type="button"
                  className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition active:scale-95 text-xs font-mono flex items-center gap-1.5"
                  title="Rewind 10 seconds"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Rewind 10s</span>
                </button>
              </div>

              {/* Volume & Details */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowLyricsModal(!showLyricsModal)}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-800 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lyrics Sheet</span>
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} type="button" className="text-zinc-400 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-24 accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Lyrics Sheet Dropdown if expanded */}
            {showLyricsModal && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-2 animate-fadeIn max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> Blind Track Lyrics Submission
                  </span>
                  <button onClick={() => setShowLyricsModal(false)} className="text-zinc-400 hover:text-white">✕</button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-300 leading-relaxed">
                  {currentTrack.lyricsText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post-Judgement Reveal Summary OR Active Scoring Rubric */}
      {isRevealed && revealedReview ? (
        <div id="post-reveal-summary" className="bg-zinc-950 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center font-black text-xl shadow-lg">
                ★
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Verdict Recorded & Verified!</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  You awarded this track <strong className="text-amber-400">{revealedReview.overallScore}/10.0</strong> ({revealedReview.verdict})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                +{revealedReview.xpEarned} Judge XP Earned
              </span>

              <button
                id="reveal-save-vault-btn"
                onClick={() => onSaveToVault(currentTrack.id)}
                type="button"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isSavedInVault
                    ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 hover:from-amber-400 hover:to-yellow-400 shadow-md'
                }`}
              >
                {isSavedInVault ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSavedInVault ? 'Saved in Vault' : 'Save to My Vault'}</span>
              </button>
            </div>
          </div>

          {/* Master Rights & Production Verification Note */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Ownership declared by uploader:</strong> {currentTrack.ownershipConfirmed ? 'Declaration on file (not independent verification)' : 'Not declared'}
              </span>
            </div>
            <span className="font-mono text-zinc-500 text-[10px]">
              Chamber Progress: {currentTrack.aggregatedScores.totalReviews}/10 Peer Reviews
            </span>
          </div>

          {/* Action to proceed to next track */}
          <div className="flex justify-end pt-2">
            <button
              id="chamber-next-track-btn"
              onClick={handleNextTrack}
              type="button"
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer transition active:scale-95"
            >
              <span>Next Blind Audition</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* The 4-Tier Judgement Rubric & Feedback */
        <div id="judgement-rubric-card" className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-amber-400" />
                Unanimous Scoring Rubric
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evaluate all 4 dimensions honestly. Your rating directly shapes the artist's official 10-Judge consensus report.
              </p>
            </div>

            {/* Calculated Overall Preview */}
            <div className="flex items-center gap-3 bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-800">
              <span className="text-xs font-mono text-zinc-400">Total Score:</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {overallCalculated}
                <span className="text-xs text-zinc-500 font-normal"> / 10.0</span>
              </span>
            </div>
          </div>

          {/* 4 Rubric Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Lyrics */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">1. Lyrics & Composition</span>
                  <p className="text-[11px] text-zinc-400">Storytelling, rhyme scheme, depth & originality</p>
                </div>
                <span className="text-base font-mono font-black text-amber-400 px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  {scores.lyrics}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={scores.lyrics}
                onChange={(e) => setScores({ ...scores, lyrics: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>1 (Weak)</span>
                <span>5 (Average)</span>
                <span>10 (Masterclass)</span>
              </div>
            </div>

            {/* 2. Vocals */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">2. Vocals & Delivery</span>
                  <p className="text-[11px] text-zinc-400">Pitch, tone, emotion, cadence & diction</p>
                </div>
                <span className="text-base font-mono font-black text-amber-400 px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  {scores.vocals}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={scores.vocals}
                onChange={(e) => setScores({ ...scores, vocals: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>1 (Weak)</span>
                <span>5 (Average)</span>
                <span>10 (Flawless)</span>
              </div>
            </div>

            {/* 3. Instrumentation */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">3. Instrumentation & Mix</span>
                  <p className="text-[11px] text-zinc-400">Arrangement, beat production, mix balance & sound design</p>
                </div>
                <span className="text-base font-mono font-black text-amber-400 px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  {scores.instrumentation}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={scores.instrumentation}
                onChange={(e) => setScores({ ...scores, instrumentation: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>1 (Cluttered)</span>
                <span>5 (Competent)</span>
                <span>10 (Pristine)</span>
              </div>
            </div>

            {/* 4. Vibe */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white">4. Vibe & Replay Value</span>
                  <p className="text-[11px] text-zinc-400">Energy, atmosphere, groove & playlist replayability</p>
                </div>
                <span className="text-base font-mono font-black text-amber-400 px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  {scores.vibe}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={scores.vibe}
                onChange={(e) => setScores({ ...scores, vibe: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>1 (Forgettable)</span>
                <span>5 (Decent)</span>
                <span>10 (Euphoric)</span>
              </div>
            </div>
          </div>

          {/* Verdict Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Overall Consensus Verdict
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['Certified Heat', 'Solid Track', 'Needs Polish', 'Rethink/Rework'] as TrackVerdict[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVerdict(v)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    verdict === v
                      ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
                  }`}
                >
                  {v === 'Certified Heat' && <Flame className="w-3.5 h-3.5 fill-current" />}
                  {v === 'Solid Track' && <Music className="w-3.5 h-3.5" />}
                  {v === 'Needs Polish' && <Sliders className="w-3.5 h-3.5" />}
                  {v === 'Rethink/Rework' && <RotateCcw className="w-3.5 h-3.5" />}
                  <span>{v}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Constructive Critique Box with Depth Tracker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="chamber-feedback-textarea" className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                Constructive Auditor Critique
                <span className="text-zinc-500">(Required, min 15 chars)</span>
              </label>
              <div className="text-[11px] font-mono text-zinc-400">
                {feedbackText.length > 250 ? (
                  <span className="text-emerald-400 font-bold">★ Detailed critique</span>
                ) : feedbackText.length > 120 ? (
                  <span className="text-cyan-400 font-bold">✓ Developed critique</span>
                ) : (
                  <span>{feedbackText.length} characters</span>
                )}
              </div>
            </div>

            <textarea
              id="chamber-feedback-textarea"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Provide constructive feedback for the artist. Highlight what hit hard (mix punch, melody, cadence) and what could be sharpened..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Reward Multiplier Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-400">
              <Award className="w-4 h-4 text-amber-400" />
              <span>XP Calculation:</span>
              <span className="text-zinc-300">{rewardPreview.breakdown}</span>
            </div>
            <div className="text-amber-400 font-bold">
              +{rewardPreview.xp} Judge XP on Submit
            </div>
          </div>

          {/* Final Submit Gavel Button */}
          <div className="pt-2">
            <button
              id="chamber-submit-verdict-btn"
              onClick={handleSubmitVerdict}
              disabled={!is50PercentMet || isSubmitting}
              type="button"
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition shadow-xl ${
                is50PercentMet
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 shadow-amber-500/25 active:scale-[0.99] cursor-pointer'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Gavel className={`w-5 h-5 ${is50PercentMet ? 'text-amber-950' : 'text-zinc-600'}`} />
              <span>
                {isSubmitting
                  ? 'Striking the Gavel...'
                  : is50PercentMet
                  ? `Submit Unanimous Verdict (+${rewardPreview.xp} XP)`
                  : `Listen to at least 50% to Unlock Gavel (${Math.round(listenRatio * 100)}% / 50%)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
