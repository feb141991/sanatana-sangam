/**
 * festival-content.test.ts
 *
 * Test suite for Festival Content Canonical Schema & 100% Rule Coverage
 */

import { describe, it, expect } from 'vitest';
import festivalContentJson from '../festival-content.json';
import rulesJson from '../rules.json';

describe('Single-Day Festival Content — Sourced Provenance & Zero Fabrication', () => {
  const data = festivalContentJson;
  const rules = rulesJson;

  it('1. covers 100% of the 116 rules in rules.json (114 unique slugs)', () => {
    const contentSlugs = new Set(data.festivals.map(f => f.definitionKey));
    expect(data.festivals.length).toBe(114);

    for (const rule of rules) {
      expect(contentSlugs.has(rule.slug), `Missing content entry for rule "${rule.slug}" (${rule.display_name})`).toBe(true);
    }
  });

  it('2. retains bilingual drafts while withholding every field pending durable provenance', () => {
    for (const f of data.festivals) {
      expect(f.name?.value?.en, `Missing EN name for ${f.definitionKey}`).toBeDefined();
      expect(f.name?.value?.hi, `Missing HI name for ${f.definitionKey}`).toBeDefined();
      expect(f.tagline?.value?.en, `Missing EN tagline for ${f.definitionKey}`).toBeDefined();
      expect(f.tagline?.value?.hi, `Missing HI tagline for ${f.definitionKey}`).toBeDefined();

      expect(f.significance?.value?.en?.length, `Significance EN too short for ${f.definitionKey}`).toBeGreaterThan(20);
      expect(f.significance?.value?.hi?.length, `Significance HI too short for ${f.definitionKey}`).toBeGreaterThan(20);

      expect(f.rituals?.value?.en?.length, `Expected at least 3 EN rituals for ${f.definitionKey}`).toBeGreaterThanOrEqual(3);
      expect(f.rituals?.value?.hi?.length, `Expected at least 3 HI rituals for ${f.definitionKey}`).toBeGreaterThanOrEqual(3);

      expect(f.dos?.value?.en?.length, `Expected dos for ${f.definitionKey}`).toBeGreaterThanOrEqual(1);
      expect(f.donts?.value?.en?.length, `Expected donts for ${f.definitionKey}`).toBeGreaterThanOrEqual(1);

      expect(f.pujaItems?.value?.en?.length, `Expected >= 3 pujaItems for ${f.definitionKey}`).toBeGreaterThanOrEqual(3);

      for (const [fieldName, field] of Object.entries({
        name: f.name,
        tagline: f.tagline,
        significance: f.significance,
        rituals: f.rituals,
        dos: f.dos,
        donts: f.donts,
        pujaItems: f.pujaItems,
      })) {
        expect(field.status, `${f.definitionKey}.${fieldName} must remain withheld`).toBe('pending_source');
        expect(field.sourceRefs, `${f.definitionKey}.${fieldName} carries unverified source metadata`).toEqual([]);
        expect('reviewRef' in field, `${f.definitionKey}.${fieldName} carries an unsupported review claim`).toBe(false);
      }
    }
  });

  it('3. retains structurally complete mantra drafts without claiming authenticity', () => {
    for (const f of data.festivals) {
      expect(f.mantra, `Expected mantra for ${f.definitionKey}`).toBeDefined();
      expect(f.mantra.sanskrit.length, `Mantra text too short for ${f.definitionKey}`).toBeGreaterThan(5);
      expect(f.mantra.transliteration.length, `Transliteration too short for ${f.definitionKey}`).toBeGreaterThan(5);
      expect(f.mantra.translation?.value?.en?.length, `Mantra EN translation too short for ${f.definitionKey}`).toBeGreaterThan(10);
      expect(f.mantra.translation?.value?.hi?.length, `Mantra HI translation too short for ${f.definitionKey}`).toBeGreaterThan(10);
      expect(f.mantra.translation.status, `${f.definitionKey} mantra must remain withheld`).toBe('pending_source');
      expect(f.mantra.translation.sourceRefs, `${f.definitionKey} mantra carries unverified source metadata`).toEqual([]);
      expect('reviewRef' in f.mantra.translation, `${f.definitionKey} mantra carries an unsupported review claim`).toBe(false);
    }
  });

  it('4. verifies tradition-specific Gurmukhi names for Sikh festivals', () => {
    const sikhFestivals = data.festivals.filter(f => f.tradition === 'sikh');
    expect(sikhFestivals.length).toBe(13);
    for (const f of sikhFestivals) {
      expect(f.name?.value?.pa, `Missing Gurmukhi name for ${f.definitionKey}`).toBeDefined();
      expect(f.name.value.pa.length).toBeGreaterThan(0);
    }
  });
});
