'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import type {
  NormalizedLogEvent,
  LogExplorerFilters,
  LogExplorerApiResponse,
} from '@/lib/admin-log-explorer-types';
import {
  parseLogFiltersFromSearchParams,
  serializeLogFiltersToSearchParams,
  extractCorrelationLinks,
} from '@/lib/admin-log-explorer-helpers';
import { getStaggerDelayStyle, useReducedMotion, useDialogFocusTrap } from '@/lib/admin-accessibility';

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
      setError(err?.message || 'Unknown network error');
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

  const clearFilters = () => {
    const cleared: LogExplorerFilters = {
      source: 'all',
      severity: 'all',
      limit: 25,
    };
    setFilters(cleared);
    router.push('/admin/logs');
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
          </div>
          <p className="text-xs text-[var(--brand-muted)] font-medium">
            Evidence browser across client crashes, monitoring events, cron heartbeats, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold text-gray-700 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Refresh log telemetry"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-amber-600' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 2. SOURCE AVAILABILITY & DEGRADATION STRIP ──────────────────────── */}
      {data && (
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Telemetry Ingestion Sources
            </span>
            {data.degraded && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle size={11} />
                Degraded Sources
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {Object.entries(data.sources).map(([srcKey, srcInfo]) => {
              const labelMap: Record<string, string> = {
                client_errors: 'Client Crashes',
                monitoring: 'Monitoring Events',
                crons: 'Cron Telemetry',
                notifications: 'Notification Dispatch',
                golden_fixtures: 'Calendar Audits',
              };

              return (
                <div
                  key={srcKey}
                  className={`p-2.5 rounded-xl border space-y-1 ${
                    srcInfo.status === 'available'
                      ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-950'
                      : srcInfo.status === 'empty'
                      ? 'bg-gray-50 border-gray-200 text-gray-700'
                      : srcInfo.status === 'unavailable'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] truncate">
                      {labelMap[srcKey] || srcKey}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        srcInfo.status === 'available'
                          ? 'bg-emerald-500'
                          : srcInfo.status === 'empty'
                          ? 'bg-gray-400'
                          : srcInfo.status === 'unavailable'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="capitalize">{srcInfo.status}</span>
                    <span className="font-bold">{srcInfo.count} events</span>
                  </div>
                  {srcInfo.error && (
                    <p className="text-[9px] text-rose-700 truncate" title={srcInfo.error}>
                      {srcInfo.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. FILTER BAR (URL-PERSISTED) ──────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
              Filters & Query Bounds
            </span>
          </div>

          <button
            onClick={clearFilters}
            className="text-[11px] font-bold text-gray-400 hover:text-gray-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Source Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Event Source
            </label>
            <select
              value={filters.source || 'all'}
              onChange={(e) => updateFilters({ source: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Sources</option>
              <option value="client_errors">Client Error Crashes</option>
              <option value="monitoring">Monitoring Events</option>
              <option value="crons">Cron Telemetry</option>
              <option value="notifications">Notification Dispatches</option>
              <option value="golden_fixtures">Golden Fixture Audits</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Severity Level
            </label>
            <select
              value={filters.severity || 'all'}
              onChange={(e) => updateFilters({ severity: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical (P0/P1)</option>
              <option value="warning">Warning (P2)</option>
              <option value="info">Info (P3)</option>
            </select>
          </div>

          {/* Route Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Application Route
            </label>
            <input
              type="text"
              placeholder="e.g. /home or /api/cron/..."
              value={filters.route || ''}
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
              value={filters.requestId || ''}
              onChange={(e) => updateFilters({ requestId: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Fingerprint Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Crash Fingerprint
            </label>
            <input
              type="text"
              placeholder="e.g. 8-char hash..."
              value={filters.fingerprint || ''}
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
              value={filters.cronJob || ''}
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
              value={filters.deploymentSha || ''}
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
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          <div className="p-12 text-center text-gray-400 space-y-2 bg-white rounded-2xl border border-black/5" style={{ minHeight: '220px' }}>
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
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-4 rounded-2xl bg-white border transition-colors cursor-pointer group shadow-2xs relative overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150 motion-reduce:animate-none ${
                    ev.severity === 'critical'
                      ? 'border-rose-500/30 hover:border-rose-500/60'
                      : ev.severity === 'warning'
                      ? 'border-amber-500/20 hover:border-amber-500/50'
                      : 'border-black/5 hover:border-black/15'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEvent(ev);
                    }
                  }}
                  aria-label={`Inspect log event: ${ev.title}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            ev.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : ev.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {ev.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/5 text-gray-700 text-[9px] font-mono uppercase">
                          {ev.source.replace(/_/g, ' ')}
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

                      <h3 className="text-xs sm:text-sm font-bold theme-ink group-hover:text-amber-900 transition-colors">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed font-mono line-clamp-2">
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
                                  ? 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 cursor-pointer font-bold border border-amber-500/20'
                                  : 'bg-black/5 text-gray-600'
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
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

        {/* Keyset Pagination Controls */}
        {data && data.pagination.hasMore && (
          <div className="pt-4 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Showing batch of {data.pagination.totalReturned} events
            </span>
            <button
              onClick={() => updateFilters({ cursor: data.pagination.nextCursor || undefined })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-900 text-white text-xs font-bold hover:bg-amber-800 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <span>Load Next Batch</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </section>

      {/* ─── 5. DIAGNOSTIC EVENT DETAIL DRAWER ──────────────────────────────── */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Diagnostic Log Inspector"
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-outfit animate-in fade-in duration-150 motion-reduce:animate-none"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            ref={drawerContainerRef}
            tabIndex={-1}
            className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-black/10 flex flex-col z-10 animate-in slide-in-from-right duration-200 motion-reduce:animate-none overflow-hidden focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-black/5 bg-black/[0.01] flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-500/20">
                  <Terminal size={11} />
                  Diagnostic Log Inspector
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {selectedEvent.source}
                </span>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label="Close log inspector"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      selectedEvent.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : selectedEvent.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {selectedEvent.severity}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    Timestamp: {new Date(selectedEvent.timestamp).toISOString()}
                  </span>
                </div>
                <h2 className="text-base font-bold font-serif theme-ink">
                  {selectedEvent.title}
                </h2>
                <p className="text-xs text-gray-600 font-mono mt-1">
                  {selectedEvent.message}
                </p>
              </div>

              {/* Exact Correlation Identifiers */}
              {extractCorrelationLinks(selectedEvent.correlation).length > 0 && (
                <div className="space-y-2 p-3.5 bg-black/[0.02] border rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                    Correlated Identifiers & Workspaces
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {extractCorrelationLinks(selectedEvent.correlation).map((c) => (
                      <div key={c.key} className="p-2 bg-white rounded-lg border border-black/5 space-y-0.5">
                        <span className="text-[9px] text-gray-400 block font-mono">{c.label}</span>
                        {c.href ? (
                          <Link
                            href={c.href}
                            className="text-[11px] font-mono font-bold text-amber-900 hover:underline flex items-center gap-1 truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                          >
                            <span className="truncate">{c.value}</span>
                            <ExternalLink size={10} className="shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-[11px] font-mono font-bold text-gray-800 truncate block">
                            {c.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sanitized Metadata JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Sanitized Diagnostic Metadata (PII Redacted)
                  </span>
                  <button
                    onClick={() =>
                      copyText(JSON.stringify(selectedEvent.metadata || {}, null, 2), 'modal_meta')
                    }
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
                  >
                    {copiedKey === 'modal_meta' ? (
                      <Check size={10} className="text-emerald-600" />
                    ) : (
                      <Copy size={10} />
                    )}
                    <span>{copiedKey === 'modal_meta' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-black/90 text-amber-200 font-mono text-[10px] overflow-x-auto max-h-72 whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/5 bg-black/[0.02] shrink-0 flex items-center justify-between">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Close Inspector
              </button>

              <button
                onClick={() =>
                  copyText(JSON.stringify(selectedEvent, null, 2), 'full_event')
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold text-xs transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {copiedKey === 'full_event' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedKey === 'full_event' ? 'Copied Full Event' : 'Copy Full Event DTO'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
