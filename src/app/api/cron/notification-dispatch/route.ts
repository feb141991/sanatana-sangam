import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/push-server";
import { emitEvent, emitError } from "@/lib/monitoring/events";
import { getLocalHour, isHourInQuietWindow, resolveTimeZone } from "@/lib/sacred-time";

// ─── Notification Dispatcher Cron ───────────────────────────────────────────
// Schedule: runs every 10 minutes (*/10 * * * *).
//
// Atomically claims due rows from `notification_schedule` where:
//   - status = 'pending'
//   - send_at <= NOW()
//   - send_at > NOW() - 2 hours (grace window)
//
// For each claimed row:
//   1. Re-verifies live user eligibility (active account, not in quiet hours right now).
//   2. Dispatches push notifications.
//   3. Inserts in-app bell record.
//   4. Updates row status to 'sent', 'skipped', or retries up to 3 times before 'failed'.
//   5. Automatically purges records older than 90 days (hourly check).

const BATCH_LIMIT = 200;
const NOTIFICATION_TYPE = "mood_checkin";

export async function GET(request: Request) {
  const startTime = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now      = new Date();
  const nowIso   = now.toISOString();
  const twoHoursAgoIso = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

  try {
    // ── 1. Atomically claim due rows ───────────────────────────────────────────
    let claimedRows: any[] = [];

    // Try PostgreSQL RPC first (FOR UPDATE SKIP LOCKED)
    const { data: rpcRows, error: rpcError } = await supabase.rpc(
      "claim_due_scheduled_notifications",
      {
        p_notification_type: NOTIFICATION_TYPE,
        p_batch_limit: BATCH_LIMIT,
      }
    );

    if (!rpcError && Array.isArray(rpcRows)) {
      claimedRows = rpcRows;
    } else {
      // Fallback: direct atomic update in JS/PostgREST
      // First, expire rows older than 2-hour grace window
      await supabase
        .from("notification_schedule")
        .update({ status: "failed", error: "expired_grace_window" })
        .eq("status", "pending")
        .eq("notification_type", NOTIFICATION_TYPE)
        .lte("send_at", twoHoursAgoIso);

      // Claim pending rows within grace window
      const { data: pendingRows } = await supabase
        .from("notification_schedule")
        .select("*")
        .eq("status", "pending")
        .eq("notification_type", NOTIFICATION_TYPE)
        .lte("send_at", nowIso)
        .gt("send_at", twoHoursAgoIso)
        .order("send_at", { ascending: true })
        .limit(BATCH_LIMIT);

      if (pendingRows && pendingRows.length > 0) {
        const ids = pendingRows.map((r: any) => r.id);
        const { data: lockedRows } = await supabase
          .from("notification_schedule")
          .update({ status: "sending" })
          .in("id", ids)
          .eq("status", "pending")
          .select("*");

        claimedRows = lockedRows ?? [];
      }
    }

    // ── 2. Run 90-day retention cleanup (once per hour, minute < 10) ────────────
    if (now.getUTCMinutes() < 10) {
      const { error: rpcCleanErr } = await supabase.rpc("cleanup_old_scheduled_notifications", {
        p_days_old: 90,
      });

      if (rpcCleanErr) {
        // Fallback: direct delete
        const ninetyDaysAgoIso = new Date(now.getTime() - 90 * 86_400_000).toISOString();
        await supabase
          .from("notification_schedule")
          .delete()
          .in("status", ["sent", "failed", "skipped", "cancelled"])
          .lt("created_at", ninetyDaysAgoIso);
      }
    }

    if (!claimedRows || claimedRows.length === 0) {
      return NextResponse.json({ message: "No due notifications to dispatch", processed: 0 });
    }

    // ── 3. Re-verify user eligibility at dispatch time ─────────────────────────
    const userIds = Array.from(new Set(claimedRows.map((r) => r.user_id)));
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, timezone, notification_quiet_hours_start, notification_quiet_hours_end, is_deleting")
      .in("id", userIds);

    if (profileErr) {
      console.error("[notification-dispatch] Profile lookup error:", profileErr);
    }

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const eligibleRows: any[] = [];
    const skippedRows: Array<{ id: string; reason: string }> = [];

    for (const row of claimedRows) {
      const profile = profileMap.get(row.user_id);
      if (!profile || profile.is_deleting) {
        skippedRows.push({ id: row.id, reason: profile?.is_deleting ? "account_deletion_pending" : "user_missing" });
        continue;
      }

      // Check quiet hours right now at dispatch time
      const tz = resolveTimeZone(profile.timezone);
      const currentLocalHour = getLocalHour(now, tz);
      const quietStart = profile.notification_quiet_hours_start !== null ? Number(profile.notification_quiet_hours_start) : null;
      const quietEnd   = profile.notification_quiet_hours_end !== null ? Number(profile.notification_quiet_hours_end) : null;

      if (isHourInQuietWindow(currentLocalHour, quietStart, quietEnd)) {
        skippedRows.push({ id: row.id, reason: "quiet_hours_active" });
        continue;
      }

      eligibleRows.push(row);
    }

    // ── 4. Send pushes with per-row error isolation ────────────────────────────
    const succeededRows: Array<{
      id: string;
      user_id: string;
      title: string;
      body: string;
      notification_key: string;
      action_url: string;
      sent_timezone: string;
      local_date: string;
    }> = [];

    const failedRows: Array<{ id: string; retry_count: number; error: string }> = [];

    for (const row of eligibleRows) {
      try {
        const meta = (row.metadata ?? {}) as Record<string, any>;
        const actionPath = meta.action_url ?? "/discover/mood";
        const actionUrl = new URL(actionPath, new URL(request.url).origin).toString();

        await sendPushNotification({
          userIds: [row.user_id],
          title:   row.title,
          body:    row.body,
          url:     actionUrl,
          data: {
            type: row.notification_type ?? NOTIFICATION_TYPE,
            notification_key: row.notification_key ?? "",
          },
        });

        succeededRows.push({
          id:               row.id,
          user_id:          row.user_id,
          title:            row.title,
          body:             row.body,
          notification_key: row.notification_key,
          action_url:       actionPath,
          sent_timezone:    meta.timezone ?? "UTC",
          local_date:       meta.local_date ?? nowIso.slice(0, 10),
        });
      } catch (err: any) {
        const nextRetry = (row.retry_count ?? 0) + 1;
        failedRows.push({
          id:          row.id,
          retry_count: nextRetry,
          error:       err?.message || "Push dispatch failed",
        });
      }
    }

    // ── 5. Bulk insert in-app bell notifications ───────────────────────────────
    if (succeededRows.length > 0) {
      const bellNotifications = succeededRows.map((r) => ({
        user_id:          r.user_id,
        title:            r.title,
        body:             r.body,
        emoji:            "🌿",
        type:             "general",
        action_url:       r.action_url,
        notification_key: r.notification_key,
        local_date:       r.local_date,
        sent_timezone:    r.sent_timezone,
      }));

      for (let i = 0; i < bellNotifications.length; i += 100) {
        const batch = bellNotifications.slice(i, i + 100);
        await supabase
          .from("notifications")
          .upsert(batch, { onConflict: "user_id,notification_key", ignoreDuplicates: true });
      }

      // Mark status = 'sent' in bulk batches of 100
      const successIds = succeededRows.map((r) => r.id);
      for (let i = 0; i < successIds.length; i += 100) {
        const batchIds = successIds.slice(i, i + 100);
        await supabase
          .from("notification_schedule")
          .update({ status: "sent", sent_at: nowIso, error: null })
          .in("id", batchIds);
      }
    }

    // ── 6. Batch update skipped rows (grouped by reason) ──────────────────────
    if (skippedRows.length > 0) {
      const skippedByReason = new Map<string, string[]>();
      for (const s of skippedRows) {
        if (!skippedByReason.has(s.reason)) skippedByReason.set(s.reason, []);
        skippedByReason.get(s.reason)!.push(s.id);
      }

      for (const [reason, ids] of skippedByReason.entries()) {
        for (let i = 0; i < ids.length; i += 100) {
          await supabase
            .from("notification_schedule")
            .update({ status: "skipped", error: reason })
            .in("id", ids.slice(i, i + 100));
        }
      }
    }

    // ── 7. Batch update failed rows (grouped by status, retry_count, error) ───
    if (failedRows.length > 0) {
      const failedGroups = new Map<string, { status: string; retry_count: number; error: string; ids: string[] }>();
      for (const f of failedRows) {
        const status = f.retry_count >= 3 ? "failed" : "pending";
        const key = `${status}:${f.retry_count}:${f.error}`;
        if (!failedGroups.has(key)) {
          failedGroups.set(key, { status, retry_count: f.retry_count, error: f.error, ids: [] });
        }
        failedGroups.get(key)!.ids.push(f.id);
      }

      for (const group of failedGroups.values()) {
        for (let i = 0; i < group.ids.length; i += 100) {
          await supabase
            .from("notification_schedule")
            .update({ status: group.status, retry_count: group.retry_count, error: group.error })
            .in("id", group.ids.slice(i, i + 100));
        }
      }
    }

    emitEvent({
      severity: "P3",
      domain: "notifications",
      route: "/api/cron/notification-dispatch",
      latency_ms: Date.now() - startTime,
      context: {
        status: "dispatched",
        claimed: claimedRows.length,
        succeeded: succeededRows.length,
        skipped: skippedRows.length,
        failed: failedRows.length,
      },
    });

    return NextResponse.json({
      message: "Notification dispatch completed",
      claimed: claimedRows.length,
      succeeded: succeededRows.length,
      skipped: skippedRows.length,
      failed: failedRows.length,
    });
  } catch (error: any) {
    emitError("notifications", error, "P2", { route: "/api/cron/notification-dispatch" });
    console.error("[notification-dispatch] Cron crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dispatcher crashed" },
      { status: 500 }
    );
  }
}
