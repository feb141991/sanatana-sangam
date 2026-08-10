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
} from '../index.js';

describe('Lunar Month Module — Pure Classification Helper', () => {
  // ── 0 Sankrantis (Adhika) ──────────────────────────────────────────────────
  it('classifies 0 Sankrantis as an Adhika month taking the name of the next normal month', () => {
    const res = classifyLunarMonth({
      sunSiderealAtStart: 31.748,
      sankrantis: [],
      nextSankrantiAfterEnd: { rashi: 2, at: new Date('2026-06-15T07:06:13Z') },
    });

    expect(res.isAdhika).toBe(true);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(0);
    expect(res.amantaIndex).toBe(2);
    expect(res.amantaMonthName).toBe('Jyeshtha');
    expect(res.displayMonthName).toBe('Adhika Jyeshtha');
  });

  // ── 1 Sankranti (Normal) ───────────────────────────────────────────────────
  it('classifies 1 Sankranti as a normal month taking name from start Sun rashi + 1', () => {
    const res = classifyLunarMonth({
      sunSiderealAtStart: 244.6,
      sankrantis: [{ rashi: 9, at: new Date('2026-01-14T19:40:00Z') }],
    });

    expect(res.isAdhika).toBe(false);
    expect(res.isKshaya).toBe(false);
    expect(res.sankrantiCount).toBe(1);
    expect(res.amantaIndex).toBe(9);
    expect(res.amantaMonthName).toBe('Pausha');
    expect(res.displayMonthName).toBe('Pausha');
  });

  // ── 2 Sankrantis (Kshaya) ──────────────────────────────────────────────────
  it('classifies 2 Sankrantis as a Kshaya month with diagnostic', () => {
    const res = classifyLunarMonth({
      sunSiderealAtStart: 215.0,
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

describe('Lunar Month Module — Non-Authoritative Real-Date Behavior Probes', () => {
  // ── NON-AUTHORITATIVE BEHAVIOR PROBES (Source Governance) ─────────────────
  // NOTE: The following tests assert engine mathematical consistency for real dates.
  // Per docs/source-governance.md §1 & §6, these are non-authoritative behavior probes
  // and do NOT constitute approved Tier 1–4 calendrical correctness claims.

  it('[BEHAVIOR PROBE] produces Adhika Jyeshtha for 2026-05-22T12:00:00Z', () => {
    const d = new Date('2026-05-22T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.monthName).toBe('Adhika Jyeshtha');
      expect(res.monthIndex).toBe(2);
      expect(res.isAdhika).toBe(true);
      expect(res.isKshaya).toBe(false);
      expect(res.sankrantiCount).toBe(0);
    }
  });

  it('[BEHAVIOR PROBE] produces Pausha month classification for 2026-01-15T12:00:00Z', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.monthName).toBe('Pausha');
      expect(res.monthIndex).toBe(9);
      expect(res.paksha).toBe('krishna');
      expect(res.isAdhika).toBe(false);
      expect(res.isKshaya).toBe(false);
      expect(res.sankrantiCount).toBe(1);
      expect(res.diagnostics).toHaveLength(0);
    }
  });

  it('[BEHAVIOR PROBE] produces Ashadha month classification for 2026-07-30T12:00:00Z', () => {
    const d = new Date('2026-07-30T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.monthName).toBe('Ashadha');
      expect(res.monthIndex).toBe(3);
      expect(res.paksha).toBe('krishna');
      expect(res.isAdhika).toBe(false);
      expect(res.isKshaya).toBe(false);
      expect(res.sankrantiCount).toBe(1);
      expect(res.diagnostics).toHaveLength(0);
    }
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
      expect(res.ok).toBe(true);
      if (res.ok) {
        const startMs = new Date(res.monthStartUtc).getTime();
        const endMs   = new Date(res.monthEndUtc).getTime();
        const instMs  = d.getTime();

        expect(startMs).toBeLessThanOrEqual(instMs);
        expect(instMs).toBeLessThan(endMs);
      }
    }
  });

  it('computes lunation duration between 29.1 and 29.9 days', () => {
    const d = new Date('2026-05-15T12:00:00Z');
    const res = getLunarMonth(d, 'amanta');
    expect(res.ok).toBe(true);
    if (res.ok) {
      const startMs = new Date(res.monthStartUtc).getTime();
      const endMs   = new Date(res.monthEndUtc).getTime();

      const durationDays = (endMs - startMs) / (24 * 60 * 60 * 1000);
      expect(durationDays).toBeGreaterThan(29.1);
      expect(durationDays).toBeLessThan(29.9);
    }
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

    expect(amantaShukla.ok).toBe(true);
    expect(purnimantaShukla.ok).toBe(true);
    if (amantaShukla.ok && purnimantaShukla.ok) {
      expect(amantaShukla.paksha).toBe('shukla');
      expect(purnimantaShukla.monthName).toBe(amantaShukla.monthName);
    }

    const krishnaDate = new Date('2026-03-08T12:00:00Z');
    const amantaKrishna    = getLunarMonth(krishnaDate, 'amanta');
    const purnimantaKrishna = getLunarMonth(krishnaDate, 'purnimanta');

    expect(amantaKrishna.ok).toBe(true);
    expect(purnimantaKrishna.ok).toBe(true);
    if (amantaKrishna.ok && purnimantaKrishna.ok) {
      expect(amantaKrishna.paksha).toBe('krishna');
      expect(purnimantaKrishna.monthIndex).toBe((amantaKrishna.monthIndex + 1) % 12);
    }
  });

  // ── Explicit Solver Failure Discriminated Result Test ──────────────────────
  it('returns ok: false with null values and explicit solver_failure diagnostic when boundary solver fails', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    const res = getLunarMonth(d, 'amanta', 1);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.monthName).toBeNull();
      expect(res.monthIndex).toBeNull();
      expect(res.monthSystem).toBe('amanta');
      expect(res.paksha).toBeNull();
      expect(res.isAdhika).toBeNull();
      expect(res.isKshaya).toBeNull();
      expect(res.amantaMonthName).toBeNull();
      expect(res.monthStartUtc).toBeNull();
      expect(res.monthEndUtc).toBeNull();
      expect(res.sankrantiCount).toBeNull();

      expect(res.diagnostics).toHaveLength(1);
      expect(res.diagnostics[0]).toContain('solver_failure');
    }
  });
});

describe('Purnimanta krishna-paksha naming across an adhika month', () => {
  // An adhika month is assigned the SAME amantaIndex as the nija month that
  // follows it (see classifyLunarMonth's 0-Sankranti branch: "amantaIndex =
  // nijaIndex"). That is correct for amanta display, but purnimanta naming for
  // a krishna-paksha day computes "next month name" from that index -- so the
  // adhika month's own krishna paksha and the following nija month's krishna
  // paksha produced the IDENTICAL purnimanta string. Two real calendar windows,
  // weeks apart, both claiming to be e.g. "Ashadha".
  //
  // Found via a real government source (Rashtriya Panchang, Saka 1948): Yogini
  // Ekadashi 2026 is sourced at 2026-07-11, inside the genuine window, while a
  // naive same-name search found 2026-06-11 instead -- inside Adhika Jyeshtha's
  // own krishna paksha, a month early. The code was an unfinished stub: both
  // branches of an `isAdhika ? x : x` ternary returned the identical value.
  //
  // 2026 carries a real Adhika Jyeshtha (2026-05-17 -> 2026-06-16); these tests
  // run directly against that year rather than synthetic input, so a change to
  // the ephemeris or the boundary solver that shifted the adhika window would
  // also be caught here.
  it('gives the adhika month itself an "Adhika " prefix on its krishna-paksha purnimanta name', () => {
    // 2026-06-05: inside Adhika Jyeshtha (05-17..06-16), krishna paksha.
    const probe = new Date('2026-06-05T12:00:00Z');
    const res = getLunarMonth(probe, 'purnimanta');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.paksha).toBe('krishna');
    expect(res.monthName).toBe('Adhika Ashadha');
  });

  it('gives the following nija month krishna-paksha the PLAIN name, not the adhika-prefixed one', () => {
    // 2026-07-10: inside nija Jyeshtha's krishna paksha (nija Jyeshtha runs
    // 06-16..06-30), which purnimanta-names as the plain, unprefixed "Ashadha".
    // This is the genuine occurrence -- distinct from the probe above, which
    // must NOT collide with it.
    const probe = new Date('2026-07-10T12:00:00Z');
    const res = getLunarMonth(probe, 'purnimanta');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.paksha).toBe('krishna');
    expect(res.monthName).toBe('Ashadha');
  });

  it('the two "Ashadha" krishna-paksha windows are no longer the same string', () => {
    // The property the whole fix is about. Before it, both probes above
    // returned the identical 'Ashadha', so a rule searching for that exact
    // name could match either window depending on which one a naive scan
    // reached first -- and for Yogini Ekadashi, that was the wrong one.
    const spurious = getLunarMonth(new Date('2026-06-05T12:00:00Z'), 'purnimanta');
    const genuine = getLunarMonth(new Date('2026-07-10T12:00:00Z'), 'purnimanta');
    expect(spurious.ok && genuine.ok).toBe(true);
    if (!spurious.ok || !genuine.ok) return;
    expect(spurious.monthName).not.toBe(genuine.monthName);
  });

  it('shukla-paksha days are unaffected by the adhika prefix logic', () => {
    // The bug lives entirely in the krishna-paksha branch (purnimanta shukla
    // name is defined as identical to amanta name, no "next month" step at
    // all). Confirms the fix did not leak into the unrelated branch.
    const probe = new Date('2026-05-20T12:00:00Z'); // shukla paksha of Adhika Jyeshtha
    const res = getLunarMonth(probe, 'purnimanta');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.paksha).toBe('shukla');
    expect(res.monthName).toBe('Adhika Jyeshtha');
  });
});
