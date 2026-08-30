export const ECONOMY_VERSION = "2026-08-30-v1";
export const TERMS_VERSION = "2026-08-30-purchases-v1";
export const MONTHLY_BC = { free: 150, pro: 1500 };
export const STORAGE_GB = { free: 1, pro: 10 };
export const GB = 1_000_000_000;
export const PRODUCTS = {
  pro: {
    name: "Artist Pro",
    cents: 499,
    coins: 0,
    proCoins: 0,
    recurring: true,
  },
  coins100: {
    name: "100 Brotherhood Coins",
    cents: 99,
    coins: 100,
    proCoins: 125,
    recurring: false,
  },
  coins250: {
    name: "250 Brotherhood Coins",
    cents: 199,
    coins: 250,
    proCoins: 315,
    recurring: false,
  },
} as const;
export type ProductId = keyof typeof PRODUCTS;
export const STORAGE_PACKS = {
  gb1: { gb: 1, cost: 100 },
  gb5: { gb: 5, cost: 400 },
  gb10: { gb: 10, cost: 700 },
} as const;
export const AI_ACTIONS: Record<
  string,
  { name: string; cost: number; daily?: number }
> = {
  "/api/generate-lyrics": { name: "Advanced Lyric AI", cost: 10 },
  "/api/synthesize": { name: "Deep Semantic analysis", cost: 15 },
  "/api/analyze": { name: "Full Hit Analysis", cost: 25 },
  "/api/ai/ocr-parse": { name: "Enhanced OCR (one page)", cost: 5 },
  "/api/ai/logical-correction": { name: "Metadata AI cleanup", cost: 5 },
  "/api/ai/strategy-plan": {
    name: "Career strategy / release campaign",
    cost: 20,
  },
  "/api/ai/web-search": { name: "Career research", cost: 15 },
  "/api/gemini/marketing-advisor": { name: "AI marketing package", cost: 25 },
  "/api/gemini/battle-judge": { name: "AI Battle Judge", cost: 5 },
  "/api/ai/chat": { name: "Basic career chat", cost: 0, daily: 10 },
  "/api/quiz/generate": { name: "Sonic IQ", cost: 0, daily: 10 },
  "/api/gemini/ai-bot-rap": {
    name: "Practice battle opponent",
    cost: 0,
    daily: 5,
  },
};
export const PURCHASE_POLICY = [
  "All sales are final to the extent permitted by applicable law. We do not ordinarily offer discretionary cash refunds. Eligible discretionary service credits are issued as Brotherhood Coins, not money.",
  "AI can make mistakes. Outputs vary with input, context and individual taste; results and commercial success are not guaranteed. Subjective dissatisfaction alone does not qualify for a discretionary credit. This does not exclude remedies for non-delivery, duplicate or unauthorized charges, material misrepresentation, technical failure, or rights required by law or payment-provider rules.",
  "Technical failures are recorded and eligible Coin charges are restored. Verified paid-but-undelivered purchases are retried without charging again. Unresolved exceptions are referred for review. Statutory or payment-provider refunds, when required, go through the original payment method; Coins do not replace those rights.",
  "Purchased and service-credit Coins do not expire while your account remains open. They have no cash redemption value and cannot be transferred. Included Coins refill on the first day of each calendar month at 00:00 UTC and do not roll over. Spend included Coins first.",
  "Artist Pro is $4.99 USD per month plus any disclosed tax and renews automatically until canceled. It includes all tools, 1,500 monthly Coins and 10 GB of uploaded-audio storage. Cancel future renewal in Plan & Coins; access continues through the paid period. Free includes all tools, 150 monthly Coins and 1 GB.",
  "Storage extensions purchased with Coins remain on your account. Downgrading reduces only base storage. Existing files are not automatically deleted for exceeding quota; further uploads pause until usage fits. Local drafts and browser-only files are not backed up by these storage allowances.",
].join("\n\n");
