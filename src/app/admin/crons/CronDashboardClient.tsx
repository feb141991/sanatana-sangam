"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Clock, Play, AlertTriangle, CheckCircle, RefreshCw,
  Search, ShieldCheck, ArrowLeft, ChevronDown, ChevronUp,
  Activity, Zap, Info, Server, Sparkles, Calendar, Bell, Wrench
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
  payloadSummary?: Record<string, any> | null;
  triggeredBy: "vercel_cron" | "admin_manual";
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
}

const CATEGORY_META = {
  all: { label: "All Crons", icon: Activity },
  reminders: { label: "Devotional Reminders", icon: Bell },
  calendar: { label: "Calendar & Panchang", icon: Calendar },
  ai: { label: "AI & Content Generation", icon: Sparkles },
  maintenance: { label: "System Maintenance", icon: Wrench },
};

export default function CronDashboardClient() {
  const [crons, setCrons] = useState<CronItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [runningRoute, setRunningRoute] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ route: string; ok: boolean; status: number; duration_ms: number; result: any } | null>(null);
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
    fetchCrons();
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
      // Refresh telemetry table in background
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

  // Metrics
  const metrics = useMemo(() => {
    const total = crons.length;
    let healthy = 0;
    let failing = 0;
    let untriggered = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    for (const c of crons) {
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
    return { total, healthy, failing, untriggered, avgLatency };
  }, [crons]);

  // Filtered Crons
  const filteredCrons = useMemo(() => {
    return crons.filter((c) => {
      if (selectedCategory !== "all" && c.category !== selectedCategory) return false;
      
      if (statusFilter === "failing") {
        if (!c.lastExecution || c.lastExecution.status === "healthy") return false;
      } else if (statusFilter === "healthy") {
        if (!c.lastExecution || c.lastExecution.status !== "healthy") return false;
      } else if (statusFilter === "untriggered") {
        if (c.lastExecution) return false;
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
  }, [crons, selectedCategory, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] font-outfit pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--divine-bg,#FAF6EF)]/90 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif theme-ink leading-tight">Cron Health & Automation Telemetry</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  Vercel Crons
                </span>
              </div>
              <p className="text-[11px] text-[var(--brand-muted)]">Real-time status, failure reasons, telemetry & manual test runner</p>
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
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="text-xs font-bold uppercase tracking-wider">Healthy</span>
              <CheckCircle size={16} />
            </div>
            <div className="text-3xl font-bold font-serif text-emerald-600">{metrics.healthy}</div>
            <p className="text-[11px] text-emerald-600/80 mt-1">Returning HTTP 200 OK</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl bg-white border border-rose-500/20 shadow-sm">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Failing / Errors</span>
              <AlertTriangle size={16} />
            </div>
            <div className="text-3xl font-bold font-serif text-rose-600">{metrics.failing}</div>
            <p className="text-[11px] text-rose-600/80 mt-1">4xx, 5xx, or timeouts</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
              <Zap size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-bold font-serif theme-ink">{metrics.avgLatency} ms</div>
            <p className="text-[11px] text-[var(--brand-muted)] mt-1">Execution duration</p>
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

        {/* Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
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

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search crons..."
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
              <option value="all">All Statuses</option>
              <option value="failing">Failing Only</option>
              <option value="healthy">Healthy (200)</option>
              <option value="untriggered">Untriggered</option>
            </select>
          </div>
        </div>

        {/* Cron Table */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
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
          ) : filteredCrons.length === 0 ? (
            <div className="p-16 text-center text-gray-400 text-xs font-bold">
              No crons match your current filter.
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filteredCrons.map((cron) => {
                const last = cron.lastExecution;
                const isExpanded = expandedCronId === cron.id;
                const isRunning = runningRoute === cron.route;

                const isHealthy = last?.status === "healthy";
                const isError = last && last.status !== "healthy";

                return (
                  <div key={cron.id} className="transition-colors hover:bg-black/[0.01]">
                    <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold theme-ink">{cron.name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-mono text-gray-600 font-bold">
                            {cron.method}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-bold">
                            {cron.scheduleHuman}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            ({cron.schedule})
                          </span>
                        </div>

                        <p className="text-xs text-[var(--brand-muted)] line-clamp-1">{cron.description}</p>
                        
                        <div className="flex items-center gap-2 pt-0.5">
                          <code className="text-[11px] font-mono text-amber-700 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15">
                            {cron.route}
                          </code>
                        </div>
                      </div>

                      {/* Middle: Last Run Status & Telemetry */}
                      <div className="flex flex-wrap items-center gap-3 lg:gap-6 shrink-0">
                        <div className="text-left lg:text-right space-y-0.5">
                          <div className="flex items-center gap-1.5 lg:justify-end">
                            {last ? (
                              isHealthy ? (
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
                            {last ? new Date(last.timestamp).toLocaleString() : "No telemetry recorded"}
                          </p>

                          {isError && last.errorMessage && (
                            <p className="text-[10px] text-rose-600 font-medium max-w-xs truncate" title={last.errorMessage}>
                              Reason: {last.errorMessage}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRunCron(cron.route)}
                            disabled={isRunning}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/5 hover:bg-[var(--premium-gold,#C5A059)] hover:text-white text-xs font-bold theme-ink transition-all disabled:opacity-50"
                          >
                            <Play size={12} className={isRunning ? "animate-spin" : ""} />
                            {isRunning ? "Running..." : "Run Now"}
                          </button>

                          <button
                            onClick={() => setExpandedCronId(isExpanded ? null : cron.id)}
                            className="p-1.5 rounded-xl hover:bg-black/5 text-gray-400 hover:theme-ink transition-all"
                            title="View execution logs & history"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable History Drawer */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 bg-black/[0.02] border-t border-black/5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold theme-ink">Recent Telemetry Invocations (Last 10)</span>
                          <span className="text-[11px] text-[var(--brand-muted)]">
                            24h Success Rate: <strong>{cron.successRate24h}%</strong> ({cron.totalRuns24h} runs)
                          </span>
                        </div>

                        {cron.recentExecutions.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2">No historical telemetry events found in monitoring_events.</p>
                        ) : (
                          <div className="space-y-2">
                            {cron.recentExecutions.map((e, idx) => (
                              <div
                                key={e.id || idx}
                                className="p-3 rounded-xl bg-white border border-black/5 flex items-center justify-between text-xs font-mono"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    e.status === "healthy" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    HTTP {e.statusCode}
                                  </span>
                                  <span className="text-gray-500">{new Date(e.timestamp).toLocaleString()}</span>
                                  <span className="text-gray-400">({e.durationMs}ms)</span>
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    {e.triggeredBy}
                                  </span>
                                </div>
                                {e.errorMessage && (
                                  <span className="text-rose-600 text-[11px] truncate max-w-sm" title={e.errorMessage}>
                                    {e.errorMessage}
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
