import type { SavedLyricEntry } from './types';

// Browser separation only: not encryption or protection from someone with device access.
export function createLyricVault(
  uid: string,
  currentUid: () => string,
  storage: () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
) {
  const key = `lyric_pro_vault_v2:${encodeURIComponent(uid)}`;
  const termsKey = `${key}:guidelines`;
  const check = () => {
    if (currentUid() !== uid) throw new Error('Account changed. Reopen your vault.');
  };
  const writable = () => {
    check();
    if (!uid || uid === 'guest') throw new Error('Sign in before saving a vault.');
  };
  return {
    load(): SavedLyricEntry[] {
      check();
      if (!uid || uid === 'guest') return [];
      const entries = JSON.parse(storage().getItem(key) || '[]');
      if (!Array.isArray(entries)) throw new Error('Saved vault is damaged.');
      return entries;
    },
    save(entries: SavedLyricEntry[]) {
      writable();
      storage().setItem(key, JSON.stringify(entries));
    },
    clear() { writable(); storage().removeItem(key); },
    acceptedTerms() {
      check();
      return uid !== 'guest' && !!uid && storage().getItem(termsKey) === 'true';
    },
    acceptTerms() {
      check();
      if (uid && uid !== 'guest') storage().setItem(termsKey, 'true');
    },
  };
}
