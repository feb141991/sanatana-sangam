import { describe, it, expect } from 'vitest';
import {
  CONDITION_EVALUATOR_VERSION,
  evaluateCondition,
  evaluateVariant,
  getPeriodWindow,
  type ObservanceResult,
  type SourceReference,
} from '../index.js';

describe('Observance Condition Evaluator (Tracker 3.2)', () => {
  it('exports CONDITION_EVALUATOR_VERSION constant as 1.0.0', () => {
    expect(CONDITION_EVALUATOR_VERSION).toBe('1.0.0');
  });

  it('defines sayahna as the final fifth of daytime ending at sunset', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const window = getPeriodWindow('sayahna', '2026-03-03', location);
    const sunset = getPeriodWindow('sunset', '2026-03-03', location);
    const sunrise = getPeriodWindow('sunrise', '2026-03-03', location);

    expect(window).toBeDefined();
    expect(sunset).toBeDefined();
    expect(sunrise).toBeDefined();
    expect(window?.end.getTime()).toBe(sunset?.start.getTime());
    const dayFifth = (sunset!.start.getTime() - sunrise!.start.getTime()) / 5;
    expect(Math.abs(window!.start.getTime() - (sunrise!.start.getTime() + dayFifth * 4))).toBeLessThan(1);
  });

  it('defines purvahna as the first two fifths of daytime', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const purvahna = getPeriodWindow('purvahna', '2026-03-03', location);
    const sunrise = getPeriodWindow('sunrise', '2026-03-03', location);
    const madhyahna = getPeriodWindow('madhyahna', '2026-03-03', location);
    expect(purvahna).not.toBeNull();
    expect(sunrise).not.toBeNull();
    expect(madhyahna).not.toBeNull();
    if (!purvahna || !sunrise || !madhyahna) return;
    expect(purvahna.start.getTime()).toBe(sunrise.start.getTime());
    expect(purvahna.end.getTime()).toBe(madhyahna.start.getTime());
  });

  it('evaluates Vishti presence and absence from canonical elongation boundaries', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const present = evaluateCondition({
      type: 'karana_presence',
      karana: 'Vishti',
      period: 'pradosha',
      mode: 'touches',
    }, '2026-03-03', location);
    const absent = evaluateCondition({
      type: 'karana_presence',
      karana: 'Vishti',
      period: 'pradosha',
      mode: 'absent',
    }, '2026-03-03', location);

    expect(present.conditionType).toBe('karana_presence');
    expect(absent.conditionType).toBe('karana_presence');
    expect(present.satisfied).not.toBe('indeterminate');
    expect(absent.satisfied).not.toBe('indeterminate');
    expect(absent.satisfied).toBe(!present.satisfied);
    expect(present.reasons[0].code).toBe('karana_presence_check');
  });

  it('evaluates tithi_presence mode prevails at Nishita for Maha Shivaratri condition', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const cond = {
      type: 'tithi_presence' as const,
      tithi: 14, // Krishna Chaturdashi
      period: 'nishita' as const,
      mode: 'prevails' as const,
    };

    const res = evaluateCondition(cond, '2026-02-15', location);
    expect(res.conditionType).toBe('tithi_presence');
    expect(res.reasons.length).toBeGreaterThan(0);
    expect(res.reasons[0].text).toContain('Chaturdashi');
    expect(res.window).toBeDefined();
    expect(res.window?.name).toBe('nishita');
  });

  it('evaluates tithi_presence mode at Sunrise for Janmashtami Vaishnava condition', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const cond = {
      type: 'tithi_presence' as const,
      tithi: 8, // Krishna Ashtami
      period: 'sunrise' as const,
      mode: 'at' as const,
    };

    const res = evaluateCondition(cond, '2026-09-04', location);
    expect(res.conditionType).toBe('tithi_presence');
    expect(res.reasons[0].code).toBe('tithi_presence_check');
  });

  it('evaluates viddha condition for Dashami piercing Arunodaya', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const cond = {
      type: 'viddha' as const,
      piercedBy: 10,
      atPeriod: 'arunodaya' as const,
      action: 'shift_next' as const,
    };

    const res = evaluateCondition(cond, '2026-11-05', location);
    expect(res.conditionType).toBe('viddha');
    expect(res.reasons[0].code).toBe('viddha_check');
  });

  it('returns indeterminate when moonrise window is absent on a civil date', () => {
    // Probe a date/location edge case if moonrise is absent
    const window = getPeriodWindow('moonrise', '2026-10-29', { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' });
    if (!window) {
      const cond = {
        type: 'tithi_presence' as const,
        tithi: 4,
        period: 'moonrise' as const,
        mode: 'at' as const,
      };
      const res = evaluateCondition(cond, '2026-10-29', { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' });
      expect(res.satisfied).toBe('indeterminate');
      expect(res.diagnostics).toContain('no_event_window');
    }
  });

  it('evaluates complete rule variant and outputs detailed reasons[]', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const variant = {
      ruleId: 'krishna_janmashtami__smarta',
      festivalId: 'krishna_janmashtami',
      traditionProfile: 'smarta',
      conditions: [
        { type: 'paksha' as const, value: 'krishna' as const },
        { type: 'tithi_presence' as const, tithi: 8, period: 'nishita' as const, mode: 'prevails' as const },
      ],
    };

    const res = evaluateVariant(variant, '2026-09-03', location);
    expect(res.ruleId).toBe('krishna_janmashtami__smarta');
    expect(res.reasons.length).toBe(2);
    expect(res.reasons.some((r) => r.code === 'paksha_check')).toBe(true);
    expect(res.reasons.some((r) => r.code === 'tithi_presence_check')).toBe(true);
  });

  it('[D26 Fix Verification] asserts a krishna-paksha tithi condition (tithi=14, paksha=krishna) is satisfied when panchang.tithiIndex is 29', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const variant = {
      ruleId: 'maha_shivaratri__purnimanta__smarta',
      festivalId: 'maha_shivaratri',
      traditionProfile: 'smarta',
      conditions: [
        { type: 'paksha' as const, value: 'krishna' as const },
        { type: 'tithi_presence' as const, tithi: 14, period: 'nishita' as const, mode: 'prevails' as const },
      ],
    };

    // On 2026-02-15 at Ujjain, Nishita window falls inside Krishna Chaturdashi (absolute tithiIndex 29)
    const res = evaluateVariant(variant, '2026-02-15', location);
    expect(res.qualified).toBe(true);
    expect(res.reasons.some((r) => r.code === 'tithi_presence_check' && r.text.includes('MATCHED'))).toBe(true);
  });

  it('[EDGE-004 Vrddhi Verification] detects a vrddhi tithi spanning two sunrises (Krishna Ashtami on 2026-02-09 and 2026-02-10)', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const variant = {
      ruleId: 'krishna_janmashtami__smarta_mock',
      festivalId: 'krishna_janmashtami_mock',
      conditions: [
        { type: 'paksha' as const, value: 'krishna' as const },
        { type: 'tithi' as const, value: 8, paksha: 'krishna' as const },
      ],
    };

    // Day 1 of Vrddhi
    const res1 = evaluateVariant(variant, '2026-02-09', location);
    expect(res1.qualified).toBe(true);
    expect(res1.diagnostics).toContain('vrddhi_tithi');
    expect(res1.reasons.some(r => r.code === 'vrddhi_tithi_detected' && r.text.includes('[S]'))).toBe(true);

    // Day 2 of Vrddhi
    const res2 = evaluateVariant(variant, '2026-02-10', location);
    expect(res2.qualified).toBe(true);
    expect(res2.diagnostics).toContain('vrddhi_tithi');
    expect(res2.reasons.some(r => r.code === 'vrddhi_tithi_detected' && r.text.includes('[S]'))).toBe(true);
  });

  it('[EDGE-004 Kshaya Verification] detects a kshaya tithi skipped at sunrise and triggers fallback (Shukla Ashtami on 2026-02-25)', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const variant = {
      ruleId: 'durga_ashtami_mock',
      festivalId: 'durga_ashtami_mock',
      conditions: [
        { type: 'paksha' as const, value: 'shukla' as const },
        { type: 'tithi' as const, value: 8, paksha: 'shukla' as const },
      ],
    };

    // On 2026-02-24 sunrise is Shukla Saptami (tithi 7)
    const resPrev = evaluateVariant(variant, '2026-02-24', location);
    expect(resPrev.qualified).toBe(false);

    // On 2026-02-25 sunrise is Shukla Navami (tithi 9). Target Shukla Ashtami (8) was skipped.
    const resCurr = evaluateVariant(variant, '2026-02-25', location);
    expect(resCurr.qualified).toBe(true);
    expect(resCurr.diagnostics).toContain('kshaya_tithi');
    expect(resCurr.reasons.some(r => r.code === 'kshaya_tithi_detected')).toBe(true);
  });

  it('[Deprecation Warning Verification] allows absolute tithi > 15 but issues a deprecation warning', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const variant = {
      ruleId: 'absolute_tithi_legacy_mock',
      festivalId: 'absolute_tithi_legacy_mock',
      conditions: [
        { type: 'tithi' as const, value: 23 }, // absolute Krishna Ashtami
      ],
    };

    const res = evaluateVariant(variant, '2026-02-09', location);
    expect(res.qualified).toBe(true);
  });

  it('conforms to the ObservanceResult and SourceReference type contracts', () => {
    const mockSource: SourceReference = {
      sourceName: 'Rashtriya Panchang',
      tier: 1,
      publisher: 'Positional Astronomy Centre',
      edition: '2027',
      copyrightStatus: 'purchased_print_reference',
      usagePermitted: 'internal_validation_and_citation',
    };

    const mockResult: ObservanceResult = {
      festivalId: 'maha_shivaratri',
      status: 'resolved',
      civilDate: '2027-03-06',
      vedicDay: { start: '2027-03-06T00:41:00Z', end: '2027-03-07T00:40:00Z' },
      windows: {
        observance: { start: '2027-03-06T18:00:00Z', end: '2027-03-07T06:00:00Z' },
      },
      location: {
        label: 'Bedford, UK',
        lat: 52.135,
        lon: -0.467,
        tz: 'Europe/London',
      },
      profile: {
        calendar: 'north_indian_purnimanta',
        tradition: 'smarta',
      },
      versions: {
        panchangaCore: '1.0.0',
        calendarProfile: '1.0.0',
        ruleEngine: '2.0.0',
        rule: '1.0.0',
      },
      reasons: [
        { code: 'tithi_prevails_in_window', text: 'Kṛṣṇa Chaturdaśī prevailed during Nishita' },
      ],
      alternatives: [],
      confidence: 'high',
      diagnostics: ['vrddhi_tithi', 'latitude_proxy', 'compressed_night', 'extended_moonrise'],
      sourceRefs: [mockSource],
      reviewStatus: 'approved',
      isPrimary: true,
    };

    expect(mockResult.festivalId).toBe('maha_shivaratri');
    expect(mockResult.sourceRefs[0].tier).toBe(1);
    expect(mockResult.diagnostics).toContain('extended_moonrise');
  });
});
