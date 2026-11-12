import { describe, expect, it } from 'vitest';
import { calculateObservancesForYearCorrected } from '../engine';
import { CANONICAL_RULES } from '../rules';
import { editionForDate, mappedDateForEdition, SGPC_EDITIONS } from '../regional-calendar-provenance';

const CULTURAL_SIKH_SLUGS = new Set(['lohri', 'sahibzade-shaheedi-diwas']);
const SIKH_RULES = CANONICAL_RULES.filter(
  rule => rule.tradition === 'sikh' && !CULTURAL_SIKH_SLUGS.has(rule.slug),
);

function expectedPrintedDates(year: number): Map<string, string[]> {
  const expected = new Map<string, string[]>();
  for (const rule of SIKH_RULES) {
    const dates = SGPC_EDITIONS.flatMap(edition => {
      const date = mappedDateForEdition(edition, rule.slug, year);
      return date && editionForDate(date)?.edition === edition.edition ? [date] : [];
    });
    expected.set(rule.slug, [...new Set(dates)]);
  }
  return expected;
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

    expect(Object.fromEntries(actualCounts)).toEqual({ 2026: 10, 2027: 2, 2028: 0, 2029: 0 });
  }, 120_000);
});
