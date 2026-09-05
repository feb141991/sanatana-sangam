import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  parseLogFiltersFromSearchParams,
  redactSensitiveLogData,
} from "@/lib/admin-log-explorer-helpers";
import type {
  NormalizedLogEvent,
  LogExplorerApiResponse,
  LogEventSource,
  LogSourceStatus,
} from "@/lib/admin-log-explorer-types";
import { _eventSink, type MonitoringEvent } from "@/lib/monitoring/events";
import { CRON_CATALOGUE } from "@/lib/monitoring/cron-telemetry";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const filters = parseLogFiltersFromSearchParams(request.nextUrl.searchParams);
  const supabase = createAdminClient();

  const now = new Date();
  const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const startDate = filters.startDate || defaultStart;
  const endDate = filters.endDate || now.toISOString();
  const limit = filters.limit || 25;
  const fetchLimit = limit + 1;

  // Composite Keyset Cursor resolution (timestamp__id or timestamp)
  let cursorTimestamp: string | null = null;
  let cursorId: string | null = null;
  if (filters.cursor) {
    if (filters.cursor.includes("__")) {
      const [ts, ...idParts] = filters.cursor.split("__");
      cursorTimestamp = ts;
      cursorId = idParts.join("__");
    } else {
      cursorTimestamp = filters.cursor;
    }
  }

  const allEvents: NormalizedLogEvent[] = [];
  let isAnySourceDegraded = false;

  const sourcesStatus: Record<LogEventSource, LogSourceStatus> = {
    monitoring: { status: "available", count: 0 },
    client_errors: { status: "available", count: 0 },
    crons: { status: "available", count: 0 },
    notifications: { status: "available", count: 0 },
    golden_fixtures: { status: "available", count: 0 },
  };

  // ── 1. Client Error Events ──
  if (filters.source === "all" || filters.source === "client_errors") {
    try {
      let query = supabase
        .from("client_error_events")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", cursorTimestamp || endDate)
        .order("created_at", { ascending: false })
        .limit(fetchLimit);

      if (filters.route) query = query.eq("route", filters.route);
      if (filters.fingerprint) query = query.eq("fingerprint", filters.fingerprint);
      if (filters.deploymentSha) query = query.eq("client_release_sha", filters.deploymentSha);

      const { data, error } = await query;

      if (error) {
        if (error.code === "42P01") {
          sourcesStatus.client_errors = { status: "unavailable", error: "Table client_error_events not present in schema", count: 0 };
        } else {
          sourcesStatus.client_errors = { status: "failed", error: error.message, count: 0 };
          isAnySourceDegraded = true;
        }
      } else if (data && data.length > 0) {
        sourcesStatus.client_errors.count = data.length;
        for (const row of data as any[]) {
          const isCrit = row.route === "/home" || /TypeError|SyntaxError|Unhandled/i.test(row.error_name);
          const severity = isCrit ? "critical" : "warning";

          if (filters.severity !== "all" && filters.severity !== severity) continue;

          allEvents.push({
            id: `client_err_${row.id || row.incident_id || Math.random().toString(36).slice(2)}`,
            timestamp: row.created_at,
            source: "client_errors",
            severity,
            title: `Client Crash: ${row.error_name} on ${row.route}`,
            message: row.error_message || "Client application error occurred",
            route: row.route,
            correlation: {
              fingerprint: row.fingerprint,
              deploymentSha: row.client_release_sha,
              sessionHash: row.anonymous_session_hash,
              incidentId: row.incident_id,
            },
            metadata: redactSensitiveLogData({
              browserFamily: row.browser_family,
              osFamily: row.os_family,
              serverSha: row.server_release_sha,
              stack: row.stack,
              componentStack: row.component_stack,
            }) as Record<string, unknown>,
          });
        }
      } else {
        sourcesStatus.client_errors.status = "empty";
      }
    } catch (err: any) {
      sourcesStatus.client_errors = { status: "failed", error: err?.message || String(err), count: 0 };
      isAnySourceDegraded = true;
    }
  }

  // ── 2. Monitoring Events (Supabase table + memory sink fallback) ──
  if (filters.source === "all" || filters.source === "monitoring") {
    try {
      let query = supabase
        .from("monitoring_events")
        .select("*")
        .gte("timestamp", startDate)
        .lte("timestamp", cursorTimestamp || endDate)
        .order("timestamp", { ascending: false })
        .limit(fetchLimit);

      if (filters.route) query = query.eq("route", filters.route);
      if (filters.requestId) query = query.eq("request_id", filters.requestId);

      const { data, error } = await query;

      let eventsList = (data as any[]) || [];

      if (error) {
        // Fallback to in-memory _eventSink buffer
        const memEvents = _eventSink.filter((e) => {
          if (filters.route && e.route !== filters.route) return false;
          if (filters.requestId && e.request_id !== filters.requestId) return false;
          if (cursorTimestamp && e.timestamp > cursorTimestamp) return false;
          if (e.timestamp < startDate || e.timestamp > endDate) return false;
          return true;
        });
        eventsList = memEvents;
        sourcesStatus.monitoring = {
          status: memEvents.length > 0 ? "available" : "empty",
          count: memEvents.length,
          error: error.code === "42P01" ? "Durable table not found (serving memory sink)" : error.message,
        };
      } else {
        sourcesStatus.monitoring.count = eventsList.length;
        if (eventsList.length === 0) sourcesStatus.monitoring.status = "empty";
      }

      for (const ev of eventsList) {
        const sev = (ev.severity === "P0" || ev.severity === "P1") ? "critical" : ev.severity === "P2" ? "warning" : "info";
        if (filters.severity !== "all" && filters.severity !== sev) continue;

        allEvents.push({
          id: `mon_${ev.id || Math.random().toString(36).slice(2)}`,
          timestamp: ev.timestamp,
          source: "monitoring",
          severity: sev,
          title: `[${ev.domain || "app"}] ${ev.error_code || "Monitoring Event"}`,
          message: ev.error_message || "System event captured by monitoring layer",
          route: ev.route,
          correlation: {
            requestId: ev.request_id,
            traceId: ev.trace_id,
          },
          metadata: redactSensitiveLogData({
            domain: ev.domain,
            provider: ev.provider,
            model: ev.model,
            latencyMs: ev.latency_ms,
            context: ev.context,
          }) as Record<string, unknown>,
        });
      }
    } catch (err: any) {
      sourcesStatus.monitoring = { status: "failed", error: err?.message || String(err), count: 0 };
      isAnySourceDegraded = true;
    }
  }

  // ── 3. Cron Telemetry Events ──
  if (filters.source === "all" || filters.source === "crons") {
    try {
      const cronEvents = _eventSink.filter((e) => e.domain === "cron");
      sourcesStatus.crons.count = cronEvents.length;
      if (cronEvents.length === 0) {
        sourcesStatus.crons.status = "empty";
      }

      for (const ce of cronEvents) {
        if (filters.cronJob && !ce.route?.includes(filters.cronJob)) continue;
        if (cursorTimestamp && ce.timestamp > cursorTimestamp) continue;
        if (ce.timestamp < startDate || ce.timestamp > endDate) continue;

        const sev = (ce.severity === "P0" || ce.severity === "P1") ? "critical" : ce.severity === "P2" ? "warning" : "info";
        if (filters.severity !== "all" && filters.severity !== sev) continue;

        const cronDef = CRON_CATALOGUE.find((c) => c.route === ce.route);

        allEvents.push({
          id: `cron_${ce.request_id || ce.route || Math.random().toString(36).slice(2)}`,
          timestamp: ce.timestamp,
          source: "crons",
          severity: sev,
          title: `Cron Execution: ${cronDef?.name || ce.route || "Scheduled Job"}`,
          message: ce.error_message || "Background job execution heartbeat",
          route: ce.route,
          correlation: {
            cronJob: cronDef?.id || ce.route?.replace(/^\/api\/cron\//, ""),
            requestId: ce.request_id,
          },
          metadata: redactSensitiveLogData({
            schedule: cronDef?.scheduleHuman,
            category: cronDef?.category,
            latencyMs: ce.latency_ms,
            context: ce.context,
          }) as Record<string, unknown>,
        });
      }
    } catch (err: any) {
      sourcesStatus.crons = { status: "failed", error: err?.message || String(err), count: 0 };
    }
  }

  // ── 4. Notification Dispatch Events ──
  if (filters.source === "all" || filters.source === "notifications") {
    try {
      let query = supabase
        .from("notification_dispatch_events")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", cursorTimestamp || endDate)
        .order("created_at", { ascending: false })
        .limit(fetchLimit);

      if (filters.userId) query = query.eq("user_id", filters.userId);

      const { data, error } = await query;

      if (error) {
        if (error.code === "42P01") {
          sourcesStatus.notifications = { status: "unavailable", error: "Table notification_dispatch_events not present in schema", count: 0 };
        } else {
          sourcesStatus.notifications = { status: "failed", error: error.message, count: 0 };
          isAnySourceDegraded = true;
        }
      } else if (data && data.length > 0) {
        sourcesStatus.notifications.count = data.length;
        for (const row of data as any[]) {
          const sev: "critical" | "warning" | "info" =
            row.decision === "failed" ? "critical" : row.decision === "skipped" ? "warning" : "info";
          if (filters.severity !== "all" && filters.severity !== sev) continue;

          allEvents.push({
            id: `notif_${row.id || Math.random().toString(36).slice(2)}`,
            timestamp: row.created_at,
            source: "notifications",
            severity: sev,
            title: `Notification ${row.decision.toUpperCase()}: ${row.notification_type || "Push Dispatch"}`,
            message: row.reason || `Notification dispatch outcome: ${row.decision}`,
            correlation: {
              userId: row.user_id,
              notificationKey: row.notification_key,
            },
            metadata: redactSensitiveLogData({
              decision: row.decision,
              provider: row.provider,
              notificationKey: row.notification_key,
              type: row.notification_type,
            }) as Record<string, unknown>,
          });
        }
      } else {
        sourcesStatus.notifications.status = "empty";
      }
    } catch (err: any) {
      sourcesStatus.notifications = { status: "failed", error: err?.message || String(err), count: 0 };
    }
  }

  // ── 5. Golden Fixture Audit Logs ──
  if (filters.source === "all" || filters.source === "golden_fixtures") {
    try {
      let query = supabase
        .from("golden_fixture_audit_logs")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", cursorTimestamp || endDate)
        .order("created_at", { ascending: false })
        .limit(fetchLimit);

      const { data, error } = await query;

      if (error) {
        if (error.code === "42P01") {
          sourcesStatus.golden_fixtures = { status: "unavailable", error: "Table golden_fixture_audit_logs not present in schema", count: 0 };
        } else {
          sourcesStatus.golden_fixtures = { status: "failed", error: error.message, count: 0 };
        }
      } else if (data && data.length > 0) {
        sourcesStatus.golden_fixtures.count = data.length;
        for (const row of data as any[]) {
          const sev: "critical" | "warning" | "info" =
            row.action === "rejected" || row.action === "withheld" ? "warning" : "info";
          if (filters.severity !== "all" && filters.severity !== sev) continue;

          allEvents.push({
            id: `fixture_${row.id || Math.random().toString(36).slice(2)}`,
            timestamp: row.created_at,
            source: "golden_fixtures",
            severity: sev,
            title: `Calendar Audit: ${row.action.toUpperCase()} (${row.festival_id} ${row.year})`,
            message: `Operator action recorded on festival golden fixture definition.`,
            correlation: {
              festivalId: row.festival_id,
              userId: row.author_id,
            },
            metadata: redactSensitiveLogData({
              action: row.action,
              year: row.year,
              authorId: row.author_id,
              details: row.details,
            }) as Record<string, unknown>,
          });
        }
      } else {
        sourcesStatus.golden_fixtures.status = "empty";
      }
    } catch (err: any) {
      sourcesStatus.golden_fixtures = { status: "failed", error: err?.message || String(err), count: 0 };
    }
  }

  // ── Unified Keyset Filter, Deterministic Sort & Deduplication ──
  const candidateEvents = allEvents.filter((e) => {
    if (!cursorTimestamp) return true;
    if (e.timestamp < cursorTimestamp) return true;
    if (e.timestamp === cursorTimestamp) {
      if (cursorId) {
        return e.id.localeCompare(cursorId) < 0;
      }
      return false;
    }
    return false;
  });

  candidateEvents.sort((a, b) => {
    const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });

  const seenIds = new Set<string>();
  const uniqueEvents: NormalizedLogEvent[] = [];
  for (const ev of candidateEvents) {
    if (!seenIds.has(ev.id)) {
      seenIds.add(ev.id);
      uniqueEvents.push(ev);
    }
  }

  // Bounded pagination slicing
  const paginatedEvents = uniqueEvents.slice(0, limit);
  const hasMore = uniqueEvents.length > limit;
  const lastEvent = paginatedEvents[paginatedEvents.length - 1];
  const nextCursor = hasMore && lastEvent ? `${lastEvent.timestamp}__${lastEvent.id}` : null;

  const response: LogExplorerApiResponse = {
    events: paginatedEvents,
    sources: sourcesStatus,
    pagination: {
      hasMore,
      nextCursor,
      limit,
      totalReturned: paginatedEvents.length,
    },
    degraded: isAnySourceDegraded,
  };

  return NextResponse.json(response);
}
