import { createHash, randomBytes } from 'node:crypto';
import express from 'express';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from './auth';
import { openPrivate, sealPrivate } from './dataProtection';
import { AGE_POLICY_VERSION, LEGAL_CONTACT_EMAIL, PRIVACY_VERSION, TERMS_VERSION } from '../shared/legal';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const db = () => getFirestore(getFirebaseAdminApp());

function validEmail(value: unknown) {
  if (typeof value !== 'string' || value.length > 254 || !emailPattern.test(value.trim())) throw new Error('INVALID_GUARDIAN_EMAIL');
  return value.trim().toLowerCase();
}

async function sendGuardianEmail(to: string, approvalUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.GUARDIAN_EMAIL_FROM;
  if (!apiKey || !from) throw new Error('EMAIL_NOT_CONFIGURED');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Review an indiebrotherhood teen account request',
      text: `A person identifying you as their parent or legal guardian requested permission to use indiebrotherhood's non-community music tools. Hang Out, direct messages, cyphers, battles, and explicit Lyric Pro remain unavailable to minors. Review the request within 7 days: ${approvalUrl}\n\nIf you did not expect this, ignore this email or report it to ${LEGAL_CONTACT_EMAIL}.`,
    }),
  });
  if (!response.ok) throw new Error('EMAIL_DELIVERY_FAILED');
}

export async function requestGuardianConsent(uid: string, accountEmail: string | undefined, guardianEmailValue: unknown) {
  const guardianEmail = validEmail(guardianEmailValue);
  if (accountEmail && guardianEmail === accountEmail.trim().toLowerCase()) throw new Error('GUARDIAN_EMAIL_MUST_DIFFER');
  const claim = await db().doc(`accountAgeClaims/${uid}`).get();
  if (!claim.exists || claim.data()!.ageBand !== 'minor') throw new Error('MINOR_ACCOUNT_REQUIRED');
  if (claim.data()!.guardianStatus === 'approved') throw new Error('ALREADY_APPROVED');
  const token = randomBytes(32).toString('base64url');
  const hash = tokenHash(token);
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const base = (process.env.APP_PUBLIC_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('EMAIL_NOT_CONFIGURED');
  await db().doc(`guardianConsentRequests/${hash}`).create({
    uid,
    status: 'pending',
    expiresAt,
    createdAt: Date.now(),
    guardian: sealPrivate({ email: guardianEmail }, `guardian-consent:${hash}`),
    agePolicyVersion: AGE_POLICY_VERSION,
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
  });
  const approvalUrl = `${base}/api/legal/guardian-consent?token=${encodeURIComponent(token)}`;
  try { await sendGuardianEmail(guardianEmail, approvalUrl); }
  catch (error) {
    await db().doc(`guardianConsentRequests/${hash}`).delete().catch(() => {});
    throw error;
  }
  return { sent: true, expiresAt };
}

function page(message: string, token?: string) {
  const form = token ? `<form method="post" action="/api/legal/guardian-consent"><input type="hidden" name="token" value="${token.replace(/[^A-Za-z0-9_-]/g, '')}"><label><input required type="checkbox" name="attest" value="yes"> I am this member's parent or legal guardian, I am 18 or older, and I consent to their use of the non-community music tools.</label><button type="submit">Approve teen account</button></form>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Guardian consent · indiebrotherhood</title><style>body{margin:0;background:#06080d;color:#eee;font:16px system-ui;display:grid;min-height:100dvh;place-items:center}.card{max-width:650px;margin:20px;padding:28px;border:1px solid #805b00;border-radius:20px;background:#0d101a;line-height:1.55}label{display:block;margin:24px 0}button{width:100%;padding:14px;border:0;border-radius:12px;background:#fbbf24;font-weight:800}a{color:#fbbf24}</style></head><body><main class="card"><h1>Guardian permission</h1><p>${message}</p><p>Minors cannot use Hang Out, direct messages, cyphers, battles, or Lyric Pro explicit mode—even with permission.</p>${form}<p><a href="/api/legal/terms-of-service">Terms</a> · <a href="/api/legal/privacy">Privacy</a></p></main></body></html>`;
}

export const guardianConsentRouter = express.Router();
guardianConsentRouter.get('/guardian-consent', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return res.status(400).type('html').send(page('This approval link is invalid.'));
  const record = await db().doc(`guardianConsentRequests/${tokenHash(token)}`).get().catch(() => null);
  if (!record?.exists || record.data()!.status !== 'pending' || record.data()!.expiresAt <= Date.now()) return res.status(410).type('html').send(page('This approval link is expired or has already been used.'));
  return res.type('html').send(page('Review the request below. Approval unlocks only age-appropriate music tools.', token));
});
guardianConsentRouter.post('/guardian-consent', async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!/^[A-Za-z0-9_-]{43}$/.test(token) || req.body?.attest !== 'yes') return res.status(400).type('html').send(page('Approval requires the guardian attestation.'));
  const hash = tokenHash(token);
  try {
    await db().runTransaction(async transaction => {
      const requestRef = db().doc(`guardianConsentRequests/${hash}`);
      const request = await transaction.get(requestRef);
      if (!request.exists || request.data()!.status !== 'pending' || request.data()!.expiresAt <= Date.now()) throw new Error('EXPIRED');
      const ageRef = db().doc(`accountAgeClaims/${request.data()!.uid}`);
      const age = await transaction.get(ageRef);
      if (!age.exists || age.data()!.ageBand !== 'minor' || age.data()!.guardianStatus === 'approved') throw new Error('INVALID_ACCOUNT');
      const guardian = openPrivate(request.data()!.guardian, `guardian-consent:${hash}`);
      transaction.update(ageRef, { guardianStatus: 'approved', guardianApprovedAt: Date.now(), guardianApprovalVersion: AGE_POLICY_VERSION });
      transaction.update(requestRef, { status: 'approved', approvedAt: Date.now(), guardian: sealPrivate({ email: guardian.email }, `guardian-consent:${hash}`), tokenConsumedAt: FieldValue.serverTimestamp() });
    });
    return res.type('html').send(page('Permission was recorded. The member can now use age-appropriate indiebrotherhood tools.'));
  } catch { return res.status(410).type('html').send(page('This approval link is expired, invalid, or has already been used.')); }
});
