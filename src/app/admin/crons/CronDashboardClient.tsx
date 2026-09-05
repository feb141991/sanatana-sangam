"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { parseCronTarget } from "@/lib/admin-url-state";
import {
  Clock, Play, AlertTriangle, CheckCircle, RefreshCw,
  Search, ShieldCheck, ArrowLeft, ChevronDown, ChevronUp,
  Activity, Zap, Info, Server, Sparkles, Calendar, Bell, Wrench,
  ArrowUpDown, ArrowUp, ArrowDown, Check, XCircle, Send, Inbox,
  Layers, Filter, Copy, Code, HelpCircle, ExternalLink
} from "lucide-react";
import { CronStatusSummary, CronCategory } from "@/lib/monitoring/cron-telemetry";

interface ExecutionLog {
  id?: string;
  route: string;
  timestamp: string;
  statusCode: number;
  durationMs: number;
  status: "healthy" | "error" | "warning" | "untriggered";
  errorMessage?: string | null;
  errorCode?: string | null;
  payloadSummary?: Record<string, unknown> | null;
  triggeredBy: "vercel_cron" | "admin_manual";
}

interface HourlyBucket24h {
  hourLabel: string;
  hourUtc: number;
  startIso: string;
  count: number;
  errorCount: number;
  status: "healthy" | "error" | "none";
  avgDurationMs: number;
}

interface ScheduledNotificationItem {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  status: "pending" | "claimed" | "sent" | "failed";
  send_at: string;
  sent_at?: string | null;
  error?: string | null;
  created_at: string;
  notification_key: string;
}

interface NotificationQueueSummary {
  pending: number;
  claimed: number;
  sent: number;
  failed: number;
  recent: ScheduledNotificationItem[];
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  all: { label: "All Routines", icon: Server, color: "text-gray-700" },
  reminders: { label: "Reminders & Alerts", icon: Bell, color: "text-amber-600" },
  calendar: { label: "Calendar & Occurrences", icon: Calendar, color: "text-emerald-600" },
  ai: { label: "AI Generation", icon: Sparkles, color: "text-purple-600" },
  maintenance: { label: "System Maintenance", icon: Wrench, color: "text-blue-600" },
};

type SortField = "name" | "category" | "totalRuns24h" | "successRate24h" | "lastRun" | "nextRun" | "duration";
type SortOrder = "asc" | "desc";

// Layman Next Run Calculator
function getNextCronRun(cronExpr: string) {
  if (!cronExpr) return { iso: "", human: "Scheduled", relative: "", timestamp: 0 };
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 5) return { iso: "", human: "Custom Schedule", relative: "", timestamp: 0 };

  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;
  const now = new Date();

  for (let m = 1; m <= 35 * 24 * 60; m++) {
    const candidate = new Date(now.getTime() + m * 60 * 1000);
    candidate.setSeconds(0, 0);

    const minMatch = minStr === "*" || minStr.split(",").includes(String(candidate.getUTCMinutes()));
    const hourMatch = hourStr === "*" || hourStr.split(",").includes(String(candidate.getUTCHours()));
    const domMatch = domStr === "*" || domStr.split(",").includes(String(candidate.getUTCDate()));
    const monthMatch = monthStr === "*" || monthStr.split(",").includes(String(candidate.getUTCMonth() + 1));
    const dowMatch = dowStr === "*" || dowStr.split(",").includes(String(candidate.getUTCDay()));

    if (minMatch && hourMatch && domMatch && monthMatch && dowMatch) {
      const diffMs = candidate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relative = "";
      if (diffMins < 60) relative = `in ${diffMins}m`;
      else if (diffHours < 24) relative = `in ${diffHours}h ${diffMins % 60}m`;
      else relative = `in ${diffDays}d ${diffHours % 24}h`;

      const istTime = candidate.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });
      const isToday = candidate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) === now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const isTomorrow = new Date(now.getTime() + 86400000).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) === candidate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
      const dayName = candidate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" });

      const dayPrefix = isToday ? "Today" : isTomorrow ? "Tomorrow" : `${dayName}, ${candidate.getDate()} ${candidate.toLocaleString("en-IN", { month: "short" })}`;
      return {
        iso: candidate.toISOString(),
        human: `${dayPrefix} at ${istTime} IST`,
        relative,
        timestamp: candidate.getTime(),
      };
    }
  }

  return { iso: "", human: "Scheduled", relative: "", timestamp: 0 };
}

export default function CronDashboardClient() {
  const searchParams = useSearchParams();
  const targetJob = parseCronTarget(searchParams);
  const [crons, setCrons] = useState<CronStatusSummary[]>([]);
  const [queue, setQueue] = useState<NotificationQueueSummary>({
    pending: 0,
    claimed: 0,
    sent: 0,
    failed: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("nextRun");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Detailed Modal Inspector
  const [inspectExecution, setInspectExecution] = useState<{
    cronName: string;
    route: string;
    log: ExecutionLog;
  } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Interaction State
  const [runningRoute, setRunningRoute] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{
    route: string;
    ok: boolean;
    status: number;
    duration_ms: number;
    result: unknown;
  } | null>(null);
  const [expandedCron, setExpandedCron] = useState<string | null>(null);
  const [showQueueDetails, setShowQueueDetails] = useState<boolean>(false);
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [queueSearch, setQueueSearch] = useState<string>("");
  const [inspectQueueItem, setInspectQueueItem] = useState<ScheduledNotificationItem | null>(null);
  const [dispatchingQueue, setDispatchingQueue] = useState<boolean>(false);

  // Global Escape key listener for Cron modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInspectExecution(null);
        setInspectQueueItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const fetchCrons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/crons");
      if (!res.ok) {
        throw new Error("Failed to fetch cron status (" + res.status + ")");
      }
      const data = await res.json();
      setCrons(data.crons || []);
      if (data.queue) setQueue(data.queue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCrons();
  }, [fetchCrons]);

  useEffect(() => {
    if (targetJob) {
      setSearchQuery(targetJob);
      setExpandedCron(targetJob);
    }
  }, [targetJob]);

  const triggerCron = async (cronPath: string) => {
    setRunningRoute(cronPath);
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/crons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronPath }),
      });
      const data = await res.json();
      const isOk = (data.ok ?? res.ok) && res.status >= 200 && res.status < 300;
      const status = data.status ?? res.status;
      const durationMs = data.duration_ms ?? 0;

      setRunResult({
        route: cronPath,
        ok: isOk,
        status,
        duration_ms: durationMs,
        result: data.result ?? data,
      });

      setCrons((prev) =>
        prev.map((c) => {
          if (c.route === cronPath || c.route.split("?")[0] === cronPath.split("?")[0]) {
            const newExecution: ExecutionLog = {
              route: cronPath,
              timestamp: new Date().toISOString(),
              statusCode: status,
              durationMs,
              status: isOk ? "healthy" : "error",
              triggeredBy: "admin_manual",
              payloadSummary: (data.result ?? data) as Record<string, unknown>,
            };
            const newRecent = [newExecution, ...(c.recentExecutions || [])].slice(0, 10);
            const newTotalRuns = (c.totalRuns24h || 0) + 1;
            const newSuccessfulRuns = (c.successfulRuns24h || 0) + (isOk ? 1 : 0);
            const newFailedRuns = (c.failedRuns24h || 0) + (isOk ? 0 : 1);
            const newSuccessRate = Math.round((newSuccessfulRuns / newTotalRuns) * 100);

            const currentHourUtc = new Date().getUTCHours();
            const updatedBreakdown = (c.hourlyBreakdown24h || []).map((b) => {
              if (b.hourUtc === currentHourUtc) {
                return {
                  ...b,
                  count: b.count + 1,
                  errorCount: b.errorCount + (isOk ? 0 : 1),
                  status: (isOk ? (b.status === "error" ? "error" : "healthy") : "error") as any,
                  avgDurationMs: Math.round(((b.avgDurationMs * b.count) + durationMs) / (b.count + 1)),
                };
              }
              return b;
            });

            return {
              ...c,
              lastExecution: newExecution,
              recentExecutions: newRecent,
              totalRuns24h: newTotalRuns,
              successfulRuns24h: newSuccessfulRuns,
              failedRuns24h: newFailedRuns,
              successRate24h: newSuccessRate,
              hourlyBreakdown24h: updatedBreakdown,
            };
          }
          return c;
        })
      );

      setTimeout(() => { void fetchCrons(); }, 600);
    } catch (err) {
      setRunResult({
        route: cronPath,
        ok: false,
        status: 500,
        duration_ms: 0,
        result: { error: err instanceof Error ? err.message : "Fetch failed" },
      });
    } finally {
      setRunningRoute(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "nextRun" ? "asc" : "desc");
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: crons.length };
    for (const c of crons) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, [crons]);

  const categoryScopedCrons = useMemo(() => {
    if (selectedCategory === "all") return crons;
    return crons.filter((c) => c.category === selectedCategory);
  }, [crons, selectedCategory]);

  const metrics = useMemo(() => {
    const total = categoryScopedCrons.length;
    let healthyCount = 0;
    let failingCount = 0;
    let untriggeredCount = 0;
    let active24hCount = 0;
    let total24hRuns = 0;
    let total24hFailures = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const c of categoryScopedCrons) {
      const runs = c.totalRuns24h || 0;
      const fails = c.failedRuns24h || 0;
      total24hRuns += runs;
      total24hFailures += fails;

      const isFailing = fails > 0 || (c.lastExecution && c.lastExecution.status !== "healthy");
      const isUntriggered = !c.lastExecution && runs === 0;
      const isActive = runs > 0;

      if (isUntriggered) {
        untriggeredCount++;
      } else if (isFailing) {
        failingCount++;
      } else {
        healthyCount++;
      }

      if (isActive) active24hCount++;

      if (c.lastExecution?.durationMs) {
        totalLatency += c.lastExecution.durationMs;
        latencyCount++;
      }
    }

    const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
    const globalSuccessRate24h = total24hRuns > 0 ? Math.round(((total24hRuns - total24hFailures) / total24hRuns) * 100) : 100;

    return {
      total,
      healthy: healthyCount,
      failing: failingCount,
      untriggered: untriggeredCount,
      active24h: active24hCount,
      total24hRuns,
      total24hFailures,
      globalSuccessRate24h,
      avgLatency,
    };
  }, [categoryScopedCrons]);

  const visibleCrons = useMemo(() => {
    const list = categoryScopedCrons.filter((c) => {
      const runs = c.totalRuns24h || 0;
      const fails = c.failedRuns24h || 0;
      const isFailing = fails > 0 || (c.lastExecution && c.lastExecution.status !== "healthy");
      const isUntriggered = !c.lastExecution && runs === 0;
      const isActive = runs > 0;

      if (statusFilter === "failing") {
        if (!isFailing) return false;
      } else if (statusFilter === "healthy") {
        if (isFailing || isUntriggered) return false;
      } else if (statusFilter === "untriggered") {
        if (!isUntriggered) return false;
      } else if (statusFilter === "active24h") {
        if (!isActive) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRoute = c.route.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        if (!matchesName && !matchesRoute && !matchesDesc) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "category") {
        cmp = a.category.localeCompare(b.category);
      } else if (sortField === "totalRuns24h") {
        cmp = (a.totalRuns24h || 0) - (b.totalRuns24h || 0);
      } else if (sortField === "successRate24h") {
        cmp = (a.successRate24h || 0) - (b.successRate24h || 0);
      } else if (sortField === "duration") {
        cmp = (a.lastExecution?.durationMs || 0) - (b.lastExecution?.durationMs || 0);
      } else if (sortField === "lastRun") {
        const timeA = a.lastExecution ? new Date(a.lastExecution.timestamp).getTime() : 0;
        const timeB = b.lastExecution ? new Date(b.lastExecution.timestamp).getTime() : 0;
        cmp = timeA - timeB;
      } else if (sortField === "nextRun") {
        const nextA = getNextCronRun(a.schedule).timestamp;
        const nextB = getNextCronRun(b.schedule).timestamp;
        cmp = nextA - nextB;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [categoryScopedCrons, statusFilter, searchQuery, sortField, sortOrder]);

  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] font-outfit pb-24">
      {/* Top Navigation Bar with Back Button */}
      <div className="sticky top-0 z-40 bg-[var(--divine-bg,#FAF6EF)]/90 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--brand-muted)] hover:text-gray-900 text-xs font-bold transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to Command Center</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif theme-ink leading-tight">Cron Health & Automation Telemetry</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  24h Telemetry Matrix
                </span>
              </div>
              <p className="text-[11px] text-[var(--brand-muted)]">Real-time status, layman next-run predictor, 24-hour timeline & clickable execution inspector</p>
            </div>
          </div>

          <button
            onClick={() => void fetchCrons()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10 text-xs font-bold theme-ink hover:border-[var(--premium-gold)] transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-amber-600" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh Matrix"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0 text-rose-600" />
            <div className="flex-1 font-medium">{error}</div>
            <button onClick={() => void fetchCrons()} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs">
              Retry
            </button>
          </div>
        )}

        {/* ─── NOTIFICATION QUEUE & DISPATCH DIAGNOSTICS LEDGER ──────────────── */}
        <div className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700">
                <Send size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base font-serif theme-ink">Notification Schedule Queue & Dispatch Ledger</h3>
                <p className="text-xs text-[var(--brand-muted)]">
                  Live state of the 2-stage reminder architecture (Enqueuers schedule into <code className="font-mono text-amber-800 bg-amber-50 px-1 py-0.5 rounded">notification_schedule</code> → Dispatcher claims and sends).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setDispatchingQueue(true);
                  try {
                    await fetch("/api/notifications/dispatch", { method: "POST" });
                    await fetchCrons();
                  } catch {}
                  setDispatchingQueue(false);
                }}
                disabled={dispatchingQueue}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={dispatchingQueue ? "animate-spin" : ""} />
                <span>{dispatchingQueue ? "Dispatching..." : "⚡ Trigger Dispatcher Now"}</span>
              </button>

              <button
                onClick={() => setShowQueueDetails(!showQueueDetails)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-black/10 text-xs font-bold hover:bg-black/5 transition-all"
              >
                <Inbox size={14} />
                <span>{showQueueDetails ? "Collapse Stream" : "Inspect Stream"}</span>
                {showQueueDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Interactive Queue Metric Cards (Clickable Filters) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => {
                setQueueFilter(queueFilter === "pending" ? "all" : "pending");
                setShowQueueDetails(true);
              }}
              className={"text-left p-4 rounded-xl border transition-all cursor-pointer " + (
                queueFilter === "pending"
                  ? "bg-amber-100/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm "
                  : "bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/60 "
              )}
            >
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[11px] font-bold uppercase tracking-wider">🟡 Pending Queue</span>
                <Clock size={15} />
              </div>
              <div className="text-2xl font-bold font-serif text-amber-900 mt-1">{queue.pending}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-amber-700">Enqueued for send</p>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">Click to filter</span>
              </div>
            </button>

            <button
              onClick={() => {
                setQueueFilter(queueFilter === "claimed" ? "all" : "claimed");
                setShowQueueDetails(true);
              }}
              className={"text-left p-4 rounded-xl border transition-all cursor-pointer " + (
                queueFilter === "claimed"
                  ? "bg-blue-100/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm "
                  : "bg-blue-50/60 border-blue-200/80 hover:bg-blue-100/60 "
              )}
            >
              <div className="flex items-center justify-between text-blue-800">
                <span className="text-[11px] font-bold uppercase tracking-wider">🔵 Active Claims</span>
                <Activity size={15} />
              </div>
              <div className="text-2xl font-bold font-serif text-blue-900 mt-1">{queue.claimed}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-blue-700">Claimed by dispatch</p>
                <span className="text-[9px] font-bold text-blue-800 bg-blue-200/60 px-1.5 py-0.2 rounded">Click to filter</span>
              </div>
            </button>

            <button
              onClick={() => {
                setQueueFilter(queueFilter === "sent" ? "all" : "sent");
                setShowQueueDetails(true);
              }}
              className={"text-left p-4 rounded-xl border transition-all cursor-pointer " + (
                queueFilter === "sent"
                  ? "bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm "
                  : "bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/60 "
              )}
            >
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] font-bold uppercase tracking-wider">🟢 Dispatched (Sent)</span>
                <CheckCircle size={15} />
              </div>
              <div className="text-2xl font-bold font-serif text-emerald-900 mt-1">{queue.sent}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-emerald-700">Delivered to APNs/FCM</p>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-200/60 px-1.5 py-0.2 rounded">Click to filter</span>
              </div>
            </button>

            <button
              onClick={() => {
                setQueueFilter(queueFilter === "failed" ? "all" : "failed");
                setShowQueueDetails(true);
              }}
              className={"text-left p-4 rounded-xl border transition-all cursor-pointer " + (
                queueFilter === "failed"
                  ? "bg-rose-100/80 border-rose-500 ring-2 ring-rose-500/20 shadow-sm "
                  : "bg-rose-50/60 border-rose-200/80 hover:bg-rose-100/60 "
              )}
            >
              <div className="flex items-center justify-between text-rose-800">
                <span className="text-[11px] font-bold uppercase tracking-wider">🔴 Dead / Failed</span>
                <XCircle size={15} />
              </div>
              <div className="text-2xl font-bold font-serif text-rose-900 mt-1">{queue.failed}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-rose-700">Failed / pruned tokens</p>
                <span className="text-[9px] font-bold text-rose-800 bg-rose-200/60 px-1.5 py-0.2 rounded">Click to filter</span>
              </div>
            </button>
          </div>

          {/* Expandable Scheduled Message Stream with Search & Inspection */}
          {showQueueDetails && (
            <div className="pt-4 border-t border-black/5 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Filtered View:</span>
                  {["all", "pending", "claimed", "sent", "failed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setQueueFilter(st)}
                      className={"px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase transition-all " + (
                        queueFilter === st ? "bg-amber-800 text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 text-gray-400" size={13} />
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Search scheduled title, key, type..."
                    className="pl-8 pr-3 py-1 rounded-xl border text-xs focus:outline-none focus:border-amber-600 bg-gray-50/50 w-64"
                  />
                </div>
              </div>

              {(() => {
                const filteredRecent = queue.recent.filter((item) => {
                  if (queueFilter !== "all" && item.status !== queueFilter) return false;
                  if (queueSearch.trim()) {
                    const q = queueSearch.toLowerCase();
                    const matchTitle = item.title?.toLowerCase().includes(q);
                    const matchBody = item.body?.toLowerCase().includes(q);
                    const matchKey = item.notification_key?.toLowerCase().includes(q);
                    const matchType = item.notification_type?.toLowerCase().includes(q);
                    if (!matchTitle && !matchBody && !matchKey && !matchType) return false;
                  }
                  return true;
                });

                if (filteredRecent.length === 0) {
                  return (
                    <p className="p-6 text-center text-xs text-gray-400 border border-dashed rounded-xl bg-gray-50/50">
                      No scheduled messages match filter <strong className="uppercase">[{queueFilter}]</strong>.
                    </p>
                  );
                }

                return (
                  <div className="divide-y border rounded-xl overflow-hidden text-xs bg-gray-50/50 max-h-80 overflow-y-auto">
                    {filteredRecent.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setInspectQueueItem(item)}
                        className="p-3 flex items-start justify-between gap-3 hover:bg-amber-50/40 cursor-pointer transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <b className="text-gray-900 truncate">{item.title}</b>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/5 shrink-0">{item.notification_type}</span>
                            <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 " + (
                              item.status === "sent" ? "bg-emerald-100 text-emerald-800" :
                              item.status === "claimed" ? "bg-blue-100 text-blue-800" :
                              item.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                            )}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-gray-600 truncate">{item.body}</p>
                          <p className="font-mono text-[10px] text-gray-400 truncate">Key: {item.notification_key}</p>
                        </div>
                        <div className="text-right text-[11px] font-mono shrink-0 text-gray-500">
                          <p>Target: {new Date(item.send_at).toLocaleTimeString()}</p>
                          {item.error ? (
                            <p className="text-rose-600 font-bold mt-0.5 truncate max-w-40">{item.error}</p>
                          ) : (
                            <span className="text-[10px] text-amber-800 underline">Inspect &rarr;</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Queue Item Detail Modal */}
          {inspectQueueItem && (
            <div role="dialog" aria-modal="true" aria-label="Scheduled Notification Details" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 motion-reduce:animate-none">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Send size={16} className="text-amber-700" />
                    <h3 className="font-bold text-sm text-gray-900">Scheduled Message Details</h3>
                  </div>
                  <button onClick={() => setInspectQueueItem(null)} className="text-gray-400 hover:text-gray-900 font-bold text-sm">✕</button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Title</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{inspectQueueItem.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Body Copy</span>
                    <p className="text-gray-700 mt-0.5 bg-gray-50 p-2.5 rounded-xl border">{inspectQueueItem.body}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="bg-gray-50 p-2 rounded-lg border">
                      <span className="text-gray-400 block text-[9px]">Status</span>
                      <strong className="uppercase">{inspectQueueItem.status}</strong>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border">
                      <span className="text-gray-400 block text-[9px]">Notification Type</span>
                      <strong>{inspectQueueItem.notification_type}</strong>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border">
                      <span className="text-gray-400 block text-[9px]">Scheduled Send Time</span>
                      <strong>{new Date(inspectQueueItem.send_at).toLocaleString()}</strong>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border">
                      <span className="text-gray-400 block text-[9px]">Deduplication Key</span>
                      <strong className="truncate block">{inspectQueueItem.notification_key}</strong>
                    </div>
                  </div>
                  {inspectQueueItem.error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-mono text-[11px]">
                      <strong>Failure Error:</strong> {inspectQueueItem.error}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setInspectQueueItem(null)}
                    className="px-4 py-1.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 24H GLOBAL METRIC CARDS (CLICKABLE FILTERS) ─────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={() => setStatusFilter("all")}
            className="text-left glass-panel p-5 rounded-2xl bg-white border border-black/5 shadow-sm  hover:border-amber-500/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total in Scope</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-bold font-serif theme-ink">{metrics.total}</div>
            <p className="text-[11px] text-[var(--brand-muted)] mt-1">Click to show all in category</p>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === "active24h" ? "all" : "active24h")}
            className={"text-left glass-panel p-5 rounded-2xl border shadow-sm  transition-all cursor-pointer " + (
              statusFilter === "active24h" ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20" : "bg-white border-emerald-500/20 hover:border-emerald-500/50"
            )}
          >
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">24h Total Runs</span>
              <Activity size={16} />
            </div>
            <div className="text-3xl font-bold font-serif text-emerald-600">{metrics.total24hRuns}</div>
            <p className="text-[11px] text-emerald-600/80 mt-1">{metrics.globalSuccessRate24h}% global success rate</p>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === "failing" ? "all" : "failing")}
            className={"text-left glass-panel p-5 rounded-2xl border shadow-sm  transition-all cursor-pointer " + (
              statusFilter === "failing" ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20" : "bg-white border-rose-500/20 hover:border-rose-500/50"
            )}
          >
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">24h Failures</span>
              <AlertTriangle size={16} />
            </div>
            <div className="text-3xl font-bold font-serif text-rose-600">{metrics.total24hFailures}</div>
            <p className="text-[11px] text-rose-600/80 mt-1">{metrics.failing} crons with errors</p>
          </button>

          <div className="glass-panel p-5 rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
              <Zap size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-bold font-serif theme-ink">{metrics.avgLatency} ms</div>
            <p className="text-[11px] text-[var(--brand-muted)] mt-1">Execution duration</p>
          </div>

          <button
            onClick={() => setStatusFilter(statusFilter === "untriggered" ? "all" : "untriggered")}
            className={"text-left glass-panel p-5 rounded-2xl border shadow-sm  transition-all cursor-pointer " + (
              statusFilter === "untriggered" ? "bg-gray-100 border-gray-400 ring-2 ring-gray-400/20" : "bg-white border-black/5 hover:border-gray-400"
            )}
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Untriggered</span>
              <Info size={16} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold font-serif theme-ink">{metrics.untriggered}</div>
            <p className="text-[11px] text-[var(--brand-muted)] mt-1">Click to filter untriggered</p>
          </button>
        </div>

        {/* Live Manual Execution Result Drawer */}
        {runResult && (
          <div className={"p-6 rounded-2xl border transition-all shadow-sm space-y-3 " + (
            runResult.ok ? "bg-emerald-500/5 border-emerald-500/30" : "bg-rose-500/5 border-rose-500/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {runResult.ok ? (
                  <CheckCircle size={18} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={18} className="text-rose-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider theme-ink">
                  Manual Run Result: <code className="text-amber-700">{runResult.route}</code>
                </span>
                <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold " + (
                  runResult.ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                )}>
                  HTTP {runResult.status} ({runResult.duration_ms}ms)
                </span>
              </div>
              <button
                onClick={() => setRunResult(null)}
                className="text-xs text-[var(--brand-muted)] hover:theme-ink font-bold"
              >
                Dismiss
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-black/10">
              {JSON.stringify(runResult.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Controls, Filters & Search */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={"flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all " + (
                      active
                        ? "bg-[var(--premium-gold,#C5A059)] text-white shadow-md shadow-amber-500/20"
                        : "bg-white border border-black/5 text-[var(--brand-muted)] hover:bg-black/5"
                    )}
                  >
                    <Icon size={14} />
                    <span>{meta.label}</span>
                    <span className={"px-1.5 py-0.5 rounded-full text-[10px] " + (active ? "bg-white/20 text-white" : "bg-black/5 text-gray-500")}>
                      {categoryCounts[key] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Status Dropdown */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search crons or routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs theme-ink focus:outline-none focus:border-[var(--premium-gold)]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-bold theme-ink focus:outline-none focus:border-[var(--premium-gold)]"
              >
                <option value="all">All Telemetry States</option>
                <option value="active24h">Ran in Last 24h</option>
                <option value="failing">Failing / Errors in 24h</option>
                <option value="healthy">100% Healthy (200)</option>
                <option value="untriggered">Untriggered / Silent</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Badges (100% Synced) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-1">Quick Filters:</span>
            <button
              onClick={() => setStatusFilter("all")}
              className={"px-2.5 py-1 rounded-lg font-bold text-xs transition-colors " + (statusFilter === "all" ? "bg-amber-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
            >
              All ({metrics.total})
            </button>
            <button
              onClick={() => setStatusFilter("failing")}
              className={"px-2.5 py-1 rounded-lg font-bold text-xs transition-colors " + (statusFilter === "failing" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100")}
            >
              ⚠️ Failing in 24h ({metrics.failing})
            </button>
            <button
              onClick={() => setStatusFilter("active24h")}
              className={"px-2.5 py-1 rounded-lg font-bold text-xs transition-colors " + (statusFilter === "active24h" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100")}
            >
              ⚡ Active in 24h ({metrics.active24h})
            </button>
            <button
              onClick={() => setStatusFilter("untriggered")}
              className={"px-2.5 py-1 rounded-lg font-bold text-xs transition-colors " + (statusFilter === "untriggered" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              Silent / Untriggered ({metrics.untriggered})
            </button>
          </div>
        </div>

        {/* Cron Telemetry Table */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          {/* Table Header with Sorting */}
          <div className="px-6 py-3 bg-black/[0.02] border-b border-black/5 text-[11px] font-bold text-gray-500 uppercase tracking-wider grid grid-cols-12 gap-4 items-center">
            <button
              onClick={() => toggleSort("name")}
              className="col-span-12 sm:col-span-3 flex items-center gap-1.5 hover:theme-ink text-left"
            >
              <span>Cron Routine & Path</span>
              {sortField === "name" ? (
                sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
              ) : <ArrowUpDown size={12} className="opacity-40" />}
            </button>

            <button
              onClick={() => toggleSort("nextRun")}
              className="hidden sm:block sm:col-span-2 flex items-center gap-1.5 hover:theme-ink text-left"
            >
              <span>Next Scheduled Run</span>
              {sortField === "nextRun" ? (
                sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
              ) : <ArrowUpDown size={12} className="opacity-40" />}
            </button>

            <div className="hidden sm:block sm:col-span-3 text-left">
              <span>24h Timeline (Hourly Sparkline)</span>
            </div>

            <button
              onClick={() => toggleSort("lastRun")}
              className="hidden sm:block sm:col-span-3 flex items-center gap-1.5 hover:theme-ink text-left"
            >
              <span>Last Execution & Status</span>
              {sortField === "lastRun" ? (
                sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
              ) : <ArrowUpDown size={12} className="opacity-40" />}
            </button>

            <div className="col-span-12 sm:col-span-1 text-right">
              <span>Action</span>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-black/5">
            {visibleCrons.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--brand-muted)]">
                No crons match the selected filters or search query.
              </div>
            ) : (
              visibleCrons.map((cron) => {
                const isRunning = runningRoute === cron.route;
                const isExpanded = expandedCron === cron.id;
                const last = cron.lastExecution;
                const nextRunInfo = getNextCronRun(cron.schedule);

                return (
                  <div key={cron.id} className="transition-colors hover:bg-black/[0.01]">
                    <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                      {/* Name & Route */}
                      <div className="col-span-12 sm:col-span-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <b className="text-sm theme-ink">{cron.name}</b>
                          {last?.status === "healthy" ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Healthy" />
                          ) : last?.status === "error" ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Error" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-300" title="Untriggered" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--brand-muted)]">
                          <code className="bg-black/5 px-1.5 py-0.5 rounded text-amber-800">{cron.route}</code>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 text-gray-700">
                          {cron.category}
                        </span>
                      </div>

                      {/* Next Scheduled Run (Layman Language) */}
                      <div className="hidden sm:block sm:col-span-2 text-xs space-y-0.5">
                        <b className="text-gray-900 leading-snug block">{nextRunInfo.human}</b>
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-bold font-mono text-[10px] border border-amber-200/60">
                          {nextRunInfo.relative}
                        </span>
                        <p className="text-[10px] text-gray-400 font-mono">{cron.schedule}</p>
                      </div>

                      {/* 24h Timeline Sparkline */}
                      <div className="hidden sm:block sm:col-span-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-gray-600">
                            {cron.totalRuns24h > 0 ? (cron.totalRuns24h + " runs in 24h") : "0 runs"}
                          </span>
                          <span className={cron.successRate24h === 100 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                            {cron.successRate24h}% ok
                          </span>
                        </div>

                        {/* 24 Hourly Blocks */}
                        <div className="flex items-center gap-0.5 h-4 bg-gray-100 rounded p-0.5">
                          {(cron.hourlyBreakdown24h || []).map((bucket, idx) => (
                            <div
                              key={idx}
                              title={bucket.hourLabel + " UTC: " + bucket.count + " run(s), " + bucket.errorCount + " error(s) (" + bucket.avgDurationMs + "ms)"}
                              className={"flex-1 h-full rounded-[2px] transition-colors " + (
                                bucket.status === "healthy" ? "bg-emerald-500" :
                                bucket.status === "error" ? "bg-rose-500" : "bg-gray-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Last Execution Info (Clickable for Detailed Diagnostic Inspector) */}
                      <div className="hidden sm:block sm:col-span-3 text-xs space-y-1">
                        {last ? (
                          <button
                            onClick={() => setInspectExecution({ cronName: cron.name, route: cron.route, log: last })}
                            className={"text-left w-full p-2 rounded-xl border transition-all  cursor-pointer " + (
                              last.status === "healthy"
                                ? "bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 text-emerald-900"
                                : "bg-rose-50/70 border-rose-300 hover:border-rose-500 text-rose-900"
                            )}
                            title="Click to view detailed execution diagnostics & payload"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1">
                                {last.status === "healthy" ? <Check size={13} className="text-emerald-600" /> : <AlertTriangle size={13} className="text-rose-600" />}
                                <span>HTTP {last.statusCode} ({last.durationMs}ms)</span>
                              </span>
                              <span className="text-[10px] underline font-sans opacity-70">Inspect →</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mt-0.5">
                              <span>{new Date(last.timestamp).toLocaleTimeString()}</span>
                              <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-white font-sans">{last.triggeredBy}</span>
                            </div>
                            {last.errorMessage && (
                              <p className="text-[10px] text-rose-700 truncate font-semibold mt-0.5">
                                {last.errorMessage}
                              </p>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic text-[11px] block p-2 border border-dashed rounded-xl bg-gray-50/50">
                            No runs recorded in 24h
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-12 sm:col-span-1 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setExpandedCron(isExpanded ? null : cron.id)}
                          className="p-2 rounded-xl border border-black/5 hover:bg-black/5 text-gray-500"
                          title="View 10 recent logs"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <button
                          onClick={() => void triggerCron(cron.route)}
                          disabled={isRunning}
                          className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
                          title="Trigger manual run"
                        >
                          <Play size={11} className={isRunning ? "animate-spin" : ""} />
                          <span>{isRunning ? "..." : "Run"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable History Drawer */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-black/[0.02] border-t border-black/5 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <b className="text-gray-700 uppercase tracking-wider text-[11px]">Last 10 Invocation Telemetry Logs (Click any log to inspect):</b>
                          <span className="font-mono text-gray-400 text-[11px]">Route: {cron.route}</span>
                        </div>

                        {cron.recentExecutions.length === 0 ? (
                          <p className="text-gray-400 italic">No execution telemetry recorded for this routine yet.</p>
                        ) : (
                          <div className="divide-y border rounded-xl overflow-hidden bg-white">
                            {cron.recentExecutions.map((log, idx) => (
                              <div
                                key={idx}
                                onClick={() => setInspectExecution({ cronName: cron.name, route: cron.route, log })}
                                className="p-3 flex items-start justify-between gap-4 font-mono text-[11px] cursor-pointer hover:bg-amber-50/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={"px-2 py-0.5 rounded font-bold " + (
                                      log.status === "healthy" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                    )}>
                                      HTTP {log.statusCode}
                                    </span>
                                    <span className="text-gray-500 font-sans">{new Date(log.timestamp).toLocaleString()}</span>
                                    <span className="text-gray-400 font-sans">({log.durationMs}ms)</span>
                                    <span className="px-2 py-0.5 rounded bg-black/5 text-gray-600 text-[10px] uppercase font-sans">
                                      {log.triggeredBy}
                                    </span>
                                  </div>
                                  {log.errorMessage && (
                                    <p className="text-rose-600 font-semibold">{log.errorMessage}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-right">
                                  <span className="text-amber-800 underline text-[11px] font-sans">Inspect Payload →</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── DETAILED EXECUTION DIAGNOSTIC INSPECTOR MODAL ──────────────────── */}
      {inspectExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto space-y-5 font-sans">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className={"p-2 rounded-xl " + (inspectExecution.log.status === "healthy" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
                  {inspectExecution.log.status === "healthy" ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-gray-900">{inspectExecution.cronName}</h3>
                  <p className="text-xs font-mono text-gray-500">{inspectExecution.route}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectExecution(null)}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            {/* Diagnostic Vitals Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border">
                <span className="text-gray-400 font-bold uppercase text-[10px] block">Status Code</span>
                <b className={"text-base " + (inspectExecution.log.status === "healthy" ? "text-emerald-700" : "text-rose-700")}>
                  HTTP {inspectExecution.log.statusCode}
                </b>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border">
                <span className="text-gray-400 font-bold uppercase text-[10px] block">Duration</span>
                <b className="text-base text-gray-900">{inspectExecution.log.durationMs} ms</b>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border">
                <span className="text-gray-400 font-bold uppercase text-[10px] block">Trigger Source</span>
                <b className="text-base text-gray-900 capitalize">{inspectExecution.log.triggeredBy.replace("_", " ")}</b>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border">
                <span className="text-gray-400 font-bold uppercase text-[10px] block">Timestamp</span>
                <b className="text-xs text-gray-900 font-mono block mt-1">{new Date(inspectExecution.log.timestamp).toLocaleTimeString()}</b>
              </div>
            </div>

            {/* Error Stack Display (if error present) */}
            {inspectExecution.log.errorMessage && (
              <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-sm">
                  <AlertTriangle size={16} />
                  <span>Error Diagnostics & Root Cause</span>
                </div>
                <p className="font-mono text-rose-800 bg-white p-3 rounded-lg border border-rose-200 text-xs leading-relaxed">
                  {inspectExecution.log.errorMessage}
                </p>
              </div>
            )}

            {/* JSON Payload Inspection & Copy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-gray-500">Execution Response & Payload Summary:</span>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(JSON.stringify(inspectExecution.log.payloadSummary || {}, null, 2));
                    setCopiedPayload(true);
                    setTimeout(() => setCopiedPayload(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  <Copy size={12} />
                  <span>{copiedPayload ? "Copied!" : "Copy Payload JSON"}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-64 border">
                {JSON.stringify(inspectExecution.log.payloadSummary || { message: "No extra payload metadata recorded." }, null, 2)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="text-gray-400">Durable log stored in monitoring_events</span>
              <button
                onClick={() => {
                  const r = inspectExecution.route;
                  setInspectExecution(null);
                  void triggerCron(r);
                }}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Play size={12} />
                <span>Re-run This Cron Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
