import React, { useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "../services/authService";
import {
  PURCHASE_POLICY,
  TERMS_VERSION,
  type ProductId,
} from "../../shared/economy";

export function requestPurchase(productId: ProductId = "pro") {
  window.dispatchEvent(new CustomEvent("ib-purchase", { detail: productId }));
}
export function PurchaseDialog() {
  const [product, setProduct] = useState<ProductId | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef("");
  const dialog = useRef<HTMLElement>(null);
  const close = () => {
    if (!busy) setProduct(null);
  };
  useEffect(() => {
    const open = (event: Event) => {
      setProduct((event as CustomEvent).detail);
      setQuote(null);
      setStep(1);
      setAccepted(false);
      setError("");
    };
    const signOut = () => setProduct(null);
    window.addEventListener("ib-purchase", open);
    window.addEventListener("ib_auth_changed", signOut);
    return () => {
      window.removeEventListener("ib-purchase", open);
      window.removeEventListener("ib_auth_changed", signOut);
    };
  }, []);
  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    // Retain the request ID across uncertain network responses; never silently start a second charge.
    requestId.current =
      sessionStorage.getItem(`ib-checkout-${product}`) || crypto.randomUUID();
    sessionStorage.setItem(`ib-checkout-${product}`, requestId.current);
    authenticatedFetch(`/api/stripe/quote/${product}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (!cancelled) setQuote(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [product]);
  useEffect(() => {
    if (!product) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setProduct(null);
      if (e.key === "Tab" && dialog.current) {
        const nodes = Array.from(
          dialog.current.querySelectorAll<HTMLElement>(
            "button:not([disabled]),a[href],input:not([disabled])",
          ),
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", escape);
      previousFocus?.focus();
    };
  }, [product, busy]);
  if (!product) return null;
  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const r = await authenticatedFetch(
        "/api/stripe/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product,
            clientCustomKey: requestId.current,
            termsVersion: TERMS_VERSION,
            accepted: true,
            finalConfirmed: true,
            expectedCoins: quote.coins,
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) {
        if (data.code === "NEW_REQUEST_REQUIRED") {
          sessionStorage.removeItem(`ib-checkout-${product}`);
          requestId.current = crypto.randomUUID();
          sessionStorage.setItem(`ib-checkout-${product}`, requestId.current);
          setStep(1);
          setAccepted(false);
        }
        throw new Error(data.error || "Checkout unavailable.");
      }
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
        throw new Error("Unexpected checkout destination.");
      window.location.assign(url.href);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4">
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
        className="bg-zinc-950 border border-amber-500/50 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-auto text-zinc-200 space-y-4"
      >
        <div className="flex justify-between gap-4">
          <h2 id="purchase-title" className="text-xl font-bold text-amber-400">
            {step === 1
              ? "Review purchase terms"
              : "Final purchase confirmation"}
          </h2>
          <button
            autoFocus
            onClick={close}
            disabled={busy}
            aria-label="Close purchase"
          >
            ✕
          </button>
        </div>
        {quote && (
          <p className="font-bold">
            {product === "pro"
              ? "Artist Pro · 1,500 BC/month · 10 GB"
              : `${quote.coins} Brotherhood Coins`}{" "}
            — ${(quote.cents / 100).toFixed(2)} USD
            {quote.recurring
              ? "/month, automatically renewing until canceled"
              : ", one time"}
            . Any tax appears in Stripe before payment.
          </p>
        )}
        <div className="text-sm space-y-3 max-h-64 overflow-auto border border-zinc-800 p-3 rounded-lg">
          {PURCHASE_POLICY.split("\n\n").map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <a
          href="/api/legal/terms"
          target="_blank"
          rel="noreferrer"
          className="text-amber-300 underline text-sm"
        >
          Open purchase terms ({TERMS_VERSION})
        </a>
        <label className="flex gap-3 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          {step === 1
            ? "I have read the AI limitations, final-sale policy, Coin remedies, and legal exceptions."
            : `I confirm this ${quote?.recurring ? "recurring subscription" : "one-time purchase"} and accept the purchase terms. Required legal and payment-provider rights remain.`}
        </label>
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <button
          disabled={!quote || !accepted || busy}
          className="w-full rounded-lg bg-amber-400 text-black p-3 font-bold disabled:opacity-40"
          onClick={() => {
            if (step === 1) {
              setStep(2);
              setAccepted(false);
            } else void checkout();
          }}
        >
          {busy
            ? "Opening secure checkout…"
            : step === 1
              ? "Continue to final review"
              : "Accept and continue to Stripe"}
        </button>
        <p className="text-xs text-zinc-400">
          Stripe asks you to accept the terms again immediately before payment.
          No purchase is delivered from a browser success message alone.
        </p>
      </section>
    </div>
  );
}
