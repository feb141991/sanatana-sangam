import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/push-server";
import { emitEvent, emitError } from "@/lib/monitoring/events";
import { getLocalHour, isHourInQuietWindow, resolveTimeZone } from "@/lib/sacred-time";

// ─── Notification Dispatcher Cron ───────────────────────────────────────────
// Schedule: runs every 10 minutes (*/10 * * * *).
//
// Atomically claims due rows across all scheduled notification types from
// `notification_schedule` with a 15-minute lease and crash recovery:
//   - status = 'pending' AND send_at <= NOW() AND send_at > NOW() - 2 hours
//   OR
//   - status = 'sending' AND claimed_at <= NOW() - 15 minutes (stuck lease recovery)
//
// Delivery ordering:
//   1. Re-verifies live user eligibility (active account, not in quiet hours right now).
//   2. Persists in-app bell notification record IDEMPOTENTLY first (onConflict: user_id,notification_key).
//   3. Dispatches push notification.
//   4. Updates row status to 'sent'.
//   5. Purges records older than 90 days (hourly check).

const BATCH_LIMIT = 200;

export async function GET(request: Request) {
  const startTime = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== "Bearer " + cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const fifteenMinutesAgoIso = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

  try {
    // ── 1. Atomically claim due rows (with lease recovery) ─────────────────────
    let claimedRows: any[] = [];

    // Try PostgreSQL RPC first (FOR UPDATE SKIP LOCKED with p_notification_type = NULL)
    const { data: rpcRows, error: rpcError } = await supabase.rpc(
      "claim_due_scheduled_notifications",
      {
        p_notification_type: null,
        p_batch_limit: BATCH_LIMIT,
      }
    );

    if (!rpcError && Array.isArray(rpcRows)) {
      claimedRows = rpcRows;
    } else {
      // Fallback: direct atomic update in JS/PostgREST
      // First, expire pending rows older than 2-hour grace window
      await supabase
        .from("notification_schedule")
        .update({ status: "failed", error: "expired_grace_window" })
        .eq("status", "pending")
        .lte("send_at", twoHoursAgoIso);

      // Claim pending rows within grace window OR stuck sending rows older than 15 mins
      const { data: pendingRows } = await supabase
        .from("notification_schedule")
        .select("*")
        .or("and(status.eq.pending,send_at.lte." + nowIso + ",send_at.gt." + twoHoursAgoIso + "),and(status.eq.sending,claimed_at.lte." + fifteenMinutesAgoIso + ")")
        .order("send_at", { ascending: true })
        .limit(BATCH_LIMIT);

      if (pendingRows && pendingRows.length > 0) {
        const ids = pendingRows.map((r: any) => r.id);
        const { data: lockedRows } = await supabase
          .from("notification_schedule")
          .update({ status: "sending", claimed_at: nowIso })
          .in("id", ids)
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

    // ── 4. Idempotent In-App Bell Record Insertion BEFORE Push Delivery ─────────
    if (eligibleRows.length > 0) {
      const bellNotifications = eligibleRows.map((row) => {
        const meta = (row.metadata ?? {}) as Record<string, any>;
        const notifType = row.notification_type ?? "generic";
        const defaultActionPath = notifType === "sattvic_reminder"
          ? "/bhakti/zen"
          : notifType.startsWith("nitya")
          ? "/nitya-karma"
          : "/discover/mood";
        const actionPath = meta.action_url ?? defaultActionPath;
        const emoji = meta.emoji ?? (
          notifType === "mood_checkin" ? "🌿" :
          notifType === "nitya_madhyahn" ? "🌞" :
          notifType === "nitya_sandhya" ? "🪔" :
          notifType === "sattvic_reminder" ? "🕉️" : "🔔"
        );
        const bellType = (meta.type as "festival" | "mandali" | "streak" | "seva" | "general" | "nitya") ?? (
          notifType.startsWith("nitya") || notifType === "sattvic_reminder" ? "nitya" : "general"
        );

        return {
          user_id:          row.user_id,
          title:            row.title,
          body:             row.body,
          emoji,
          type:             bellType,
          action_url:       actionPath,
          notification_key: row.notification_key,
          local_date:       meta.local_date ?? nowIso.slice(0, 10),
          sent_timezone:    meta.timezone ?? "UTC",
        };
      });

      for (let i = 0; i < bellNotifications.length; i += 100) {
        const batch = bellNotifications.slice(i, i + 100);
        await supabase
          .from("notifications")
          .upsert(batch, { onConflict: "user_id,notification_key", ignoreDuplicates: true });
      }
    }

    // ── 5. Send pushes with per-row error isolation ────────────────────────────
    const succeededIds: string[] = [];
    const failedRows: Array<{ id: string; retry_count: number; error: string }> = [];

    for (const row of eligibleRows) {
      try {
        const meta = (row.metadata ?? {}) as Record<string, any>;
        const notifType = row.notification_type ?? "generic";
        const defaultActionPath = notifType === "sattvic_reminder"
          ? "/bhakti/zen"
          : notifType.startsWith("nitya")
          ? "/nitya-karma"
          : "/discover/mood";
        const actionPath = meta.action_url ?? defaultActionPath;
        const actionUrl = new URL(actionPath, new URL(request.url).origin).toString();

        await sendPushNotification({
          userIds: [row.user_id],
          title:   row.title,
          body:    row.body,
          url:     actionUrl,
          data: {
            type: notifType,
            notification_key: row.notification_key ?? "",
          },
        });

        succeededIds.push(row.id);
      } catch (err: any) {
        const nextRetry = (row.retry_count ?? 0) + 1;
        failedRows.push({
          id:          row.id,
          retry_count: nextRetry,
          error:       err?.message || "Push dispatch failed",
        });
      }
    }

    // ── 6. Update succeeded rows to status='sent' in batches of 100 ─────────
    if (succeededIds.length > 0) {
      for (let i = 0; i < succeededIds.length; i += 100) {
        const batchIds = succeededIds.slice(i, i + 100);
        await supabase
          .from("notification_schedule")
          .update({ status: "sent", sent_at: nowIso, error: null })
          .in("id", batchIds);
      }
    }

    // ── 7. Batch update skipped rows (grouped by reason) ──────────────────────
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

    // ── 8. Batch update failed rows (grouped by status, retry_count, error) ───
    if (failedRows.length > 0) {
      const failedGroups = new Map<string, { status: string; retry_count: number; error: string; ids: string[] }>();
      for (const f of failedRows) {
        const status = f.retry_count >= 3 ? "failed" : "pending";
        const key = status + ":" + f.retry_count + ":" + f.error;
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
        succeeded: succeededIds.length,
        skipped: skippedRows.length,
        failed: failedRows.length,
      },
    });

    return NextResponse.json({
      message: "Notification dispatch completed",
      claimed: claimedRows.length,
      succeeded: succeededIds.length,
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
