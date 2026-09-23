import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCandidateTypePipelineMode, isCandidateResolverGloballyEnabled } from '@/lib/notification-candidate-pipeline-mode';
import { fetchReviewedObservancesForNotifications } from '@/lib/observance-notification-source';
import { fetchIncompleteSeriesOccurrenceIds } from '@/lib/calendar/observance-series-eligibility';
import { produceSeriesCandidates, type ReviewedSeriesOccurrence } from '@/lib/series-candidate-producer';
import { getLocalDateIso, isHourInQuietWindow } from '@/lib/sacred-time';
import { shiftCivilDate } from '@/lib/observance-timing';
import type { NotificationCandidateInsert } from '@/types/database';
import { DEFAULT_CALENDAR_PROFILE } from '@/lib/calendar/request-profile';

const PROFILE_PAGE_SIZE = 500;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode = getCandidateTypePipelineMode('observance_series');
  if (!isCandidateResolverGloballyEnabled() || mode !== 'candidate') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'observance_series_candidate_pipeline_not_enabled', mode });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Missing Supabase environment' }, { status: 500 });

  const supabase = createClient(url, serviceKey);
  const now = new Date();

  try {
    const eligibleProfiles: Array<{
      id: string;
      timezone: string;
      tradition: string | null;
      calendarProfile: string | null;
      targetDates: string[];
    }> = [];
    let lastProfileId: string | null = null;
    let optedOut = 0;
    for (;;) {
      let profilesQuery = supabase.from('profiles')
        .select('id, timezone, tradition, calendar_profile, wants_festival_reminders, notification_quiet_hours_start, notification_quiet_hours_end, is_deleting')
        .or('is_deleting.is.null,is_deleting.eq.false')
        .order('id', { ascending: true })
        .limit(PROFILE_PAGE_SIZE);
      if (lastProfileId) profilesQuery = profilesQuery.gt('id', lastProfileId);
      const { data: profilePage, error } = await profilesQuery;
      if (error) throw new Error(`Profiles query failed: ${error.message}`);
      const profiles = profilePage ?? [];
      for (const profile of profiles) {
        // This producer is opt-in only. A missing/null preference is not
        // equivalent to consent to add a new series notification channel.
        if (profile.wants_festival_reminders !== true) {
          optedOut++;
          continue;
        }
        const timezone = profile.timezone;
        if (!timezone || !isValidTimeZone(timezone)) continue;
        if (isHourInQuietWindow(7, profile.notification_quiet_hours_start, profile.notification_quiet_hours_end)) continue;
        const today = getLocalDateIso(now, timezone);
        const targetDates = [today, shiftCivilDate(today, 1)].filter((date): date is string => Boolean(date));
        eligibleProfiles.push({
          id: profile.id,
          timezone,
          tradition: profile.tradition,
          calendarProfile: profile.calendar_profile,
          targetDates,
        });
      }
      if (profiles.length < PROFILE_PAGE_SIZE) break;
      const lastProfile = profiles[profiles.length - 1] as { id?: unknown };
      if (typeof lastProfile.id !== 'string') throw new Error('Profile page returned no stable cursor id');
      lastProfileId = lastProfile.id;
    }

    const targetDates = [...new Set(eligibleProfiles.flatMap((profile) => profile.targetDates))].sort();
    if (targetDates.length === 0) {
      return NextResponse.json({ ok: true, mode, eligibleOccurrences: 0, candidatesGenerated: 0, candidatesInserted: 0, optedOutProfiles: optedOut, skippedForPastLocalSlot: 0 });
    }
    const observanceResult = await fetchReviewedObservancesForNotifications(
      supabase,
      ['major', 'regional', 'vrat'],
      { fromDate: targetDates[0], toDate: targetDates[targetDates.length - 1] },
    );
    if (observanceResult.error) throw new Error(`Reviewed occurrences query failed: ${observanceResult.error.message}`);
    const observances = observanceResult.observances.filter((occurrence) => occurrence.slug);
    const incompleteIds = await fetchIncompleteSeriesOccurrenceIds(
      supabase,
      observances.map((occurrence) => occurrence.slug),
      observances.map((occurrence) => occurrence.date),
    );
    const occurrenceRows: ReviewedSeriesOccurrence[] = observances
      .filter((occurrence) => occurrence.id && !incompleteIds.has(occurrence.id))
      .map((occurrence) => ({
        id: occurrence.id,
        slug: occurrence.slug!,
        civilDate: occurrence.date,
        status: 'resolved',
        reviewStatus: occurrence.reviewStatus ?? '',
        publicationStatus: occurrence.publicationStatus ?? null,
        verificationStatus: occurrence.verificationStatus ?? null,
        auditStatus: occurrence.auditStatus ?? null,
        finalDateSource: occurrence.finalDateSource ?? null,
        sourceRefs: occurrence.sourceRefs ?? [],
        calendarProfile: occurrence.calendar_profile ?? null,
        tradition: occurrence.tradition,
      }));

    let skippedForPastLocalSlot = 0;
    let generatedCount = 0;
    const candidateRows: NotificationCandidateInsert[] = [];
    let insertedCount = 0;
    const flushCandidates = async () => {
      if (candidateRows.length === 0) return;
      const batch = candidateRows.splice(0, candidateRows.length);
      const { data, error } = await supabase.from('notification_candidates')
        .upsert(batch, {
          onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
          ignoreDuplicates: true,
        })
        .select('id');
      if (error) throw new Error(`Candidate upsert failed: ${error.message}`);
      insertedCount += data?.length ?? 0;
    };
    for (const profile of eligibleProfiles) {
      const matchingOccurrences = occurrenceRows.filter((occurrence) =>
        profile.calendarProfile === DEFAULT_CALENDAR_PROFILE
        && occurrence.calendarProfile === profile.calendarProfile
        && (!profile.tradition || occurrence.tradition === 'all' || occurrence.tradition === profile.tradition),
      );

      for (const targetDate of profile.targetDates) {
        const generated = produceSeriesCandidates({
          targetDate,
          userId: profile.id,
          userTimezone: profile.timezone,
          wantsFestivalReminders: true,
          childOccurrences: matchingOccurrences,
        });
        for (const candidate of generated.candidates) {
          if (Date.parse(candidate.scheduled_for) <= now.getTime()) {
            skippedForPastLocalSlot++;
            continue;
          }
          generatedCount++;
          candidateRows.push(candidate);
          if (candidateRows.length >= 250) await flushCandidates();
        }
      }
    }
    await flushCandidates();

    return NextResponse.json({
      ok: true,
      mode,
      eligibleOccurrences: occurrenceRows.length,
      candidatesGenerated: generatedCount,
      candidatesInserted: insertedCount,
      optedOutProfiles: optedOut,
      skippedForPastLocalSlot,
    });
  } catch (error) {
    console.error('[observance-series-candidates] generation failed:', error);
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
