import express from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { getAuth, type UserRecord } from "firebase-admin/auth";
import {
  getFirebaseAdminApp,
  requireAdmin,
  requireVerifiedEmail,
} from "./auth";
import { economyDb, keyFor, refreshWallet, withWallet } from "./economy";
import { sealPrivate, openPrivate } from "./dataProtection";
import {
  abuseHash,
  canonicalEmail,
  verifyReferralApp,
} from "./referralProtection";
import {
  COMMUNITY_ROLES,
  DAY_MS,
  EMPTY_COMMUNITY_PROFILE,
  REFERRAL_MILESTONES,
  REFERRAL_RULES,
  REFERRAL_RULES_VERSION,
  profileComplete,
  profileChecklist,
  referralActivityProgress,
  type CommunityProfile,
  type ReferralActivity,
} from "../shared/referrals";
import { MONTHLY_BC } from "../shared/economy";
import { textField, safeId } from "./media";

interface ReferralAccount {
  rulesVersion: string;
  uid: string;
  code: string;
  emailHash: string;
  createdAt: number;
  enrolledAt: number;
  devices: string[];
  sharedDevice: boolean;
  qualified: number;
  pending: number;
  points: number;
  coins: number;
  proDaysAvailable: number;
  badges: Record<string, number>;
  rewardDay: string;
  rewardsToday: number;
}
const accountRef = (uid: string) => economyDb().doc(`referralAccounts/${uid}`);
const readAccount = (uid: string, data: any): ReferralAccount => {
  const a = openPrivate<ReferralAccount>(
    data.private,
    `referral-account:${uid}`,
  );
  if (a.uid !== uid) throw new Error("Referral account integrity failed.");
  return a;
};
const accountData = (a: ReferralAccount) => ({
  private: sealPrivate(a, `referral-account:${a.uid}`),
});
const profileRef = (uid: string) => economyDb().doc(`communityProfiles/${uid}`);
const profileData = (uid: string, data: any): CommunityProfile =>
  data
    ? openPrivate(data.private, `community-profile:${uid}`)
    : { ...EMPTY_COMMUNITY_PROFILE };
export async function readCommunityProfile(uid: string) {
  return profileData(uid, (await profileRef(uid).get()).data());
}
export function validateCommunityProfile(body: any): CommunityProfile {
  if (!body || Array.isArray(body) || typeof body !== "object")
    throw new Error("Invalid profile.");
  const limits = {
    displayName: 80,
    handle: 24,
    role: 20,
    genre: 80,
    bio: 1000,
    goal: 300,
  };
  if (Object.keys(body).some((k) => !Object.hasOwn(limits, k)))
    throw new Error("Only profile fields may be updated.");
  const p = Object.fromEntries(
    Object.entries(limits).map(([k, max]) => [
      k,
      textField(body[k] ?? "", max, false),
    ]),
  ) as unknown as CommunityProfile;
  p.handle = p.handle.toLowerCase();
  if (p.handle && !/^[a-z0-9_]{3,24}$/.test(p.handle))
    throw new Error("Use 3–24 letters, digits or underscores for your handle.");
  if (!COMMUNITY_ROLES.includes(p.role as any))
    throw new Error("Choose a community role.");
  return p;
}
export async function saveCommunityProfile(uid: string, body: any) {
  const profile = validateCommunityProfile(body);
  // This profile is private. A referral code, not a claimed handle, identifies invitations.
  await profileRef(uid).set({
    private: sealPrivate(profile, `community-profile:${uid}`),
  });
  return profile;
}
async function verifiedUser(uid: string): Promise<UserRecord> {
  const user = await getAuth(getFirebaseAdminApp()).getUser(uid);
  if (
    user.disabled ||
    !user.emailVerified ||
    !user.email ||
    !user.providerData.length
  )
    throw new Error("A current verified account is required.");
  return user;
}
const createdAt = (u: UserRecord) => {
  const time = Date.parse(u.metadata.creationTime);
  if (!Number.isFinite(time) || time > Date.now())
    throw new Error("Account age could not be verified.");
  return time;
};
export async function enrollReferral(uid: string, deviceHash: string) {
  const user = await verifiedUser(uid),
    emailHash = abuseHash("email", canonicalEmail(user.email!)),
    now = Date.now();
  const proposedCode = randomBytes(12).toString("hex").toUpperCase();
  return economyDb().runTransaction(async (t) => {
    const ref = accountRef(uid),
      emailRef = economyDb().doc(`referralEmailClaims/${emailHash}`),
      deviceRef = economyDb().doc(`referralDevices/${deviceHash}`);
    const [old, email, device, profile, code] = await Promise.all([
      t.get(ref),
      t.get(emailRef),
      t.get(deviceRef),
      t.get(profileRef(uid)),
      t.get(economyDb().doc(`referralCodes/${proposedCode}`)),
    ]);
    if (!profileComplete(profileData(uid, profile.data())))
      throw new Error("Complete your private community profile first.");
    if (email.exists && email.data()!.uid !== uid)
      throw new Error(
        "This reward identity is already registered. Contact support.",
      );
    const ownerHash = abuseHash("account", uid),
      owners: string[] = device.data()?.owners || [];
    const a: ReferralAccount = old.exists
      ? readAccount(uid, old.data())
      : {
          uid,
          rulesVersion: REFERRAL_RULES_VERSION,
          code: proposedCode,
          emailHash,
          createdAt: createdAt(user),
          enrolledAt: now,
          devices: [],
          sharedDevice: false,
          qualified: 0,
          pending: 0,
          points: 0,
          coins: 0,
          proDaysAvailable: 0,
          badges: {},
          rewardDay: "",
          rewardsToday: 0,
        };
    if (!old.exists && code.exists)
      throw new Error("Please retry creating your referral code.");
    if (!a.devices.includes(deviceHash) && a.devices.length >= 8)
      throw new Error("Too many referral devices. Contact support.");
    a.emailHash = emailHash;
    a.devices = [...new Set([...a.devices, deviceHash])];
    a.sharedDevice = a.sharedDevice || owners.some((x) => x !== ownerHash);
    t.set(emailRef, { uid });
    t.set(deviceRef, {
      owners: [...new Set([...owners, ownerHash])].slice(0, 16),
    });
    if (!old.exists)
      t.create(economyDb().doc(`referralCodes/${a.code}`), {
        uid,
        createdAt: now,
      });
    t.set(ref, accountData(a));
    return { code: a.code };
  });
}
export async function claimReferral(uid: string, input: string) {
  const code = typeof input === "string" ? input.trim().toUpperCase() : "";
  if (!/^[A-F0-9]{24}$/.test(code))
    throw new Error("Enter a valid referral code.");
  const user = await verifiedUser(uid),
    birth = createdAt(user),
    now = Date.now();
  return economyDb().runTransaction(async (t) => {
    const ref = economyDb().doc(`referralClaims/${uid}`),
      codeRef = economyDb().doc(`referralCodes/${code}`);
    const [previous, invitation, memberDoc] = await Promise.all([
      t.get(ref),
      t.get(codeRef),
      t.get(accountRef(uid)),
    ]);
    if (previous.exists) {
      if (previous.data()!.code !== code)
        throw new Error(
          "A referral is already attached to this account and cannot be changed.",
        );
      return { status: previous.data()!.status };
    }
    if (now - birth > REFERRAL_RULES.claimWindowDays * DAY_MS)
      throw new Error(
        "Referral codes must be attached within seven days of account creation.",
      );
    if (
      !invitation.exists ||
      invitation.data()!.uid === uid ||
      !memberDoc.exists
    )
      throw new Error("This referral cannot be attached.");
    const parent = invitation.data()!.uid;
    const parentDoc = await t.get(accountRef(parent));
    if (!parentDoc.exists || invitation.data()!.createdAt > birth)
      throw new Error(
        "Use an invitation created before this new account was registered.",
      );
    const member = readAccount(uid, memberDoc.data()),
      inviter = readAccount(parent, parentDoc.data());
    if (inviter.createdAt >= birth || member.emailHash === inviter.emailHash)
      throw new Error("Self-referrals and referral loops are not eligible.");
    if (
      inviter.qualified >= REFERRAL_RULES.maxQualified ||
      inviter.pending >= 50
    )
      throw new Error("This invitation has reached its reward limit.");
    const shared =
      member.sharedDevice ||
      member.devices.some((d) => inviter.devices.includes(d));
    t.create(ref, {
      uid,
      referrer: parent,
      code,
      claimedAt: now,
      status: "pending",
      reviewRequested: false,
      private: sealPrivate(
        { emailHash: member.emailHash, sharedDevice: shared },
        `referral-claim:${uid}`,
      ),
      rulesVersion: REFERRAL_RULES_VERSION,
    });
    inviter.pending++;
    t.set(accountRef(parent), accountData(inviter));
    return { status: "pending" };
  });
}
export async function referralStatus(uid: string) {
  const user = await verifiedUser(uid);
  const [profile, account, claim, activity] = await Promise.all([
    readCommunityProfile(uid),
    accountRef(uid).get(),
    economyDb().doc(`referralClaims/${uid}`).get(),
    economyDb().doc(`referralActivity/${uid}`).get(),
  ]);
  const a = account.exists ? readAccount(uid, account.data()) : null;
  const evidence = activity.exists
    ? openPrivate<ReferralActivity>(
        activity.data()!.private,
        `referral-activity:${uid}`,
      )
    : undefined;
  return {
    enabled: process.env.REFERRALS_ENABLED === "true",
    automaticRewards: process.env.REFERRALS_AUTOMATIC_REWARDS === "true",
    rulesVersion: REFERRAL_RULES_VERSION,
    profile,
    checklist: profileChecklist(profile),
    code: a?.code || null,
    qualified: a?.qualified || 0,
    pending: a?.pending || 0,
    points: a?.points || 0,
    coins: a?.coins || 0,
    badges: a?.badges || {},
    proDaysAvailable: a?.proDaysAvailable || 0,
    claim: claim.exists
      ? { status: claim.data()!.status, claimedAt: claim.data()!.claimedAt }
      : null,
    progress: referralActivityProgress(evidence, createdAt(user), profile),
  };
}

// A single Firestore transaction awards both accounts and the milestone ledger.
// No client-supplied balances, activity counts, ages or reward amounts are accepted.
export async function qualifyReferral(
  uid: string,
  approval?: { actor: string; reason: string },
) {
  const db = economyDb(),
    claimRef = db.doc(`referralClaims/${uid}`),
    initial = await claimRef.get();
  if (!initial.exists) throw new Error("Attach a referral first.");
  const parent = initial.data()!.referrer;
  const [memberUser, parentUser] = await Promise.all([
    verifiedUser(uid),
    verifiedUser(parent),
  ]);
  const now = Date.now(),
    day = new Date(now).toISOString().slice(0, 10);
  return db.runTransaction(async (t) => {
    const [
      claim,
      memberDoc,
      parentDoc,
      profile,
      parentProfile,
      activity,
      memberWallet,
      parentWallet,
      memberSubs,
      parentSubs,
      memberBlock,
      parentBlock,
      budget,
    ] = await Promise.all([
      t.get(claimRef),
      t.get(accountRef(uid)),
      t.get(accountRef(parent)),
      t.get(profileRef(uid)),
      t.get(profileRef(parent)),
      t.get(db.doc(`referralActivity/${uid}`)),
      t.get(db.doc(`wallets/${uid}`)),
      t.get(db.doc(`wallets/${parent}`)),
      t.get(db.collection("billingSubscriptions").where("uid", "==", uid)),
      t.get(db.collection("billingSubscriptions").where("uid", "==", parent)),
      t.get(db.doc(`securityBlocks/${uid}`)),
      t.get(db.doc(`securityBlocks/${parent}`)),
      t.get(db.doc(`referralDailyBudget/${day}`)),
    ]);
    const c = claim.data()!;
    if (c.referrer !== parent)
      throw new Error("Referral integrity check failed.");
    if (["qualified", "rejected", "capped"].includes(c.status))
      return { status: c.status };
    if (!memberDoc.exists || !parentDoc.exists)
      throw new Error("Referral account unavailable.");
    const member = readAccount(uid, memberDoc.data()),
      inviter = readAccount(parent, parentDoc.data());
    const evidence = activity.exists
      ? openPrivate<ReferralActivity>(
          activity.data()!.private,
          `referral-activity:${uid}`,
        )
      : undefined;
    const progress = referralActivityProgress(
      evidence,
      createdAt(memberUser),
      profileData(uid, profile.data()),
      now,
    );
    if (!progress.ready) return { status: "pending", progress };
    if (
      !profileComplete(profileData(parent, parentProfile.data())) ||
      createdAt(parentUser) > now - 2 * DAY_MS
    )
      throw new Error(
        "The inviter must finish their profile and account waiting period.",
      );
    if (
      Number(memberBlock.data()?.until) > now ||
      Number(parentBlock.data()?.until) > now
    )
      throw new Error("A restricted account cannot receive referral rewards.");
    const email = abuseHash("email", canonicalEmail(memberUser.email!)),
      parentEmail = abuseHash("email", canonicalEmail(parentUser.email!));
    if (email === parentEmail)
      throw new Error("Self-referrals are not eligible.");
    const details = openPrivate(c.private, `referral-claim:${uid}`);
    const risk =
      details.sharedDevice ||
      member.sharedDevice ||
      member.devices.some((d) => inviter.devices.includes(d)) ||
      email !== member.emailHash ||
      parentEmail !== inviter.emailHash ||
      details.emailHash !== email;
    if (
      !approval &&
      (risk || process.env.REFERRALS_AUTOMATIC_REWARDS !== "true")
    ) {
      t.update(claimRef, { status: "awaiting_review", reviewRequested: true });
      return { status: "awaiting_review" };
    }
    if (inviter.qualified >= REFERRAL_RULES.maxQualified) {
      inviter.pending = Math.max(0, inviter.pending - 1);
      t.set(accountRef(parent), accountData(inviter));
      t.update(claimRef, { status: "capped", reviewRequested: false });
      return { status: "capped" };
    }
    const used = inviter.rewardDay === day ? inviter.rewardsToday : 0;
    if (
      used >= REFERRAL_RULES.maxRewardsPerInviterPerDay ||
      Number(budget.data()?.count || 0) >=
        REFERRAL_RULES.maxRewardsPerProgramPerDay
    )
      return { status: "daily_limit", retryAt: Date.parse(day) + DAY_MS };
    const milestone = REFERRAL_MILESTONES[inviter.qualified],
      ledger = db.doc(
        `referralRewards/${keyFor(parent, String(milestone.count))}`,
      );
    if ((await t.get(ledger)).exists)
      throw new Error("Reward ledger conflict; contact support.");
    const paid = (subs: any) =>
      subs.docs.some(
        (d: any) =>
          d.data().status === "active" &&
          d
            .data()
            .items?.some(
              (i: any) =>
                i.priceId === process.env.STRIPE_PRICE_ID_PRO &&
                i.expiresAt > now,
            ),
      );
    const mw = refreshWallet(memberWallet.data(), paid(memberSubs)),
      pw = refreshWallet(parentWallet.data(), paid(parentSubs));
    mw.purchased += REFERRAL_RULES.newMemberCoins;
    pw.purchased += milestone.coins;
    member.coins += REFERRAL_RULES.newMemberCoins;
    member.badges["Welcome to the Brotherhood"] = now;
    inviter.qualified++;
    inviter.pending = Math.max(0, inviter.pending - 1);
    inviter.points += milestone.points;
    inviter.coins += milestone.coins;
    inviter.proDaysAvailable += milestone.proDays;
    inviter.rewardDay = day;
    inviter.rewardsToday = used + 1;
    if (milestone.badge) inviter.badges[milestone.badge] = now;
    t.set(db.doc(`wallets/${uid}`), mw);
    t.set(db.doc(`wallets/${parent}`), pw);
    t.set(accountRef(uid), accountData(member));
    t.set(accountRef(parent), accountData(inviter));
    t.set(db.doc(`referralDailyBudget/${day}`), {
      count: Number(budget.data()?.count || 0) + 1,
    });
    t.create(ledger, {
      createdAt: now,
      private: sealPrivate(
        {
          uid,
          parent,
          milestone,
          rulesVersion: REFERRAL_RULES_VERSION,
          approvedBy: approval?.actor || "automatic",
          reason: approval?.reason || "verified activity",
        },
        `referral-reward:${ledger.id}`,
      ),
    });
    t.update(claimRef, {
      status: "qualified",
      qualifiedAt: now,
      reviewRequested: false,
    });
    return { status: "qualified", coins: REFERRAL_RULES.newMemberCoins };
  });
}
export async function activateReferralPro(uid: string) {
  return withWallet(uid, async (w, t, pro, hasOpenSubscription) => {
    const ref = accountRef(uid),
      doc = await t.get(ref);
    const lock = await t.get(
      economyDb().doc(`subscriptionCheckoutLocks/${uid}`),
    );
    const pending = lock.exists
      ? await t.get(economyDb().doc(`paymentOrders/${lock.data()!.orderId}`))
      : null;
    if (
      hasOpenSubscription ||
      pro ||
      (pending?.exists &&
        ["initialized", "processing", "paid_pending_delivery"].includes(
          pending.data()!.status,
        ))
    )
      throw new Error(
        "Keep your earned time until your existing Pro access and any checkout have ended. No subscription was changed.",
      );
    if (!doc.exists) throw new Error("No earned Pro time available.");
    const a = readAccount(uid, doc.data()),
      days = a.proDaysAvailable;
    if (!Number.isSafeInteger(days) || days <= 0 || days > 51)
      throw new Error("No earned Pro time available.");
    const bonus = Math.floor(((MONTHLY_BC.pro - MONTHLY_BC.free) * days) / 30),
      id = randomUUID();
    w.promoProUntil = Date.now() + days * DAY_MS;
    w.purchased += bonus;
    a.proDaysAvailable = 0;
    t.set(ref, accountData(a));
    t.create(economyDb().doc(`referralProActivations/${id}`), {
      uid,
      days,
      coins: bonus,
      createdAt: Date.now(),
      expiresAt: w.promoProUntil,
    });
    return {
      days,
      coins: bonus,
      expiresAt: w.promoProUntil,
      message: `${days} days of Pro activated with ${bonus} additional Coins. No card, subscription or automatic renewal.`,
    };
  });
}

export const communityRouter = express.Router();
communityRouter.use(requireVerifiedEmail);
communityRouter.get("/profile", async (_req, res) => {
  try {
    const p = await readCommunityProfile(res.locals.identity.uid);
    res.json({ profile: p, checklist: profileChecklist(p) });
  } catch {
    res.status(503).json({ error: "Private profile unavailable." });
  }
});
communityRouter.put("/profile", async (req, res) => {
  try {
    const p = await saveCommunityProfile(res.locals.identity.uid, req.body);
    res.json({ profile: p, checklist: profileChecklist(p) });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});
export const referralsRouter = express.Router();
const requireEnrollment: express.RequestHandler = async (_req, res, next) => {
  try {
    const uid = res.locals.identity.uid,
      doc = await accountRef(uid).get();
    if (
      !doc.exists ||
      readAccount(uid, doc.data()).rulesVersion !== REFERRAL_RULES_VERSION
    )
      throw new Error("Not enrolled");
    next();
  } catch {
    res
      .status(428)
      .json({ error: "Accept the referral rules and enroll first." });
  }
};
referralsRouter.use(requireVerifiedEmail);
referralsRouter.get("/status", async (_req, res) => {
  try {
    res.json(await referralStatus(res.locals.identity.uid));
  } catch {
    res.status(503).json({ error: "Referral status unavailable." });
  }
});
referralsRouter.use("/admin", requireAdmin);
referralsRouter.get("/admin/reviews", async (_req, res) => {
  try {
    const docs = await economyDb()
      .collection("referralClaims")
      .where("reviewRequested", "==", true)
      .limit(50)
      .get();
    res.json({
      reviews: docs.docs.map((d) => ({
        uid: d.id,
        referrer: d.data().referrer,
        claimedAt: d.data().claimedAt,
        status: d.data().status,
      })),
    });
  } catch {
    res.status(503).json({ error: "Review queue unavailable." });
  }
});
referralsRouter.post("/admin/:uid/review", async (req, res) => {
  try {
    if (process.env.REFERRALS_ENABLED !== "true")
      throw new Error("Referral rewards are paused.");
    const uid = safeId(req.params.uid),
      reason = textField(req.body?.reason, 300);
    if (reason.length < 10)
      throw new Error("Record a review reason of at least ten characters.");
    if (req.body?.decision === "approve")
      res.json(
        await qualifyReferral(uid, { actor: res.locals.identity.uid, reason }),
      );
    else if (req.body?.decision === "reject") {
      await economyDb().runTransaction(async (t) => {
        const ref = economyDb().doc(`referralClaims/${uid}`),
          doc = await t.get(ref);
        if (
          !doc.exists ||
          !["pending", "awaiting_review"].includes(doc.data()!.status)
        )
          throw new Error("No pending claim.");
        const parent = doc.data()!.referrer,
          parentDoc = await t.get(accountRef(parent));
        const a = readAccount(parent, parentDoc.data());
        a.pending = Math.max(0, a.pending - 1);
        t.set(accountRef(parent), accountData(a));
        t.update(ref, {
          status: "rejected",
          reviewRequested: false,
          review: sealPrivate(
            { actor: res.locals.identity.uid, reason, at: Date.now() },
            `referral-review:${uid}`,
          ),
        });
      });
      res.json({ status: "rejected" });
    } else throw new Error("Choose approve or reject.");
  } catch (e) {
    res.status(409).json({ error: (e as Error).message });
  }
});
referralsRouter.post("/enroll", verifyReferralApp, async (req, res) => {
  try {
    if (
      req.body?.rulesVersion !== REFERRAL_RULES_VERSION ||
      req.body?.accepted !== true
    )
      throw new Error(
        "Accept the referral rules and anti-abuse disclosure first.",
      );
    res.json(
      await enrollReferral(res.locals.identity.uid, res.locals.referralDevice),
    );
  } catch (e) {
    res.status(409).json({ error: (e as Error).message });
  }
});
referralsRouter.post(
  "/claim",
  requireEnrollment,
  verifyReferralApp,
  async (req, res) => {
    try {
      await enrollReferral(res.locals.identity.uid, res.locals.referralDevice);
      res.json(await claimReferral(res.locals.identity.uid, req.body?.code));
    } catch (e) {
      res.status(409).json({ error: (e as Error).message });
    }
  },
);
referralsRouter.post(
  "/qualify",
  requireEnrollment,
  verifyReferralApp,
  async (_req, res) => {
    try {
      await enrollReferral(res.locals.identity.uid, res.locals.referralDevice);
      res.json(await qualifyReferral(res.locals.identity.uid));
    } catch (e) {
      res.status(409).json({ error: (e as Error).message });
    }
  },
);
referralsRouter.post(
  "/activate-pro",
  requireEnrollment,
  verifyReferralApp,
  async (_req, res) => {
    try {
      res.json(await activateReferralPro(res.locals.identity.uid));
    } catch (e) {
      res.status(409).json({ error: (e as Error).message });
    }
  },
);
