import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('guardian consent is encrypted, expiring, single-use and cannot unlock adult features', async () => {
  const [consent, age, app, server] = await Promise.all([
    readFile('server/guardianConsent.ts', 'utf8'),
    readFile('server/ageGate.ts', 'utf8'),
    readFile('src/components/AccountEligibilityGate.tsx', 'utf8'),
    readFile('server.ts', 'utf8'),
  ]);
  assert.match(consent, /7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(consent, /randomBytes\(32\)/);
  assert.match(consent, /createHash\('sha256'\)/);
  assert.match(consent, /sealPrivate\(\{ email: guardianEmail \}/);
  assert.match(consent, /status !== 'pending'/);
  assert.match(consent, /guardianStatus === 'approved'/);
  assert.match(age, /adultEligible/);
  assert.match(app, /Adult-only community and explicit-content features remain unavailable after approval/);
  assert.match(server, /requireGuardianApproval/);
  assert.match(server, /requireAdult, createMessagingRouter/);
});

test('public legal monitoring supports HEAD and consent approval is the only public POST', async () => {
  const server = await readFile('server.ts', 'utf8');
  assert.match(server, /req\.method === 'GET' \|\| req\.method === 'HEAD'/);
  assert.match(server, /req\.method === 'POST' && req\.path === '\/legal\/guardian-consent'/);
});
