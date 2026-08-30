import { visibleTrack } from './judgementPrivacy';
import {
  reserveStorage,
  finishStorage,
  awardReviewCoins,
  keyFor,
  awardProfileCoins,
  withWallet,
} from "./economy";
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
    await awardProfileCoins(res.locals.identity.uid).catch(() => {});
    res.json(result);
  } catch {
    res.status(400).json({
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
    res.status(409).json({
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
      snapshot.docs.map((d) => visibleTrack(d.data() as ArtistTrack, res.locals.identity.uid)),
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
    await accountLegacyUploads(data.ownerId);
    await reserveStorage(data.ownerId, data.id, audio.bytes.length);
    await bucket()
      .file(path)
      .save(audio.bytes, { resumable: false, contentType: audio.mimeType });
    data.audioPath = path;
    data.audioBytes = audio.bytes.length;
    const visible = visibleTrack(data, data.ownerId);
    await db().runTransaction(async (t) => {
      const ref = profiles().doc(data.ownerId);
      const doc = await t.get(ref);
      const storageRef = db().doc(
        `storageReservations/${keyFor(data.ownerId, data.id)}`,
      );
      const storage = await t.get(storageRef);
      const walletRef = db().doc(`wallets/${data.ownerId}`);
      const wallet = await t.get(walletRef);
      if (storage.data()?.status !== "reserved" || !wallet.exists)
        throw new Error("Upload reservation missing.");
      const p = doc.exists
        ? (doc.data() as UserJudgeProfile)
        : freshJudge(data.ownerId);
      if (!p.termsAccepted) throw new Error("Accept terms first.");
      if (p.submittedTrackIds.length >= 1000)
        throw new Error("Track limit reached.");
      t.update(walletRef, {
        storageReserved: wallet.data()!.storageReserved - audio.bytes.length,
        storageBytes: wallet.data()!.storageBytes + audio.bytes.length,
      });
      t.update(storageRef, { status: "stored", updatedAt: Date.now() });
      t.create(tracks().doc(data.id), data);
      t.set(ref, {
        ...p,
        submittedTrackIds: [data.id, ...p.submittedTrackIds],
      });
    });

    res.status(201).json(visible);
  } catch {
    try {
      const saved = await tracks().doc(data.id).get();
      if (!saved.exists) {
        await bucket().file(path).delete({ ignoreNotFound: true });
        await finishStorage(data.ownerId, data.id, false);
      }
    } catch {
      /* Retain reservation until recovery can verify storage. */
    }
    res.status(503).json({
      error: "Upload was not confirmed. Check your dossier before retrying.",
    });
  }
});
// Never expose bucket object names (legacy paths contain owner UIDs).
judgementRouter.get("/tracks/:id/audio", async (req, res) => {
  try {
    const doc = await tracks().doc(safeId(req.params.id)).get();
    if (!doc.exists || !doc.data()?.audioPath) { res.sendStatus(404); return; }
    const file = bucket().file(doc.data()!.audioPath);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size);
    if (!Number.isSafeInteger(size) || size <= 0 || size > 15 * 1024 * 1024) throw new Error('Invalid audio size.');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', /^audio\/(mpeg|mp3|wav|x-wav|ogg|webm|mp4|aac|flac)$/.test(metadata.contentType || '') ? metadata.contentType! : 'application/octet-stream');
    res.setHeader('Content-Length', size);
    const stream = file.createReadStream();
    res.on('close', () => stream.destroy());
    stream.on('error', () => { if (!res.headersSent) res.sendStatus(503); else res.destroy(); });
    stream.pipe(res);
  } catch { if (!res.headersSent) res.status(503).json({ error: 'Audio unavailable.' }); }
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
    await awardReviewCoins(uid).catch(() => {});
    res.status(201).json({ ...result, track: visibleTrack(result.track, uid) });
  } catch (e: any) {
    res.status(409).json({
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

// Interrupted uploads retain their quota reservation until the object can be checked/deleted.
export async function recoverUploads() {
  if (!process.env.FIREBASE_STORAGE_BUCKET) return;
  const pending = await db()
    .collection("storageReservations")
    .where("status", "in", ["reserved", "recovering"])
    .where("expiresAt", "<=", Date.now())
    .orderBy("expiresAt", "asc")
    .limit(50)
    .get();
  for (const doc of pending.docs) {
    const r = doc.data();
    if (!r.uploadId) continue;
    const claimed = await db().runTransaction(async (t) => {
      const current = await t.get(doc.ref);
      const track = await t.get(tracks().doc(r.uploadId));
      if (
        !["reserved", "recovering"].includes(current.data()!.status) ||
        track.exists
      )
        return false;
      t.update(doc.ref, { status: "recovering" });
      return true;
    });
    if (!claimed) continue;
    await bucket()
      .file(`judgement/${r.uid}/${r.uploadId}`)
      .delete({ ignoreNotFound: true });
    await withWallet(r.uid, async (w, t) => {
      const current = await t.get(doc.ref);
      if (current.data()?.status !== "recovering") return;
      w.storageReserved = Math.max(0, w.storageReserved - r.bytes);
      t.update(doc.ref, { status: "released", updatedAt: Date.now() });
    });
  }
}
judgementRouter.get("/my-uploads", async (_req, res) => {
  try {
    const docs = await tracks()
      .where("ownerId", "==", res.locals.identity.uid)
      .limit(1000)
      .get();
    res.json(
      docs.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        bytes: d.data().audioBytes || 0,
      })),
    );
  } catch {
    res.sendStatus(503);
  }
});
judgementRouter.delete("/tracks/:id", async (req, res) => {
  const uid = res.locals.identity.uid;
  try {
    const id = safeId(req.params.id),
      ref = tracks().doc(id),
      doc = await ref.get();
    if (!doc.exists) {
      res.json({ success: true });
      return;
    }
    if (doc.data()!.ownerId !== uid) {
      res.sendStatus(404);
      return;
    }
    await bucket().file(doc.data()!.audioPath).delete({ ignoreNotFound: true });
    await withWallet(uid, async (w, t) => {
      const current = await t.get(ref);
      const profileRef = profiles().doc(uid),
        profile = await t.get(profileRef);
      if (!current.exists) return;
      if (current.data()!.ownerId !== uid) throw new Error();
      w.storageBytes = Math.max(
        0,
        w.storageBytes - (current.data()!.audioBytes || 0),
      );
      t.delete(ref);
      if (profile.exists)
        t.update(profileRef, {
          submittedTrackIds: (profile.data()!.submittedTrackIds || []).filter(
            (x: string) => x !== id,
          ),
        });
    });
    res.json({ success: true });
  } catch {
    res
      .status(503)
      .json({
        error: "Deletion was not confirmed. Retry to finish releasing storage.",
      });
  }
});

async function accountLegacyUploads(uid: string) {
  const existing = await tracks().where("ownerId", "==", uid).get();
  for (const doc of existing.docs) {
    const track = doc.data();
    if (Number.isSafeInteger(track.audioBytes) && track.audioBytes >= 0)
      continue;
    if (!track.audioPath) continue;
    const [metadata] = await bucket().file(track.audioPath).getMetadata();
    const bytes = Number(metadata.size);
    if (!Number.isSafeInteger(bytes) || bytes < 0)
      throw new Error("Existing storage accounting is unavailable.");
    await withWallet(uid, async (w, t) => {
      const current = await t.get(doc.ref);
      if (!current.exists || Number.isSafeInteger(current.data()!.audioBytes))
        return;
      w.storageBytes += bytes;
      t.update(doc.ref, { audioBytes: bytes });
    });
  }
}
