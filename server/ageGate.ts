import type { RequestHandler } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from './auth';
import { AGE_POLICY_VERSION, PRIVACY_VERSION, TERMS_VERSION } from '../shared/legal';

export type AgeBand = 'minor' | 'adult';
export type GuardianStatus = 'not_required' | 'pending' | 'approved';
export interface AgeClaim { ageBand: AgeBand; adultEligible: boolean; guardianStatus: GuardianStatus; declaredAt: number; agePolicyVersion: string; termsVersion: string; privacyVersion: string }

function ageOn(date: Date, now = new Date()) {
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

export function deriveAgeClaim(birthDate: unknown, now = new Date()): AgeClaim {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error('INVALID_BIRTH_DATE');
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate || date > now) throw new Error('INVALID_BIRTH_DATE');
  const age = ageOn(date, now);
  if (age < 13) throw new Error('UNDER_MINIMUM_AGE');
  const adultEligible = age >= 18;
  return { ageBand: adultEligible ? 'adult' : 'minor', adultEligible, guardianStatus: adultEligible ? 'not_required' : 'pending', declaredAt: now.getTime(), agePolicyVersion: AGE_POLICY_VERSION, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION };
}

const ageRef = (uid: string) => getFirestore(getFirebaseAdminApp()).doc(`accountAgeClaims/${uid}`);
export async function saveAgeClaim(uid: string, birthDate: unknown) {
  const claim = deriveAgeClaim(birthDate);
  await ageRef(uid).create({ uid, ...claim });
  return claim;
}
export async function deleteAgeClaim(uid: string) {
  await ageRef(uid).delete();
}
export async function getAgeClaim(uid: string): Promise<AgeClaim | null> {
  const snapshot = await ageRef(uid).get();
  return snapshot.exists ? snapshot.data() as AgeClaim : null;
}
export async function isAdultEligible(uid: string) {
  return (await getAgeClaim(uid))?.adultEligible === true;
}
export function guardianApproved(claim: AgeClaim | null) {
  return claim?.ageBand !== 'minor' || claim.guardianStatus === 'approved';
}
export const requireAdult: RequestHandler = async (_req, res, next) => {
  try {
    if (!await isAdultEligible(res.locals.identity.uid)) { res.status(403).json({ code: 'ADULT_ONLY', error: 'This feature is available only to members who have declared they are 18 or older.' }); return; }
    next();
  } catch { res.status(503).json({ error: 'Age eligibility could not be confirmed. Try again later.' }); }
};
export const requireGuardianApproval: RequestHandler = async (_req, res, next) => {
  if (!res.locals.identity?.uid) { next(); return; }
  try {
    const claim = await getAgeClaim(res.locals.identity.uid);
    if (claim?.ageBand === 'minor' && claim.guardianStatus !== 'approved') {
      res.status(403).json({ code: 'GUARDIAN_APPROVAL_REQUIRED', error: 'A parent or legal guardian must approve this teen account before it can use the tools.' });
      return;
    }
    next();
  } catch { res.status(503).json({ error: 'Account eligibility could not be confirmed. Try again later.' }); }
};
