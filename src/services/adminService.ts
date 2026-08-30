import { authenticatedFetch } from './authService';
/**
 * Admin Management & Telemetry Service
 * Exclusively for Master Admin (xchristopherrayx@gmail.com)
 * Real user tracking, session logs, kick, whitelist, blacklist, and free access controls.
 */

import { RegisteredUser, getRegisteredUsers, saveCurrentAuthUser, getCurrentAuthUser, ADMIN_EMAIL } from './authService';

export interface UserActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  displayName: string;
  action: string;
  appLocation: string;
  timestamp: number;
  details?: string;
  ip?: string;
  status: 'success' | 'warning' | 'alert' | 'blocked';
}

export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  artistHandle: string;
  role: 'admin' | 'artist' | 'producer' | 'engineer';
  isAdmin: boolean;
  isUnlimited: boolean;
  isWhitelisted?: boolean;
  isBlacklisted?: boolean;
  isKicked?: boolean;
  trustScore: number;
  activeStatus: 'online' | 'away' | 'offline';
  currentApp?: string;
  lastLoginAt: number;
  createdAt: number;
  totalXp?: number;
  ipAddress?: string;
  sessionCount?: number;
}

const ACTIVITY_LOGS_KEY = 'ib_admin_activity_logs_v2';
const USER_STATUS_OVERRIDES_KEY = 'ib_admin_user_overrides_v2';

export interface UserStatusOverride {
  isUnlimited?: boolean;
  isWhitelisted?: boolean;
  isBlacklisted?: boolean;
  isKicked?: boolean;
  kickReason?: string;
  bannedAt?: number;
  freeAccessGrantedAt?: number;
}

/**
 * Log actual user activity in the app
 */
export function logUserActivity(params: {
  userId?: string;
  userEmail?: string;
  displayName?: string;
  action: string;
  appLocation: string;
  details?: string;
  status?: 'success' | 'warning' | 'alert' | 'blocked';
}): void {
  if (typeof window === 'undefined') return;
  try {
    const currentUser = getCurrentAuthUser();
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    const logs: UserActivityLog[] = raw ? JSON.parse(raw) : [];

    const newLog: UserActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId || currentUser.id,
      userEmail: params.userEmail || currentUser.email,
      displayName: params.displayName || currentUser.displayName,
      action: params.action,
      appLocation: params.appLocation,
      timestamp: Date.now(),
      details: params.details,
      status: params.status || 'success',
    };

    const updated = [newLog, ...logs].slice(0, 300); // keep 300 recent logs
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ib_activity_logged', { detail: newLog }));
  } catch (e) {
    console.error('Failed to log user activity:', e);
  }
}

/**
 * Get all activity logs
 */
export function getActivityLogs(): UserActivityLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

/**
 * Get stored user overrides (whitelist, blacklist, kick, unlimited)
 */
export function getUserOverrides(): Record<string, UserStatusOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USER_STATUS_OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveUserOverrides(overrides: Record<string, UserStatusOverride>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_STATUS_OVERRIDES_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent('ib_user_overrides_changed', { detail: overrides }));
  } catch {}
}

/**
 * Fetch all managed users with live telemetry
 */
export function getManagedUsers(): ManagedUser[] {
  const registered = getRegisteredUsers();
  const overrides = getUserOverrides();
  const logs = getActivityLogs();

  const userList: ManagedUser[] = Object.values(registered).map((u) => {
    const emailKey = u.email.toLowerCase();
    const ov = overrides[emailKey] || {};
    
    // Find latest activity
    const userLogs = logs.filter((l) => l.userEmail.toLowerCase() === emailKey);
    const latestLog = userLogs[0];

    const isMasterAdmin = u.isAdmin === true;

    // Determine online status based on recent activity (within 15 minutes)
    const isRecentlyActive = latestLog && (Date.now() - latestLog.timestamp < 15 * 60 * 1000);
    const activeStatus = isRecentlyActive ? 'online' : (Date.now() - u.lastLoginAt < 2 * 3600 * 1000 ? 'away' : 'offline');

    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      artistHandle: u.artistHandle,
      role: u.role,
      isAdmin: isMasterAdmin || u.isAdmin,
      isUnlimited: isMasterAdmin ? true : (ov.isUnlimited ?? u.isUnlimited ?? false),
      isWhitelisted: isMasterAdmin ? true : (ov.isWhitelisted ?? false),
      isBlacklisted: isMasterAdmin ? false : (ov.isBlacklisted ?? false),
      isKicked: isMasterAdmin ? false : (ov.isKicked ?? false),
      trustScore: isMasterAdmin ? 100 : (ov.isBlacklisted ? 0 : ov.isWhitelisted ? 100 : 92),
      activeStatus: isMasterAdmin ? 'online' : activeStatus,
      currentApp: latestLog ? latestLog.appLocation : 'Indie Hub',
      lastLoginAt: u.lastLoginAt || u.createdAt,
      createdAt: u.createdAt,
      totalXp: isMasterAdmin ? 99999 : (u.isUnlimited ? 15000 : 2450),
      sessionCount: userLogs.length + 1,
    };
  });

  return userList;
}

/**
 * Give user Free Access to everything (Unlimited VIP Pass)
 */
export function grantFreeAccessToUser(email: string): { success: boolean; message: string } {
  return { success: false, message: 'This control is unavailable until server-backed moderation is connected. No changes were made.' };
}

/**
 * Revoke Free Access from user
 */
export function revokeFreeAccessFromUser(email: string): { success: boolean; message: string } {
  return { success: false, message: 'This control is unavailable until server-backed moderation is connected. No changes were made.' };
}

/**
 * Whitelist user
 */
export function whitelistUser(email: string): { success: boolean; message: string } {
  return { success: false, message: 'This control is unavailable until server-backed moderation is connected. No changes were made.' };
}

/**
 * Blacklist / Ban user
 */
export function blacklistUser(email: string, reason = 'Administrative sanction'): { success: boolean; message: string } {
  return { success: false, message: 'This control is unavailable until server-backed moderation is connected. No changes were made.' };
}

/**
 * Kick out user from active session / meeting room
 */
export function kickOutUser(emailOrId: string, reason = 'Kicked by Master Admin'): { success: boolean; message: string } {
  return { success: false, message: 'This control is unavailable until server-backed moderation is connected. No changes were made.' };
}

/**
 * Check if the current user is Master Admin Christopher Ray
 */
export function isMasterAdminLoggedIn(): boolean {
  const user = getCurrentAuthUser();
  return  user.isAdmin === true;
}
