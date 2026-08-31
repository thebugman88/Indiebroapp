import {testEncryptionKeys} from './private-fixture';
import {encodeStoredTrack} from '../server/judgement';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleTrack } from '../server/judgementPrivacy';
import { freshJudge, reviewMutation } from '../server/judgement';
import type { ArtistTrack } from '../judgement-zone/src/types';

const original = { id: 'track-1', ownerId: 'owner-private', title: 'Secret title', artistName: 'Secret artist',
  rightsHolderSignature: 'Private signature', lyricsText: 'Private lyrics', genre: 'Hip-Hop', mood: 'calm',
  durationSeconds: 60, uploadedAt: '2026-08-30', ownershipConfirmed: true, status: 'evaluating', targetJudges: 10,
  audioPath: 'judgement/owner-private/track-1', audioBlobUrl: 'https://storage.invalid/owner-private',
  futurePrivateField: 'do not serialize', reviews: [],
} as unknown as ArtistTrack & { audioPath: string };
const judge = { ...freshJudge('reviewer-private'), termsAccepted: true };
const reviewed = reviewMutation(original, judge, { scores: {lyrics: 8, vocals: 7, instrumentation: 9, vibe: 8}, writtenFeedback: 'A useful detailed review of the track.' }, Date.now() - 61000).track;

test('blind tracks reveal no title, signature, review identities or storage owner path', () => {
  const blind = visibleTrack(reviewed, 'unrelated');
  const raw = JSON.stringify(blind);
  for (const secret of ['owner-private', 'reviewer-private', 'Secret title', 'Secret artist', 'Private signature', 'Private lyrics', 'futurePrivateField', 'storage.invalid']) assert.equal(raw.includes(secret), false, secret);
  assert.equal(blind.audioBlobUrl, '/api/judgement/tracks/track-1/audio');
  assert.deepEqual(blind.reviews, []);
  assert.equal(blind.aggregatedScores.totalReviews, 1);
});

test('review unlocks artist metadata only for that judge; signature and other identities remain private', () => {
  const own = visibleTrack(reviewed, 'owner-private');
  assert.equal(own.rightsHolderSignature, 'Private signature');
  assert.equal(own.reviews[0].judgeId, '');
  assert.equal(JSON.stringify(own).includes('reviewer-private'), false);
  const judgeView = visibleTrack(reviewed, 'reviewer-private');
  assert.equal(judgeView.title, 'Secret title');
  assert.equal(judgeView.lyricsText, 'Private lyrics');
  assert.equal(judgeView.rightsHolderSignature, '');
  assert.equal(judgeView.ownerId, undefined);
  assert.equal(visibleTrack({...reviewed, status: 'completed'}, 'unrelated').title, '');
  assert.equal(original.ownerId, 'owner-private', 'serialization never mutates stored ownership');
});

test('actual track API ignores forged viewer parameters and requires authentication', async t => {
  const { default: express } = await import('express');
  const { Query } = await import('firebase-admin/firestore');
  const { judgementRouter } = await import('../server/judgement');
  const { createAuthMiddleware } = await import('../server/auth');
  testEncryptionKeys();
  const previous = process.env.FIREBASE_PROJECT_ID;
  process.env.FIREBASE_PROJECT_ID = 'demo-indiebro-audit';
  t.mock.method(Query.prototype, 'get', async () => ({docs:[{data:()=>encodeStoredTrack(reviewed)}]}));
  const app = express();
  app.use(createAuthMiddleware(async token => ({uid: token, email_verified: token !== 'unverified'})));
  app.use('/api/judgement',judgementRouter);
  const server = app.listen(0,'127.0.0.1'); await new Promise<void>(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${(server.address() as any).port}/api/judgement`;
  try {
    assert.equal((await fetch(base+'/tracks')).status,401);
    assert.equal((await fetch(base+'/tracks/track-1/audio')).status,401);
    assert.equal((await fetch(base+'/tracks',{headers:{Authorization:'Bearer unverified'}})).status,403);
    const response=await fetch(base+'/tracks?uid=owner-private&savedVaultTrackIds=track-1',{headers:{Authorization:'Bearer unrelated'}});
    assert.equal(response.status,200);
    const [track]=await response.json();assert.equal(track.title,'');assert.equal(track.ownerId,undefined);
    const owner=await fetch(base+'/tracks',{headers:{Authorization:'Bearer owner-private'}});
    const [owned]=await owner.json();assert.equal(owned.title,'Secret title');assert.equal(owned.reviews[0].judgeId,'');
  } finally {
    t.mock.restoreAll();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));
    if(previous===undefined) delete process.env.FIREBASE_PROJECT_ID;else process.env.FIREBASE_PROJECT_ID=previous;
  }
});
