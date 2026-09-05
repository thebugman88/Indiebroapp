import React from "react";
import { Coins } from "lucide-react";
import { STUDIO_COIN_SUMMARIES } from "../../shared/economy";
import type { RegisteredUser } from "../services/authService";
import { useCoinWallet } from "../context/CoinWalletContext";
import { openPlanAndCoins } from "./HeaderPlanAndCoins";

export function PersistentCoinWallet({
  user,
  activeApp,
}: {
  user: RegisteredUser;
  activeApp: string;
}) {
  const { wallet, loading } = useCoinWallet();
  if (user.id === "guest") return null;

  const balance = user.isUnlimited
    ? "Unlimited BC"
    : wallet
      ? `${wallet.total.toLocaleString()} BC`
      : loading
        ? "Loading BC…"
        : "Wallet unavailable";
  const context = STUDIO_COIN_SUMMARIES[activeApp] || "0 BC · No cloud charge";

  return (
    <button
      type="button"
      onClick={openPlanAndCoins}
      className="fixed left-3 z-[70] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-2xl border border-amber-400/40 bg-zinc-950/95 px-3 py-2 text-left shadow-2xl shadow-black/60 backdrop-blur-md transition hover:border-amber-300 hover:bg-zinc-900 sm:left-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      aria-label={`${balance}. ${context}. Open Plan and Coins.`}
      title="Open Plan & Coins"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
        <Coins className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black text-amber-300">{balance}</span>
        <span className="block truncate text-[10px] font-semibold text-zinc-400">{context}</span>
      </span>
    </button>
  );
}
