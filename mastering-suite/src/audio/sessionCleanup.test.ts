import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseAudioSession } from './sessionCleanup';

test('releases sources, nodes, object URLs, and contexts despite duplicate release errors', async () => {
  let stopped = 0; let disconnected = 0; let closed = 0;
  const revoked: string[] = [];
  const original = URL.revokeObjectURL;
  URL.revokeObjectURL = (url) => { revoked.push(url); };
  try {
    await releaseAudioSession({
      source: { stop: () => { stopped++; }, disconnect: () => { disconnected++; } },
      nodes: [{ disconnect: () => { disconnected++; } }, { disconnect: () => { throw new Error('already disconnected'); } }],
      context: { close: async () => { closed++; } },
      objectUrls: ['blob:test', null],
    });
  } finally { URL.revokeObjectURL = original; }
  assert.equal(stopped, 1); assert.equal(disconnected, 2); assert.equal(closed, 1); assert.deepEqual(revoked, ['blob:test']);
});
