import type { RequestHandler } from "express";
import { createHash, randomUUID } from "node:crypto";
import { economyDb } from "./economy";
import { sealPrivate, openPrivate } from "./dataProtection";

export function structuralThreat(value: unknown, depth = 0): boolean {
  if (depth > 30) return true;
  if (!value || typeof value !== "object") return false;
  return Object.keys(value).some(
    (k) =>
      ["__proto__", "prototype", "constructor"].includes(k) ||
      structuralThreat((value as any)[k], depth + 1),
  );
}
export async function blockAccount(
  uid: string,
  seconds: number,
  reason: string,
  actor = "automatic",
  ip = "unavailable",
) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid))
    throw new Error("Invalid account ID.");
  if (!Number.isInteger(seconds) || seconds < 30 || seconds > 86400)
    throw new Error("Block duration must be 30 seconds to 24 hours.");
  const until = Date.now() + seconds * 1000;
  const db = economyDb(),
    id = randomUUID();
  const batch = db.batch();
  batch.set(db.doc(`securityBlocks/${uid}`), {
    until,
    reason: "SECURITY_COOLDOWN",
  });
  batch.create(db.doc(`securityEvents/${id}`), {
    createdAt: Date.now(),
    deleteAfter: new Date(Date.now() + 30 * 86400000),
    private: sealPrivate({ uid, actor, ip, reason, until }, `security:${id}`),
  });
  await batch.commit();
  return until;
}
export async function unblockAccount(uid: string, actor: string) {
  const db = economyDb(),
    id = randomUUID(),
    batch = db.batch();
  batch.delete(db.doc(`securityBlocks/${uid}`));
  batch.create(db.doc(`securityEvents/${id}`), {
    createdAt: Date.now(),
    deleteAfter: new Date(Date.now() + 30 * 86400000),
    private: sealPrivate(
      { uid, actor, reason: "MANUAL_UNBLOCK" },
      `security:${id}`,
    ),
  });
  await batch.commit();
}
export async function isBlocked(uid: string) {
  const doc = await economyDb().doc(`securityBlocks/${uid}`).get();
  return Number(doc.data()?.until) || 0;
}
export const durableSecurityGuard: RequestHandler = async (req, res, next) => {
  const uid = res.locals.identity?.uid;
  if (!uid) return next();
  const path = req.originalUrl.split("?")[0].replace(/\/+$/, "").toLowerCase();
  // A blocked customer must still be able to stop recurring billing and view status.
  if (["/api/stripe/cancel", "/api/security/account-status"].includes(path))
    return next();
  try {
    const until = await isBlocked(uid);
    if (until > Date.now()) {
      res.setHeader("Retry-After", Math.ceil((until - Date.now()) / 1000));
      res
        .status(403)
        .json({
          error:
            "Account temporarily restricted. Contact support or retry after the cooldown.",
          retryAt: until,
        });
      return;
    }
    if (structuralThreat(req.body) || structuralThreat(req.query)) {
      await blockAccount(
        uid,
        300,
        "STRUCTURAL_PROTOTYPE_PAYLOAD",
        "automatic",
        req.ip || "unavailable",
      );
      res
        .status(403)
        .json({
          error:
            "Unsafe request structure blocked. Account cooldown: five minutes.",
        });
      return;
    }
    next();
  } catch {
    res
      .status(503)
      .json({ error: "Security authorization is temporarily unavailable." });
  }
};
export async function securityEvents() {
  const docs = await economyDb()
    .collection("securityEvents")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return docs.docs.map((d) => ({
    id: d.id,
    createdAt: d.data().createdAt,
    ...openPrivate(d.data().private, `security:${d.id}`),
  }));
}
