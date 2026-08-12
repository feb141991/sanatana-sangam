/**
 * D32 — per-calendar-profile month-system branching.
 *
 * Exercises calculateObservancesForYearCorrectedForSystem directly: the
 * function that scripts/materialize-per-profile-month-system.mts depends on
 * to compute a rule's date under a system OTHER than its own declared
 * default. These assertions were the gap flagged in review -- tsc and the
 * existing suite passing proves the default (unforced) path still works,
 * not that the new override path computes anything correct.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateObservancesForYearCorrected,
  calculateObservancesForYearCorrectedForSystem,
} from '../engine';

function dateFor(occs: ReturnType<typeof calculateObservancesForYearCorrected>, slug: string): string[] {
  return occs.filter(o => o.slug === slug).map(o => o.date).sort();
}

describe('D32: calculateObservancesForYearCorrectedForSystem', () => {
  it('1. Krishna-paksha rule (karva-chauth, 2026) diverges by exactly one masa between systems', () => {
    const amanta = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'amanta'), 'karva-chauth');
    const purnimanta = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'purnimanta'), 'karva-chauth');
    expect(amanta).toEqual(['2026-11-28']);
    expect(purnimanta).toEqual(['2026-10-29']);
  });

  it('2. purnimanta forced date matches the rule\'s own declared default (karva-chauth is corrected_month_system: purnimanta)', () => {
    const forced = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'purnimanta'), 'karva-chauth');
    const own = dateFor(calculateObservancesForYearCorrected(2026), 'karva-chauth');
    expect(forced).toEqual(own);
    expect(forced).toEqual(['2026-10-29']);
  });

  it('3. Shukla-paksha rule (ganesh-chaturthi, 2026) agrees under both systems -- no divergence to materialize', () => {
    const amanta = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'amanta'), 'ganesh-chaturthi');
    const purnimanta = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'purnimanta'), 'ganesh-chaturthi');
    expect(amanta).toEqual(purnimanta);
    expect(amanta).toHaveLength(1);
  });

  it('4. The default (unforced) path is unaffected by the new override parameter', () => {
    const withoutOverride = dateFor(calculateObservancesForYearCorrected(2026), 'diwali');
    // diwali's own corrected_month_system is purnimanta (rules.json, citation
    // confirms 2026-11-08 -- Rashtriya Panchang p.7/p.81) -- forcing purnimanta
    // explicitly must reproduce the exact same default-path result.
    const forcedToOwnDefault = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'purnimanta'), 'diwali');
    expect(forcedToOwnDefault).toEqual(withoutOverride);
    expect(withoutOverride).toEqual(['2026-11-08']);

    // Forcing the OTHER system must differ -- proves the override genuinely
    // switches behavior rather than being silently ignored.
    const forcedOther = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'amanta'), 'diwali');
    expect(forcedOther).not.toEqual(withoutOverride);
  });

  it('5. A recurring rule (pradosh-vrat) forced under each system yields multiple distinct dates, not a single collapsed one', () => {
    const amanta = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'amanta'), 'pradosh-vrat');
    const purnimanta = dateFor(calculateObservancesForYearCorrectedForSystem(2026, 'purnimanta'), 'pradosh-vrat');
    expect(amanta.length).toBeGreaterThan(20);
    expect(purnimanta.length).toBeGreaterThan(20);
    expect(new Set(amanta).size).toBe(amanta.length); // no duplicate dates
  });
});
