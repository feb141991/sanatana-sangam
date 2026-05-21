'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Edit2, Trash2, CheckCircle, AlertCircle,
  Sparkles, RefreshCw, XCircle, ChevronDown, ChevronUp, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type VerificationStatus = 'verified' | 'mismatch' | 'uncertain' | 'not_checked' | 'manual_review';

interface FestivalRow {
  id?: string;
  name: string;
  date: string;
  emoji?: string | null;
  description: string;
  type: 'major' | 'vrat' | 'regional';
  review_status?: 'needs_review' | 'reviewed' | null;
  verification_status?: VerificationStatus | null;
  verification_confidence?: 'high' | 'medium' | 'low' | null;
  verification_note?: string | null;
  suggested_date?: string | null;
  verification_run_at?: string | null;
}

interface VerificationResult {
  name: string;
  storedDate: string;
  rule: string;
  status: VerificationStatus;
  verificationType: string;
  suggestedDate?: string;
  confidence: 'high' | 'medium' | 'low';
  note: string;
}

interface VerificationReport {
  year: number;
  runAt: string;
  totalChecked: number;
  verified: number;
  mismatches: number;
  uncertain: number;
  manualReview: number;
  auditStatus?: 'completed' | 'failed';
  auditFailureReason?: string | null;
  results: VerificationResult[];
  source?: 'database' | 'fallback';
}

interface FestivalAdminStats {
  total: number;
  reviewed: number;
  pendingReview: number;
  aiVerified: number;
  aiMismatches: number;
  aiUncertain: number;
  aiNotChecked: number;
  aiManualReview: number;
  auditFailed: number;
  suggestedDatePending: number;
  unsafeObservanceRoutes: number;
  lastVerificationRunAt: string | null;
}

interface FestivalAdminPayload {
  festivals: FestivalRow[];
  year: number;
  source: 'database' | 'fallback';
  availableYears: number[];
  stats: FestivalAdminStats;
}

export default function FestivalManagement() {
  const router = useRouter();
  const [festivals, setFestivals]           = useState<FestivalRow[]>([]);
  const [loading, setLoading]               = useState(true);
  const [verifying, setVerifying]           = useState(false);
  const [report, setReport]                 = useState<VerificationReport | null>(null);
  const [reportOpen, setReportOpen]         = useState(false);
  const [reportError, setReportError]       = useState<string | null>(null);
  const [selectedYear, setSelectedYear]     = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [stats, setStats]                   = useState<FestivalAdminStats | null>(null);
  const [source, setSource]                 = useState<'database' | 'fallback'>('fallback');

  const fetchFestivals = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/festivals?year=${year}`);
      const data: FestivalAdminPayload | { error?: string } = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok || !('festivals' in data)) {
        throw new Error('error' in data ? data.error : 'Failed to load festivals');
      }
      setFestivals(data.festivals ?? []);
      setSelectedYear(data.year);
      setAvailableYears(data.availableYears ?? [year]);
      setStats(data.stats);
      setSource(data.source);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load festivals';
      toast.error(message);
      setFestivals([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFestivals(selectedYear);
  }, [fetchFestivals, selectedYear]);

  async function runVerification() {
    setVerifying(true);
    setReportError(null);
    setReport(null);
    setReportOpen(true);
    try {
      const res = await fetch('/api/admin/verify-festivals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data: VerificationReport = await res.json();
      setReport(data);
      await fetchFestivals(selectedYear);
      if (data.auditStatus === 'failed') {
        const reason = data.auditFailureReason || 'AI verification failed before a usable audit result was returned';
        setReportError(reason);
        toast.error(`AI audit failed: ${reason}`);
        return;
      }
      if (data.mismatches === 0 && data.uncertain === 0 && data.manualReview === 0) {
        toast.success(`All ${data.totalChecked} dates verified ✅`);
      } else {
        toast.error(`${data.mismatches} mismatch(es), ${data.uncertain} uncertain, ${data.manualReview} manual review`);
      }
    } catch (err: any) {
      setReportError(err.message || 'Verification failed');
      toast.error('AI verification failed — check error below');
    } finally {
      setVerifying(false);
    }
  }

  const statusIcon = (s: VerificationStatus) => {
    if (s === 'verified')   return <CheckCircle size={14} className="text-emerald-500 shrink-0" />;
    if (s === 'mismatch')   return <XCircle     size={14} className="text-rose-500 shrink-0" />;
    if (s === 'uncertain')  return <AlertCircle size={14} className="text-amber-500 shrink-0" />;
    if (s === 'manual_review') return <AlertCircle size={14} className="text-violet-500 shrink-0" />;
    return                         <AlertCircle size={14} className="text-slate-400 shrink-0" />;
  };

  const statusLabel = (s: VerificationStatus) => {
    if (s === 'verified')   return 'bg-emerald-500/10 text-emerald-600';
    if (s === 'mismatch')   return 'bg-rose-500/10 text-rose-600';
    if (s === 'uncertain')  return 'bg-amber-500/10 text-amber-600';
    if (s === 'manual_review') return 'bg-violet-500/10 text-violet-600';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(200,146,74,0.15)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 rounded-xl bg-black/5 hover:bg-black/10 transition-colors">
              <ArrowLeft size={18} className="text-[var(--brand-muted)]" />
            </Link>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Calendar size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Festival Calendar</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Global Content Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="rounded-full border border-black/10 bg-white/80 px-3 py-2 text-xs font-bold text-[var(--brand-muted)]"
            >
              {(availableYears.length > 0 ? availableYears : [selectedYear]).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {/* AI Verify Button */}
            <button
              onClick={runVerification}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-violet-500/10 text-violet-600 hover:bg-violet-500 hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-violet-500/20"
            >
              {verifying
                ? <RefreshCw size={14} className="animate-spin" />
                : <Sparkles size={14} />
              }
              {verifying ? 'Verifying…' : 'Verify Dates with AI'}
            </button>
            <button
              disabled
              className="bg-emerald-500/50 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-not-allowed"
              title="Festival create/edit flow is staged; verification and review are live."
            >
              <Plus size={16} /> Add Festival (staged)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
            {[
              { label: 'Rows', value: stats.total, tone: 'text-slate-700' },
              { label: 'Pending review', value: stats.pendingReview, tone: 'text-amber-600' },
              { label: 'AI mismatches', value: stats.aiMismatches, tone: 'text-rose-600' },
              { label: 'AI not checked', value: stats.aiNotChecked, tone: 'text-slate-600' },
              { label: 'Manual review', value: stats.aiManualReview, tone: 'text-violet-600' },
              { label: 'Audit failed', value: stats.auditFailed, tone: 'text-red-700' },
              { label: 'Unsafe Vrat routes', value: stats.unsafeObservanceRoutes, tone: 'text-orange-600' },
            ].map((card) => (
              <div key={card.label} className="glass-panel rounded-3xl p-4 border border-black/5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-muted)]">{card.label}</p>
                <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-black/5 bg-black/[0.02] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-muted)]">Calendar source</p>
              <p className="mt-1 text-sm theme-ink">
                {source === 'database' ? 'Live festival table' : 'Static fallback calendar'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-muted)]">Last verification</p>
              <p className="mt-1 text-sm theme-ink">
                {stats?.lastVerificationRunAt
                  ? new Date(stats.lastVerificationRunAt).toLocaleString('en-GB')
                  : 'No persisted verification yet'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Verification Report Panel ── */}
        <AnimatePresence>
          {reportOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass-panel rounded-[2rem] border border-violet-500/20 bg-violet-500/5 overflow-hidden"
            >
              {/* Report header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-violet-500/10">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-violet-500" />
                  <span className="text-sm font-bold theme-ink">AI Panchang Verification Report</span>
                  {report && (
                    <span className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">
                      {report.year} · {report.totalChecked} checked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {report && (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">✅ {report.verified} ok</span>
                      {report.mismatches > 0 && <span className="px-2 py-1 rounded-full bg-rose-500/10 text-rose-600">❌ {report.mismatches} wrong</span>}
                      {report.uncertain  > 0 && <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">⚠️ {report.uncertain} uncertain</span>}
                      {report.manualReview > 0 && <span className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-600">📝 {report.manualReview} manual</span>}
                    </div>
                  )}
                  <button onClick={() => setReportOpen(false)} className="p-1 rounded-lg hover:bg-black/5 text-[var(--brand-muted)]">
                    <XCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Loading state */}
              {verifying && (
                <div className="flex items-center justify-center py-16 gap-4">
                  <RefreshCw size={24} className="animate-spin text-violet-500" />
                  <span className="text-sm text-[var(--brand-muted)]">Consulting the Panchang AI…</span>
                </div>
              )}

              {/* Error state */}
              {reportError && !verifying && (
                <div className="px-6 py-8 text-center">
                  <AlertCircle size={32} className="text-rose-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-rose-600">
                    {report ? 'Verification completed with audit failures' : 'Verification failed'}
                  </p>
                  <p className="text-xs text-[var(--brand-muted)] mt-1">{reportError}</p>
                </div>
              )}

              {/* Results */}
              {report && !verifying && (
                <div className="divide-y divide-black/5">
                  {/* Mismatches first */}
                  {report.results
                    .slice()
                    .sort((a, b) => {
                      const order: Record<VerificationStatus, number> = { mismatch: 0, uncertain: 1, manual_review: 2, not_checked: 3, verified: 4 };
                      return order[a.status] - order[b.status];
                    })
                    .map((r) => (
                      <div key={r.name} className="flex items-start gap-4 px-6 py-4 hover:bg-black/[0.02] transition-colors">
                        <div className="mt-0.5">{statusIcon(r.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold theme-ink">{r.name}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusLabel(r.status)}`}>
                              {r.status}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">
                              {r.verificationType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--brand-muted)] uppercase tracking-widest">
                              conf: {r.confidence}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-[var(--brand-muted)]">Stored: <strong>{r.storedDate}</strong></span>
                            {r.suggestedDate && (
                              <span className="text-xs text-rose-600 font-bold">→ Should be: {r.suggestedDate}</span>
                            )}
                          </div>
                          {r.note && <p className="text-[11px] text-[var(--brand-muted)] mt-1 italic">{r.note}</p>}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Festival Grid ── */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                {festivals.length} festivals in {selectedYear}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand-muted)]">
                {source === 'database' ? 'live source' : 'fallback source'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {festivals.map((fest) => (
                <motion.div
                  key={fest.id ?? `${fest.name}-${fest.date}`}
                  className="glass-panel rounded-3xl p-6 border border-black/5 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{fest.emoji || '🕉️'}</div>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${fest.type === 'major' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                      {fest.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold theme-ink">{fest.name}</h3>
                  <p className="text-xs text-[var(--brand-muted)] mt-1">
                    {new Date(fest.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-sm theme-dim mt-3 line-clamp-2">{fest.description}</p>

                  <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="p-2 rounded-xl bg-black/5 text-[var(--brand-muted)] opacity-50 cursor-not-allowed"
                        title="Editing is staged; this admin surface is currently review-first."
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        disabled
                        className="p-2 rounded-xl bg-black/5 text-[var(--brand-muted)] opacity-50 cursor-not-allowed"
                        title="Deletion is staged; this admin surface is currently review-first."
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 justify-end ${fest.review_status === 'reviewed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {fest.review_status === 'reviewed'
                          ? <><CheckCircle size={12} /> Reviewed</>
                          : <><AlertCircle size={12} /> Pending</>
                        }
                      </span>
                      {fest.verification_status && (
                        <span className={`inline-flex text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusLabel(fest.verification_status)}`}>
                          AI {fest.verification_status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {fest.suggested_date && (
                    <p className="mt-3 text-[11px] text-rose-600 font-semibold">
                      Suggested date: {fest.suggested_date}
                    </p>
                  )}
                  {fest.verification_note && (
                    <p className="mt-2 text-[11px] text-[var(--brand-muted)] leading-relaxed">
                      {fest.verification_note}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
