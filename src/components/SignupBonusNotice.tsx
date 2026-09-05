import React, { useEffect, useRef, useState } from "react";
import { Coins, Gift } from "lucide-react";
import { authenticatedFetch } from "../services/authService";
import type { RegisteredUser } from "../services/authService";

export function SignupBonusNotice({ user }: { user: RegisteredUser }) {
  const [amount, setAmount] = useState<number | null>(null);
  const checkedUid = useRef("");

  useEffect(() => {
    if (user.id === "guest") {
      checkedUid.current = "";
      setAmount(null);
      return;
    }
    if (checkedUid.current === user.id) return;
    checkedUid.current = user.id;
    authenticatedFetch("/api/economy/signup-bonus", { method: "POST" })
      .then(async (response) => {
        const body = await response.json();
        if (response.ok && body.announcementPending && Number.isFinite(body.amount)) {
          setAmount(body.amount);
          window.dispatchEvent(new CustomEvent("ib_wallet_changed"));
        }
      })
      .catch(() => {});
  }, [user.id]);

  if (amount === null) return null;

  const acknowledge = () => {
    setAmount(null);
    void authenticatedFetch("/api/economy/signup-bonus/acknowledge", { method: "POST" });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="signup-bonus-title">
      <div className="w-full max-w-md rounded-3xl border border-amber-400/40 bg-zinc-950 p-6 text-center shadow-2xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-zinc-950">
          <Gift className="h-8 w-8" aria-hidden="true" />
        </span>
        <h2 id="signup-bonus-title" className="mt-5 text-2xl font-black text-white">Welcome to the Brotherhood!</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Your verified new account received a one-time signup bonus of <strong className="text-amber-300">{amount} Brotherhood Coins</strong>.
        </p>
        <p className="mt-2 text-xs text-zinc-500">These promotional Coins do not expire while your account remains open.</p>
        <button type="button" onClick={acknowledge} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-amber-300">
          <Coins className="h-4 w-4" aria-hidden="true" />
          View my {amount} BC bonus
        </button>
      </div>
    </div>
  );
}
