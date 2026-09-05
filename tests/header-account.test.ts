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

test("the signed-in header identity opens the artist profile instead of authentication", async () => {
  const app = await readFile("src/App.tsx", "utf8");
  assert.match(app, /currentUser\.id === 'guest' \? setIsAuthModalOpen\(true\) : navigateTo\('artist-profile'\)/);
  assert.match(app, /currentUser\.avatarUrl \? \(/);
});

test("signup bonus retries after a pre-verification or temporary request failure", async () => {
  const notice = await readFile("src/components/SignupBonusNotice.tsx", "utf8");
  assert.match(notice, /if \(!response\.ok \|\| stopped\) return;/);
  assert.match(notice, /checkedUid\.current = user\.id;/);
  assert.ok(notice.indexOf("if (!response.ok || stopped) return;") < notice.indexOf("checkedUid.current = user.id;"));
  assert.match(notice, /addEventListener\("focus", check\)/);
  assert.match(notice, /visibilitychange/);
});

test("artist profile places sign out in its bottom account section", async () => {
  const profile = await readFile("src/components/ArtistProfilePage.tsx", "utf8");
  assert.match(profile, /Account &amp; security/);
  assert.match(profile, /await logoutUser\(\);/);
  assert.match(profile, /onNavigateToApp\('hub'\);/);
  assert.ok(profile.indexOf("Account &amp; security") < profile.indexOf("ADD UNRELEASED DEMO MODAL"));
});

test("signup reserves one artist name and ends the unverified Firebase session", async () => {
  const [auth, modal, names, profile, progression] = await Promise.all([
    readFile("src/services/authService.ts", "utf8"),
    readFile("src/components/AuthModal.tsx", "utf8"),
    readFile("server/accountNames.ts", "utf8"),
    readFile("src/components/ArtistProfilePage.tsx", "utf8"),
    readFile("src/components/GamificationModal.tsx", "utf8"),
  ]);
  assert.match(auth, /authenticatedFetch\('\/api\/account\/claim-name'/);
  assert.match(auth, /await sendEmailVerification\(result\.user\);[\s\S]*await logoutUser\(\);/);
  assert.match(modal, /setTab\('signin'\)/);
  assert.match(names, /runTransaction/);
  assert.match(names, /NAME_UNAVAILABLE/);
  assert.match(names, /accountNameClaims/);
  assert.match(profile, /displayName: currentUser\.displayName/);
  assert.match(progression, /value=\{profile\.displayName\}[\s\S]*readOnly/);
});

test("Coin action labels disclose deductions, free use and insufficient balances", () => {
  assert.equal(coinActionLabel("/api/generate-lyrics", 100), "Advanced Lyric AI · 10 BC");
  assert.equal(coinActionLabel("/api/generate-lyrics", 5), "Insufficient Coins · 10 BC needed");
  assert.equal(coinActionLabel("/api/ai/chat", 0), "Basic career chat · 0 BC");
  assert.equal(coinActionLabel("/api/analyze", 0, true), "Full Hit Analysis · Unlimited");
});

test("floating wallet opens a compact summary before the full purchase screen", async () => {
  const [floating, wallet] = await Promise.all([
    readFile("src/components/PersistentCoinWallet.tsx", "utf8"),
    readFile("src/context/CoinWalletContext.tsx", "utf8"),
  ]);
  assert.match(floating, /BROTHERHOOD WALLET/);
  assert.match(floating, /Recent Coin activity/);
  assert.match(floating, /Next refill/);
  assert.match(floating, /Buy more/);
  assert.match(floating, /authenticatedFetch\("\/api\/economy\/history"\)/);
  assert.match(wallet, /month: body\.month/);
});

test("profile edit opens real settings and supports bounded local photo uploads", async () => {
  const profile = await readFile("src/components/ArtistProfilePage.tsx", "utf8");
  assert.match(profile, /setActiveTab\('environment'\)/);
  assert.match(profile, /Edit Studio &amp; Profile/);
  assert.match(profile, /accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(profile, /file\.size > 2_000_000/);
  assert.match(profile, /canvas\.width = 256; canvas\.height = 256/);
  assert.match(profile, /saveCurrentAuthUser\(updatedUser\)/);
});
