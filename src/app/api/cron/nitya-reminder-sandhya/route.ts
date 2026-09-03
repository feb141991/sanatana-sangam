import { resolveNotificationCopy } from '@/lib/notification-templates';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emitEvent } from "@/lib/monitoring/events";
import { getNextLocalHourUtc, isHourInQuietWindow, resolveTimeZone } from "@/lib/sacred-time";

// ─── Nitya Karma Sandhya Reminder Enqueuer Cron ─────────────────────────────
// Schedule: runs daily (e.g. 1:00 PM UTC ≈ 6:30 PM IST).
//
// Computes the NEXT upcoming local evening (6:00 PM = 18:00) for each user across all
// global timezones and enqueues a deterministic pending row into
// `notification_schedule` with unique key `nitya_sandhya:${user_id}:${local_date}`.
//
// The shared `notification-dispatch` cron claims and delivers due rows every 10 mins.

const TARGET_LOCAL_HOUR = 18; // 6:00 PM local time

const TRADITION_NUDGE: Record<string, { title: string; body: string }> = {
  hindu: {
    title: "🪔 Sandhya Diya — the day closes",
    body: "Light the lamp. Offer the evening prayer. The day returns to the one who gave it.",
  },
  sikh: {
    title: "🪔 Rehras Sahib",
    body: "The sun is setting. Rehras Sahib closes the day with grace.",
  },
  buddhist: {
    title: "🪔 Evening Sitting",
    body: "The day is done. 10 minutes before it fully closes.",
  },
  jain: {
    title: "🪔 Sayam Pratikraman",
    body: "Evening repentance — examine the day before it becomes the past.",
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
    // 1. Fetch all active users who opted into evening reminders with full_day/advanced rhythm
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end, wants_evening_reminder, nitya_rhythm_mode, is_deleting")
      .eq("wants_evening_reminder", true)
      .in("nitya_rhythm_mode", ["full_day", "advanced"])
      .or("is_deleting.is.null,is_deleting.eq.false");

    if (usersError) {
      console.error("[nitya-reminder-sandhya/enqueuer] Fetch profiles error:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No eligible sandhya users found", enqueued: 0 });
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

    // 2. Compute the NEXT occurrence of local 18:00 for each user
    for (const u of users) {
      const tz = resolveTimeZone(u.timezone);
      const { sendAt, localDateIso } = getNextLocalHourUtc(now, tz, TARGET_LOCAL_HOUR, 0);

      // Check quiet hours: skip scheduling if 18:00 falls in their quiet hours window
      const quietStart = u.notification_quiet_hours_start !== null ? Number(u.notification_quiet_hours_start) : null;
      const quietEnd   = u.notification_quiet_hours_end !== null ? Number(u.notification_quiet_hours_end) : null;

      if (isHourInQuietWindow(TARGET_LOCAL_HOUR, quietStart, quietEnd)) {
        continue;
      }

      const tradition = (u.tradition ?? "hindu") as string;
      const defaultNudge = TRADITION_NUDGE[tradition] ?? TRADITION_NUDGE.hindu;
      const nudge = await resolveNotificationCopy('sandhya', tradition, defaultNudge);
      const dedupeKey = `nitya_sandhya:${u.id}:${localDateIso}`;

      scheduledRows.push({
        user_id:           u.id,
        title:             nudge.title,
        body:              nudge.body,
        send_at:           sendAt.toISOString(),
        notification_type: "nitya_sandhya",
        status:            "pending",
        metadata: {
          tradition,
          emoji:      "🪔",
          type:       "nitya",
          action_url: "/nitya-karma",
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
        .upsert(batch, { onConflict: "user_id,notification_key", ignoreDuplicates: true })
        .select("id");

      if (upsertError) {
        console.error("[nitya-reminder-sandhya/enqueuer] Upsert error:", upsertError.message);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      totalEnqueued += upserted?.length ?? 0;
    }

    emitEvent({
      severity: "P3",
      domain: "notifications",
      route: "/api/cron/nitya-reminder-sandhya",
      latency_ms: Date.now() - startTime,
      context: {
        status: "enqueued",
        total_eligible: users.length,
        scheduled_candidates: scheduledRows.length,
        enqueued_count: totalEnqueued,
      },
    });

    return NextResponse.json({
      message: "Nitya sandhya reminders enqueued successfully",
      total_eligible: users.length,
      scheduled_candidates: scheduledRows.length,
      enqueued: totalEnqueued,
    });
  } catch (error: any) {
    console.error("[nitya-reminder-sandhya/enqueuer] Cron crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enqueuer crashed" },
      { status: 500 }
    );
  }
}
