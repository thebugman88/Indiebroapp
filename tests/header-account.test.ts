import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { walletControlLabel } from "../src/headerPlanAndCoins";
import { coinActionLabel } from "../shared/economy";

test("compact header wallet labels expose live BC and plan without guessing", () => {
  assert.equal(walletControlLabel(null), "Plan & Coins");
  assert.equal(walletControlLabel({ tier: "free", total: 150 }), "150 BC · Free");
  assert.equal(walletControlLabel({ tier: "pro", total: 15315 }), "15,315 BC · Pro");
});

test("regular authenticated artists replace Login and can open Plan & Coins", async () => {
  const [app, control, walletContext, floating, modal] = await Promise.all([
    readFile("src/App.tsx", "utf8"),
    readFile("src/components/HeaderPlanAndCoins.tsx", "utf8"),
    readFile("src/context/CoinWalletContext.tsx", "utf8"),
    readFile("src/components/PersistentCoinWallet.tsx", "utf8"),
    readFile("src/components/GamificationModal.tsx", "utf8"),
  ]);
  assert.match(app, /currentUser\.id !== 'guest'[\s\S]*currentUser\.displayName/);
  assert.match(control, /useCoinWallet/);
  assert.match(walletContext, /authenticatedFetch\("\/api\/economy\/wallet"\)/);
  assert.match(floating, /STUDIO_COIN_SUMMARIES/);
  assert.match(floating, /safe-area-inset-bottom/);
  assert.match(control, /ib_open_plan_coins/);
  assert.match(modal, /setActiveTab\('billing'\)/);
  assert.match(modal, /setIsProfileModalOpen\(true\)/);
});

test("Coin action labels disclose deductions, free use and insufficient balances", () => {
  assert.equal(coinActionLabel("/api/generate-lyrics", 100), "Advanced Lyric AI · 10 BC");
  assert.equal(coinActionLabel("/api/generate-lyrics", 5), "Insufficient Coins · 10 BC needed");
  assert.equal(coinActionLabel("/api/ai/chat", 0), "Basic career chat · 0 BC");
  assert.equal(coinActionLabel("/api/analyze", 0, true), "Full Hit Analysis · Unlimited");
});
