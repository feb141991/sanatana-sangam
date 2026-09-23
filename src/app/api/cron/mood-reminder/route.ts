import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emitEvent } from "@/lib/monitoring/events";
import { getNextLocalHourUtc, isHourInQuietWindow, resolveTimeZone } from "@/lib/sacred-time";
import { getRoutinePipelineMode } from "@/lib/notification-candidate-pipeline-mode";
import { produceMoodCandidate } from "@/lib/mood-candidate-producer";
import type { NotificationCandidateInsert } from "@/types/database";

// ─── Mood Check-In Enqueuer Cron ─────────────────────────────────────────────
// Schedule: runs once daily (30 3 * * * = 3:30 AM UTC).
//
// Computes the NEXT upcoming local noon (12:00 PM) for each user across all
// global timezones.
//
// Under 'candidate' mode: creates candidate rows in `notification_candidates`
// with zero direct push and zero bell writes.
// Under 'legacy' mode: enqueues rows into `notification_schedule`.
// Under 'disabled' mode: halts immediately.

const TARGET_LOCAL_HOUR = 12; // noon local time

const MOOD_PROMPTS_BY_TRADITION: Record<string, string[]> = {
  hindu: [
    "How is your inner space today?",
    "How does your heart feel in this moment?",
    "Take a breath — what is your mood right now?",
  ],
  sikh: [
    "Waheguru's grace is with you — how do you feel?",
    "Pause for a moment. What does your heart say?",
  ],
  buddhist: [
    "Notice this moment — what feelings are present?",
    "Be present — how is your mind right now?",
  ],
  jain: [
    "In this moment of awareness — how are you?",
    "Pause and observe — what is your inner state?",
  ],
  other: [
    "How are you feeling right now?",
    "Take a quiet breath — what is your mood?",
  ],
};

export async function GET(request: Request) {
  const startTime = Date.now();
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
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();

  try {
    // 1. Fetch all active users (excluding accounts marked for deletion)
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end, is_deleting")
      .or("is_deleting.is.null,is_deleting.eq.false");

    if (usersError) {
      console.error("[mood-reminder/enqueuer] Fetch profiles error:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No active users found", enqueued: 0, pipeline_mode: pipelineMode });
    }

    // ─── CANDIDATE PIPELINE PATH ─────────────────────────────────────────────
    if (pipelineMode === 'candidate') {
      const candidateRowsToInsert: NotificationCandidateInsert[] = [];

      for (const u of users) {
        const tz = resolveTimeZone(u.timezone);
        const { localDateIso } = getNextLocalHourUtc(now, tz, TARGET_LOCAL_HOUR, 0);

        const candidate = produceMoodCandidate(
          {
            id: u.id,
            tradition: u.tradition,
            timezone: tz,
            notification_quiet_hours_start: u.notification_quiet_hours_start,
            notification_quiet_hours_end: u.notification_quiet_hours_end,
            is_deleting: u.is_deleting,
          },
          'midday',
          localDateIso
        );

        if (candidate) {
          candidateRowsToInsert.push(candidate);
        }
      }

      let totalCandidates = 0;
      for (let i = 0; i < candidateRowsToInsert.length; i += 100) {
        const batch = candidateRowsToInsert.slice(i, i + 100);
        const { data: upserted, error: upsertErr } = await supabase
          .from('notification_candidates')
          .upsert(batch, {
            onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
            ignoreDuplicates: true,
          })
          .select('id');

        if (upsertErr) {
          console.error('[mood-reminder/candidate] Candidate upsert error:', upsertErr.message);
          return NextResponse.json({ error: upsertErr.message }, { status: 500 });
        }
        totalCandidates += upserted?.length ?? 0;
      }

      emitEvent({
        severity: 'P3',
        domain: 'notifications',
        route: '/api/cron/mood-reminder',
        latency_ms: Date.now() - startTime,
        context: {
          status: 'candidate_produced',
          pipeline_mode: 'candidate',
          total_eligible: users.length,
          candidates_produced: candidateRowsToInsert.length,
          candidates_inserted: totalCandidates,
        },
      });

      return NextResponse.json({
        ok: true,
        pipeline_mode: 'candidate',
        message: 'Mood midday candidates produced successfully',
        total_eligible: users.length,
        candidates_produced: candidateRowsToInsert.length,
        candidates_inserted: totalCandidates,
      });
    }

    // ─── LEGACY PIPELINE PATH ────────────────────────────────────────────────
    const scheduledRows: Array<{
      user_id: string;
      title: string;
      body: string;
      send_at: string;
      notification_type: string;
      status: "pending";
      metadata: Record<string, any>;
      notification_key: string;
      retry_count: number;
    }> = [];

    // 2. Compute the NEXT occurrence of local noon for each user
    for (const u of users) {
      const tz = resolveTimeZone(u.timezone);
      const { sendAt, localDateIso } = getNextLocalHourUtc(now, tz, TARGET_LOCAL_HOUR, 0);

      // Check quiet hours: skip scheduling if 12:00 noon falls in their quiet hours window
      const quietStart = u.notification_quiet_hours_start !== null ? Number(u.notification_quiet_hours_start) : null;
      const quietEnd = u.notification_quiet_hours_end !== null ? Number(u.notification_quiet_hours_end) : null;

      if (isHourInQuietWindow(TARGET_LOCAL_HOUR, quietStart, quietEnd)) {
        continue;
      }

      const tradition = (u.tradition ?? "hindu") as string;
      const prompts = MOOD_PROMPTS_BY_TRADITION[tradition] ?? MOOD_PROMPTS_BY_TRADITION.other;
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];

      const dedupeKey = `mood_checkin:${u.id}:${localDateIso}`;

      scheduledRows.push({
        user_id: u.id,
        title: "Midday check-in 🌿",
        body: `${prompt} Let scripture meet your mood.`,
        send_at: sendAt.toISOString(),
        notification_type: "mood_checkin",
        status: "pending",
        metadata: {
          tradition,
          prompt,
          action_url: "/discover/mood",
          timezone: tz,
          local_date: localDateIso,
        },
        notification_key: dedupeKey,
        retry_count: 0,
      });
    }

    // 3. Upsert scheduled rows in batches of 100 with deduplication
    let totalEnqueued = 0;
    for (let i = 0; i < scheduledRows.length; i += 100) {
      const batch = scheduledRows.slice(i, i + 100);
      const { data: upserted, error: upsertError } = await supabase
        .from("notification_schedule")
        .upsert(batch, { onConflict: "user_id,notification_key", ignoreDuplicates: true })
        .select("id");

      if (upsertError) {
        console.error("[mood-reminder/enqueuer] Upsert error:", upsertError.message);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      totalEnqueued += upserted?.length ?? 0;
    }

    emitEvent({
      severity: "P3",
      domain: "notifications",
      route: "/api/cron/mood-reminder",
      latency_ms: Date.now() - startTime,
      context: {
        status: "enqueued",
        pipeline_mode: "legacy",
        total_eligible: users.length,
        scheduled_candidates: scheduledRows.length,
        enqueued_count: totalEnqueued,
      },
    });

    return NextResponse.json({
      message: "Mood check-ins enqueued successfully",
      pipeline_mode: "legacy",
      total_eligible: users.length,
      scheduled_candidates: scheduledRows.length,
      enqueued: totalEnqueued,
    });
  } catch (error: any) {
    console.error("[mood-reminder/enqueuer] Cron crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enqueuer crashed" },
      { status: 500 }
    );
  }
}
