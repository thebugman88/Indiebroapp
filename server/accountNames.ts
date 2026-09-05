import { createHash } from "node:crypto";
import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "./auth";

export function normalizeAccountName(value: unknown) {
  if (typeof value !== "string") throw new Error("INVALID_NAME");
  const displayName = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (
    displayName.length < 2 ||
    displayName.length > 40 ||
    !/^[\p{L}\p{N}][\p{L}\p{N} ._'-]*$/u.test(displayName)
  ) throw new Error("INVALID_NAME");
  return { displayName, canonical: displayName.toLocaleLowerCase("en-US") };
}

export async function claimAccountName(uid: string, value: unknown) {
  const { displayName, canonical } = normalizeAccountName(value);
  const hash = createHash("sha256").update(canonical).digest("hex");
  const db = getFirestore(getFirebaseAdminApp());
  return db.runTransaction(async (transaction) => {
    const ownerRef = db.doc(`accountNames/${hash}`);
    const accountRef = db.doc(`accountNameClaims/${uid}`);
    const [owner, account] = await Promise.all([
      transaction.get(ownerRef),
      transaction.get(accountRef),
    ]);
    if (account.exists) {
      if (account.data()!.nameHash !== hash) throw new Error("NAME_LOCKED");
      return { displayName, claimed: false };
    }
    if (owner.exists && owner.data()!.uid !== uid) throw new Error("NAME_UNAVAILABLE");
    transaction.create(ownerRef, { uid, claimedAt: Date.now() });
    transaction.create(accountRef, { uid, nameHash: hash, claimedAt: Date.now() });
    return { displayName, claimed: true };
  });
}

export const accountNamesRouter = express.Router();
accountNamesRouter.post("/claim-name", async (req, res) => {
  try {
    res.json(await claimAccountName(res.locals.identity.uid, req.body?.displayName));
  } catch (error) {
    const code = (error as Error).message;
    if (code === "NAME_UNAVAILABLE") {
      res.status(409).json({ code, error: "That artist name is unavailable. Choose another name." });
      return;
    }
    if (code === "NAME_LOCKED") {
      res.status(409).json({ code, error: "Your original artist name is permanently attached to this account." });
      return;
    }
    if (code === "INVALID_NAME") {
      res.status(400).json({ code, error: "Use 2–40 letters, numbers, spaces, periods, apostrophes, underscores, or hyphens." });
      return;
    }
    res.status(503).json({ error: "Artist-name registration is temporarily unavailable. No account name was reserved." });
  }
});
