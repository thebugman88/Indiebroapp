import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import Stripe from 'stripe';
import { createAuthMiddleware, requireAdmin } from '../server/auth';
import { createBillingRouter, createStripeWebhook, getCheckoutUrls } from '../server/billing';

process.env.STRIPE_PRICE_ID_PRO = 'price_pro';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_regression_only';
process.env.APP_PUBLIC_URL = 'https://suite.example';
const servers: ReturnType<express.Express['listen']>[] = [];
after(async () => { for (const server of servers) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } });
async function serve(app: express.Express) {
  const server = app.listen(0, '127.0.0.1'); servers.push(server);
  await new Promise<void>(resolve => server.once('listening', resolve));
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}
const identity = createAuthMiddleware(async token => {
  if (token === 'artist') return { uid: 'uid_artist', email: 'artist@example.invalid', email_verified: true };
  if (token === 'admin') return { uid: 'uid_admin', email: 'admin@example.invalid', email_verified: true, admin: true };
  if (token === 'unverified') return { uid: 'uid_admin', email_verified: false, admin: true };
  throw new Error('invalid token');
});
async function post(base: string, path: string, body: unknown, token?: string) {
  return fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
}
function subscription(status = 'active', price = 'price_pro') {
  return { id: 'sub_test', status, metadata: { firebaseUid: 'uid_artist' }, items: { data: [{ price: { id: price }, current_period_end: 2000000000 }] } } as unknown as Stripe.Subscription;
}
function checkout(overrides: Partial<Stripe.Checkout.Session> = {}) {
  return { id: 'cs_test_valid', client_reference_id: 'uid_artist', mode: 'subscription', status: 'complete', payment_status: 'paid', subscription: subscription(), ...overrides } as Stripe.Checkout.Session;
}

test('admin routes reject missing, forged, ordinary and unverified identities', async () => {
  const app = express(); app.use(express.json(), identity, requireAdmin);
  app.post('/admin', (_req, res) => res.json({ ok: true }));
  const base = await serve(app);
  for (const token of [undefined, 'forged']) assert.equal((await post(base, '/admin', { isAdmin: true, email: 'xchristopherrayx@gmail.com' }, token)).status, 401);
  for (const token of ['artist', 'unverified']) assert.equal((await post(base, '/admin', { admin: true }, token)).status, 403);
  assert.equal((await post(base, '/admin', {}, 'admin')).status, 200);
});

test('payments fail closed when Stripe is absent and reject invented simulation IDs', async () => {
  const app = express(); app.use(express.json(), identity, createBillingRouter(() => null)); const base = await serve(app);
  assert.equal((await post(base, '/create-checkout-session', { clientCustomKey: 'valid-request-123' }, 'artist')).status, 503);
  for (const sessionId of ['sim_session_invented', {}, null]) {
    const response = await post(base, '/verify-session', { sessionId }, 'artist');
    assert.equal(response.status, 400); assert.equal((await response.json()).valid, false);
  }
  assert.equal((await post(base, '/verify-session', { sessionId: 'cs_test_valid' }, 'artist')).status, 503);
});

test('checkout uses verified identity, configured price and configured origin', async () => {
  let params: any; let options: any;
  const stripe = { checkout: { sessions: { create: async (p: any, o: any) => { params = p; options = o; return { id: 'cs_test_valid', url: 'https://checkout.stripe.com/c/pay/example' }; } } } } as unknown as Stripe;
  const app = express(); app.use(express.json(), identity, createBillingRouter(() => stripe)); const base = await serve(app);
  assert.equal((await post(base, '/create-checkout-session', { userId: 'victim', userEmail: 'victim@example.invalid', returnUrl: 'https://evil.example', clientCustomKey: 'valid-request-123' }, 'artist')).status, 200);
  assert.equal(params.client_reference_id, 'uid_artist'); assert.equal(params.customer_email, 'artist@example.invalid');
  assert.equal(params.subscription_data.metadata.firebaseUid, 'uid_artist');
  assert.equal(params.line_items[0].price, 'price_pro'); assert.ok(params.success_url.startsWith('https://suite.example/'));
  const firstKey = options.idempotencyKey;
  await post(base, '/create-checkout-session', { clientCustomKey: 'valid-request-123' }, 'admin');
  assert.notEqual(options.idempotencyKey, firstKey);
  assert.equal((await post(base, '/create-checkout-session', { clientCustomKey: 'valid-request-123' }, 'unverified')).status, 403);
});

test('verification requires ownership, payment, correct product, and active subscription', async () => {
  let session = checkout();
  const stripe = { checkout: { sessions: { retrieve: async () => session } } } as unknown as Stripe;
  const app = express(); app.use(express.json(), identity, createBillingRouter(() => stripe)); const base = await serve(app);
  const verify = () => post(base, '/verify-session', { sessionId: 'cs_test_valid' }, 'artist');
  assert.equal((await (await verify()).json()).valid, true);
  session = checkout({ client_reference_id: 'someone_else' }); assert.equal((await verify()).status, 403);
  for (const overrides of [
    { payment_status: 'unpaid' }, { status: 'open' }, { mode: 'payment' },
    { subscription: subscription('canceled') }, { subscription: subscription('active', 'price_other') },
  ]) {
    session = checkout(overrides as Partial<Stripe.Checkout.Session>);
    assert.equal((await (await verify()).json()).valid, false);
  }
});

test('webhooks validate raw signatures and retry failed durable writes', async () => {
  const stripe = new Stripe('sk_test_regression_not_a_real_key');
  stripe.subscriptions.retrieve = async () => subscription() as any;
  let writes = 0; let fail = false;
  const app = express(); app.post('/webhook', ...createStripeWebhook(() => stripe, async () => { if (fail) throw new Error('database unavailable'); writes++; }));
  const base = await serve(app);
  const body = JSON.stringify({ id: 'evt_local', type: 'customer.subscription.updated', created: 100, data: { object: { id: 'sub_test' } } });
  const send = (signature?: string, payload = body) => fetch(base + '/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(signature ? { 'stripe-signature': signature } : {}) }, body: payload });
  assert.equal((await send()).status, 400); assert.equal((await send('invalid')).status, 400); assert.equal(writes, 0);
  const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  assert.equal((await send(signature, body + ' ')).status, 400);
  assert.equal((await send(signature)).status, 200); assert.equal(writes, 1);
  fail = true; assert.equal((await send(signature)).status, 503);
});

test('checkout origins cannot be credentials, paths or unsafe protocols', () => {
  for (const origin of ['javascript:alert(1)', 'https://user:password@example.com', 'https://example.com/path', 'http://example.com']) assert.throws(() => getCheckoutUrls(origin));
  assert.ok(getCheckoutUrls('http://localhost:3000').cancel_url.startsWith('http://localhost:3000/'));
});
