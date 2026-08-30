import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import type { RequestHandler } from 'express';

export type VerifiedIdentity = Pick<DecodedIdToken, 'uid' | 'email' | 'email_verified'> & { admin?: boolean };
export type TokenVerifier = (token: string) => Promise<VerifiedIdentity>;

export function getFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase server authentication is not configured.');
  const name = 'suite-server';
  return getApps().find(app => app.name === name) || initializeApp({
    projectId,
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault(),
  }, name);
}

export async function verifyFirebaseToken(token: string): Promise<VerifiedIdentity> {
  const app = getFirebaseAdminApp();
  // Also reject revoked tokens and disabled accounts.
  const decoded = await getAuth(app).verifyIdToken(token, true);
  if (decoded.firebase?.sign_in_provider === 'anonymous') throw new Error('A registered account is required.');
  return decoded;
}

export function createAuthMiddleware(verify: TokenVerifier = verifyFirebaseToken): RequestHandler {
  return async (req, res, next) => {
    const match = /^Bearer ([^\s]+)$/.exec(req.get('authorization') || '');
    if (!match) { res.status(401).json({ error: 'Sign in to continue.' }); return; }
    try {
      const identity = await verify(match[1]);
      if (!identity.uid) throw new Error('Missing subject.');
      res.locals.identity = identity;
      next();
    } catch {
      res.status(401).json({ error: 'Your session is invalid or expired. Sign in again.' });
    }
  };
}
export const requireAuth = createAuthMiddleware();
export const requireAdmin: RequestHandler = (_req, res, next) => {
  const identity = res.locals.identity as VerifiedIdentity | undefined;
  if (!identity?.admin || identity.admin !== true || identity.email_verified !== true) {
    res.status(403).json({ error: 'A verified administrator account is required.' }); return;
  }
  next();
};
export const requireVerifiedEmail: RequestHandler = (_req, res, next) => {
  if (res.locals.identity?.email_verified !== true) {
    res.status(403).json({ error: 'Verify your email to use this feature.' }); return;
  }
  next();
};
