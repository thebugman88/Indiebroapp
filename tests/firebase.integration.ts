import {testEncryptionKeys} from './private-fixture';
import {enrollReferral,claimReferral,qualifyReferral,activateReferralPro,referralStatus,saveCommunityProfile} from '../server/referrals';
import {sealPrivate} from '../server/dataProtection';
import {DAY_MS} from '../shared/referrals';
import {openPrivate} from '../server/dataProtection';
import {decodeStoredTrack,encodeStoredTrack} from '../server/judgement';
testEncryptionKeys();
import {
  walletSnapshot,
  refreshWallet,
  reserveUsage,
  settleUsage,
  reserveStorage,
  finishStorage,
  economyRouter,
  usageMiddleware,
  purgeExpiredPrivateResults,
  keyFor,
  awardReviewCoins,
  awardProfileCoins,
} from "../server/economy";
import {
  initializePayment,
  bindCheckout,
  fulfillCheckout,
  recordPaymentException,
  reconcilePayments,
} from "../server/payments";
import { createBillingRouter } from "../server/billing";
import { TERMS_VERSION, ECONOMY_VERSION } from "../shared/economy";
import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import express from "express";
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  setLogLevel,
} from "firebase/firestore";
import {
  initializeApp as clientApp,
  deleteApp as deleteClientApp,
} from "firebase/app";
import {
  getAuth as clientAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { deleteApp } from "firebase-admin/app";
import { getFirebaseAdminApp, requireAuth, requireAdmin } from "../server/auth";
import { judgementRouter, freshJudge } from "../server/judgement";
import { createMessagingRouter, conversationId } from "../server/messaging";
import {
  recordSubscriptionEvent,
  getSubscriptionStatus,
} from "../server/subscriptions";
import type Stripe from "stripe";

// Fail before any client/server connection if someone invokes this against real resources.
assert.equal(process.env.FIREBASE_PROJECT_ID, "demo-indiebro-security");
for (const name of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST"]) {
  assert.match(
    process.env[name] || "",
    /^127\.0\.0\.1:\d+$/,
    `${name} must be a loopback emulator`,
  );
}
assert.ok(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
assert.ok(!process.env.GOOGLE_APPLICATION_CREDENTIALS);
setLogLevel("silent"); // Expected permission denials are asserted below.
const projectId = "demo-indiebro-security";
const db = getFirestore(getFirebaseAdminApp());
const auth = getAuth(getFirebaseAdminApp());
const clients: ReturnType<typeof clientApp>[] = [];
const tokens: Record<string, string> = {};
let rules: RulesTestEnvironment;
let server: ReturnType<express.Express["listen"]>;
let base: string;
async function makeUser(uid: string, emailVerified = true, admin = false) {
  const email = `${uid}@example.test`,
    password = "EmulatorOnly-DoNotReuse-123";
  await auth.createUser({ uid, email, password, emailVerified });
  if (admin) await auth.setCustomUserClaims(uid, { admin: true });
  const app = clientApp({ projectId, apiKey: "fake-api-key" }, uid);
  clients.push(app);
  const client = clientAuth(app);
  connectAuthEmulator(
    client,
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
    { disableWarnings: true },
  );
  tokens[uid] = await (
    await signInWithEmailAndPassword(client, email, password)
  ).user.getIdToken();
}
async function request(
  path: string,
  uid = "alice",
  method = "GET",
  body?: any,
) {
  return fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${tokens[uid] || uid}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function seedTrack(id: string, uid = "alice", remaining = 20) {
  await db.doc(`judgeTracksV2/${id}`).set(encodeStoredTrack({
    id,
    ownerId: "owner",
    title: "Original track",
    status: "evaluating",
    durationSeconds: 60,
    reviews: [],
    uploadedAt: new Date().toISOString(),
  } as any));
  await db.doc(`judgeProfilesV2/${uid}`).set(encodeJudgeProfile({
    ...freshJudge(uid),
    termsAccepted: true,
    dailyAuditsRemaining: remaining,
  }));
  await db
    .doc(`judgeTracksV2/${id}/listens/${uid}`)
    .set({ startedAt: Date.now() - 61000 });
}
const review = {
  scores: { lyrics: 8, vocals: 8, instrumentation: 8, vibe: 8 },
  writtenFeedback: "Clear vocal delivery; the chorus could use more contrast.",
  judgeId: "owner",
  xpEarned: 999999,
  ownerId: "alice",
};
before(async () => {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(":");
  rules = await initializeTestEnvironment({
    projectId,
    firestore: {
      host,
      port: Number(port),
      rules: await readFile("judgement-zone/firestore.rules", "utf8"),
    },
  });
  await rules.clearFirestore();
  await Promise.all([
    makeUser("alice"),
    makeUser("bob"),
    makeUser("carol"),
    makeUser("owner"),
    makeUser("admin", true, true),
    makeUser("unverified", false),
    makeUser("disabled"),
  ]);
  await auth.updateUser("disabled", { disabled: true });
  const app = express();
  app.use(requireAuth, express.json());
  app.get("/admin", requireAdmin, (_req, res) => res.json({ ok: true }));
  app.use("/judgement", judgementRouter);
  app.use("/dm", createMessagingRouter());
  app.use("/api/economy", economyRouter);
  app.use(
    "/billing",
    createBillingRouter(() => fakeStripe),
  );
  app.use(usageMiddleware);
  app.post("/api/generate-lyrics", (req, res) => {
    providerCalls++;
    if (req.body.fail) res.status(502).json({ error: "provider failed" });
    else res.json({ text: "Verified test output" });
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
  await Promise.all(clients.map(deleteClientApp));
  await rules?.cleanup();
  await db.terminate();
  await deleteApp(getFirebaseAdminApp());
});

test("repository rule file denies all direct browser access, including forged admin claims", async () => {
  const paths = [
    "wallets/browser-forgery",
    "coinLedger/browser-forgery",
    "paymentOrders/browser-forgery",
    "usageJobs/browser-forgery",
    "storageReservations/browser-forgery",
    "coinRewards/browser-forgery",
    "communityProfiles/browser-forgery",
    "referralAccounts/browser-forgery",
    "referralClaims/browser-forgery",
    "referralActivity/browser-forgery",
    "referralRewards/browser-forgery",
    "referralEmailClaims/browser-forgery",
    "referralCodes/browser-forgery",
    "referralProActivations/browser-forgery",
    "tracks/legacy",
    "userProfiles/alice",
    "judgeTracksV2/track",
    "judgeTracksV2/track/listens/alice",
    "judgeProfilesV2/alice",
    "billingSubscriptions/sub",
    "billingEvents/evt",
    "dmConversations/chat",
    "dmConversations/chat/messages/message",
  ];
  for (const path of paths)
    await db.doc(path).set({
      ownerId: "alice",
      uid: "alice",
      members: ["alice", "bob"],
      reviews: [],
      status: "active",
    });
  const contexts = [
    rules.unauthenticatedContext(),
    rules.authenticatedContext("alice", { email_verified: true }),
    rules.authenticatedContext("bob", { email_verified: true }),
    rules.authenticatedContext("admin", { admin: true, email_verified: true }),
  ];
  for (const context of contexts) {
    const firestore = context.firestore();
    for (const path of paths) {
      const ref = doc(firestore, path);
      await assertFails(getDoc(ref));
      await assertFails(setDoc(ref, { admin: true, ownerId: "bob" }));
      await assertFails(updateDoc(ref, { status: "active" }));
      await assertFails(deleteDoc(ref));
    }
  }
  await Promise.all(paths.map(path=>db.doc(path).delete()));
});

test("real Auth emulator tokens enforce verified email, admin claims, disabled and anonymous rejection", async () => {
  assert.equal((await request("/admin", "alice")).status, 403);
  assert.equal((await request("/admin", "admin")).status, 200);
  assert.equal((await request("/admin", "invented-token")).status, 401);
  assert.equal((await request("/admin", "disabled")).status, 401);
  assert.equal((await request("/dm/contacts", "unverified")).status, 403);
  const app = clientApp({ projectId, apiKey: "fake-api-key" }, "anonymous");
  clients.push(app);
  const client = clientAuth(app);
  connectAuthEmulator(
    client,
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
    { disableWarnings: true },
  );
  const token = await (await signInAnonymously(client)).user.getIdToken();
  assert.equal((await request("/dm/contacts", token)).status, 401);
});

test("concurrent duplicate reviews commit exactly once and award XP once", async () => {
  await seedTrack("duplicate");
  const responses = await Promise.all(
    Array.from({ length: 4 }, () =>
      request("/judgement/tracks/duplicate/reviews", "alice", "POST", review),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409, 409, 409]);
  const track = decodeStoredTrack((await db.doc("judgeTracksV2/duplicate").get()).data()!),
    profile = decodeJudgeProfile('alice',(await db.doc("judgeProfilesV2/alice").get()).data()!);
  assert.equal(track.ownerId, "owner");
  assert.equal(track.reviews.length, 1);
  assert.equal(track.reviews[0].judgeId, "alice");
  assert.equal(track.aggregatedScores.totalReviews, 1);
  assert.equal(profile.judgeXp, 50);
  assert.equal(profile.dailyAuditsRemaining, 19);
});

test("concurrent reviews on different tracks cannot overspend the last daily review", async () => {
  await seedTrack("quota_a", "bob", 1);
  await seedTrack("quota_b", "bob", 1);
  const responses = await Promise.all(
    ["quota_a", "quota_b"].map((id) =>
      request(`/judgement/tracks/${id}/reviews`, "bob", "POST", review),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  const profile = decodeJudgeProfile('bob',(await db.doc("judgeProfilesV2/bob").get()).data()!);
  assert.equal(profile.dailyAuditsRemaining, 0);
  assert.equal(profile.judgeXp, 50);
});

test("profile edits cannot forge XP, quotas, identity or submitted-track ownership", async () => {
  await db
    .doc("judgeProfilesV2/carol")
    .set(encodeJudgeProfile({ ...freshJudge("carol"), termsAccepted: true }));
  const response = await request("/judgement/profile", "carol", "PATCH", {
    name: "Carol",
    id: "admin",
    judgeXp: 999999,
    dailyAuditsRemaining: 999,
    submittedTrackIds: ["someone-elses-track"],
  });
  assert.equal(response.status, 200);
  const profile = await response.json();
  assert.equal(profile.id, "carol");
  assert.equal(profile.judgeXp, 0);
  assert.equal(profile.dailyAuditsRemaining, 20);
  assert.deepEqual(profile.submittedTrackIds, []);
});

test("durable DM writes preserve concurrent messages and never disclose another pair", async () => {
  const responses = await Promise.all(
    Array.from({ length: 4 }, (_, i) =>
      request("/dm/bob", "alice", "POST", {
        type: "text",
        content: `Message ${i}`,
        senderId: "admin",
      }),
    ),
  );
  assert.ok(responses.every((r) => r.status === 201));
  const ref = db.doc(`dmConversations/${conversationId("alice", "bob")}`);
  assert.equal((await ref.collection("messages").get()).size, 4);
  assert.equal((await ref.get()).data()!.unread.bob, 4);
  const bob = await (await request("/dm/alice", "bob")).json();
  assert.equal(bob.messages.length, 4);
  assert.ok(bob.messages.every((m: any) => m.senderId === "alice"));
  const carol = await (await request("/dm/alice", "carol")).json();
  assert.deepEqual(carol.messages, []);
  assert.equal((await ref.get()).data()!.unread.bob, 0);
  const contacts = await (await request("/dm/contacts", "alice")).json();
  assert.equal(
    contacts.contacts
      .find((c: any) => c.id === "bob")
      .lastMessageSnippet.startsWith("Message "),
    true,
  );
});

test("real Firestore transactions deduplicate billing events and resist stale reactivation", async () => {
  process.env.STRIPE_PRICE_ID_PRO = "price_test_pro";
  const sub = {
    id: "sub_local",
    customer: "cus_local",
    metadata: { firebaseUid: "alice" },
    status: "active",
    items: {
      data: [
        {
          price: { id: "price_test_pro" },
          current_period_end: Math.floor(Date.now() / 1000) + 3600,
        },
      ],
    },
  } as unknown as Stripe.Subscription;
  const event = (id: string, created: number) =>
    ({ id, created, type: "customer.subscription.updated" }) as Stripe.Event;
  await Promise.all(
    Array.from({ length: 4 }, () =>
      recordSubscriptionEvent(event("evt_duplicate", 10), sub),
    ),
  );
  assert.equal(
    (
      await db
        .collection("billingEvents")
        .where("subscriptionId", "==", "sub_local")
        .get()
    ).size,
    1,
  );
  assert.equal((await getSubscriptionStatus("alice")).valid, true);
  assert.equal((await getSubscriptionStatus("bob")).valid, false);
  await recordSubscriptionEvent(event("evt_cancel", 20), {
    ...sub,
    status: "canceled",
  });
  await recordSubscriptionEvent(event("evt_stale", 15), sub);
  await recordSubscriptionEvent(event("evt_delayed_active", 21), sub);
  assert.equal((await getSubscriptionStatus("alice")).valid, false);
  assert.equal(
    (await db.doc("billingSubscriptions/sub_local").get()).data()!.status,
    "canceled",
  );
});

let providerCalls = 0;
let checkoutParams: any, checkoutOptions: any;
const fakeStripe = {
  subscriptions:{retrieve:async(id:string)=>{const data=(await db.doc(`billingSubscriptions/${id}`).get()).data();if(!data)throw new Error('Missing test subscription.');return {id,...data,metadata:{firebaseUid:data.uid}};}},
  prices: {
    retrieve: async (id: string) => ({
      id,
      active: true,
      currency: "usd",
      unit_amount: id === "price_pro" ? 499 : 99,
      recurring:
        id === "price_pro" ? { interval: "month", interval_count: 1 } : null,
    }),
  },
  checkout: {
    sessions: {
      create: async (p: any, o: any) => {
        checkoutParams = p;
        checkoutOptions = o;
        return {
          id: "cs_test_" + o.idempotencyKey,
          url: "https://checkout.stripe.com/c/pay/test",
        };
      },
      listLineItems: async () => ({
        data: [{ quantity: 1, price: { id: "price_coins100" } }],
      }),
    },
  },
} as unknown as Stripe;

test('past-due subscriptions block real transactional Pro purchases and the authenticated checkout route',async()=>{
  process.env.STRIPE_PRICE_ID_PRO='price_pro';process.env.STRIPE_WEBHOOK_SECRET='whsec_emulator_only';process.env.APP_PUBLIC_URL='https://suite.example';
  const ref=db.doc('billingSubscriptions/sub_due');
  await ref.set({uid:'alice',status:'past_due',items:[{priceId:'price_pro',expiresAt:Date.now()-1}]});
  try {
    await assert.rejects(()=>initializePayment('alice','past-due-request','pro',0));
    const response=await request('/billing/create-checkout-session','alice','POST',{productId:'pro',clientCustomKey:'past-due-request',expectedCoins:0,accepted:true,finalConfirmed:true,termsVersion:TERMS_VERSION});
    assert.equal(response.status,409);assert.equal((await response.json()).code,'MANAGE_EXISTING_SUBSCRIPTION');
  }finally{await ref.delete();}
});

test('lyric replay keeps five encrypted pairs and cleanup preserves billing idempotency',async()=>{
  const uid='retention-artist',ids:string[]=[];
  for(let i=0;i<6;i++) {
    const job=await reserveUsage(uid,`retention-request-${i}`,'/api/generate-lyrics','fixture-input');ids.push(job.id);
    await settleUsage(job.id,uid,true,{text:`PRIVATE RETENTION ${i}`});
  }
  let jobs=await Promise.all(ids.map(id=>db.doc(`usageJobs/${id}`).get()));
  assert.equal(jobs.filter(j=>j.data()!.encryptedResponse).length,5);
  assert(!JSON.stringify(jobs.map(j=>j.data())).includes('PRIVATE RETENTION'));
  for(const job of jobs)if(job.data()!.encryptedResponse)await job.ref.update({responseExpiresAt:new Date(Date.now()-1)});
  await purgeExpiredPrivateResults();
  jobs=await Promise.all(ids.map(id=>db.doc(`usageJobs/${id}`).get()));
  assert(jobs.every(j=>j.exists&&j.data()!.status==='delivered'&&!j.data()!.encryptedResponse));
  assert.equal((await reserveUsage(uid,'retention-request-0','/api/generate-lyrics','fixture-input')).replayed,true);
  assert.equal((await walletSnapshot(uid)).total,90);
});

test("wallet reservations prevent concurrent overspending and duplicate charges; failures refund exactly once", async () => {
  const uid = "wallet-concurrency";
  await db
    .doc(`wallets/${uid}`)
    .set({ ...refreshWallet(undefined, false), monthly: 10, purchased: 0 });
  const results = await Promise.allSettled([
    reserveUsage(uid, "request-first", "/api/generate-lyrics"),
    reserveUsage(uid, "request-second", "/api/generate-lyrics"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const job = (
    results.find((r) => r.status === "fulfilled") as PromiseFulfilledResult<any>
  ).value;
  assert.equal((await walletSnapshot(uid)).total, 0);
  const id =
    job.id === keyFor(uid, "request-first")
      ? "request-first"
      : "request-second";
  assert.equal(
    (await reserveUsage(uid, id, "/api/generate-lyrics")).replayed,
    true,
  );
  await Promise.all([
    settleUsage(job.id, uid, false),
    settleUsage(job.id, uid, false),
  ]);
  assert.equal((await walletSnapshot(uid)).total, 10);
});
test("AI requests require price consent and bind idempotency to input; delivered results remain owner-only", async () => {
  const body = { lyrics: "original words" },
    id = "ai-consent-request";
  const call = (payload: any, consent = true) =>
    fetch(base + "/api/generate-lyrics", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.bob}`,
        "Content-Type": "application/json",
        "x-request-id": id,
        ...(consent
          ? { "x-economy-version": ECONOMY_VERSION, "x-coin-consent": "10" }
          : {}),
      },
      body: JSON.stringify(payload),
    });
  const before = (await walletSnapshot("bob")).total;
  assert.equal((await call(body, false)).status, 428);
  assert.equal((await call(body)).status, 200);
  assert.equal((await call(body)).status, 200);
  assert.equal(providerCalls, 1);
  assert.equal((await call({ lyrics: "changed" })).status, 409);
  assert.equal((await walletSnapshot("bob")).total, before - 10);
  assert.equal(
    (await request("/api/economy/jobs/" + keyFor("bob", id), "alice")).status,
    404,
  );
  assert.equal(
    (
      await (
        await request("/api/economy/jobs/" + keyFor("bob", id), "bob")
      ).json()
    ).response.text,
    "Verified test output",
  );
  const r = await fetch(base + "/api/generate-lyrics", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.bob}`,
      "Content-Type": "application/json",
      "x-request-id": "failure-request-id",
      "x-economy-version": ECONOMY_VERSION,
      "x-coin-consent": "10",
    },
    body: JSON.stringify({ fail: true }),
  });
  assert.equal(r.status, 502);
  assert.equal((await walletSnapshot("bob")).total, before - 10);
});
test("storage buys once per request, survives downgrade and upload reservations cannot exceed quota", async () => {
  await db
    .doc("wallets/carol")
    .set({ ...refreshWallet(undefined, false), monthly: 1000 });
  const body = {
    pack: "gb10",
    requestId: "storage-request-123",
    termsVersion: TERMS_VERSION,
    confirmed: true,
  };
  assert.equal(
    (await request("/api/economy/storage", "carol", "POST", body)).status,
    200,
  );
  assert.equal(
    (await request("/api/economy/storage", "carol", "POST", body)).status,
    200,
  );
  let w = await walletSnapshot("carol");
  assert.equal(w.total, 300);
  assert.equal(w.storageLimitBytes, 11e9);
  await reserveStorage("carol", "upload-one", 10e9);
  await assert.rejects(reserveStorage("carol", "upload-two", 2e9));
  await finishStorage("carol", "upload-one", false);
  await finishStorage("carol", "upload-one", false);
  w = await walletSnapshot("carol");
  assert.equal(w.storageReserved, 0);
  assert.equal(w.storageBytes, 0);
  assert.equal(w.extraStorageBytes, 10e9);
  await assert.rejects(reserveStorage("carol", "bad-upload", -1));
});
test("profile and validated review rewards are deduplicated and monthly capped", async () => {
  const uid = "reward-artist";
  await db.doc(`judgeProfilesV2/${uid}`).set(encodeJudgeProfile({
    ...freshJudge(uid),
    name: "Artist",
    termsAccepted: true,
    tasteProfile: {...freshJudge(uid).tasteProfile, preferredGenres: ["Hip-Hop / BoomBap"] },
    auditsCompletedTotal: 5,
  }));
  assert.equal(await awardProfileCoins(uid), 5);
  assert.equal(await awardProfileCoins(uid), 0);
  assert.equal(await awardReviewCoins(uid), 5);
  assert.equal(await awardReviewCoins(uid), 0);
  for (let n = 2; n <= 12; n++) {
    const ref=db.doc(`judgeProfilesV2/${uid}`);
    await ref.set(encodeJudgeProfile({...decodeJudgeProfile(uid,(await ref.get()).data()),auditsCompletedTotal:n*5}));
    await awardReviewCoins(uid);
  }
  const w = await walletSnapshot(uid);
  assert.equal(w.earned, 50);
  assert.equal(w.total, 200);
});
async function paidOrder(uid: string, key: string) {
  const order = await initializePayment(uid, key, "coins100", 100);
  await db
    .doc(`paymentOrders/${order.id}`)
    .update({ priceId: "price_coins100" });
  const session = {
    id: "cs_test_" + key,
    client_reference_id: uid,
    metadata: { orderId: order.id, firebaseUid: uid },
    currency: "usd",
    amount_subtotal: 99,
    payment_status: "paid",
    status: "complete",
    mode: "payment",
    consent: { terms_of_service: "accepted" },
    payment_intent: "pi_" + key,
    url: "https://checkout.stripe.com/c/pay/test",
  } as unknown as Stripe.Checkout.Session;
  await bindCheckout(order.id, session);
  return { order, session };
}
test("verified payments fulfill exactly once; forged ownership, price and amount cannot mint Coins", async () => {
  const uid = "paid-artist";
  const { order, session } = await paidOrder(uid, "paidrequest");
  await assert.rejects(
    fulfillCheckout(fakeStripe, { ...session, client_reference_id: "victim" }),
  );
  await assert.rejects(
    fulfillCheckout(fakeStripe, { ...session, amount_subtotal: 1 }),
  );
  const wrongStripe = {
    checkout: {
      sessions: {
        listLineItems: async () => ({
          data: [{ quantity: 1, price: { id: "wrong_price" } }],
        }),
      },
    },
  } as unknown as Stripe;
  await assert.rejects(fulfillCheckout(wrongStripe, session));
  assert.equal((await walletSnapshot(uid)).purchased, 0);
  await Promise.all([
    fulfillCheckout(fakeStripe, session),
    fulfillCheckout(fakeStripe, session),
  ]);
  assert.equal((await walletSnapshot(uid)).purchased, 100);
  assert.equal(
    (await db.doc(`paymentOrders/${order.id}`).get()).data()!.status,
    "fulfilled",
  );
  const stages = await db.collection(`paymentOrders/${order.id}/events`).get();
  assert.equal(stages.size, 4);
  const charge = {
    id: "ch_paid",
    payment_intent: session.payment_intent,
    amount: 99,
    amount_refunded: 99,
  } as Stripe.Charge;
  await recordPaymentException(charge, "refunded");
  await recordPaymentException(charge, "refunded");
  await fulfillCheckout(fakeStripe, session);
  assert.equal((await walletSnapshot(uid)).purchased, 0);
  assert.equal(
    (await db.doc(`paymentOrders/${order.id}`).get()).data()!.status,
    "refunded",
  );
});
test("out-of-order refund before delivery never mints Coins or takes unrelated purchases", async () => {
  const uid = "early-refund";
  await db
    .doc(`wallets/${uid}`)
    .set({ ...refreshWallet(undefined, false), purchased: 250 });
  const { order, session } = await paidOrder(uid, "earlyrefund");
  await recordPaymentException(
    {
      id: "ch_early",
      payment_intent: session.payment_intent,
      amount: 99,
      amount_refunded: 99,
    } as Stripe.Charge,
    "refunded",
  );
  await fulfillCheckout(fakeStripe, session);
  assert.equal((await walletSnapshot(uid)).purchased, 250);
  assert.equal(
    (await db.doc(`paymentOrders/${order.id}`).get()).data()!.status,
    "refunded",
  );
});
test("checkout uses verified identity, exact configured prices, accepted terms and stable per-user idempotency", async () => {
  process.env.STRIPE_PRICE_ID_COINS100 = "price_coins100";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_emulator_only";
  process.env.APP_PUBLIC_URL = "https://suite.example";
  const body = {
    productId: "coins100",
    clientCustomKey: "checkout-request-123",
    termsVersion: TERMS_VERSION,
    accepted: true,
    finalConfirmed: true,
    expectedCoins: 100,
    userId: "victim",
    userEmail: "victim@example.test",
    returnUrl: "https://evil.example",
    cents: 1,
  };
  assert.equal(
    (await request("/billing/create-checkout-session", "alice", "POST", body))
      .status,
    200,
  );
  assert.equal(checkoutParams.client_reference_id, "alice");
  assert.equal(checkoutParams.customer_email, "alice@example.test");
  assert.equal(checkoutParams.line_items[0].price, "price_coins100");
  assert.equal(checkoutParams.consent_collection.terms_of_service, "required");
  assert.ok(checkoutParams.success_url.startsWith("https://suite.example/"));
  const options = checkoutOptions;
  assert.equal(
    (await request("/billing/create-checkout-session", "bob", "POST", body))
      .status,
    200,
  );
  assert.notEqual(checkoutOptions.idempotencyKey, options.idempotencyKey);
  assert.equal(
    (
      await request(
        "/billing/create-checkout-session",
        "unverified",
        "POST",
        body,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/billing/create-checkout-session", "alice", "POST", {
        ...body,
        clientCustomKey: "forged-coins-request",
        expectedCoins: 999999,
      })
    ).status,
    502,
  );
  const [a, b] = await Promise.all([
    initializePayment("pro-mutex", "mutex-request-one", "pro", 0),
    initializePayment("pro-mutex", "mutex-request-two", "pro", 0),
  ]);
  assert.equal(a.id, b.id);
});

test("monitor recovers a lost checkout binding and an expired cross-month AI reservation", async () => {
  const uid = "monitor-artist";
  const order = await initializePayment(
    uid,
    "monitor-checkout",
    "coins100",
    100,
  );
  await db
    .doc(`paymentOrders/${order.id}`)
    .update({ priceId: "price_coins100" });
  const session = {
    id: "cs_test_monitor",
    metadata: { orderId: order.id, firebaseUid: uid },
    client_reference_id: uid,
    mode: "payment",
    payment_status: "paid",
    status: "complete",
    currency: "usd",
    amount_subtotal: 99,
    payment_intent: "pi_monitor",
    consent: { terms_of_service: "accepted" },
    url: null,
  } as unknown as Stripe.Checkout.Session;
  const job = await reserveUsage(uid, "monitor-ai-job", "/api/generate-lyrics");
  await db
    .doc(`usageJobs/${job.id}`)
    .update({ expiresAt: Date.now() - 1, "debit.month": "2000-01" });
  const stripe = {
    checkout: {
      sessions: {
        list: async () => ({ data: [session], has_more: false }),
        retrieve: async () => {
          throw new Error("Unrelated pending order");
        },
        listLineItems: async () => ({
          data: [{ quantity: 1, price: { id: "price_coins100" } }],
        }),
      },
    },
  } as unknown as Stripe;
  await reconcilePayments(stripe);
  const w = await walletSnapshot(uid);
  assert.equal(w.monthly, 140);
  assert.equal(w.purchased, 110);
  assert.equal(
    (await db.doc(`paymentOrders/${order.id}`).get()).data()!.status,
    "fulfilled",
  );
  assert.equal(
    (await db.doc(`usageJobs/${job.id}`).get()).data()!.status,
    "credited",
  );
});
test("Pro purchase bonuses come from live server entitlements, and expired entitlements lose the bonus", async () => {
  const uid = "bonus-artist";
  await db
    .doc("billingSubscriptions/sub_bonus")
    .set({
      uid,
      status: "active",
      items: [
        {
          priceId: process.env.STRIPE_PRICE_ID_PRO,
          expiresAt: Date.now() + 3600000,
        },
      ],
    });
  const one = await initializePayment(uid, "bonus-small-pack", "coins100", 125);
  const two = await initializePayment(uid, "bonus-large-pack", "coins250", 315);
  assert.equal(one.coins, 125);
  assert.equal(two.coins, 315);
  assert.equal((await walletSnapshot(uid)).monthly, 1500);
  await assert.rejects(
    initializePayment(uid, "forged-bonus-pack", "coins250", 999),
  );
  await db
    .doc("billingSubscriptions/sub_bonus")
    .update({
      items: [
        { priceId: process.env.STRIPE_PRICE_ID_PRO, expiresAt: Date.now() - 1 },
      ],
    });
  await assert.rejects(
    initializePayment(uid, "expired-bonus-pack", "coins250", 315),
  );
  assert.equal(
    (await initializePayment(uid, "free-large-pack", "coins250", 250)).coins,
    250,
  );
});
import {encodeJudgeProfile,decodeJudgeProfile} from '../server/profileProtection';

const referralProfile={displayName:'Test Artist',handle:'test_artist',role:'artist',genre:'Hip-Hop',bio:'Independent artist writing original songs and learning production.',goal:'Release a carefully produced original EP.'};
async function referralMember(uid:string,device:string,email=`${uid}@example.test`) {
  await auth.createUser({uid,email,password:'EmulatorOnly-Referral-123',emailVerified:true});
  await saveCommunityProfile(uid,referralProfile);
  return enrollReferral(uid,device);
}
function referralTestConfig(t:any) {
  const old={enabled:process.env.REFERRALS_ENABLED,automatic:process.env.REFERRALS_AUTOMATIC_REWARDS,key:process.env.REFERRAL_ABUSE_HMAC_KEY};
  Object.assign(process.env,{REFERRALS_ENABLED:'true',REFERRALS_AUTOMATIC_REWARDS:'true',REFERRAL_ABUSE_HMAC_KEY:Buffer.alloc(32,82).toString('base64')});
  t.after(()=>{for(const [key,value] of Object.entries({REFERRALS_ENABLED:old.enabled,REFERRALS_AUTOMATIC_REWARDS:old.automatic,REFERRAL_ABUSE_HMAC_KEY:old.key}))if(value===undefined)delete process.env[key];else process.env[key]=value;});
}
test('real referral transactions enforce activity, award both accounts once, cap milestones and activate banked Pro without monthly farming',async t=>{
  referralTestConfig(t);
  const parent='referral-parent',invite=await referralMember(parent,'parent-device');
  const members=Array.from({length:11},(_,i)=>`referral-member-${i}`);
  for(const uid of members){const own=await referralMember(uid,`device-${uid}`);assert.notEqual(own.code,invite.code);await claimReferral(uid,invite.code);}
  await assert.rejects(()=>claimReferral(members[0],'F'.repeat(24)),/cannot be changed/);
  const beginning=Date.now()+60000;let now=beginning;
  t.mock.method(Date,'now',()=>now);
  for(const uid of members){const j=await reserveUsage(uid,'referral-lyric-1','/api/generate-lyrics');await settleUsage(j.id,uid,true,{text:'Synthetic complete output'});await settleUsage(j.id,uid,true,{text:'Ignored replay'});}
  assert.equal((await qualifyReferral(members[0])).status,'pending');
  now=beginning+DAY_MS;
  for(const uid of members){const j=await reserveUsage(uid,'referral-quiz-1','/api/quiz/generate');await settleUsage(j.id,uid,true,{quiz:'Synthetic quiz'});}
  assert.equal((await qualifyReferral(members[0])).status,'pending','must still wait 48 hours');
  const evidence=(await db.doc(`referralActivity/${members[0]}`).get()).data()!;
  assert.equal(JSON.stringify(evidence).includes('lyric-pro'),false,'activity summary is encrypted');
  now=beginning+2*DAY_MS;
  for(let i=0;i<10;i++) {
    if(i&&i%2===0)now+=DAY_MS;
    const before=(await walletSnapshot(members[i])).purchased;
    const results=await Promise.all([qualifyReferral(members[i]),qualifyReferral(members[i])]);
    assert(results.every(r=>r.status==='qualified'));
    assert.equal((await walletSnapshot(members[i])).purchased,before+20);
    if(i===1)assert.equal((await qualifyReferral(members[2])).status,'daily_limit');
  }
  assert.equal((await qualifyReferral(members[10])).status,'capped');
  const status=await referralStatus(parent);
  assert.equal(status.qualified,10);assert.equal(status.points,1400);assert.equal(status.coins,325);assert.equal(status.proDaysAvailable,51);
  assert(status.badges['Brotherhood Ambassador']);
  assert.equal(JSON.stringify(status).includes(members[0]),false,'inviter receives no identities or task details');
  const before=await walletSnapshot(parent);
  const activations=await Promise.allSettled([activateReferralPro(parent),activateReferralPro(parent)]);
  assert.equal(activations.filter(r=>r.status==='fulfilled').length,1);
  const pro=await walletSnapshot(parent);
  assert.equal(pro.tier,'pro');assert.equal(pro.proSource,'referral');assert.equal(pro.monthly,before.monthly);
  assert.equal(pro.purchased,before.purchased+2295);assert.equal(pro.storageLimitBytes,10_000_000_000);
  assert.equal((await referralStatus(parent)).proDaysAvailable,0);
  await assert.rejects(()=>initializePayment(parent,'cannot-buy-during-promo','pro',0));
  now=pro.promoProUntil+1;
  const expired=await walletSnapshot(parent);
  assert.equal(expired.tier,'free');assert.equal(expired.monthly,150);assert.equal(expired.purchased,pro.purchased);
  assert.equal(expired.storageLimitBytes,1_000_000_000);
});
test('shared-device referrals wait for review; disabled accounts, duplicate aliases and fabricated activity cannot claim rewards',async t=>{
  referralTestConfig(t);
  const parent='review-parent',child='review-child';
  const invite=await referralMember(parent,'shared-device');await referralMember(child,'shared-device');await claimReferral(child,invite.code);
  let now=Date.now()+60000;t.mock.method(Date,'now',()=>now);
  let job=await reserveUsage(child,'review-failed-ai','/api/analyze');await settleUsage(job.id,child,false);
  assert.equal((await referralStatus(child)).progress.spent,0);
  job=await reserveUsage(child,'review-lyric-ai','/api/generate-lyrics');await settleUsage(job.id,child,true,{text:'Synthetic'});
  now+=DAY_MS;job=await reserveUsage(child,'review-quiz-ai','/api/quiz/generate');await settleUsage(job.id,child,true,{quiz:'Synthetic'});
  now+=DAY_MS;
  assert.equal((await qualifyReferral(child)).status,'awaiting_review');
  assert.equal((await referralStatus(parent)).qualified,0);
  await db.doc(`securityBlocks/${child}`).set({until:now+DAY_MS});
  await assert.rejects(()=>qualifyReferral(child,{actor:'admin',reason:'Reviewed separate artists'}),/restricted account/);
  await db.doc(`securityBlocks/${child}`).delete();
  await auth.updateUser(child,{disabled:true});await assert.rejects(()=>qualifyReferral(child,{actor:'admin',reason:'Reviewed external evidence'}));
  await auth.updateUser(child,{disabled:false});
  assert.equal((await qualifyReferral(child,{actor:'admin',reason:'Verified separate artists sharing this device'})).status,'qualified');
  assert.equal((await referralStatus(parent)).qualified,1);
  const first=await referralMember('alias-one','alias-device-one','referral.member+one@gmail.com');assert(first.code);
  await assert.rejects(()=>referralMember('alias-two','alias-device-two','referralmember+two@googlemail.com'),/already registered/);
  const changed='changed-email-member';await referralMember(changed,'changed-email-device');await claimReferral(changed,invite.code);
  job=await reserveUsage(changed,'changed-email-lyrics','/api/generate-lyrics');await settleUsage(job.id,changed,true,{text:'Synthetic'});
  now+=DAY_MS;job=await reserveUsage(changed,'changed-email-quiz','/api/quiz/generate');await settleUsage(job.id,changed,true,{quiz:'Synthetic'});
  now+=DAY_MS;
  await auth.updateUser(changed,{email:'referral.member+changed@googlemail.com',emailVerified:true});
  await assert.rejects(()=>qualifyReferral(changed,{actor:'admin',reason:'Approval cannot override a duplicate email identity'}),/already registered to another account/);
  assert.equal((await referralStatus(parent)).qualified,1);
});
test('earned Pro waits for subscriptions or pending checkouts and cannot double grant on retries',async t=>{
  referralTestConfig(t);
  const uid='pro-bank-member';await referralMember(uid,'pro-bank-device');
  const ref=db.doc(`referralAccounts/${uid}`),doc=await ref.get(),a=openPrivate(doc.data()!.private,`referral-account:${uid}`);a.proDaysAvailable=7;
  await ref.set({private:sealPrivate(a,`referral-account:${uid}`)});
  await db.doc('billingSubscriptions/referral-bank-sub').set({uid,status:'past_due',items:[]});
  await assert.rejects(()=>activateReferralPro(uid),/existing Pro access/);
  assert.equal((await referralStatus(uid)).proDaysAvailable,7);
  await db.doc('billingSubscriptions/referral-bank-sub').update({status:'canceled'});
  const order=await initializePayment(uid,'pending-pro-bank-order','pro',0);
  await assert.rejects(()=>activateReferralPro(uid),/existing Pro access/);
  await db.doc(`paymentOrders/${order.id}`).update({status:'failed'});
  const before=(await walletSnapshot(uid)).purchased;
  const result=await activateReferralPro(uid);assert.equal(result.days,7);assert.equal(result.coins,315);
  await assert.rejects(()=>activateReferralPro(uid));
  assert.equal((await walletSnapshot(uid)).purchased,before+315);
});
test('retroactive invitations, self-referrals, approval before activity and program budget exhaustion cannot mint rewards',async t=>{
  referralTestConfig(t);
  const old='old-referral-member';await referralMember(old,'old-referral-device');
  const parent='late-referral-parent',invite=await referralMember(parent,'late-parent-device');
  await assert.rejects(()=>claimReferral(old,invite.code),/before this new account/);
  await assert.rejects(()=>claimReferral(parent,invite.code),/cannot be attached/);
  const child='budget-referral-member';await referralMember(child,'budget-referral-device');await claimReferral(child,invite.code);
  assert.equal((await qualifyReferral(child,{actor:'admin',reason:'Cannot bypass activity qualification'})).status,'pending');
  let now=Date.now()+60000;t.mock.method(Date,'now',()=>now);
  let job=await reserveUsage(child,'budget-lyrics','/api/generate-lyrics');await settleUsage(job.id,child,true,{text:'Synthetic'});
  now+=DAY_MS;job=await reserveUsage(child,'budget-quiz','/api/quiz/generate');await settleUsage(job.id,child,true,{quiz:'Synthetic'});
  now+=DAY_MS;
  const day=new Date(now).toISOString().slice(0,10),ref=db.doc(`referralDailyBudget/${day}`),previous=await ref.get();
  await ref.set({count:25});
  assert.equal((await qualifyReferral(child)).status,'daily_limit');assert.equal((await referralStatus(parent)).qualified,0);
  if(previous.exists)await ref.set(previous.data()!);else await ref.delete();
  process.env.REFERRALS_AUTOMATIC_REWARDS='false';
  assert.equal((await qualifyReferral(child)).status,'awaiting_review','default manual approval also applies to unflagged accounts');
  assert.equal((await qualifyReferral(child,{actor:'admin',reason:'Independently verified eligible participants'})).status,'qualified');
});
