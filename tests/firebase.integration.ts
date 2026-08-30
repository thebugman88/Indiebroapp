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
  await db.doc(`judgeTracksV2/${id}`).set({
    id,
    ownerId: "owner",
    title: "Original track",
    status: "evaluating",
    durationSeconds: 60,
    reviews: [],
    uploadedAt: new Date().toISOString(),
  });
  await db.doc(`judgeProfilesV2/${uid}`).set({
    ...freshJudge(uid),
    termsAccepted: true,
    dailyAuditsRemaining: remaining,
  });
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
  const track = (await db.doc("judgeTracksV2/duplicate").get()).data()!,
    profile = (await db.doc("judgeProfilesV2/alice").get()).data()!;
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
  const profile = (await db.doc("judgeProfilesV2/bob").get()).data()!;
  assert.equal(profile.dailyAuditsRemaining, 0);
  assert.equal(profile.judgeXp, 50);
});

test("profile edits cannot forge XP, quotas, identity or submitted-track ownership", async () => {
  await db
    .doc("judgeProfilesV2/carol")
    .set({ ...freshJudge("carol"), termsAccepted: true });
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
