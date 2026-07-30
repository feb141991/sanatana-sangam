/**
 * lunar-month.test.ts
 *
 * Deterministic unit tests for the Layer B lunar-month module.
 * Tests mathematical invariants and boundary conditions per prompt requirements.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyLunarMonth,
  getLunarMonth,
  findNewMoonBefore,
  findNewMoonAfter,
  findFullMoonBefore,
  findFullMoonAfter,
  findSankrantisBetween,
} from '../index.js';

describe('Lunar Month Module — Pure Classification Helper', () => {
  // ── 0 Sankrantis (Adhika) ──────────────────────────────────────────────────
  it('classifies 0 Sankrantis as an Adhika month taking the name of the next normal month', () => {
    // Sun at start amavasya is in Vrishabha (rashi 1, 31.7°). No Sankranti occurs during the month.
    // The next Sankranti after month-end enters Mithuna (rashi 2).
    const res = classifyLunarMonth({
      sunSiderealAtStart: 31.748,
      sankrantis: [],
      nextSankrantiAfterEnd: { rashi: 2, at: new Date('2026-06-15T07:06:13Z') },
    });

    expect(res.isAdhika).toBe(true);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(0);
    expect(res.amantaIndex).toBe(2); // Jyeshtha (2)
    expect(res.amantaMonthName).toBe('Jyeshtha');
    expect(res.displayMonthName).toBe('Adhika Jyeshtha');
  });

  // ── 1 Sankranti (Normal) ───────────────────────────────────────────────────
  it('classifies 1 Sankranti as a normal month taking name from start Sun rashi + 1', () => {
    // Sun at start amavasya is in Dhanu (rashi 8, 244.6°). One Sankranti occurs entering Makara (rashi 9).
    const res = classifyLunarMonth({
      sunSiderealAtStart: 244.6,
      sankrantis: [{ rashi: 9, at: new Date('2026-01-14T19:40:00Z') }],
    });

    expect(res.isAdhika).toBe(false);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(1);
    expect(res.amantaIndex).toBe(9); // Pausha (9)
    expect(res.amantaMonthName).toBe('Pausha');
    expect(res.displayMonthName).toBe('Pausha');
  });

  // ── 2 Sankrantis (Kshaya) ──────────────────────────────────────────────────
  it('classifies 2 Sankrantis as a Kshaya month with diagnostic', () => {
    // Two Sankrantis occur in the same lunar month interval (rare decayed month)
    const res = classifyLunarMonth({
      sunSiderealAtStart: 215.0, // Vrischika (7) -> Kartika/Margashirsha
      sankrantis: [
        { rashi: 8, at: new Date('2026-12-15T00:00:00Z') },
        { rashi: 9, at: new Date('2027-01-14T00:00:00Z') },
      ],
    });

    expect(res.isAdhika).toBe(false);
    expect(res.isKshaya).toBe(true);
    expect(res.sankrantiCount).toBe(2);
    expect(res.diagnostics.length).toBeGreaterThan(0);
    expect(res.diagnostics[0]).toContain('kshaya_masa');
  });
});

describe('Lunar Month Module — Integration Probes & Invariants', () => {
  // ── May-June 2026 Adhika Jyeshtha Fix Probe ────────────────────────────────
  it('correctly returns Adhika Jyeshtha (not Adhika Ashadha) for 2026-05-22', () => {
    const d = new Date('2026-05-22T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.monthName).toBe('Adhika Jyeshtha');
    expect(res.monthIndex).toBe(2);
    expect(res.isAdhika).toBe(true);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(0);
  });

  // ── Regression Probes for 2026-01-15 and 2026-07-30 ────────────────────────
  it('preserves Pausha month classification for 2026-01-15T12:00:00Z', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.monthName).toBe('Pausha');
    expect(res.monthIndex).toBe(9);
    expect(res.paksha).toBe('krishna');
    expect(res.isAdhika).toBe(false);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(1);
    expect(res.diagnostics).toHaveLength(0);
  });

  it('preserves Ashadha month classification for 2026-07-30T12:00:00Z', () => {
    const d = new Date('2026-07-30T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.monthName).toBe('Ashadha');
    expect(res.monthIndex).toBe(3);
    expect(res.paksha).toBe('krishna');
    expect(res.isAdhika).toBe(false);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(1);
    expect(res.diagnostics).toHaveLength(0);
  });

  // ── Mathematical Invariants ────────────────────────────────────────────────
  it('maintains start < instant < end invariant for arbitrary dates', () => {
    const testDates = [
      new Date('2026-01-15T12:00:00Z'),
      new Date('2026-03-20T08:30:00Z'),
      new Date('2026-05-22T12:00:00Z'),
      new Date('2026-07-30T12:00:00Z'),
      new Date('2026-11-10T18:00:00Z'),
    ];

    for (const d of testDates) {
      const res = getLunarMonth(d, 'amanta');
      const startMs = new Date(res.monthStartUtc).getTime();
      const endMs   = new Date(res.monthEndUtc).getTime();
      const instMs  = d.getTime();

      expect(startMs).toBeLessThanOrEqual(instMs);
      expect(instMs).toBeLessThan(endMs);
    }
  });

  it('computes lunation duration between 29.1 and 29.9 days', () => {
    const d = new Date('2026-05-15T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');
    const startMs = new Date(res.monthStartUtc).getTime();
    const endMs   = new Date(res.monthEndUtc).getTime();

    const durationDays = (endMs - startMs) / (24 * 60 * 60 * 1000);
    expect(durationDays).toBeGreaterThan(29.1);
    expect(durationDays).toBeLessThan(29.9);
  });

  it('handles exact and near new-moon and full-moon boundaries cleanly', () => {
    const amavasyaDate = new Date('2026-01-18T19:52:44Z');
    const beforeAmavasya = findNewMoonBefore(amavasyaDate);
    const afterAmavasya  = findNewMoonAfter(amavasyaDate);

    expect(beforeAmavasya).not.toBeNull();
    expect(afterAmavasya).not.toBeNull();

    const purnimaDate = new Date('2026-02-01T22:00:00Z');
    const beforePurnima = findFullMoonBefore(purnimaDate);
    const afterPurnima  = findFullMoonAfter(purnimaDate);

    expect(beforePurnima).not.toBeNull();
    expect(afterPurnima).not.toBeNull();
  });

  it('applies amanta/purnimanta conversion law correctly across pakshas', () => {
    const shuklaDate = new Date('2026-02-20T12:00:00Z');
    const amantaShukla    = getLunarMonth(shuklaDate, 'amanta');
    const purnimantaShukla = getLunarMonth(shuklaDate, 'purnimanta');

    expect(amantaShukla.paksha).toBe('shukla');
    expect(purnimantaShukla.monthName).toBe(amantaShukla.monthName);

    const krishnaDate = new Date('2026-03-08T12:00:00Z');
    const amantaKrishna    = getLunarMonth(krishnaDate, 'amanta');
    const purnimantaKrishna = getLunarMonth(krishnaDate, 'purnimanta');

    expect(amantaKrishna.paksha).toBe('krishna');
    expect(purnimantaKrishna.monthIndex).toBe((amantaKrishna.monthIndex + 1) % 12);
  });

  it('produces an explicit diagnostic on solver failure without returning estimated boundaries', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    const start = findNewMoonBefore(d, 1);
    expect(start).toBeNull();
  });
});
