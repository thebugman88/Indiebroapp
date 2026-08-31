import { recoverUploads } from "./judgement";
import Stripe from "stripe";
import {
  economyDb,
  withWallet,
  keyFor,
  walletSnapshot,
  recoverExpiredUsage,
  purgeExpiredPrivateResults,
} from "./economy";
import {
  PRODUCTS,
  TERMS_VERSION,
  ECONOMY_VERSION,
  type ProductId,
} from "../shared/economy";
import {
  getSubscriptionStatus,
  recordSubscriptionEvent,
} from "./subscriptions";
export async function initializePayment(
  uid: string,
  requestId: string,
  productId: ProductId,
  expectedCoins: number,
) {
  return withWallet(uid, async (_w, t, pro, hasOpenSubscription) => {
    const product = PRODUCTS[productId];
    if (productId === "pro" && hasOpenSubscription)
      throw new Error("Artist Pro is already active.");
    const coins = pro ? product.proCoins : product.coins;
    if (expectedCoins !== coins)
      throw new Error("Your Coin quote changed. Review the purchase again.");
    const id = keyFor(uid, requestId),
      ref = economyDb().doc(`paymentOrders/${id}`),
      old = await t.get(ref);
    const lock = economyDb().doc(`subscriptionCheckoutLocks/${uid}`);
    if (productId === "pro") {
      const held = await t.get(lock);
      if (held.exists && held.data()!.orderId !== id) {
        const pending = await t.get(
          economyDb().doc(`paymentOrders/${held.data()!.orderId}`),
        );
        if (
          pending.exists &&
          ["initialized", "processing", "paid_pending_delivery"].includes(
            pending.data()!.status,
          )
        )
          return { id: pending.id, ...pending.data() } as any;
      }
    }
    if (old.exists) {
      if (old.data()!.productId !== productId)
        throw new Error("Purchase request ID conflict.");
      return { id, ...old.data() } as any;
    }
    const record = {
      uid,
      productId,
      cents: product.cents,
      currency: "usd",
      coins,
      termsVersion: TERMS_VERSION,
      economyVersion: ECONOMY_VERSION,
      acceptedAt: Date.now(),
      status: "initialized",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempts: 0,
    };
    if (productId === "pro") t.set(lock, { orderId: id });
    t.create(ref, record);
    t.create(ref.collection("events").doc("initialized"), {
      stage: "initiated",
      at: Date.now(),
      termsVersion: TERMS_VERSION,
    });
    return { id, ...record };
  });
}
export async function bindCheckout(
  orderId: string,
  session: Stripe.Checkout.Session,
) {
  const ref = economyDb().doc(`paymentOrders/${orderId}`);
  await economyDb().runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) throw new Error("Missing payment record.");
    if (doc.data()!.sessionId && doc.data()!.sessionId !== session.id)
      throw new Error("Checkout conflict.");
    t.update(ref, {
      sessionId: session.id,
      url: session.url,
      status:
        doc.data()!.status === "initialized"
          ? "processing"
          : doc.data()!.status,
      updatedAt: Date.now(),
    });
    t.set(ref.collection("events").doc("processing"), {
      stage: "processing",
      sessionId: session.id,
      at: Date.now(),
    });
  });
}
export async function notePaymentFailure(orderId: string) {
  await economyDb().doc(`paymentOrders/${orderId}`).set(
    {
      lastError:
        "Checkout could not be confirmed; retry with the same request ID.",
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}
export async function fulfillCheckout(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const ref = economyDb().doc(`paymentOrders/${orderId}`),
    doc = await ref.get();
  if (!doc.exists) throw new Error("Missing initialized payment.");
  const order = doc.data()!;
  if (
    session.client_reference_id !== order.uid ||
    session.metadata?.firebaseUid !== order.uid ||
    session.currency !== "usd" ||
    session.amount_subtotal !== order.cents
  )
    throw new Error("Payment details do not match the accepted order.");
  if (session.payment_status !== "paid" || session.status !== "complete")
    return;
  if (
    session.mode !== (order.productId === "pro" ? "subscription" : "payment") ||
    session.consent?.terms_of_service !== "accepted"
  )
    throw new Error("Purchase mode or final Stripe consent is missing.");
  const items = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
  });
  if (
    items.data.length !== 1 ||
    items.data[0].quantity !== 1 ||
    items.data[0].price?.id !== order.priceId
  )
    throw new Error("Unexpected purchased product.");
  await economyDb().runTransaction(async (t) => {
    const current = await t.get(ref);
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    const exception = intent
      ? await t.get(economyDb().doc(`paymentExceptions/${intent}`))
      : null;
    if (
      ["fulfilled", "service_credited", "refunded", "disputed"].includes(
        current.data()!.status,
      )
    )
      return;
    if (exception?.exists) {
      t.update(ref, {
        status: exception.data()!.status,
        needsReview: true,
        updatedAt: Date.now(),
      });
      return;
    }
    t.update(ref, {
      status: "paid_pending_delivery",
      sessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      receivedAt: Date.now(),
      updatedAt: Date.now(),
    });
    t.set(ref.collection("events").doc("received"), {
      stage: "payment_received",
      sessionId: session.id,
      at: Date.now(),
    });
  });
  if (["refunded", "disputed"].includes((await ref.get()).data()!.status))
    return;
  if (order.productId === "pro") {
    if (!session.subscription) throw new Error("Subscription missing.");
    const sub = await stripe.subscriptions.retrieve(
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id,
    );
    if (sub.metadata.firebaseUid !== order.uid)
      throw new Error("Subscription ownership mismatch.");
    await recordSubscriptionEvent(
      {
        id: `reconcile_${session.id}_${sub.status}_${sub.items.data[0]?.current_period_end}`,
        created: Math.floor(Date.now() / 1000),
      } as Stripe.Event,
      sub,
    );
    if (!(await getSubscriptionStatus(order.uid)).valid)
      throw new Error("Subscription delivery is not yet confirmed.");
  }
  await withWallet(order.uid, async (w, t) => {
    const current = await t.get(ref);
    if (
      ["fulfilled", "service_credited", "refunded", "disputed"].includes(
        current.data()!.status,
      )
    )
      return;
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    const exception = intent
      ? await t.get(economyDb().doc(`paymentExceptions/${intent}`))
      : null;
    if (exception?.exists) {
      t.update(ref, {
        status: exception.data()!.status,
        needsReview: true,
        updatedAt: Date.now(),
      });
      return;
    }
    const receipt = economyDb().doc(
        `coinLedger/${keyFor("purchase", session.id)}`,
      ),
      old = await t.get(receipt);
    if (old.exists) return;
    w.purchased += order.coins;
    t.create(receipt, {
      uid: order.uid,
      orderId,
      sessionId: session.id,
      amount: order.coins,
      reason:
        order.productId === "pro"
          ? "subscription access and monthly allowance"
          : "purchased Coins",
      createdAt: Date.now(),
    });
    t.update(ref, {
      status: "fulfilled",
      fulfilledAt: Date.now(),
      updatedAt: Date.now(),
      lastError: null,
    });
    t.set(ref.collection("events").doc("fulfilled"), {
      stage: "product_delivered",
      coins: order.coins,
      at: Date.now(),
    });
  });
}
export async function reconcilePayments(stripe: Stripe) {
  const recoveries = await Promise.allSettled([
    recoverExpiredUsage(),
    recoverUploads(),
  ]);
  for (const recovery of recoveries)
    if (recovery.status === "rejected")
      console.warn(
        "[Payment monitor] Usage or storage recovery pending; continuing payment checks.",
      );
  const docs = await economyDb()
    .collection("paymentOrders")
    .where("status", "in", [
      "initialized",
      "processing",
      "paid_pending_delivery",
    ])
    .orderBy("updatedAt", "asc")
    .limit(50)
    .get();
  for (const doc of docs.docs) {
    const order = doc.data();
    if (!order.sessionId) {
      try {
        let found: Stripe.Checkout.Session | undefined;
        let exhausted = false;
        let after: string | undefined;
        for (let page = 0; page < 10; page++) {
          const sessions = await stripe.checkout.sessions.list({
            created: {
              gte: Math.floor(order.createdAt / 1000) - 10,
              lte: Math.floor(order.createdAt / 1000) + 3600,
            },
            limit: 100,
            ...(after ? { starting_after: after } : {}),
          });
          found = sessions.data.find((s) => s.metadata?.orderId === doc.id);
          if (found) break;
          if (!sessions.has_more) {
            exhausted = true;
            break;
          }
          after = sessions.data.at(-1)?.id;
        }
        if (found) {
          await bindCheckout(doc.id, found);
          await fulfillCheckout(stripe, found);
        } else if (exhausted && Date.now() - order.createdAt > 3900000) {
          await doc.ref.update({ status: "expired", updatedAt: Date.now() });
        } else
          await doc.ref.update({
            updatedAt: Date.now(),
            needsReview: Date.now() - order.createdAt > 3600000,
          });
      } catch {
        await doc.ref.update({ updatedAt: Date.now(), needsReview: true });
      }
      continue;
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(order.sessionId);
      await fulfillCheckout(stripe, session);
      if (session.status === "expired")
        await doc.ref.update({ status: "expired", updatedAt: Date.now() });
      else await doc.ref.update({ updatedAt: Date.now() });
    } catch {
      await doc.ref.update({
        attempts: (order.attempts || 0) + 1,
        needsReview: (order.attempts || 0) >= 2,
        lastError:
          "Delivery needs reconciliation; no additional charge was made.",
        updatedAt: Date.now(),
      });
    }
  }
}
export function startPaymentMonitor(getStripe: () => Stripe | null) {
  let busy = false;
  const run = async () => {
    if (busy) return;
    busy = true;
    try {
      await purgeExpiredPrivateResults().catch(()=>console.warn('[Privacy cleanup] Cleanup unavailable; expired content remains inaccessible.'));
      const stripe = getStripe();
      if (stripe) await reconcilePayments(stripe);
      else {
        await recoverExpiredUsage();
        await recoverUploads();
      }
    } catch {
      console.warn(
        "[Payment monitor] Reconciliation unavailable; durable pending records retained.",
      );
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(run, 60000);
  timer.unref();
  return () => clearInterval(timer);
}
export async function serviceCredit(
  orderId: string,
  adminUid: string,
  reason: string,
) {
  const ref = economyDb().doc(`paymentOrders/${orderId}`),
    order = (await ref.get()).data();
  if (!order) throw new Error("Order not found.");
  if (order.productId === "pro")
    throw new Error(
      "Subscription exceptions require individual review; repair access or process any required original-method refund.",
    );
  return withWallet(order.uid, async (w, t) => {
    const current = await t.get(ref);
    if (current.data()!.status === "service_credited")
      return { alreadyCredited: true };
    if (current.data()!.status !== "paid_pending_delivery")
      throw new Error("Only verified paid, undelivered orders qualify.");
    const intent = current.data()!.paymentIntentId;
    if (
      intent &&
      (await t.get(economyDb().doc(`paymentExceptions/${intent}`))).exists
    )
      throw new Error("Payment exception requires review.");
    w.purchased += order.coins;
    t.update(ref, {
      status: "service_credited",
      fulfilledAt: Date.now(),
      updatedAt: Date.now(),
    });
    t.create(ref.collection("events").doc("service_credit"), {
      stage: "service_credit",
      coins: order.coins,
      adminUid,
      reason,
      at: Date.now(),
    });
    return { coins: order.coins };
  });
}

export async function recordPaymentException(
  charge: Stripe.Charge,
  status: "refunded" | "disputed",
) {
  const intent =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!intent) return;
  await economyDb()
    .doc(`paymentExceptions/${intent}`)
    .set(
      {
        status,
        chargeId: charge.id,
        amountRefunded: charge.amount_refunded || 0,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  const docs = await economyDb()
    .collection("paymentOrders")
    .where("paymentIntentId", "==", intent)
    .get();
  for (const doc of docs.docs) {
    const order = doc.data();
    await withWallet(order.uid, async (w, t) => {
      const current = await t.get(doc.ref);
      const event = doc.ref
        .collection("events")
        .doc(`${status}_${charge.id}_${charge.amount_refunded || 0}`);
      if ((await t.get(event)).exists) return;
      const target =
        status === "refunded"
          ? Math.floor(
              order.coins *
                Math.min(
                  1,
                  (charge.amount_refunded || 0) / Math.max(1, charge.amount),
                ),
            )
          : order.coins;
      const amount = current.data()!.fulfilledAt
          ? Math.max(0, target - (current.data()!.coinsReversed || 0))
          : 0,
        removed = Math.min(Math.max(0, w.purchased), amount);
      w.purchased -= removed;
      t.update(doc.ref, {
        status,
        coinsReversed: (current.data()!.coinsReversed || 0) + removed,
        needsReview: removed < amount,
        updatedAt: Date.now(),
      });
      t.create(event, {
        stage: status,
        removedCoins: removed,
        requiredCoins: amount,
        at: Date.now(),
      });
    });
  }
}

export async function recordInvoice(stripe: Stripe, event: Stripe.Event) {
  const invoice = await stripe.invoices.retrieve(
    (event.data.object as Stripe.Invoice).id,
  );
  const link = invoice.parent?.subscription_details?.subscription;
  if (!link) return;
  const sub = await stripe.subscriptions.retrieve(
    typeof link === "string" ? link : link.id,
  );
  const uid = sub.metadata.firebaseUid;
  if (!uid) return;
  await recordSubscriptionEvent(event, sub);
  const ref = economyDb().doc(`invoicePayments/${invoice.id}`);
  await economyDb().runTransaction(async (t) => {
    const old = await t.get(ref);
    const receipt = ref.collection("events").doc(event.id);
    if ((await t.get(receipt)).exists) return;
    t.set(ref, {
      uid,
      subscriptionId: sub.id,
      currency: invoice.currency,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      status: invoice.status,
      createdAt: invoice.created * 1000,
      updatedAt: Date.now(),
      needsReview:
        invoice.status === "open" && event.type === "invoice.payment_failed",
    });
    t.create(receipt, {
      stage:
        event.type === "invoice.paid"
          ? "payment_received"
          : event.type === "invoice.payment_failed"
            ? "payment_failed"
            : event.type === "invoice.created"
              ? "initiated"
              : "processing",
      at: Date.now(),
      stripeEventCreated: event.created,
    });
  });
  // A paid renewal restores access from verified Stripe state. Calendar monthly Coins refresh lazily.
  if (invoice.status === "paid") await walletSnapshot(uid);
}
