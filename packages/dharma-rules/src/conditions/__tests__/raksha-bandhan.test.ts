import { describe, expect, it } from 'vitest';
import { evaluateCondition, resolveRakshaBandhan } from '../evaluator.js';
import { offsetCivilDateStr } from '../../../../panchang-engine/src/index.js';

// Founder-approved 2026-11-26 (not council ratified): aparahna with no Bhadra; else Day 2 when Purnima lasts
// 3 muhurtas (144 min) after its sunrise; else Day 1 after Bhadra, or in the Bhadra-puccha (72 min, PROPOSED).
const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const DELHI = { lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' };
const KOLKATA = { lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' };
const CONDITION = { type: 'raksha_bandhan', minUdayaMinutes: 144, pucchaMinutes: 72 } as const;

describe('Raksha Bandhan (founder-approved 2026-11-26)', () => {
  it('resolves 2026 to 28 Aug by the 3-muhurta sunrise fallback, matching Rashtriya Panchang 1948 SE #35', () => {
    // Bhadra covers the whole aparahna of 27 Aug; Purnima ends at about 09:48 IST on 28 Aug.
    const r = resolveRakshaBandhan('2026-08-28', UJJAIN);
    expect(r.date).toBe('2026-08-28');
    expect(r.branch).toBe('udaya_three_muhurta');
    expect(r.udayaMinutes).toBeGreaterThanOrEqual(144);
  });

  it('resolves 2026-2030 to the same date at Ujjain, Delhi and Kolkata, by the expected branch at Ujjain', () => {
    const expected: Array<[string, string, string]> = [
      ['2026-08-28', '2026-08-28', 'udaya_three_muhurta'],
      ['2027-08-17', '2027-08-17', 'udaya_three_muhurta'],
      ['2028-08-05', '2028-08-05', 'udaya_three_muhurta'],
      ['2029-08-23', '2029-08-23', 'after_bhadra'],
      ['2030-08-13', '2030-08-13', 'aparahna_no_bhadra'],
    ];
    for (const [anchor, date, branch] of expected) {
      expect(resolveRakshaBandhan(anchor, UJJAIN).branch, anchor).toBe(branch);
      for (const [name, location] of Object.entries({ UJJAIN, DELHI, KOLKATA })) {
        expect(resolveRakshaBandhan(anchor, location).date, `${anchor} ${name}`).toBe(date);
      }
    }
  });

  it('takes Day 1 after Bhadra when Purnima lasts under 3 muhurtas after Day 2 sunrise, and says when the ritual may begin', () => {
    // 2029: Purnima from about 06:48 IST on 23 Aug, Bhadra until about 19:01, Purnima ends about 07:21 on 24 Aug.
    const r = resolveRakshaBandhan('2029-08-23', UJJAIN);
    expect(r.udayaMinutes).toBeLessThan(144);
    expect(r.date).toBe('2029-08-23');
    expect(r.ritualWindowStartUtc).toBe(r.bhadraEndUtc);
  });

  it('keeps the strict check first: a day whose aparahna has Purnima and no Bhadra wins', () => {
    expect(resolveRakshaBandhan('2030-08-13', UJJAIN)).toMatchObject({ branch: 'aparahna_no_bhadra', ritualWindowStartUtc: null });
  });

  it('uses the 3-muhurta threshold: raising it past 2026\'s margin moves 2026 to Day 1', () => {
    const margin = resolveRakshaBandhan('2026-08-28', UJJAIN).udayaMinutes!;
    const stricter = resolveRakshaBandhan('2026-08-28', UJJAIN, Math.ceil(margin) + 1);
    expect(stricter.date).toBe('2026-08-27');
    expect(['after_bhadra', 'bhadra_puccha']).toContain(stricter.branch);
  });

  it('is satisfied on exactly one civil date near each Purnima', () => {
    for (const [anchor, date] of [['2026-08-28', '2026-08-28'], ['2027-08-17', '2027-08-17'], ['2029-08-23', '2029-08-23']]) {
      const hits: string[] = [];
      for (let o = -3; o <= 3; o += 1) {
        const d = offsetCivilDateStr(anchor, o);
        if (evaluateCondition(CONDITION as any, d, UJJAIN).satisfied === true) hits.push(d);
      }
      expect(hits, anchor).toEqual([date]);
    }
  });
});
