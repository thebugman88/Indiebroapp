import React from "react";
import type { RegisteredUser } from "../services/authService";
import { walletControlLabel, type HeaderWallet } from "../headerPlanAndCoins";
import { useCoinWallet } from "../context/CoinWalletContext";

export function openPlanAndCoins() {
  window.dispatchEvent(new CustomEvent("ib_open_plan_coins"));
}

export function HeaderPlanAndCoins({ user }: { user: RegisteredUser }) {
  const { wallet } = useCoinWallet();

  if (user.id === "guest") return null;

  return (
    <button
      type="button"
      onClick={openPlanAndCoins}
      className="max-w-40 shrink-0 rounded-xl border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20 sm:px-2.5"
      title="Open Plan & Coins"
      aria-label={`${walletControlLabel(wallet as HeaderWallet | null)}. Open Plan & Coins`}
    >
      <span className="block truncate">{walletControlLabel(wallet as HeaderWallet | null)}</span>
    </button>
  );
}
