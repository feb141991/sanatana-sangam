import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicSourceDisclosures } from './public-source-disclosures';

test('publishes only complete explicitly public-domain source records', () => {
  const disclosures = getPublicSourceDisclosures();
  assert.ok(disclosures.length > 0);
  assert.ok(disclosures.every((item) => item.rightsLabel === 'Public-domain edition'));
  assert.equal(disclosures.some((item) => item.sectionId === 'bhagavatam'), false);
  assert.equal(disclosures.some((item) => item.sectionId === 'ramayana'), false);
});

test('never exposes unresolved source placeholders', () => {
  const serialized = JSON.stringify(getPublicSourceDisclosures());
  assert.doesNotMatch(serialized, /rights-cleared|publisher-approved|rights review required/i);
});

