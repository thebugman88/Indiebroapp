import { getFirestore } from 'firebase-admin/firestore';
import type Stripe from 'stripe';
import { getFirebaseAdminApp } from './auth';

// Server-only collections: clients must never write these documents.
export async function recordSubscriptionEvent(event: Stripe.Event, subscription: Stripe.Subscription) {
  const uid = subscription.metadata.firebaseUid;
  if (!uid) throw new Error('Subscription has no verified suite account mapping.');
  const db = getFirestore(getFirebaseAdminApp());
  const eventRef = db.collection('billingEvents').doc(event.id);
  const subRef = db.collection('billingSubscriptions').doc(subscription.id);
  await db.runTransaction(async transaction => {
    const [seen, previous] = await Promise.all([transaction.get(eventRef), transaction.get(subRef)]);
    if (seen.exists) return;
    const old = previous.data();
    if (!old || (old.eventCreated <= event.created && old.status !== 'canceled')) {
      transaction.set(subRef, {
        uid, status: subscription.status, eventCreated: event.created,
        updatedAt: Date.now(), customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
        items: subscription.items.data.map(item => ({ priceId: item.price.id, expiresAt: item.current_period_end * 1000 })),
      });
    }
    transaction.create(eventRef, { subscriptionId: subscription.id, uid, eventCreated: event.created, processedAt: Date.now() });
  });
}

export async function getSubscriptionStatus(uid: string) {
  const snapshot = await getFirestore(getFirebaseAdminApp()).collection('billingSubscriptions').where('uid', '==', uid).get();
  const now = Date.now();
  let expiresAt = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.status !== 'active') continue;
    for (const item of data.items || []) {
      if (item.priceId === process.env.STRIPE_PRICE_ID_PRO && item.expiresAt > now) expiresAt = Math.max(expiresAt, item.expiresAt);
    }
  }
  return { valid: expiresAt > now, tier: expiresAt > now ? 'pro' : 'free', expiresAt: expiresAt || null };
}
