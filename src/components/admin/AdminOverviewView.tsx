"use client";

import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, Copy, ExternalLink, RefreshCw } from "lucide-react";
import type { UrgentAlertItem } from "@/app/api/admin/alerts/route";
import type { SystemStatusSummary } from "@/lib/admin-overview-helpers";
import {
  allQueueCountsKnown,
  buildReviewQueues,
  formatOnboardingRate,
  formatUpdatedLabel,
  totalOpenReviews,
  type OperatorActivityItem,
  type OverviewStats,
  type ReviewQueueTone,
} from "@/lib/admin-overview-view-model";

/**
 * The admin overview as one flat column: a summary, what needs attention, a few links, and a
 * collapsed history. Solid colours and hairlines only: no tiles, no charts, no transparency.
 */
export interface AdminOverviewViewProps {
  isLoading: boolean;
  /** A telemetry source failed: figures may be incomplete. */
  isDegraded: boolean;
  /** Null when the stats could not be loaded. Never shown as zeros. */
  stats: OverviewStats | null;
  /** Platform alerts only, most urgent first (see splitOverviewAlerts). */
  systemAlerts: UrgentAlertItem[];
  systemStatus: SystemStatusSummary;
  /** Null until the alerts feed has loaded: an unknown count is never shown as zero. */
  calendarFindingsCount: number | null;
  /** The alerts feed never loaded, so "no alerts" would be a guess. */
  alertsFailed: boolean;
  updatedAt: Date | null;
  activity: OperatorActivityItem[];
  activityLoading: boolean;
  activityFailed: boolean;
  isFlushing: boolean;
  flushMessage: string | null;
  copiedAlertId: string | null;
  onRefresh: () => void;
  onFlushCache: () => void;
  onInspectAlert: (item: UrgentAlertItem) => void;
  onCopyAlert: (item: UrgentAlertItem) => void;
}

const QUICK_LINKS = [
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/crons", label: "Crons" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/broadcast", label: "Broadcast" },
] as const;

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700";
const ROW = "border-b border-[var(--border-medium)]";
const ROW_HOVER = "transition-colors hover:bg-black/[0.04]";
const ACTION_BUTTON = `min-h-9 rounded-md border border-[var(--border-strong)] bg-white px-3 text-xs font-bold text-stone-900 transition-colors hover:bg-black/[0.05] ${FOCUS_RING}`;

function severityStyle(severity: UrgentAlertItem["severity"]) {
  if (severity === "critical" || severity === "P0" || severity === "P1") {
    return { dot: "bg-rose-600", text: "text-rose-800", label: severity === "critical" ? "Critical" : severity };
  }
  if (severity === "high") return { dot: "bg-rose-500", text: "text-rose-800", label: "High" };
  if (severity === "medium" || severity === "P2") {
    return { dot: "bg-amber-500", text: "text-amber-900", label: severity === "medium" ? "Medium" : severity };
  }
  return { dot: "bg-stone-400", text: "text-stone-700", label: "Low" };
}

const SYSTEM_VALUE: Record<SystemStatusSummary["status"], string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  degraded: "Degraded",
};

/** One line after the status word. Says something the word does not, never the same count twice. */
function describeSystem(status: SystemStatusSummary): string {
  const plural = (n: number) => (n === 1 ? "" : "s");
  switch (status.status) {
    case "healthy":
      return "No open platform alerts";
    case "degraded":
      return "A data source did not respond";
    case "warning":
      return `${status.warningCount} medium alert${plural(status.warningCount)}`;
    case "critical":
      return status.warningCount > 0
        ? `${status.criticalCount} critical or high · ${status.warningCount} medium`
        : `${status.criticalCount} critical or high alert${plural(status.criticalCount)}`;
  }
}

const QUEUE_DOT: Record<ReviewQueueTone, string> = {
  danger: "bg-rose-600",
  warn: "bg-amber-500",
  neutral: "bg-stone-300",
};

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminOverviewView({
  isLoading,
  isDegraded,
  stats,
  systemAlerts,
  systemStatus,
  calendarFindingsCount,
  alertsFailed,
  updatedAt,
  activity,
  activityLoading,
  activityFailed,
  isFlushing,
  flushMessage,
  copiedAlertId,
  onRefresh,
  onFlushCache,
  onInspectAlert,
  onCopyAlert,
}: AdminOverviewViewProps) {
  const statsLoading = isLoading && !stats;
  const statsFailed = !isLoading && !stats;
  const queues = buildReviewQueues({
    pendingReports: stats ? stats.pendingReports : null,
    calendarFindings: calendarFindingsCount,
    pendingDharmVeerReview: stats ? stats.pendingDharmVeerReview : null,
  });
  const openReviews = totalOpenReviews(queues);
  const queuesComplete = allQueueCountsKnown(queues);
  // "All clear" only when every queue count is real; a partial total reads "3+", never a bare number.
  const reviewValue =
    openReviews === null
      ? statsLoading
        ? "…"
        : "—"
      : queuesComplete
        ? openReviews.toLocaleString()
        : openReviews > 0
          ? `${openReviews.toLocaleString()}+`
          : "—";
  const reviewDetail = queuesComplete
    ? openReviews === 0
      ? "All queues clear"
      : "Across reports, calendar and reviews"
    : isLoading
      ? "Loading…"
      : "Some counts did not load";
  const onboardingRate = stats ? formatOnboardingRate(stats.onboardedSeekers, stats.totalSeekers) : null;

  const systemDot =
    systemStatus.status === "healthy"
      ? "bg-emerald-500"
      : systemStatus.status === "warning"
        ? "bg-amber-500"
        : "bg-rose-600";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-outfit text-[var(--text-primary)] sm:px-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
            {formatUpdatedLabel(updatedAt) ?? (isLoading ? "Loading…" : "Not loaded yet")}
          </p>
        </div>
        <button type="button" onClick={onRefresh} disabled={isLoading} aria-label="Refresh overview" className={`${ACTION_BUTTON} inline-flex items-center gap-2 disabled:opacity-60`}>
          <RefreshCw size={14} className={isLoading ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {isDegraded ? (
        <div role="alert" className="mt-5 flex items-start gap-3 border-l-4 border-rose-600 bg-rose-50 p-3 text-xs text-rose-950">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-700" aria-hidden="true" />
          <p className="leading-relaxed">
            <b>A data source did not respond.</b> Figures below may be incomplete; open Monitoring for details.
          </p>
        </div>
      ) : null}

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="summary-title" className="mt-8">
        <SectionTitle id="summary-title">Summary</SectionTitle>
        <SummaryRow href="/admin/monitoring" label="System">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${systemDot}`} aria-hidden="true" />
            <b className="text-base">{SYSTEM_VALUE[systemStatus.status]}</b>
          </span>
          <span className="text-sm text-[var(--text-secondary)]">{describeSystem(systemStatus)}</span>
        </SummaryRow>
        <SummaryRow href="#needs-attention" label="Waiting for review">
          <b className="text-base">{reviewValue}</b>
          <span className="text-sm text-[var(--text-secondary)]">{reviewDetail}</span>
        </SummaryRow>
        <SummaryRow href="/admin/users" label="Seekers">
          <b className="text-base">{stats ? stats.totalSeekers.toLocaleString() : statsLoading ? "…" : "—"}</b>
          <span className="text-sm text-[var(--text-secondary)]">
            {stats
              ? `${stats.onboardedSeekers.toLocaleString()} onboarded${onboardingRate ? ` (${onboardingRate})` : ""}`
              : statsFailed
                ? "Could not load"
                : "Loading…"}
          </span>
        </SummaryRow>
      </section>

      {/* ── Needs attention ──────────────────────────────────────────────── */}
      <section id="needs-attention" aria-labelledby="needs-attention-title" className="mt-10 scroll-mt-20">
        <SectionTitle id="needs-attention-title">Needs attention</SectionTitle>

        <h3 className="mb-1 mt-4 text-xs font-bold text-[var(--text-secondary)]">Review queues</h3>
        <ul>
          {queues.map((queue) => (
            <li key={queue.id}>
              <Link href={queue.href} className={`flex min-h-12 items-center justify-between gap-3 px-1 py-2.5 ${ROW} ${ROW_HOVER} ${FOCUS_RING}`}>
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${QUEUE_DOT[queue.tone]}`} aria-hidden="true" />
                  <span className="truncate text-sm font-semibold">{queue.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <b className={`text-sm ${queue.count ? "" : "font-medium text-[var(--text-secondary)]"}`}>
                    {queue.count === null ? (statsLoading ? "…" : "—") : queue.count === 0 ? "Clear" : queue.count.toLocaleString()}
                  </b>
                  <ChevronRight size={14} className="text-stone-500" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mb-1 mt-6 text-xs font-bold text-[var(--text-secondary)]">Platform alerts</h3>
        {isLoading && systemAlerts.length === 0 ? (
          <p className={`px-1 py-3 text-sm text-[var(--text-secondary)] ${ROW}`}>Loading…</p>
        ) : systemAlerts.length === 0 && alertsFailed ? (
          <p className={`flex items-center gap-2 px-1 py-3 text-sm font-medium text-[var(--text-secondary)] ${ROW}`}>
            <AlertTriangle size={16} className="text-amber-700" aria-hidden="true" />
            Alerts did not load. Refresh to try again.
          </p>
        ) : systemAlerts.length === 0 ? (
          <p className={`flex items-center gap-2 px-1 py-3 text-sm font-medium text-[var(--text-secondary)] ${ROW}`}>
            <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />
            No open platform alerts
          </p>
        ) : (
          <ul>
            {systemAlerts.map((item) => {
              const style = severityStyle(item.severity);
              return (
                <li key={item.id} className={`flex flex-col gap-3 px-1 py-3 sm:flex-row sm:items-start sm:justify-between ${ROW}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                      <span className={`uppercase tracking-wider ${style.text}`}>{style.label}</span>
                      <span className="font-medium text-stone-600">{formatWhen(item.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                    <button type="button" onClick={() => onInspectAlert(item)} className={ACTION_BUTTON}>
                      Inspect
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopyAlert(item)}
                      aria-label={copiedAlertId === item.id ? "Alert copied" : `Copy alert: ${item.title}`}
                      className={`grid h-9 w-9 place-items-center rounded-md text-stone-700 transition-colors hover:bg-black/[0.06] ${FOCUS_RING}`}
                    >
                      {copiedAlertId === item.id ? <Check size={15} className="text-emerald-700" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                    </button>
                    <Link
                      href={item.href}
                      aria-label={`Open workspace for ${item.title}`}
                      className={`grid h-9 w-9 place-items-center rounded-md text-stone-700 transition-colors hover:bg-black/[0.06] ${FOCUS_RING}`}
                    >
                      <ExternalLink size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <nav aria-label="Quick actions" className="mt-10">
        <SectionTitle>Quick actions</SectionTitle>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 py-2">
          {QUICK_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={`inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-primary)] underline-offset-4 hover:underline ${FOCUS_RING}`}>
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={onFlushCache}
            disabled={isFlushing}
            className={`inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-primary)] underline-offset-4 hover:underline disabled:opacity-60 ${FOCUS_RING}`}
          >
            {isFlushing ? "Flushing…" : "Flush cache"}
          </button>
          {flushMessage ? (
            <p role="status" className="text-xs font-medium text-[var(--text-secondary)]">
              {flushMessage}
            </p>
          ) : null}
        </div>
      </nav>

      {/* ── Calendar changes (collapsed) ─────────────────────────────────── */}
      <details className="group mt-10 border-y border-[var(--border-medium)]">
        <summary className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-1 py-3 ${FOCUS_RING} [&::-webkit-details-marker]:hidden`}>
          <span className="flex items-baseline gap-2">
            <span className="text-sm font-bold">Calendar changes</span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {activityLoading ? "Loading…" : activityFailed ? "Could not load" : `Latest ${activity.length}`}
            </span>
          </span>
          <ChevronDown size={16} className="text-stone-600 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-1 pb-3">
          {activityLoading ? (
            <p className="py-3 text-xs font-medium text-[var(--text-secondary)]">Loading…</p>
          ) : activityFailed ? (
            <p className="py-3 text-xs font-medium text-[var(--text-secondary)]">The audit trail did not load. Open the audit log to see it.</p>
          ) : activity.length === 0 ? (
            <p className="py-3 text-xs font-medium text-[var(--text-secondary)]">No recent calendar changes.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {activity.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-2.5 text-xs">
                  <span className="text-base leading-none" aria-hidden="true">
                    {log.emoji || "🕉️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {log.display_name} ({log.year})
                    </p>
                    <p className="font-medium text-[var(--text-secondary)]">{log.action.replace(/_/g, " ")}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-stone-600">{formatWhen(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/calendar-governance?tab=activity" className={`mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[var(--brand-primary)] hover:underline ${FOCUS_RING}`}>
            Open audit log <ChevronRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </details>
    </div>
  );
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="border-b border-[var(--border-strong)] pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
      {children}
    </h2>
  );
}

/** A labelled line of the summary: label, then the value and its detail, then an arrow. One link per fact. */
function SummaryRow({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`flex min-h-14 items-center justify-between gap-3 px-1 py-3 ${ROW} ${ROW_HOVER} ${FOCUS_RING}`}>
      <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
        <span className="w-40 shrink-0 text-sm font-semibold text-[var(--text-secondary)]">{label}</span>
        <span className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">{children}</span>
      </span>
      <ChevronRight size={14} className="shrink-0 text-stone-500" aria-hidden="true" />
    </Link>
  );
}
