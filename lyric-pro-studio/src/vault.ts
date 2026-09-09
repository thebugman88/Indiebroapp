import { retainLyricPairs } from '../../shared/lyricRetention';
import type { SavedLyricEntry } from './types';

// The production storage adapter encrypts this account-scoped temporary cache.
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
      const retained = retainLyricPairs(entries);
      if (retained.length !== entries.length) storage().setItem(key, JSON.stringify(retained));
      return retained;
    },
    save(entries: SavedLyricEntry[]) {
      writable();
      storage().setItem(key, JSON.stringify(retainLyricPairs(entries)));
    },
    clear() { writable(); storage().removeItem(key); },
    noticeSuppressed() { check(); return uid !== "guest" && storage().getItem(`${key}:notice`) === "true"; },
    suppressNotice() { writable(); storage().setItem(`${key}:notice`, "true"); },
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
