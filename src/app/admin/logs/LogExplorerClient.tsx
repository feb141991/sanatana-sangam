"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Terminal,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  ArrowRight,
  Activity,
  Smartphone,
  Clock,
  Radio,
  Calendar,
  Layers,
  Search
} from "lucide-react";
import type {
  NormalizedLogEvent,
  LogExplorerFilters,
  LogExplorerApiResponse,
  LogEventSource,
} from "@/lib/admin-log-explorer-types";
import {
  parseLogFiltersFromSearchParams,
  serializeLogFiltersToSearchParams,
  extractCorrelationLinks,
} from "@/lib/admin-log-explorer-helpers";
import { getStaggerDelayStyle, useReducedMotion, useDialogFocusTrap } from "@/lib/admin-accessibility";

const SOURCE_METADATA: Record<string, { label: string; icon: any; description: string }> = {
  monitoring: {
    label: "Monitoring Events",
    icon: Activity,
    description: "Backend API routes, response status codes, query latencies & system health.",
  },
  client_errors: {
    label: "Client Crashes",
    icon: Smartphone,
    description: "Unhandled JS exceptions, React render crashes & mobile stack traces.",
  },
  crons: {
    label: "Cron Telemetry",
    icon: Clock,
    description: "Background scheduled jobs (Brahma Muhurta, daily reminders, streak resets).",
  },
  notifications: {
    label: "Notification Dispatch",
    icon: Radio,
    description: "Push delivery tickets sent to Apple APNs & Google FCM via Expo.",
  },
  golden_fixtures: {
    label: "Calendar Audits",
    icon: Calendar,
    description: "Astronomical fixture governance & canonical observance audit logs.",
  },
};

export function LogExplorerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const [filters, setFilters] = useState<LogExplorerFilters>(() =>
    parseLogFiltersFromSearchParams(searchParams)
  );
  const [data, setData] = useState<LogExplorerApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector Drawer State & Focus Trap
  const [selectedEvent, setSelectedEvent] = useState<NormalizedLogEvent | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const drawerContainerRef = useRef<HTMLDivElement>(null);

  useDialogFocusTrap(
    Boolean(selectedEvent),
    () => setSelectedEvent(null),
    drawerContainerRef
  );

  // Sync state with URL search params changes
  useEffect(() => {
    setFilters(parseLogFiltersFromSearchParams(searchParams));
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<LogExplorerFilters>) => {
      const merged: LogExplorerFilters = {
        ...filters,
        ...newFilters,
        cursor: newFilters.cursor !== undefined ? newFilters.cursor : undefined,
      };
      setFilters(merged);
      const sp = serializeLogFiltersToSearchParams(merged);
      router.push(`/admin/logs?${sp.toString()}`);
    },
    [filters, router]
  );

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sp = serializeLogFiltersToSearchParams(filters);
      const res = await fetch(`/api/admin/logs?${sp.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Failed to fetch logs: HTTP ${res.status}`);
      }
      const json: LogExplorerApiResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Unknown network error");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyLogEvent = (ev: NormalizedLogEvent) => {
    const text = `[${ev.severity.toUpperCase()}] ${ev.title}\n${ev.message}\nSource: ${ev.source} | Route: ${ev.route || "N/A"}\nTimestamp: ${ev.timestamp}\nMetadata: ${JSON.stringify(ev.metadata || {}, null, 2)}`;
    navigator.clipboard.writeText(text);
    setCopiedLogId(ev.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const clearFilters = () => {
    const cleared: LogExplorerFilters = {
      source: "all",
      severity: "all",
      limit: 25,
    };
    setFilters(cleared);
    router.push("/admin/logs");
  };

  return (
    <div className="space-y-6 font-outfit text-stone-900 pb-16 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-200 motion-reduce:animate-none">
      
      {/* ─── 1. HEADER & TOOLBAR ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-500/20">
              <Terminal size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif theme-ink tracking-tight">
              Unified Log Explorer
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
              Multi-Source Ingest Stream
            </span>
          </div>
          <p className="text-xs text-[var(--brand-muted)] font-medium">
            Real-time audit telemetry across client crashes, backend API monitoring, cron heartbeats, and push dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold text-gray-700 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
            aria-label="Refresh log telemetry"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-amber-600" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 2. CLICKABLE TELEMETRY INGESTION SOURCE TILES ────────────────────── */}
      {data && (
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Telemetry Ingestion Sources
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Click any source tile below to filter the live evidence feed to that stream:
              </p>
            </div>
            <div className="flex items-center gap-2">
              {filters.source && filters.source !== "all" && (
                <button
                  onClick={() => updateFilters({ source: "all" })}
                  className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  Reset Source Filter (Showing: {SOURCE_METADATA[filters.source]?.label || filters.source})
                </button>
              )}
              {data.degraded && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle size={11} />
                  Degraded Source
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
            {Object.entries(data.sources).map(([srcKey, srcInfo]) => {
              const meta = SOURCE_METADATA[srcKey] || {
                label: srcKey.replace(/_/g, " "),
                icon: Activity,
                description: "Telemetry stream data sink",
              };
              const Icon = meta.icon;
              const isSelected = filters.source === srcKey;

              return (
                <button
                  key={srcKey}
                  onClick={() => updateFilters({ source: isSelected ? "all" : (srcKey as LogEventSource) })}
                  title={`Click to filter by ${meta.label}`}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/30 shadow-md scale-[1.02]"
                      : srcInfo.status === "available"
                      ? "bg-white border-black/5 hover:border-amber-400 hover:bg-amber-50/20 shadow-2xs"
                      : "bg-gray-50/80 border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon size={14} className={isSelected ? "text-amber-800" : "text-gray-500"} />
                      <span className={`font-bold text-[11px] truncate ${isSelected ? "text-amber-950 font-serif" : "text-gray-900"}`}>
                        {meta.label}
                      </span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        srcInfo.status === "available"
                          ? "bg-emerald-500"
                          : srcInfo.status === "empty"
                          ? "bg-gray-300"
                          : srcInfo.status === "unavailable"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                  </div>

                  <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">
                    {meta.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-black/5">
                    <span className="capitalize text-gray-400">{srcInfo.status}</span>
                    <span className={`font-bold ${isSelected ? "text-amber-900" : "text-gray-700"}`}>
                      {srcInfo.count} events
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. FILTERS & QUERY BOUNDS ───────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Filters & Query Bounds
            </span>
          </div>
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold text-amber-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Source Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Event Source
            </label>
            <select
              value={filters.source || "all"}
              onChange={(e) => updateFilters({ source: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="monitoring">Monitoring Events (API & Sinks)</option>
              <option value="client_errors">Client Crashes (Exceptions)</option>
              <option value="crons">Cron Telemetry (Jobs)</option>
              <option value="notifications">Notification Dispatch (Push)</option>
              <option value="golden_fixtures">Calendar Audits (Fixtures)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Severity Level
            </label>
            <select
              value={filters.severity || "all"}
              onChange={(e) => updateFilters({ severity: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical (P0 / P1 / Crashes)</option>
              <option value="warning">Warning (P2 / Degradations)</option>
              <option value="info">Info (Standard Events)</option>
            </select>
          </div>

          {/* Route Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Application Route
            </label>
            <input
              type="text"
              placeholder="e.g. /home or /api/calendar/day"
              value={filters.route || ""}
              onChange={(e) => updateFilters({ route: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Request ID Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Correlation Request ID
            </label>
            <input
              type="text"
              placeholder="e.g. req_xyz..."
              value={filters.requestId || ""}
              onChange={(e) => updateFilters({ requestId: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Crash Fingerprint */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Crash Fingerprint
            </label>
            <input
              type="text"
              placeholder="e.g. 8-char hash..."
              value={filters.fingerprint || ""}
              onChange={(e) => updateFilters({ fingerprint: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Cron Job Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Cron Routine ID
            </label>
            <input
              type="text"
              placeholder="e.g. brahma-muhurta"
              value={filters.cronJob || ""}
              onChange={(e) => updateFilters({ cronJob: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Release SHA Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Release SHA
            </label>
            <input
              type="text"
              placeholder="e.g. ffe66fe..."
              value={filters.deploymentSha || ""}
              onChange={(e) => updateFilters({ deploymentSha: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Page Limit */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Batch Bound Limit
            </label>
            <select
              value={filters.limit || 25}
              onChange={(e) => updateFilters({ limit: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="15">15 events</option>
              <option value="25">25 events</option>
              <option value="50">50 events (max)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 4. LOG EVENT TABLE / EVIDENCE FEED ──────────────────────────────── */}
      <section aria-label="Log Explorer Evidence Stream" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-950 font-serif">
              Diagnostic Evidence Feed
            </h2>
            {data && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 text-[10px] font-bold">
                {data.pagination.totalReturned} Events Returned
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            Bounded Bitemporal Order (Latest First)
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 space-y-2 bg-white rounded-2xl border border-black/5" style={{ minHeight: "220px" }}>
            <RefreshCw size={24} className="mx-auto animate-spin text-amber-600" />
            <b className="text-sm font-bold text-gray-700 block">Querying Ingested Telemetry...</b>
            <p className="text-xs text-gray-400">Filtering across client crashes, crons, and monitoring sinks.</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 space-y-2 bg-rose-50 rounded-2xl border border-rose-200">
            <AlertTriangle size={24} className="mx-auto text-rose-600" />
            <b className="text-sm font-bold block">Log Query Failed</b>
            <p className="text-xs text-rose-800 max-w-md mx-auto">{error}</p>
          </div>
        ) : !data || data.events.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2 bg-white rounded-2xl border border-black/5">
            <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
            <b className="text-sm font-bold text-gray-800 block">No Telemetry Events Found</b>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              No matching events recorded within the selected window and filter parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.events.map((ev, idx) => {
              const correlationLinks = extractCorrelationLinks(ev.correlation);

              return (
                <div
                  key={ev.id}
                  style={getStaggerDelayStyle(idx, 240, prefersReducedMotion)}
                  className={`p-4 rounded-2xl bg-white border transition-all shadow-2xs relative select-text ${
                    ev.severity === "critical"
                      ? "border-rose-500/30 hover:border-rose-500/60"
                      : ev.severity === "warning"
                      ? "border-amber-500/20 hover:border-amber-500/50"
                      : "border-black/5 hover:border-amber-500/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            ev.severity === "critical"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : ev.severity === "warning"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {ev.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/5 text-gray-700 text-[9px] font-mono uppercase">
                          {ev.source.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                        {ev.route && (
                          <code className="text-[10px] font-mono text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                            {ev.route}
                          </code>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold theme-ink select-text">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed font-mono select-text">
                        {ev.message}
                      </p>

                      {/* Correlation Badges */}
                      {correlationLinks.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {correlationLinks.map((link) => (
                            <span
                              key={link.key}
                              onClick={(e) => {
                                if (link.href) {
                                  e.stopPropagation();
                                  router.push(link.href);
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                                link.href
                                  ? "bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 cursor-pointer font-bold border border-amber-500/20"
                                  : "bg-black/5 text-gray-600"
                              }`}
                              title={link.label}
                            >
                              <span className="opacity-70">{link.label}:</span>
                              <span>{link.value}</span>
                              {link.href && <ExternalLink size={9} className="opacity-60" />}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Copy Log Event Button */}
                      <button
                        onClick={() => copyLogEvent(ev)}
                        title="Copy log entry"
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedLogId === ev.id ? (
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

                      {/* Inspect Log Event Button */}
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Strip */}
        {data && data.pagination.hasMore && (
          <div className="pt-3 flex justify-center">
            <button
              onClick={() => updateFilters({ cursor: data.pagination.nextCursor || undefined })}
              className="px-4 py-2 rounded-xl bg-white border border-black/10 hover:bg-black/5 text-xs font-bold text-gray-800 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Load Next Batch</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </section>

      {/* ─── 5. INSPECTOR DRAWER ──────────────────────────────────────────────── */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Event Inspector"
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-outfit animate-in fade-in duration-150"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            ref={drawerContainerRef}
            tabIndex={-1}
            className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-black/10 flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden focus:outline-none select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-black/5 bg-black/[0.01] flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 border border-amber-500/20">
                  <Terminal size={11} />
                  {selectedEvent.source.replace(/_/g, " ")}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedEvent.severity === "critical"
                    ? "bg-rose-100 text-rose-800"
                    : selectedEvent.severity === "warning"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {selectedEvent.severity}
                </span>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close log inspector"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-mono block">
                  {new Date(selectedEvent.timestamp).toLocaleString()} ({selectedEvent.timestamp})
                </span>
                <h2 className="text-base font-bold font-serif theme-ink">{selectedEvent.title}</h2>
                <p className="text-xs text-gray-700 font-mono leading-relaxed bg-black/[0.02] p-3 rounded-xl border border-black/5">
                  {selectedEvent.message}
                </p>
              </div>

              {/* Correlation Keys */}
              {selectedEvent.correlation && Object.keys(selectedEvent.correlation).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Correlation Identifiers
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    {Object.entries(selectedEvent.correlation).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-gray-400 block text-[9px] uppercase">{k}</span>
                        <span className="text-gray-800 truncate block font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Metadata JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Full Diagnostic Metadata
                  </span>
                  <button
                    onClick={() => copyText(JSON.stringify(selectedEvent, null, 2), "json")}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                  >
                    {copiedKey === "json" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copiedKey === "json" ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-gray-900 text-amber-200 font-mono text-[10px] overflow-x-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent.metadata || selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/5 bg-black/[0.02] shrink-0 flex items-center justify-end gap-2">
              <button
                onClick={() => copyText(JSON.stringify(selectedEvent, null, 2), "drawer_copy")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-gray-800 font-bold text-xs transition-colors cursor-pointer"
              >
                {copiedKey === "drawer_copy" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedKey === "drawer_copy" ? "Copied All" : "Copy Raw Record"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
