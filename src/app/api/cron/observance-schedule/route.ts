import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getObservancePipelineMode, type ObservanceCategory } from '@/lib/observance-pipeline-mode';
import {
  generateObservanceScheduleCandidates,
  type ObservanceProfile,
} from '@/lib/observance-scheduler';
import {
  fetchReviewedObservancesForNotifications,
  type ReviewedObservanceKind,
} from '@/lib/observance-notification-source';
import { fetchIncompleteSeriesOccurrenceIds } from '@/lib/calendar/observance-series-eligibility';
import { shiftCivilDate } from '@/lib/observance-timing';

function isMissingObservanceModel(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /observance_occurrences|observance_definitions/i.test(message);
}

// ─── Observance Schedule Enqueuer Cron ──────────────────────────────────────
// Schedule: runs daily (e.g. 06:00 UTC).
//
// Evaluates reviewed canonical occurrences across user preferences, traditions,
// timezones, and lead days (D-7, D-1, D0). Generates deterministic pending rows
// in notification_schedule with unique dedupe key
// observance-v1:<id>:d<daysAway>:<targetDate>:<audience>.
//
// Pipeline exclusivity:
// When category pipeline mode is 'legacy', this job refuses to mutate
// notification_schedule (unless running in ?preview=true / ?dryRun=true mode).
// When category pipeline mode is 'schedule', legacy crons abort and this job
// safely schedules notifications to be delivered by notification-dispatch.

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL(request.url);
  const isPreview = url.searchParams.get('preview') === 'true' || url.searchParams.get('dryRun') === 'true';
  const categoryParamRaw = url.searchParams.get('category')?.toLowerCase();
  const categoryParam: ObservanceCategory | 'all' =
    categoryParamRaw === 'festival' || categoryParamRaw === 'vrat' || categoryParamRaw === 'tithi'
      ? categoryParamRaw
      : 'all';
  const daysAhead = Math.max(1, Math.min(30, Number(url.searchParams.get('daysAhead') ?? 10) || 10));
  const now = new Date();

  const modeFestival = getObservancePipelineMode('festival');
  const modeVrat = getObservancePipelineMode('vrat');
  const modeTithi = getObservancePipelineMode('tithi');

  // Pipeline exclusivity check for live runs
  if (!isPreview) {
    if (categoryParam === 'festival' && modeFestival !== 'schedule') {
      return NextResponse.json({
        message: `Observance schedule skipped: festival pipeline mode is '${modeFestival}'`,
        pipelineModes: { festival: modeFestival, vrat: modeVrat, tithi: modeTithi },
        scheduledCount: 0,
      });
    }
    if (categoryParam === 'vrat' && modeVrat !== 'schedule') {
      return NextResponse.json({
        message: `Observance schedule skipped: vrat pipeline mode is '${modeVrat}'`,
        pipelineModes: { festival: modeFestival, vrat: modeVrat, tithi: modeTithi },
        scheduledCount: 0,
      });
    }
    if (categoryParam === 'all' && modeFestival !== 'schedule' && modeVrat !== 'schedule') {
      return NextResponse.json({
        message: `Observance schedule skipped: no observance categories are in 'schedule' mode`,
        pipelineModes: { festival: modeFestival, vrat: modeVrat, tithi: modeTithi },
        scheduledCount: 0,
      });
    }
  }

  try {
    // 1. Fetch active profiles
    let { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        tradition,
        calendar_profile,
        sampradaya,
        gender_context,
        timezone,
        wants_festival_reminders,
        wants_vrat_reminders,
        wants_tithi_reminders,
        observance_reminder_lead_days,
        observance_reminder_time,
        notification_quiet_hours_start,
        notification_quiet_hours_end,
        is_deleting
      `)
      .or('is_deleting.is.null,is_deleting.eq.false');

    if (usersError && (usersError as any).code === '42703') {
      const fallbackRes = await supabase
        .from('profiles')
        .select(`
          id,
          tradition,
          calendar_profile,
          sampradaya,
          gender_context,
          timezone,
          wants_festival_reminders,
          notification_quiet_hours_start,
          notification_quiet_hours_end,
          is_deleting
        `)
        .or('is_deleting.is.null,is_deleting.eq.false');

      users = (fallbackRes.data ?? []).map((u: any) => ({
        ...u,
        wants_vrat_reminders: u.wants_festival_reminders,
        wants_tithi_reminders: u.wants_festival_reminders,
      }));
      usersError = fallbackRes.error;
    }

    if (usersError) {
      console.error('[observance-schedule] Profiles query failed:', usersError);
      return NextResponse.json({ error: `Profiles query failed: ${usersError.message}` }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No active users found', scheduledCount: 0 });
    }

    // 2. Fetch reviewed observances
    const allowedKinds: ReviewedObservanceKind[] = [];
    if (categoryParam === 'all' || categoryParam === 'festival') {
      allowedKinds.push('major', 'regional');
    }
    if (categoryParam === 'all' || categoryParam === 'vrat') {
      allowedKinds.push('vrat');
    }

    const { observances: rawObservances, error: observanceError } =
      await fetchReviewedObservancesForNotifications(supabase, allowedKinds);

    if (observanceError && !isMissingObservanceModel(observanceError)) {
      console.error('[observance-schedule] Reviewed observances query failed:', observanceError);
      return NextResponse.json({ error: `Observances query failed: ${observanceError.message}` }, { status: 500 });
    }

    if (observanceError && isMissingObservanceModel(observanceError)) {
      return NextResponse.json({
        message: 'Reviewed observance model unavailable; scheduled generation skipped',
        scheduledCount: 0,
      });
    }

    // 3. Filter observances to relevant upcoming date window
    const todayIso = now.toISOString().slice(0, 10);
    const maxDateIso = shiftCivilDate(todayIso, daysAhead);
    const windowObservances = rawObservances.filter(
      (o) => o.date >= todayIso && o.date <= maxDateIso
    );

    if (windowObservances.length === 0) {
      return NextResponse.json({
        message: `No reviewed observances found between ${todayIso} and ${maxDateIso}`,
        scheduledCount: 0,
      });
    }

    // 4. Exclude incomplete multi-day series
    const incompleteSeriesIds = await fetchIncompleteSeriesOccurrenceIds(
      supabase,
      windowObservances.map((o) => o.slug),
      windowObservances.map((o) => o.date)
    );

    // 5. Evaluate schedule candidates
    const scheduleResult = generateObservanceScheduleCandidates({
      users: users as ObservanceProfile[],
      observances: windowObservances,
      incompleteSeriesIds,
      now,
      categoryFilter: categoryParam,
    });

    if (isPreview) {
      return NextResponse.json({
        preview: true,
        pipelineModes: { festival: modeFestival, vrat: modeVrat, tithi: modeTithi },
        stats: scheduleResult.stats,
        totalCandidates: scheduleResult.candidates.length,
        candidatesSample: scheduleResult.candidates.slice(0, 50),
      });
    }

    // 6. Live generation: filter to categories currently in 'schedule' mode
    const liveCandidates = scheduleResult.candidates.filter((c) => {
      const mode = getObservancePipelineMode(c.notification_type);
      return mode === 'schedule';
    });

    if (liveCandidates.length === 0) {
      return NextResponse.json({
        message: 'No candidates eligible for live scheduling under active pipeline modes',
        pipelineModes: { festival: modeFestival, vrat: modeVrat, tithi: modeTithi },
        stats: scheduleResult.stats,
        scheduledCount: 0,
      });
    }

    // 7. Upsert candidates in batches of 100
    let totalScheduled = 0;
    for (let i = 0; i < liveCandidates.length; i += 100) {
      const batch = liveCandidates.slice(i, i + 100);
      const { data: inserted, error: insertError } = await supabase
        .from('notification_schedule')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('id');

      if (insertError) {
        console.error('[observance-schedule] Upsert error:', insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      totalScheduled += inserted?.length ?? 0;
    }

    return NextResponse.json({
      message: 'Observance schedule generated successfully',
      pipelineModes: { festival: modeFestival, vrat: modeVrat, tithi: modeTithi },
      stats: scheduleResult.stats,
      totalEvaluated: scheduleResult.candidates.length,
      liveCandidatesCount: liveCandidates.length,
      scheduledCount: totalScheduled,
    });
  } catch (error) {
    console.error('[observance-schedule] Cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Observance schedule cron crashed' },
      { status: 500 }
    );
  }
}
