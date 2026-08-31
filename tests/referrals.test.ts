import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { getAppCheck } from "firebase-admin/app-check";
import { Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp, createAuthMiddleware } from "../server/auth";
import {
  canonicalEmail,
  referralDevice,
  verifyReferralApp,
} from "../server/referralProtection";
import {
  validateCommunityProfile,
  referralsRouter,
  communityRouter,
} from "../server/referrals";
import {
  advanceReferralActivity,
  referralActivityProgress,
  REFERRAL_MILESTONES,
  DAY_MS,
} from "../shared/referrals";
process.env.FIREBASE_PROJECT_ID = "demo-indiebro-referral-unit";
process.env.REFERRAL_ABUSE_HMAC_KEY = Buffer.alloc(32, 82).toString("base64");
const profile = {
  displayName: "Indie Artist",
  handle: "indie_artist",
  role: "artist",
  genre: "Hip-Hop",
  bio: "Independent songwriter building a small audience.",
  goal: "Finish and release an original EP.",
};
test("referral milestones are capped and award the promised Pro durations once", () => {
  assert.equal(REFERRAL_MILESTONES.length, 10);
  assert.deepEqual(
    REFERRAL_MILESTONES.filter((m) => m.proDays).map((m) => [
      m.count,
      m.proDays,
    ]),
    [
      [3, 7],
      [5, 14],
      [10, 30],
    ],
  );
  assert.equal(
    REFERRAL_MILESTONES.reduce((s, m) => s + m.proDays, 0),
    51,
  );
});
test("profile validation rejects forged rewards and requires meaningful bounded fields", () => {
  assert.deepEqual(validateCommunityProfile(profile), profile);
  for (const patch of [
    { qualified: 10 },
    { proDaysAvailable: 30 },
    { email_verified: true },
    { uid: "victim" },
  ])
    assert.throws(() => validateCommunityProfile({ ...profile, ...patch }));
  assert.throws(() =>
    validateCommunityProfile({ ...profile, bio: "a".repeat(1001) }),
  );
  assert.throws(() =>
    validateCommunityProfile({ ...profile, handle: "../../admin" }),
  );
  assert.equal(
    referralActivityProgress(undefined, 0, profile).profileComplete,
    true,
  );
  assert.equal(
    referralActivityProgress(undefined, 0, { ...profile, bio: "ok" })
      .profileComplete,
    false,
  );
});
test("referral activity excludes failures, pre-invitation work and multiple endpoints of the same tool", () => {
  const start = Date.UTC(2026, 7, 1, 12),
    job = {
      path: "/api/ai/ocr-parse",
      status: "delivered",
      cost: 5,
      createdAt: start,
    };
  let a = advanceReferralActivity(
    undefined,
    { ...job, status: "credited" },
    start,
  );
  a = advanceReferralActivity(a, { ...job, createdAt: start - 1 }, start);
  assert.deepEqual(a, { tools: [], days: [], spent: 0 });
  a = advanceReferralActivity(a, job, start);
  a = advanceReferralActivity(
    a,
    { ...job, path: "/api/ai/logical-correction", createdAt: start + DAY_MS },
    start,
  );
  assert.equal(
    referralActivityProgress(a, start, profile, start + 2 * DAY_MS).ready,
    false,
  );
  a = advanceReferralActivity(
    a,
    { ...job, path: "/api/quiz/generate", cost: 0, createdAt: start + DAY_MS },
    start,
  );
  assert.equal(
    referralActivityProgress(a, start, profile, start + DAY_MS).ready,
    false,
  );
  assert.equal(
    referralActivityProgress(a, start, profile, start + 2 * DAY_MS).ready,
    true,
  );
});
test("common email aliases share a reward identity; device cookies are signed and tampering rotates them", () => {
  assert.equal(
    canonicalEmail(" Indie.Artist+extra@googlemail.com "),
    "indieartist@gmail.com",
  );
  assert.equal(canonicalEmail("member+two@example.com"), "member@example.com");
  let cookie = "",
    options: any;
  const response = {
    cookie: (_name: string, value: string, config: any) => {
      cookie = value;
      options = config;
    },
  } as any;
  const first = referralDevice({ headers: {} } as any, response);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(
    referralDevice(
      { headers: { cookie: `__Host-ib_referral_device=${cookie}` } } as any,
      response,
    ),
    first,
  );
  const tampered = cookie.slice(0, -1) + (cookie.endsWith("0") ? "1" : "0");
  assert.notEqual(
    referralDevice(
      { headers: { cookie: `__Host-ib_referral_device=${tampered}` } } as any,
      response,
    ),
    first,
  );
});
test("referral API denies guests, unverified users, ordinary admin requests and forged profile rewards", async (t) => {
  const app = express();
  app.use(
    createAuthMiddleware(async (token) => ({
      uid: token,
      email_verified: token !== "unverified",
    })),
    express.json(),
  );
  app.use("/referrals", referralsRouter);
  app.use("/community", communityRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  t.after(
    () =>
      new Promise<void>((r) => {
        server.closeAllConnections();
        server.close(() => r());
      }),
  );
  const url = `http://127.0.0.1:${(server.address() as any).port}`;
  assert.equal((await fetch(url + "/referrals/status")).status, 401);
  assert.equal(
    (
      await fetch(url + "/referrals/status", {
        headers: { Authorization: "Bearer unverified" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(url + "/referrals/admin/reviews", {
        headers: { Authorization: "Bearer artist" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(url + "/community/profile", {
        method: "PUT",
        headers: {
          Authorization: "Bearer artist",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...profile, coins: 99999 }),
      })
    ).status,
    400,
  );
});
test("App Check rejects missing, replayed and foreign-app tokens; consumes valid tokens and enforces durable limits", async (t) => {
  Object.assign(process.env, {
    REFERRALS_ENABLED: "true",
    REFERRAL_APPCHECK_APP_IDS: "approved-app",
  });
  let consumed = false,
    appId = "approved-app",
    count = 0,
    calls = 0;
  t.mock.method(
    getAppCheck(getFirebaseAdminApp()),
    "verifyToken",
    async (_token: string, options: any) => {
      assert.equal(options.consume, true);
      calls++;
      return { appId, alreadyConsumed: consumed };
    },
  );
  t.mock.method(Firestore.prototype, "runTransaction", async (fn: any) =>
    fn({
      get: async () => ({ data: () => ({ count }) }),
      set: (_ref: any, data: any) => {
        count = data.count;
      },
    }),
  );
  const invoke = async (token?: string) => {
    let status = 200,
      next = false;
    const req = {
      get: (name: string) =>
        name === "X-Firebase-AppCheck" ? token : undefined,
      headers: {},
    } as any;
    const res = {
      locals: { identity: { uid: "artist" } },
      status(n: number) {
        status = n;
        return this;
      },
      json() {
        return this;
      },
      cookie() {},
    } as any;
    await verifyReferralApp(req, res, () => {
      next = true;
    });
    return { status, next };
  };
  assert.equal((await invoke()).status, 403);
  assert.equal(calls, 0);
  consumed = true;
  assert.equal((await invoke("replayed")).status, 403);
  assert.equal(count, 1);
  consumed = false;
  appId = "other-app";
  assert.equal((await invoke("foreign")).status, 403);
  assert.equal(count, 2);
  appId = "approved-app";
  assert.equal((await invoke("valid")).next, true);
  assert.equal(count, 3);
  count = 15;
  assert.equal((await invoke("too-many")).status, 403);
  assert.equal(count, 15);
  assert.equal(calls, 3, "rate-limited attempts do not contact App Check");
  process.env.REFERRALS_ENABLED = "false";
  assert.equal((await invoke("paused")).status, 503);
});
