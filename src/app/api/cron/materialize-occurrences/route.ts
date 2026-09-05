export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { materializeOccurrencesForYears } from '@/lib/calendar/materialize';
import { ensureYearMaterialized } from '@/lib/calendar/resolve-occurrences';
import { resolveObservanceLocationBucket } from '@sangam/panchang-engine';

/**
 * Extends every real (profile, location) combination a live request has
 * already lazily materialized (see resolve-occurrences.ts) into the cron's
 * newly-targeted years. Deliberately additive to, not a rewrite of, the
 * `materializeOccurrencesForYears` legacy-ujjain pass below -- that
 * function's batch/lock/regeneration-diffing machinery is tuned for a full
 * rewrite of one universal set and wasn't touched for this. This pass never
 * invents a new (profile, location) combination; it only extends ones a
 * real user request already created into new years. On a fresh deploy with
 * no lazily-materialized combinations yet, this is a no-op until the first
 * real request creates one -- expected, not a regression.
 */
async function extendInUseLocationCombinations(supabase: any, targetYears: number[]) {
  const { data: combos, error } = await supabase
    .from('observance_materialisation_batches')
    .select('calendar_profile, computed_latitude, computed_longitude, computed_timezone')
    .neq('calendar_profile', 'legacy-ujjain');

  if (error) {
    console.error('[materialize-occurrences cron] Failed to list in-use location combinations:', error);
    return { combinationsExtended: 0 };
  }

  const seen = new Set<string>();
  const uniqueCombos: Array<{ calendarProfile: string; lat: number; lon: number; tz: string }> = [];
  for (const row of combos ?? []) {
    if (row.computed_latitude == null || row.computed_longitude == null || !row.computed_timezone) continue;
    const key = `${row.calendar_profile}|${row.computed_latitude}|${row.computed_longitude}|${row.computed_timezone}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueCombos.push({
      calendarProfile: row.calendar_profile,
      lat: row.computed_latitude,
      lon: row.computed_longitude,
      tz: row.computed_timezone,
    });
  }

  const tasks = uniqueCombos.flatMap((combo) =>
    targetYears.map((year) => async () => {
      try {
        await ensureYearMaterialized({
          supabase,
          year,
          calendarProfile: combo.calendarProfile,
          location: { lat: combo.lat, lon: combo.lon, tz: combo.tz },
        });
      } catch (err) {
        console.error(
          `[materialize-occurrences cron] Failed to extend ${combo.calendarProfile} @ (${combo.lat},${combo.lon}) into ${year}:`,
          err,
        );
      }
    }),
  );

  // Run with concurrency limit of 2 to prevent memory spikes and DB pool exhaustion
  const CONCURRENCY_LIMIT = 2;
  for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map((task) => task()));
  }

  return { combinationsExtended: uniqueCombos.length };
}

// Bounded per invocation: an unindexed, unpaged scan of `profiles` would
// eventually exceed this route's maxDuration as the table grows. Pages
// through profiles, deduplicates bucketed (profile, lat, lon, tz)
// combinations as pages arrive, and caps how many DISTINCT combinations are
// actually attempted per run -- the remainder is reported as `deferred`, not
// dropped: they remain unattempted, still discoverable by
// extendInUseLocationCombinations above once any one of them gets a real
// ledger row (from a live request or a future run of this same pass), and by
// this same pass again on its next scheduled invocation.
const SEED_PROFILE_PAGE_SIZE = 500;
const SEED_MAX_COMBINATIONS_PER_RUN = 50;

/**
 * Seeds EVERY active (profile, location) combination found on `profiles`,
 * including `calendar_profile: 'legacy-ujjain'` (or null, which resolves to
 * it) -- deliberately not excluded. The heavy `materializeOccurrencesForYears`
 * pass above only ever computes the legacy-ujjain profile at Ujjain's own
 * reference coordinates; a native user whose profile is 'legacy-ujjain' (or
 * unset) but whose bucketed device/saved location is somewhere else entirely
 * (Bedford, London, ...) reads from resolve-occurrences.ts's exact-match
 * query with THEIR coordinates, not Ujjain's, and hits the identical
 * never-materialized miss as any other profile. Excluding legacy-ujjain here
 * would leave that group unfixed.
 */
async function seedActiveProfileLocationCombinations(supabase: any, targetYears: number[]) {
  const uniqueCombos = new Map<string, { calendarProfile: string; lat: number; lon: number; tz: string }>();
  let scanned = 0;

  for (let page = 0; ; page += 1) {
    const from = page * SEED_PROFILE_PAGE_SIZE;
    const to = from + SEED_PROFILE_PAGE_SIZE - 1;
    const { data: profileRows, error } = await supabase
      .from('profiles')
      .select('calendar_profile, latitude, longitude, timezone')
      .range(from, to);

    if (error) {
      console.error('[materialize-occurrences cron] Failed to page profiles for seeding:', error);
      break;
    }
    if (!profileRows || profileRows.length === 0) break;
    scanned += profileRows.length;

    for (const row of profileRows) {
      const calendarProfile = row.calendar_profile ?? 'legacy-ujjain';
      // The SAME bucketing function the read path uses -- seeding with raw
      // lat/lon would produce a combination the read path's exact-match
      // query would never actually find.
      const bucket = resolveObservanceLocationBucket({
        saved: { lat: row.latitude ?? null, lon: row.longitude ?? null, tz: row.timezone ?? null },
      });
      const key = `${calendarProfile}|${bucket.lat}|${bucket.lon}|${bucket.tz}`;
      if (!uniqueCombos.has(key)) {
        uniqueCombos.set(key, { calendarProfile, lat: bucket.lat, lon: bucket.lon, tz: bucket.tz });
      }
    }

    if (profileRows.length < SEED_PROFILE_PAGE_SIZE) break;
  }

  const allCombos = [...uniqueCombos.values()];
  const attemptedCombos = allCombos.slice(0, SEED_MAX_COMBINATIONS_PER_RUN);
  const deferredCount = allCombos.length - attemptedCombos.length;

  const failedComboIndexes = new Set<number>();
  const tasks = attemptedCombos.flatMap((combo, comboIndex) =>
    targetYears.map((year) => async () => {
      try {
        await ensureYearMaterialized({
          supabase,
          year,
          calendarProfile: combo.calendarProfile,
          location: { lat: combo.lat, lon: combo.lon, tz: combo.tz },
        });
      } catch (err) {
        failedComboIndexes.add(comboIndex);
        console.error(
          `[materialize-occurrences cron] Failed to seed ${combo.calendarProfile} @ (${combo.lat},${combo.lon}) into ${year}:`,
          err,
        );
      }
    }),
  );

  const CONCURRENCY_LIMIT = 2;
  for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
    const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map((task) => task()));
  }

  return {
    scanned,
    unique: allCombos.length,
    attempted: attemptedCombos.length,
    complete: attemptedCombos.length - failedComboIndexes.size,
    failed: failedComboIndexes.size,
    deferred: deferredCount,
  };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient() as any;

  const searchParams = request.nextUrl.searchParams;
  const yearParam = searchParams.get('year');

  let targetYears: number[] = [];
  if (yearParam) {
    const y = parseInt(yearParam, 10);
    if (!isNaN(y) && y > 0) {
      targetYears = [y];
    }
  }

  if (targetYears.length === 0) {
    const currentYear = new Date().getFullYear();
    targetYears = [currentYear, currentYear + 1];
  }

  try {
    const commit = process.env.ENABLE_OBSERVANCE_MATERIALIZATION === 'true';
    const result = await materializeOccurrencesForYears({
      supabase,
      targetYears,
      calculatedBy: 'cron_job',
      commit,
    });

    // Same commit gate as the legacy-ujjain pass above -- only extend real
    // location combinations into new years when materialization is enabled.
    const locationExtension = commit
      ? await extendInUseLocationCombinations(supabase, targetYears)
      : { combinationsExtended: 0 };

    // Independent of the extend pass above: extendInUseLocationCombinations
    // can only extend a combination that already has at least one ledger
    // row. This pass discovers combinations that have NEVER been attempted at
    // all, directly from `profiles`, so the usual Home request stays a read
    // rather than depending on a lucky prior visit.
    const profileSeed = commit
      ? await seedActiveProfileLocationCombinations(supabase, targetYears)
      : { scanned: 0, unique: 0, attempted: 0, complete: 0, failed: 0, deferred: 0 };

    return NextResponse.json({
      success: true,
      message: commit
        ? `Materialized occurrences for years: ${targetYears.join(', ')}`
        : 'Materialization is disabled by default. Set ENABLE_OBSERVANCE_MATERIALIZATION=true to persist generated rows.',
      ...result,
      locationExtension,
      profileSeed,
    });
  } catch (error: any) {
    console.error('[materialize-occurrences cron] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to materialize occurrences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
