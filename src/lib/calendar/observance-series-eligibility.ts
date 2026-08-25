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
  const relevantSlugs = [...new Set(candidateSlugs.filter(isSeriesMemberSlug) as string[])];
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

  if (error || !data || data.length === 0) return new Set();

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
