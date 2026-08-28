"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Clock, Play, AlertTriangle, CheckCircle, RefreshCw,
  Search, ShieldCheck, ArrowLeft, ChevronDown, ChevronUp,
  Activity, Zap, Info, Server, Sparkles, Calendar, Bell, Wrench,
  ArrowUpDown, ArrowUp, ArrowDown, Check, XCircle
} from "lucide-react";

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

interface CronItem {
  id: string;
  name: string;
  route: string;
  schedule: string;
  scheduleHuman: string;
  category: "reminders" | "calendar" | "ai" | "maintenance";
  description: string;
  method: "GET" | "POST";
  lastExecution: ExecutionLog | null;
  recentExecutions: ExecutionLog[];
  successRate24h: number;
  totalRuns24h: number;
  successfulRuns24h: number;
  failedRuns24h: number;
  hourlyBreakdown24h?: HourlyBucket24h[];
}

const CATEGORY_META = {
  all: { label: "All Crons", icon: Activity },
  reminders: { label: "Devotional Reminders", icon: Bell },
  calendar: { label: "Calendar & Panchang", icon: Calendar },
  ai: { label: "AI & Content Generation", icon: Sparkles },
  maintenance: { label: "System Maintenance", icon: Wrench },
};

type SortField = "name" | "category" | "totalRuns24h" | "successRate24h" | "lastRun" | "duration";
type SortOrder = "asc" | "desc";

export default function CronDashboardClient() {
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [sortField, setSortField] = useState<SortField>("lastRun");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [runningRoute, setRunningRoute] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ route: string; ok: boolean; status: number; duration_ms: number; result: unknown } | null>(null);
  const [expandedCronId, setExpandedCronId] = useState<string | null>(null);

  const fetchCrons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crons");
      if (!res.ok) throw new Error(`Failed to fetch cron status (HTTP ${res.status})`);
      const data = await res.json();
      setCrons(data.crons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading crons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCrons();
  }, [fetchCrons]);

  const handleRunCron = async (cronPath: string) => {
    setRunningRoute(cronPath);
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/crons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronPath }),
      });
      const data = await res.json();
      setRunResult({
        route: cronPath,
        ok: data.ok ?? res.ok,
        status: data.status ?? res.status,
        duration_ms: data.duration_ms ?? 0,
        result: data.result ?? data,
      });
      fetchCrons();
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
      setSortOrder(field === "name" ? "asc" : "desc");
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = crons.length;
    let healthy = 0;
    let failing = 0;
    let untriggered = 0;
    let total24hRuns = 0;
    let total24hFailures = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const c of crons) {
      total24hRuns += (c.totalRuns24h || 0);
      total24hFailures += (c.failedRuns24h || 0);

      if (!c.lastExecution) {
        untriggered++;
      } else if (c.lastExecution.status === "healthy") {
        healthy++;
      } else {
        failing++;
      }

      if (c.lastExecution?.durationMs) {
        totalLatency += c.lastExecution.durationMs;
        latencyCount++;
      }
    }

    const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
    const globalSuccessRate24h = total24hRuns > 0 ? Math.round(((total24hRuns - total24hFailures) / total24hRuns) * 100) : 100;

    return {
      total,
      healthy,
      failing,
      untriggered,
      total24hRuns,
      total24hFailures,
      globalSuccessRate24h,
      avgLatency
    };
  }, [crons]);

  // Filtered and Sorted Crons
  const visibleCrons = useMemo(() => {
    const list = crons.filter((c) => {
      if (selectedCategory !== "all" && c.category !== selectedCategory) return false;

      if (statusFilter === "failing") {
        if (c.failedRuns24h === 0 && (!c.lastExecution || c.lastExecution.status === "healthy")) return false;
      } else if (statusFilter === "healthy") {
        if (!c.lastExecution || c.lastExecution.status !== "healthy" || c.failedRuns24h > 0) return false;
      } else if (statusFilter === "untriggered") {
        if (c.lastExecution || c.totalRuns24h > 0) return false;
      } else if (statusFilter === "active24h") {
        if (c.totalRuns24h === 0) return false;
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
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [crons, selectedCategory, statusFilter, searchQuery, sortField, sortOrder]);

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
                  24h Telemetry
                </span>
              </div>
              <p className="text-[11px] text-[var(--brand-muted)]">Real-time status, 24-hour run timeline, failure diagnostics & manual test runner</p>
            </div>
          </div>

          <button
            onClick={fetchCrons}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10 text-xs font-bold theme-ink hover:border-[var(--premium-gold)] transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-amber-500" : "text-gray-500"} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-panel p-5 rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Scheduled</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-bold font-serif theme-ink">{metrics.total}</div>
            <p className="text-[11px] text-[var(--brand-muted)] mt-1">Configured in vercel.json</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl bg-white border border-emerald-500/20 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">24h Total Runs</span>
              <Activity size={16} />
            </div>
            <div className="text-3xl font-bold font-serif text-emerald-600">{metrics.total24hRuns}</div>
            <p className="text-[11px] text-emerald-600/80 mt-1">{metrics.globalSuccessRate24h}% global success rate</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl bg-white border border-rose-500/20 shadow-sm">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">24h Failures</span>
              <AlertTriangle size={16} />
            </div>
            <div className="text-3xl font-bold font-serif text-rose-600">{metrics.total24hFailures}</div>
            <p className="text-[11px] text-rose-600/80 mt-1">{metrics.failing} crons currently failing</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
              <Zap size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-bold font-serif theme-ink">{metrics.avgLatency} ms</div>
            <p className="text-[11px] text-[var(--brand-muted)] mt-1">Execution duration</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Untriggered</span>
              <Info size={16} className="text-gray-400" />
            </div>
            <div className="text-3xl font-bold font-serif theme-ink">{metrics.untriggered}</div>
            <p className="text-[11px] text-[var(--brand-muted)] mt-1">No telemetry recorded</p>
          </div>
        </div>

        {/* Live Manual Execution Result Drawer */}
        {runResult && (
          <div className={`p-6 rounded-2xl border transition-all shadow-sm space-y-3 ${
            runResult.ok ? "bg-emerald-500/5 border-emerald-500/30" : "bg-rose-500/5 border-rose-500/30"
          }`}>
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
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  runResult.ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? "bg-[var(--premium-gold,#C5A059)] text-white shadow-md shadow-amber-500/20"
                        : "bg-white border border-black/5 text-[var(--brand-muted)] hover:bg-black/5"
                    }`}
                  >
                    <Icon size={14} />
                    {meta.label}
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

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mr-1">Quick Filters:</span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${statusFilter === "all" ? "bg-amber-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              All ({crons.length})
            </button>
            <button
              onClick={() => setStatusFilter("failing")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${statusFilter === "failing" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100"}`}
            >
              ⚠️ Failing in 24h ({metrics.failing})
            </button>
            <button
              onClick={() => setStatusFilter("active24h")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${statusFilter === "active24h" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
            >
              ⚡ Active in 24h ({crons.filter((c) => (c.totalRuns24h || 0) > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter("untriggered")}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${statusFilter === "untriggered" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
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
              className="col-span-12 lg:col-span-4 flex items-center gap-1.5 hover:text-gray-900 text-left"
            >
              <span>Cron Routine & Route</span>
              {sortField === "name" ? (
                sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
              ) : <ArrowUpDown size={12} className="opacity-40" />}
            </button>

            <div className="hidden lg:block col-span-3 text-left">
              <span>Last 24h Run Timeline (Hourly)</span>
            </div>

            <button
              onClick={() => toggleSort("totalRuns24h")}
              className="hidden lg:flex col-span-2 items-center gap-1.5 hover:text-gray-900 justify-center"
            >
              <span>24h Runs & Health</span>
              {sortField === "totalRuns24h" ? (
                sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
              ) : <ArrowUpDown size={12} className="opacity-40" />}
            </button>

            <button
              onClick={() => toggleSort("lastRun")}
              className="hidden lg:flex col-span-2 items-center gap-1.5 hover:text-gray-900 justify-end"
            >
              <span>Last Executed</span>
              {sortField === "lastRun" ? (
                sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
              ) : <ArrowUpDown size={12} className="opacity-40" />}
            </button>

            <div className="hidden lg:block col-span-1 text-right">
              <span>Action</span>
            </div>
          </div>

          {loading && crons.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-[var(--brand-muted)]">
              <RefreshCw size={24} className="animate-spin text-amber-500" />
              <p className="text-xs font-bold">Loading cron telemetry matrix...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 text-xs space-y-2">
              <AlertTriangle size={24} className="mx-auto" />
              <p className="font-bold">{error}</p>
            </div>
          ) : visibleCrons.length === 0 ? (
            <div className="p-16 text-center text-gray-400 text-xs font-bold">
              No crons match your current filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {visibleCrons.map((cron) => {
                const last = cron.lastExecution;
                const isExpanded = expandedCronId === cron.id;
                const isRunning = runningRoute === cron.route;

                const isHealthy = last?.status === "healthy" && (cron.failedRuns24h || 0) === 0;
                const hasErrors = (cron.failedRuns24h || 0) > 0 || (last && last.status !== "healthy");

                return (
                  <div key={cron.id} className="transition-colors hover:bg-black/[0.01]">
                    <div className="p-5 grid grid-cols-12 gap-4 items-center">
                      {/* Column 1: Info */}
                      <div className="col-span-12 lg:col-span-4 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold theme-ink">{cron.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-mono text-gray-600 font-bold">
                            {cron.method}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-bold">
                            {cron.scheduleHuman}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--brand-muted)] line-clamp-1">{cron.description}</p>

                        <div className="flex items-center gap-2 pt-0.5">
                          <code className="text-[11px] font-mono text-amber-700 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15 truncate max-w-sm">
                            {cron.route}
                          </code>
                        </div>
                      </div>

                      {/* Column 2: 24h Hourly Timeline Sparkline */}
                      <div className="col-span-12 lg:col-span-3 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span>-24h</span>
                          <span>Now</span>
                        </div>

                        {/* 24 Bar timeline */}
                        <div className="flex items-center gap-0.5 h-6 bg-gray-50 p-1 rounded-lg border border-black/5">
                          {(cron.hourlyBreakdown24h || []).map((b, idx) => {
                            let barColor = "bg-gray-200";
                            let title = `Hour ${b.hourLabel} UTC: No runs`;
                            if (b.status === "healthy") {
                              barColor = "bg-emerald-500";
                              title = `Hour ${b.hourLabel} UTC: ${b.count} run(s) OK (${b.avgDurationMs}ms)`;
                            } else if (b.status === "error") {
                              barColor = "bg-rose-500";
                              title = `Hour ${b.hourLabel} UTC: ${b.errorCount}/${b.count} failed`;
                            }

                            return (
                              <div
                                key={idx}
                                title={title}
                                className={`flex-1 h-full rounded-sm transition-all hover:scale-125 cursor-pointer ${barColor}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Column 3: 24h Run Breakdown */}
                      <div className="col-span-6 lg:col-span-2 text-left lg:text-center space-y-1">
                        <div className="flex items-center lg:justify-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            cron.totalRuns24h === 0
                              ? "bg-gray-100 text-gray-600"
                              : cron.failedRuns24h === 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {cron.totalRuns24h} runs in 24h
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-gray-500 flex items-center lg:justify-center gap-2">
                          <span className="text-emerald-700">✓ {cron.successfulRuns24h ?? (cron.totalRuns24h - cron.failedRuns24h)}</span>
                          {cron.failedRuns24h > 0 && <span className="text-rose-600 font-bold">✗ {cron.failedRuns24h}</span>}
                          <span className="text-gray-400">({cron.successRate24h}%)</span>
                        </div>
                      </div>

                      {/* Column 4: Last Execution Status */}
                      <div className="col-span-6 lg:col-span-2 text-right space-y-0.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {last ? (
                            last.status === "healthy" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <CheckCircle size={10} /> {last.statusCode} OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                <AlertTriangle size={10} /> HTTP {last.statusCode}
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                              Untriggered
                            </span>
                          )}
                          {last && (
                            <span className="text-[10px] font-mono text-gray-400">
                              {last.durationMs}ms
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-400 font-mono">
                          {last ? new Date(last.timestamp).toLocaleString() : "No telemetry"}
                        </p>

                        {hasErrors && last?.errorMessage && (
                          <p className="text-[10px] text-rose-600 font-medium max-w-xs truncate" title={last.errorMessage}>
                            Reason: {last.errorMessage}
                          </p>
                        )}
                      </div>

                      {/* Column 5: Action Controls */}
                      <div className="col-span-12 lg:col-span-1 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRunCron(cron.route)}
                          disabled={isRunning}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-[var(--premium-gold,#C5A059)] hover:text-white text-xs font-bold theme-ink transition-all disabled:opacity-50 shadow-sm"
                          title="Run this cron immediately"
                        >
                          <Play size={12} className={isRunning ? "animate-spin" : ""} />
                          <span className="hidden sm:inline">{isRunning ? "..." : "Run"}</span>
                        </button>

                        <button
                          onClick={() => setExpandedCronId(isExpanded ? null : cron.id)}
                          className="p-1.5 rounded-xl hover:bg-black/5 text-gray-400 hover:theme-ink transition-all"
                          title="View 24h logs and telemetry details"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable 24-Hour Invocations Drawer */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-3 bg-black/[0.02] border-t border-black/5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                          <span className="font-bold theme-ink">24-Hour Execution Telemetry Logs</span>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span>Total 24h Runs: <strong>{cron.totalRuns24h}</strong></span>
                            <span>Success Rate: <strong className="text-emerald-700">{cron.successRate24h}%</strong></span>
                            <span>Schedule: <code className="text-amber-800 font-mono">{cron.schedule}</code></span>
                          </div>
                        </div>

                        {/* Recent Executions List */}
                        {cron.recentExecutions.length === 0 ? (
                          <p className="text-xs text-gray-400 py-3 italic">No recent telemetry events found in monitoring_events.</p>
                        ) : (
                          <div className="space-y-2">
                            {cron.recentExecutions.map((e, idx) => (
                              <div
                                key={e.id || idx}
                                className="p-3 rounded-xl bg-white border border-black/5 flex flex-wrap items-center justify-between text-xs font-mono gap-2 shadow-2xs"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    e.status === "healthy" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    HTTP {e.statusCode}
                                  </span>
                                  <span className="text-gray-600 font-medium">{new Date(e.timestamp).toLocaleString()}</span>
                                  <span className="text-gray-400 font-medium">({e.durationMs}ms)</span>
                                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    {e.triggeredBy}
                                  </span>
                                </div>
                                {e.errorMessage && (
                                  <span className="text-rose-600 text-[11px] font-sans font-medium truncate max-w-md" title={e.errorMessage}>
                                    ⚠️ {e.errorMessage}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
