/**
 * series-content.test.ts
 *
 * Test suite for Prompt 3 Corrective: Source Integrity, Applicability, and Same-Date Contract
 */

import { describe, it, expect } from 'vitest';
import seriesContentJson from '../series-content.json';
import seriesRulesJson from '../series.json';

describe('Multi-Day Observance Series Content — Sourced Provenance & Zero Fabrication', () => {

  const data = seriesContentJson as { version: string; series: any[] };
  const rules = seriesRulesJson as any[];

  it('1. covers every series child in series.json with an exact sequence-matching content entry', () => {
    for (const ruleSeries of rules) {
      const contentSeries = data.series.find(s => s.definitionKey === ruleSeries.definitionKey);
      expect(contentSeries).toBeDefined();
      expect(contentSeries.children.length).toBe(ruleSeries.children.length);

      for (const ruleChild of ruleSeries.children) {
        const contentChild = contentSeries.children.find((c: any) => c.slug === ruleChild.slug);
        expect(contentChild).toBeDefined();
        expect(contentChild.sequence).toBe(ruleChild.sequence);
        expect(contentChild.canonicalTitle.value.en).toBeDefined();
        expect(contentChild.canonicalTitle.status).toBeDefined();
      }
    }
  });

  it('2. negative retrieval: Child A cannot receive Child B content', () => {
    const navratri = data.series.find(s => s.definitionKey === 'sharad-navratri');
    const day1 = navratri.children.find((c: any) => c.slug === 'navratri-day-1-shailaputri');
    const day2 = navratri.children.find((c: any) => c.slug === 'navratri-day-2-brahmacharini');

    expect(day1.deityOrTheme.value.en).toBe('Maa Shailaputri');
    expect(day2.deityOrTheme.value.en).toBe('Maa Brahmacharini');
    expect(day1.deityOrTheme.value.en).not.toBe(day2.deityOrTheme.value.en);
    expect(day1.canonicalTitle.value.en).not.toBe(day2.canonicalTitle.value.en);
  });

  it('3. distinct identities in Diwali cluster: Naraka Chaturdashi and Diwali have distinct editorial data', () => {
    const diwaliSeries = data.series.find(s => s.definitionKey === 'diwali-five-days');
    const naraka = diwaliSeries.children.find((c: any) => c.slug === 'naraka-chaturdashi');
    const diwali = diwaliSeries.children.find((c: any) => c.slug === 'diwali');

    expect(naraka).toBeDefined();
    expect(diwali).toBeDefined();
    expect(naraka.slug).not.toBe(diwali.slug);
    expect(naraka.canonicalTitle.value.en).toBe('Naraka Chaturdashi');
    expect(diwali.canonicalTitle.value.en).toBe('Diwali (Lakshmi Puja)');
    expect(naraka.rituals.value.en).toContain('Abhyanga Snana');
    expect(diwali.rituals.value.en).toContain('Lakshmi Puja');
  });

  it('4. localisation completeness: all 15 children have English, Hindi, and Punjabi canonical titles', () => {
    let count = 0;
    for (const s of data.series) {
      for (const c of s.children) {
        count++;
        expect(c.canonicalTitle.value.en).toBeTruthy();
        expect(c.canonicalTitle.value.hi).toBeTruthy();
        expect(c.canonicalTitle.value.pa).toBeTruthy();
      }
    }
    expect(count).toBe(15);
  });

  it('5. source separation: Rashtriya Panchang is NOT cited as author of narrative significance paragraphs', () => {
    for (const s of data.series) {
      for (const c of s.children) {
        const sigRefs = c.significance?.sourceRefs || [];
        for (const ref of sigRefs) {
          expect(ref.sourceName).not.toContain('Rashtriya Panchang');
        }
      }
    }
  });

  it('6. region applicability is specified for region-specific rituals (e.g. Bilva Nimantran, Kola Bou)', () => {
    const navratri = data.series.find(s => s.definitionKey === 'sharad-navratri');
    const day6 = navratri.children.find((c: any) => c.slug === 'navratri-day-6-katyayani');
    const day7 = navratri.children.find((c: any) => c.slug === 'navratri-day-7-kalaratri');

    expect(day6.rituals.applicability.universal).toBe(false);
    expect(day6.rituals.applicability.regions).toContain('Bengal');

    expect(day7.rituals.applicability.universal).toBe(false);
    expect(day7.rituals.applicability.regions).toContain('Bengal');
  });

  it('7. zero fabrication: strictly excludes unverified daily colors and unproven daily mantras', () => {
    for (const s of data.series) {
      for (const c of s.children) {
        expect((c as any).colour).toBeUndefined();
        expect((c as any).color).toBeUndefined();
        expect((c as any).mantraId).toBeUndefined();
        expect((c as any).mantra).toBeUndefined();
      }
    }
  });

  it('8. fails closed for unsupported claims and requires evidence for publishable statuses', () => {
    const fieldNames = ['canonicalTitle', 'deityOrTheme', 'rituals', 'significance'];
    for (const series of data.series) {
      for (const child of series.children) {
        for (const fieldName of fieldNames) {
          const field = child[fieldName];
          if (!field) continue;
          if (field.status === 'source_backed') expect(field.sourceRefs.length).toBeGreaterThan(0);
          if (field.status === 'council_reviewed_editorial') expect(field.reviewRef).toBeTruthy();
          const scoped = ['regions', 'calendarProfiles', 'traditions', 'sampradayas']
            .some(key => Array.isArray(field.applicability?.[key]) && field.applicability[key].length > 0);
          expect(field.applicability.universal && scoped).toBe(false);
        }
      }
    }
  });

});
