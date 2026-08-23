import { beforeAll, describe, expect, it } from 'vitest';
import { calculateObservancesForYear } from '../engine';
import { calculateOccurrencesWithEvaluator } from '../materialize';
import { buildSeriesInstanceKey } from '../materialisation-batch';

const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const FAMILY_SLUGS = ['dhanteras', 'diwali', 'govardhan-puja', 'bhai-dooj', 'bandhi-chhor-divas'] as const;

let productionRows: ReturnType<typeof calculateObservancesForYear>;
let evaluatorRows: ReturnType<typeof calculateOccurrencesWithEvaluator>;

beforeAll(() => {
  productionRows = calculateObservancesForYear(2026, UJJAIN);
  evaluatorRows = calculateOccurrencesWithEvaluator(2026, UJJAIN);
}, 120_000);

describe('Naraka Chaturdashi production-path isolation', () => {
  it('keeps Naraka out of both resolved and review output while its rule is deferred', () => {
    expect(productionRows.some(row => row.slug === 'naraka-chaturdashi')).toBe(false);
    expect(evaluatorRows.resolved.some(row => row.slug === 'naraka-chaturdashi')).toBe(false);
    expect(evaluatorRows.unresolved.some(row => row.slug === 'naraka-chaturdashi')).toBe(false);
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
