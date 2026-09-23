"use client";

import { useState, useEffect } from "react";
import {
  Layers, RefreshCw, ShieldCheck, AlertTriangle, CheckCircle,
  Clock, XCircle, Play, ChevronRight, Filter, AlertCircle, Sparkles
} from "lucide-react";

interface PipelineModeSnapshot {
  eventType: string;
  mode: 'candidate' | 'legacy' | 'disabled';
  source: 'env_override' | 'default';
}

interface StatsData {
  status: string;
  timestamp: string;
  governance: {
    globallyEnabled: boolean;
    pipelineModes: Record<string, PipelineModeSnapshot>;
  };
  queue: {
    pending: number;
    resolving: number;
    staleLeases: number;
    retainedAccepted: number;
    retainedSuppressed: number;
    retainedDeferred: number;
    retainedExpired: number;
    retainedCancelled: number;
  };
  last24h: {
    totalEvaluated: number;
    accepted: number;
    suppressed: number;
    deferred: number;
    expired: number;
    cancelled: number;
    rates: {
      acceptedPct: number;
      suppressedPct: number;
      deferredPct: number;
      expiredPct: number;
    };
    topSuppressionReasons: Array<{ reason: string; count: number }>;
    typeDistribution: Record<string, number>;
  };
  last7d: {
    totalEvaluated: number;
    accepted: number;
    suppressed: number;
    deferred: number;
    expired: number;
    cancelled: number;
    rates: {
      acceptedPct: number;
      suppressedPct: number;
      deferredPct: number;
      expiredPct: number;
    };
  };
}

interface PreviewCandidate {
  id: string;
  user_id: string;
  event_type: string;
  event_id: string;
  event_instance?: string;
  local_date: string;
  scheduled_for: string;
  expires_at: string;
  priority: number;
  title: string;
  status: string;
  decision_reason?: string;
  created_at: string;
}

interface PreviewAuditEvent {
  id: string;
  candidate_id: string;
  user_id: string;
  event_type: string;
  decision: string;
  reason: string;
  resolved_at: string;
}

interface PreviewData {
  pipelineConfig: {
    globallyEnabled: boolean;
    modes: Record<string, PipelineModeSnapshot>;
  };
  queueStats: Record<string, number>;
  recentCandidates: PreviewCandidate[];
  recentAuditEvents: PreviewAuditEvent[];
  previewSimulation?: {
    ok: boolean;
    candidatesClaimed: number;
    acceptedCount: number;
    suppressedCount: number;
    deferredCount: number;
    expiredCount: number;
    cancelledCount: number;
    summary: {
      totalEvaluated: number;
      acceptedCount: number;
      suppressedCount: number;
      deferredCount: number;
      reasons: Record<string, number>;
    };
  };
}

export default function NotificationResolverSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview simulation state
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>("all");

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notification-resolver-stats");
      if (!res.ok) throw new Error("Failed to load resolver operational statistics");
      const json = await res.json();
      setStats(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading stats");
    } finally {
      setLoading(false);
    }
  };

  const runPreviewSimulation = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const url = selectedEventType !== "all"
        ? `/api/admin/notification-resolver/preview?eventType=${encodeURIComponent(selectedEventType)}&limit=100`
        : "/api/admin/notification-resolver/preview?limit=100";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to execute preview simulation");
      const json = await res.json();
      setPreviewData(json);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getModeBadge = (mode?: string) => {
    if (mode === "candidate") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle size={10} className="text-emerald-600" /> Candidate Resolver
        </span>
      );
    }
    if (mode === "legacy") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={10} className="text-amber-600" /> Legacy Pipeline
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
        <XCircle size={10} className="text-zinc-400" /> Disabled
      </span>
    );
  };

  const getDecisionBadge = (decision: string) => {
    if (decision === "accepted") {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">ACCEPTED</span>;
    }
    if (decision === "suppressed") {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">SUPPRESSED</span>;
    }
    if (decision === "deferred") {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">DEFERRED</span>;
    }
    if (decision === "expired") {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">EXPIRED</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-600">{decision.toUpperCase()}</span>;
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER & KILL SWITCH BANNER ─────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Central Notification Candidate Resolver & Release Gate</h2>
                <p className="text-xs text-gray-500">Deterministic notification candidate review, policy budgets, and promotion status.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {stats?.governance.globallyEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Kill Switch: ACTIVE (Promotions Enabled)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
              <AlertTriangle size={13} className="text-amber-600" />
              Kill Switch: PAUSED (Default Safe Standby)
            </span>
          )}

          {stats?.queue.staleLeases ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              <AlertCircle size={13} className="text-red-500" />
              {stats.queue.staleLeases} Stale Leases
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
              <ShieldCheck size={13} className="text-emerald-600" /> Zero Stale Leases
            </span>
          )}

          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── 4 OPERATIONAL KPI CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Pending & Resolving Queue</span>
            <Clock size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {(stats?.queue.pending ?? 0) + (stats?.queue.resolving ?? 0)}
          </div>
          <div className="text-[11px] text-gray-400">
            {stats?.queue.pending ?? 0} pending · {stats?.queue.resolving ?? 0} claimed resolving
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>24h Acceptance Rate</span>
            <CheckCircle size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats?.last24h.rates.acceptedPct ?? 0}%
          </div>
          <div className="text-[11px] text-gray-400">
            {stats?.last24h.accepted ?? 0} accepted of {stats?.last24h.totalEvaluated ?? 0} evaluated
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>24h Suppressions</span>
            <AlertTriangle size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats?.last24h.suppressed ?? 0}
          </div>
          <div className="text-[11px] text-gray-400">
            {stats?.last24h.deferred ?? 0} deferred
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Retained Accepted</span>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {stats?.queue.retainedAccepted ?? 0}
          </div>
          <div className="text-[11px] text-gray-400">
            {stats?.queue.retainedSuppressed ?? 0} retained suppressed
          </div>
        </div>
      </div>

      {/* ─── PIPELINE MODES MATRIX ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Per-Candidate-Type Pipeline Mode Matrix</h3>
            <p className="text-xs text-gray-500">
              Deterministic per-type routing. Default-off (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-700">disabled</code>) with explicit zero-code env toggle cutover.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Group 1: Time-Sensitive & Series Candidates (Prompt 7) */}
          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3">
            <div className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Time-Sensitive Ritual & Series Candidates (Prompt 7)
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {[
                { type: "observance_series", label: "Multi-Day Observance Series (Navratri, Deepavali, etc.)" },
                { type: "ekadashi_parana", label: "Ekadashi Parana Fast-Breaking Window (Dwadashi Sunrise)" },
                { type: "pradosha_kala", label: "Pradosha Kala Twilight Puja Window (Sunset ± 45m)" },
                { type: "sankranti", label: "Solar Sankranti & Punya Kala Snana/Dana Windows" },
              ].map((item) => (
                <div key={item.type} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-800">{item.label}</div>
                    <div className="text-[10px] font-mono text-gray-400">type: {item.type}</div>
                  </div>
                  <div>
                    {getModeBadge(stats?.governance.pipelineModes?.[item.type]?.mode)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Routine Sadhana & Observance Candidates */}
          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100 space-y-3">
            <div className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Daily Routine Sadhana & Calendar Observances
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {[
                { type: "observance", label: "Calendar Observances & Major Festivals (D-7, D-1, D0)" },
                { type: "dharm_veer", label: "Dharm Veer Daily Sadhana Review" },
                { type: "quiz", label: "Daily Vedic Wisdom Quiz" },
                { type: "streak", label: "Sadhana Streak Protection & Milestones" },
                { type: "mood", label: "Sattvic Reflection & Mood Checkin" },
              ].map((item) => (
                <div key={item.type} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-800">{item.label}</div>
                    <div className="text-[10px] font-mono text-gray-400">type: {item.type}</div>
                  </div>
                  <div>
                    {getModeBadge(stats?.governance.pipelineModes?.[item.type]?.mode)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SUPPRESSION REASONS BREAKDOWN ─────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900">24-Hour Policy Suppression Analysis</h3>
        <p className="text-xs text-gray-500">Autonomous budget & governance decisions protecting devotees from notification exhaustion.</p>

        {stats?.last24h.topSuppressionReasons && stats.last24h.topSuppressionReasons.length > 0 ? (
          <div className="space-y-2 pt-2">
            {stats.last24h.topSuppressionReasons.map((item) => {
              const maxCount = stats.last24h.topSuppressionReasons[0]?.count || 1;
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.reason} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-gray-700">
                    <span className="font-mono text-[11px] text-gray-800">{item.reason}</span>
                    <span className="text-gray-500">{item.count} occurrences</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400">
            No candidate suppressions recorded in the last 24 hours.
          </div>
        )}
      </div>

      {/* ─── DRY-RUN & PREVIEW GATE ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Deterministic Dry-Run Simulation & Candidate Queue</h3>
            <p className="text-xs text-gray-500">
              Simulates candidate evaluation and budget checks without mutating database records or dispatching push tickets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white text-gray-700"
            >
              <option value="all">All Event Types</option>
              <option value="observance_series">observance_series</option>
              <option value="ekadashi_parana">ekadashi_parana</option>
              <option value="pradosha_kala">pradosha_kala</option>
              <option value="sankranti">sankranti</option>
              <option value="observance">observance</option>
              <option value="dharm_veer">dharm_veer</option>
              <option value="quiz">quiz</option>
              <option value="streak">streak</option>
              <option value="mood">mood</option>
            </select>

            <button
              onClick={runPreviewSimulation}
              disabled={previewLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <Play size={12} className={previewLoading ? "animate-spin" : ""} />
              <span>{previewLoading ? "Simulating..." : "Run Preview Simulation"}</span>
            </button>
          </div>
        </div>

        {previewError && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{previewError}</span>
          </div>
        )}

        {previewData?.previewSimulation && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-600/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Preview Simulation Result (Dry Run)</span>
              <span className="text-[11px] font-normal text-gray-500">
                {previewData.previewSimulation.candidatesClaimed} candidates evaluated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-gray-100">
                <div className="text-lg font-black text-emerald-600">
                  {previewData.previewSimulation.acceptedCount}
                </div>
                <div className="text-[10px] text-gray-500">Would Accept</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-gray-100">
                <div className="text-lg font-black text-red-600">
                  {previewData.previewSimulation.suppressedCount}
                </div>
                <div className="text-[10px] text-gray-500">Would Suppress</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-gray-100">
                <div className="text-lg font-black text-blue-600">
                  {previewData.previewSimulation.deferredCount}
                </div>
                <div className="text-[10px] text-gray-500">Would Defer</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-gray-100">
                <div className="text-lg font-black text-gray-600">
                  {previewData.previewSimulation.expiredCount}
                </div>
                <div className="text-[10px] text-gray-500">Expired / Stale</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Candidates Table */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-800">Recent Candidates in System Queue</div>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Event Type & ID</th>
                  <th className="px-4 py-2.5 font-semibold">Title</th>
                  <th className="px-4 py-2.5 font-semibold">Local Date</th>
                  <th className="px-4 py-2.5 font-semibold">Priority</th>
                  <th className="px-4 py-2.5 font-semibold">Status / Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!previewData?.recentCandidates || previewData.recentCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-xs">
                      Click &ldquo;Run Preview Simulation&rdquo; above to query the active candidates queue.
                    </td>
                  </tr>
                ) : (
                  previewData.recentCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-gray-900">{c.event_type}</div>
                        <div className="font-mono text-[10px] text-gray-400 truncate max-w-xs">{c.event_id}</div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 truncate max-w-sm">{c.title}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-600">{c.local_date}</td>
                      <td className="px-4 py-2.5 font-semibold text-gray-600">{c.priority}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {getDecisionBadge(c.status)}
                          {c.decision_reason && (
                            <span className="text-[10px] text-gray-400 font-mono truncate max-w-xs">
                              {c.decision_reason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
