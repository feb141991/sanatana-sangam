import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalTokens },
      { data: recentDeliveries, error: deliveriesErr },
      { data: pendingReceipts },
      { data: recentFailures, error: failuresErr },
      { data: allRecentDeliveries }
    ] = await Promise.all([
      supabase.from("push_tokens").select("*", { count: "exact", head: true }),
      supabase
        .from("notification_deliveries")
        .select("provider, status, error_code, created_at")
        .gte("created_at", twentyFourHoursAgo),
      supabase.from("push_receipts_pending").select("ticket_id, token, user_id, created_at").limit(100),
      supabase
        .from("notification_deliveries")
        .select("id, user_id, provider, type, status, error_code, error_message, created_at, metadata")
        .eq("status", "failed")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("notification_deliveries")
        .select("id, user_id, provider, type, status, error_code, error_message, created_at, metadata")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(150)
    ]);

    if (deliveriesErr) console.warn("[admin/push-monitoring] Deliveries query error:", deliveriesErr.message);
    if (failuresErr) console.warn("[admin/push-monitoring] Failures query error:", failuresErr.message);

    const expoDeliveries = (recentDeliveries ?? []).filter((d) => d.provider === "expo");
    const onesignalDeliveries = (recentDeliveries ?? []).filter((d) => d.provider === "onesignal");

    const expoSent = expoDeliveries.filter((d) => d.status === "sent").length;
    const expoFailed = expoDeliveries.filter((d) => d.status === "failed").length;
    const expoSkipped = expoDeliveries.filter((d) => d.status === "skipped").length;
    const expoTotal = expoSent + expoFailed;
    const expoSuccessRate = expoTotal > 0 ? Math.round((expoSent / expoTotal) * 100) : 100;

    const onesignalSent = onesignalDeliveries.filter((d) => d.status === "sent").length;
    const onesignalFailed = onesignalDeliveries.filter((d) => d.status === "failed").length;
    const onesignalUnconfigured = onesignalDeliveries.filter((d) => d.status === "unconfigured").length;

    return NextResponse.json({
      activeTokens: totalTokens ?? 0,
      pendingReceiptsCount: pendingReceipts?.length ?? 0,
      pendingReceipts: pendingReceipts ?? [],
      last24h: {
        expo: {
          sent: expoSent,
          failed: expoFailed,
          skipped: expoSkipped,
          successRate: expoSuccessRate,
        },
        onesignal: {
          sent: onesignalSent,
          failed: onesignalFailed,
          unconfigured: onesignalUnconfigured,
        },
      },
      recentFailures: recentFailures ?? [],
      allRecentDeliveries: allRecentDeliveries ?? []
    });
  } catch (error) {
    console.error("[admin/push-monitoring] Failed to aggregate push stats:", error);
    return NextResponse.json(
      { error: "Failed to aggregate push monitoring data" },
      { status: 500 }
    );
  }
}
