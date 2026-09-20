"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Gauge, Clock, Activity, Users, ChevronDown, ChevronUp } from "lucide-react";

interface RouteSummary {
  route: string;
  opens: number;
  cacheHitRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  refreshFailures: number;
}

interface SummaryRow {
  id: string;
  identity_kind: "guest" | "authenticated";
  user_id: string | null;
  app_version: string | null;
  platform: string | null;
  total_events: number;
  received_at: string;
  summary: {
    routes: RouteSummary[];
    outbox: Array<{ feature: string; success: number; retry: number; permanentFailure: number }>;
    serverTimings: Array<{ route: string; samples: number; sections: Array<{ name: string; avgDurationMs: number; p95DurationMs: number }> }>;
    totalEvents: number;
  };
}

interface Metrics {
  submissions_1h: number;
  submissions_24h: number;
  submissions_lifetime: number;
  distinct_authenticated_users_24h: number;
  recent: SummaryRow[];
}

function ms(value: number): string {
  return `${Math.round(value)}ms`;
}

export default function NativeStartupTelemetrySection() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/native-telemetry");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load native telemetry`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <section className="bg-white rounded-3xl border border-black/5 p-6 md:p-8 shadow-sm space-y-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Gauge size={18} />
            </div>
            <h2 className="text-xl font-bold font-serif theme-ink">Native Startup Performance</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
              Native
            </span>
          </div>
          <p className="text-xs text-[var(--brand-muted)]">
            Route-open timing, cache hit rate, and refresh failures, aggregated on-device and uploaded
            automatically (throttled to roughly once per hour per install). No content, no free text --
            see docs/STARTUP_PERFORMANCE_IMPLEMENTATION_PLAN.md (native repo).
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold theme-ink transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-indigo-500" : "text-gray-500"} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Last 1 Hour</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.submissions_1h ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">Summaries received</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Last 24 Hours</span>
            <Activity size={14} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.submissions_24h ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">Summaries received</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Distinct Users</span>
            <Users size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.distinct_authenticated_users_24h ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">Authenticated, last 24h (guests are anonymous, not counted)</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lifetime</span>
            <Gauge size={14} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.submissions_lifetime ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">Total summaries (30-day retention)</p>
        </div>
      </div>

      <div className="space-y-2">
        {(data?.recent ?? []).length === 0 && !loading && (
          <p className="text-xs text-[var(--brand-muted)] py-6 text-center">
            No submissions yet. This fills in as the updated app is used and backgrounded on a device.
          </p>
        )}

        {(data?.recent ?? []).map((row) => {
          const expanded = expandedId === row.id;
          return (
            <div key={row.id} className="rounded-2xl border border-black/5 overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : row.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-black/[0.015] hover:bg-black/[0.03] text-left transition-colors"
              >
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono theme-ink">{new Date(row.received_at).toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.identity_kind === "authenticated" ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}>
                    {row.identity_kind}
                  </span>
                  <span className="text-[var(--brand-muted)]">{row.platform ?? "unknown platform"} · {row.app_version ?? "unknown version"}</span>
                  <span className="text-[var(--brand-muted)]">{row.total_events} events</span>
                </div>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {expanded && (
                <div className="p-4 space-y-3">
                  {row.summary.routes.length === 0 ? (
                    <p className="text-[11px] text-[var(--brand-muted)]">No route-open events in this summary.</p>
                  ) : (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-left text-[var(--brand-muted)] uppercase tracking-wider text-[10px]">
                          <th className="pb-1.5 pr-3">Route</th>
                          <th className="pb-1.5 pr-3">Opens</th>
                          <th className="pb-1.5 pr-3">Cache Hit</th>
                          <th className="pb-1.5 pr-3">Avg</th>
                          <th className="pb-1.5 pr-3">p95</th>
                          <th className="pb-1.5">Refresh Failures</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.summary.routes.map((r) => (
                          <tr key={r.route} className="border-t border-black/5">
                            <td className="py-1.5 pr-3 font-mono theme-ink">{r.route}</td>
                            <td className="py-1.5 pr-3">{r.opens}</td>
                            <td className="py-1.5 pr-3">{Math.round(r.cacheHitRate * 100)}%</td>
                            <td className="py-1.5 pr-3">{ms(r.avgDurationMs)}</td>
                            <td className="py-1.5 pr-3">{ms(r.p95DurationMs)}</td>
                            <td className="py-1.5">{r.refreshFailures}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
