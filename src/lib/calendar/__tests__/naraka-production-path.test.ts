import { beforeAll, describe, expect, it } from 'vitest';
import { calculateObservancesForYear } from '../engine';
import { calculateOccurrencesWithEvaluator } from '../materialize';
import { buildSeriesInstanceKey } from '../materialisation-batch';

const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const FAMILY_SLUGS = ['dhanteras', 'diwali', 'govardhan-puja', 'bhai-dooj', 'bandhi-chhor-divas'] as const;
const UJJAIN_PRADOSH_2026 = [
  '2026-01-01', '2026-01-16', '2026-01-30', '2026-02-14', '2026-03-01',
  '2026-03-16', '2026-03-30', '2026-04-15', '2026-04-28', '2026-05-14',
  '2026-05-28', '2026-06-12', '2026-06-27', '2026-07-12', '2026-07-26',
  '2026-08-10', '2026-08-25', '2026-09-08', '2026-09-24', '2026-10-08',
  '2026-10-23', '2026-11-06', '2026-11-22', '2026-12-06', '2026-12-21',
];
const UJJAIN_PURNIMA_VRAT_2026 = [
  '2026-01-03', '2026-02-01', '2026-03-03', '2026-04-01', '2026-05-01',
  '2026-05-30', '2026-06-29', '2026-07-29', '2026-08-27', '2026-09-26',
  '2026-10-25', '2026-11-24', '2026-12-23',
];

let productionRows: ReturnType<typeof calculateObservancesForYear>;
let evaluatorRows: ReturnType<typeof calculateOccurrencesWithEvaluator>;

beforeAll(() => {
  productionRows = calculateObservancesForYear(2026, UJJAIN);
  evaluatorRows = calculateOccurrencesWithEvaluator(2026, UJJAIN);
}, 360_000);

describe('calendar production-path inclusion and recurring vrat dates', () => {
  it('publishes exactly one resolved Ujjain occurrence and no unresolved duplicate', () => {
    expect(productionRows.filter(row => row.slug === 'naraka-chaturdashi')).toEqual([
      expect.objectContaining({ slug: 'naraka-chaturdashi', date: '2026-11-08' }),
    ]);
    expect(evaluatorRows.resolved.filter(row => row.slug === 'naraka-chaturdashi')).toEqual([
      expect.objectContaining({ slug: 'naraka-chaturdashi', date: '2026-11-08' }),
    ]);
    expect(evaluatorRows.unresolved.some(row => row.slug === 'naraka-chaturdashi')).toBe(false);
  });

  it('uses the first Pradosh overlap and matches the 2026 Ujjain reference dates', () => {
    const dates = evaluatorRows.resolved
      .filter(row => row.slug === 'pradosh-vrat')
      .map(row => row.date)
      .sort();

    expect(dates).toEqual(UJJAIN_PRADOSH_2026);
    expect(evaluatorRows.unresolved.filter(row => row.slug === 'pradosh-vrat')).toEqual([]);
  });

  it('selects Purnima Vrat by Madhyahna overlap, including the 13th 2026 full-moon cycle', () => {
    const dates = evaluatorRows.resolved
      .filter(row => row.slug === 'purnima-vrat')
      .map(row => row.date)
      .sort();

    expect(dates).toEqual(UJJAIN_PURNIMA_VRAT_2026);
    expect(evaluatorRows.unresolved.filter(row => row.slug === 'purnima-vrat')).toEqual([]);
  });

  it('keeps the doubled May Ekadashi sunrise unresolved until the profile selects Smarta or Vaishnava', () => {
    const unresolved = evaluatorRows.unresolved.filter(row => row.slug === 'ekadashi');

    expect(unresolved).toEqual([
      expect.objectContaining({
        ambiguity_type: 'vrddhi_tithi',
        candidate_dates: ['2026-05-26', '2026-05-27'],
      }),
    ]);
  });

  it('preserves the actual five production outputs rather than reimplementing their rules in the test', () => {
    const family = productionRows
      .filter(row => FAMILY_SLUGS.includes(row.slug as typeof FAMILY_SLUGS[number]))
      .map(row => ({ slug: row.slug, date: row.date }))
      .sort((a, b) => a.slug.localeCompare(b.slug));

    expect(family).toEqual([
      { slug: 'bandhi-chhor-divas', date: '2026-11-08' },
      { slug: 'bhai-dooj', date: '2026-11-10' },
      { slug: 'dhanteras', date: '2026-11-06' },
      { slug: 'diwali', date: '2026-11-08' },
      { slug: 'govardhan-puja', date: '2026-11-09' },
    ]);
  });

  it('uses the production occurrence identity builder to distinguish same-date observances', () => {
    const common = {
      year: 2026,
      calendarProfile: 'legacy-ujjain',
      lat: UJJAIN.lat,
      lon: UJJAIN.lon,
      tz: UJJAIN.tz,
      instanceAnchor: '2026-11-08',
    };
    const narakaKey = buildSeriesInstanceKey({ ...common, slug: 'naraka-chaturdashi' });
    const diwaliKey = buildSeriesInstanceKey({ ...common, slug: 'diwali' });

    expect(narakaKey).not.toBe(diwaliKey);
    expect(new Set([narakaKey, diwaliKey]).size).toBe(2);
  });
});
