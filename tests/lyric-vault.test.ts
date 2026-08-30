import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLyricVault } from '../lyric-pro-studio/src/vault';
import type { SavedLyricEntry } from '../lyric-pro-studio/src/types';

function fixture() {
  const records = new Map<string, string>();
  let uid = 'artist-a';
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); },
    removeItem: (key: string) => { records.delete(key); },
  };
  return { records, storage, switchTo: (next: string) => { uid = next; },
    vault: () => createLyricVault(uid, () => uid, () => storage) };
}
const draft = [{ id: 'private-draft', setA: { content: 'Unreleased song' } }] as SavedLyricEntry[];

test('different accounts cannot load or clear each other’s lyric vault or guidelines', () => {
  const f = fixture();
  f.vault().save(draft);
  f.vault().acceptTerms();
  f.switchTo('artist-b');
  assert.deepEqual(f.vault().load(), []);
  assert.equal(f.vault().acceptedTerms(), false);
  f.vault().save([]);
  f.vault().clear();
  f.switchTo('artist-a');
  assert.deepEqual(f.vault().load(), draft);
  assert.equal(f.vault().acceptedTerms(), true);
});

test('stale account handlers cannot read, save or delete after switching accounts', () => {
  const f = fixture();
  const old = f.vault();
  old.save(draft);
  f.switchTo('artist-b');
  for (const action of [() => old.load(), () => old.save([]), () => old.clear(), () => old.acceptTerms()]) {
    assert.throws(action, /Account changed/);
  }
  f.switchTo('artist-a');
  assert.deepEqual(f.vault().load(), draft);
});

test('legacy drafts remain untouched and guests never persist or inherit a vault', () => {
  const f = fixture();
  const legacy = JSON.stringify(draft);
  f.records.set('lyric_pro_saved_vault', legacy);
  f.records.set('lyric_pro_tos_accepted', 'true');
  assert.deepEqual(f.vault().load(), []);
  assert.equal(f.vault().acceptedTerms(), false);
  f.vault().clear();
  f.switchTo('guest');
  assert.deepEqual(f.vault().load(), []);
  assert.throws(() => f.vault().save(draft), /Sign in/);
  assert.throws(() => f.vault().clear(), /Sign in/);
  f.vault().acceptTerms();
  assert.equal(f.vault().acceptedTerms(), false);
  assert.equal(f.records.get('lyric_pro_saved_vault'), legacy);
});

test('storage failures and malformed vaults are reported instead of claiming success', () => {
  const f = fixture();
  f.records.set('lyric_pro_vault_v2:artist-a', '{}');
  assert.throws(() => f.vault().load(), /damaged/);
  f.storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => f.vault().save(draft), /Quota exceeded/);
  const blocked = createLyricVault('artist-a', () => 'artist-a', () => { throw new Error('Storage blocked'); });
  assert.throws(() => blocked.load(), /Storage blocked/);
  assert.throws(() => blocked.save(draft), /Storage blocked/);
});
