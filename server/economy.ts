import { sealPrivate, openPrivate } from './dataProtection';
import { decodeJudgeProfile } from './profileProtection';
import {advanceReferralActivity, REFERRAL_TOOL_PATHS, type ReferralActivity} from '../shared/referrals';
import { createHash, randomUUID } from "node:crypto";
import { getFirestore, FieldValue, type Transaction } from "firebase-admin/firestore";
import express from "express";
import { getFirebaseAdminApp, requireVerifiedEmail } from "./auth";
import {
  AI_ACTIONS,
  ECONOMY_VERSION,
  TERMS_VERSION,
  MONTHLY_BC,
  GB,
  STORAGE_GB,
  STORAGE_PACKS,
} from "../shared/economy";
export const economyDb = () => getFirestore(getFirebaseAdminApp());
export const keyFor = (...parts: string[]) =>
  createHash("sha256").update(JSON.stringify(parts)).digest("hex");
export interface Wallet {
  month: string;
  monthly: number;
  allowance: number;
  purchased: number;
  earned: number;
  storageBytes: number;
  storageReserved: number;
  extraStorageBytes: number;
  daily: Record<string, number>;
  day: string;
  promoProUntil: number;
}
export function refreshWallet(
  old: Partial<Wallet> | undefined,
  pro: boolean,
  now = new Date(Date.now()),
): Wallet {
  const month = now.toISOString().slice(0, 7),
    day = now.toISOString().slice(0, 10),
    allowance = MONTHLY_BC[pro ? "pro" : "free"];
  const w: Wallet = {
    month,
    monthly: allowance,
    allowance,
    purchased: 0,
    earned: 0,
    storageBytes: 0,
    storageReserved: 0,
    extraStorageBytes: 0,
    day,
    daily: {},
    promoProUntil: 0,
    ...old,
  };
  if (w.month !== month) {
    w.month = month;
    w.monthly = allowance;
    w.allowance = allowance;
    w.earned = 0;
  } else if (allowance > w.allowance) {
    w.monthly += allowance - w.allowance;
    w.allowance = allowance;
  }
  if (w.day !== day) {
    w.day = day;
    w.daily = {};
  }
  return w;
}
export function spend(w: Wallet, cost: number) {
  if (!Number.isSafeInteger(cost) || cost < 0)
    throw new Error("Invalid Coin amount.");
  if (w.monthly + w.purchased < cost)
    throw new Error("Insufficient Brotherhood Coins.");
  const monthly = Math.min(w.monthly, cost),
    purchased = cost - monthly;
  w.monthly -= monthly;
  w.purchased -= purchased;
  return { monthly, purchased, month: w.month };
}
export async function withWallet<T>(
  uid: string,
  fn: (w: Wallet, t: Transaction, pro: boolean, hasOpenSubscription: boolean, paidPro: boolean, paidUntil:number) => Promise<T>,
): Promise<T> {
  const db = economyDb();
  return db.runTransaction(async (t) => {
    const ref = db.doc(`wallets/${uid}`);
    const [wallet, subs] = await Promise.all([
      t.get(ref),
      t.get(db.collection("billingSubscriptions").where("uid", "==", uid)),
    ]);
    const paidPro = subs.docs.some((d) => {
      const s = d.data();
      return (
        s.status === "active" &&
        s.items?.some(
          (i: any) =>
            i.priceId === process.env.STRIPE_PRICE_ID_PRO &&
            i.expiresAt > Date.now(),
        )
      );
    });
    const paidUntil=Math.max(0,...subs.docs.flatMap(d=>d.data().status==='active'?(d.data().items||[]).filter((i:any)=>i.priceId===process.env.STRIPE_PRICE_ID_PRO&&Number.isFinite(i.expiresAt)).map((i:any)=>i.expiresAt):[]));
    // Promotional time has its own one-time prorated Coin grant. It must not
    // unlock another full monthly refill each time a short reward is activated.
    const w = refreshWallet(wallet.data(), paidPro);
    const pro=paidPro||w.promoProUntil>Date.now();
    const hasOpenSubscription = subs.docs.some(d => !["canceled", "incomplete_expired"].includes(d.data().status));
    const result = await fn(w, t, pro, hasOpenSubscription, paidPro, paidUntil);
    t.set(ref, w);
    return result;
  });
}
export const walletSnapshot = (uid: string) =>
  withWallet(uid, async (w, _t, pro, _hasOpenSubscription, paidPro, paidUntil) => ({
    ...w,
    total: w.monthly + w.purchased,
    tier: pro ? "pro" : "free",
    proSource:paidPro?'subscription':pro?'referral':null,
    proExpiresAt:pro?Math.max(w.promoProUntil,paidUntil):null,
    storageLimitBytes:
      STORAGE_GB[pro ? "pro" : "free"] * GB + w.extraStorageBytes,
    economyVersion: ECONOMY_VERSION,
    termsVersion: TERMS_VERSION,
  }));
export async function reserveUsage(
  uid: string,
  requestId: string,
  path: string,
  inputHash = "",
  unlimited = false,
) {
  const action = AI_ACTIONS[path];
  if (!action) throw new Error("Unknown action.");
  const id = keyFor(uid, requestId);
  return withWallet(uid, async (w, t) => {
    const ref = economyDb().doc(`usageJobs/${id}`),
      existing = await t.get(ref);
    if (existing.exists) {
      const data = existing.data()!;
      if (data.path !== path || data.inputHash !== inputHash)
        throw new Error("Request ID was used for another action.");
      return { id, ...data, replayed: true } as any;
    }
    const count = w.daily[path] || 0;
    if (!unlimited && action.daily && count >= action.daily)
      throw new Error("Daily free AI allowance reached. Try tomorrow (UTC).");
    const debit = unlimited
      ? { monthly: 0, purchased: 0, month: w.month }
      : spend(w, action.cost);
    if (!unlimited && action.daily) w.daily[path] = count + 1;
    const job = {
      uid,
      path,
      inputHash,
      day: w.day,
      cost: unlimited ? 0 : action.cost,
      listedCost: action.cost,
      unlimited,
      debit,
      status: "reserved",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    t.create(ref, job);
    return { id, ...job, replayed: false };
  });
}
export async function settleUsage(
  id: string,
  uid: string,
  success: boolean,
  response?: any,
) {
  return withWallet(uid, async (w, t) => {
    const ref = economyDb().doc(`usageJobs/${id}`),
      doc = await t.get(ref);
    if (!doc.exists || doc.data()!.uid !== uid)
      throw new Error("Job not found.");
    const j = doc.data()!;
    if (j.status !== "reserved") return j;
    if (success && Buffer.byteLength(JSON.stringify(response)) > 600000)
      throw new Error("Result too large to persist safely.");
    let activityWrite:{ref:any;value:any}|undefined;
    if(success&&process.env.REFERRALS_ENABLED==='true'&&REFERRAL_TOOL_PATHS[j.path]) {
      const claim=await t.get(economyDb().doc(`referralClaims/${uid}`));
      if(claim.exists&&['pending','awaiting_review'].includes(claim.data()!.status)&&j.createdAt>=claim.data()!.claimedAt) {
        const activityRef=economyDb().doc(`referralActivity/${uid}`),old=await t.get(activityRef);
        const previous=old.exists?openPrivate<ReferralActivity>(old.data()!.private,`referral-activity:${uid}`):undefined;
        activityWrite={ref:activityRef,value:{private:sealPrivate(advanceReferralActivity(previous,{...j,status:'delivered'},claim.data()!.claimedAt),`referral-activity:${uid}`)}};
      }
    }
    if (!success) {
      if (j.day === w.day && AI_ACTIONS[j.path]?.daily)
        w.daily[j.path] = Math.max(0, (w.daily[j.path] || 0) - 1);
      if (w.month === j.debit.month) w.monthly += j.debit.monthly;
      else w.purchased += j.debit.monthly;
      w.purchased += j.debit.purchased;
    }
    if (success && j.path === '/api/generate-lyrics') {
      const retentionRef=economyDb().doc(`lyricRetention/${uid}`);
      const retention=await t.get(retentionRef);
      const old:Array<{id:string;expiresAt:number}>=retention.data()?.entries||[];
      const keep=old.filter(x=>x.expiresAt>Date.now()&&x.id!==id).slice(-4);
      const removed=old.filter(x=>!keep.some(k=>k.id===x.id)&&x.id!==id);
      const previous=await Promise.all(removed.map(x=>t.get(economyDb().doc(`usageJobs/${x.id}`))));
      for(const previousDoc of previous) if(previousDoc.exists&&previousDoc.data()!.uid===uid) {
        t.update(previousDoc.ref,{encryptedResponse:FieldValue.delete(),response:FieldValue.delete(),responseExpiresAt:FieldValue.delete()});
      }
      t.set(retentionRef,{entries:[...keep,{id,expiresAt:Date.now()+86400000}]});
    }
    const result = {
      ...j,
      status: success ? "delivered" : "credited",
      updatedAt: Date.now(),
      ...(success ? { encryptedResponse: sealPrivate(response, `usage:${uid}:${id}`, Date.now() + 86400000), responseExpiresAt: new Date(Date.now() + 86400000) } : {}),
    };
    if(activityWrite)t.set(activityWrite.ref,activityWrite.value);
    t.set(ref, result);
    return result;
  });
}
export const usageMiddleware: express.RequestHandler = async (
  req,
  res,
  next,
) => {
  // Express routes are case-insensitive and accept a trailing slash. Apply the
  // same identity to pricing, quotas, and replay records for every route alias.
  const path = req.originalUrl.split("?")[0].replace(/\/+$/, "").toLowerCase(),
    action = AI_ACTIONS[path];
  if (req.method !== "POST" || !action) return next();
  if (res.locals.identity?.email_verified !== true) {
    res.status(403).json({ error: "Verify your email to use cloud AI." });
    return;
  }
  const unlimited = res.locals.identity?.admin === true;
  if (
    !unlimited &&
    action.cost > 0 &&
    (req.get("x-economy-version") !== ECONOMY_VERSION ||
      req.get("x-coin-consent") !== String(action.cost))
  ) {
    res.status(428).json({
      error: "Confirm the displayed Coin price before running this action.",
      action,
    });
    return;
  }
  const requestId = req.get("x-request-id");
  if (!requestId || !/^[A-Za-z0-9_-]{8,128}$/.test(requestId)) {
    res.status(400).json({ error: "A unique action request ID is required." });
    return;
  }
  const uid = res.locals.identity.uid;
  let job: any;
  try {
    job = await reserveUsage(
      uid,
      requestId,
      path,
      keyFor(JSON.stringify(req.body ?? null)),
      unlimited,
    );
  } catch (e: any) {
    res.status(409).json({ error: e.message });
    return;
  }
  if (job.replayed) {
    if (job.status === "delivered") {
      try { res.json(openPrivate(job.encryptedResponse, `usage:${uid}:${job.id}`)); }
      catch { res.status(410).json({ error: 'This saved result expired or is unavailable. Use your downloaded copy; a new generation is a separate action.' }); }
      return;
    }
    res.status(409).json({
      error:
        job.status === "reserved"
          ? "This action is still processing."
          : "This action failed and its Coins were restored. Start a new request.",
      jobId: job.id,
    });
    return;
  }
  const original = res.json.bind(res);
  res.json = ((body: any) => {
    const status = res.statusCode;
    void (async () => {
      const success =
        status >= 200 &&
        status < 300 &&
        !body?.error &&
        body?.success !== false &&
        body?.source !== "template" &&
        body?.isAiGenerated !== false;
      try {
        const final = await settleUsage(job.id, uid, success, body);
        if (success && final.status !== "delivered") {
          res.status(503);
          original({
            error: "The request expired and its Coins were restored.",
          });
          return;
        }
        original(body);
      } catch {
        res.status(503);
        original({
          error:
            "Delivery could not be recorded. The monitor will reconcile the reservation.",
          jobId: job.id,
        });
      }
    })();
    return res;
  }) as any;
  next();
};
export async function recoverExpiredUsage() {
  const now = Date.now();
  const docs = await economyDb()
    .collection("usageJobs")
    .where("status", "==", "reserved")
    .where("expiresAt", "<=", now)
    .orderBy("expiresAt", "asc")
    .limit(100)
    .get();
  for (const doc of docs.docs)
    if (doc.data().expiresAt < now)
      await settleUsage(doc.id, doc.data().uid, false);
}
export async function reserveStorage(uid: string, id: string, bytes: number) {
  if (!Number.isSafeInteger(bytes) || bytes <= 0)
    throw new Error("Invalid upload size.");
  return withWallet(uid, async (w, t, pro) => {
    const ref = economyDb().doc(`storageReservations/${keyFor(uid, id)}`),
      old = await t.get(ref);
    if (old.exists) throw new Error("Upload already registered.");
    if (
      w.storageBytes + w.storageReserved + bytes >
      STORAGE_GB[pro ? "pro" : "free"] * GB + w.extraStorageBytes
    )
      throw new Error(
        "Storage quota exceeded. Existing files are retained; free space or add capacity.",
      );
    w.storageReserved += bytes;
    t.create(ref, {
      uid,
      uploadId: id,
      bytes,
      status: "reserved",
      expiresAt: Date.now() + 3600000,
      createdAt: Date.now(),
    });
  });
}
export async function finishStorage(uid: string, id: string, success: boolean) {
  return withWallet(uid, async (w, t) => {
    const ref = economyDb().doc(`storageReservations/${keyFor(uid, id)}`),
      doc = await t.get(ref);
    if (!doc.exists || doc.data()!.status !== "reserved") return;
    const bytes = doc.data()!.bytes;
    w.storageReserved -= bytes;
    if (success) w.storageBytes += bytes;
    t.update(ref, {
      status: success ? "stored" : "released",
      updatedAt: Date.now(),
    });
  });
}
export async function awardReviewCoins(uid: string) {
  return withWallet(uid, async (w, t) => {
    const profile = await t.get(economyDb().doc(`judgeProfilesV2/${uid}`));
    const count = profile.exists ? decodeJudgeProfile(uid, profile.data()).auditsCompletedTotal : 0;
    const milestone = Math.floor(count / 5);
    if (milestone < 1) return 0;
    const ref = economyDb().doc(
      `coinRewards/${keyFor(uid, "reviews", String(milestone))}`,
    );
    if ((await t.get(ref)).exists || w.earned >= 50) return 0;
    const amount = Math.min(5, 50 - w.earned);
    w.monthly += amount;
    w.earned += amount;
    t.create(ref, {
      uid,
      reason: "five validated reviews",
      amount,
      month: w.month,
      createdAt: Date.now(),
    });
    return amount;
  });
}
export const economyRouter = express.Router();
economyRouter.use(requireVerifiedEmail);
economyRouter.get("/wallet", async (_req, res) => {
  try {
    res.json(await walletSnapshot(res.locals.identity.uid));
  } catch {
    res
      .status(503)
      .json({ error: "Wallet unavailable. No local balance is trusted." });
  }
});
economyRouter.get("/history", async (_req, res) => {
  try {
    const uid = res.locals.identity.uid;
    const jobs = await economyDb()
      .collection("usageJobs")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    res.json(
      jobs.docs.map((d) => {
        const { response, encryptedResponse, ...j } = d.data();
        return { id: d.id, ...j };
      }),
    );
  } catch {
    res.status(503).json({ error: "History unavailable." });
  }
});
economyRouter.post("/storage", async (req, res) => {
  const uid = res.locals.identity.uid;
  const pack = STORAGE_PACKS[req.body?.pack as keyof typeof STORAGE_PACKS],
    requestId = req.body?.requestId;
  if (
    !pack ||
    typeof requestId !== "string" ||
    !/^[A-Za-z0-9_-]{8,128}$/.test(requestId) ||
    req.body?.termsVersion !== TERMS_VERSION ||
    req.body?.confirmed !== true
  ) {
    res
      .status(400)
      .json({ error: "Confirm a valid storage purchase and current terms." });
    return;
  }
  try {
    const result = await withWallet(uid, async (w, t) => {
      const ref = economyDb().doc(`storagePurchases/${keyFor(uid, requestId)}`),
        old = await t.get(ref);
      if (old.exists) {
        if (old.data()!.pack !== req.body.pack)
          throw new Error("Request ID conflict.");
        return old.data();
      }
      const debit = spend(w, pack.cost);
      w.extraStorageBytes += pack.gb * GB;
      const record = {
        uid,
        pack: req.body.pack,
        cost: pack.cost,
        gb: pack.gb,
        debit,
        termsVersion: TERMS_VERSION,
        createdAt: Date.now(),
        status: "delivered",
      };
      t.create(ref, record);
      return record;
    });
    res.json(result);
  } catch (e: any) {
    res.status(409).json({ error: e.message });
  }
});

economyRouter.get("/jobs/:id", async (req, res) => {
  try {
    if (!/^[a-f0-9]{64}$/.test(req.params.id)) {
      res.sendStatus(400);
      return;
    }
    const doc = await economyDb().doc(`usageJobs/${req.params.id}`).get();
    if (!doc.exists || doc.data()!.uid !== res.locals.identity.uid) {
      res.sendStatus(404);
      return;
    }
    const {response: _legacy,encryptedResponse,...job}=doc.data()!;
    if(job.status==='delivered') {
      try {res.json({...job,response:openPrivate(encryptedResponse,`usage:${res.locals.identity.uid}:${req.params.id}`)});}
      catch {res.status(410).json({...job,error:'Saved output has expired or is unavailable. Accounting records remain.'});}
    } else res.json(job);
  } catch {
    res.sendStatus(503);
  }
});

export async function awardProfileCoins(uid: string) {
  return withWallet(uid, async (w, t) => {
    const storedProfile = (
      await t.get(economyDb().doc(`judgeProfilesV2/${uid}`))
    ).data();
    const profile=storedProfile?decodeJudgeProfile(uid,storedProfile):undefined;
    const ref = economyDb().doc(`coinRewards/${keyFor(uid, "profile")}`);
    if (
      (await t.get(ref)).exists ||
      !profile?.termsAccepted ||
      !profile.name ||
      profile.name === "New Judge" ||
      !profile.tasteProfile?.preferredGenres?.length ||
      w.earned >= 50
    )
      return 0;
    const amount = Math.min(5, 50 - w.earned);
    w.monthly += amount;
    w.earned += amount;
    t.create(ref, {
      uid,
      reason: "completed judge profile",
      amount,
      month: w.month,
      createdAt: Date.now(),
    });
    return amount;
  });
}

// Accounting/idempotency tombstones remain; private output bodies do not.
export async function purgeExpiredPrivateResults() {
  const docs=await economyDb().collection('usageJobs').where('responseExpiresAt','<=',new Date()).limit(100).get();
  if(docs.empty)return;
  const batch=economyDb().batch();
  for(const doc of docs.docs)batch.update(doc.ref,{encryptedResponse:FieldValue.delete(),response:FieldValue.delete(),responseExpiresAt:FieldValue.delete()});
  await batch.commit();
}
