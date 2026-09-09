import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { Firestore, Query, DocumentReference } from "firebase-admin/firestore";
import { createBillingRouter } from "../server/billing";
import { initializePayment } from "../server/payments";
import { firestoreMessages, conversationId } from "../server/messaging";
import { economyRouter } from "../server/economy";
import { PRODUCTS, TERMS_VERSION } from "../shared/economy";
import { sealPrivate } from "../server/dataProtection";
import { testEncryptionKeys } from "./private-fixture";

process.env.FIREBASE_PROJECT_ID = "demo-indiebro-privacy-tests";
testEncryptionKeys();
async function serve(t: any, router: express.Router) {
  const app = express();
  app.use(
    express.json(),
    (req, res, next) => {
      res.locals.identity = {
        uid: req.get("x-test-user") || "alice",
        email_verified: true,
      };
      next();
    },
    router,
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  });
  return `http://127.0.0.1:${(server.address() as any).port}`;
}
test("checkout rejects every recoverable subscription, not just active paid entitlement", async (t) => {
  Object.assign(process.env, {
    STRIPE_PRICE_ID_PRO: "price_test",
    APP_PUBLIC_URL: "https://suite.test",
    STRIPE_WEBHOOK_SECRET: "synthetic-test-only",
  });
  let status = "past_due",
    owner = "alice",
    checkouts = 0;
  t.mock.method(Query.prototype, "get", async () => ({
    docs: [{ data: () => ({ uid: "alice", status, items: [] }) }],
  }));
  const stripe = {
    prices: {
      retrieve: async () => ({
        active: true,
        currency: "usd",
        unit_amount: PRODUCTS.pro.cents,
        recurring: { interval: "month", interval_count: 1 },
      }),
    },
    subscriptions: {
      retrieve: async () => ({ status, metadata: { firebaseUid: owner } }),
    },
    checkout: {
      sessions: {
        create: async () => {
          checkouts++;
          throw new Error("Unexpected checkout");
        },
      },
    },
  } as any;
  const base = await serve(
    t,
    createBillingRouter(
      () => stripe,
      async () => ["sub_existing"],
    ),
  );
  const call = () =>
    fetch(base + "/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: "pro",
        clientCustomKey: "test-order-123",
        expectedCoins: PRODUCTS.pro.coins,
        accepted: true,
        finalConfirmed: true,
        termsVersion: TERMS_VERSION,
      }),
    });
  for (status of [
    "past_due",
    "unpaid",
    "trialing",
    "paused",
    "incomplete",
    "active",
  ]) {
    const response = await call();
    assert.equal(response.status, 409, status);
    assert.equal((await response.json()).code, "MANAGE_EXISTING_SUBSCRIPTION");
  }
  owner = "someone-else";
  assert.equal((await call()).status, 502);
  assert.equal(checkouts, 0);
});
test("the transaction itself blocks a second Pro order for nonterminal subscription states", async (t) => {
  let status = "past_due",
    writes = 0;
  t.mock.method(Firestore.prototype, "runTransaction", async (fn: any) =>
    fn({
      get: async (ref: any) =>
        ref.path
          ? { exists: false, data: () => undefined }
          : { docs: [{ data: () => ({ status, items: [] }) }] },
      set: () => {
        writes++;
      },
      create: () => {
        writes++;
      },
    }),
  );
  for (status of [
    "past_due",
    "unpaid",
    "trialing",
    "paused",
    "incomplete",
    "active",
  ])
    await assert.rejects(() =>
      initializePayment("alice", "request-123", "pro", PRODUCTS.pro.coins),
    );
  assert.equal(writes, 0);
  for (status of ["canceled", "incomplete_expired"])
    assert.equal(
      (
        await initializePayment(
          "alice",
          "request-123",
          "pro",
          PRODUCTS.pro.coins,
        )
      ).productId,
      "pro",
    );
});
test("actual message persistence encrypts content and authenticates pair membership independently of query fields", async (t) => {
  const records = new Map<string, any>();
  const snapshot = (ref: any) => ({
    id: ref.id,
    ref,
    exists: records.has(ref.path),
    data: () => records.get(ref.path),
  });
  t.mock.method(DocumentReference.prototype, "get", async function (this: any) {
    return snapshot(this);
  });
  t.mock.method(Firestore.prototype, "runTransaction", async (fn: any) =>
    fn({
      get: async (ref: any) => snapshot(ref),
      create: (ref: any, value: any) => {
        assert(!records.has(ref.path));
        records.set(ref.path, value);
      },
      set: (ref: any, value: any) => records.set(ref.path, value),
      update: () => {},
    }),
  );
  t.mock.method(Query.prototype, "get", async function (this: any) {
    const q = this._queryOptions;
    const prefix =
      [q.parentPath.relativeName, q.collectionId].filter(Boolean).join("/") +
      "/";
    return {
      docs: [...records]
        .filter(
          ([path]) =>
            path.startsWith(prefix) && !path.slice(prefix.length).includes("/"),
        )
        .map(([path, data]) => ({
          id: path.split("/").at(-1),
          data: () => data,
        })),
    };
  });
  await firestoreMessages.send(
    "alice",
    "bob",
    {
      id: "message-1",
      senderId: "alice",
      recipientId: "bob",
      content: "PRIVATE ORIGINAL WORDS",
      type: "text",
      timestamp: 1,
    },
    { alice: "Private Alice", bob: "Private Bob" },
  );
  const persisted = JSON.stringify([...records]);
  for (const secret of [
    "PRIVATE ORIGINAL WORDS",
    "Private Alice",
    "Private Bob",
  ])
    assert(!persisted.includes(secret));
  assert.equal(
    (await firestoreMessages.read("bob", "alice"))[0].content,
    "PRIVATE ORIGINAL WORDS",
  );
  assert.equal((await firestoreMessages.list("bob"))[0].name, "Private Alice");
  assert.deepEqual(await firestoreMessages.read("carol", "alice"), []);
  records
    .get(`dmConversations/${conversationId("alice", "bob")}`)
    .members.push("carol");
  await assert.rejects(() => firestoreMessages.list("carol"), /integrity/);
});
test("recovery exposes plaintext only to the owner before expiry and never returns envelopes in history", async (t) => {
  const id = "a".repeat(64);
  let record: any = {
    uid: "alice",
    status: "delivered",
    encryptedResponse: sealPrivate(
      { text: "PRIVATE RECOVERY" },
      `usage:alice:${id}`,
      Date.now() + 60000,
    ),
  };
  t.mock.method(DocumentReference.prototype, "get", async () => ({
    exists: true,
    data: () => record,
  }));
  t.mock.method(Query.prototype, "get", async () => ({
    docs: [{ id, data: () => record }],
  }));
  const base = await serve(t, economyRouter);
  const own = await fetch(base + "/jobs/" + id);
  assert.equal(own.status, 200);
  assert.equal((await own.json()).response.text, "PRIVATE RECOVERY");
  assert.equal(
    (await fetch(base + "/jobs/" + id, { headers: { "x-test-user": "bob" } }))
      .status,
    404,
  );
  const history = await (await fetch(base + "/history")).json();
  assert.equal(history[0].encryptedResponse, undefined);
  assert.equal(history[0].response, undefined);
  record = {
    ...record,
    encryptedResponse: sealPrivate(
      { text: "PRIVATE RECOVERY" },
      `usage:alice:${id}`,
      Date.now() - 1,
    ),
  };
  const expired = await fetch(base + "/jobs/" + id);
  assert.equal(expired.status, 410);
  assert(!(await expired.text()).includes("PRIVATE RECOVERY"));
});
