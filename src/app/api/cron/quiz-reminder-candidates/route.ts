import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCandidateTypePipelineMode, isCandidateResolverGloballyEnabled } from '@/lib/notification-candidate-pipeline-mode';
import { getLocalDateIso } from '@/lib/sacred-time';
import {
  getDueQuizReminderStage,
  produceQuizCandidate,
  type DevoteeProfileForQuiz,
  type QuizReminderStage,
} from '@/lib/quiz-candidate-producer';

const PROFILE_PAGE_SIZE = 500;

type QuizProfileRow = DevoteeProfileForQuiz & {
  app_language?: string | null;
  is_deleting?: boolean | null;
};

function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const allowedSecrets = [process.env.CRON_SECRET, process.env.INTERNAL_DISPATCH_SECRET]
    .filter((secret): secret is string => Boolean(secret));
  if (allowedSecrets.length === 0) {
    return NextResponse.json({ error: 'No cron secret is configured' }, { status: 500 });
  }
  if (!allowedSecrets.some((secret) => request.headers.get('authorization') === `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const candidateMode = getCandidateTypePipelineMode('quiz');
  const resolverEnabled = isCandidateResolverGloballyEnabled();
  if (!resolverEnabled || candidateMode !== 'candidate') {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'quiz_candidate_pipeline_not_enabled',
      resolverEnabled,
      candidateMode,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: 'Missing Supabase environment' }, { status: 500 });

  const supabase = createClient(url, serviceKey);
  const now = new Date();
  const devoteesByDateAndStage = new Map<string, Array<{ profile: QuizProfileRow; localDate: string; stage: QuizReminderStage }>>();
  let lastProfileId: string | null = null;
  let optedInProfilesScanned = 0;
  let skippedInvalidTimezone = 0;

  try {
    for (;;) {
      let query = supabase.from('profiles')
        .select('id, timezone, tradition, app_language, quiz_reminder_enabled, quiz_reminder_time, notification_quiet_hours_start, notification_quiet_hours_end, is_deleting')
        .eq('quiz_reminder_enabled', true)
        .or('is_deleting.is.null,is_deleting.eq.false')
        .order('id', { ascending: true })
        .limit(PROFILE_PAGE_SIZE);
      if (lastProfileId) query = query.gt('id', lastProfileId);

      const { data, error } = await query;
      if (error) throw new Error(`Opted-in profile query failed: ${error.message}`);
      const profiles = (data ?? []) as QuizProfileRow[];

      for (const profile of profiles) {
        optedInProfilesScanned++;
        if (!profile.timezone || !isValidTimeZone(profile.timezone)) {
          skippedInvalidTimezone++;
          continue;
        }
        const localDate = getLocalDateIso(now, profile.timezone);
        const stage = getDueQuizReminderStage(profile, localDate, now);
        if (!stage) continue;
        const key = `${localDate}::${stage}`;
        const group = devoteesByDateAndStage.get(key) ?? [];
        group.push({ profile, localDate, stage });
        devoteesByDateAndStage.set(key, group);
      }

      if (profiles.length < PROFILE_PAGE_SIZE) break;
      const lastProfile = profiles[profiles.length - 1];
      if (typeof lastProfile.id !== 'string') throw new Error('Profile page returned no stable cursor id');
      lastProfileId = lastProfile.id;
    }

    const candidates = [];
    let completedUsersExcluded = 0;
    for (const group of devoteesByDateAndStage.values()) {
      const localDate = group[0].localDate;
      const userIds = [...new Set(group.map(({ profile }) => profile.id))];
      const { data: completedRows, error: completionError } = await supabase
        .from('quiz_responses')
        .select('user_id')
        .in('user_id', userIds)
        .eq('date', localDate);
      if (completionError) {
        // Unknown completion is not treated as incomplete; fail closed.
        throw new Error(`Quiz completion lookup failed for ${localDate}: ${completionError.message}`);
      }
      const completed = new Set((completedRows ?? []).map((row: { user_id: string }) => row.user_id));

      for (const { profile, stage } of group) {
        if (completed.has(profile.id)) {
          completedUsersExcluded++;
          continue;
        }
        const candidate = produceQuizCandidate({
          ...profile,
          language: profile.app_language ?? profile.language,
        }, localDate, stage);
        if (candidate) candidates.push(candidate);
      }
    }

    let insertedCount = 0;
    if (candidates.length > 0) {
      const { data, error } = await supabase.from('notification_candidates').upsert(candidates, {
        onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
        ignoreDuplicates: true,
      }).select('id');
      if (error) throw new Error(`Quiz candidate upsert failed: ${error.message}`);
      insertedCount = Array.isArray(data) ? data.length : 0;
    }

    return NextResponse.json({
      ok: true,
      candidateMode,
      resolverEnabled,
      optedInProfilesScanned,
      skippedInvalidTimezone,
      availabilityCandidates: candidates.filter((candidate) => candidate.event_instance === 'available').length,
      eveningCandidates: candidates.filter((candidate) => candidate.event_instance === 'evening_nudge').length,
      completedUsersExcluded,
      candidatesInserted: insertedCount,
    });
  } catch (error) {
    console.error('[quiz-reminder-candidates] generation failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Quiz candidate generation failed' }, { status: 503 });
  }
}
