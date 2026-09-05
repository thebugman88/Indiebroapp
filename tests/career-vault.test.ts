import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCareerVault, emptyCareerSnapshot } from '../indiebrotherhood-artist-assistant/src/lib/storage';

function fixture() {
  let uid = 'artist-a';
  let revision = 0;
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
  return { data, storage,
    switchTo(next: string) { uid = next; revision++; },
    vault() {
      const owner = uid, session = revision;
      return createCareerVault(owner, () => owner === uid && session === revision, () => storage);
    },
  };
}
function privateSnapshot() {
  const snapshot = emptyCareerSnapshot();
  snapshot.profile.artistName = 'Private Artist';
  snapshot.settings.customApiKey = 'private-provider-secret';
  for (const field of ['songs', 'folders', 'documents', 'events', 'chatMessages'] as const) {
    (snapshot[field] as any[]) = [{ id: `${field}-private`, name: 'Private draft', content: 'Private content' }];
  }
  return snapshot;
}

test('career catalog, documents, schedule, chat, profile and settings are isolated by account', () => {
  const f = fixture();
  const original = privateSnapshot();
  f.vault().save(original);
  const stored = f.vault().load();
  assert.equal(stored.settings.customApiKey, '');
  f.switchTo('artist-b');
  const empty = f.vault().load();
  assert.equal(empty.profile.artistName, '');
  assert.deepEqual(empty.songs, []);
  assert.deepEqual(empty.documents, []);
  assert.deepEqual(empty.events, []);
  assert.deepEqual(empty.chatMessages, []);
  assert.ok(!f.vault().export(empty).includes('Private Artist'));
  f.vault().reset(empty);
  f.switchTo('artist-a');
  assert.deepEqual(f.vault().load(), stored);
  const record = JSON.parse(f.data.get('ib_career_v2:artist-a')!);
  assert.equal(record.ownerUid, 'artist-a');
  assert.equal(record.schemaVersion, 2);
  assert.ok(record.createdAt && record.updatedAt);
});

test('stale saves, reset and exports remain blocked after logout and return to the same account', () => {
  const f = fixture();
  const old = f.vault();
  old.save(privateSnapshot());
  const before = f.data.get('ib_career_v2:artist-a');
  f.switchTo('guest');
  f.switchTo('artist-a');
  for (const action of [() => old.load(), () => old.save(emptyCareerSnapshot()),
    () => old.reset(emptyCareerSnapshot()), () => old.export(privateSnapshot())]) {
    assert.throws(action, /Account changed/);
  }
  assert.equal(f.data.get('ib_career_v2:artist-a'), before);
});

test('legacy data is never claimed and guests do not persist a workspace', () => {
  const f = fixture();
  f.data.set('indie_songs', '[{"id":"legacy-private"}]');
  assert.deepEqual(f.vault().load().songs, []);
  f.switchTo('guest');
  assert.equal(f.vault().save(privateSnapshot()), false);
  f.vault().reset(privateSnapshot());
  assert.deepEqual([...f.data.keys()], ['indie_songs']);
  assert.ok(f.vault().export(privateSnapshot()).includes('Private Artist'));
});

test('a failed write preserves saved data and allows export of unsaved work without credentials', () => {
  const f = fixture();
  const vault = f.vault();
  vault.save(emptyCareerSnapshot());
  const before = f.data.get('ib_career_v2:artist-a');
  f.storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => vault.save(privateSnapshot()), /QuotaExceededError/);
  assert.throws(() => vault.reset(privateSnapshot()), /QuotaExceededError/);
  assert.equal(f.data.get('ib_career_v2:artist-a'), before);
  const exported = vault.export(privateSnapshot());
  assert.ok(exported.includes('Private Artist'));
  assert.ok(!exported.includes('private-provider-secret'));
});

test('corrupt, foreign-owner and unsupported-version records cannot be overwritten', () => {
  const f = fixture();
  for (const raw of ['broken json', 'null', '', JSON.stringify({ ownerUid: 'artist-b', schemaVersion: 2, snapshot: emptyCareerSnapshot() }),
    JSON.stringify({ ownerUid: 'artist-a', schemaVersion: 999, snapshot: emptyCareerSnapshot() }),
    JSON.stringify({ ownerUid: 'artist-a', schemaVersion: 2, snapshot: { ...emptyCareerSnapshot(), songs: [null] } })]) {
    f.data.set('ib_career_v2:artist-a', raw);
    assert.throws(() => f.vault().load());
    assert.throws(() => f.vault().save(emptyCareerSnapshot()));
    assert.equal(f.data.get('ib_career_v2:artist-a'), raw);
  }
});

test('reset clears only creator work, retains profile/preferences and restores default folders', () => {
  const f = fixture();
  const vault = f.vault();
  vault.save(privateSnapshot());
  vault.reset(privateSnapshot());
  const saved = vault.load();
  assert.equal(saved.profile.artistName, 'Private Artist');
  assert.deepEqual(saved.songs, []);
  assert.deepEqual(saved.documents, []);
  assert.deepEqual(saved.events, []);
  assert.deepEqual(saved.chatMessages, []);
  assert.deepEqual(saved.folders, emptyCareerSnapshot().folders);
  assert.equal(saved.settings.customApiKey, '');
});
