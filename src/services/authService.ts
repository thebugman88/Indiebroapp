import { lockPrivateStorage, unlockPrivateStorage, privateStorageStatus, failPrivateStorage, privateStorageFor, flushPrivateStorage } from '../../shared/privateStorage';
import { bindRequestSession } from '../../shared/requestSession';
import { clearLegacyAuthStorage } from '../../shared/legacyAuthStorage';
import { AI_ACTIONS, ECONOMY_VERSION } from '../../shared/economy';
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, setPersistence, inMemoryPersistence, onIdTokenChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, sendEmailVerification, updateProfile, signOut, type User } from 'firebase/auth';

export interface RegisteredUser {
  id: string;
  email: string;
  displayName: string;
  artistHandle: string;
  role: 'admin' | 'artist' | 'producer' | 'engineer';
  isAdmin: boolean;
  isUnlimited: boolean;
  avatarUrl: string;
  avatarSeed: string;
  avatarBg: string;
  bio?: string;
  dawSetup?: string;
  proAffiliation?: string;
  labelDistributor?: string;
  isrcPrefix?: string;
  studioAura: 'gold' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'crimson';
  spotifyUrl?: string;
  appleMusicUrl?: string;
  instagramUrl?: string;
  createdAt: number;
  lastLoginAt: number;
}

export interface CatalogTrack {
  trackId: string | number;
  trackName: string;
  collectionName: string;
  artistName: string;
  artistId?: string | number;
  releaseDate: string;
  trackTimeMillis: number;
  previewUrl: string;
  artworkUrl: string;
  primaryGenreName: string;
  trackViewUrl?: string;
  priceUsd?: string;
  isrc?: string;
  customNotes?: string;
  isAuditedInHitAnalyzer?: boolean;
  isLyricOptimized?: boolean;
}

export interface VerifiedArtistInfo {
  artistId: string | number;
  artistName: string;
  primaryGenreName: string;
  artworkUrl: string;
  artistLinkUrl?: string;
  claimedAt: number;
  totalCatalogTracks: number;
}

// Display/contact information only. Never use this address as an authorization rule.
export const ADMIN_EMAIL = 'xchristopherrayx@gmail.com';
export const GUEST_USER: RegisteredUser = {
  id: 'guest', email: '', displayName: 'Guest Artist', artistHandle: '', role: 'artist',
  isAdmin: false, isUnlimited: false, avatarUrl: '', avatarSeed: 'GA',
  avatarBg: 'from-amber-400 via-rose-500 to-purple-600', studioAura: 'gold',
  createdAt: 0, lastLoginAt: 0,
};
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const isAuthConfigured = Object.values(config).every(Boolean);
const app = isAuthConfigured
  ? getApps().find(a => a.name === 'suite-auth') || initializeApp(config, 'suite-auth') : null;
let referralAppCheck: Promise<import('firebase/app-check').AppCheck>|undefined;
async function referralAttestation() {
  const siteKey=import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
  if(!app||!siteKey)throw new Error('Referral security is not configured yet. Your other tools remain available.');
  const sdk=await import('firebase/app-check');
  referralAppCheck??=Promise.resolve(sdk.initializeAppCheck(app,{provider:new sdk.ReCaptchaEnterpriseProvider(siteKey),isTokenAutoRefreshEnabled:false}));
  return (await sdk.getLimitedUseToken(await referralAppCheck)).token;
}
let reusedAuth=false;
const auth = app ? (()=>{
  try{return initializeAuth(app,{persistence:inMemoryPersistence});}
  catch(error){if((error as {code?:string}).code!=='auth/already-initialized')throw error;reusedAuth=true;return getAuth(app);}
})() : null;
const persistenceReady = auth ? clearLegacyAuthStorage(config.apiKey,'suite-auth').then(async()=>{if(reusedAuth)await signOut(auth);await setPersistence(auth,inMemoryPersistence);}) : Promise.resolve();
let currentUser: RegisteredUser = { ...GUEST_USER };
let authRevision = 0;

// Discard insecure demo credentials. Catalog and creative drafts are left untouched.
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ib_auth_current_user_v2');
    localStorage.removeItem('ib_auth_registered_users_v2');
    localStorage.removeItem('hangout_artist_profile');
    localStorage.removeItem('indie_current_auth_user');
  } catch { /* Storage may be disabled. */ }
}

function publishUser(user: RegisteredUser) {
  currentUser = user;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ib_auth_changed', { detail: { ...user } }));
  }
}

async function syncUser(user: User | null): Promise<RegisteredUser> {
  const revision = ++authRevision;
  if (!user || user.isAnonymous || privateStorageStatus().uid !== user.uid) {
    lockPrivateStorage();
    // Clear identity-driven UI (including DMs outside the workspace gate)
    // before waiting for the next account's token or encryption keys.
    if(currentUser.id!=='guest'&&currentUser.id!==user?.uid)publishUser({...GUEST_USER});
  }
  if (!user || user.isAnonymous) {
    publishUser({ ...GUEST_USER });
    return getCurrentAuthUser();
  }
  const token = await user.getIdTokenResult();
  if (revision !== authRevision || auth?.currentUser?.uid !== user.uid) return getCurrentAuthUser();
  const isAdmin = token.claims.admin === true && token.claims.email_verified === true;
  const profile: RegisteredUser = {
    ...GUEST_USER, id: user.uid, email: user.email || '',
    displayName: user.displayName || 'Independent Artist',
    artistHandle: (user.displayName || 'artist').toLowerCase().replace(/[^a-z0-9]/g, '_'),
    avatarUrl: user.photoURL || '', avatarSeed: (user.displayName || 'IA').slice(0, 2).toUpperCase(),
    role: isAdmin ? 'admin' : 'artist', isAdmin, isUnlimited: isAdmin,
    createdAt: Date.parse(user.metadata.creationTime || '') || 0, lastLoginAt: Date.now(),
  };
  try {
    if(privateStorageStatus().status!=='ready'||privateStorageStatus().uid!==user.uid) await unlockForUser(user);
    if (revision !== authRevision || auth?.currentUser?.uid !== user.uid) return getCurrentAuthUser();
    const saved = JSON.parse(privateStorageFor(user.uid).getItem(`ib_profile_details_v3:${user.uid}`) || '{}');
    for (const field of PROFILE_FIELDS) if (typeof saved[field] === 'string') (profile as any)[field] = saved[field];
  } catch { if(revision===authRevision&&auth?.currentUser?.uid===user.uid) failPrivateStorage(); }
  if (revision !== authRevision || auth?.currentUser?.uid !== user.uid) return getCurrentAuthUser();
  publishUser(profile);
  return getCurrentAuthUser();
}
const PROFILE_FIELDS = ['displayName', 'artistHandle', 'avatarUrl', 'avatarSeed', 'avatarBg', 'bio',
  'dawSetup', 'proAffiliation', 'labelDistributor', 'isrcPrefix', 'studioAura', 'spotifyUrl', 'appleMusicUrl', 'instagramUrl'] as const;
if (auth) onIdTokenChanged(auth, user => {
  void persistenceReady.then(()=>{if(auth.currentUser?.uid===user?.uid)return syncUser(user);}).catch(() => {lockPrivateStorage();publishUser({ ...GUEST_USER });});
});

export function getCurrentAuthUser(): RegisteredUser { return { ...currentUser }; }
export function saveCurrentAuthUser(user: RegisteredUser): void {
  if (!auth?.currentUser || auth.currentUser.uid !== user.id) return;
  const details: Record<string, string> = {};
  for (const field of PROFILE_FIELDS) if (typeof user[field] === 'string') details[field] = user[field];
  try { privateStorageFor(user.id).setItem(`ib_profile_details_v3:${user.id}`, JSON.stringify(details)); } catch {}
  publishUser({ ...currentUser, ...details });
}
// This is the current browser's profile, not a server-wide user directory.
export function getRegisteredUsers(): Record<string, RegisteredUser> {
  return currentUser.id === 'guest' ? {} : { [currentUser.email]: getCurrentAuthUser() };
}
function requireAuthClient() {
  if (!auth) throw new Error('Sign-in is unavailable until Firebase Authentication is configured.');
  return auth;
}
function authError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') return 'Email or password is incorrect.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
  if (code === 'auth/weak-password') return 'Choose a stronger password (at least 8 characters).';
  if (code === 'auth/email-already-in-use') return 'Unable to create this account. Try signing in or resetting your password.';
  return 'Authentication is unavailable. Check your connection and try again.';
}
export async function loginUser(email: string, password: string) {
  if (!auth) return { success: false, error: 'Firebase sign-in is not configured yet.' };
  try {
    await persistenceReady;
    const result = await signInWithEmailAndPassword(requireAuthClient(), email.trim(), password);
    return { success: true, user: await syncUser(result.user) };
  } catch (error) { return { success: false, error: authError(error) }; }
}
export async function registerUser(params: { email: string; displayName: string; password: string }) {
  if (!auth) return { success: false, error: 'Firebase sign-in is not configured yet.' };
  if (!params.displayName.trim() || params.password.length < 8) return { success: false, error: 'Enter a name and a password of at least 8 characters.' };
  try {
    await persistenceReady;
    const result = await createUserWithEmailAndPassword(requireAuthClient(), params.email.trim(), params.password);
    await updateProfile(result.user, { displayName: params.displayName.trim() });
    let message = 'Account created. Check your email to verify your address.';
    try { await sendEmailVerification(result.user); } catch { message = 'Account created. Verification email could not be sent; use Resend verification.'; }
    return { success: true, user: await syncUser(result.user), message };
  } catch (error) { return { success: false, error: authError(error) }; }
}
export async function recoverAccount(params: { email: string }) {
  if (!auth) return { success: false, error: 'Firebase sign-in is not configured yet.' };
  try {
    await sendPasswordResetEmail(requireAuthClient(), params.email.trim());
    return { success: true, message: 'If this address has an account, a password reset email will arrive shortly.' };
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/user-not-found') return { success: true, message: 'If this address has an account, a password reset email will arrive shortly.' };
    return { success: false, error: authError(error) };
  }
}
const logoutChannel=typeof window!=='undefined'&&typeof window.BroadcastChannel==='function'?new BroadcastChannel('ib-private-session-logout'):null;
async function endSession(broadcast:boolean) {
  const closingUser=auth?.currentUser;
  const saving=flushPrivateStorage().catch(()=>{});
  authRevision++;lockPrivateStorage();publishUser({...GUEST_USER});
  if(broadcast)logoutChannel?.postMessage('logout');
  await saving;
  if(auth&&auth.currentUser===closingUser)await signOut(auth);
}
if(logoutChannel)logoutChannel.onmessage=event=>{if(event.data==='logout')void endSession(false);};
export async function logoutUser() {await endSession(true);}
export async function resendVerification() {
  const user = requireAuthClient().currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in first.');
  await sendEmailVerification(user);
}
export async function getSuiteIdToken(): Promise<string> {
  const client = requireAuthClient(); await persistenceReady; await client.authStateReady();
  if (!client.currentUser || client.currentUser.isAnonymous) throw new Error('Sign in to continue.');
  return client.currentUser.getIdToken();
}
export async function authenticatedFetch(input: string, init: RequestInit = {}) {
  const client = requireAuthClient();
  await persistenceReady; await client.authStateReady();
  if (!client.currentUser || client.currentUser.isAnonymous) throw new Error('Sign in to continue.');
  // Never forward a bearer token to an external URL.
  const user=client.currentUser;
  const inSession=bindRequestSession(()=>client.currentUser,()=>privateStorageStatus().revision);
  const target = new URL(input, window.location.origin);
  if (target.origin !== window.location.origin) throw new Error('Authenticated requests must use the suite backend.');
  const headers = new Headers(init.headers);
  const action = AI_ACTIONS[target.pathname];
  if ((init.method || 'GET').toUpperCase() === 'POST' && action) {
    if (action.cost > 0 && !window.confirm(`${action.name} costs ${action.cost} Brotherhood Coins. Included Coins are spent first. Failed cloud requests restore their Coins. Continue?`)) throw new Error('AI request canceled. No Coins spent.');
    headers.set('x-request-id', crypto.randomUUID());
    headers.set('x-economy-version', ECONOMY_VERSION);
    headers.set('x-coin-consent', String(action.cost));
  }
  headers.set('Authorization', `Bearer ${await inSession(()=>user.getIdToken())}`);
  const referralMutation=target.pathname.startsWith('/api/referrals/')&&!target.pathname.startsWith('/api/referrals/admin/')&&(init.method||'GET').toUpperCase()==='POST';
  if(referralMutation)headers.set('X-Firebase-AppCheck',await inSession(referralAttestation));
  return inSession(()=>fetch(target, { ...init, headers, cache: 'no-store', credentials: referralMutation?'same-origin':'omit', redirect:'error' }));
}

export const STUDIO_AURAS: {
  id: RegisteredUser['studioAura'];
  name: string;
  glowClass: string;
  badgeClass: string;
  hex: string;
}[] = [
  { id: 'gold', name: 'Imperial Gold', glowClass: 'ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.5)]', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', hex: '#f59e0b' },
  { id: 'cyan', name: 'Cyber Cyan', glowClass: 'ring-2 ring-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.5)]', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', hex: '#06b6d4' },
  { id: 'emerald', name: 'Sonic Emerald', glowClass: 'ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', hex: '#10b981' },
  { id: 'violet', name: 'Royal Violet', glowClass: 'ring-2 ring-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.5)]', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40', hex: '#a855f7' },
  { id: 'rose', name: 'Rose Quartz', glowClass: 'ring-2 ring-rose-400/80 shadow-[0_0_20px_rgba(244,63,94,0.5)]', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40', hex: '#f43f5e' },
  { id: 'crimson', name: 'Apex Crimson', glowClass: 'ring-2 ring-red-400/80 shadow-[0_0_20px_rgba(239,68,68,0.5)]', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40', hex: '#ef4444' },
];

async function unlockForUser(user: User) {
  const revision = privateStorageStatus().revision;
  const token = await user.getIdToken();
  const response = await fetch('/api/privacy/key', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', credentials: 'omit', redirect:'error' });
  if (!response.ok) throw new Error('Secure workspace unavailable.');
  const material = await response.json();
  if (auth?.currentUser?.uid !== user.uid) return;
  await unlockPrivateStorage(user.uid, material, revision);
}
export async function retryPrivateUnlock() {
  if (!auth?.currentUser) return;
  const user=auth.currentUser;
  try {await user.reload();await user.getIdToken(true);if(auth.currentUser===user)await syncUser(user);}
  catch {if(auth.currentUser===user)failPrivateStorage();}
}
