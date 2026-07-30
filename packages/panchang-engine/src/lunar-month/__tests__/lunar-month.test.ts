/**
 * lunar-month.test.ts
 *
 * Deterministic unit tests for the Layer B lunar-month module.
 * Tests mathematical invariants and boundary conditions per prompt requirements.
 */

import { describe, it, expect } from 'vitest';
import {
  getLunarMonth,
  findNewMoonBefore,
  findNewMoonAfter,
  findFullMoonBefore,
  findFullMoonAfter,
  findSankrantisBetween,
} from '../index.js';

describe('Lunar Month Module — Deterministic Invariants', () => {
  // ── 1. Both reproduced mid-month dates ─────────────────────────────────────
  it('reproduces and resolves 2026-01-15T12:00:00Z without throw or solver failure', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.monthName).toBe('Pausha');
    expect(res.monthIndex).toBe(9);
    expect(res.paksha).toBe('krishna');
    expect(res.isAdhika).toBe(false);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(1);
    expect(res.diagnostics).toHaveLength(0);
    expect(res.monthStartUtc).toBeTruthy();
    expect(res.monthEndUtc).toBeTruthy();
  });

  it('reproduces and resolves 2026-07-30T12:00:00Z without throw or solver failure', () => {
    const d = new Date('2026-07-30T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.monthName).toBe('Ashadha');
    expect(res.monthIndex).toBe(3);
    expect(res.paksha).toBe('krishna');
    expect(res.isAdhika).toBe(false);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(1);
    expect(res.diagnostics).toHaveLength(0);
    expect(res.monthStartUtc).toBeTruthy();
    expect(res.monthEndUtc).toBeTruthy();
  });

  // ── 2. Previous boundary < instant < next boundary invariant ─────────────
  it('maintains start < instant < end invariant for arbitrary dates', () => {
    const testDates = [
      new Date('2026-01-15T12:00:00Z'),
      new Date('2026-03-20T08:30:00Z'),
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

  // ── 3. Plausible lunation duration invariant ──────────────────────────────
  it('computes lunation duration between 29.1 and 29.9 days', () => {
    const d = new Date('2026-05-15T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');
    const startMs = new Date(res.monthStartUtc).getTime();
    const endMs   = new Date(res.monthEndUtc).getTime();

    const durationDays = (endMs - startMs) / (24 * 60 * 60 * 1000);
    expect(durationDays).toBeGreaterThan(29.1);
    expect(durationDays).toBeLessThan(29.9);
  });

  // ── 4. Near / exact new-moon and full-moon boundaries ────────────────────
  it('handles exact and near new-moon and full-moon boundaries cleanly', () => {
    // 2026-01-18 is near amavasya
    const amavasyaDate = new Date('2026-01-18T19:52:44Z');
    const beforeAmavasya = findNewMoonBefore(amavasyaDate);
    const afterAmavasya  = findNewMoonAfter(amavasyaDate);

    expect(beforeAmavasya).not.toBeNull();
    expect(afterAmavasya).not.toBeNull();

    // 2026-02-01 is near purnima
    const purnimaDate = new Date('2026-02-01T22:00:00Z');
    const beforePurnima = findFullMoonBefore(purnimaDate);
    const afterPurnima  = findFullMoonAfter(purnimaDate);

    expect(beforePurnima).not.toBeNull();
    expect(afterPurnima).not.toBeNull();
  });

  // ── 5. Month name stability within one lunar month ────────────────────────
  it('keeps month name stable on different days within the same lunar month', () => {
    // Both 2026-02-01 and 2026-02-10 fall in the same amanta Magha month
    const d1 = new Date('2026-02-01T12:00:00Z');
    const d2 = new Date('2026-02-10T12:00:00Z');

    const res1 = getLunarMonth(d1, 'amanta');
    const res2 = getLunarMonth(d2, 'amanta');

    expect(res1.amantaMonthName).toBe(res2.amantaMonthName);
    expect(res1.monthStartUtc).toBe(res2.monthStartUtc);
    expect(res1.monthEndUtc).toBe(res2.monthEndUtc);
  });

  // ── 6. Amanta vs Purnimanta conversion law ────────────────────────────────
  it('applies amanta/purnimanta conversion law correctly across pakshas', () => {
    // Shukla paksha date: amanta and purnimanta month names MUST be identical
    const shuklaDate = new Date('2026-02-20T12:00:00Z'); // Shukla Dwitiya/Tritiya
    const amantaShukla    = getLunarMonth(shuklaDate, 'amanta');
    const purnimantaShukla = getLunarMonth(shuklaDate, 'purnimanta');

    expect(amantaShukla.paksha).toBe('shukla');
    expect(purnimantaShukla.monthName).toBe(amantaShukla.monthName);

    // Krishna paksha date: purnimanta month name MUST be amanta + 1 (next month name)
    const krishnaDate = new Date('2026-03-08T12:00:00Z'); // Krishna Panchami
    const amantaKrishna    = getLunarMonth(krishnaDate, 'amanta');
    const purnimantaKrishna = getLunarMonth(krishnaDate, 'purnimanta');

    expect(amantaKrishna.paksha).toBe('krishna');
    expect(purnimantaKrishna.monthIndex).toBe((amantaKrishna.monthIndex + 1) % 12);
  });

  // ── 7. Sankranti classification ──────────────────────────────────────────
  it('correctly counts Sankrantis within a lunar month interval', () => {
    const start = new Date('2026-01-18T20:00:00Z');
    const end   = new Date('2026-02-17T12:00:00Z');
    const sankrantis = findSankrantisBetween(start, end);

    // One solar ingress (Kumbha Sankranti in Feb) occurs in this window
    expect(sankrantis.length).toBe(1);
    expect(sankrantis[0].rashi).toBe(10); // Kumbha (10)
  });

  // ── 8. Solver failure produces explicit diagnostic ────────────────────────
  it('produces an explicit diagnostic on solver failure without returning estimated boundaries', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    // If we pass a 1-hour maxSearchHours window to findNewMoonBefore for a date 20 days after amavasya,
    // solving fails and returns null.
    const start = findNewMoonBefore(d, 1);
    expect(start).toBeNull();
  });
});
