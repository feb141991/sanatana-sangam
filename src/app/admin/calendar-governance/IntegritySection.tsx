'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, RefreshCw, Search,
  Activity, ShieldAlert, CheckSquare, ChevronDown, ChevronUp,
  Terminal, Copy, Check, Sparkles, Play, Eye, Loader2
} from 'lucide-react';

export type ToastFeedback = {
  id: string;
  tone: 'ok' | 'info' | 'warn' | 'danger';
  title: string;
  detail: string;
  timestamp: string;
};

export type IntegrityFindingRow = {
  id: string;
  slug: string;
  display_name: string;
  year: number;
  stored_date: string | null;
  engine_date: string | null;
  candidate_dates: string[] | null;
  issue_type: string;
  reason: string;
  engine_version: string;
  detected_at: string;
  last_seen_at: string;
  is_open: boolean;
  resolved_at: string | null;
};

export type IntegrityStats = {
  total: number;
  openCount: number;
  resolvedCount: number;
  mismatchCount: number;
  missingSourceCount: number;
  multiCandidateCount: number;
  unreviewedCount: number;
  byYear: Record<number, number>;
};

export default function IntegritySection({
  targetFindingId,
  targetSlug,
  targetYear,
  onToast,
  onInspectFixture,
}: {
  targetFindingId?: string | null;
  targetSlug?: string | null;
  targetYear?: string | null;
  onToast: (toast: ToastFeedback) => void;
  onInspectFixture: (slug: string) => void;
}) {
  const [findings, setFindings] = useState<IntegrityFindingRow[]>([]);
  const [stats, setStats] = useState<IntegrityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [expandedId, setExpandedId] = useState<string | null>(targetFindingId || null);
  const [diagnosingSlug, setDiagnosingSlug] = useState<string | null>(null);
  const [diagnosticsCache, setDiagnosticsCache] = useState<Record<string, any>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [isResolvingAll, setIsResolvingAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchIntegrityData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      if (yearFilter !== 'all') params.set('year', yearFilter);
      if (typeFilter !== 'all') params.set('issue_type', typeFilter);
      if (searchQuery.trim()) params.set('slug', searchQuery.trim());

      const res = await fetch(`/api/admin/calendar-governance/integrity?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch integrity findings (${res.status})`);
      const data = await res.json();
      setFindings(data.findings || []);
      setStats(data.stats || null);

      if (targetFindingId) {
        setExpandedId(targetFindingId);
      }
    } catch (err: any) {
      onToast({
        id: Date.now().toString(),
        tone: 'danger',
        title: 'Fetch Error',
        detail: err.message || 'Could not load calendar integrity findings',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, yearFilter, typeFilter, searchQuery, targetFindingId, onToast]);

  useEffect(() => {
    fetchIntegrityData();
  }, [fetchIntegrityData]);

  const handleResolve = async (finding: IntegrityFindingRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setResolvingId(finding.id);
    try {
      const action = finding.is_open ? 'resolve' : 'unresolve';
      const res = await fetch('/api/admin/calendar-governance/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: finding.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update finding status');

      onToast({
        id: Date.now().toString(),
        tone: 'ok',
        title: finding.is_open ? 'Finding Resolved' : 'Finding Reopened',
        detail: `${finding.display_name} (${finding.year}) marked as ${finding.is_open ? 'resolved' : 'open'}.`,
        timestamp: new Date().toLocaleTimeString(),
      });

      fetchIntegrityData();
    } catch (err: any) {
      onToast({
        id: Date.now().toString(),
        tone: 'danger',
        title: 'Action Failed',
        detail: err.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setResolvingId(null);
    }
  };

  const handleResolveAll = async () => {
    if (!confirm('Are you sure you want to mark all currently open calendar integrity findings as resolved?')) return;
    setIsResolvingAll(true);
    try {
      const res = await fetch('/api/admin/calendar-governance/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_all',
          year: yearFilter !== 'all' ? parseInt(yearFilter, 10) : undefined,
          issue_type: typeFilter !== 'all' ? typeFilter : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve all findings');

      onToast({
        id: Date.now().toString(),
        tone: 'ok',
        title: 'All Open Findings Resolved',
        detail: `${data.resolvedCount ?? 0} open findings marked as resolved.`,
        timestamp: new Date().toLocaleTimeString(),
      });

      fetchIntegrityData();
    } catch (err: any) {
      onToast({
        id: Date.now().toString(),
        tone: 'danger',
        title: 'Action Failed',
        detail: err.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsResolvingAll(false);
    }
  };

  const handleRunLiveDiagnostic = async (finding: IntegrityFindingRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cacheKey = `${finding.slug}:${finding.year}`;
    setDiagnosingSlug(cacheKey);
    try {
      const res = await fetch('/api/admin/calendar-governance/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'diagnose',
          slug: finding.slug,
          year: finding.year,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diagnostic evaluation failed');

      setDiagnosticsCache((prev) => ({
        ...prev,
        [cacheKey]: data.diagnostics || [],
      }));

      onToast({
        id: Date.now().toString(),
        tone: 'info',
        title: 'Live Diagnostic Complete',
        detail: `Calculated ${data.diagnostics?.length || 0} candidate rule variant(s) for ${finding.display_name}.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      onToast({
        id: Date.now().toString(),
        tone: 'danger',
        title: 'Diagnostic Error',
        detail: err.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setDiagnosingSlug(null);
    }
  };

  const handleCopyJson = (finding: IntegrityFindingRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(finding, null, 2));
    setCopiedId(finding.id);
    setTimeout(() => setCopiedId(null), 2000);
    onToast({
      id: Date.now().toString(),
      tone: 'info',
      title: 'Copied to Clipboard',
      detail: `Integrity diagnostic JSON for ${finding.slug} (${finding.year}) copied.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const filteredFindings = useMemo(() => {
    if (!searchQuery.trim()) return findings;
    const q = searchQuery.toLowerCase().trim();
    return findings.filter(
      (f) =>
        f.display_name?.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        f.reason?.toLowerCase().includes(q)
    );
  }, [findings, searchQuery]);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-600">Open Discrepancies</span>
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div className="text-3xl font-bold text-rose-700">{stats?.openCount ?? 0}</div>
          <p className="text-[11px] text-[var(--brand-muted)] mt-1">Requires reviewer verification</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Engine Mismatches</span>
            <Activity size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-amber-700">{stats?.mismatchCount ?? 0}</div>
          <p className="text-[11px] text-[var(--brand-muted)] mt-1">Stored date != engine date</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">Missing Sources</span>
            <ShieldAlert size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-700">{stats?.missingSourceCount ?? 0}</div>
          <p className="text-[11px] text-[var(--brand-muted)] mt-1">Launch critical without citation</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Resolved Archive</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-700">{stats?.resolvedCount ?? 0}</div>
          <p className="text-[11px] text-[var(--brand-muted)] mt-1">Historical verified findings</p>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-black/5 bg-white/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by observance name, slug, or reason..."
              className="w-full pl-9 pr-4 py-2 bg-black/5 border border-black/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[var(--premium-gold)]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'open' ? 'bg-white shadow-sm text-rose-700' : 'text-[var(--brand-muted)] hover:text-black'}`}
            >
              Open ({stats?.openCount ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'resolved' ? 'bg-white shadow-sm text-emerald-700' : 'text-[var(--brand-muted)] hover:text-black'}`}
            >
              Resolved ({stats?.resolvedCount ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white shadow-sm text-black' : 'text-[var(--brand-muted)] hover:text-black'}`}
            >
              All ({stats?.total ?? 0})
            </button>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl shrink-0">
            {['all', '2025', '2026', '2027'].map((yr) => (
              <button
                key={yr}
                onClick={() => setYearFilter(yr)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${yearFilter === yr ? 'bg-white shadow-sm theme-ink' : 'text-[var(--brand-muted)] hover:text-black'}`}
              >
                {yr === 'all' ? 'All Years' : yr}
              </button>
            ))}
          </div>
        </div>

        {/* Second Toolbar Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[var(--brand-muted)] tracking-wider">Issue Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1 bg-white border border-black/10 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-[var(--premium-gold)]"
            >
              <option value="all">All Issue Types</option>
              <option value="engine_curated_mismatch">Engine vs Curated Mismatch</option>
              <option value="missing_external_source">Missing External Source</option>
              <option value="multiple_candidates_needs_review">Multiple Candidates</option>
              <option value="unreviewed_or_not_verified">Unreviewed / Unverified</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchIntegrityData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-[var(--premium-gold)]' : ''} />
              <span>Refresh</span>
            </button>

            {statusFilter === 'open' && (stats?.openCount ?? 0) > 0 && (
              <button
                onClick={handleResolveAll}
                disabled={isResolvingAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                <CheckSquare size={13} />
                <span>{isResolvingAll ? 'Resolving All...' : 'Resolve All Open'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Findings List */}
      {loading ? (
        <div className="p-12 text-center text-[var(--brand-muted)] flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Analyzing calendar integrity telemetry...
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-black/5 bg-white/40 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-bold theme-ink">No Integrity Findings Found</h3>
          <p className="text-xs text-[var(--brand-muted)] max-w-md mx-auto">
            All stored calendar occurrences are in sync with the deterministic calculation engine for the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFindings.map((finding) => {
            const isTarget = targetFindingId === finding.id || targetSlug === finding.slug;
            const isExpanded = expandedId === finding.id;
            const cacheKey = `${finding.slug}:${finding.year}`;
            const liveDiag = diagnosticsCache[cacheKey];

            return (
              <div
                key={finding.id}
                id={`finding-${finding.id}`}
                className={`glass-panel rounded-2xl border transition-all duration-300 p-5 bg-white/70 ${
                  isTarget
                    ? 'ring-2 ring-[var(--premium-gold)] border-[var(--premium-gold)] shadow-lg bg-amber-50/20'
                    : 'border-black/5 hover:border-black/15 shadow-sm'
                } ${!finding.is_open ? 'opacity-70 bg-black/[0.01]' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold theme-ink">{finding.display_name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-black/5 font-mono text-[11px] font-bold text-gray-700">
                        {finding.slug}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[10px] font-bold">
                        {finding.year}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          finding.issue_type === 'engine_curated_mismatch'
                            ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                            : finding.issue_type === 'missing_external_source'
                            ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                        }`}
                      >
                        {finding.issue_type.replace(/_/g, ' ')}
                      </span>
                      {!finding.is_open && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold">
                          ✓ Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--brand-muted)] leading-relaxed">
                      Detected: {new Date(finding.detected_at).toLocaleString()} · Last Seen: {new Date(finding.last_seen_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Top Right Quick Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleResolve(finding, e)}
                      disabled={resolvingId === finding.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        finding.is_open
                          ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                          : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{resolvingId === finding.id ? 'Updating...' : finding.is_open ? 'Mark Resolved' : 'Reopen'}</span>
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                      className="p-1.5 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all"
                      title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Comparative Diff Visualization Box */}
                <div className="mt-4 p-3.5 rounded-xl bg-black/[0.02] border border-black/5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--brand-muted)] tracking-wider block">
                      📁 Stored Database Date (Curated)
                    </span>
                    <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-black/10 inline-block">
                      {finding.stored_date || 'None / Null'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--brand-muted)] tracking-wider block">
                      ⚡ Deterministic Engine Date
                    </span>
                    <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-black/10 text-amber-900 inline-block">
                      {finding.engine_date || 'Null (Gated or Multi)'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--brand-muted)] tracking-wider block">
                      🎯 Candidate Dates ({finding.candidate_dates?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {finding.candidate_dates && finding.candidate_dates.length > 0 ? (
                        finding.candidate_dates.slice(0, 4).map((d) => (
                          <span key={d} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-black/10 text-gray-700">
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[var(--brand-muted)]">No candidate dates recorded</span>
                      )}
                      {(finding.candidate_dates?.length || 0) > 4 && (
                        <span className="text-[10px] text-[var(--brand-muted)] font-mono self-center">
                          +{finding.candidate_dates!.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details / Logs Panel */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-black/5 space-y-4">
                    {/* Reason / Diagnostic Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold theme-ink flex items-center gap-1.5">
                          <Terminal size={13} className="text-amber-600" />
                          <span>Audit Diagnostic Reason & Logs:</span>
                        </span>
                        <button
                          onClick={(e) => handleCopyJson(finding, e)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[var(--premium-gold)] hover:underline"
                        >
                          {copiedId === finding.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedId === finding.id ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs leading-relaxed space-y-2 overflow-x-auto">
                        <p className="text-amber-300 font-sans font-medium">{finding.reason}</p>
                        <div className="text-[11px] text-stone-400 pt-1 border-t border-stone-800 flex items-center justify-between flex-wrap gap-2">
                          <span>Engine Version: <code className="text-emerald-400">{finding.engine_version}</code></span>
                          <span>ID: <code className="text-stone-500">{finding.id}</code></span>
                        </div>
                      </div>
                    </div>

                    {/* Live Engine Diagnostic Output (if run) */}
                    {liveDiag && (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-600" />
                            <span>Live Calculation Engine Output ({finding.slug} · {finding.year}):</span>
                          </span>
                          <span className="text-[10px] font-mono text-amber-700">
                            {liveDiag.length} Diagnostic Rule(s)
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {liveDiag.map((diag: any, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-sm space-y-1">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="font-bold text-gray-900">{diag.displayName || diag.slug}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  Rule: {diag.ruleKey}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600">Selected Date: <b className="font-mono text-emerald-700">{diag.selectedDate || 'None'}</b></p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                <span className="text-[10px] text-gray-500">All Candidate Dates:</span>
                                {diag.candidateDates?.map((cd: string) => (
                                  <span key={cd} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-800">
                                    {cd}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => onInspectFixture(finding.slug)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-gray-800 transition-all"
                      >
                        <Eye size={13} className="text-[var(--premium-gold)]" />
                        <span>Inspect Golden Fixture</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleRunLiveDiagnostic(finding, e)}
                          disabled={diagnosingSlug === cacheKey}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <Play size={13} className={diagnosingSlug === cacheKey ? 'animate-spin' : ''} />
                          <span>{diagnosingSlug === cacheKey ? 'Evaluating Engine...' : 'Run Live Engine Diagnostic'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
