import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNextLocalHourUtc, isHourInQuietWindow, resolveTimeZone } from '@/lib/sacred-time';
import { enqueueNotificationSchedule } from '@/lib/notification-schedule-queue';
import { getRoutinePipelineMode } from '@/lib/notification-candidate-pipeline-mode';
import { produceMoodCandidate } from '@/lib/mood-candidate-producer';
import type { NotificationCandidateInsert } from '@/types/database';

// ─── Evening Mood Check-In Reminder ──────────────────────────────────────────
// Schedule: 30 12 * * * (12:30 PM UTC = ~6 PM IST, early evening UK time)
//
// Second daily nudge for users who haven't set their mood today.
//
// Under 'candidate' mode: produces candidates into `notification_candidates`
// with zero direct push and zero bell writes.
// Under 'legacy' mode: enqueues into the shared, cadence-guarded schedule.
// Under 'disabled' mode: halts immediately.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Pipeline Mode check: legacy | candidate | disabled
  const pipelineMode = getRoutinePipelineMode('mood');
  if (pipelineMode === 'disabled') {
    return NextResponse.json({
      ok: true,
      skipped: true,
      pipeline_mode: 'disabled',
      reason: 'mood_reminders_disabled_by_policy',
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const now = new Date();
    const targetLocalHour = 18; // 6 PM local

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end, is_deleting')
      .or('is_deleting.is.null,is_deleting.eq.false');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found', sent: 0, pipeline_mode: pipelineMode });
    }

    // This cron is one UTC invocation, so a current-hour filter silently
    // excludes most time zones. Schedule each user's next local 18:00 instead.
    const eligibleUsers = users;

    // ─── CANDIDATE PIPELINE PATH ─────────────────────────────────────────────
    if (pipelineMode === 'candidate') {
      const candidateRowsToInsert: NotificationCandidateInsert[] = [];

      for (const u of eligibleUsers) {
        const tz = resolveTimeZone((u as any).timezone);
        const localDate = getNextLocalHourUtc(now, tz, targetLocalHour, 0).localDateIso;

        const candidate = produceMoodCandidate(
          {
            id: u.id,
            tradition: (u as any).tradition,
            timezone: tz,
            notification_quiet_hours_start: (u as any).notification_quiet_hours_start,
            notification_quiet_hours_end: (u as any).notification_quiet_hours_end,
            is_deleting: (u as any).is_deleting,
          },
          'evening',
          localDate
        );

        if (candidate) {
          candidateRowsToInsert.push(candidate);
        }
      }

      let totalCandidates = 0;
      for (let i = 0; i < candidateRowsToInsert.length; i += 100) {
        const batch = candidateRowsToInsert.slice(i, i + 100);
        const { data: rows, error: insertErr } = await supabase
          .from('notification_candidates')
          .upsert(batch, {
            onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
            ignoreDuplicates: true,
          })
          .select('id');

        if (insertErr) {
          console.error('[mood-reminder-evening/candidate] Candidate insert error:', insertErr);
          return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }
        totalCandidates += rows?.length ?? 0;
      }

      return NextResponse.json({
        ok: true,
        pipeline_mode: 'candidate',
        message: 'Mood evening candidates produced successfully',
        eligible_users: eligibleUsers.length,
        candidates_produced: candidateRowsToInsert.length,
        candidates_inserted: totalCandidates,
      });
    }

    // ─── LEGACY PIPELINE PATH ────────────────────────────────────────────────
    const EVENING_PROMPTS_BY_TRADITION: Record<string, string[]> = {
      hindu: [
        'As the day winds down, how has your inner journey been?',
        'Before evening puja, take a moment — how do you feel?',
        'The setting sun invites reflection. What is your mood?',
      ],
      sikh: [
        'As Rehras Sahib time approaches, how does your heart feel?',
        'The evening Gurbani calls — how are you in this moment?',
      ],
      buddhist: [
        'Evening meditation begins with awareness. How are you?',
        'As the day closes, what feelings are present for you?',
      ],
      jain: [
        'Evening pratikraman time — how has your inner space been?',
        'Before your evening samayik, check in: how do you feel?',
      ],
      other: [
        'As the day winds down, how are you feeling?',
        'Take a quiet moment — what is your mood this evening?',
      ],
    };

    const scheduleRows = eligibleUsers.flatMap((u) => {
      const tz = resolveTimeZone((u as any).timezone);
      const { sendAt, localDateIso } = getNextLocalHourUtc(now, tz, targetLocalHour, 0);
      const quietStart = (u as any).notification_quiet_hours_start == null
        ? null
        : Number((u as any).notification_quiet_hours_start);
      const quietEnd = (u as any).notification_quiet_hours_end == null
        ? null
        : Number((u as any).notification_quiet_hours_end);
      if (isHourInQuietWindow(targetLocalHour, quietStart, quietEnd)) return [];
      const tradition = ((u as any).tradition ?? 'hindu') as string;
      const prompts = EVENING_PROMPTS_BY_TRADITION[tradition] ?? EVENING_PROMPTS_BY_TRADITION.other;
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];

      return [{
        user_id: u.id,
        title: '🌙 Evening check-in',
        body: `${prompt} Let scripture meet your mood.`,
        send_at: sendAt.toISOString(),
        notification_type: 'mood',
        status: 'pending' as const,
        notification_key: `mood-evening:${u.id}:${localDateIso}`,
        metadata: {
          emoji: '🌙',
          type: 'general',
          action_url: '/discover/mood',
          prompt,
          tradition,
          timezone: tz,
          local_date: localDateIso,
        },
      }];
    });

    const { queued, ignored } = await enqueueNotificationSchedule(supabase, scheduleRows);

    return NextResponse.json({
      message: 'Evening mood reminders queued',
      pipeline_mode: 'legacy',
      scheduled_candidates: scheduleRows.length,
      enqueued: queued,
      ignored,
    });
  } catch (error) {
    console.error('mood-reminder-evening cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
