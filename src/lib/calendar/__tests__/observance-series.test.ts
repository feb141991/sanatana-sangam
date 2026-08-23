import { describe, expect, it } from 'vitest';
import type { ClientObservanceResult } from '../observance-formatter';
import {
  assertSeriesDefinitions,
  buildObservanceSeries,
  buildObservanceSeriesKey,
  SERIES_DEFINITIONS,
  type BuildObservanceSeriesOptions,
  type SeriesDefinition,
} from '../observance-series';

const LOCATION = { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const PROFILE = { calendar: 'legacy-ujjain', tradition: 'standard' };
const OPTIONS: BuildObservanceSeriesOptions = {
  spiritualDate: '2026-10-17',
  profile: PROFILE,
  location: LOCATION,
  tradition: 'hindu',
};

function result(slug: string, civilDate: string | null, overrides: Partial<ClientObservanceResult> = {}): ClientObservanceResult {
  return {
    date: civilDate ?? '',
    slug,
    display_name: slug,
    emoji: '🪔',
    kind: 'major',
    tradition: 'hindu',
    route_kind: 'vrat',
    route_slug: slug,
    description: '',
    id: `occ-${slug}-${civilDate ?? 'none'}`,
    festivalId: slug,
    variantKey: 'standard',
    status: civilDate ? 'resolved' : 'unresolved',
    civilDate,
    candidateDates: civilDate ? [civilDate] : [],
    reviewPlacementDate: civilDate,
    location: LOCATION,
    profile: PROFILE,
    versions: { panchangaCore: '1', calendarProfile: '1', ruleEngine: '1', rule: '1' },
    reasons: [],
    alternatives: [],
    confidence: civilDate ? 'high' : 'low',
    diagnostics: [],
    sourceRefs: [{ sourceName: 'Test fixture', tier: 1 }],
    reviewStatus: 'reviewed',
    isPrimary: true,
    ...overrides,
  };
}

const NAVRATRI_SLUGS = [
  'navratri-day-1-shailaputri',
  'navratri-day-2-brahmacharini',
  'navratri-day-3-chandraghanta',
  'navratri-day-4-kushmanda',
  'navratri-day-5-skandamata',
  'navratri-day-6-katyayani',
  'navratri-day-7-kalaratri',
  'durga-ashtami',
  'maha-navami',
  'dussehra',
] as const;

const NAVRATRI_DATES = [
  '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-13', '2026-10-15',
  '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20',
] as const;

function navratriRows(): ClientObservanceResult[] {
  return NAVRATRI_SLUGS.map((slug, index) => result(slug, NAVRATRI_DATES[index]));
}

function diwaliRows(includeNaraka = true): ClientObservanceResult[] {
  return [
    result('dhanteras', '2026-11-06'),
    ...(includeNaraka ? [result('naraka-chaturdashi', '2026-11-08')] : []),
    result('diwali', '2026-11-08'),
    result('govardhan-puja', '2026-11-09'),
    result('bhai-dooj', '2026-11-10'),
  ];
}

describe('canonical observance-series read contract', () => {
  it('preserves every canonical Navratri child and real same-date vrddhi sequence', () => {
    const [series] = buildObservanceSeries(navratriRows(), OPTIONS);
    expect(series.definitionKey).toBe('sharad-navratri');
    expect(series.children.map(child => child.slug)).toEqual(NAVRATRI_SLUGS);
    expect(series.children.map(child => child.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(series.children[2].civilDate).toBe(series.children[3].civilDate);
    expect(series.currentDay).toBe(7);
    expect(series.status).toBe('active');
  });

  it('keeps Naraka and Diwali as distinct identities on one civil date', () => {
    const [series] = buildObservanceSeries(diwaliRows(), { ...OPTIONS, spiritualDate: '2026-11-08' });
    const sameDate = series.children.filter(child => child.civilDate === '2026-11-08');
    expect(sameDate.map(child => child.slug)).toEqual(['naraka-chaturdashi', 'diwali']);
    expect(new Set(sameDate.map(child => child.occurrenceId)).size).toBe(2);
    expect(series.currentCivilDate).toBe('2026-11-08');
    expect(series.activeChildOccurrenceIds).toEqual([
      'occ-naraka-chaturdashi-2026-11-08',
      'occ-diwali-2026-11-08',
    ]);
    expect(series.currentDay).toBe(2);
    expect(series.status).toBe('active');
  });

  it('represents a missing deferred Naraka child and fails the Diwali cluster closed', () => {
    const [series] = buildObservanceSeries(diwaliRows(false), { ...OPTIONS, spiritualDate: '2026-11-08' });
    const naraka = series.children.find(child => child.slug === 'naraka-chaturdashi');
    expect(naraka).toMatchObject({ occurrenceId: null, civilDate: null, status: 'missing' });
    expect(series.status).toBe('under_review');
    expect(series.totalDays).toBe(5);
  });

  it('rejects duplicate sequence and child identity in versioned definitions', () => {
    const invalid = structuredClone(SERIES_DEFINITIONS[0]) as SeriesDefinition;
    invalid.children[1].sequence = invalid.children[0].sequence;
    expect(() => assertSeriesDefinitions([invalid])).toThrow(/Duplicate sequence/);

    const duplicateChild = structuredClone(SERIES_DEFINITIONS[0]) as SeriesDefinition;
    duplicateChild.children[1].slug = duplicateChild.children[0].slug;
    expect(() => assertSeriesDefinitions([duplicateChild])).toThrow(/Duplicate child/);
  });

  it('fails closed on duplicate runtime rows and unresolved children', () => {
    const duplicate = result('dhanteras', '2026-11-06', { id: 'second-dhanteras' });
    const duplicateSeries = buildObservanceSeries([...diwaliRows(), duplicate], OPTIONS)[0];
    expect(duplicateSeries.status).toBe('under_review');
    expect(duplicateSeries.diagnostics).toContain('duplicate_series_child:dhanteras');

    const unresolvedRows = diwaliRows().map(row => row.slug === 'diwali'
      ? result('diwali', null, { reviewPlacementDate: '2026-11-08', reviewStatus: 'pending_review' })
      : row);
    const unresolvedSeries = buildObservanceSeries(unresolvedRows, OPTIONS)[0];
    expect(unresolvedSeries.status).toBe('under_review');
    expect(unresolvedSeries.diagnostics).toContain('series_child_under_review:diwali');
  });

  it('fails closed on profile and location mismatch', () => {
    const profileMismatch = diwaliRows().map(row => row.slug === 'diwali'
      ? result('diwali', row.civilDate, { profile: { calendar: 'gujarati-amanta', tradition: 'standard' } })
      : row);
    expect(buildObservanceSeries(profileMismatch, OPTIONS)[0].diagnostics).toContain('series_context_mismatch:diwali');

    const locationMismatch = diwaliRows().map(row => row.slug === 'diwali'
      ? result('diwali', row.civilDate, { location: { ...LOCATION, lat: 52.1356, lon: -0.4685, tz: 'Europe/London' } })
      : row);
    expect(buildObservanceSeries(locationMismatch, OPTIONS)[0].diagnostics).toContain('series_context_mismatch:diwali');
  });

  it('fails closed when a purported annual instance crosses a civil year', () => {
    const crossYear = diwaliRows().map(row => row.slug === 'bhai-dooj'
      ? result('bhai-dooj', '2027-01-01')
      : row);
    const series = buildObservanceSeries(crossYear, { ...OPTIONS, spiritualDate: '2026-11-08' })[0];
    expect(series.status).toBe('under_review');
    expect(series.diagnostics).toContain('series_crosses_civil_year');
  });

  it('uses exact spiritual-date strings across DST and date-line contexts without 24-hour arithmetic', () => {
    const londonLocation = { label: 'London', lat: 51.5072, lon: -0.1276, tz: 'Europe/London' };
    const londonRows = navratriRows().map(row => result(row.slug, row.civilDate, { location: londonLocation }));
    const london = buildObservanceSeries(londonRows, { ...OPTIONS, location: londonLocation, spiritualDate: '2026-10-25' })[0];
    expect(london.currentDay).toBeNull();
    expect(london.status).toBe('complete');

    const datelineLocation = { label: 'Kiritimati', lat: 1.8721, lon: -157.4278, tz: 'Pacific/Kiritimati' };
    const datelineRows = diwaliRows().map(row => result(row.slug, row.civilDate, { location: datelineLocation }));
    const dateline = buildObservanceSeries(datelineRows, { ...OPTIONS, location: datelineLocation, spiritualDate: '2026-11-08' })[0];
    expect(dateline.currentDay).toBe(2);
  });

  it('derives a stable parent key across reruns and row ordering without overloading child identity', () => {
    const definition = SERIES_DEFINITIONS.find(item => item.definitionKey === 'diwali-five-days')!;
    const first = buildObservanceSeries(diwaliRows(), OPTIONS)[0];
    const rerun = buildObservanceSeries([...diwaliRows()].reverse(), OPTIONS)[0];
    expect(rerun.seriesKey).toBe(first.seriesKey);
    expect(buildObservanceSeriesKey(definition, '2026', OPTIONS)).toBe(first.seriesKey);

    expect(buildObservanceSeriesKey(definition, '2027', OPTIONS)).not.toBe(first.seriesKey);
    expect(buildObservanceSeriesKey(definition, '2026', {
      ...OPTIONS,
      profile: { calendar: 'gujarati-amanta', tradition: 'standard' },
    })).not.toBe(first.seriesKey);
    expect(buildObservanceSeriesKey(definition, '2026', {
      ...OPTIONS,
      location: { label: 'Bedford', lat: 52.1356, lon: -0.4685, tz: 'Europe/London' },
    })).not.toBe(first.seriesKey);
  });

  it('keeps occurrence UUIDs authoritative when variants share a parent series', () => {
    const smarta = result('diwali', '2026-11-08', { id: 'diwali-smarta', variantKey: 'smarta', isPrimary: true });
    const vaishnava = result('diwali', '2026-11-09', { id: 'diwali-vaishnava', variantKey: 'vaishnava', isPrimary: false });
    const rows = diwaliRows().filter(row => row.slug !== 'diwali').concat(smarta, vaishnava);
    const series = buildObservanceSeries(rows, OPTIONS)[0];
    const child = series.children.find(item => item.slug === 'diwali');
    expect(child?.occurrenceId).toBe('diwali-smarta');
    expect(series.seriesKey).toBe(buildObservanceSeries([...rows].reverse(), OPTIONS)[0].seriesKey);
  });
});
