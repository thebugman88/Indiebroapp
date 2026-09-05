import type { ArtistTrack, JudgeReview } from '../judgement-zone/src/types';
import { recalculateTrackScores } from '../judgement-zone/src/utils/matchmaker';

// Explicit response allowlist: never serialize a database record directly.
export function visibleTrack(data: ArtistTrack & { audioPath?: string }, uid: string): ArtistTrack {
  const owner = !!uid && data.ownerId === uid;
  const reviewed = !!uid && data.reviews.some(r => r.judgeId === uid);
  const revealed = owner || reviewed;
  const reviews: JudgeReview[] = revealed ? data.reviews.map(r => ({
    id: r.id, trackId: r.trackId, judgeId: r.judgeId === uid ? uid : '',
    judgeTier: r.judgeTier, judgeRankLevel: r.judgeRankLevel,
    scores: { lyrics: r.scores.lyrics, vocals: r.scores.vocals, instrumentation: r.scores.instrumentation, vibe: r.scores.vibe },
    overallScore: r.overallScore, writtenFeedback: r.writtenFeedback,
    listenPercentage: r.listenPercentage, completedFullListen: r.completedFullListen,
    verdict: r.verdict, xpEarned: r.xpEarned, createdAt: r.createdAt, driftMatchScore: r.driftMatchScore,
  })) : [];
  return {
    ...(owner ? { ownerId: uid } : {}),
    id: data.id, title: revealed ? data.title : '', artistName: revealed ? data.artistName : '',
    genre: data.genre, mood: data.mood, bpm: data.bpm, keySignature: data.keySignature,
    durationSeconds: data.durationSeconds, lyricsText: revealed ? data.lyricsText : '',
    coverArt: '', uploadedAt: data.uploadedAt, isUserSubmission: true,
    ownershipConfirmed: data.ownershipConfirmed, rightsHolderSignature: owner ? data.rightsHolderSignature : '',
    creationType: data.creationType || 'human-created',
    status: data.status, targetJudges: data.targetJudges, reviews,
    flagCounts: owner ? (data.flagCounts || { 'bad-quality': 0, 'wrong-ai-room': 0 }) : { 'bad-quality': 0, 'wrong-ai-room': 0 },
    ...(owner && data.returnedReason ? { returnedReason: data.returnedReason, returnedAt: data.returnedAt } : {}),
    aggregatedScores: revealed ? recalculateTrackScores(data.reviews) : { ...recalculateTrackScores([]), totalReviews: data.reviews.length },
    ...(data.audioPath ? { audioBlobUrl: `/api/judgement/tracks/${encodeURIComponent(data.id)}/audio` } : {}),
  };
}
