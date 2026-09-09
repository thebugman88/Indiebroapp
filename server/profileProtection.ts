import type { UserJudgeProfile } from "../judgement-zone/src/types";
import { sealPrivate, openPrivate } from "./dataProtection";

export function encodeJudgeProfile(profile: UserJudgeProfile) {
  return {
    id: profile.id,
    private: sealPrivate(profile, `judge-profile:${profile.id}`),
  };
}
export function decodeJudgeProfile(uid: string, stored: any): UserJudgeProfile {
  const profile = openPrivate<UserJudgeProfile>(
    stored.private,
    `judge-profile:${uid}`,
  );
  if (profile.id !== uid || stored.id !== uid)
    throw new Error("Profile integrity check failed.");
  return {
    ...profile,
    // Existing accounts receive the same one-time starter submission as new accounts.
    judgementCredits: Number.isSafeInteger(profile.judgementCredits)
      ? Math.max(0, profile.judgementCredits)
      : 3,
  };
}
