import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authenticatedFetch, getCurrentAuthUser } from "../services/authService";

export type CoinWallet = {
  tier: "free" | "pro";
  total: number;
  monthly: number;
  purchased: number;
};

type CoinWalletContextValue = {
  wallet: CoinWallet | null;
  loading: boolean;
  refresh: () => void;
};

const CoinWalletContext = createContext<CoinWalletContextValue>({
  wallet: null,
  loading: false,
  refresh: () => {},
});

export function CoinWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const revision = useRef(0);

  const refresh = useCallback(() => {
    const user = getCurrentAuthUser();
    const request = ++revision.current;
    if (user.id === "guest") {
      setWallet(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    authenticatedFetch("/api/economy/wallet")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !Number.isFinite(body.total)) throw new Error("Wallet unavailable");
        if (request === revision.current) {
          setWallet({
            tier: body.tier,
            total: body.total,
            monthly: body.monthly,
            purchased: body.purchased,
          });
        }
      })
      .catch(() => {
        if (request === revision.current) setWallet(null);
      })
      .finally(() => {
        if (request === revision.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("ib_auth_changed", refresh);
    window.addEventListener("ib_wallet_changed", refresh);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      revision.current++;
      clearInterval(timer);
      window.removeEventListener("ib_auth_changed", refresh);
      window.removeEventListener("ib_wallet_changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return (
    <CoinWalletContext.Provider value={{ wallet, loading, refresh }}>
      {children}
    </CoinWalletContext.Provider>
  );
}

export const useCoinWallet = () => useContext(CoinWalletContext);
