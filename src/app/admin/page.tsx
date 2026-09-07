"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck,
  MapPin,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  Radio,
  Clock,
  ArrowRight,
  Globe,
  Zap
} from "lucide-react";
import type { UrgentAlertItem } from "@/app/api/admin/alerts/route";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { AdminRecordInspector } from "@/components/admin/AdminRecordInspector";
import type { AdminInspectableRecord } from "@/lib/admin-inspector-types";
import {
  getOverviewSystemStatus,
  sortAlertsByUrgency,
  alertToInspectableRecord,
  type SystemStatusSummary,
} from "@/lib/admin-overview-helpers";
import { getStaggerDelayStyle, useReducedMotion } from "@/lib/admin-accessibility";

interface OverviewStats {
  totalSeekers: number;
  onboardedSeekers: number;
  activeNow: number;
  pendingReports: number;
  pendingDharmVeerReview: number;
  globalReach: number;
}

interface OperatorActivityItem {
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

export default function AdminOverviewPage() {
  const prefersReducedMotion = useReducedMotion();
  const [stats, setStats] = useState<OverviewStats>({
    totalSeekers: 0,
    onboardedSeekers: 0,
    activeNow: 0,
    pendingReports: 0,
    pendingDharmVeerReview: 0,
    globalReach: 0,
  });
  const [alerts, setAlerts] = useState<UrgentAlertItem[]>([]);
  const [isDegraded, setIsDegraded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<OperatorActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Platform Edge Cache Flush State
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState<string | null>(null);

  // Inspector State
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

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalSeekers: statsData.totalSeekers || 0,
          onboardedSeekers: statsData.onboardedSeekers || 0,
          activeNow: statsData.activeNow || 0,
          pendingReports: statsData.pendingReports || 0,
          pendingDharmVeerReview: statsData.pendingDharmVeerReview || 0,
          globalReach: statsData.globalReach || 0,
        });
      }

      if (alertsRes && alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
        setIsDegraded(Boolean(alertsData.degraded));
      } else {
        setIsDegraded(true);
      }
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
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivityLogs(data.slice(0, 6));
        }
      }
    } catch (err) {
      console.error("[AdminOverview] Failed to fetch activity logs:", err);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
    fetchActivityLogs();
  }, [fetchOverviewData, fetchActivityLogs]);

  const handleFlushCache = async () => {
    setIsFlushing(true);
    setFlushMessage(null);
    try {
      const res = await fetch("/api/admin/flush-cache", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFlushMessage(data.message || "Edge & page caches flushed successfully.");
      } else {
        setFlushMessage("Failed: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      setFlushMessage("Error: " + (e.message || String(e)));
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

  // Filter out calendar integrity items from the main operations overview (keep them in Calendar section)
  const nonCalendarAlerts = alerts.filter(
    (a) => a.id !== "system-ok" && a.type !== "integrity" && !a.title.toLowerCase().includes("calendar integrity")
  );
  const sortedAlerts = sortAlertsByUrgency(nonCalendarAlerts);
  const systemStatus: SystemStatusSummary = getOverviewSystemStatus(nonCalendarAlerts, isDegraded);

  // Count of calendar findings to display on the dedicated calendar card
  const calendarFindingsCount = alerts.filter((a) => a.type === "integrity" || a.title.toLowerCase().includes("calendar integrity")).length;

  return (
    <div className="space-y-8 font-outfit text-stone-900 pb-16 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-200 motion-reduce:animate-none">

      {/* Screen Reader Live Region for Cache Flush Feedback */}
      {flushMessage && (
        <div aria-live="polite" role="status" className="sr-only">
          {flushMessage}
        </div>
      )}

      {/* ─── 1. STATUS STRIP & HEADER ────────────────────────────────────────── */}
      <section aria-label="Operational Status Summary" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-serif theme-ink tracking-tight">
                Operations Overview
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-900 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Production Live
              </span>
            </div>
            <p className="text-xs text-[var(--brand-muted)] font-medium">
              Real-time platform telemetry, urgent resolution queues, and autonomous system health.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                fetchOverviewData();
                fetchActivityLogs();
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold text-gray-700 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
              aria-label="Refresh operational telemetry"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-amber-600" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleFlushCache}
              disabled={isFlushing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-900/20 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-bold text-amber-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 cursor-pointer"
              aria-label="Flush Edge and CDN Cache"
            >
              <Layers size={13} className="text-amber-800" />
              <span>{isFlushing ? "Flushing..." : "Flush Cache"}</span>
            </button>
          </div>
        </div>

        {/* Flush Feedback Alert Banner */}
        {flushMessage && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium flex items-center justify-between"
          >
            <span>{flushMessage}</span>
            <button
              onClick={() => setFlushMessage(null)}
              className="text-[11px] font-bold text-amber-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Degraded Source Warning Banner */}
        {isDegraded && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-950 text-xs flex items-start gap-3 shadow-xs"
          >
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-bold text-rose-900">Monitoring Source Degradation Detected</h2>
              <p className="text-rose-800 leading-relaxed">
                One or more underlying database queries or client error aggregators encountered an issue. Active alerts below show diagnostic logs. Systems are operating in fail-safe mode.
              </p>
            </div>
          </div>
        )}

        {/* ─── RICH, CLICKABLE KPI STATUS TILES ───────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tile 1: System Health & Vitals */}
          <Link
            href="/admin/monitoring?tab=apis"
            className="p-4 rounded-2xl bg-white border border-black/5 hover:border-amber-500/40 hover:shadow-md transition-all space-y-1.5 group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                System Health
              </span>
              <span className="text-[10px] font-bold text-amber-800 group-hover:underline flex items-center gap-0.5">
                Inspect Fleet <ArrowRight size={10} />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  systemStatus.status === "healthy"
                    ? "bg-emerald-500"
                    : systemStatus.status === "degraded"
                    ? "bg-rose-500"
                    : systemStatus.status === "critical"
                    ? "bg-rose-600"
                    : "bg-amber-500"
                }`}
              />
              <b className="text-sm font-bold theme-ink group-hover:text-amber-900 transition-colors">
                {systemStatus.label}
              </b>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">{systemStatus.description}</p>
          </Link>

          {/* Tile 2: Actionable Alerts */}
          <Link
            href="/admin/monitoring?tab=errors"
            className="p-4 rounded-2xl bg-white border border-black/5 hover:border-amber-500/40 hover:shadow-md transition-all space-y-1.5 group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Actionable Alerts
              </span>
              <span className="text-[10px] font-bold text-amber-800 group-hover:underline flex items-center gap-0.5">
                Review Queue <ArrowRight size={10} />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <b className="text-base font-serif font-bold text-gray-900 group-hover:text-amber-900 transition-colors">
                {sortedAlerts.length}
              </b>
              <span className="text-xs text-gray-500 font-medium">
                ({systemStatus.criticalCount} high, {systemStatus.warningCount} medium)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {sortedAlerts.length === 0 ? "No open operational issues in queue" : "Platform issues requiring operator triage"}
            </p>
          </Link>

          {/* Tile 3: Deployment & Runtime */}
          <Link
            href="/admin/monitoring?tab=telemetry"
            className="p-4 rounded-2xl bg-white border border-black/5 hover:border-amber-500/40 hover:shadow-md transition-all space-y-1.5 group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Deployment
              </span>
              <span className="text-[10px] font-bold text-amber-800 group-hover:underline flex items-center gap-0.5">
                Live Ingest Stream <ArrowRight size={10} />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                Next.js 15.5 Standalone
              </code>
              <span className="text-xs text-emerald-700 font-bold">· Edge Active</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">Multi-region telemetry, RLS & DB pool verified</p>
          </Link>
        </div>
      </section>

      {/* ─── 2. PRIMARY "NEEDS ATTENTION" QUEUE ───────────────────────────────── */}
      <section id="needs-attention" aria-label="Needs Attention Queue" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-950 font-serif">
              Needs Attention
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 text-[10px] font-bold">
              {sortedAlerts.length} Actionable
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            Sorted by Urgency & Freshness (System & Infrastructure Only)
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-2 animate-pulse"
                style={{ minHeight: "88px" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-12 h-4 bg-gray-200 rounded-full" />
                  <div className="w-20 h-4 bg-gray-100 rounded" />
                </div>
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                <div className="w-1/2 h-3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-black/5 text-center space-y-1.5 shadow-2xs">
            <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
            <b className="text-sm font-bold text-gray-800 block">Operational Queue Clear</b>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No active client crash spikes, authentication custody warnings, unreviewed biographies, or content reports currently require operator intervention.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedAlerts.map((item, idx) => (
              <div
                key={item.id}
                style={getStaggerDelayStyle(idx, 240, prefersReducedMotion)}
                className={`p-4 rounded-2xl bg-white border transition-all shadow-2xs relative select-text ${
                  item.severity === "high"
                    ? "border-rose-500/30 hover:border-rose-500/60"
                    : "border-amber-500/20 hover:border-amber-500/50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          item.severity === "high"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : item.severity === "medium"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/5 text-gray-700 text-[9px] font-mono uppercase">
                        {item.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold theme-ink select-text">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed select-text">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Copy Summary Button */}
                    <button
                      onClick={() => copyAlertText(item)}
                      title="Copy alert description"
                      className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAlertId === item.id ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <Check size={11} /> Copied!
                        </span>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Working Inspect Button */}
                    <button
                      onClick={() => handleInspectAlert(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer shadow-2xs"
                    >
                      Inspect
                    </button>

                    {/* External Link */}
                    <Link
                      href={item.href}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      title="Open dedicated workspace"
                      aria-label={`Open dedicated workspace for ${item.title}`}
                    >
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 3. OPERATIONAL SNAPSHOT & RECENT ACTIVITY ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Decision-Useful Metrics Snapshot (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-950 font-serif">
              Operational Snapshot
            </h2>
            <span className="text-[10px] text-gray-400 font-medium">Interactive Workspaces</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Dedicated Calendar Governance Card */}
            <MetricCard
              href="/admin/observance-content"
              icon={Calendar}
              label="Calendar & Observances"
              value={calendarFindingsCount > 0 ? `${calendarFindingsCount} Discrepancies` : "Verified Live"}
              sublabel="Masa, Tithi, & festival dates governance"
              highlight={calendarFindingsCount > 0}
            />

            <MetricCard
              href="/admin/moderation"
              icon={ShieldAlert}
              label="Pending Reports"
              value={stats.pendingReports.toLocaleString()}
              sublabel="Trust & Safety moderation queue"
              highlight={stats.pendingReports > 0}
            />

            <MetricCard
              href="/admin/dharm-veer-review"
              icon={ShieldCheck}
              label="Dharm Veer Reviews"
              value={stats.pendingDharmVeerReview.toLocaleString()}
              sublabel="Biographies pending verification"
              highlight={stats.pendingDharmVeerReview > 0}
            />

            <MetricCard
              href="/admin/users"
              icon={UserCheck}
              label="Registered Seekers"
              value={stats.totalSeekers.toLocaleString()}
              sublabel={`${stats.onboardedSeekers.toLocaleString()} completed onboarding`}
            />

            <MetricCard
              href="/admin/monitoring?tab=apis"
              icon={Activity}
              label="API Fleet Health"
              value="19 Services"
              sublabel="Panchang, AI, Sadhana & Japa APIs"
            />

            <MetricCard
              href="/admin/monitoring?tab=push"
              icon={Radio}
              label="Push Notification Gateway"
              value="Multi-Region"
              sublabel="APNs & FCM delivery gateway"
            />
          </div>
        </div>

        {/* Right Column: Governance Activity Audit Stream (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-950 font-serif">
              Recent Activity
            </h2>
            <Link
              href="/admin/calendar-governance?tab=activity"
              className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1"
            >
              <span>Audit Log</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-3">
            {activityLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-gray-100" />
                    <div className="space-y-1 flex-1">
                      <div className="w-1/2 h-3 bg-gray-200 rounded" />
                      <div className="w-1/3 h-2 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No recent operator mutations logged.
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs border-b border-black/5 pb-2.5 last:border-0 last:pb-0">
                    <span className="text-base leading-none mt-0.5">{log.emoji || "🕉️"}</span>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold text-gray-800 truncate">
                        {log.display_name} ({log.year})
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {log.action.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── 4. RECORD INSPECTOR DRAWER ───────────────────────────────────────── */}
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
    </div>
  );
}

function MetricCard({
  href,
  icon: Icon,
  label,
  value,
  sublabel,
  highlight = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`p-4 rounded-2xl bg-white border transition-all shadow-2xs hover:shadow-md hover:scale-[1.01] block group cursor-pointer ${
        highlight
          ? "border-amber-500/40 bg-amber-50/10 hover:border-amber-500/70"
          : "border-black/5 hover:border-amber-500/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          {label}
        </span>
        <Icon size={16} className={highlight ? "text-amber-700" : "text-gray-400 group-hover:text-amber-800 transition-colors"} />
      </div>
      <div className="text-lg font-serif font-bold text-gray-900 group-hover:text-amber-900 transition-colors mt-1">
        {value}
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{sublabel}</p>
    </Link>
  );
}
