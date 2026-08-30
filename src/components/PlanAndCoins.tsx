import React, { useEffect, useState, useRef } from "react";
import {
  authenticatedFetch,
  getCurrentAuthUser,
} from "../services/authService";
import { AI_ACTIONS, STORAGE_PACKS, TERMS_VERSION } from "../../shared/economy";
import { requestPurchase } from "./PurchaseDialog";
const button =
  "rounded-xl bg-amber-400 px-4 py-2 text-black font-bold disabled:opacity-40";
export function PlanAndCoins({ compact = false }: { compact?: boolean }) {
  const [wallet, setWallet] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const [result, setResult] = useState("");
  const revision = useRef(0);
  async function refresh() {
    if (compact) return;
    const request = ++revision.current;
    const uid = getCurrentAuthUser().id;
    const responses = await Promise.all(
      [
        "/api/economy/wallet",
        "/api/stripe/orders",
        "/api/economy/history",
        "/api/judgement/my-uploads",
        "/api/stripe/invoices",
      ].map(async (url) => {
        const r = await authenticatedFetch(url);
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Records unavailable.");
        return data;
      }),
    );
    if (request !== revision.current || getCurrentAuthUser().id !== uid) return;
    setWallet(responses[0]);
    setOrders(responses[1]);
    setJobs(responses[2]);
    setUploads(responses[3]);
    setInvoices(responses[4]);
  }
  useEffect(() => {
    const reload = () => {
      revision.current++;
      setWallet(null);
      setOrders([]);
      setJobs([]);
      setUploads([]);
      setInvoices([]);
      setResult("");
      setMessage("");
      refresh().catch((e) => setMessage(e.message));
    };
    reload();
    window.addEventListener("ib_auth_changed", reload);
    return () => {
      revision.current++;
      window.removeEventListener("ib_auth_changed", reload);
    };
  }, [compact]);
  async function action(url: string, body?: any) {
    setBusy(true);
    setMessage("");
    try {
      const r = await authenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Request was not confirmed.");
      setMessage(
        data.message || "Recorded. Balances and delivery status refreshed.",
      );
      await refresh();
      return true;
    } catch (e: any) {
      setMessage(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="text-zinc-200 space-y-6">
      <h2 className="text-2xl font-bold text-amber-400">
        Every tool. Your pace.
      </h2>
      <p>
        All tools are available on both plans. Community participation, basic
        editing and local analysis cost no Coins. Cloud AI uses Brotherhood
        Coins (BC).
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 space-y-3">
          <h3 className="text-xl font-bold">Free · $0</h3>
          <p className="text-3xl font-bold">
            150 BC<span className="text-sm font-normal"> / month</span>
          </p>
          <p>
            1 GB uploaded-audio storage. All tools and full community access. No
            credit card required.
          </p>
        </article>
        <article className="rounded-2xl border border-amber-500 bg-zinc-900 p-5 space-y-3">
          <h3 className="text-xl font-bold">Artist Pro · $4.99/month</h3>
          <p className="text-3xl font-bold">
            1,500 BC<span className="text-sm font-normal"> / month</span>
          </p>
          <p>
            10 GB uploaded-audio storage. All tools. Bonus Coins on purchases.
            Pro badge and XP boost.
          </p>
          <button
            className={button}
            disabled={wallet?.tier === "pro"}
            onClick={() => requestPurchase("pro")}
          >
            {wallet?.tier === "pro" ? "Pro active" : "Review Artist Pro"}
          </button>
        </article>
      </div>
      <p className="text-sm text-zinc-400">
        Included Coins refill on the first of each month (UTC), without
        rollover. Upgrading raises this month’s included allowance to 1,500 BC;
        it does not add a second allowance. Included Coins are spent first.
        Purchased and service-credit Coins do not expire while your account is
        open.
      </p>
      {!compact && (
        <>
          {wallet && (
            <div className="rounded-xl bg-zinc-900 p-4 space-y-2">
              <p className="text-2xl font-bold">{wallet.total} BC available</p>
              <p>
                {wallet.monthly} included / earned · {wallet.purchased}{" "}
                non-expiring
              </p>
              <p>
                Audio storage: {(wallet.storageBytes / 1e9).toFixed(3)} /{" "}
                {(wallet.storageLimitBytes / 1e9).toFixed(0)} GB
                {wallet.storageReserved > 0
                  ? ` (${(wallet.storageReserved / 1e6).toFixed(1)} MB reserved)`
                  : ""}
              </p>
              <p className="text-sm">
                Earn 5 BC once for completing your Judge profile and 5 BC for
                each five validated Judgment reviews, capped at 50 earned BC per
                month. No Coins for self-reviews or duplicate reviews.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              className={button}
              onClick={() => requestPurchase("coins100")}
            >
              $0.99 → {wallet?.tier === "pro" ? 125 : 100} BC
            </button>
            <button
              className={button}
              onClick={() => requestPurchase("coins250")}
            >
              $1.99 → {wallet?.tier === "pro" ? 315 : 250} BC
            </button>
            <button
              className="underline"
              disabled={busy}
              onClick={() => refresh().catch((e) => setMessage(e.message))}
            >
              Refresh records
            </button>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold">Permanent storage extensions</h3>
            <p className="text-sm">
              Extensions stay purchased. Downgrades do not automatically delete
              files. Uploads pause if you exceed your quota. Browser drafts are
              not cloud backups.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STORAGE_PACKS).map(([key, pack]) => (
                <button
                  key={key}
                  disabled={busy || !wallet}
                  className={button}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Add ${pack.gb} GB permanently for ${pack.cost} BC? Subject to the purchase terms: discretionary remedies are Coins, with mandatory legal exceptions.`,
                      )
                    )
                      return;
                    if (
                      !window.confirm(
                        `Final confirmation: spend ${pack.cost} BC for +${pack.gb} GB?`,
                      )
                    )
                      return;
                    const storageKey = `ib-storage-${key}`;
                    const id =
                      sessionStorage.getItem(storageKey) || crypto.randomUUID();
                    sessionStorage.setItem(storageKey, id);
                    void action("/api/economy/storage", {
                      pack: key,
                      requestId: id,
                      termsVersion: TERMS_VERSION,
                      confirmed: true,
                    }).then((ok) => {
                      if (ok) sessionStorage.removeItem(storageKey);
                    });
                  }}
                >
                  +{pack.gb} GB · {pack.cost} BC
                </button>
              ))}
            </div>
          </div>
          {uploads.length > 0 && (
            <details>
              <summary>Manage uploaded audio</summary>
              {uploads.map((file) => (
                <p key={file.id} className="text-sm py-2">
                  {file.title} · {(file.bytes / 1e6).toFixed(1)} MB{" "}
                  <button
                    className="underline text-red-300"
                    disabled={busy}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Permanently delete this uploaded track and free its storage?",
                        )
                      )
                        return;
                      setBusy(true);
                      try {
                        const r = await authenticatedFetch(
                          `/api/judgement/tracks/${file.id}`,
                          { method: "DELETE" },
                        );
                        if (!r.ok)
                          throw new Error(
                            "Deletion was not confirmed; retry to finish releasing storage.",
                          );
                        await refresh();
                      } catch (e: any) {
                        setMessage(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Delete upload
                  </button>
                </p>
              ))}
            </details>
          )}
          {wallet?.tier === "pro" && (
            <button
              disabled={busy}
              className="underline"
              onClick={() => {
                if (
                  window.confirm(
                    "Cancel future renewal? Pro remains active through the paid period. Existing files and permanent storage extensions stay.",
                  )
                )
                  void action("/api/stripe/cancel");
              }}
            >
              Cancel future Pro renewal
            </button>
          )}
          <div className="space-y-2">
            <h3 className="font-bold">Payments and delivery</h3>
            {orders.length === 0 && (
              <p className="text-sm">No payment records loaded.</p>
            )}
            {orders.map((o) => (
              <div key={o.id} className="border-b border-zinc-800 py-2 text-sm">
                <p>
                  {o.productId} · ${(o.cents / 100).toFixed(2)} ·{" "}
                  {o.status.replaceAll("_", " ")}
                </p>
                {o.lastError && <p>{o.lastError}</p>}
                {["processing", "paid_pending_delivery"].includes(o.status) && (
                  <button
                    disabled={busy}
                    className="text-amber-300 underline"
                    onClick={() =>
                      action("/api/stripe/reconcile", { orderId: o.id })
                    }
                  >
                    Check delivery without paying again
                  </button>
                )}
              </div>
            ))}
          </div>
          {invoices.length > 0 && (
            <details>
              <summary>Subscription invoices</summary>
              {invoices.map((i) => (
                <p key={i.id} className="text-sm py-2">
                  {new Date(i.createdAt).toLocaleDateString()} ·{" "}
                  {i.currency.toUpperCase()} {(i.amountPaid / 100).toFixed(2)}{" "}
                  paid · {i.status}
                  {i.needsReview ? " · Needs review" : ""}
                </p>
              ))}
            </details>
          )}
          <div className="space-y-2">
            <h3 className="font-bold">Recent AI requests</h3>
            {jobs.map((j) => (
              <div key={j.id} className="text-sm border-b border-zinc-800 py-2">
                {AI_ACTIONS[j.path]?.name || j.path} · {j.cost} BC · {j.status}
                {j.status === "delivered" && (
                  <button
                    className="ml-3 underline text-amber-300"
                    onClick={async () => {
                      try {
                        const r = await authenticatedFetch(
                          `/api/economy/jobs/${j.id}`,
                        );
                        const data = await r.json();
                        if (!r.ok) throw new Error("Result unavailable.");
                        setResult(JSON.stringify(data.response, null, 2));
                      } catch (e: any) {
                        setMessage(e.message);
                      }
                    }}
                  >
                    Recover result
                  </button>
                )}
              </div>
            ))}
            {result && (
              <>
                <button className="underline" onClick={() => setResult("")}>
                  Close recovered result
                </button>
                <pre className="whitespace-pre-wrap break-words text-xs max-h-80 overflow-auto">
                  {result}
                </pre>
              </>
            )}
          </div>
        </>
      )}
      <details>
        <summary className="cursor-pointer font-bold">
          Cloud AI Coin prices
        </summary>
        <ul className="text-sm space-y-1 mt-3">
          {Object.entries(AI_ACTIONS).map(([path, a]) => (
            <li key={path}>
              {a.name}: {a.cost ? `${a.cost} BC` : `Free (${a.daily}/day UTC)`}
            </li>
          ))}
        </ul>
      </details>
      {message && (
        <p role="status" className="text-amber-200">
          {message}
        </p>
      )}
      <a
        href="/api/legal/terms"
        target="_blank"
        rel="noreferrer"
        className="underline text-sm text-amber-300"
      >
        Purchase terms · AI limitations · Coin remedies and legal exceptions
      </a>
    </section>
  );
}
