"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertOctagon, AlertTriangle, ShieldCheck, Clock, RefreshCw,
  Search, ChevronDown, ChevronUp, Copy, Check, Filter,
  Layers, Users, Activity, Smartphone, Globe, Terminal
} from "lucide-react";

interface FingerprintGroup {
  fingerprint: string;
  error_name: string;
  error_message: string;
  route: string;
  source: string;
  first_seen: string;
  last_seen: string;
  count_1h: number;
  count_24h: number;
  total_count: number;
  distinct_sessions_count: number;
  latest_client_sha: string;
  latest_server_sha: string;
  stale_client_count: number;
  is_stale_client_heavy: boolean;
  sample_stack: string | null;
  sample_component_stack: string | null;
  browser_family: string;
  os_family: string;
  recent_incident_ids: string[];
}

interface MonitoringMetrics {
  total_1h: number;
  total_24h: number;
  total_lifetime: number;
  distinct_fingerprints_24h: number;
  stale_deploy_mismatches_24h: number;
  distinct_sessions_24h: number;
  home_errors_1h: number;
  fingerprints: FingerprintGroup[];
}

export default function ClientErrorMonitoringSection({ targetFingerprint }: { targetFingerprint?: string | null } = {}) {
  const [data, setData] = useState<MonitoringMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedFingerprint, setExpandedFingerprint] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/client-errors");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load client errors`);
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

  useEffect(() => {
    if (targetFingerprint && data?.fingerprints) {
      if (data.fingerprints.some(f => f.fingerprint === targetFingerprint)) {
        setExpandedFingerprint(targetFingerprint);
      }
    }
  }, [targetFingerprint, data]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredFingerprints = useMemo(() => {
    if (!data) return [];
    let list = data.fingerprints || [];

    if (filterType === "recent") {
      list = list.filter(f => f.count_1h > 0);
    } else if (filterType === "stale") {
      list = list.filter(f => f.stale_client_count > 0);
    } else if (filterType === "home") {
      list = list.filter(f => f.route === "/home");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f =>
        f.error_name.toLowerCase().includes(q) ||
        f.error_message.toLowerCase().includes(q) ||
        f.route.toLowerCase().includes(q) ||
        f.fingerprint.toLowerCase().includes(q) ||
        f.browser_family.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, filterType, searchQuery]);

  return (
    <section className="bg-white rounded-3xl border border-black/5 p-6 md:p-8 shadow-sm space-y-6 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertOctagon size={18} />
            </div>
            <h2 className="text-xl font-bold font-serif theme-ink">Client Error Stream & Crash Fingerprints</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold uppercase tracking-wider">
              PWA & Runtime
            </span>
          </div>
          <p className="text-xs text-[var(--brand-muted)]">
            Privacy-safe error capture from client error boundaries, window errors, and WebKit runtime exceptions.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold theme-ink transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-rose-500" : "text-gray-500"} />
          Refresh Stream
        </button>
      </div>

      {targetFingerprint && data && !data.fingerprints.some(f => f.fingerprint === targetFingerprint) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-700 shrink-0" />
          <span>Target error fingerprint <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded font-bold">{targetFingerprint}</code> was not found in the 24h client errors window.</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Last 1 Hour</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.total_1h ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">
            {data?.home_errors_1h ? `${data.home_errors_1h} on /home` : "0 on /home"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Last 24 Hours</span>
            <Activity size={14} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.total_24h ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">Total captured events</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Distinct Fingerprints</span>
            <Layers size={14} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.distinct_fingerprints_24h ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">Unique error signatures</p>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Affected Sessions</span>
            <Users size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif theme-ink">{data?.distinct_sessions_24h ?? 0}</div>
          <p className="text-[10px] text-[var(--brand-muted)] mt-0.5">
            {data?.stale_deploy_mismatches_24h ? `${data.stale_deploy_mismatches_24h} stale client events` : "Zero stale mismatch"}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All Fingerprints" },
            { key: "recent", label: "Active in 1h" },
            { key: "home", label: "Route /home" },
            { key: "stale", label: "Stale Deployments" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.key
                  ? "bg-[var(--premium-gold,#C5A059)] text-white shadow-sm"
                  : "bg-black/5 text-[var(--brand-muted)] hover:bg-black/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative md:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search fingerprints, routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/[0.03] border border-black/10 text-xs theme-ink focus:outline-none focus:border-[var(--premium-gold)]"
          />
        </div>
      </div>

      {/* Fingerprint List */}
      <div className="border border-black/5 rounded-2xl overflow-hidden divide-y divide-black/5">
        {loading && !data ? (
          <div className="p-12 text-center text-gray-400 text-xs font-bold flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-rose-500" />
            Loading client error stream...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs font-bold space-y-1">
            <AlertTriangle size={20} className="mx-auto" />
            <p>{error}</p>
          </div>
        ) : filteredFingerprints.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs space-y-1">
            <ShieldCheck size={24} className="mx-auto text-emerald-500" />
            <p className="font-bold text-gray-600">Zero client errors recorded</p>
            <p className="text-[11px]">All browser sessions are running cleanly without caught exceptions.</p>
          </div>
        ) : (
          filteredFingerprints.map((fp) => {
            const isExpanded = expandedFingerprint === fp.fingerprint;
            const isStale = fp.is_stale_client_heavy;

            return (
              <div key={fp.fingerprint} className="transition-colors hover:bg-black/[0.01]">
                <div className="p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Error Signature */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 text-[11px] font-bold font-mono">
                        {fp.error_name}
                      </span>
                      <code className="text-[11px] font-mono text-amber-700 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/15">
                        {fp.route}
                      </code>
                      <span className="px-2 py-0.5 rounded-full bg-black/5 text-gray-600 text-[10px] font-bold">
                        {fp.browser_family} / {fp.os_family}
                      </span>
                      {isStale && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          ⚠️ Stale Client (SHA Mismatch)
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold theme-ink line-clamp-1">{fp.error_message}</p>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--brand-muted)] font-mono">
                      <span>Fingerprint: {fp.fingerprint.slice(0, 12)}...</span>
                      <span>•</span>
                      <span>Impact: {fp.distinct_sessions_count} session{fp.distinct_sessions_count === 1 ? '' : 's'}</span>
                      <span>•</span>
                      <span>Deploy: {fp.latest_client_sha ? fp.latest_client_sha.slice(0, 7) : 'unknown'}</span>
                    </div>
                  </div>

                  {/* Middle & Right: Counts & Expand */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right space-y-0.5">
                      <div className="flex items-center gap-2 justify-end">
                        {fp.count_1h > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            {fp.count_1h} in 1h
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {fp.count_24h} in 24h
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Last seen: {new Date(fp.last_seen).toLocaleTimeString()}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedFingerprint(isExpanded ? null : fp.fingerprint)}
                      className="p-2 rounded-xl hover:bg-black/5 text-gray-400 hover:theme-ink transition-all"
                      title="Inspect stack trace & incidents"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expandable Trace Drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-black/[0.02] border-t border-black/5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold theme-ink">Captured Stack & Incident Metadata</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyText(fp.sample_stack || fp.error_message, fp.fingerprint)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-black/10 text-[10px] font-bold text-gray-600 hover:border-black/30"
                        >
                          {copiedKey === fp.fingerprint ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          {copiedKey === fp.fingerprint ? "Copied" : "Copy Stack"}
                        </button>
                      </div>
                    </div>

                    {fp.sample_stack ? (
                      <pre className="p-4 rounded-xl bg-black/90 text-rose-300 font-mono text-[11px] overflow-x-auto max-h-56 border border-black/10 whitespace-pre-wrap">
                        {fp.sample_stack}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-400 py-2">No stack trace available for this event.</p>
                    )}

                    {fp.sample_component_stack && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">React Component Stack:</span>
                        <pre className="p-3 mt-1 rounded-xl bg-black/80 text-amber-300 font-mono text-[10px] overflow-x-auto max-h-36 border border-black/10 whitespace-pre-wrap">
                          {fp.sample_component_stack}
                        </pre>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recent Incident IDs:</span>
                      {fp.recent_incident_ids.map((id) => (
                        <code key={id} className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-black/10 text-gray-700">
                          {id}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
