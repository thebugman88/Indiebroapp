/**
 * Authentication, Admin Privileges & Account Recovery Service
 * Supports Master Admin (xchristopherrayx@gmail.com with unlimited access),
 * Passkeys, Security Questions for 1-click password/login recovery,
 * and Real-World Artist Environment Profile Synchronization.
 */

export interface RegisteredUser {
  id: string;
  email: string;
  displayName: string;
  artistHandle: string;
  role: 'admin' | 'artist' | 'producer' | 'engineer';
  isAdmin: boolean;
  isUnlimited: boolean;
  password?: string;
  passkey: string;
  securityQuestion: string;
  securityAnswer: string;
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

const AUTH_USER_KEY = 'ib_auth_current_user_v2';
const USERS_REGISTRY_KEY = 'ib_auth_registered_users_v2';
const ARTIST_CATALOG_KEY = 'ib_artist_verified_catalog_v2';
const ARTIST_INFO_KEY = 'ib_artist_verified_info_v2';

export const ADMIN_EMAIL = 'xchristopherrayx@gmail.com';

// Default Master Admin Profile
export const DEFAULT_MASTER_ADMIN: RegisteredUser = {
  id: 'admin_christopher_ray',
  email: ADMIN_EMAIL,
  displayName: 'Christopher Ray (Founder)',
  artistHandle: 'christopherray',
  role: 'admin',
  isAdmin: true,
  isUnlimited: true,
  passkey: 'MASTER-IB-2026',
  securityQuestion: 'What is the supreme music creation suite?',
  securityAnswer: 'indiebrotherhood',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  avatarSeed: 'CR',
  avatarBg: 'from-amber-400 via-rose-500 to-purple-600',
  bio: 'Founder & Master Architect of indiebrotherhood ecosystem. Unlimited authority & full studio privileges enabled.',
  dawSetup: 'Ableton Live 12 Suite & Universal Audio DSP',
  proAffiliation: 'ASCAP / Independent',
  labelDistributor: 'indiebrotherhood Records / DistroKid',
  isrcPrefix: 'US-IBH-2026',
  studioAura: 'gold',
  spotifyUrl: 'https://open.spotify.com',
  appleMusicUrl: 'https://music.apple.com',
  instagramUrl: 'https://instagram.com/indiebrotherhood',
  createdAt: 1704067200000,
  lastLoginAt: Date.now(),
};

export const SECURITY_QUESTIONS = [
  'What is the name of your first musical project, band, or beat?',
  'What was your first audio workstation (DAW) or sampler?',
  'What is the title of your all-time favorite song or anthem?',
  'What city or town was your first song written in?',
  'What is the brand of your primary studio microphone or headphones?',
];

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

/**
 * Load current authenticated user (defaults to Admin Christopher Ray for seamless unlimited access)
 */
export function getCurrentAuthUser(): RegisteredUser {
  if (typeof window === 'undefined') return DEFAULT_MASTER_ADMIN;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If email is master admin, ensure admin flags remain strictly true
      if (parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        parsed.isAdmin = true;
        parsed.isUnlimited = true;
        parsed.role = 'admin';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load current auth user:', e);
  }

  // Save default Master Admin if first run
  saveCurrentAuthUser(DEFAULT_MASTER_ADMIN);
  return DEFAULT_MASTER_ADMIN;
}

export function saveCurrentAuthUser(user: RegisteredUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // Keep users registry updated
    const registry = getRegisteredUsers();
    registry[user.email.toLowerCase()] = user;
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));

    // Also sync to hangout_artist_profile so Hang Out instantly shows updated picture & handle
    const hangoutProfile = {
      id: user.id,
      nickname: user.displayName,
      role: user.role === 'admin' ? 'Founder & Producer' : 'Producer',
      avatarUrl: user.avatarUrl,
      favoriteGenre: 'Hip-Hop',
      battlesWon: 12,
      battlesTotal: 15,
      reputation: 99,
      isAdmin: user.isAdmin,
      isUnlimited: user.isUnlimited,
      studioAura: user.studioAura,
    };
    localStorage.setItem('hangout_artist_profile', JSON.stringify(hangoutProfile));

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('ib_auth_changed', { detail: user }));
  } catch (e) {
    console.error('Failed to save auth user:', e);
  }
}

export function getRegisteredUsers(): Record<string, RegisteredUser> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed[ADMIN_EMAIL.toLowerCase()]) {
        parsed[ADMIN_EMAIL.toLowerCase()] = DEFAULT_MASTER_ADMIN;
      }
      return parsed;
    }
  } catch {
    // fallback
  }
  const initial = { [ADMIN_EMAIL.toLowerCase()]: DEFAULT_MASTER_ADMIN };
  try {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

/**
 * 1-Click Master Admin Login
 */
export function loginAsMasterAdmin(): RegisteredUser {
  const admin: RegisteredUser = {
    ...DEFAULT_MASTER_ADMIN,
    lastLoginAt: Date.now(),
  };
  saveCurrentAuthUser(admin);
  return admin;
}

/**
 * Standard Login with Email, Password or Passkey
 */
export function loginUser(
  email: string,
  password?: string,
  passkey?: string
): { success: boolean; user?: RegisteredUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    const admin = loginAsMasterAdmin();
    return { success: true, user: admin };
  }

  const registry = getRegisteredUsers();
  const user = registry[cleanEmail];

  if (!user) {
    return { success: false, error: 'No account found with this email. Click "Create Account" to register.' };
  }

  // Check passkey first
  if (passkey && passkey.trim() && user.passkey && user.passkey.toLowerCase() === passkey.trim().toLowerCase()) {
    user.lastLoginAt = Date.now();
    saveCurrentAuthUser(user);
    return { success: true, user };
  }

  // Check password
  if (password && user.password && user.password === password) {
    user.lastLoginAt = Date.now();
    saveCurrentAuthUser(user);
    return { success: true, user };
  }

  if (passkey && !password) {
    return { success: false, error: 'Invalid Passkey provided.' };
  }

  return { success: false, error: 'Incorrect password. Use Passkey or "Forgot Login" recovery.' };
}

/**
 * Register New Artist User
 */
export function registerUser(params: {
  email: string;
  displayName: string;
  artistHandle?: string;
  password?: string;
  passkey: string;
  securityQuestion: string;
  securityAnswer: string;
  role?: 'admin' | 'artist' | 'producer' | 'engineer';
  avatarUrl?: string;
}): { success: boolean; user?: RegisteredUser; error?: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !params.displayName.trim()) {
    return { success: false, error: 'Email and Display Name are required.' };
  }

  if (!params.securityAnswer.trim()) {
    return { success: false, error: 'Please provide an answer to your security question for account recovery.' };
  }

  const isAdminEmail = cleanEmail === ADMIN_EMAIL.toLowerCase();

  const newUser: RegisteredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: cleanEmail,
    displayName: params.displayName.trim(),
    artistHandle: params.artistHandle?.trim() || params.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    role: isAdminEmail ? 'admin' : (params.role || 'artist'),
    isAdmin: isAdminEmail,
    isUnlimited: isAdminEmail,
    password: params.password || '',
    passkey: params.passkey.trim() || `IB-KEY-${Math.floor(1000 + Math.random() * 9000)}`,
    securityQuestion: params.securityQuestion || SECURITY_QUESTIONS[0],
    securityAnswer: params.securityAnswer.trim().toLowerCase(),
    avatarUrl: params.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(params.displayName)}`,
    avatarSeed: params.displayName.slice(0, 2).toUpperCase(),
    avatarBg: 'from-amber-400 via-rose-500 to-purple-600',
    studioAura: 'gold',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  saveCurrentAuthUser(newUser);
  return { success: true, user: newUser };
}

/**
 * Recover Account / Reset Password via Security Question or Passkey
 */
export function recoverAccount(params: {
  email: string;
  securityAnswer?: string;
  passkey?: string;
  newPassword?: string;
}): { success: boolean; recoveredUser?: RegisteredUser; error?: string; message?: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  const registry = getRegisteredUsers();
  const user = registry[cleanEmail];

  if (!user) {
    return { success: false, error: 'No account found registered under this email address.' };
  }

  let verified = false;

  // 1. Verify via Passkey
  if (params.passkey && params.passkey.trim() && user.passkey) {
    if (params.passkey.trim().toLowerCase() === user.passkey.toLowerCase()) {
      verified = true;
    }
  }

  // 2. Verify via Security Answer
  if (!verified && params.securityAnswer && params.securityAnswer.trim() && user.securityAnswer) {
    if (params.securityAnswer.trim().toLowerCase() === user.securityAnswer.toLowerCase()) {
      verified = true;
    }
  }

  if (!verified) {
    return {
      success: false,
      error: 'Security answer or Passkey did not match the registered records.',
    };
  }

  if (params.newPassword && params.newPassword.trim()) {
    user.password = params.newPassword.trim();
  }

  user.lastLoginAt = Date.now();
  saveCurrentAuthUser(user);

  return {
    success: true,
    recoveredUser: user,
    message: `Account recovered successfully! Logged in as ${user.displayName}. Your active passkey is ${user.passkey}.`,
  };
}

// -------------------------------------------------------------
// VERIFIED ARTIST SONG CATALOG STORAGE & MANAGEMENT
// -------------------------------------------------------------

export function loadVerifiedArtistInfo(): VerifiedArtistInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ARTIST_INFO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function loadVerifiedCatalog(): CatalogTrack[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ARTIST_CATALOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveVerifiedArtistAndCatalog(artist: VerifiedArtistInfo, tracks: CatalogTrack[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ARTIST_INFO_KEY, JSON.stringify(artist));
    localStorage.setItem(ARTIST_CATALOG_KEY, JSON.stringify(tracks));
    window.dispatchEvent(new CustomEvent('ib_catalog_updated', { detail: { artist, tracks } }));
  } catch (e) {
    console.error('Failed to save verified artist & catalog:', e);
  }
}

export function addCustomTrackToCatalog(track: CatalogTrack): CatalogTrack[] {
  const current = loadVerifiedCatalog();
  const updated = [track, ...current];
  const artist = loadVerifiedArtistInfo() || {
    artistId: 'custom_artist',
    artistName: track.artistName,
    primaryGenreName: track.primaryGenreName,
    artworkUrl: track.artworkUrl,
    claimedAt: Date.now(),
    totalCatalogTracks: updated.length,
  };
  artist.totalCatalogTracks = updated.length;
  saveVerifiedArtistAndCatalog(artist, updated);
  return updated;
}
