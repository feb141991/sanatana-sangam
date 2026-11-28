"use client";

import { useCallback, useEffect, useState } from "react";
import type { UrgentAlertItem } from "@/app/api/admin/alerts/route";
import { AdminOverviewView } from "@/components/admin/AdminOverviewView";
import { AdminRecordInspector } from "@/components/admin/AdminRecordInspector";
import type { AdminInspectableRecord } from "@/lib/admin-inspector-types";
import {
  alertToInspectableRecord,
  getOverviewSystemStatus,
  sortAlertsByUrgency,
} from "@/lib/admin-overview-helpers";
import type { SeekerTrend } from "@/lib/admin-seeker-trend";
import {
  splitOverviewAlerts,
  type OperationsPulse,
  type OperatorActivityItem,
  type OverviewStats,
  type SupportTicketSummary,
} from "@/lib/admin-overview-view-model";

/**
 * Admin overview: loads the figures and hands them to AdminOverviewView, which owns the layout.
 * A refresh that fails keeps what was already loaded (a failed read is not "nothing is pending"),
 * and stats that never loaded stay unknown instead of showing zeros.
 */
export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [alerts, setAlerts] = useState<UrgentAlertItem[]>([]);
  // False until the alerts feed has answered once: the calendar count comes from it, so before
  // that it is unknown, not zero.
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const [isDegraded, setIsDegraded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  // New seekers per month. A failed refresh keeps the last good trend; one that never loaded stays unknown.
  const [trend, setTrend] = useState<SeekerTrend | null>(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendFailed, setTrendFailed] = useState(false);
  const [activityLogs, setActivityLogs] = useState<OperatorActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityFailed, setActivityFailed] = useState(false);

  // Priority Operational Signals: Support Tickets & Cron/Notification Delivery Pulse
  const [ticketSummary, setTicketSummary] = useState<SupportTicketSummary | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsFailed, setTicketsFailed] = useState(false);

  const [opsPulse, setOpsPulse] = useState<OperationsPulse | null>(null);
  const [opsLoading, setOpsLoading] = useState(true);
  const [opsFailed, setOpsFailed] = useState(false);

  // Platform edge cache flush
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState<string | null>(null);

  // Record inspector
  const [selectedRecord, setSelectedRecord] = useState<AdminInspectableRecord | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);

  const fetchOverviewData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch("/api/admin/stats").catch(() => null),
        fetch("/api/admin/alerts").catch(() => null),
      ]);
      let loadedSomething = false;

      if (statsRes && statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          totalSeekers: Number(data.totalSeekers) || 0,
          onboardedSeekers: Number(data.onboardedSeekers) || 0,
          pendingReports: Number(data.pendingReports) || 0,
          pendingDharmVeerReview: Number(data.pendingDharmVeerReview) || 0,
          activeStreakSeekers: Number(data.activeNow) || 0,
          mandalisCount: Number(data.globalReach) || 0,
          traditionBreakdown: Array.isArray(data.intelligence?.traditionBreakdown)
            ? data.intelligence.traditionBreakdown
            : undefined,
        });
        loadedSomething = true;
      }

      if (alertsRes && alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        setAlertsLoaded(true);
        setIsDegraded(Boolean(data.degraded));
        loadedSomething = true;
      } else {
        setIsDegraded(true);
      }

      if (loadedSomething) setUpdatedAt(new Date());
    } catch (err) {
      console.error("[AdminOverview] Failed to fetch telemetry data:", err);
      setIsDegraded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await fetch("/api/admin/seeker-trend");
      if (!res.ok) {
        setTrendFailed(true);
        return;
      }
      const data = (await res.json()) as Partial<SeekerTrend> | null;
      if (data && Array.isArray(data.months) && data.months.length > 0) {
        setTrend(data as SeekerTrend);
        setTrendFailed(false);
      } else {
        setTrendFailed(true);
      }
    } catch (err) {
      console.error("[AdminOverview] Failed to fetch seeker trend:", err);
      setTrendFailed(true);
    } finally {
      setTrendLoading(false);
    }
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetch("/api/admin/calendar-governance/activity");
      if (!res.ok) {
        setActivityFailed(true);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setActivityLogs(data.slice(0, 6));
        setActivityFailed(false);
      } else {
        setActivityFailed(true);
      }
    } catch (err) {
      console.error("[AdminOverview] Failed to fetch activity logs:", err);
      setActivityFailed(true);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/admin/tickets?status=open&limit=4");
      if (!res.ok) {
        setTicketsFailed(true);
        return;
      }
      const data = await res.json();
      if (data && data.stats) {
        setTicketSummary({
          open: Number(data.stats.open) || 0,
          urgent: Number(data.stats.urgent) || 0,
          waitingOnSeeker: Number(data.stats.waitingOnSeeker) || 0,
          resolved: Number(data.stats.resolved) || 0,
          recentOpen: Array.isArray(data.tickets) ? data.tickets.slice(0, 4) : [],
        });
        setTicketsFailed(false);
      } else {
        setTicketsFailed(true);
      }
    } catch (err) {
      console.error("[AdminOverview] Failed to fetch tickets:", err);
      setTicketsFailed(true);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const fetchOpsPulse = useCallback(async () => {
    setOpsLoading(true);
    try {
      const res = await fetch("/api/admin/crons");
      if (!res.ok) {
        setOpsFailed(true);
        return;
      }
      const data = await res.json();
      const cronsArr = Array.isArray(data?.crons) ? data.crons : null;
      const cronStats = cronsArr
        ? {
            total: cronsArr.length,
            healthy: cronsArr.filter((c: { status?: string }) => c.status === "healthy" || c.status === "ok").length,
            failing: cronsArr.filter((c: { status?: string }) => c.status === "failing" || c.status === "error").length,
            stale: cronsArr.filter((c: { status?: string }) => c.status === "stale" || c.status === "overdue").length,
          }
        : null;
      const q = data?.queue;
      const queueStats = q
        ? {
            pending: Number(q.pending) || 0,
            claimed: Number(q.claimed) || 0,
            sent: Number(q.sent) || 0,
            failed: Number(q.failed) || 0,
          }
        : null;
      setOpsPulse({ crons: cronStats, notificationQueue: queueStats });
      setOpsFailed(false);
    } catch (err) {
      console.error("[AdminOverview] Failed to fetch ops pulse:", err);
      setOpsFailed(true);
    } finally {
      setOpsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
    fetchTrend();
    fetchActivityLogs();
    fetchTickets();
    fetchOpsPulse();
  }, [fetchOverviewData, fetchTrend, fetchActivityLogs, fetchTickets, fetchOpsPulse]);

  const handleRefresh = () => {
    fetchOverviewData();
    fetchTrend();
    fetchActivityLogs();
    fetchTickets();
    fetchOpsPulse();
  };

  const handleFlushCache = async () => {
    setIsFlushing(true);
    setFlushMessage(null);
    try {
      const res = await fetch("/api/admin/flush-cache", { method: "POST" });
      const data = await res.json();
      setFlushMessage(
        res.ok
          ? data.message || "Edge & page caches flushed successfully."
          : "Failed: " + (data.error || "Unknown error"),
      );
    } catch (e: unknown) {
      setFlushMessage("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsFlushing(false);
      setTimeout(() => setFlushMessage(null), 5000);
    }
  };

  const handleInspectAlert = (item: UrgentAlertItem) => {
    const record = alertToInspectableRecord(item);
    if (record) {
      setSelectedRecord(record);
      setIsInspectorOpen(true);
    }
  };

  const copyAlertText = (item: UrgentAlertItem) => {
    const text = `[${item.severity.toUpperCase()}] ${item.title}\n${item.desc}\nTimestamp: ${item.timestamp}`;
    navigator.clipboard.writeText(text);
    setCopiedAlertId(item.id);
    setTimeout(() => setCopiedAlertId(null), 2000);
  };

  const { systemAlerts, calendarFindingsCount } = splitOverviewAlerts(alerts);
  const sortedAlerts = sortAlertsByUrgency(systemAlerts);
  const systemStatus = getOverviewSystemStatus(sortedAlerts, isDegraded);

  return (
    <>
      <AdminOverviewView
        isLoading={isLoading}
        isDegraded={isDegraded}
        stats={stats}
        systemAlerts={sortedAlerts}
        systemStatus={systemStatus}
        calendarFindingsCount={alertsLoaded ? calendarFindingsCount : null}
        alertsFailed={!alertsLoaded && !isLoading}
        trend={trend}
        trendLoading={trendLoading && !trend}
        trendFailed={trendFailed && !trend}
        updatedAt={updatedAt}
        activity={activityLogs}
        activityLoading={activityLoading}
        activityFailed={activityFailed}
        ticketSummary={ticketSummary}
        ticketsLoading={ticketsLoading && !ticketSummary}
        ticketsFailed={ticketsFailed && !ticketSummary}
        opsPulse={opsPulse}
        opsLoading={opsLoading && !opsPulse}
        opsFailed={opsFailed && !opsPulse}
        isFlushing={isFlushing}
        flushMessage={flushMessage}
        copiedAlertId={copiedAlertId}
        onRefresh={handleRefresh}
        onFlushCache={handleFlushCache}
        onInspectAlert={handleInspectAlert}
        onCopyAlert={copyAlertText}
      />

      {/* The inspector is the same component the older pages show; the scope makes it dark here too. */}
      <div className="admin-pages contents">
      <AdminRecordInspector
        record={selectedRecord}
        isOpen={isInspectorOpen}
        onClose={() => {
          setIsInspectorOpen(false);
          setSelectedRecord(null);
        }}
        onActionComplete={() => {
          fetchOverviewData();
          fetchTrend();
          fetchActivityLogs();
          fetchTickets();
          fetchOpsPulse();
        }}
      />
      </div>
    </>
  );
}
