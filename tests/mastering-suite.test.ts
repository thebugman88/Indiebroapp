import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canMountMasteringSuite } from '../src/masteringSuiteAccess';
import { releaseAudioSession } from '../mastering-suite/src/audio/sessionCleanup';
import { AudioSessionGuard, createGuardedObjectUrl, SessionCancelledError } from '../mastering-suite/src/audio/sessionGuard';
import { runGuardedExport } from '../mastering-suite/src/audio/guardedExport';
import {
  AUDIO_LIMITS,
  detectAudioContainer,
  isValidIsrc,
  validateAudioFileHeader,
  validateAudioFileSize,
  validateDecodedAudio,
} from '../mastering-suite/src/audio/audioInput';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const featureRoot = path.join(root, 'mastering-suite', 'src');

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(item);
    return /\.(?:ts|tsx|css)$/.test(entry.name) ? [item] : [];
  }));
  return nested.flat();
}

test('mastering route eligibility rejects guests and accepts authenticated users', () => {
  assert.equal(canMountMasteringSuite('guest'), false);
  assert.equal(canMountMasteringSuite(''), false);
  assert.equal(canMountMasteringSuite(null), false);
  assert.equal(canMountMasteringSuite('user-123'), true);
});

test('mastering route is lazy, private-gated, and uses behavioral eligibility', async () => {
  const app = await readFile(path.join(root, 'src', 'App.tsx'), 'utf8');
  assert.match(app, /import\('\.\.\/mastering-suite\/src\/App'\)/);
  assert.match(app, /return 'mastering-suite'/);
  const gateStart = app.indexOf('<PrivateWorkspaceGate><Suspense');
  const route = app.indexOf("activeApp === 'mastering-suite'");
  const gateEnd = app.indexOf('</Suspense></PrivateWorkspaceGate>', gateStart);
  assert.ok(gateStart >= 0 && route > gateStart && route < gateEnd);
  assert.match(app, /canMountMasteringSuite\(currentUser\.id\)/);
  assert.match(app, /<MasteringSuiteApp key=\{currentUser\.id\} \/>/);
});

test('mastering feature has no network, storage, server, or legacy compressed-export integration', async () => {
  const files = await sourceFiles(featureRoot);
  const legacyExportTerms = ['m' + 'p3', 'i' + 'd3', 'lame' + 'js', 'browser-' + 'id3-writer'];
  const legacyExportPattern = new RegExp(`\\b(?:${legacyExportTerms.join('|')})\\b`, 'i');
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
    assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB|caches)\s*(?:\.|\[)/);
    assert.doesNotMatch(source, /from\s+['\"](?:firebase|firebase-admin|express|idb)|['\"]\/api\//);
    assert.doesNotMatch(source, legacyExportPattern);
  }
});

test('mastering cleanup releases nodes, URLs, and context even when one release fails', async () => {
  const events: string[] = [];
  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = (url) => { events.push(`revoke:${url}`); };
  try {
    await releaseAudioSession({
      source: { stop: () => events.push('stop'), disconnect: () => events.push('source-disconnect') },
      nodes: [
        { disconnect: () => events.push('node-disconnect') },
        { disconnect: () => { throw new Error('already disconnected'); } },
      ],
      context: { close: async () => { events.push('close'); } },
      objectUrls: ['blob:artwork'],
    });
  } finally {
    URL.revokeObjectURL = originalRevoke;
  }
  assert.deepEqual(events, ['stop', 'source-disconnect', 'node-disconnect', 'revoke:blob:artwork', 'close']);
});

test('account change prevents delayed export URL creation and download', async () => {
  const guard = new AudioSessionGuard();
  const token = guard.capture();
  let finishRender!: (value: string) => void;
  const delayedRender = new Promise<string>((resolve) => { finishRender = resolve; });
  let created = 0;
  let downloaded = 0;
  const exportPromise = runGuardedExport({
    token,
    render: () => delayedRender,
    encode: (rendered) => rendered,
    createObjectUrl: () => { created += 1; return 'blob:late-export'; },
    revokeObjectUrl: () => undefined,
    triggerDownload: () => { downloaded += 1; },
  });
  guard.invalidate();
  finishRender('rendered');
  await assert.rejects(exportPromise, SessionCancelledError);
  assert.equal(created, 0);
  assert.equal(downloaded, 0);
});

test('unmount invalidation prevents late artwork object URL creation', async () => {
  const guard = new AudioSessionGuard();
  const token = guard.capture();
  let finishValidation!: (value: string) => void;
  const validation = new Promise<string>((resolve) => { finishValidation = resolve; });
  let created = 0;
  const pending = createGuardedObjectUrl({
    token,
    prepare: () => validation,
    createObjectUrl: () => { created += 1; return 'blob:late-artwork'; },
  });
  guard.invalidate();
  finishValidation('artwork');
  assert.equal(await pending, null);
  assert.equal(created, 0);
});

test('session invalidation revokes an artwork URL created before state commit', async () => {
  const guard = new AudioSessionGuard();
  const token = guard.capture();
  const revoked: string[] = [];
  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = (url) => { revoked.push(url); };
  try {
    const url = await createGuardedObjectUrl({
      token,
      prepare: async () => 'artwork',
      createObjectUrl: () => 'blob:pending-artwork',
      trackObjectUrl: (value) => guard.trackObjectUrl(value),
      revokeObjectUrl: (value) => guard.releaseObjectUrl(value),
    });
    assert.equal(url, 'blob:pending-artwork');
    guard.invalidate();
    assert.deepEqual(revoked, ['blob:pending-artwork']);
  } finally {
    URL.revokeObjectURL = originalRevoke;
  }
});

test('container, decoded-audio, artwork-budget, and optional ISRC limits remain bounded', () => {
  const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
  assert.equal(detectAudioContainer(wav), 'wav');
  assert.throws(() => validateAudioFileSize(AUDIO_LIMITS.maxFileBytes + 1), /100 MB/);
  assert.throws(() => validateAudioFileHeader(AUDIO_LIMITS.maxFileBytes + 1, wav), /100 MB/);
  assert.throws(() => validateDecodedAudio({ duration: 1, numberOfChannels: 3, sampleRate: 48_000, length: 1 }), /mono and stereo/);
  assert.throws(() => validateDecodedAudio({ duration: 1, numberOfChannels: 2, sampleRate: 48_000, length: 30_000_000 }), /memory budget/);
  assert.equal(AUDIO_LIMITS.maxArtworkBytes, 10 * 1024 * 1024);
  assert.equal(AUDIO_LIMITS.maxArtworkDimension, 6_000);
  assert.equal(isValidIsrc(''), true);
  assert.equal(isValidIsrc('US-ABC-26-12345'), true);
  assert.equal(isValidIsrc('NOT AN ISRC'), false);
});

test('production CSP already contains the mastering blob and data allowances', async () => {
  const protection = await readFile(path.join(root, 'server', 'httpProtection.ts'), 'utf8');
  assert.match(protection, /img-src 'self' data: blob:/);
  assert.match(protection, /media-src 'self' data: blob:/);
});
