export const REFERRAL_RULES_VERSION = "2026-08-31-v1";
export const DAY_MS = 86_400_000;
export const REFERRAL_RULES = {
  maxQualified: 10,
  claimWindowDays: 7,
  minimumAgeDays: 2,
  minimumActiveDays: 2,
  minimumTools: 2,
  minimumSpent: 10,
  newMemberCoins: 20,
  pointsPerReferral: 100,
  maxRewardsPerInviterPerDay: 2,
  maxRewardsPerProgramPerDay: 25,
} as const;
export const REFERRAL_MILESTONES = Array.from({ length: 10 }, (_, i) => ({
  count: i + 1,
  coins: i === 9 ? 100 : 25,
  points: i === 9 ? 500 : 100,
  proDays: i === 2 ? 7 : i === 4 ? 14 : i === 9 ? 30 : 0,
  badge:
    i === 0
      ? "Brotherhood Builder"
      : i === 2
        ? "Community Connector"
        : i === 4
          ? "Brotherhood Champion"
          : i === 9
            ? "Brotherhood Ambassador"
            : null,
}));
export const COMMUNITY_ROLES = [
  "artist",
  "producer",
  "engineer",
  "songwriter",
  "music-fan",
] as const;
export interface CommunityProfile {
  displayName: string;
  handle: string;
  role: string;
  genre: string;
  bio: string;
  goal: string;
}
export const EMPTY_COMMUNITY_PROFILE: CommunityProfile = {
  displayName: "",
  handle: "",
  role: "artist",
  genre: "",
  bio: "",
  goal: "",
};
export function profileChecklist(p: Partial<CommunityProfile>) {
  return {
    name: typeof p.displayName === "string" && p.displayName.trim().length >= 2,
    handle: typeof p.handle === "string" && /^[a-z0-9_]{3,24}$/.test(p.handle),
    role: COMMUNITY_ROLES.includes(p.role as any),
    genre: typeof p.genre === "string" && p.genre.trim().length >= 2,
    bio: typeof p.bio === "string" && p.bio.trim().length >= 20,
    goal: typeof p.goal === "string" && p.goal.trim().length >= 10,
  };
}
export const profileComplete = (p: Partial<CommunityProfile>) =>
  Object.values(profileChecklist(p)).every(Boolean);
// Different endpoints within one tool do not count as different tools.
export const REFERRAL_TOOL_PATHS: Record<string, string> = {
  "/api/generate-lyrics": "lyric-pro",
  "/api/synthesize": "semantic-lab",
  "/api/analyze": "hit-analyzer",
  "/api/ai/ocr-parse": "royaltyops",
  "/api/ai/logical-correction": "royaltyops",
  "/api/ai/strategy-plan": "artist-assistant",
  "/api/ai/web-search": "artist-assistant",
  "/api/ai/chat": "artist-assistant",
  "/api/gemini/marketing-advisor": "artist-assistant",
  "/api/quiz/generate": "sonic-iq",
  "/api/gemini/battle-judge": "hang-out",
  "/api/gemini/ai-bot-rap": "hang-out",
};
export interface ReferralActivity {
  tools: string[];
  days: string[];
  spent: number;
}
export function advanceReferralActivity(
  old: ReferralActivity | undefined,
  job: any,
  claimedAt: number,
): ReferralActivity {
  const next = {
    tools: [...(old?.tools || [])],
    days: [...(old?.days || [])],
    spent: old?.spent || 0,
  };
  const tool = REFERRAL_TOOL_PATHS[job.path];
  if (job.status !== "delivered" || !tool || job.createdAt < claimedAt)
    return next;
  next.tools = [...new Set([...next.tools, tool])];
  next.days = [
    ...new Set([
      ...next.days,
      new Date(job.createdAt).toISOString().slice(0, 10),
    ]),
  ]
    .sort()
    .slice(0, 2);
  next.spent = Math.min(
    REFERRAL_RULES.minimumSpent,
    next.spent +
      (Number.isSafeInteger(job.cost) && job.cost > 0 ? job.cost : 0),
  );
  return next;
}
export function referralActivityProgress(
  activity: ReferralActivity | undefined,
  createdAt: number,
  profile: Partial<CommunityProfile>,
  now = Date.now(),
) {
  const ageReady =
    Number.isFinite(createdAt) &&
    createdAt <= now - REFERRAL_RULES.minimumAgeDays * DAY_MS;
  const complete = profileComplete(profile),
    tools = activity?.tools.length || 0,
    activeDays = activity?.days.length || 0,
    spent = activity?.spent || 0;
  return {
    profileComplete: complete,
    ageReady,
    eligibleAt: createdAt + REFERRAL_RULES.minimumAgeDays * DAY_MS,
    tools,
    activeDays,
    spent,
    ready:
      complete &&
      ageReady &&
      tools >= REFERRAL_RULES.minimumTools &&
      activeDays >= REFERRAL_RULES.minimumActiveDays &&
      spent >= REFERRAL_RULES.minimumSpent,
  };
}
