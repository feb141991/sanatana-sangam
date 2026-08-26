import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export interface UrgentAlertItem {
  id: string;
  title: string;
  desc: string;
  type: "integrity" | "report" | "dharm_veer" | "system";
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

    // 1. Calendar integrity findings -- Only trigger for genuine critical mismatches or active current year issues
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

    // 2. Pending Content Reports
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

    // 3. Pending Dharm Veer Reviews
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
        desc: "No open calendar integrity issues, pending reports, or unreviewed biographies.",
        type: "system",
        severity: "low",
        href: "/admin/calendar-governance",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
