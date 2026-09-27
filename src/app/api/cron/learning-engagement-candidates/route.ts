import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCandidateTypePipelineMode, isCandidateResolverGloballyEnabled } from '@/lib/notification-candidate-pipeline-mode';
import { getLocalDateIso, isHourInQuietWindow } from '@/lib/sacred-time';
import { generateLearningEngagementCandidates, type UnifiedLearningProfile } from '@/lib/learning-pilot-scheduler';

// Generates the day's Dharm Veer / Daily Quiz "learning engagement" candidates
// (Prompt 4's pilot: src/lib/learning-pilot-scheduler.ts,
// dharm-veer-candidate-producer.ts, quiz-candidate-producer.ts,
// learning-engagement-arbitration.ts, shadow-verified across 5 timezones /
// 14 days in docs/notifications/LEARNING_PILOT_PREVIEW_REPORT.md). That
// pilot was built and tested but never had a scheduled route -- this is
// that route, deliberately unchanged from the pilot's own logic. Like
// observance-series-candidates, this only ENQUEUES into
// notification_candidates for the day; the existing notification-dispatch
// cron (every 10 min) is what actually sends at each candidate's own
// scheduled_for instant.
//
// Consent model, stated explicitly because it differs from
// observance-series-candidates' opt-in `wants_festival_reminders`: this is
// opt-OUT (profiles.dharm_veer_reminder_enabled defaults true per migration
// 20260923160000, and quiz has no disable column at all yet -- see
// selectLearningEngagementType's `!== false` checks in
// learning-engagement-arbitration.ts). Every active profile with a valid
// timezone is eligible by default, not just users who explicitly turned
// this on.

const PROFILE_PAGE_SIZE = 500;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dharmVeerMode = getCandidateTypePipelineMode('dharm_veer');
  const quizMode = getCandidateTypePipelineMode('quiz');
  const resolverEnabled = isCandidateResolverGloballyEnabled();
  if (!resolverEnabled || (dharmVeerMode !== 'candidate' && quizMode !== 'candidate')) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'learning_candidates_not_enabled',
      resolverEnabled,
      dharmVeerMode,
      quizMode,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Missing Supabase environment' }, { status: 500 });

  const supabase = createClient(url, serviceKey);
  const now = new Date();

  try {
    // generateLearningEngagementCandidates evaluates every devotee against
    // every entry in `dates` (src/lib/learning-pilot-scheduler.ts's own
    // nested loop) -- it has no per-devotee date filter. A single shared
    // `dates` array across a multi-timezone cohort would evaluate a devotee
    // against OTHER timezones' local dates too, not just their own, so
    // devotees are grouped by their own computed local date below and the
    // scheduler is called once per group, each with dates: [thatDate].
    const devoteesByLocalDate = new Map<string, UnifiedLearningProfile[]>();
    let lastProfileId: string | null = null;
    let skippedInvalidTimezone = 0;
    let devoteesConsidered = 0;
    for (;;) {
      let profilesQuery = supabase.from('profiles')
        // No dedicated preferred_reminder_time column exists on profiles for
        // Dharm Veer (confirmed via schema read, 2026-09-27) -- unlike
        // japa_reminder_time/nitya_reminder_time/etc for other reminder
        // types. Left unselected rather than mapped to an unrelated
        // reminder-time column; produceDharmVeerCandidate already falls
        // back to a fixed 08:30 local default when it's undefined.
        .select('id, timezone, tradition, app_language, quiz_reminder_time, notification_quiet_hours_start, notification_quiet_hours_end, dharm_veer_reminder_enabled, is_deleting')
        .or('is_deleting.is.null,is_deleting.eq.false')
        .order('id', { ascending: true })
        .limit(PROFILE_PAGE_SIZE);
      if (lastProfileId) profilesQuery = profilesQuery.gt('id', lastProfileId);
      const { data: profilePage, error } = await profilesQuery;
      if (error) throw new Error(`Profiles query failed: ${error.message}`);
      const profiles = profilePage ?? [];
      for (const profile of profiles) {
        const timezone = profile.timezone;
        if (!timezone || !isValidTimeZone(timezone)) {
          skippedInvalidTimezone++;
          continue;
        }
        const localDate = getLocalDateIso(now, timezone);
        const devotee: UnifiedLearningProfile = {
          id: profile.id,
          tradition: profile.tradition,
          language: profile.app_language,
          timezone,
          quiz_reminder_time: profile.quiz_reminder_time,
          notification_quiet_hours_start: profile.notification_quiet_hours_start,
          notification_quiet_hours_end: profile.notification_quiet_hours_end,
          dharmVeerEnabled: profile.dharm_veer_reminder_enabled,
          is_deleting: profile.is_deleting,
        };
        const group = devoteesByLocalDate.get(localDate);
        if (group) group.push(devotee);
        else devoteesByLocalDate.set(localDate, [devotee]);
        devoteesConsidered++;
      }
      if (profiles.length < PROFILE_PAGE_SIZE) break;
      const lastProfile = profiles[profiles.length - 1] as { id?: unknown };
      if (typeof lastProfile.id !== 'string') throw new Error('Profile page returned no stable cursor id');
      lastProfileId = lastProfile.id;
    }

    let totalCandidates = 0;
    let dharmVeerCount = 0;
    let quizCount = 0;
    let candidatesInserted = 0;
    for (const [localDate, devotees] of devoteesByLocalDate) {
      const result = await generateLearningEngagementCandidates({
        devotees,
        dates: [localDate],
        dryRun: false,
        supabase,
      });
      totalCandidates += result.totalCandidates;
      dharmVeerCount += result.dharmVeerCount;
      quizCount += result.quizCount;
      candidatesInserted += result.insertedCount;
    }

    return NextResponse.json({
      ok: true,
      dharmVeerMode,
      quizMode,
      devoteesConsidered,
      skippedInvalidTimezone,
      localDatesInCohort: devoteesByLocalDate.size,
      totalCandidates,
      dharmVeerCount,
      quizCount,
      candidatesInserted,
    });
  } catch (error) {
    console.error('[learning-engagement-candidates] generation failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Candidate generation failed' }, { status: 500 });
  }
}

function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
