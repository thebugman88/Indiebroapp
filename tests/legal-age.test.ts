import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveAgeClaim } from '../server/ageGate';
import { LEGAL_DOCUMENTS, PRIVACY_POLICY, TERMS_OF_SERVICE } from '../shared/legal';

const now = new Date('2026-09-07T12:00:00.000Z');
test('age declaration rejects under-13 accounts', () => {
  assert.throws(() => deriveAgeClaim('2014-09-08', true, now), /UNDER_MINIMUM_AGE/);
});
test('minor accounts require guardian permission and are not adult eligible', () => {
  assert.throws(() => deriveAgeClaim('2010-01-01', false, now), /GUARDIAN_PERMISSION_REQUIRED/);
  const claim = deriveAgeClaim('2010-01-01', true, now);
  assert.equal(claim.ageBand, 'minor');
  assert.equal(claim.adultEligible, false);
  assert.equal('birthDate' in claim, false);
});
test('adult boundary uses the declared calendar birthday', () => {
  assert.equal(deriveAgeClaim('2008-09-07', false, now).adultEligible, true);
  assert.equal(deriveAgeClaim('2008-09-08', true, now).adultEligible, false);
});
test('master legal documents state the safety boundaries', () => {
  assert.match(TERMS_OF_SERVICE, /Hang Out[\s\S]*18 and older/i);
  assert.match(TERMS_OF_SERVICE, /Lyric Pro's explicit-content setting is also 18\+/i);
  assert.match(PRIVACY_POLICY, /exact birth date is not retained/i);
  assert.match(LEGAL_DOCUMENTS['purchase-terms'].text, /AI can make mistakes/i);
});
