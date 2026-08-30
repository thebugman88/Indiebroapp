import {
  PRODUCTS,
  TERMS_VERSION,
  PURCHASE_POLICY,
  type ProductId,
} from "../shared/economy";
import {
  initializePayment,
  bindCheckout,
  fulfillCheckout,
  notePaymentFailure,
  reconcilePayments,
  serviceCredit,
  recordPaymentException,
  recordInvoice,
} from "./payments";
import { economyDb, walletSnapshot } from "./economy";
import { requireAdmin } from "./auth";
import express from "express";
import { createHash } from "node:crypto";
import Stripe from "stripe";
import {
  recordSubscriptionEvent,
  getSubscriptionStatus,
} from "./subscriptions";
import { requireVerifiedEmail, type VerifiedIdentity } from "./auth";

export function paidSubscription(
  session: Stripe.Checkout.Session,
  uid: string,
  priceId: string,
): boolean {
  const sub = session.subscription as Stripe.Subscription | null;
  return (
    session.client_reference_id === uid &&
    session.mode === "subscription" &&
    session.payment_status === "paid" &&
    session.status === "complete" &&
    !!sub &&
    typeof sub !== "string" &&
    sub.status === "active" &&
    sub.items.data.some((item) => item.price.id === priceId)
  );
}

export function getCheckoutUrls(origin: string) {
  const url = new URL(origin);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  ) {
    throw new Error("APP_PUBLIC_URL must be HTTPS (except local development).");
  }
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("APP_PUBLIC_URL must be an origin only.");
  return {
    success_url: `${url.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/?payment=cancelled`,
  };
}

async function subscriptionIdsFor(uid: string): Promise<string[]> {
  const docs = await economyDb().collection("billingSubscriptions")
    .where("uid", "==", uid).get();
  return docs.docs.map(doc => doc.id);
}

export function createBillingRouter(
  getStripe: () => Stripe | null,
  loadSubscriptionIds: (uid: string) => Promise<string[]> = subscriptionIdsFor,
) {
  const router = express.Router();
  router.get("/quote/:product", requireVerifiedEmail, async (req, res) => {
    const productId = req.params.product as ProductId,
      product = Object.hasOwn(PRODUCTS, productId) ? PRODUCTS[productId] : null;
    if (!product) {
      res.status(404).json({ error: "Unknown product." });
      return;
    }
    try {
      const wallet = await walletSnapshot(res.locals.identity.uid);
      res.json({
        productId,
        ...product,
        coins: wallet.tier === "pro" ? product.proCoins : product.coins,
        termsVersion: TERMS_VERSION,
      });
    } catch {
      res.status(503).json({ error: "Purchase quote unavailable." });
    }
  });
  router.post(
    "/create-checkout-session",
    requireVerifiedEmail,
    async (req, res) => {
      const stripe = getStripe();
      const productId = (req.body?.productId || "pro") as ProductId,
        product = Object.hasOwn(PRODUCTS, productId)
          ? PRODUCTS[productId]
          : null;
      const priceId =
        productId === "pro"
          ? process.env.STRIPE_PRICE_ID_PRO
          : productId === "coins100"
            ? process.env.STRIPE_PRICE_ID_COINS100
            : process.env.STRIPE_PRICE_ID_COINS250;
      if (!product) {
        res.status(400).json({ error: "Unknown product." });
        return;
      }
      if (
        !stripe ||
        !priceId ||
        !process.env.APP_PUBLIC_URL ||
        !process.env.STRIPE_WEBHOOK_SECRET
      ) {
        res.status(503).json({
          error: "Payments are not configured. Nothing was activated.",
        });
        return;
      }
      const identity = res.locals.identity as VerifiedIdentity,
        key = req.body?.clientCustomKey;
      if (typeof key !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(key)) {
        res
          .status(400)
          .json({ error: "A valid checkout request ID is required." });
        return;
      }
      if (
        req.body?.termsVersion !== TERMS_VERSION ||
        req.body?.accepted !== true ||
        req.body?.finalConfirmed !== true
      ) {
        res
          .status(428)
          .json({ error: "Review and confirm the current purchase terms." });
        return;
      }
      let order: any;
      try {
        const price = await stripe.prices.retrieve(priceId);
        if (
          !price.active ||
          price.currency !== "usd" ||
          price.unit_amount !== product.cents ||
          (product.recurring
            ? price.recurring?.interval !== "month" ||
              price.recurring.interval_count !== 1
            : !!price.recurring)
        )
          throw new Error(
            "Configured Stripe price does not match the displayed offer.",
          );
        if (
          productId === "pro" &&
          (await getSubscriptionStatus(identity.uid)).valid
        ) {
          res.status(409).json({
            error: "Artist Pro is already active. Manage it in billing.",
          });
          return;
        }
        order = await initializePayment(
          identity.uid,
          key,
          productId,
          req.body.expectedCoins,
        );
        if (
          [
            "fulfilled",
            "service_credited",
            "expired",
            "refunded",
            "disputed",
          ].includes(order.status)
        ) {
          res.status(409).json({
            error:
              "This purchase request is already closed. Review the records, then start a new purchase.",
            code: "NEW_REQUEST_REQUIRED",
          });
          return;
        }
        if (order.sessionId && order.url) {
          res.json({
            success: true,
            sessionId: order.sessionId,
            url: order.url,
          });
          return;
        }
        if (Date.now() - order.createdAt > 1700000) {
          await economyDb()
            .doc(`paymentOrders/${order.id}`)
            .update({ needsReview: true });
          res.status(409).json({
            error:
              "This checkout needs reconciliation before a new purchase can begin. Open Plan & Coins.",
          });
          return;
        }
        await economyDb().doc(`paymentOrders/${order.id}`).update({ priceId });
        const urls = getCheckoutUrls(process.env.APP_PUBLIC_URL);
        const metadata = {
          firebaseUid: identity.uid,
          orderId: order.id,
          termsVersion: TERMS_VERSION,
          productId,
        };
        const session = await stripe.checkout.sessions.create(
          {
            mode: product.recurring ? "subscription" : "payment",
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: identity.email,
            client_reference_id: identity.uid,
            metadata,
            ...(product.recurring ? { subscription_data: { metadata } } : {}),
            consent_collection: { terms_of_service: "required" },
            custom_text: {
              submit: {
                message:
                  "AI outputs may be inaccurate and satisfaction varies. Sales are final except as required by law. Eligible discretionary remedies are Brotherhood Coins; statutory and payment-provider rights remain. " +
                  (product.recurring
                    ? "Renews at $4.99 USD/month until canceled in Plan & Coins."
                    : "One-time Coin purchase; purchased Coins do not expire."),
              },
              terms_of_service_acceptance: {
                message: `I agree to the [Purchase Terms](${process.env.APP_PUBLIC_URL}/api/legal/terms).`,
              },
            },
            expires_at: Math.floor(order.createdAt / 1000) + 3600,
            ...urls,
          },
          { idempotencyKey: order.id },
        );
        if (!session.url) throw new Error("Checkout URL unavailable.");
        await bindCheckout(order.id, session);
        res.json({ success: true, sessionId: session.id, url: session.url });
      } catch {
        if (order) await notePaymentFailure(order.id).catch(() => {});
        res.status(502).json({
          error:
            "Unable to confirm checkout. Retry with the same request ID; no delivery is assumed.",
        });
      }
    },
  );
  router.get("/invoices", requireVerifiedEmail, async (_req, res) => {
    try {
      const docs = await economyDb()
        .collection("invoicePayments")
        .where("uid", "==", res.locals.identity.uid)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      res.json(docs.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      res.status(503).json({ error: "Invoice history unavailable." });
    }
  });
  router.get("/orders", requireVerifiedEmail, async (_req, res) => {
    try {
      const docs = await economyDb()
        .collection("paymentOrders")
        .where("uid", "==", res.locals.identity.uid)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      res.json(
        docs.docs.map((d) => {
          const { url, ...order } = d.data();
          return { id: d.id, ...order };
        }),
      );
    } catch {
      res.status(503).json({ error: "Payment history unavailable." });
    }
  });
  router.post("/reconcile", requireVerifiedEmail, async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.sendStatus(503);
      return;
    }
    try {
      const id = req.body?.orderId;
      if (typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) {
        res.sendStatus(400);
        return;
      }
      const order = (await economyDb().doc(`paymentOrders/${id}`).get()).data();
      if (!order || order.uid !== res.locals.identity.uid) {
        res.sendStatus(404);
        return;
      }
      if (order.sessionId)
        await fulfillCheckout(
          stripe,
          await stripe.checkout.sessions.retrieve(order.sessionId),
        );
      res.json({ success: true });
    } catch {
      res.status(503).json({
        error: "Recovery remains pending. No additional charge was made.",
      });
    }
  });
  router.post("/cancel", requireVerifiedEmail, async (_req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.sendStatus(503);
      return;
    }
    try {
      const uid = res.locals.identity.uid;
      const ids = await loadSubscriptionIds(uid);
      if (!ids.length) {
        res.status(409).json({ error: "No subscription record was found. Cancellation cannot be confirmed; contact support if you have a subscription." });
        return;
      }
      // Local webhook state can be stale. Retrieve every mapped subscription,
      // and verify every owner before performing any cancellation.
      const subscriptions = await Promise.all(ids.map(id => stripe.subscriptions.retrieve(id)));
      for (const sub of subscriptions) {
        if (sub.metadata.firebaseUid !== uid)
          throw new Error("Ownership mismatch");
      }
      for (const sub of subscriptions) {
        if (sub.status === "canceled" || sub.status === "incomplete_expired") continue;
        if (sub.status === "active" || sub.status === "trialing") {
          const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
          if (!updated.cancel_at_period_end && updated.status !== "canceled")
            throw new Error("Stripe did not confirm scheduled cancellation.");
        } else if (["past_due", "unpaid", "incomplete", "paused"].includes(sub.status)) {
          // Stop dunning for subscriptions without active paid access. Do not
          // generate prorations, a final invoice, or a refund as a side effect.
          const canceled = await stripe.subscriptions.cancel(sub.id, { prorate: false, invoice_now: false });
          if (canceled.status !== "canceled") throw new Error("Stripe did not confirm cancellation.");
        } else {
          throw new Error("Unsupported subscription status.");
        }
      }
      res.json({
        success: true,
        message:
          "Stripe confirmed cancellation or scheduled cancellation for your recorded subscriptions. Active paid access continues through its paid period; unpaid subscriptions are canceled immediately. This does not refund or forgive existing charges.",
      });
    } catch {
      res.status(503).json({
        error:
          "Cancellation was not confirmed. Please retry or contact support.",
      });
    }
  });
  router.post("/admin/reconcile", requireAdmin, async (_req, res) => {
    try {
      const stripe = getStripe();
      if (!stripe) throw new Error();
      await reconcilePayments(stripe);
      res.json({ success: true });
    } catch {
      res.sendStatus(503);
    }
  });
  router.post("/admin/service-credit", requireAdmin, async (req, res) => {
    try {
      if (
        typeof req.body?.reason !== "string" ||
        req.body.reason.length < 10 ||
        req.body.reason.length > 1000 ||
        !/^[a-f0-9]{64}$/.test(req.body.orderId)
      )
        throw new Error("Provide an order and review reason.");
      res.json(
        await serviceCredit(
          req.body.orderId,
          res.locals.identity.uid,
          req.body.reason,
        ),
      );
    } catch (e: any) {
      res.status(409).json({ error: e.message });
    }
  });
  router.post("/verify-session", async (req, res) => {
    const sessionId = req.body?.sessionId;
    if (
      typeof sessionId !== "string" ||
      !/^cs_(test_|live_)?[a-zA-Z0-9]+$/.test(sessionId)
    ) {
      res.status(400).json({
        valid: false,
        tier: "free",
        error: "Invalid checkout session.",
      });
      return;
    }
    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRICE_ID_PRO;
    if (!stripe || !priceId) {
      res.status(503).json({
        valid: false,
        tier: "free",
        error: "Payment verification is unavailable.",
      });
      return;
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });
      const identity = res.locals.identity as VerifiedIdentity;
      if (session.client_reference_id !== identity.uid) {
        res.status(403).json({
          valid: false,
          tier: "free",
          error: "This checkout does not belong to your account.",
        });
        return;
      }
      if (session.metadata?.orderId) {
        if (session.mode === "subscription" && session.subscription) {
          const sid =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          await recordSubscriptionEvent(
            {
              id: `verify_${session.id}`,
              created: session.created,
            } as Stripe.Event,
            await stripe.subscriptions.retrieve(sid),
          );
        }
        await fulfillCheckout(stripe, session);
        const order = (
          await economyDb()
            .doc(`paymentOrders/${session.metadata.orderId}`)
            .get()
        ).data();
        if (session.mode === "payment") {
          res.json({
            valid:
              order?.status === "fulfilled" ||
              order?.status === "service_credited",
            tier: "coins",
            status: order?.status,
          });
          return;
        }
      }
      const valid = paidSubscription(session, identity.uid, priceId);
      const sub = session.subscription as Stripe.Subscription | null;
      const item =
        sub && typeof sub !== "string"
          ? sub.items.data.find((item) => item.price.id === priceId)
          : undefined;
      res.json({
        valid,
        tier: valid ? "pro" : "free",
        status: valid ? "active" : "pending",
        expiresAt:
          valid && item?.current_period_end
            ? item.current_period_end * 1000
            : null,
      });
    } catch {
      res.status(502).json({
        valid: false,
        tier: "free",
        error: "Unable to verify payment. Please try again.",
      });
    }
  });
  router.get("/subscription", async (_req, res) => {
    try {
      res.json(await getSubscriptionStatus(res.locals.identity.uid));
    } catch {
      res.status(503).json({
        valid: false,
        tier: "free",
        error: "Subscription status is unavailable.",
      });
    }
  });
  return router;
}

export function createStripeWebhook(
  getStripe: () => Stripe | null,
  recordEvent: typeof recordSubscriptionEvent = recordSubscriptionEvent,
): express.RequestHandler[] {
  return [
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe();
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripe || !secret) {
        res
          .status(503)
          .json({ error: "Webhook verification is not configured." });
        return;
      }
      const signature = req.get("stripe-signature");
      if (!signature) {
        res.status(400).json({ error: "A Stripe signature is required." });
        return;
      }
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, secret);
      } catch {
        res.status(400).json({ error: "Invalid Stripe signature." });
        return;
      }
      try {
        if (
          [
            "customer.subscription.created",
            "customer.subscription.updated",
            "customer.subscription.deleted",
          ].includes(event.type)
        ) {
          const object = event.data.object as Stripe.Subscription;
          // Read current Stripe state so delayed notifications don't restore obsolete access.
          const subscription = await stripe.subscriptions.retrieve(object.id);
          await recordEvent(event, subscription);
        } else if (
          event.type === "checkout.session.completed" ||
          event.type === "checkout.session.async_payment_succeeded"
        ) {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === "subscription" && session.subscription) {
            const id =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;
            await recordEvent(event, await stripe.subscriptions.retrieve(id));
          }
          if (session.metadata?.orderId) await fulfillCheckout(stripe, session);
        }
        if (
          [
            "invoice.created",
            "invoice.finalized",
            "invoice.paid",
            "invoice.payment_failed",
          ].includes(event.type)
        )
          await recordInvoice(stripe, event);
        if (event.type === "charge.refunded")
          await recordPaymentException(
            event.data.object as Stripe.Charge,
            "refunded",
          );
        if (event.type === "charge.dispute.created") {
          const dispute = event.data.object as Stripe.Dispute;
          const charge = await stripe.charges.retrieve(
            typeof dispute.charge === "string"
              ? dispute.charge
              : dispute.charge.id,
          );
          await recordPaymentException(charge, "disputed");
        }
        res.json({ received: true });
      } catch {
        // Stripe retries non-2xx responses; never acknowledge a lost entitlement update.
        res.status(503).json({
          error: "Subscription update could not be persisted. Retry required.",
        });
      }
    },
  ];
}
