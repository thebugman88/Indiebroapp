import React, { useState } from "react";
import { Coins, History, CalendarClock, X } from "lucide-react";
import { STUDIO_COIN_SUMMARIES } from "../../shared/economy";
import type { RegisteredUser } from "../services/authService";
import { useCoinWallet } from "../context/CoinWalletContext";
import { openPlanAndCoins } from "./HeaderPlanAndCoins";
import { authenticatedFetch } from "../services/authService";

export function PersistentCoinWallet({
  user,
  activeApp,
}: {
  user: RegisteredUser;
  activeApp: string;
}) {
  const { wallet, loading } = useCoinWallet();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"summary" | "history" | "refill">("summary");
  const [history, setHistory] = useState<any[] | null>(null);
  if (user.id === "guest") return null;

  const balance = user.isUnlimited
    ? "Unlimited BC"
    : wallet
      ? `${wallet.total.toLocaleString()} BC`
      : loading
        ? "Loading BC…"
        : "Wallet unavailable";
  const context = STUDIO_COIN_SUMMARIES[activeApp] || "0 BC · No cloud charge";

  const refillAt = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1));
  const showHistory = async () => {
    setView("history");
    if (history) return;
    try {
      const response = await authenticatedFetch("/api/economy/history");
      const body = await response.json();
      setHistory(response.ok && Array.isArray(body) ? body.slice(0, 5) : []);
    } catch { setHistory([]); }
  };
  const manage = () => { setOpen(false); openPlanAndCoins(); };

  return <>
    {open && <div className="fixed inset-0 z-[69] bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />}
    {open && (
      <section className="fixed bottom-20 left-3 z-[71] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-amber-400/40 bg-zinc-950 p-4 text-zinc-200 shadow-2xl sm:left-4" role="dialog" aria-label="Brotherhood Coin wallet">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold text-zinc-400">BROTHERHOOD WALLET</p><p className="mt-1 text-2xl font-black text-amber-300">{balance}</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close wallet"><X className="h-5 w-5" /></button>
        </div>
        {view === "summary" && wallet && <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-zinc-900 p-3"><span className="block text-xs text-zinc-500">Included</span><strong>{wallet.monthly} BC</strong></div><div className="rounded-xl bg-zinc-900 p-3"><span className="block text-xs text-zinc-500">Non-expiring</span><strong>{wallet.purchased} BC</strong></div></div>
          <p className="text-xs text-zinc-400">{context}</p>
        </div>}
        {view === "history" && <div className="mt-4 space-y-2">
          <p className="text-xs font-bold text-white">Recent Coin activity</p>
          {history === null ? <p className="text-xs text-zinc-500">Loading…</p> : history.length === 0 ? <p className="text-xs text-zinc-500">No recent charged activity.</p> : history.map(item => <div key={item.id} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs"><span className="font-bold text-zinc-200">{item.actionName || item.path || item.status || 'Coin activity'}</span><span className="float-right text-amber-300">{item.cost ?? ((item.debit?.monthly || 0) + (item.debit?.purchased || 0))} BC</span></div>)}
        </div>}
        {view === "refill" && <div className="mt-4 rounded-xl bg-zinc-900 p-3 text-sm"><p className="font-bold text-white">Monthly included Coin refill</p><p className="mt-1 text-xs text-zinc-400">Your included Coins reset to {wallet?.tier === 'pro' ? '1,500' : '150'} BC on {refillAt.toLocaleDateString()} at 12:00 AM UTC. Purchased and bonus Coins remain.</p></div>}
        <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-bold">
          <button type="button" onClick={showHistory} className="rounded-xl border border-zinc-800 p-2 hover:border-amber-400"><History className="mx-auto mb-1 h-4 w-4" />History</button>
          <button type="button" onClick={() => setView("refill")} className="rounded-xl border border-zinc-800 p-2 hover:border-amber-400"><CalendarClock className="mx-auto mb-1 h-4 w-4" />Next refill</button>
          <button type="button" onClick={manage} className="rounded-xl bg-amber-400 p-2 text-zinc-950"><Coins className="mx-auto mb-1 h-4 w-4" />Buy more</button>
        </div>
      </section>
    )}
    <button
      type="button"
      onClick={() => { setView("summary"); setOpen(value => !value); }}
      className="fixed left-3 z-[70] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-2xl border border-amber-400/40 bg-zinc-950/95 px-3 py-2 text-left shadow-2xl shadow-black/60 backdrop-blur-md transition hover:border-amber-300 hover:bg-zinc-900 sm:left-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      aria-label={`${balance}. ${context}. Open Plan and Coins.`}
      title="Open Coin wallet"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
        <Coins className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black text-amber-300">{balance}</span>
        <span className="block truncate text-[10px] font-semibold text-zinc-400">{context}</span>
      </span>
    </button>
  </>;
}
