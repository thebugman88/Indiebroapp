// Referral codes are public invitations, never authentication credentials.
// A manually entered code is retained only for the newly created account in memory.
const pending = new Map<string, string>();
export const inviteFromUrl = () => {
  if (typeof window === "undefined") return "";
  const value =
    new URL(window.location.href).searchParams
      .get("ref")
      ?.trim()
      .toUpperCase() || "";
  return /^[A-F0-9]{24}$/.test(value) ? value : "";
};
export function rememberReferralInvite(uid: string, code: string) {
  if (/^[A-F0-9]{24}$/.test(code.trim().toUpperCase()))
    pending.set(uid, code.trim().toUpperCase());
}
export const pendingReferralInvite = (uid: string) =>
  pending.get(uid) || inviteFromUrl();
export const clearReferralInvite = (uid: string) => pending.delete(uid);
