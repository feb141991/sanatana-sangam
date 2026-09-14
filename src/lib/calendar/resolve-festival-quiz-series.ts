import { createAdminClient } from '@/lib/supabase-admin';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getOrMaterializeOccurrences } from '@/lib/calendar/resolve-occurrences';
import { attachMaterialisationBatches } from '@/lib/calendar/occurrence-reader';
import { filterWithheldJoinedRows } from '@/lib/calendar/withheld';
import { formatOccurrencesToResults, type ObservanceRow } from '@/lib/calendar/observance-formatter';
import { resolveCalendarContext, type TraditionProfileDefinition } from '@/lib/calendar/calendar-context';
import { buildObservanceSeries } from '@/lib/calendar/observance-series';
import { resolveObservanceLocationBucket } from '@sangam/panchang-engine';
import type { ObservanceSeries } from '../../../contracts/observance-series-contract';

/**
 * Resolves every ObservanceSeries relevant to one user, for the Festival
 * Quiz Seasons feature -- shared by GET /api/native/festival-quiz-seasons
 * (list days/unlock state) and POST /api/native/festival-quiz/answer
 * (server-side re-validation that a day is actually unlocked before
 * accepting an answer, never trusting the client's own unlock state).
 *
 * Same building blocks home-summary/route.ts uses for its own
 * `panchang.series` field (getOrMaterializeOccurrences ->
 * attachMaterialisationBatches -> formatOccurrencesToResults ->
 * buildObservanceSeries) -- reused as exported functions, not duplicated
 * logic, so calendar governance rules (withheld/under-review filtering,
 * tradition-profile variant resolution) stay defined in exactly one place.
 */

function shiftIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function resolveFestivalQuizSeriesForUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ today: string; allSeries: ObservanceSeries[] }> {
  const { data: profileRow } = await admin
    .from('profiles')
    .select('tradition, sampradaya, calendar_scope, calendar_profile, latitude, longitude, timezone, app_language')
    .eq('id', userId)
    .maybeSingle();
  const profile = profileRow as {
    tradition: string | null;
    sampradaya: string | null;
    calendar_scope: string | null;
    calendar_profile: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    app_language: string | null;
  } | null;

  const timezone = profile?.timezone ?? 'UTC';
  const today = localSpiritualDate(timezone, 4);
  // Wide enough to resolve every day of any currently-seeded festival series
  // (longest today is 10 days) regardless of where in the season "today"
  // falls -- past days must still resolve so already-answered/catch-up days
  // keep showing their real civilDate, not just upcoming ones.
  const fromDate = shiftIsoDate(today, -20);
  const toDate = shiftIsoDate(today, 20);
  const tradition = profile?.tradition ?? 'all';
  const calendarScope = profile?.calendar_scope ?? null;
  const calendarProfile = profile?.calendar_profile ?? 'legacy-ujjain';
  const observanceLocation = resolveObservanceLocationBucket({
    saved: { lat: profile?.latitude ?? null, lon: profile?.longitude ?? null, tz: profile?.timezone ?? null },
  });

  const { rows: occurrenceRows } = await getOrMaterializeOccurrences({
    supabase: admin,
    fromDate,
    toDate,
    tradition,
    calendarScope,
    calendarProfile,
    location: observanceLocation,
  });
  const rawRows: ObservanceRow[] = occurrenceRows;
  const withheldFiltered = filterWithheldJoinedRows(rawRows);
  const occurrencesWithBatches = await attachMaterialisationBatches(
    withheldFiltered,
    undefined,
    calendarProfile,
    { latitude: observanceLocation.lat, longitude: observanceLocation.lon, timezone: observanceLocation.tz },
  );

  const targetTraditionSlug = profile?.sampradaya || (tradition === 'hindu' ? 'unspecified' : null);
  let traditionProfileDefinition: TraditionProfileDefinition | null = null;
  if (targetTraditionSlug) {
    const { data: tp } = await admin
      .from('tradition_profiles')
      .select('slug, ekadashi_method, janmashtami_method')
      .eq('slug', targetTraditionSlug)
      .maybeSingle();
    if (tp) {
      traditionProfileDefinition = {
        slug: (tp as any).slug,
        ekadashiMethod: (tp as any).ekadashi_method,
        janmashtamiMethod: (tp as any).janmashtami_method,
      } as TraditionProfileDefinition;
    }
  }
  const calendarContext = resolveCalendarContext({
    calendarProfile,
    traditionProfile: traditionProfileDefinition?.slug ?? null,
    traditionProfileDefinition,
    location: observanceLocation
      ? { label: null, latitude: observanceLocation.lat, longitude: observanceLocation.lon, timezone: observanceLocation.tz }
      : null,
    isAuthenticated: true,
  });

  const seriesResults = formatOccurrencesToResults(
    occurrencesWithBatches,
    [],
    tradition,
    calendarProfile,
    profile?.sampradaya ?? null,
    today,
    toDate,
    calendarContext,
  );
  const allSeries = seriesResults.length
    ? buildObservanceSeries(seriesResults, {
        spiritualDate: today,
        profile: seriesResults[0].profile,
        location: seriesResults[0].location,
        tradition,
      })
    : [];

  return { today, allSeries };
}
