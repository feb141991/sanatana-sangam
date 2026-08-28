import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { fetchCronStatusMatrix, recordCronTelemetry, CRON_CATALOGUE } from "@/lib/monitoring/cron-telemetry";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;

  try {
    const supabase = createAdminClient() as any;
    const [summary, pendingRes, claimedRes, sentRes, failedRes, recentRes] = await Promise.all([
      fetchCronStatusMatrix(),
      supabase.from("notification_schedule").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("notification_schedule").select("id", { count: "exact", head: true }).eq("status", "claimed"),
      supabase.from("notification_schedule").select("id", { count: "exact", head: true }).eq("status", "sent"),
      supabase.from("notification_schedule").select("id", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("notification_schedule").select("id, title, body, notification_type, status, send_at, sent_at, error, created_at, notification_key").order("created_at", { ascending: false }).limit(20),
    ]);

    const queue = {
      pending: pendingRes.count ?? 0,
      claimed: claimedRes.count ?? 0,
      sent: sentRes.count ?? 0,
      failed: failedRes.count ?? 0,
      recent: recentRes.data ?? [],
    };

    return NextResponse.json({ crons: summary, queue });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch cron status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const cronPath: string = body.cronPath ?? "";

  const matched = CRON_CATALOGUE.find(c => c.route === cronPath || c.route.split("?")[0] === cronPath.split("?")[0]);
  if (!matched) {
    return NextResponse.json({ error: `Unknown cron path: ${cronPath}` }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const cronUrl = `${origin}${cronPath}`;
  const secret = process.env.CRON_SECRET ?? "";

  const startTime = Date.now();
  try {
    const res = await fetch(cronUrl, {
      method: matched.method,
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });

    const data = await res.json().catch(() => ({}));
    const durationMs = Date.now() - startTime;

    await recordCronTelemetry({
      route: cronPath,
      statusCode: res.status,
      durationMs,
      responseData: data,
      error: !res.ok ? (data?.error || `HTTP ${res.status}`) : undefined,
      triggeredBy: "admin_manual",
    });

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      duration_ms: durationMs,
      result: data,
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Network fetch failed";

    await recordCronTelemetry({
      route: cronPath,
      statusCode: 500,
      durationMs,
      error: errorMsg,
      triggeredBy: "admin_manual",
    });

    return NextResponse.json({ error: errorMsg, ok: false, status: 500 }, { status: 500 });
  }
}
