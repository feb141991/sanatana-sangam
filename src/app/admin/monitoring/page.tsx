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

  let recentEvents: MonitoringEvent[] = [];
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from("monitoring_events")
      .select("timestamp, severity, domain, route, provider, model, fallback_used, latency_ms, error_code, error_message, request_id, trace_id, context")
      .order("timestamp", { ascending: false })
      .limit(300);
    recentEvents = (data ?? []) as MonitoringEvent[];
  } catch {
    recentEvents = [];
  }

  const aiReportStatus = resolvedSearchParams?.aiReportStatus ?? "pending";

  let aiReports: any[] = [];
  try {
    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from("content_reports")
      .select("id, status, reason, metadata, reported_by, created_at")
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

  const report = generateHealthReport(recentEvents);

  return (
    <MonitoringClient
      report={report}
      recentEvents={recentEvents}
      aiReports={aiReports}
    />
  );
}
