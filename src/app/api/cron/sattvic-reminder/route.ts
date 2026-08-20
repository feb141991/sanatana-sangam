import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emitEvent } from "@/lib/monitoring/events";
import { getNextLocalHourUtc, isHourInQuietWindow, resolveTimeZone } from "@/lib/sacred-time";

// ─── Sattvic Mode Evening Reminder Enqueuer Cron ────────────────────────────
// Schedule: runs daily (e.g. 11:00 AM UTC ≈ 4:30 PM IST).
//
// Computes the NEXT upcoming local 17:00 (5:00 PM) for each user across all
// global timezones and enqueues a deterministic pending row into
// `notification_schedule` with unique key `sattvic_reminder:${user_id}:${local_date}`.
//
// The shared `notification-dispatch` cron claims and delivers due rows every 10 mins.

const TARGET_LOCAL_HOUR = 17; // ~5:00 PM local time

const SANDHYA_NUDGE: Record<string, { title: string; body: string }> = {
  hindu: {
    title: "🌅 Evening Sandhyā — Sattvic Mode Awaits",
    body: "The day softens. Step into Sattvic Mode for prānāyāma, kīrtana, or silent svādhyāya before the evening meal.",
  },
  sikh: {
    title: "☬ Evening Rehras Sahib Time",
    body: "The ambrosial hour of dusk approaches. Open Sattvic Mode for Rehras Sahib or naam simran.",
  },
  buddhist: {
    title: "☸️ Evening Sitting Practice",
    body: "As the day quietens, your sitting practice awaits. Five minutes of Sattvic presence before the evening.",
  },
  jain: {
    title: "🤲 Evening Pratikraman Reminder",
    body: "The evening hour calls for pratikraman. Open Sattvic Mode to sit, breathe, and reflect on today's actions.",
  },
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

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now      = new Date();

  try {
    // 1. Fetch all active users who opted into nitya reminders
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end, wants_nitya_reminders, is_deleting")
      .eq("wants_nitya_reminders", true)
      .or("is_deleting.is.null,is_deleting.eq.false");

    if (usersError) {
      console.error("[sattvic-reminder/enqueuer] Fetch profiles error:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No eligible sattvic reminder users found", enqueued: 0 });
    }

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

    // 2. Compute the NEXT occurrence of local 17:00 for each user
    for (const u of users) {
      const tz = resolveTimeZone(u.timezone);
      const { sendAt, localDateIso } = getNextLocalHourUtc(now, tz, TARGET_LOCAL_HOUR, 0);

      // Check quiet hours: skip scheduling if 17:00 falls in their quiet hours window
      const quietStart = u.notification_quiet_hours_start !== null ? Number(u.notification_quiet_hours_start) : null;
      const quietEnd   = u.notification_quiet_hours_end !== null ? Number(u.notification_quiet_hours_end) : null;

      if (isHourInQuietWindow(TARGET_LOCAL_HOUR, quietStart, quietEnd)) {
        continue;
      }

      const tradition = (u.tradition ?? "hindu") as string;
      const nudge     = SANDHYA_NUDGE[tradition] ?? SANDHYA_NUDGE.hindu;
      const dedupeKey = `sattvic_reminder:${u.id}:${localDateIso}`;

      scheduledRows.push({
        user_id:           u.id,
        title:             nudge.title,
        body:              nudge.body,
        send_at:           sendAt.toISOString(),
        notification_type: "sattvic_reminder",
        status:            "pending",
        metadata: {
          tradition,
          emoji:      "🕉️",
          type:       "nitya",
          action_url: "/bhakti/zen",
          timezone:   tz,
          local_date: localDateIso,
        },
        notification_key: dedupeKey,
        retry_count:      0,
      });
    }

    // 3. Upsert scheduled rows in batches of 100 with deduplication
    let totalEnqueued = 0;
    for (let i = 0; i < scheduledRows.length; i += 100) {
      const batch = scheduledRows.slice(i, i + 100);
      const { data: upserted, error: upsertError } = await supabase
        .from("notification_schedule")
        .upsert(batch, { onConflict: "notification_key", ignoreDuplicates: true })
        .select("id");

      if (upsertError) {
        console.error("[sattvic-reminder/enqueuer] Upsert error:", upsertError.message);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      totalEnqueued += upserted?.length ?? 0;
    }

    emitEvent({
      severity: "P3",
      domain: "notifications",
      route: "/api/cron/sattvic-reminder",
      latency_ms: Date.now() - startTime,
      context: {
        status: "enqueued",
        total_eligible: users.length,
        scheduled_candidates: scheduledRows.length,
        enqueued_count: totalEnqueued,
      },
    });

    return NextResponse.json({
      message: "Sattvic evening reminders enqueued successfully",
      total_eligible: users.length,
      scheduled_candidates: scheduledRows.length,
      enqueued: totalEnqueued,
    });
  } catch (error: any) {
    console.error("[sattvic-reminder/enqueuer] Cron crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enqueuer crashed" },
      { status: 500 }
    );
  }
}
