import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNextLocalHourUtc, resolveTimeZone } from '@/lib/sacred-time';
import { enqueueNotificationSchedule } from '@/lib/notification-schedule-queue';
import { getPanchangTimes, getTithiReminder } from '@/lib/panchang';
import { getTraditionMeta } from '@/lib/tradition-config';
import { getRoutinePipelineMode } from '@/lib/notification-candidate-pipeline-mode';
import { produceShlokaCandidate } from '@/lib/shloka-candidate-producer';
import type { NotificationCandidateInsert } from '@/types/database';

export const dynamic = 'force-dynamic';

// ─── Shloka Streak Reminder Cron ─────────────────────────────────────────────
// Schedule: 0 6 * * * (daily; see vercel.json).
// In candidate mode, produces each opted-in user's 19:00 local slot regardless
// of the cron's current local hour, then central resolution dispatches it later.
// Legacy mode also enters the shared schedule, so the single daily UTC cron
// can enqueue each user's next local 19:00 without sending at cron time.
// In disabled mode: halts cleanly without sending.

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
  const pipelineMode = getRoutinePipelineMode('shloka');
  if (pipelineMode === 'disabled') {
    return NextResponse.json({
      ok: true,
      skipped: true,
      pipeline_mode: 'disabled',
      reason: 'shloka_reminders_disabled_by_policy',
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase cron environment is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const actionPath = '/home?focus=shloka';
    const now = new Date();
    const targetLocalHour = 19;

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, shloka_streak, full_name, tradition, timezone, latitude, longitude, last_shloka_date, wants_shloka_reminders, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      console.error('Shloka cron users query failed:', usersError);
      return NextResponse.json(
        { error: `Profiles query failed: ${usersError.message}` },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "All users have read today's shloka", sent: 0 });
    }

    const eligibleUsers = users.filter((user) => {
      const timeZone = resolveTimeZone((user as any).timezone);
      if ((user as any).wants_shloka_reminders === false) return false;
      const targetDate = getNextLocalHourUtc(now, timeZone, targetLocalHour, 0).localDateIso;
      return user.last_shloka_date !== targetDate;
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        message: 'No users need a Shloka reminder for their next local slot',
        sent: 0,
        eligibleCount: 0,
        pipeline_mode: pipelineMode,
      });
    }

    // ─── CANDIDATE PIPELINE PATH ─────────────────────────────────────────────
    if (pipelineMode === 'candidate') {
      const candidateRowsToInsert: NotificationCandidateInsert[] = [];

      for (const u of eligibleUsers) {
        const timeZone = resolveTimeZone((u as any).timezone);
        const localDate = getNextLocalHourUtc(now, timeZone, targetLocalHour, 0).localDateIso;
        const candidate = produceShlokaCandidate(
          {
            id: u.id,
            tradition: (u as any).tradition,
            timezone: timeZone,
            shloka_streak: u.shloka_streak,
            last_shloka_date: u.last_shloka_date,
            wants_shloka_reminders: (u as any).wants_shloka_reminders,
            latitude: (u as any).latitude,
            longitude: (u as any).longitude,
            notification_quiet_hours_start: (u as any).notification_quiet_hours_start,
            notification_quiet_hours_end: (u as any).notification_quiet_hours_end,
          },
          localDate
        );

        if (candidate) {
          candidateRowsToInsert.push(candidate);
        }
      }

      if (candidateRowsToInsert.length === 0) {
        return NextResponse.json({
          success: true,
          pipeline_mode: 'candidate',
          message: 'No eligible candidates generated',
          candidatesCreated: 0,
        });
      }

      let totalInserted = 0;
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
          console.error('[shloka-reminder] candidate upsert error:', insertErr);
          return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }
        totalInserted += rows?.length ?? batch.length;
      }

      return NextResponse.json({
        success: true,
        pipeline_mode: 'candidate',
        eligibleCount: eligibleUsers.length,
        candidatesCreated: totalInserted,
      });
    }

    // ─── LEGACY PIPELINE PATH ────────────────────────────────────────────────
    const scheduleRows = eligibleUsers.map((u) => {
      const timeZone  = resolveTimeZone((u as any).timezone);
      const { sendAt, localDateIso } = getNextLocalHourUtc(now, timeZone, targetLocalHour, 0);
      const streak    = u.shloka_streak ?? 0;
      const tradition = (u as any).tradition ?? 'hindu';
      const meta = getTraditionMeta(tradition);
      const streakMsg = streak > 0
        ? `Don't break your ${streak}-day streak! 🔥`
        : `Start your ${meta.vocabulary.shloka.toLowerCase()} journey today 🌱`;

      // Engine enrichment — mention special tithi when relevant
      let tithiSuffix = '';
      try {
        const lat   = (u as any).latitude  as number | null;
        const lon   = (u as any).longitude as number | null;
        const times = getPanchangTimes(sendAt, lat, lon);
        const tithiReminder = getTithiReminder(times.tithiIndex, tradition);
        if (tithiReminder) {
          tithiSuffix = ` Today is ${times.tithi} — ${tithiReminder.emoji} an especially powerful evening for your reading.`;
        }
      } catch { /* enrichment is best-effort */ }

      return {
        user_id:    u.id,
        title:      `${meta.symbol} ${meta.sacredTextLabel} awaits`,
        body:       `${streakMsg} Take a moment for today's ${meta.vocabulary.shloka.toLowerCase()}.${tithiSuffix}`,
        send_at: sendAt.toISOString(),
        notification_type: 'shloka',
        status: 'pending' as const,
        notification_key: `shloka:${u.id}:${localDateIso}`,
        metadata: {
          emoji: meta.symbol,
          type: 'streak',
          action_url: actionPath,
          timezone: timeZone,
          local_date: localDateIso,
        },
      };
    });

    const { queued, ignored } = await enqueueNotificationSchedule(supabase, scheduleRows);

    return NextResponse.json({
      success:       true,
      pipeline_mode: 'legacy',
      message:       'Shloka reminders queued',
      scheduled_candidates: scheduleRows.length,
      enqueued: queued,
      ignored,
    });
  } catch (error) {
    console.error('Shloka cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shloka cron crashed' },
      { status: 500 }
    );
  }
}
