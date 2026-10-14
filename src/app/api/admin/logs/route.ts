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
    monitoring: { status: "available", health: "healthy", count: 0, criticalCount: 0, warningCount: 0 },
    client_errors: { status: "available", health: "healthy", count: 0, criticalCount: 0, warningCount: 0 },
    crons: { status: "available", health: "healthy", count: 0, criticalCount: 0, warningCount: 0 },
    notifications: { status: "available", health: "healthy", count: 0, criticalCount: 0, warningCount: 0 },
    golden_fixtures: { status: "available", health: "healthy", count: 0, criticalCount: 0, warningCount: 0 },
  };

  // Run all database queries concurrently so monitoring indicators are always fresh across all 5 streams
  const [clientErrorsRes, monitoringRes, notificationsRes, goldenFixturesRes] = await Promise.all([
    supabase
      .from("client_error_events")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", cursorTimestamp || endDate)
      .order("created_at", { ascending: false })
      .limit(fetchLimit),
    supabase
      .from("monitoring_events")
      .select("*")
      .gte("timestamp", startDate)
      .lte("timestamp", cursorTimestamp || endDate)
      .order("timestamp", { ascending: false })
      .limit(fetchLimit),
    supabase
      .from("notification_dispatch_events")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", cursorTimestamp || endDate)
      .order("created_at", { ascending: false })
      .limit(fetchLimit),
    supabase
      .from("golden_fixture_audit_logs")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", cursorTimestamp || endDate)
      .order("created_at", { ascending: false })
      .limit(fetchLimit),
  ]);

  // ── 1. Client Error Events ──
  {
    const { data, error } = clientErrorsRes;
    if (error) {
      if (error.code === "42P01") {
        sourcesStatus.client_errors = { status: "unavailable", health: "degraded", error: "Table client_error_events not present in schema", count: 0, criticalCount: 0, warningCount: 0 };
      } else {
        sourcesStatus.client_errors = { status: "failed", health: "degraded", error: error.message, count: 0, criticalCount: 0, warningCount: 0 };
        isAnySourceDegraded = true;
      }
    } else if (data && data.length > 0) {
      let critCount = 0;
      let warnCount = 0;
      const filteredRows: any[] = [];

      for (const row of data as any[]) {
        const isCrit = row.route === "/home" || /TypeError|SyntaxError|Unhandled/i.test(row.error_name);
        if (isCrit) critCount++;
        else warnCount++;

        if (filters.route && row.route !== filters.route) continue;
        if (filters.fingerprint && row.fingerprint !== filters.fingerprint) continue;
        if (filters.deploymentSha && row.client_release_sha !== filters.deploymentSha) continue;

        filteredRows.push({ row, isCrit });
      }

      sourcesStatus.client_errors.count = data.length;
      sourcesStatus.client_errors.criticalCount = critCount;
      sourcesStatus.client_errors.warningCount = warnCount;
      sourcesStatus.client_errors.status = "available";
      sourcesStatus.client_errors.health = critCount > 0 ? "critical" : warnCount > 0 ? "warning" : "healthy";

      if (filters.source === "all" || filters.source === "client_errors") {
        for (const { row, isCrit } of filteredRows) {
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
      }
    } else {
      sourcesStatus.client_errors.status = "empty";
      sourcesStatus.client_errors.health = "empty";
      sourcesStatus.client_errors.count = 0;
      sourcesStatus.client_errors.criticalCount = 0;
      sourcesStatus.client_errors.warningCount = 0;
    }
  }

  // ── 2. Monitoring Events (Supabase table + memory sink fallback) ──
  {
    const { data, error } = monitoringRes;
    let eventsList = (data as any[]) || [];

    if (error) {
      const memEvents = _eventSink.filter((e) => {
        if (cursorTimestamp && e.timestamp > cursorTimestamp) return false;
        if (e.timestamp < startDate || e.timestamp > endDate) return false;
        return true;
      });
      eventsList = memEvents;
      sourcesStatus.monitoring = {
        status: memEvents.length > 0 ? "available" : "empty",
        health: "healthy",
        count: memEvents.length,
        criticalCount: 0,
        warningCount: 0,
        error: error.code === "42P01" ? "Durable table not found (serving memory sink)" : error.message,
      };
    } else {
      sourcesStatus.monitoring.count = eventsList.length;
      if (eventsList.length === 0) {
        sourcesStatus.monitoring.status = "empty";
        sourcesStatus.monitoring.health = "empty";
      }
    }

    let monCrit = 0;
    let monWarn = 0;
    for (const ev of eventsList) {
      const sev = (ev.severity === "P0" || ev.severity === "P1") ? "critical" : ev.severity === "P2" ? "warning" : "info";
      if (sev === "critical") monCrit++;
      else if (sev === "warning") monWarn++;

      if (filters.source === "all" || filters.source === "monitoring") {
        if (filters.route && ev.route !== filters.route) continue;
        if (filters.requestId && ev.request_id !== filters.requestId) continue;
        if (filters.severity !== "all" && filters.severity !== sev) continue;

        let displayTitle = "";
        let displayMessage = "";

        const r = ev.route?.toLowerCase() || "";
        const serviceName = r.includes("analytics/reader")
          ? "Reader & Scripture Recitation Analytics"
          : r.includes("ai/chat")
          ? "Pramana AI Dharma Guru Chat"
          : r.includes("tts")
          ? "Sanskrit Shloka Audio Synthesis"
          : r.includes("calendar/day") || r.includes("panchang")
          ? "Panchang & Astronomical Muhurta"
          : r.includes("calendar/upcoming")
          ? "Upcoming Observances & Story Cards"
          : r.includes("calendar/month")
          ? "Monthly Calendar Matrix"
          : r.includes("vrat")
          ? "Vrat Observation & Fasting Stats"
          : r.includes("dharm-veer")
          ? "Dharm Veer Hero Roster"
          : r.includes("japa")
          ? "Japa Mala Sync & Ledger"
          : r.includes("sadhana")
          ? "Daily Sadhana Habits & Streak"
          : r.includes("mandali")
          ? "Mandali Community & Satsang Feed"
          : r.includes("notifications")
          ? "Push Notification Dispatcher"
          : r.includes("auth")
          ? "Authentication & Token Security"
          : ev.route
          ? `API Service: ${ev.route}`
          : `${ev.domain ? ev.domain.toUpperCase() : "Platform"} Telemetry Event`;

        if (ev.error_code && ev.error_code !== "200") {
          displayTitle = `[${(ev.domain || "API").toUpperCase()}] ${ev.error_code}: ${serviceName}`;
          displayMessage = ev.error_message || `Request to ${ev.route || "endpoint"} returned HTTP ${ev.error_code}`;
        } else {
          displayTitle = serviceName;
          if (ev.error_message) {
            displayMessage = ev.error_message;
          } else if (ev.latency_ms) {
            displayMessage = `Processed in ${ev.latency_ms}ms (HTTP ${ev.error_code || "200 OK"})`;
          } else if (ev.context && typeof ev.context === "object" && Object.keys(ev.context).length > 0) {
            const ctxStr = Object.entries(ev.context)
              .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
              .join(" • ");
            displayMessage = ctxStr || "Telemetry event captured";
          } else {
            displayMessage = `HTTP ${ev.error_code || "200 OK"} telemetry recorded for ${ev.route || ev.domain || "platform"}`;
          }
        }

        allEvents.push({
          id: `mon_${ev.id || Math.random().toString(36).slice(2)}`,
          timestamp: ev.timestamp,
          source: "monitoring",
          severity: sev,
          title: displayTitle,
          message: displayMessage,
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
            errorCode: ev.error_code,
            context: ev.context,
          }) as Record<string, unknown>,
        });
      }
    }

    sourcesStatus.monitoring.criticalCount = monCrit;
    sourcesStatus.monitoring.warningCount = monWarn;
    if (eventsList.length > 0) {
      sourcesStatus.monitoring.health = monCrit > 0 ? "critical" : monWarn > 0 ? "warning" : "healthy";
      sourcesStatus.monitoring.status = "available";
    }
  }

  // ── 3. Cron Telemetry Events ──
  {
    const cronEvents = _eventSink.filter((e) => {
      if (e.domain !== "cron") return false;
      if (cursorTimestamp && e.timestamp > cursorTimestamp) return false;
      if (e.timestamp < startDate || e.timestamp > endDate) return false;
      return true;
    });

    sourcesStatus.crons.count = cronEvents.length;
    let cronCrit = 0;
    let cronWarn = 0;

    for (const ce of cronEvents) {
      const sev = (ce.severity === "P0" || ce.severity === "P1") ? "critical" : ce.severity === "P2" ? "warning" : "info";
      if (sev === "critical") cronCrit++;
      else if (sev === "warning") cronWarn++;

      if (filters.source === "all" || filters.source === "crons") {
        if (filters.cronJob && !ce.route?.includes(filters.cronJob)) continue;
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
    }

    sourcesStatus.crons.criticalCount = cronCrit;
    sourcesStatus.crons.warningCount = cronWarn;
    if (cronEvents.length === 0) {
      sourcesStatus.crons.status = "empty";
      sourcesStatus.crons.health = "empty";
    } else {
      sourcesStatus.crons.status = "available";
      sourcesStatus.crons.health = cronCrit > 0 ? "critical" : cronWarn > 0 ? "warning" : "healthy";
    }
  }

  // ── 4. Notification Dispatch Events ──
  {
    const { data, error } = notificationsRes;
    if (error) {
      if (error.code === "42P01") {
        sourcesStatus.notifications = { status: "unavailable", health: "degraded", error: "Table notification_dispatch_events not present in schema", count: 0, criticalCount: 0, warningCount: 0 };
      } else {
        sourcesStatus.notifications = { status: "failed", health: "degraded", error: error.message, count: 0, criticalCount: 0, warningCount: 0 };
        isAnySourceDegraded = true;
      }
    } else if (data && data.length > 0) {
      sourcesStatus.notifications.count = data.length;
      let notifCrit = 0;
      let notifWarn = 0;

      for (const row of data as any[]) {
        const sev: "critical" | "warning" | "info" =
          row.decision === "failed" ? "critical" : row.decision === "skipped" ? "warning" : "info";
        if (sev === "critical") notifCrit++;
        else if (sev === "warning") notifWarn++;

        if (filters.source === "all" || filters.source === "notifications") {
          if (filters.userId && row.user_id !== filters.userId) continue;
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
      }

      sourcesStatus.notifications.criticalCount = notifCrit;
      sourcesStatus.notifications.warningCount = notifWarn;
      sourcesStatus.notifications.status = "available";
      sourcesStatus.notifications.health = notifCrit > 0 ? "critical" : notifWarn > 0 ? "warning" : "healthy";
    } else {
      sourcesStatus.notifications.status = "empty";
      sourcesStatus.notifications.health = "empty";
      sourcesStatus.notifications.count = 0;
      sourcesStatus.notifications.criticalCount = 0;
      sourcesStatus.notifications.warningCount = 0;
    }
  }

  // ── 5. Golden Fixture Audit Logs ──
  {
    const { data, error } = goldenFixturesRes;
    if (error) {
      if (error.code === "42P01") {
        sourcesStatus.golden_fixtures = { status: "unavailable", health: "degraded", error: "Table golden_fixture_audit_logs not present in schema", count: 0, criticalCount: 0, warningCount: 0 };
      } else {
        sourcesStatus.golden_fixtures = { status: "failed", health: "degraded", error: error.message, count: 0, criticalCount: 0, warningCount: 0 };
      }
    } else if (data && data.length > 0) {
      sourcesStatus.golden_fixtures.count = data.length;
      let fixWarn = 0;

      for (const row of data as any[]) {
        const sev: "critical" | "warning" | "info" =
          row.action === "rejected" || row.action === "withheld" ? "warning" : "info";
        if (sev === "warning") fixWarn++;

        if (filters.source === "all" || filters.source === "golden_fixtures") {
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
      }

      sourcesStatus.golden_fixtures.warningCount = fixWarn;
      sourcesStatus.golden_fixtures.criticalCount = 0;
      sourcesStatus.golden_fixtures.status = "available";
      sourcesStatus.golden_fixtures.health = fixWarn > 0 ? "warning" : "healthy";
    } else {
      sourcesStatus.golden_fixtures.status = "empty";
      sourcesStatus.golden_fixtures.health = "empty";
      sourcesStatus.golden_fixtures.count = 0;
      sourcesStatus.golden_fixtures.criticalCount = 0;
      sourcesStatus.golden_fixtures.warningCount = 0;
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
