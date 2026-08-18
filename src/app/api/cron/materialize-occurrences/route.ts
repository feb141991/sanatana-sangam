import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { materializeOccurrencesForYears } from '@/lib/calendar/materialize';
import { ensureYearMaterialized } from '@/lib/calendar/resolve-occurrences';

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

  await Promise.all(
    uniqueCombos.flatMap((combo) =>
      targetYears.map((year) =>
        ensureYearMaterialized({
          supabase,
          year,
          calendarProfile: combo.calendarProfile,
          location: { lat: combo.lat, lon: combo.lon, tz: combo.tz },
        }).catch((err) => {
          console.error(
            `[materialize-occurrences cron] Failed to extend ${combo.calendarProfile} @ (${combo.lat},${combo.lon}) into ${year}:`,
            err,
          );
        }),
      ),
    ),
  );

  return { combinationsExtended: uniqueCombos.length };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    targetYears = [currentYear, currentYear + 1, currentYear + 2];
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

    return NextResponse.json({
      success: true,
      message: commit
        ? `Materialized occurrences for years: ${targetYears.join(', ')}`
        : 'Materialization is disabled by default. Set ENABLE_OBSERVANCE_MATERIALIZATION=true to persist generated rows.',
      ...result,
      locationExtension,
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
