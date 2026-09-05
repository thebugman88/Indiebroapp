import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { walletControlLabel } from "../src/headerPlanAndCoins";

test("compact header wallet labels expose live BC and plan without guessing", () => {
  assert.equal(walletControlLabel(null), "Plan & Coins");
  assert.equal(walletControlLabel({ tier: "free", total: 150 }), "150 BC · Free");
  assert.equal(walletControlLabel({ tier: "pro", total: 15315 }), "15,315 BC · Pro");
});

test("regular authenticated artists replace Login and can open Plan & Coins", async () => {
  const [app, control, modal] = await Promise.all([
    readFile("src/App.tsx", "utf8"),
    readFile("src/components/HeaderPlanAndCoins.tsx", "utf8"),
    readFile("src/components/GamificationModal.tsx", "utf8"),
  ]);
  assert.match(app, /currentUser\.id !== 'guest'[\s\S]*currentUser\.displayName/);
  assert.match(control, /authenticatedFetch\("\/api\/economy\/wallet"\)/);
  assert.match(control, /ib_open_plan_coins/);
  assert.match(modal, /setActiveTab\('billing'\)/);
  assert.match(modal, /setIsProfileModalOpen\(true\)/);
});
