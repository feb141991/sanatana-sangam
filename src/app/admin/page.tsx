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
import {
  splitOverviewAlerts,
  type OperatorActivityItem,
  type OverviewStats,
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
  const [activityLogs, setActivityLogs] = useState<OperatorActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityFailed, setActivityFailed] = useState(false);

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

  useEffect(() => {
    fetchOverviewData();
    fetchActivityLogs();
  }, [fetchOverviewData, fetchActivityLogs]);

  const handleRefresh = () => {
    fetchOverviewData();
    fetchActivityLogs();
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
        updatedAt={updatedAt}
        activity={activityLogs}
        activityLoading={activityLoading}
        activityFailed={activityFailed}
        isFlushing={isFlushing}
        flushMessage={flushMessage}
        copiedAlertId={copiedAlertId}
        onRefresh={handleRefresh}
        onFlushCache={handleFlushCache}
        onInspectAlert={handleInspectAlert}
        onCopyAlert={copyAlertText}
      />

      <AdminRecordInspector
        record={selectedRecord}
        isOpen={isInspectorOpen}
        onClose={() => {
          setIsInspectorOpen(false);
          setSelectedRecord(null);
        }}
        onActionComplete={() => {
          fetchOverviewData();
          fetchActivityLogs();
        }}
      />
    </>
  );
}
