import React, { useEffect, useRef, useState } from "react";
import type { RegisteredUser } from "../services/authService";
import { authenticatedFetch } from "../services/authService";
import { walletControlLabel, type HeaderWallet } from "../headerPlanAndCoins";

export function openPlanAndCoins() {
  window.dispatchEvent(new CustomEvent("ib_open_plan_coins"));
}

export function HeaderPlanAndCoins({ user }: { user: RegisteredUser }) {
  const [wallet, setWallet] = useState<HeaderWallet | null>(null);
  const revision = useRef(0);

  useEffect(() => {
    setWallet(null);
    if (user.id === "guest") return;
    const refresh = () => {
      const request = ++revision.current;
      authenticatedFetch("/api/economy/wallet")
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok) throw new Error("Wallet unavailable.");
          if (
            request === revision.current &&
            (body.tier === "free" || body.tier === "pro") &&
            Number.isFinite(body.total)
          ) {
            setWallet({ tier: body.tier, total: body.total });
          }
        })
        .catch(() => {
          if (request === revision.current) setWallet(null);
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("ib_community_changed", refresh);
    const timer = window.setInterval(refresh, 60_000);

    return () => {
      revision.current++;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("ib_community_changed", refresh);
    };
  }, [user.id]);

  if (user.id === "guest") return null;

  return (
    <button
      type="button"
      onClick={openPlanAndCoins}
      className="max-w-40 shrink-0 rounded-xl border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20 sm:px-2.5"
      title="Open Plan & Coins"
      aria-label={`${walletControlLabel(wallet)}. Open Plan & Coins`}
    >
      <span className="block truncate">{walletControlLabel(wallet)}</span>
    </button>
  );
}
