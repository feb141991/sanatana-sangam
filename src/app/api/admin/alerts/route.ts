import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchClientErrorMonitoringMetrics } from "@/lib/monitoring/client-error-aggregator";

export interface UrgentAlertItem {
  id: string;
  title: string;
  desc: string;
  type: "integrity" | "report" | "dharm_veer" | "system" | "client_error";
  severity: "high" | "medium" | "low";
  href: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  try {
    const alerts: UrgentAlertItem[] = [];

    // 1. Client Error Spikes & New Fingerprints
    try {
      const clientMetrics = await fetchClientErrorMonitoringMetrics();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      for (const fp of clientMetrics.fingerprints) {
        const isBrandNew = fp.first_seen >= oneHourAgo;
        const isSpike = fp.count_1h >= 10;
        const isHomeSpike = fp.route === '/home' && fp.count_1h >= 3;
        const isStaleSpike = fp.stale_client_count >= 5;

        if (isBrandNew) {
          alerts.push({
            id: `client-err-new-${fp.fingerprint.slice(0, 10)}`,
            title: `New Client Crash: ${fp.error_name} on ${fp.route}`,
            desc: `Brand new fingerprint first seen at ${new Date(fp.first_seen).toLocaleTimeString()}. Message: ${fp.error_message.slice(0, 80)}`,
            type: "client_error",
            severity: fp.route === '/home' ? "high" : "medium",
            href: "/admin/monitoring",
            timestamp: fp.last_seen,
          });
        } else if (isHomeSpike || isSpike) {
          alerts.push({
            id: `client-err-spike-${fp.fingerprint.slice(0, 10)}`,
            title: `Crash Spike (${fp.count_1h}/hr): ${fp.error_name} on ${fp.route}`,
            desc: `Error frequency crossed threshold. ${fp.distinct_sessions_count} unique sessions affected in the last hour.`,
            type: "client_error",
            severity: "high",
            href: "/admin/monitoring",
            timestamp: fp.last_seen,
          });
        } else if (isStaleSpike) {
          alerts.push({
            id: `client-err-stale-${fp.fingerprint.slice(0, 10)}`,
            title: `Stale Client Deployment Spike on ${fp.route}`,
            desc: `${fp.stale_client_count} requests with stale bundle SHA detected (client !== server).`,
            type: "client_error",
            severity: "medium",
            href: "/admin/monitoring",
            timestamp: fp.last_seen,
          });
        }
      }
    } catch (clientErr) {
      console.error('[admin/alerts] Failed to evaluate client error alerts:', clientErr);
    }

    // 2. Calendar integrity findings
    const { data: findings } = await (supabase
      .from("calendar_integrity_findings") as any)
      .select("*")
      .eq("is_open", true)
      .in("issue_type", ["engine_curated_mismatch", "calculation_failed", "disputed_unratified"])
      .order("last_seen_at", { ascending: false })
      .limit(5);

    if (findings && findings.length > 0) {
      for (const f of findings as any[]) {
        alerts.push({
          id: `integrity-${f.id}`,
          title: `Calendar Integrity: ${f.display_name || f.slug} (${f.year})`,
          desc: f.reason || `Issue type: ${f.issue_type}`,
          type: "integrity",
          severity: f.issue_type === "engine_curated_mismatch" ? "high" : "medium",
          href: "/admin/calendar-governance",
          timestamp: f.last_seen_at || new Date().toISOString(),
        });
      }
    }

    // 3. Pending Content Reports
    const { data: reports } = await (supabase
      .from("content_reports") as any)
      .select("id, reason, created_at, reporter_id")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    if (reports && reports.length > 0) {
      for (const r of reports as any[]) {
        alerts.push({
          id: `report-${r.id}`,
          title: "Pending Content Report",
          desc: `Reason: ${r.reason || "Flagged by user"}`,
          type: "report",
          severity: "high",
          href: "/admin/moderation",
          timestamp: r.created_at || new Date().toISOString(),
        });
      }
    }

    // 4. Pending Dharm Veer Reviews
    const { data: dharmVeers } = await (supabase
      .from("dharm_veers") as any)
      .select("slug, name, updated_at")
      .eq("review_status", "pending_review")
      .limit(5);

    if (dharmVeers && dharmVeers.length > 0) {
      for (const dv of dharmVeers as any[]) {
        alerts.push({
          id: `dv-${dv.slug}`,
          title: `Dharm Veer Review: ${dv.name || dv.slug}`,
          desc: "Auto-sourced biography awaiting admin verification before live release.",
          type: "dharm_veer",
          severity: "medium",
          href: "/admin/dharm-veer-review",
          timestamp: dv.updated_at || new Date().toISOString(),
        });
      }
    }

    // Fallback if no active issues
    if (alerts.length === 0) {
      alerts.push({
        id: "system-ok",
        title: "All Systems Operational",
        desc: "No open calendar integrity issues, client crash spikes, pending reports, or unreviewed biographies.",
        type: "system",
        severity: "low",
        href: "/admin/monitoring",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
