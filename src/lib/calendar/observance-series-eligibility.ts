import type { SupabaseClient } from '@supabase/supabase-js';
import { CALENDAR_OCCURRENCE_SELECT, attachMaterialisationBatches } from './occurrence-reader';
import { formatOccurrencesToResults, type ClientObservanceResult } from './observance-formatter';
import { buildObservanceSeries, SERIES_DEFINITIONS, type BuildObservanceSeriesOptions } from './observance-series';
import { DEFAULT_CALENDAR_PROFILE } from './request-profile';
import { DEFAULT_LOCATION } from './engine';

/**
 * Every child slug that participates in at least one multi-day series
 * definition (`packages/dharma-rules/src/festivals/series.json`).
 */
const SERIES_MEMBER_SLUGS = new Set<string>(
  SERIES_DEFINITIONS.flatMap(definition => definition.children.map(child => child.slug)),
);

export function isSeriesMemberSlug(slug: string | null | undefined): boolean {
  return Boolean(slug) && SERIES_MEMBER_SLUGS.has(slug as string);
}

/** Expand candidates to their full canonical families, never to unrelated series. */
export function getSeriesSiblingSlugs(candidateSlugs: Array<string | null | undefined>): string[] {
  const candidates = new Set(candidateSlugs.filter(isSeriesMemberSlug));
  return [...new Set(SERIES_DEFINITIONS
    .filter(definition => definition.children.some(child => candidates.has(child.slug)))
    .flatMap(definition => definition.children.map(child => child.slug)))];
}

/** Load the whole bounded family for series composition, without changing the visible feed window. */
export async function fetchSeriesSiblingRows(
  supabase: SupabaseClient,
  candidateSlugs: Array<string | null | undefined>,
  candidateDates: string[],
  calendarProfile = DEFAULT_CALENDAR_PROFILE,
) {
  const slugs = getSeriesSiblingSlugs(candidateSlugs);
  const dates = candidateDates.filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  if (!slugs.length || !dates.length) return [];
  const { data, error } = await supabase.from('observance_occurrences')
    .select(CALENDAR_OCCURRENCE_SELECT)
    .in('observance_definitions.slug', slugs)
    .eq('calendar_profile', calendarProfile)
    .gte('date', shiftIsoDate(dates[0], -15))
    .lte('date', shiftIsoDate(dates[dates.length - 1], 15));
  if (error) throw new Error(`Failed to load observance series siblings: ${error.message}`);
  return data ?? [];
}

export async function fetchSeriesCompositionResults(
  supabase: SupabaseClient,
  results: ClientObservanceResult[],
  options: BuildObservanceSeriesOptions,
): Promise<ClientObservanceResult[]> {
  const dates = results.map(result => result.civilDate).filter((date): date is string => Boolean(date));
  const rows = await fetchSeriesSiblingRows(supabase, results.map(result => result.slug), dates, options.profile.calendar);
  if (!rows.length) return results;
  const withBatches = await attachMaterialisationBatches(rows, undefined, options.profile.calendar, {
    latitude: options.location.lat, longitude: options.location.lon, timezone: options.location.tz,
  });
  const siblings = formatOccurrencesToResults(withBatches, [], options.tradition, options.profile.calendar,
    null, shiftIsoDate(dates.sort()[0], -15), shiftIsoDate(dates[dates.length - 1], 15));
  const ids = new Set(results.map(result => result.id));
  return [...results, ...siblings.filter(result => !ids.has(result.id))];
}

/**
 * Batch-notification eligibility gate: which occurrence IDs currently belong
 * to an under_review (incomplete/disputed/unresolved-sibling) series.
 *
 * Evaluated once against the canonical default calendar profile/location
 * (`legacy-ujjain` @ Ujjain) rather than per-user, matching the
 * Ujjain-canonical convention already used for source governance in this
 * project. This cron runs for all users in one pass; per-user precision for
 * series completeness is not attempted here -- the karma-affecting
 * observation-write path (`vrat-observable-resolver.ts`) already gets full
 * per-user precision instead, since it resolves per-request.
 *
 * candidateSlugs should be the slugs actually present in the caller's
 * already-fetched reviewed-observance batch, so this only queries series
 * this run could possibly notify about.
 */
export async function fetchIncompleteSeriesOccurrenceIds(
  supabase: SupabaseClient,
  candidateSlugs: Array<string | null | undefined>,
  candidateDates: string[],
): Promise<Set<string>> {
  const relevantSlugs = getSeriesSiblingSlugs(candidateSlugs);
  if (relevantSlugs.length === 0) return new Set();

  // A series spans at most a handful of days; pad generously around the
  // candidate dates so every sibling occurrence for the same series instance
  // is captured without scanning the whole table.
  const sortedDates = [...candidateDates].sort();
  const fromStr = shiftIsoDate(sortedDates[0] ?? candidateDates[0], -15);
  const toStr = shiftIsoDate(sortedDates[sortedDates.length - 1] ?? candidateDates[0], 15);

  const { data, error } = await supabase
    .from('observance_occurrences')
    .select(CALENDAR_OCCURRENCE_SELECT)
    .in('observance_definitions.slug', relevantSlugs)
    .eq('calendar_profile', DEFAULT_CALENDAR_PROFILE)
    .gte('date', fromStr)
    .lte('date', toStr);

  if (error) throw new Error(`Failed to load observance series siblings: ${error.message}`);
  if (!data || data.length === 0) return new Set();

  const withBatches = await attachMaterialisationBatches(
    data,
    undefined,
    DEFAULT_CALENDAR_PROFILE,
    { latitude: DEFAULT_LOCATION.lat, longitude: DEFAULT_LOCATION.lon, timezone: DEFAULT_LOCATION.tz },
  );

  const formatted = formatOccurrencesToResults(
    withBatches,
    [],
    'all',
    DEFAULT_CALENDAR_PROFILE,
    null,
    fromStr,
    toStr,
  );

  // buildObservanceSeries matches children by exact profile.tradition, which
  // comes from each row's own `spiritual_tradition` (e.g. 'standard',
  // 'gaudiya') -- NOT the requested tradition string. Group by the value
  // actually present so a real sampradaya split doesn't get silently treated
  // as "missing sibling" against a single hardcoded tradition guess.
  const traditionGroups = new Map<string, typeof formatted>();
  for (const result of formatted) {
    const key = result.profile.tradition;
    if (!traditionGroups.has(key)) traditionGroups.set(key, []);
    traditionGroups.get(key)!.push(result);
  }

  const incompleteIds = new Set<string>();
  for (const [traditionKey, group] of traditionGroups) {
    const series = buildObservanceSeries(group, {
      spiritualDate: sortedDates[0] ?? candidateDates[0],
      profile: { calendar: DEFAULT_CALENDAR_PROFILE, tradition: traditionKey },
      location: { label: 'Ujjain (canonical)', lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon, tz: DEFAULT_LOCATION.tz },
      tradition: traditionKey,
    });
    for (const s of series) {
      if (s.status !== 'under_review') continue;
      for (const child of s.children) {
        if (child.occurrenceId) incompleteIds.add(child.occurrenceId);
      }
    }
  }
  return incompleteIds;
}

/**
 * Observation-write eligibility gate: whether a single occurrence, already
 * confirmed individually reviewed/verified/published, may still be observed
 * given its parent multi-day series's completeness. Full per-user precision
 * (real profile/location/tradition) -- reuses whatever family of occurrence
 * results the caller already fetched for this request, so no extra query.
 *
 * A `daily_journey` series (e.g. Navratri) additionally requires the
 * occurrence be one of TODAY's active children -- a resolved-but-not-yet-
 * current day should not be independently observable ahead of its turn.
 * A `festival_cluster` (e.g. Diwali-five-days) has no such single-active-day
 * constraint; each child is independently observable once the whole cluster
 * is confirmed complete.
 */
export function isOccurrenceObservableInItsSeries(
  formattedResults: ClientObservanceResult[],
  seriesOptions: BuildObservanceSeriesOptions,
  occurrenceId: string,
  occurrenceSlug: string,
): boolean {
  if (!isSeriesMemberSlug(occurrenceSlug)) return true;

  const series = buildObservanceSeries(formattedResults, seriesOptions);
  const parentSeries = series.find((s) => s.children.some((child) => child.occurrenceId === occurrenceId));
  if (!parentSeries) return true;

  if (parentSeries.status === 'under_review') return false;
  if (parentSeries.mode === 'daily_journey') {
    return parentSeries.activeChildOccurrenceIds.includes(occurrenceId);
  }
  return true;
}

function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
