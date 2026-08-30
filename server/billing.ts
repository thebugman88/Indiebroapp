import express from 'express';
import { createHash } from 'node:crypto';
import Stripe from 'stripe';
import { recordSubscriptionEvent, getSubscriptionStatus } from './subscriptions';
import { requireVerifiedEmail, type VerifiedIdentity } from './auth';

export function paidSubscription(session: Stripe.Checkout.Session, uid: string, priceId: string): boolean {
  const sub = session.subscription as Stripe.Subscription | null;
  return session.client_reference_id === uid && session.mode === 'subscription'
    && session.payment_status === 'paid' && session.status === 'complete'
    && !!sub && typeof sub !== 'string' && sub.status === 'active'
    && sub.items.data.some(item => item.price.id === priceId);
}

export function getCheckoutUrls(origin: string) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    throw new Error('APP_PUBLIC_URL must be HTTPS (except local development).');
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('APP_PUBLIC_URL must be an origin only.');
  return {
    success_url: `${url.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/?payment=cancelled`,
  };
}

export function createBillingRouter(getStripe: () => Stripe | null) {
  const router = express.Router();
  router.post('/create-checkout-session', requireVerifiedEmail, async (req, res) => {
    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!stripe || !priceId || !process.env.APP_PUBLIC_URL || !process.env.STRIPE_WEBHOOK_SECRET) {
      res.status(503).json({ error: 'Payments are not configured. No subscription was activated.' }); return;
    }
    const identity = res.locals.identity as VerifiedIdentity;
    const key = req.body?.clientCustomKey;
    if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(key)) {
      res.status(400).json({ error: 'A valid checkout request ID is required.' }); return;
    }
    try {
      const urls = getCheckoutUrls(process.env.APP_PUBLIC_URL);
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }],
        customer_email: identity.email, client_reference_id: identity.uid,
        metadata: { firebaseUid: identity.uid },
        subscription_data: { metadata: { firebaseUid: identity.uid } },
        ...urls,
      }, { idempotencyKey: createHash('sha256').update(`${identity.uid}:${key}`).digest('hex') });
      if (!session.url) throw new Error('Checkout URL unavailable.');
      res.json({ success: true, sessionId: session.id, url: session.url });
    } catch {
      res.status(502).json({ error: 'Unable to start checkout. No subscription was activated.' });
    }
  });
  router.post('/verify-session', async (req, res) => {
    const sessionId = req.body?.sessionId;
    if (typeof sessionId !== 'string' || !/^cs_(test_|live_)?[a-zA-Z0-9]+$/.test(sessionId)) {
      res.status(400).json({ valid: false, tier: 'free', error: 'Invalid checkout session.' }); return;
    }
    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!stripe || !priceId) {
      res.status(503).json({ valid: false, tier: 'free', error: 'Payment verification is unavailable.' }); return;
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
      const identity = res.locals.identity as VerifiedIdentity;
      if (session.client_reference_id !== identity.uid) {
        res.status(403).json({ valid: false, tier: 'free', error: 'This checkout does not belong to your account.' }); return;
      }
      const valid = paidSubscription(session, identity.uid, priceId);
      const sub = session.subscription as Stripe.Subscription | null;
      const item = sub && typeof sub !== 'string' ? sub.items.data.find(item => item.price.id === priceId) : undefined;
      res.json({ valid, tier: valid ? 'pro' : 'free', status: valid ? 'active' : 'pending',
        expiresAt: valid && item?.current_period_end ? item.current_period_end * 1000 : null,
      });
    } catch {
      res.status(502).json({ valid: false, tier: 'free', error: 'Unable to verify payment. Please try again.' });
    }
  });
  router.get('/subscription', async (_req, res) => {
    try { res.json(await getSubscriptionStatus(res.locals.identity.uid)); }
    catch { res.status(503).json({ valid: false, tier: 'free', error: 'Subscription status is unavailable.' }); }
  });
  return router;
}

export function createStripeWebhook(
  getStripe: () => Stripe | null,
  recordEvent: typeof recordSubscriptionEvent = recordSubscriptionEvent,
): express.RequestHandler[] {
  return [express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) { res.status(503).json({ error: 'Webhook verification is not configured.' }); return; }
    const signature = req.get('stripe-signature');
    if (!signature) { res.status(400).json({ error: 'A Stripe signature is required.' }); return; }
    let event: Stripe.Event;
    try { event = stripe.webhooks.constructEvent(req.body, signature, secret); }
    catch { res.status(400).json({ error: 'Invalid Stripe signature.' }); return; }
    try {
      if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
        const object = event.data.object as Stripe.Subscription;
        // Read current Stripe state so delayed notifications don't restore obsolete access.
        const subscription = await stripe.subscriptions.retrieve(object.id);
        await recordEvent(event, subscription);
      } else if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          await recordEvent(event, await stripe.subscriptions.retrieve(id));
        }
      }
      res.json({ received: true });
    } catch {
      // Stripe retries non-2xx responses; never acknowledge a lost entitlement update.
      res.status(503).json({ error: 'Subscription update could not be persisted. Retry required.' });
    }
  }];
}
