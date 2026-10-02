import type { AtomicObservanceLocation } from './calendar-context';
import type { ClientObservanceResult } from './observance-formatter';

/** The documented reference location for requests without a saved location. */
export const DEFAULT_CALENDAR_RESPONSE_LOCATION = {
  latitude: 23.1765,
  longitude: 75.7885,
  timezone: 'Asia/Kolkata',
} as const;

/**
 * Calendar queries intentionally over-fetch across profiles and locations so
 * profile-family completeness and variant resolution can run first. Only the
 * viewer's effective calculation location belongs in the public response.
 */
export function filterObservancesToCalculationLocation<T extends Pick<ClientObservanceResult, 'location'>>(
  results: readonly T[],
  location: AtomicObservanceLocation | null | undefined,
): T[] {
  const hasExplicitLocation = typeof location?.latitude === 'number'
    && Number.isFinite(location.latitude)
    && typeof location.longitude === 'number'
    && Number.isFinite(location.longitude)
    && typeof location.timezone === 'string'
    && location.timezone.trim().length > 0;
  const target = hasExplicitLocation
    ? {
        latitude: location.latitude as number,
        longitude: location.longitude as number,
        timezone: location.timezone!.trim(),
      }
    : DEFAULT_CALENDAR_RESPONSE_LOCATION;

  return results.filter((result) =>
    result.location.tz === target.timezone
    && result.location.lat.toFixed(6) === target.latitude.toFixed(6)
    && result.location.lon.toFixed(6) === target.longitude.toFixed(6)
  );
}

/** Collapses duplicate rows for the same observance, civil date, and location. */
export function deduplicateObservanceResults<T extends ClientObservanceResult>(
  results: readonly T[],
  preferredCalendarProfile: string,
): T[] {
  const selected = new Map<string, T>();
  for (const result of results) {
    const date = result.civilDate ?? result.reviewPlacementDate;
    const key = date
      ? `${result.festivalId}|${date}|${result.location.lat.toFixed(6)},${result.location.lon.toFixed(6)}|${result.location.tz}`
      : `${result.festivalId}|undated|${result.id ?? result.display_name}`;
    const current = selected.get(key);
    if (!current || preferResult(result, current, preferredCalendarProfile)) selected.set(key, result);
  }
  return [...selected.values()];
}

function preferResult(
  candidate: ClientObservanceResult,
  current: ClientObservanceResult,
  preferredCalendarProfile: string,
): boolean {
  if (candidate.isPrimary !== current.isPrimary) return candidate.isPrimary;
  const candidateProfileMatches = candidate.profile.calendar === preferredCalendarProfile;
  const currentProfileMatches = current.profile.calendar === preferredCalendarProfile;
  if (candidateProfileMatches !== currentProfileMatches) return candidateProfileMatches;
  const candidateResolved = candidate.status === 'resolved' && Boolean(candidate.civilDate);
  const currentResolved = current.status === 'resolved' && Boolean(current.civilDate);
  if (candidateResolved !== currentResolved) return candidateResolved;
  return String(candidate.id ?? '').localeCompare(String(current.id ?? '')) < 0;
}
