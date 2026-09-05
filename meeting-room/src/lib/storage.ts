import { currentPrivateStorage } from '../../../shared/privateStorage';
import type { UserRole } from '../types';

const STORAGE_KEYS = {
  USER_NAME: 'mr_user_name',
  USER_ROLE: 'mr_user_role',
  USER_COLOR: 'mr_user_color',
  ROOM_ID: 'mr_last_room_id',
  SAVED_MINUTES: 'mr_saved_minutes',
};

const PALETTE = [
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
  '#DB2777', // Pink
];

export function getRandomColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export function loadUserPrefs(): { name: string; role: UserRole; color: string; roomId: string } {
  try {
    const name = currentPrivateStorage().getItem(STORAGE_KEYS.USER_NAME) || '';
    const role = (currentPrivateStorage().getItem(STORAGE_KEYS.USER_ROLE) as UserRole) || 'attendee';
    const color = currentPrivateStorage().getItem(STORAGE_KEYS.USER_COLOR) || getRandomColor();
    const roomId = currentPrivateStorage().getItem(STORAGE_KEYS.ROOM_ID) || 'general';
    return { name, role, color, roomId };
  } catch {
    return { name: '', role: 'attendee', color: '#2563EB', roomId: 'general' };
  }
}

export function saveUserPrefs(prefs: { name?: string; role?: UserRole; color?: string; roomId?: string }) {
  try {
    if (prefs.name !== undefined) currentPrivateStorage().setItem(STORAGE_KEYS.USER_NAME, prefs.name);
    if (prefs.role !== undefined) currentPrivateStorage().setItem(STORAGE_KEYS.USER_ROLE, prefs.role);
    if (prefs.color !== undefined) currentPrivateStorage().setItem(STORAGE_KEYS.USER_COLOR, prefs.color);
    if (prefs.roomId !== undefined) currentPrivateStorage().setItem(STORAGE_KEYS.ROOM_ID, prefs.roomId);
  } catch (e) {
    console.warn('Unable to persist to localStorage', e);
  }
}
