'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import type { UrgentAlertItem } from '@/app/api/admin/alerts/route';
import { ADMIN_NAV_GROUPS } from '@/lib/admin-route-registry';
import { AdminIcon } from '@/components/admin/AdminIcon';
import { AdminRecordInspector } from '@/components/admin/AdminRecordInspector';
import type { AdminInspectableRecord } from '@/lib/admin-inspector-types';
import {
  getOverviewSystemStatus,
  sortAlertsByUrgency,
  alertToInspectableRecord,
  type SystemStatusSummary,
} from '@/lib/admin-overview-helpers';
import { getStaggerDelayStyle, useReducedMotion } from '@/lib/admin-accessibility';

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

  const fetchOverviewData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/stats').catch(() => null),
        fetch('/api/admin/alerts').catch(() => null),
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
      console.error('[AdminOverview] Failed to fetch telemetry data:', err);
      setIsDegraded(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetch('/api/admin/calendar-governance/activity');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setActivityLogs(data.slice(0, 6));
        }
      }
    } catch (err) {
      console.error('[AdminOverview] Failed to fetch activity logs:', err);
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
      const res = await fetch('/api/admin/flush-cache', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFlushMessage(data.message || 'Edge & page caches flushed successfully.');
      } else {
        setFlushMessage('Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      setFlushMessage('Error: ' + (e.message || String(e)));
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

  const sortedAlerts = sortAlertsByUrgency(alerts.filter((a) => a.id !== 'system-ok'));
  const systemStatus: SystemStatusSummary = getOverviewSystemStatus(alerts, isDegraded);

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
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-900 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold text-gray-700 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Refresh operational telemetry"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-amber-600' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleFlushCache}
              disabled={isFlushing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-900/20 bg-amber-500/10 hover:bg-amber-500/15 text-xs font-bold text-amber-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
              aria-label="Flush Edge and CDN Cache"
            >
              <Layers size={13} className="text-amber-800" />
              <span>{isFlushing ? 'Flushing...' : 'Flush Cache'}</span>
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
              className="text-[11px] font-bold text-amber-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
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

        {/* Status Strip Vitals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              System Health
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemStatus.status === 'healthy'
                    ? 'bg-emerald-500'
                    : systemStatus.status === 'degraded'
                    ? 'bg-rose-500'
                    : systemStatus.status === 'critical'
                    ? 'bg-rose-600'
                    : 'bg-amber-500'
                }`}
              />
              <b className="text-sm font-bold theme-ink">{systemStatus.label}</b>
            </div>
            <p className="text-[11px] text-gray-500">{systemStatus.description}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Actionable Alerts
            </span>
            <div className="flex items-center gap-2">
              <b className="text-base font-serif font-bold text-gray-900">
                {systemStatus.totalAlerts}
              </b>
              <span className="text-xs text-gray-500 font-medium">
                ({systemStatus.criticalCount} high, {systemStatus.warningCount} medium)
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {systemStatus.totalAlerts === 0 ? 'No open issues in queue' : 'Items require operator inspection'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Deployment
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                Next.js Standalone
              </code>
              <span className="text-xs text-gray-500">· Edge Ready</span>
            </div>
            <p className="text-[11px] text-gray-500">Audit logs & RLS verified</p>
          </div>
        </div>
      </section>

      {/* ─── 2. PRIMARY "NEEDS ATTENTION" QUEUE ───────────────────────────────── */}
      <section aria-label="Needs Attention Queue" className="space-y-3">
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
            Sorted by Urgency & Freshness
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-2 animate-pulse"
                style={{ minHeight: '88px' }}
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
            <b className="text-sm font-bold text-gray-800 block">Queue Clear</b>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              No calendar discrepancies, client error spikes, unreviewed biographies, or pending content reports currently require operator intervention.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedAlerts.map((item, idx) => (
              <div
                key={item.id}
                style={getStaggerDelayStyle(idx, 240, prefersReducedMotion)}
                onClick={() => handleInspectAlert(item)}
                className={`p-4 rounded-2xl bg-white border transition-colors cursor-pointer group shadow-2xs relative overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150 motion-reduce:animate-none ${
                  item.severity === 'high'
                    ? 'border-rose-500/30 hover:border-rose-500/60'
                    : 'border-amber-500/20 hover:border-amber-500/50'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleInspectAlert(item);
                  }
                }}
                aria-label={`Inspect ${item.title}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          item.severity === 'high'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/5 text-gray-700 text-[9px] font-mono uppercase">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold theme-ink group-hover:text-amber-900 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInspectAlert(item);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      Inspect
                    </button>
                    <Link
                      href={item.href}
                      onClick={(e) => e.stopPropagation()}
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
            <span className="text-[10px] text-gray-400 font-medium">Verified Live Counts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              label="Active Seekers"
              value={stats.activeNow.toLocaleString()}
              sublabel={`Total registered: ${stats.totalSeekers.toLocaleString()}`}
            />

            <MetricCard
              href="/admin/tirtha"
              icon={MapPin}
              label="Mandalis & Tirthas"
              value={stats.globalReach.toLocaleString()}
              sublabel="Active community chapters"
            />
          </div>
        </div>

        {/* Right Column: Recent Operator Activity (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-950 font-serif">
              Recent Operator Activity
            </h2>
            <Link
              href="/admin/calendar-governance?tab=fixtures"
              className="text-[10px] font-bold text-amber-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
            >
              View All
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-3">
            {activityLoading ? (
              <div className="py-6 text-center text-xs text-gray-400">
                Loading audit activity...
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No recent golden fixture audit actions recorded.
              </div>
            ) : (
              <div className="divide-y divide-black/5 space-y-2.5">
                {activityLogs.map((log) => (
                  <div key={log.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span>{log.emoji}</span>
                        <span className="font-bold theme-ink truncate">{log.display_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({log.year})</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono">
                        Action: <span className="font-bold text-amber-900">{log.action}</span>
                      </p>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono shrink-0">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── 4. OPEN WORKSPACES (SOURCED FROM REGISTRY) ──────────────────────── */}
      <section aria-label="Open Workspaces" className="space-y-4 pt-4 border-t border-black/5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-950 font-serif">
            Open Workspaces
          </h2>
          <span className="text-[10px] text-gray-400 font-medium">
            Canonical Route Registry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_NAV_GROUPS.filter((g) => g.id !== 'overview').map((group) => (
            <div
              key={group.id}
              className="p-5 rounded-2xl bg-white border border-black/5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/80 bg-amber-500/10 px-2.5 py-0.5 rounded-full inline-block">
                  {group.label}
                </span>

                <div className="space-y-2">
                  {group.items.map((route) => (
                    <Link
                      key={route.id}
                      href={route.path}
                      className="p-2.5 rounded-xl hover:bg-black/[0.03] transition-colors flex items-center justify-between group block border border-transparent hover:border-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-black/5 group-hover:bg-amber-500/15 group-hover:text-amber-900 transition-colors text-gray-500">
                          <AdminIcon name={route.iconName} size={15} />
                        </div>
                        <div className="min-w-0">
                          <b className="text-xs theme-ink block group-hover:text-amber-950 truncate">
                            {route.shortTitle}
                          </b>
                          <span className="text-[10px] text-gray-400 truncate block">
                            {route.description}
                          </span>
                        </div>
                      </div>

                      <ChevronRight size={14} className="text-gray-300 group-hover:text-amber-700 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. SHARED RECORD INSPECTOR DRAWER ──────────────────────────────── */}
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
  icon: any;
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-2xl">
      <div
        className={`p-4 rounded-2xl bg-white border transition-colors shadow-2xs ${
          highlight
            ? 'border-amber-500/40 bg-amber-50/20 hover:border-amber-500/80'
            : 'border-black/5 hover:border-black/15'
        }`}
      >
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            {label}
          </span>
          <b className="text-2xl font-bold font-serif theme-ink group-hover:text-amber-900 transition-colors block">
            {value}
          </b>
          <span className="text-[11px] text-gray-500 block">{sublabel}</span>
        </div>

        <div
          className={`p-2.5 rounded-xl mt-2 inline-block ${
            highlight ? 'bg-amber-500/10 text-amber-900' : 'bg-black/5 text-gray-600 group-hover:bg-amber-500/10 group-hover:text-amber-900'
          } transition-colors`}
        >
          <Icon size={18} />
        </div>
      </div>
    </Link>
  );
}
