import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAppCheck } from "firebase-admin/app-check";
import type { Request, Response, RequestHandler } from "express";
import { getFirebaseAdminApp } from "./auth";
import { economyDb, keyFor } from "./economy";
import { DAY_MS } from "../shared/referrals";
function secret() {
  const raw = process.env.REFERRAL_ABUSE_HMAC_KEY || "";
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32 || key.toString("base64") !== raw)
    throw new Error("Referral abuse protection is not configured.");
  return key;
}
export const abuseHash = (kind: string, value: string) =>
  createHmac("sha256", secret())
    .update(JSON.stringify([kind, value]))
    .digest("hex");
export function canonicalEmail(email: string) {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1])
    throw new Error("A verified email is required.");
  let [local, domain] = parts;
  if (domain === "googlemail.com") domain = "gmail.com";
  // Conservative alias handling: + tags are not separate reward identities.
  local = local.split("+")[0];
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}
export function referralDevice(req: Request, res: Response) {
  const name = "__Host-ib_referral_device";
  let cookie =
    (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(name + "="))
      ?.slice(name.length + 1) || "";
  const [id, at, signature] = cookie.split(".");
  const expected = id && at ? abuseHash("device-cookie", `${id}.${at}`) : "";
  if (
    !/^[a-f0-9]{40}$/.test(id || "") ||
    !/^[a-f0-9]{64}$/.test(signature || "") ||
    !Number.isFinite(Number(at)) ||
    Number(at) > Date.now() ||
    Number(at) < Date.now() - 90 * DAY_MS ||
    !expected ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    const body = `${randomBytes(20).toString("hex")}.${Date.now()}`;
    cookie = `${body}.${abuseHash("device-cookie", body)}`;
    res.cookie(name, cookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 90 * DAY_MS,
    });
  }
  return abuseHash("device", cookie.split(".")[0]);
}
export const verifyReferralApp: RequestHandler = async (req, res, next) => {
  try {
    if (process.env.REFERRALS_ENABLED !== "true") {
      res.status(503).json({ error: "Referral rewards are not enabled yet." });
      return;
    }
    secret();
    const allowed = (process.env.REFERRAL_APPCHECK_APP_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const token = req.get("X-Firebase-AppCheck");
    if (!token || !allowed.length) throw new Error("Missing attestation");
    const uid = res.locals.identity.uid,
      now = Date.now();
    await economyDb().runTransaction(async (t) => {
      const ref = economyDb().doc(
          `referralRateLimits/${keyFor(uid, String(Math.floor(now / 3600000)))}`,
        ),
        old = await t.get(ref);
      const count = Number(old.data()?.count || 0);
      if (count >= 15) throw new Error("Too many referral requests.");
      t.set(ref, { count: count + 1, deleteAfter: new Date(now + 2 * DAY_MS) });
    });
    // Bound provider verification calls as well as successful mutations.
    const result = await getAppCheck(getFirebaseAdminApp()).verifyToken(token, {
      consume: true,
    });
    if (result.alreadyConsumed || !allowed.includes(result.appId))
      throw new Error("Invalid attestation");
    res.locals.referralDevice = referralDevice(req, res);
    next();
  } catch {
    res.status(403).json({
      error:
        "Referral security verification failed or its request limit was reached. Retry later; no reward was issued.",
    });
  }
};
