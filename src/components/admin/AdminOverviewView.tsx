"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  Megaphone,
  RefreshCw,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
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
  type ReviewQueueRow,
} from "@/lib/admin-overview-view-model";
import { describeNewThisMonth, type SeekerTrend } from "@/lib/admin-seeker-trend";
import { AdminLineChart } from "./AdminLineChart";

/**
 * The admin overview, in the dark frosted-glass style: three figures, one real chart, what needs a
 * person, a strip of shortcuts, and collapsed history. Only the order of the page and the honesty
 * rules matter to the data: a failed read is shown as unknown (a dash), never as zero, and
 * "all clear" is said only when every count is known.
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
  /** New seekers per month, or null when it has not loaded. */
  trend: SeekerTrend | null;
  trendLoading: boolean;
  trendFailed: boolean;
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

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";
const PANEL = "glass p-4 sm:p-5";
const MONO_META = "glass-mono text-[10px] text-[var(--text-secondary)]";

const QUICK_ACTIONS: ReadonlyArray<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/admin/logs", label: "Logs", icon: FileText },
  { href: "/admin/crons", label: "Crons", icon: Clock },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
];

const SYSTEM_LABEL: Record<SystemStatusSummary["status"], string> = {
  healthy: "System healthy",
  warning: "System warning",
  critical: "System critical",
  degraded: "System degraded",
};

const SYSTEM_DOT: Record<SystemStatusSummary["status"], string> = {
  healthy: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-rose-400",
  degraded: "bg-amber-400",
};

/** One line saying what the system status word does not, never the same count twice. */
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
        ? `${status.criticalCount} critical or high, ${status.warningCount} medium`
        : `${status.criticalCount} critical or high alert${plural(status.criticalCount)}`;
  }
}

function severityStyle(severity: UrgentAlertItem["severity"]) {
  if (severity === "critical" || severity === "P0" || severity === "P1") return { dot: "bg-rose-400", label: severity === "critical" ? "Critical" : severity };
  if (severity === "high") return { dot: "bg-rose-300", label: "High" };
  if (severity === "medium" || severity === "P2") return { dot: "bg-amber-400", label: severity === "medium" ? "Medium" : severity };
  return { dot: "bg-stone-400", label: "Low" };
}

const QUEUE_DOT: Record<ReviewQueueRow["tone"], string> = {
  danger: "border-rose-300 bg-rose-400/30",
  warn: "border-amber-300 bg-amber-400/30",
  neutral: "border-white/40",
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
  trend,
  trendLoading,
  trendFailed,
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
      : openReviews === 1
        ? "item waiting"
        : "items waiting"
    : isLoading
      ? "Loading…"
      : "Some counts did not load";
  const onboardingRate = stats ? formatOnboardingRate(stats.onboardedSeekers, stats.totalSeekers) : null;

  const newThisMonth = describeNewThisMonth(trend);
  const seekersDetail = newThisMonth ?? (trendLoading ? "Loading…" : trendFailed ? "Trend unavailable" : "");

  // Queues that need a person: any with work, and any whose count is unknown (shown as a dash).
  // While the first load is still running every count is unknown, so the list says "Loading…" instead of three dashes.
  const queueRows = statsLoading ? [] : queues.filter((queue) => queue.count === null || queue.count > 0);
  const nothingToDo = !isLoading && !alertsFailed && systemAlerts.length === 0 && queuesComplete && queueRows.length === 0;
  const itemCount = systemAlerts.length + queueRows.filter((queue) => queue.count !== null).length;

  return (
    <div className="admin-dark mx-auto max-w-3xl px-4 pb-16 pt-6 font-outfit sm:px-6">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold tracking-tight">Overview</h1>
          <p className={`${MONO_META} mt-1`}>{formatUpdatedLabel(updatedAt) ?? (isLoading ? "Loading…" : "Not loaded yet")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/monitoring" className={`glass-btn ${FOCUS_RING}`} aria-label={`${SYSTEM_LABEL[systemStatus.status]}. ${describeSystem(systemStatus)}. Open monitoring`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${SYSTEM_DOT[systemStatus.status]}`} aria-hidden="true" />
            {SYSTEM_LABEL[systemStatus.status]}
          </Link>
          <button type="button" onClick={onRefresh} disabled={isLoading} aria-label="Refresh overview" className={`glass-btn-primary disabled:opacity-60 ${FOCUS_RING}`}>
            <RefreshCw size={14} className={isLoading ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {isDegraded ? (
        <div role="alert" className="glass mt-4 flex items-start gap-3 border-amber-300/40 p-3 text-xs">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--g-warn)]" aria-hidden="true" />
          <p className="leading-relaxed">
            <b>A data source did not respond.</b> Figures below may be incomplete; open Monitoring for details.
          </p>
        </div>
      ) : null}

      {/* ── Figures ──────────────────────────────────────────────────────── */}
      <section aria-label="Key figures" className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Tile
          href="/admin/users"
          label="Seekers"
          icon={Users}
          value={stats ? stats.totalSeekers.toLocaleString() : statsLoading ? "…" : "—"}
          detail={stats ? seekersDetail : statsFailed ? "Could not load" : "Loading…"}
          detailTone={newThisMonth && trend && trend.thisMonth > 0 ? "good" : "plain"}
        />
        <Tile
          href="/admin/users"
          label="Onboarded"
          icon={UserCheck}
          value={stats ? (onboardingRate ?? "—") : statsLoading ? "…" : "—"}
          detail={stats ? `${stats.onboardedSeekers.toLocaleString()} of ${stats.totalSeekers.toLocaleString()}` : statsFailed ? "Could not load" : "Loading…"}
          detailTone="plain"
        />
        <Tile
          href="#action-items"
          label="To review"
          icon={ClipboardCheck}
          value={reviewValue}
          detail={reviewDetail}
          detailTone={queuesComplete && openReviews !== null && openReviews > 0 ? "warn" : "plain"}
        />
      </section>

      {/* ── Chart ────────────────────────────────────────────────────────── */}
      <section aria-labelledby="trend-title" className={`${PANEL} mt-3`}>
        <div className="flex items-baseline gap-3">
          <h2 id="trend-title" className="font-sans text-sm font-bold">
            New seekers
          </h2>
          <span className={MONO_META}>Last 12 months</span>
        </div>
        <div className="mt-4">
          {trend ? (
            <>
              <AdminLineChart
                data={trend.months.map((month) => ({ label: month.label, value: month.count }))}
                ariaLabel={`New seekers per month, ${trend.months[0].label} to ${trend.months[trend.months.length - 1].label}. ${describeNewThisMonth(trend) ?? ""}`}
              />
              {trend.truncated ? (
                <p className="mt-2 text-[11px] text-[var(--text-secondary)]">The count reached its read limit, so the oldest months may be low.</p>
              ) : null}
            </>
          ) : (
            <p className="grid h-40 place-items-center text-xs font-medium text-[var(--text-secondary)]">
              {trendLoading ? "Loading…" : trendFailed ? "The signup trend did not load. Refresh to try again." : "No trend yet."}
            </p>
          )}
        </div>
      </section>

      {/* ── Action items ─────────────────────────────────────────────────── */}
      <section id="action-items" aria-labelledby="action-title" className={`${PANEL} mt-3 scroll-mt-20`}>
        <div className="flex items-center gap-2">
          <h2 id="action-title" className="font-sans text-sm font-bold">
            Action items
          </h2>
          {itemCount > 0 ? <span className="glass-mono rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{itemCount}</span> : null}
        </div>

        <ul className="mt-2 divide-y divide-white/10">
          {statsLoading && systemAlerts.length === 0 ? (
            <li className="py-3 text-sm text-[var(--text-secondary)]">Loading…</li>
          ) : null}

          {systemAlerts.map((item) => {
            const style = severityStyle(item.severity);
            return (
              <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <span className="sr-only">{style.label}: </span>
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
                    <p className={`${MONO_META} mt-1`}>
                      {style.label} · {formatWhen(item.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                  <button type="button" onClick={() => onInspectAlert(item)} className={`glass-tool min-h-9 px-3 text-xs font-bold ${FOCUS_RING}`}>
                    Inspect
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopyAlert(item)}
                    aria-label={copiedAlertId === item.id ? "Alert copied" : `Copy alert: ${item.title}`}
                    className={`glass-tool grid h-9 w-9 place-items-center ${FOCUS_RING}`}
                  >
                    {copiedAlertId === item.id ? <Check size={15} className="text-[var(--g-good)]" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  </button>
                  <Link href={item.href} aria-label={`Open workspace for ${item.title}`} className={`glass-tool grid h-9 w-9 place-items-center ${FOCUS_RING}`}>
                    <ExternalLink size={15} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}

          {queueRows.map((queue) => (
            <li key={queue.id}>
              <Link href={queue.href} className={`-mx-2 flex min-h-12 items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.07] ${FOCUS_RING}`}>
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`h-4 w-4 shrink-0 rounded-full border ${QUEUE_DOT[queue.tone]}`} aria-hidden="true" />
                  <span className="truncate text-sm font-medium">{queue.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`${MONO_META} text-[11px]`}>{queue.count === null ? "—" : queue.count.toLocaleString()}</span>
                  <ChevronRight size={14} className="text-[var(--text-secondary)]" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}

          {alertsFailed ? (
            <li className="flex items-center gap-2 py-3 text-sm text-[var(--text-secondary)]">
              <AlertTriangle size={16} className="shrink-0 text-[var(--g-warn)]" aria-hidden="true" />
              Platform alerts did not load. Refresh to try again.
            </li>
          ) : null}

          {nothingToDo ? (
            <li className="flex items-center gap-2 py-3 text-sm text-[var(--text-secondary)]">
              <CheckCircle2 size={16} className="shrink-0 text-[var(--g-good)]" aria-hidden="true" />
              Nothing needs attention. No platform alerts and every queue is clear.
            </li>
          ) : null}
        </ul>
      </section>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <nav aria-label="Quick actions" className="glass mt-3 flex flex-wrap items-center gap-1 p-1.5">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`glass-tool inline-flex min-h-11 flex-1 basis-[7.5rem] items-center justify-center gap-2 px-3 text-xs font-bold ${FOCUS_RING}`}>
            <Icon size={14} aria-hidden="true" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onFlushCache}
          disabled={isFlushing}
          className={`glass-tool inline-flex min-h-11 flex-1 basis-[7.5rem] items-center justify-center gap-2 px-3 text-xs font-bold disabled:opacity-60 ${FOCUS_RING}`}
        >
          <Zap size={14} aria-hidden="true" />
          {isFlushing ? "Flushing…" : "Flush cache"}
        </button>
      </nav>
      {flushMessage ? (
        <p role="status" className="mt-2 px-1 text-xs font-medium text-[var(--text-secondary)]">
          {flushMessage}
        </p>
      ) : null}

      {/* ── Collapsed history ────────────────────────────────────────────── */}
      <div className="mt-3 space-y-2">
        <Collapsible title="Calendar changes" meta={activityLoading ? "Loading…" : activityFailed ? "Could not load" : `${activity.length} latest`}>
          {activityLoading ? (
            <p className="py-3 text-xs font-medium text-[var(--text-secondary)]">Loading…</p>
          ) : activityFailed ? (
            <p className="py-3 text-xs font-medium text-[var(--text-secondary)]">The audit trail did not load. Open the audit log to see it.</p>
          ) : activity.length === 0 ? (
            <p className="py-3 text-xs font-medium text-[var(--text-secondary)]">No recent calendar changes.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {activity.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-2.5 text-xs">
                  <span className="text-base leading-none" aria-hidden="true">
                    {log.emoji || "🕉️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {log.display_name} ({log.year})
                    </p>
                    <p className="text-[var(--text-secondary)]">{log.action.replace(/_/g, " ")}</p>
                  </div>
                  <span className={`${MONO_META} shrink-0`}>{formatWhen(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/calendar-governance?tab=activity" className={`mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[var(--g-warn)] hover:underline ${FOCUS_RING}`}>
            Open audit log <ChevronRight size={13} aria-hidden="true" />
          </Link>
        </Collapsible>

        <Collapsible title="Signups by month" meta={trend ? `${trend.thisMonth.toLocaleString()} this month` : trendLoading ? "Loading…" : "Could not load"}>
          {trend ? (
            <table className="w-full text-xs">
              <caption className="sr-only">New seekers per month, last 12 months</caption>
              <thead>
                <tr className={`${MONO_META} text-left`}>
                  <th scope="col" className="py-2 font-medium">
                    Month
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    New seekers
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[...trend.months].reverse().map((month) => (
                  <tr key={month.key}>
                    <td className="py-2 font-medium">{month.key}</td>
                    <td className="py-2 text-right font-bold tabular-nums">{month.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-3 text-xs font-medium text-[var(--text-secondary)]">{trendLoading ? "Loading…" : "The signup trend did not load."}</p>
          )}
        </Collapsible>
      </div>
    </div>
  );
}

/** A figure tile: a small mono label with an icon, the value large, one line of detail. The whole tile is one link. */
function Tile({
  href,
  label,
  icon: Icon,
  value,
  detail,
  detailTone,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  value: string;
  detail: string;
  detailTone: "plain" | "good" | "warn";
}) {
  const tone = detailTone === "good" ? "text-[var(--g-good)]" : detailTone === "warn" ? "text-[var(--g-warn)]" : "text-[var(--text-secondary)]";
  return (
    <Link href={href} className={`glass glass-interactive flex min-h-[6.5rem] flex-col justify-between rounded-2xl p-3 sm:p-4 ${FOCUS_RING}`}>
      <span className="flex items-center justify-between gap-1">
        <span className={`${MONO_META} truncate`}>{label}</span>
        <Icon size={14} className="shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
      </span>
      <span className="mt-2 block text-2xl font-semibold leading-none tracking-tight tabular-nums sm:text-3xl">{value}</span>
      <span className={`mt-1.5 block text-[11px] font-medium leading-snug ${tone}`}>{detail}</span>
    </Link>
  );
}

/** A collapsed row: chevron, title and a short meta; the content opens in place. */
function Collapsible({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <details className="glass group rounded-xl">
      <summary className={`flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3 ${FOCUS_RING} [&::-webkit-details-marker]:hidden`}>
        <ChevronRight size={14} className="shrink-0 text-[var(--text-secondary)] transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
        <span className="text-sm font-bold">{title}</span>
        <span className="text-xs font-medium text-[var(--text-secondary)]">{meta}</span>
      </summary>
      <div className="px-4 pb-3">{children}</div>
    </details>
  );
}
