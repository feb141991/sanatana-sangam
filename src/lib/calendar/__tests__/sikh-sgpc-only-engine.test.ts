import { describe, expect, it } from 'vitest';
import { calculateObservancesForYearCorrected, isPublishableForYear } from '../engine';
import { CANONICAL_RULES } from '../rules';
import { editionForDate, mappedDateForEdition, SGPC_EDITIONS } from '../regional-calendar-provenance';

const CULTURAL_SIKH_SLUGS = new Set(['lohri', 'sahibzade-shaheedi-diwas']);
const SIKH_RULES = CANONICAL_RULES.filter(
  rule => rule.tradition === 'sikh' && !CULTURAL_SIKH_SLUGS.has(rule.slug),
);

function printedDates(slug: string, year: number): string[] {
  const dates = SGPC_EDITIONS.flatMap(edition => {
    const date = mappedDateForEdition(edition, slug, year);
    return date && editionForDate(date)?.edition === edition.edition ? [date] : [];
  });
  return [...new Set(dates)];
}

/**
 * What the engine must emit: the printed rows, except for a rule-year the rule itself marks not publishable (`disputed_years`, or
 * deferred). The publication gate runs before the SGPC lookup (commit 7ebdf70) and AGENTS.md section 2 says a disputed date is never
 * published, so a printed date for a disputed rule-year is withheld, not emitted.
 */
function expectedPrintedDates(year: number): Map<string, string[]> {
  const expected = new Map<string, string[]>();
  for (const rule of SIKH_RULES) {
    expected.set(rule.slug, isPublishableForYear(rule, year) ? printedDates(rule.slug, year) : []);
  }
  return expected;
}

/** Printed SGPC dates the gate withholds, as `slug@date`. Listed by name so a new one is a decision, never a silent drop. */
function withheldPrinted(years: number[]): string[] {
  return years.flatMap(year => SIKH_RULES
    .filter(rule => !isPublishableForYear(rule, year))
    .flatMap(rule => printedDates(rule.slug, year).map(date => `${rule.slug}@${date}`)));
}

describe('Sikh SGPC-only engine path', () => {
  it('emits exactly the printed rows inside loaded edition ranges, with no calculated Sikh dates', () => {
    const years = [2026, 2027, 2028, 2029];
    const actualCounts = new Map<number, number>();

    for (const year of years) {
      const expected = expectedPrintedDates(year);
      const actual = calculateObservancesForYearCorrected(year)
        .filter(row => SIKH_RULES.some(rule => rule.slug === row.slug));
      actualCounts.set(year, actual.length);

      for (const rule of SIKH_RULES) {
        const dates = actual.filter(row => row.slug === rule.slug).map(row => row.date);
        expect([...new Set(dates)], rule.slug).toEqual(expected.get(rule.slug));
        expect(dates).toHaveLength(expected.get(rule.slug)?.length ?? 0);
      }

      for (const row of actual) {
        expect(editionForDate(row.date), `${row.slug} ${row.date} is outside loaded SGPC editions`).not.toBeNull();
      }
    }

    // 2027 is 1, not 2: the second printed row (guru-ravidas-jayanti, 2027-02-20) is withheld, see below.
    expect(Object.fromEntries(actualCounts)).toEqual({ 2026: 10, 2027: 1, 2028: 0, 2029: 0 });
  }, 120_000);

  it('withholds a printed date only for a rule-year the rule marks disputed, and names every one', () => {
    // guru-ravidas-jayanti lists 2027 in disputed_years (Magha Purnima begins mid-morning on 2027-02-20 and is absent at sunrise), so the
    // printed SGPC date is not published. If another printed date ever appears here, decide on it; do not add it to make this pass.
    expect(withheldPrinted([2026, 2027, 2028, 2029])).toEqual(['guru-ravidas-jayanti@2027-02-20']);
  });

  it('a Sikh rule with no printed row in a loaded edition emits nothing: it is never calculated', () => {
    // guru-ravidas-jayanti has no printed row for 2026. Commit 7ebdf70 let such a rule fall through to a calculated date (2026-02-01, outside
    // every loaded edition, no provenance). Founder decision 2026-11-25: ignore rules without a printed row.
    expect(printedDates('guru-ravidas-jayanti', 2026)).toEqual([]);
    const emitted = calculateObservancesForYearCorrected(2026).filter(row => row.slug === 'guru-ravidas-jayanti');
    expect(emitted).toEqual([]);
  }, 120_000);
});
