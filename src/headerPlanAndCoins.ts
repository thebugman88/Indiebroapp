export type HeaderWallet = {
  tier: "free" | "pro";
  total: number;
};

export function walletControlLabel(wallet: HeaderWallet | null) {
  if (!wallet) return "Plan & Coins";
  return `${wallet.total.toLocaleString()} BC · ${wallet.tier === "pro" ? "Pro" : "Free"}`;
}
