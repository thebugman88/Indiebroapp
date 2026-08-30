import express from "express";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getFirebaseAdminApp, requireVerifiedEmail } from "./auth";
import { decodeAudioDataUrl, safeId, textField } from "./media";
import type {
  ArtistTrack,
  JudgeReview,
  UserJudgeProfile,
  ScoreBreakdown,
} from "../judgement-zone/src/types";
import {
  calculateTierFromXp,
  checkAndRefreshDailyCycle,
  recalculateTrackScores,
} from "../judgement-zone/src/utils/matchmaker";

export function freshJudge(uid: string): UserJudgeProfile {
  return {
    id: uid,
    name: "New Judge",
    judgeTier: "Apprentice Ear",
    judgeTierLevel: 1,
    judgeXp: 0,
    reputationScore: 0,
    auditsCompletedTotal: 0,
    fullListensTotal: 0,
    skipsRemaining: 3,
    dailyAuditsRemaining: 20,
    dailyAuditsMax: 20,
    lastCycleTimestamp: Date.now(),
    tasteProfile: {
      preferredGenres: [],
      preferredMoods: [],
      productionFocus: [],
      tempoPreference: "all",
    },
    savedVaultTrackIds: [],
    submittedTrackIds: [],
    songsJudgedGoodCount: 0,
    termsAccepted: false,
  };
}
export function reviewMutation(
  track: ArtistTrack,
  profile: UserJudgeProfile,
  body: any,
  startedAt: number,
) {
  if (!track.ownerId || track.ownerId === profile.id)
    throw new Error("You cannot review this track.");
  if (
    track.status !== "evaluating" ||
    track.reviews.length >= 10 ||
    track.reviews.some((r) => r.judgeId === profile.id)
  )
    throw new Error("Review already submitted or track closed.");
  if (!profile.termsAccepted || profile.dailyAuditsRemaining <= 0)
    throw new Error("Accept the terms and check your daily quota.");
  if (
    !startedAt ||
    Date.now() - startedAt < Math.max(30, track.durationSeconds / 2) * 1000
  )
    throw new Error("Start listening and wait for the minimum review time.");
  const scores = {} as ScoreBreakdown;
  for (const field of [
    "lyrics",
    "vocals",
    "instrumentation",
    "vibe",
  ] as const) {
    const value = body.scores?.[field];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 1 ||
      value > 10
    )
      throw new Error("Scores must be between 1 and 10.");
    scores[field] = value;
  }
  const feedback = textField(body.writtenFeedback, 4000);
  if (feedback.length < 15)
    throw new Error("Add at least 15 characters of feedback.");
  const overall =
    Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 4) * 10) /
    10;
  const tier = calculateTierFromXp(profile.judgeXp);
  // Elapsed time is not proof of listening. Never award claimed full-listen bonuses.
  const review: JudgeReview = {
    id: randomUUID(),
    trackId: track.id,
    judgeId: profile.id,
    judgeTier: tier.tier,
    judgeRankLevel: tier.level,
    scores,
    overallScore: overall,
    writtenFeedback: feedback,
    listenPercentage: 0,
    completedFullListen: false,
    verdict:
      overall >= 8
        ? "Certified Heat"
        : overall >= 6
          ? "Solid Track"
          : overall >= 4
            ? "Needs Polish"
            : "Rethink/Rework",
    xpEarned: 50,
    createdAt: new Date().toISOString(),
    driftMatchScore: 0,
  };
  const reviews = [...track.reviews, review];
  const xp = profile.judgeXp + 50;
  const next = calculateTierFromXp(xp);
  return {
    review,
    track: {
      ...track,
      reviews,
      aggregatedScores: recalculateTrackScores(reviews),
      status: reviews.length >= 10 ? "completed" : "evaluating",
    } as ArtistTrack,
    profile: {
      ...profile,
      judgeXp: xp,
      judgeTier: next.tier,
      judgeTierLevel: next.level,
      auditsCompletedTotal: profile.auditsCompletedTotal + 1,
      dailyAuditsRemaining: profile.dailyAuditsRemaining - 1,
    },
  };
}
const db = () => getFirestore(getFirebaseAdminApp());
const profiles = () => db().collection("judgeProfilesV2");
const tracks = () => db().collection("judgeTracksV2");
function bucket() {
  if (!process.env.FIREBASE_STORAGE_BUCKET)
    throw new Error("Audio storage is not configured.");
  return getStorage(getFirebaseAdminApp()).bucket(
    process.env.FIREBASE_STORAGE_BUCKET,
  );
}
async function publicTrack(data: any): Promise<ArtistTrack> {
  const { audioPath, ...track } = data;
  if (audioPath) {
    const [url] = await bucket()
      .file(audioPath)
      .getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
    track.audioBlobUrl = url;
  }
  return track;
}
async function editProfile(
  uid: string,
  edit: (p: UserJudgeProfile) => UserJudgeProfile,
) {
  return db().runTransaction(async (t) => {
    const ref = profiles().doc(uid);
    const doc = await t.get(ref);
    const p = checkAndRefreshDailyCycle(
      doc.exists ? (doc.data() as UserJudgeProfile) : freshJudge(uid),
    );
    const result = edit(p);
    t.set(ref, result);
    return result;
  });
}
export const judgementRouter = express.Router();
judgementRouter.use(requireVerifiedEmail);
judgementRouter.get("/profile", async (_req, res) => {
  try {
    res.json(await editProfile(res.locals.identity.uid, (p) => p));
  } catch {
    res.status(503).json({ error: "Judge profile storage is unavailable." });
  }
});
judgementRouter.patch("/profile", async (req, res) => {
  try {
    const result = await editProfile(res.locals.identity.uid, (p) => {
      const b = req.body || {};
      const next = { ...p };
      if (b.name !== undefined) next.name = textField(b.name, 80);
      if (b.termsAccepted === true) {
        next.termsAccepted = true;
        next.termsAcceptedDate = new Date().toISOString();
      }
      if (b.savedVaultTrackIds !== undefined) {
        if (
          !Array.isArray(b.savedVaultTrackIds) ||
          b.savedVaultTrackIds.length > 50
        )
          throw new Error("Vault limit is 50 tracks.");
        next.savedVaultTrackIds = [
          ...new Set<string>(b.savedVaultTrackIds.map(safeId)),
        ];
      }
      if (b.tasteProfile) {
        const taste = b.tasteProfile;
        const strings = (v: any) => {
          if (!Array.isArray(v) || v.length > 20)
            throw new Error("Invalid preferences.");
          return v.map((x) => textField(x, 80));
        };
        if (!["slow", "mid", "fast", "all"].includes(taste.tempoPreference))
          throw new Error("Invalid tempo.");
        next.tasteProfile = {
          preferredGenres: strings(taste.preferredGenres),
          preferredMoods: strings(taste.preferredMoods),
          productionFocus: strings(taste.productionFocus),
          tempoPreference: taste.tempoPreference,
        } as any;
      }
      return next;
    });
    res.json(result);
  } catch {
    res
      .status(400)
      .json({
        error:
          "Profile changes were not saved. Check your preferences and connection.",
      });
  }
});
judgementRouter.post("/skip", async (_req, res) => {
  try {
    res.json(
      await editProfile(res.locals.identity.uid, (p) => {
        if (p.skipsRemaining <= 0) throw new Error("No skips remain.");
        return { ...p, skipsRemaining: p.skipsRemaining - 1 };
      }),
    );
  } catch {
    res
      .status(409)
      .json({
        error: "Skip was not confirmed. Check your quota and connection.",
      });
  }
});
judgementRouter.get("/tracks", async (_req, res) => {
  try {
    const snapshot = await tracks()
      .orderBy("uploadedAt", "desc")
      .limit(100)
      .get();
    res.json(
      await Promise.all(snapshot.docs.map((d) => publicTrack(d.data()))),
    );
  } catch {
    res.status(503).json({ error: "Tracks could not be loaded." });
  }
});
judgementRouter.post("/tracks", async (req, res) => {
  let data: any, audio: ReturnType<typeof decodeAudioDataUrl>;
  try {
    const b = req.body || {};
    audio = decodeAudioDataUrl(b.audioData);
    if (b.ownershipConfirmed !== true) throw new Error("Confirm ownership.");
    if (
      typeof b.durationSeconds !== "number" ||
      !Number.isFinite(b.durationSeconds) ||
      b.durationSeconds < 1 ||
      b.durationSeconds > 1200
    )
      throw new Error("Invalid audio duration.");
    data = {
      id: randomUUID(),
      ownerId: res.locals.identity.uid,
      title: textField(b.title, 200),
      artistName: textField(b.artistName, 100),
      genre: textField(b.genre, 80),
      mood: textField(b.mood, 100),
      lyricsText: textField(b.lyricsText, 20000),
      durationSeconds: b.durationSeconds,
      coverArt: "",
      uploadedAt: new Date().toISOString(),
      isUserSubmission: true,
      ownershipConfirmed: true,
      rightsHolderSignature: textField(b.rightsHolderSignature, 100),
      status: "evaluating",
      targetJudges: 10,
      reviews: [],
      aggregatedScores: recalculateTrackScores([]),
    };
    if (b.bpm !== undefined) {
      if (typeof b.bpm !== "number" || b.bpm < 30 || b.bpm > 300)
        throw new Error("Invalid BPM.");
      data.bpm = b.bpm;
    }
    if (b.keySignature) data.keySignature = textField(b.keySignature, 30);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
    return;
  }
  const path = `judgement/${data.ownerId}/${data.id}`;
  try {
    await bucket()
      .file(path)
      .save(audio.bytes, { resumable: false, contentType: audio.mimeType });
    data.audioPath = path;
    const visible = await publicTrack(data);
    await db().runTransaction(async (t) => {
      const ref = profiles().doc(data.ownerId);
      const doc = await t.get(ref);
      const p = doc.exists
        ? (doc.data() as UserJudgeProfile)
        : freshJudge(data.ownerId);
      if (!p.termsAccepted) throw new Error("Accept terms first.");
      if (p.submittedTrackIds.length >= 100)
        throw new Error("Track limit reached.");
      t.create(tracks().doc(data.id), data);
      t.set(ref, {
        ...p,
        submittedTrackIds: [data.id, ...p.submittedTrackIds],
      });
    });
    res.status(201).json(visible);
  } catch {
    res
      .status(503)
      .json({
        error: "Upload was not confirmed. Check your dossier before retrying.",
      });
  }
});
judgementRouter.post("/tracks/:id/listen", async (req, res) => {
  try {
    const id = safeId(req.params.id),
      uid = res.locals.identity.uid;
    await db().runTransaction(async (t) => {
      const track = await t.get(tracks().doc(id));
      if (!track.exists || track.data()!.ownerId === uid) throw new Error();
      const ref = tracks().doc(id).collection("listens").doc(uid);
      const old = await t.get(ref);
      if (!old.exists) t.create(ref, { startedAt: Date.now() });
    });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Listening session could not start." });
  }
});
judgementRouter.post("/tracks/:id/reviews", async (req, res) => {
  try {
    const id = safeId(req.params.id),
      uid = res.locals.identity.uid;
    const result = await db().runTransaction(async (t) => {
      const tr = tracks().doc(id),
        pr = profiles().doc(uid);
      const [track, profile, listen] = await Promise.all([
        t.get(tr),
        t.get(pr),
        t.get(tr.collection("listens").doc(uid)),
      ]);
      if (!track.exists) throw new Error("Track missing.");
      const result = reviewMutation(
        track.data() as ArtistTrack,
        checkAndRefreshDailyCycle(
          profile.exists
            ? (profile.data() as UserJudgeProfile)
            : freshJudge(uid),
        ),
        req.body,
        listen.data()?.startedAt,
      );
      t.set(tr, result.track);
      t.set(pr, result.profile);
      return result;
    });
    res.status(201).json({ ...result, track: await publicTrack(result.track) });
  } catch (e: any) {
    res
      .status(409)
      .json({
        error: [
          "You cannot review this track.",
          "Review already submitted or track closed.",
          "Accept the terms and check your daily quota.",
          "Start listening and wait for the minimum review time.",
          "Scores must be between 1 and 10.",
          "Add at least 15 characters of feedback.",
        ].includes(e.message)
          ? e.message
          : "Review was not confirmed. Reload before retrying.",
      });
  }
});
