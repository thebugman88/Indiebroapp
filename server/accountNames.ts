import { createHash } from "node:crypto";
import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "./auth";
import { deleteAgeClaim, getAgeClaim, saveAgeClaim } from './ageGate';
import { requestGuardianConsent } from './guardianConsent';

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
accountNamesRouter.get('/age-status', async (_req, res) => {
  try {
    const claim = await getAgeClaim(res.locals.identity.uid);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ declared: Boolean(claim), ageBand: claim?.ageBand || null, adultEligible: claim?.adultEligible === true, guardianStatus: claim?.guardianStatus || null, accountEligible: claim?.ageBand !== 'minor' || claim?.guardianStatus === 'approved' });
  } catch { res.status(503).json({ error: 'Age eligibility could not be confirmed.' }); }
});
accountNamesRouter.post('/declare-age', async (req, res) => {
  try {
    const existing = await getAgeClaim(res.locals.identity.uid);
    if (existing) { res.status(409).json({ code: 'AGE_ALREADY_DECLARED', error: 'This account already has an age declaration.' }); return; }
    const claim = await saveAgeClaim(res.locals.identity.uid, req.body?.birthDate);
    let guardianDelivery: 'not_required' | 'sent' | 'unavailable' = 'not_required';
    if (claim.ageBand === 'minor') {
      try { await requestGuardianConsent(res.locals.identity.uid, res.locals.identity.email, req.body?.guardianEmail); guardianDelivery = 'sent'; }
      catch { guardianDelivery = 'unavailable'; }
    }
    res.json({ declared: true, ageBand: claim.ageBand, adultEligible: claim.adultEligible, guardianStatus: claim.guardianStatus, guardianDelivery });
  } catch (error) {
    const code = (error as Error).message;
    if (code === 'UNDER_MINIMUM_AGE') { res.status(403).json({ code, error: 'You must be at least 13 to use an account.' }); return; }
    if (code === 'INVALID_BIRTH_DATE') { res.status(400).json({ code, error: 'Enter a valid birth date.' }); return; }
    res.status(503).json({ error: 'The age declaration could not be saved. Try again later.' });
  }
});
accountNamesRouter.post('/guardian-approval/request', async (req, res) => {
  try {
    res.json(await requestGuardianConsent(res.locals.identity.uid, res.locals.identity.email, req.body?.guardianEmail));
  } catch (error) {
    const code = (error as Error).message;
    if (code === 'INVALID_GUARDIAN_EMAIL' || code === 'GUARDIAN_EMAIL_MUST_DIFFER') { res.status(400).json({ code, error: 'Enter a valid parent or guardian email that differs from the member email.' }); return; }
    if (code === 'EMAIL_NOT_CONFIGURED' || code === 'EMAIL_DELIVERY_FAILED') { res.status(503).json({ code, error: 'Guardian email delivery is temporarily unavailable. The teen account remains locked.' }); return; }
    if (code === 'ALREADY_APPROVED') { res.status(409).json({ code, error: 'Guardian permission is already recorded.' }); return; }
    res.status(403).json({ code, error: 'Guardian approval is available only for a pending teen account.' });
  }
});
accountNamesRouter.post("/claim-name", async (req, res) => {
  let ageCreated = false;
  try {
    const age = await saveAgeClaim(res.locals.identity.uid, req.body?.birthDate);
    ageCreated = true;
    const name = await claimAccountName(res.locals.identity.uid, req.body?.displayName);
    let guardianDelivery: 'not_required' | 'sent' | 'unavailable' = 'not_required';
    if (age.ageBand === 'minor') {
      try { await requestGuardianConsent(res.locals.identity.uid, res.locals.identity.email, req.body?.guardianEmail); guardianDelivery = 'sent'; }
      catch { guardianDelivery = 'unavailable'; }
    }
    res.json({ ...name, ageBand: age.ageBand, adultEligible: age.adultEligible, guardianStatus: age.guardianStatus, guardianDelivery });
  } catch (error) {
    if (ageCreated) await deleteAgeClaim(res.locals.identity.uid).catch(() => {});
    const code = (error as Error).message;
    if (code === "NAME_UNAVAILABLE") {
      res.status(409).json({ code, error: "That artist name is unavailable. Choose another name." });
      return;
    }
    if (code === "NAME_LOCKED") {
      res.status(409).json({ code, error: "Your original artist name is permanently attached to this account." });
      return;
    }
    if (code === 'UNDER_MINIMUM_AGE') {
      res.status(403).json({ code, error: 'You must be at least 13 to create an account.' });
      return;
    }
    if (code === 'INVALID_BIRTH_DATE') {
      res.status(400).json({ code, error: 'Enter a valid birth date.' });
      return;
    }
    if (code === "INVALID_NAME") {
      res.status(400).json({ code, error: "Use 2–40 letters, numbers, spaces, periods, apostrophes, underscores, or hyphens." });
      return;
    }
    res.status(503).json({ error: "Artist-name registration is temporarily unavailable. No account name was reserved." });
  }
});
