import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const client = readFileSync(new URL('./DharmVeerClient.tsx', import.meta.url), 'utf8');

describe('Dharm Veer web localized reader', () => {
  it('keeps the language toggle available when a localized tagline is absent', () => {
    assert.match(client, /const hasCompleteLocalContent =\s*!!hero\.nameLocal &&\s*!!hero\.journeyLocal/);
    assert.doesNotMatch(client, /!!hero\.taglineLocal/);
  });

  it('uses Punjabi for Sikh stories and does not render an English tagline in local mode', () => {
    assert.match(client, /hero\.tradition === 'sikh' \? 'ਪੰਜਾਬੀ' : 'हिंदी'/);
    assert.match(client, /const tagline = lang === 'local' \? hero\.taglineLocal : hero\.tagline/);
    assert.match(client, /\{tagline \? \(/);
  });
});
