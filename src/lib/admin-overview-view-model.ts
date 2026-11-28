import type { UrgentAlertItem } from "@/app/api/admin/alerts/route";

/**
 * Pure view-model rules for the admin overview (components/admin/AdminOverviewView.tsx).
 *
 * The overview separates two questions that used to be mixed: "is the platform healthy?" (system
 * alerts) and "what is waiting for a person?" (review queues). The queue totals come from the stats
 * API, which counts everything; the alerts feed only carries the newest few queue items, so listing
 * those as alerts as well showed the same work twice with different numbers.
 */

/** The figures the overview shows from /api/admin/stats. (The API also returns `activeNow`, which counts
 *  seekers on a Shloka streak, and `globalReach`, which counts Mandalis: neither is what its name says,
 *  so neither is shown.) */
export interface OverviewStats {
  totalSeekers: number;
  onboardedSeekers: number;
  pendingReports: number;
  pendingDharmVeerReview: number;
  activeStreakSeekers?: number;
  mandalisCount?: number;
  traditionBreakdown?: Array<{ label: string; val: string }>;
}

export interface SupportTicketSummary {
  open: number;
  urgent: number;
  waitingOnSeeker: number;
  resolved: number;
  recentOpen: Array<{
    id: string;
    ticket_number: string;
    subject: string;
    priority: string;
    status: string;
    seeker_name?: string | null;
    created_at: string;
  }>;
}

export interface OperationsPulse {
  notificationQueue: {
    pending: number;
    claimed: number;
    sent: number;
    failed: number;
  } | null;
  crons: {
    total: number;
    healthy: number;
    failing: number;
    stale: number;
  } | null;
}

export interface OperatorActivityItem {
  id: string;
  festival_id: string;
  display_name: string;
  emoji: string;
  year: number;
  action: string;
  author_id?: string;
  created_at: string;
  details?: Record<string, unknown>;
}

const SYSTEM_ALERT_TYPES: ReadonlyArray<UrgentAlertItem["type"]> = ["system", "client_error", "monitoring"];

/** Diagnostic alerts ("this data source failed") are system alerts whatever feature they concern. */
function isDiagnosticAlert(alert: UrgentAlertItem): boolean {
  return alert.id.startsWith("system-");
}

export interface SplitOverviewAlerts {
  /** Platform and infrastructure alerts, the only ones that feed the System status and the alert list. */
  systemAlerts: UrgentAlertItem[];
  /** Open calendar integrity findings carried by the alerts feed (diagnostics are not findings). */
  calendarFindingsCount: number;
}

export function splitOverviewAlerts(alerts: ReadonlyArray<UrgentAlertItem>): SplitOverviewAlerts {
  const systemAlerts: UrgentAlertItem[] = [];
  let calendarFindingsCount = 0;

  for (const alert of alerts) {
    if (alert.id === "system-ok") continue;
    if (isDiagnosticAlert(alert) || SYSTEM_ALERT_TYPES.includes(alert.type)) {
      systemAlerts.push(alert);
    } else if (alert.type === "integrity") {
      calendarFindingsCount += 1;
    }
    // "report" and "dharm_veer" alerts are the newest items of queues whose totals the stats API
    // reports; they are not repeated here.
  }

  return { systemAlerts, calendarFindingsCount };
}

export type ReviewQueueId = "reports" | "calendar" | "dharm-veer";
export type ReviewQueueTone = "danger" | "warn" | "neutral";

export interface ReviewQueueRow {
  id: ReviewQueueId;
  label: string;
  /** Null when the count could not be loaded: shown as unknown, never as zero. */
  count: number | null;
  href: string;
  tone: ReviewQueueTone;
}

/** Every count may be unknown: a failed read is not an empty queue. */
export interface ReviewQueueCounts {
  pendingReports: number | null;
  calendarFindings: number | null;
  pendingDharmVeerReview: number | null;
}

const QUEUE_ORDER: ReadonlyArray<ReviewQueueId> = ["reports", "calendar", "dharm-veer"];

/** The three review queues, those with work first (unknown counts next, empty ones last). */
export function buildReviewQueues(counts: ReviewQueueCounts): ReviewQueueRow[] {
  const rows: ReviewQueueRow[] = [
    {
      id: "reports",
      label: "Reported content",
      count: counts.pendingReports,
      href: "/admin/moderation",
      tone: (counts.pendingReports ?? 0) > 0 ? "danger" : "neutral",
    },
    {
      id: "calendar",
      label: "Calendar integrity findings",
      count: counts.calendarFindings,
      href: "/admin/calendar-governance?tab=integrity",
      tone: (counts.calendarFindings ?? 0) > 0 ? "warn" : "neutral",
    },
    {
      id: "dharm-veer",
      label: "Dharm Veer reviews",
      count: counts.pendingDharmVeerReview,
      href: "/admin/dharm-veer-review",
      tone: (counts.pendingDharmVeerReview ?? 0) > 0 ? "warn" : "neutral",
    },
  ];

  const rank = (row: ReviewQueueRow) => (row.count === null ? 1 : row.count > 0 ? 0 : 2);
  return rows.sort(
    (a, b) => rank(a) - rank(b) || QUEUE_ORDER.indexOf(a.id) - QUEUE_ORDER.indexOf(b.id),
  );
}

/** Items waiting across the queues whose counts are known, or null when no queue count is known. */
export function totalOpenReviews(rows: ReadonlyArray<ReviewQueueRow>): number | null {
  const known = rows.filter((row) => row.count !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, row) => sum + (row.count ?? 0), 0);
}

/** True only when every queue has a real count: the only time "all clear" may be said. */
export function allQueueCountsKnown(rows: ReadonlyArray<ReviewQueueRow>): boolean {
  return rows.length > 0 && rows.every((row) => row.count !== null);
}

/** "62%" of seekers finished onboarding, or null when there are no seekers to divide by. */
export function formatOnboardingRate(onboarded: number, total: number): string | null {
  if (!Number.isFinite(onboarded) || !Number.isFinite(total) || total <= 0) return null;
  const pct = Math.round((Math.max(0, onboarded) / total) * 100);
  return `${Math.min(100, pct)}%`;
}

/** "Updated 09:05" in the reader's local time, or null before the first successful load. */
export function formatUpdatedLabel(updatedAt: Date | null): string | null {
  if (!updatedAt || Number.isNaN(updatedAt.getTime())) return null;
  const hh = String(updatedAt.getHours()).padStart(2, "0");
  const mm = String(updatedAt.getMinutes()).padStart(2, "0");
  return `Updated ${hh}:${mm}`;
}
