/**
 * lunar-span.test.ts
 *
 * Test suite for the Multi-Day / Cluster Festival Engine (LunarTithiSpanHandler)
 * and sub-observance span resolution across 2026-2027.
 */
import { describe, it, expect } from 'vitest';
import {
  LunarTithiSpanHandler,
  calculateObservancesForYear,
  precomputePanchangCorrectedForYear,
} from '@/lib/calendar/engine';
import { CANONICAL_RULES, ObservanceRule } from '@/lib/calendar/rules';

const TIMEOUT = 300_000;

describe('LunarTithiSpanHandler — Multi-day cluster span resolution', () => {
  const navratriRule = CANONICAL_RULES.find(r => r.slug === 'navratri-begins')!;

  it('navratri-begins is defined as a lunar_tithi_span with 10 span_tithis and sub_observances', () => {
    expect(navratriRule).toBeDefined();
    expect(navratriRule.rule_family).toBe('lunar_tithi_span');
    expect(navratriRule.span_tithis).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(navratriRule.sub_observances).toHaveLength(10);
    expect(navratriRule.sub_observances![0].slug).toBe('navratri-day-1-shailaputri');
    expect(navratriRule.sub_observances![7].slug).toBe('durga-ashtami');
    expect(navratriRule.sub_observances![8].slug).toBe('maha-navami');
    expect(navratriRule.sub_observances![9].slug).toBe('dussehra');
  });

  it(
    'resolves all 10 days of Sharad Navratri 2026 accurately accounting for Saptami vrddhi',
    () => {
      const days = precomputePanchangCorrectedForYear(2026);
      const span = LunarTithiSpanHandler.resolveSpan(navratriRule, days);

      expect(span.startDate).toBe('2026-10-11'); // Pratipada
      expect(span.endDate).toBe('2026-10-21');   // Dashami / Dussehra (shifted to Oct 21 by Saptami vrddhi)
      expect(span.spanDates).toHaveLength(10);

      // Verify each daily sub-observance mapping
      expect(span.subObservanceDates.get('navratri-day-1-shailaputri')).toBe('2026-10-11');
      expect(span.subObservanceDates.get('navratri-day-2-brahmacharini')).toBe('2026-10-12');
      expect(span.subObservanceDates.get('navratri-day-3-chandraghanta')).toBe('2026-10-13');
      expect(span.subObservanceDates.get('navratri-day-4-kushmanda')).toBe('2026-10-14');
      expect(span.subObservanceDates.get('navratri-day-5-skandamata')).toBe('2026-10-15');
      expect(span.subObservanceDates.get('navratri-day-6-katyayani')).toBe('2026-10-16');
      expect(span.subObservanceDates.get('navratri-day-7-kalaratri')).toBe('2026-10-17');
      expect(span.subObservanceDates.get('durga-ashtami')).toBe('2026-10-19');
      expect(span.subObservanceDates.get('maha-navami')).toBe('2026-10-20');
      expect(span.subObservanceDates.get('dussehra')).toBe('2026-10-21');

      // Check vrddhi diagnostic recorded for Saptami
      expect(span.diagnostics.some(d => d.tithi === 7 && d.type === 'vrddhi')).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'resolves Sharad Navratri 2027 start and end dates accounting for Pratipada kshaya',
    () => {
      const days2027 = precomputePanchangCorrectedForYear(2027);
      const span2027 = LunarTithiSpanHandler.resolveSpan(navratriRule, days2027);
      expect(span2027.startDate).toBe('2027-10-01');
      expect(span2027.subObservanceDates.get('dussehra')).toBe('2027-10-10');
      // Check kshaya diagnostic recorded for Pratipada
      expect(span2027.diagnostics.some(d => d.tithi === 1 && d.type === 'kshaya')).toBe(true);
    },
    TIMEOUT,
  );

  it(
    'calculateObservancesForYear(2026) emits both navratri-begins and its sub-observances',
    () => {
      const occs = calculateObservancesForYear(2026);
      
      const navratriBegins = occs.find(o => o.slug === 'navratri-begins');
      expect(navratriBegins).toBeDefined();
      expect(navratriBegins!.date).toBe('2026-10-11');

      const day1 = occs.find(o => o.slug === 'navratri-day-1-shailaputri');
      expect(day1).toBeDefined();
      expect(day1!.date).toBe('2026-10-11');

      const ashtami = occs.find(o => o.slug === 'durga-ashtami');
      expect(ashtami).toBeDefined();
      expect(ashtami!.date).toBe('2026-10-19');

      const navami = occs.find(o => o.slug === 'maha-navami');
      expect(navami).toBeDefined();
      expect(navami!.date).toBe('2026-10-20');

      const dussehra = occs.find(o => o.slug === 'dussehra');
      expect(dussehra).toBeDefined();
      expect(dussehra!.date).toBe('2026-10-21');
    },
    TIMEOUT,
  );

  it('handles simulated tithi kshaya (skipped sunrise) within a span without losing days', () => {
    // Construct a synthetic 5-day array where tithi 3 is skipped at sunrise
    const syntheticDays = [
      { dateStr: '2026-10-01', panchang: { masaName: 'Ashwin', tithiIndex: 1 } },
      { dateStr: '2026-10-02', panchang: { masaName: 'Ashwin', tithiIndex: 2 } },
      { dateStr: '2026-10-03', panchang: { masaName: 'Ashwin', tithiIndex: 4 } }, // tithi 3 skipped between tithi 2 and 4
      { dateStr: '2026-10-04', panchang: { masaName: 'Ashwin', tithiIndex: 5 } },
    ];

    const rule: ObservanceRule = {
      slug: 'test-span',
      display_name: 'Test Span',
      emoji: '✨',
      description: 'Test span rule',
      kind: 'major',
      tradition: 'hindu',
      rule_family: 'lunar_tithi_span',
      verification_type: 'lunar_tithi_span',
      lunar_masa_name: 'Ashwin',
      corrected_lunar_masa_name: 'Ashwin',
      corrected_month_system: 'amanta',
      span_tithis: [1, 2, 3, 4, 5],
      sub_observances: [
        { tithi: 1, slug: 'day-1', display_name: 'Day 1' },
        { tithi: 2, slug: 'day-2', display_name: 'Day 2' },
        { tithi: 3, slug: 'day-3', display_name: 'Day 3' },
        { tithi: 4, slug: 'day-4', display_name: 'Day 4' },
        { tithi: 5, slug: 'day-5', display_name: 'Day 5' },
      ],
      skipped_tithi_policy: 'following_day',
    };

    const span = LunarTithiSpanHandler.resolveSpan(rule, syntheticDays);
    expect(span.tithiDates.get(1)).toBe('2026-10-01');
    expect(span.tithiDates.get(2)).toBe('2026-10-02');
    // Tithi 3 was skipped, resolved to following day (2026-10-03)
    expect(span.tithiDates.get(3)).toBe('2026-10-03');
    expect(span.tithiDates.get(4)).toBe('2026-10-03');
    expect(span.tithiDates.get(5)).toBe('2026-10-04');

    expect(span.diagnostics).toEqual([
      { tithi: 3, type: 'kshaya', dateStr: '2026-10-03' },
    ]);
  });
});
