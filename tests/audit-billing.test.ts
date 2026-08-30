import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type Stripe from 'stripe';
import { usageMiddleware } from '../server/economy';
import { AI_ACTIONS, ECONOMY_VERSION } from '../shared/economy';
import { createBillingRouter } from '../server/billing';

const servers: ReturnType<express.Express['listen']>[] = [];
after(async () => { for (const s of servers) { s.closeAllConnections(); await new Promise<void>(r => s.close(() => r())); } });
async function serve(app: express.Express) {
  const server = app.listen(0, '127.0.0.1'); servers.push(server);
  await new Promise<void>(r => server.once('listening', r));
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}

test('all AI route aliases enforce verification, price consent and request IDs before reaching providers', async () => {
  const app = express(); let reached = 0;
  app.use((req, res, next) => { res.locals.identity = { uid: 'artist', email_verified: req.get('x-test-verified') === 'true' }; next(); });
  app.use(usageMiddleware);
  for (const path of Object.keys(AI_ACTIONS)) app.post(path, (_req, res) => { reached++; res.json({ ok: true }); });
  const base = await serve(app);
  for (const [path, action] of Object.entries(AI_ACTIONS)) {
    for (const alias of [path, `${path}/`, path.toUpperCase(), `${path.toUpperCase()}/?test=1`]) {
      assert.equal((await fetch(base + alias, { method: 'POST' })).status, 403, alias);
      assert.equal((await fetch(base + alias, { method: 'POST', headers: { 'x-test-verified': 'true' } })).status, action.cost ? 428 : 400, alias);
      assert.equal((await fetch(base + alias, { method: 'POST', headers: { 'x-test-verified': 'true', 'x-economy-version': ECONOMY_VERSION, 'x-coin-consent': String(action.cost) } })).status, 400, alias);
    }
  }
  assert.equal(reached, 0, 'no provider work is allowed without the billing preconditions');
});

test('cancellation checks live status for every mapped subscription and confirms provider results', async () => {
  let status = 'past_due', owner = 'artist', ids = ['sub_test'], confirm = true, fail = false;
  const calls: Array<{method: string; params: unknown}> = [];
  const sub = () => ({ id: 'sub_test', status, metadata: { firebaseUid: owner } });
  const stripe = { subscriptions: {
    retrieve: async () => { if (fail) throw new Error('outage'); return sub(); },
    update: async (_id: string, params: unknown) => { calls.push({method: 'update', params}); return { ...sub(), cancel_at_period_end: confirm }; },
    cancel: async (_id: string, params: unknown) => { calls.push({method: 'cancel', params}); return { ...sub(), status: confirm ? 'canceled' : status }; },
  }} as unknown as Stripe;
  const app = express();
  app.use((req, res, next) => { res.locals.identity = { uid: 'artist', email_verified: req.get('x-test-unverified') !== 'true' }; next(); });
  app.use(createBillingRouter(() => stripe, async uid => { assert.equal(uid, 'artist'); return ids; }));
  const base = await serve(app);
  const cancel = () => fetch(base + '/cancel', {method: 'POST'});
  for (status of ['past_due', 'unpaid', 'incomplete', 'paused']) {
    calls.length = 0; assert.equal((await cancel()).status, 200);
    assert.deepEqual(calls, [{method: 'cancel', params: {prorate: false, invoice_now: false}}]);
  }
  for (status of ['active', 'trialing']) {
    calls.length = 0; assert.equal((await cancel()).status, 200);
    assert.deepEqual(calls, [{method: 'update', params: {cancel_at_period_end: true}}]);
  }
  for (status of ['canceled', 'incomplete_expired']) {
    calls.length = 0; assert.equal((await cancel()).status, 200); assert.equal(calls.length, 0);
  }
  status = 'past_due'; owner = 'other'; calls.length = 0;
  assert.equal((await cancel()).status, 503); assert.equal(calls.length, 0);
  owner = 'artist'; confirm = false;
  for (status of ['active', 'past_due']) assert.equal((await cancel()).status, 503);
  confirm = true; fail = true; assert.equal((await cancel()).status, 503); fail = false;
  ids = []; assert.equal((await cancel()).status, 409);
  assert.equal((await fetch(base + '/cancel', {method: 'POST', headers: {'x-test-unverified': 'true'}})).status, 403);
});
