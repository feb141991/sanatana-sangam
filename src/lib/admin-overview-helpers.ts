import type { UrgentAlertItem } from "@/app/api/admin/alerts/route";
import type {
  AdminInspectableRecord,
  CalendarFindingRecord,
  ContentReportRecord,
  ClientErrorRecord,
  DharmVeerRecord,
} from "@/lib/admin-inspector-types";

export interface SystemStatusSummary {
  status: "healthy" | "degraded" | "critical" | "warning";
  label: string;
  description: string;
  criticalCount: number;
  warningCount: number;
  totalAlerts: number;
}

/**
 * Calculates overall system status.
 * NEVER returns "healthy" if degraded is true or if there are high/medium alerts.
 */
export function getOverviewSystemStatus(
  alerts: UrgentAlertItem[],
  degraded: boolean
): SystemStatusSummary {
  const actionableAlerts = alerts.filter((a) => a.type !== "system" || a.id !== "system-ok");
  const criticalCount = actionableAlerts.filter((a) => a.severity === "high").length;
  const warningCount = actionableAlerts.filter((a) => a.severity === "medium").length;
  const totalAlerts = actionableAlerts.length;

  if (degraded) {
    return {
      status: "degraded",
      label: "Monitoring Degraded",
      description: "One or more telemetry, database, or error aggregators encountered failures.",
      criticalCount,
      warningCount,
      totalAlerts,
    };
  }

  if (criticalCount > 0) {
    return {
      status: "critical",
      label: `${criticalCount} Critical Issue${criticalCount > 1 ? "s" : ""}`,
      description: "Immediate operational intervention required on production services.",
      criticalCount,
      warningCount,
      totalAlerts,
    };
  }

  if (warningCount > 0) {
    return {
      status: "warning",
      label: `${warningCount} Warning${warningCount > 1 ? "s" : ""}`,
      description: "Pending items require administrator attention or verification.",
      criticalCount,
      warningCount,
      totalAlerts,
    };
  }

  return {
    status: "healthy",
    label: "All Systems Operational",
    description: "No open calendar integrity findings, client error spikes, or pending reports.",
    criticalCount: 0,
    warningCount: 0,
    totalAlerts: 0,
  };
}

/**
 * Sorts alerts by severity (high > medium > low), then by freshness (newest timestamp first).
 */
export function sortAlertsByUrgency(alerts: UrgentAlertItem[]): UrgentAlertItem[] {
  const severityWeight: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...alerts].sort((a, b) => {
    // 1. Severity weight
    const weightDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    if (weightDiff !== 0) return weightDiff;

    // 2. Timestamp freshness
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Maps an UrgentAlertItem from /api/admin/alerts into an AdminInspectableRecord for the inspector.
 */
export function alertToInspectableRecord(alert: UrgentAlertItem): AdminInspectableRecord | null {
  if (!alert || alert.id === "system-ok") return null;

  switch (alert.type) {
    case "integrity": {
      const meta = alert.metadata || {};
      const record: CalendarFindingRecord = {
        type: "calendar_finding",
        id: String(meta.findingId || alert.id),
        slug: String(meta.slug || alert.id),
        year: typeof meta.year === "number" ? meta.year : new Date().getFullYear(),
        severity: alert.severity === "high" ? "critical" : "warning",
        status: meta.isOpen === false ? "resolved" : "open",
        title: alert.title,
        summary: alert.desc,
        discrepancy: {
          expectedDate: meta.storedDate ? String(meta.storedDate) : null,
          calculatedDate: meta.engineDate ? String(meta.engineDate) : null,
          ruleReasoning: meta.reason ? String(meta.reason) : undefined,
        },
        firstSeen: meta.detectedAt ? String(meta.detectedAt) : undefined,
        lastChecked: meta.lastSeenAt ? String(meta.lastSeenAt) : undefined,
      };
      return record;
    }

    case "report": {
      const meta = alert.metadata || {};
      const record: ContentReportRecord = {
        type: "content_report",
        id: String(meta.reportId || alert.id),
        contentType: String(meta.contentType || "content"),
        contentId: String(meta.reportId || alert.id),
        reason: String(meta.reason || alert.desc),
        status: "pending",
        reportedBy: meta.reporterId ? String(meta.reporterId) : null,
        createdAt: meta.createdAt ? String(meta.createdAt) : alert.timestamp,
        metadata: (meta.details || meta) as Record<string, unknown>,
      };
      return record;
    }

    case "client_error": {
      const meta = alert.metadata || {};
      const record: ClientErrorRecord = {
        type: "client_error",
        fingerprint: String(meta.fingerprint || alert.id),
        errorName: String(meta.errorName || alert.title),
        errorMessage: String(meta.errorMessage || alert.desc),
        route: String(meta.route || "/unknown"),
        source: String(meta.source || "client"),
        firstSeen: String(meta.firstSeen || alert.timestamp),
        lastSeen: String(meta.lastSeen || alert.timestamp),
        count1h: Number(meta.count1h || 1),
        count24h: Number(meta.count24h || 1),
        totalCount: Number(meta.count24h || 1),
        distinctSessionsCount: Number(meta.distinctSessionsCount || 1),
        browserFamily: "Web Client",
        osFamily: "Unknown",
        latestClientSha: meta.latestClientSha ? String(meta.latestClientSha) : undefined,
        latestServerSha: meta.latestServerSha ? String(meta.latestServerSha) : undefined,
        sampleStack: meta.sampleStack ? String(meta.sampleStack) : null,
        sampleComponentStack: meta.sampleComponentStack ? String(meta.sampleComponentStack) : null,
        isStaleClientHeavy: Boolean(meta.staleClientCount && meta.staleClientCount > 0),
      };
      return record;
    }

    case "dharm_veer": {
      const meta = alert.metadata || {};
      const record: DharmVeerRecord = {
        type: "dharm_veer",
        slug: String(meta.slug || alert.id),
        name: String(meta.name || alert.title.replace(/^Dharm Veer Review:\s*/, "")),
        tradition: String(meta.tradition || "Sanatan"),
        era: meta.era ? String(meta.era) : null,
        tagline: alert.desc,
        journey: "Auto-sourced biography pending administrator review and canonical verification.",
        trial: "Verification of public-domain sources and narrative accuracy.",
        teaching: "Pending review.",
        moral: "Pending review.",
        createdAt: String(meta.updatedAt || alert.timestamp),
      };
      return record;
    }

    default:
      return null;
  }
}
