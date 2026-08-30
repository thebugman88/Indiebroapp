import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withoutProviderCredentials } from '../shared/browserSettings';

test('persisted settings remove all provider keys without mutating active BYOK state', () => {
  const settings = { customApiKey: 'custom-secret', geminiApiKey: 'gemini-secret',
    byokKeys: { spotifyClientSecret: 'spotify-secret', discogsToken: 'discogs-secret', futureKey: 'future-secret' },
    ocrLanguage: 'eng', enableSoundAlerts: true };
  const safe = withoutProviderCredentials(settings);
  assert.equal(safe.customApiKey, '');
  assert.equal(safe.geminiApiKey, '');
  assert.deepEqual(Object.values(safe.byokKeys), ['', '', '']);
  assert.equal(safe.ocrLanguage, 'eng');
  assert.equal(safe.enableSoundAlerts, true);
  assert.equal(settings.geminiApiKey, 'gemini-secret');
  assert.equal(settings.byokKeys.spotifyClientSecret, 'spotify-secret');
  assert.deepEqual(withoutProviderCredentials(safe), safe);
});
