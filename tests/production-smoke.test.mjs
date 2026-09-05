import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';

test('production server blocks audit exploits without configured credentials', { timeout: 15000 }, async t => {
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    env: { ...process.env, PORT: '0', NODE_ENV: 'production', FIREBASE_PROJECT_ID: '',
      FIREBASE_SERVICE_ACCOUNT_JSON: '', STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '', GEMINI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  const port = await new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      const match = output.match(/running on http:\/\/0\.0\.0\.0:(\d+)/);
      if (match) resolve(match[1]);
    });
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Server exited before listening: ${code}`)));
  });
  const base = `http://127.0.0.1:${port}`;
  for (const route of ['/api/admin/broadcast', '/api/admin/kick', '/api/admin/blacklist',
    '/api/security/pause-account', '/api/security/unpause-account', '/api/security/remediate',
    '/api/referrals/enroll', '/api/referrals/claim', '/api/referrals/qualify', '/api/referrals/activate-pro', '/api/referrals/admin/victim/review', '/api/stripe/create-checkout-session', '/api/stripe/verify-session', '/api/analyze', '/api/dm/bob', '/api/judgement/tracks', '/api/synthesize', '/api/ai/strategy-plan']) {
    const response = await fetch(base + route, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sim_session_invented', isAdmin: true, userId: 'admin_christopher_ray' }) });
    assert.equal(response.status, 401, route);
  }
  for (const route of ['/api/community/profile', '/api/referrals/status', '/api/referrals/admin/reviews', '/api/privacy/key', '/api/security/events', '/api/security/assessment', '/api/audit/transactions', '/api/security/logs', '/api/stripe/subscription', '/api/economy/wallet', '/api/economy/history', '/api/stripe/orders']) {
    assert.equal((await fetch(base + route)).status, 401, route);
  }
  assert.equal((await fetch(base + '/api/health')).status, 200);
  const terms=await fetch(base+'/api/legal/terms');assert.equal(terms.status,200);assert.match(await terms.text(),/AI can make mistakes/);
  const page=await fetch(base+'/');assert.equal(page.status,200);
  assert.equal(page.headers.get('x-content-type-options'),'nosniff');
  assert.equal(page.headers.get('x-frame-options'),'DENY');
  assert.match(page.headers.get('content-security-policy'),/script-src 'self' 'wasm-unsafe-eval'/);
  assert.equal((await fetch(base+'/api/privacy/key')).headers.get('cache-control'),'private, no-store');
  for (const route of ['/server.cjs', '/server.cjs.map', '/.git/config', '/.env', '/xmlrpc.php', '/wp-json/batch/v1']) assert.equal((await fetch(base + route)).status, 404, route);
  assert.equal((await fetch(base + '/api/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 503);
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    socket.once('open', () => { socket.close(); reject(new Error('Unauthenticated socket opened')); });
    socket.once('unexpected-response', (_request, response) => {
      try { assert.equal(response.statusCode, 404); response.resume(); socket.terminate(); resolve(); } catch (err) { reject(err); }
    });
    socket.on('error', () => {});
  });
});
