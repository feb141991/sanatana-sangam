export const dynamic = "force-dynamic";

import { generateHealthReport } from "@/lib/monitoring/aggregation";
import type { MonitoringEvent } from "@/lib/monitoring/events";
import { createAdminClient } from "@/lib/supabase-admin";
import MonitoringClient from "./MonitoringClient";

interface Props {
  searchParams?: Promise<{ aiReportStatus?: string }>;
}

export default async function MonitoringPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const adminSupabase = createAdminClient();

  // 1. Measure DB Query Latency & Pool Responsiveness
  const t0 = Date.now();
  let dbLatencyMs = 0;
  let dbStatus: "healthy" | "degraded" | "error" = "healthy";
  try {
    const { error } = await adminSupabase.from("profiles").select("id", { count: "exact", head: true });
    dbLatencyMs = Date.now() - t0;
    if (error) dbStatus = "degraded";
  } catch {
    dbStatus = "error";
    dbLatencyMs = Date.now() - t0;
  }

  // 2. Fetch Recent Telemetry Events
  let recentEvents: MonitoringEvent[] = [];
  try {
    const { data } = await adminSupabase
      .from("monitoring_events")
      .select("timestamp, severity, domain, route, provider, model, fallback_used, latency_ms, error_code, error_message, request_id, trace_id, context")
      .order("timestamp", { ascending: false })
      .limit(300);
    recentEvents = (data ?? []) as MonitoringEvent[];
  } catch {
    recentEvents = [];
  }

  // 3. Fetch AI Content Reports with Full Metadata
  const aiReportStatus = resolvedSearchParams?.aiReportStatus ?? "pending";
  let aiReports: any[] = [];
  try {
    let query = adminSupabase
      .from("content_reports")
      .select("id, status, reason, metadata, reported_by, created_at, resolved_at, resolved_by, resolution_notes")
      .eq("content_type", "ai_chat_response")
      .order("created_at", { ascending: false })
      .limit(50);

    if (aiReportStatus !== "all") {
      query = query.eq("status", aiReportStatus);
    }

    const { data } = await query;
    aiReports = data ?? [];
  } catch {
    aiReports = [];
  }

  // 4. Fetch Mobile Sync Queue & Offline Japa Sessions
  let offlineSyncStats = { totalSynced: 0, recentSyncs: 0, status: "synchronized" };
  try {
    const { count } = await adminSupabase.from("mala_sessions").select("id", { count: "exact", head: true });
    offlineSyncStats.totalSynced = count || 0;
  } catch {
    // fallback
  }

  const report = generateHealthReport(recentEvents);

  return (
    <MonitoringClient
      report={report}
      recentEvents={recentEvents}
      aiReports={aiReports}
      dbMetrics={{ latencyMs: dbLatencyMs, status: dbStatus }}
      offlineSyncStats={offlineSyncStats}
    />
  );
}
