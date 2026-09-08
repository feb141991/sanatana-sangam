import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const client = readFileSync(new URL('./DharmVeerClient.tsx', import.meta.url), 'utf8');

describe('Dharm Veer web localized reader', () => {
  it('keeps the language toggle available when a localized tagline is absent', () => {
    assert.match(client, /const hasCompleteLocalContent =\s*!!hero\.nameLocal &&\s*!!hero\.journeyLocal/);
    assert.doesNotMatch(client, /!!hero\.taglineLocal/);
  });

  it('resolves Hindi vs Punjabi from the VIEWER\'s own preference, not hero.tradition', () => {
    // Previously this keyed the choice off `hero.tradition === 'sikh'`, which
    // showed Punjabi UI chrome over Hindi data for Sikh heroes regardless of
    // the viewer's own language, and Hindi regardless of a Punjabi-preferring
    // viewer's choice for every other tradition. Must not regress back to that.
    assert.doesNotMatch(client, /hero\.tradition === 'sikh' \? 'ਪੰਜਾਬੀ' : 'हिंदी'/);
    assert.match(client, /resolveLocalContentLanguage\(preferences\)/);
    assert.match(client, /const localLanguageLabel = localContentLanguage === 'pa' \? 'ਪੰਜਾਬੀ' : 'हिंदी'/);
  });

  it('renders tagline via pickDharmVeerLocalizedText with a Punjabi->Hindi->English fallback chain, not a bare hero.taglineLocal lookup', () => {
    assert.doesNotMatch(client, /const tagline = lang === 'local' \? hero\.taglineLocal : hero\.tagline/);
    assert.match(client, /pickDharmVeerLocalizedText\(hero\.tagline, hero\.taglineLocal, hero\.taglinePa, localContentLanguage\)/);
    assert.match(client, /\{tagline \? \(/);
  });
});
