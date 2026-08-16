'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, Pencil, Save, X,
  BarChart3, ListChecks, FileCheck2, ChevronDown, ChevronRight,
  Filter, Search, AlertCircle, History, Clock, RefreshCw, FileEdit,
  Sparkles, Info
} from 'lucide-react';
import Link from 'next/link';
import { CANONICAL_RULES } from '@/lib/calendar/rules';

// ── Types ─────────────────────────────────────────────────────────────────

type GoldenFixtureRow = {
  case_id: string;
  festival_id: string;
  year: number;
  location: { label: string; lat: number; lon: number; tz: string };
  profile: { calendar: string; tradition: string; variantKey?: string };
  expected: { civilDate: string | null; [k: string]: unknown } | null;
  tolerance: { windowMinutes: number };
  source: { tier: number; ref: string; citation: string; verifiedBy: string; verifiedOn: string };
  reasoning: string;
  approved: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  tradition: string;
  kind: string;
  rule_family: string;
  launch_status: string;
  // Read-only engine convenience -- never the sourced answer key itself.
  // See src/lib/calendar/fixture-engine-hint.ts for why.
  engineHint?: { civilDate: string | null; candidateDates: string[]; publicationWithheld: boolean; error?: string };
};

type ReviewQueueRow = {
  id: string;
  year: number;
  calendar_profile: string;
  location_label: string;
  ambiguity_type: string;
  spiritual_tradition: string | null;
  variant_key: string;
  reasoning: string;
  candidate_dates: string[];
  review_status: string;
  reviewed_by: string | null;
  observance_definitions: { slug: string; display_name: string } | { slug: string; display_name: string }[] | null;
};

type CoverageRow = {
  slug: string;
  tradition: string;
  launchStatus: string;
  hasFixtureFile: boolean;
  realFixtures: number;
  approvedFixtures: number;
};

type CoverageResponse = {
  totalSlugs: number;
  totalFixtureRows: number;
  realFixtureRows: number;
  approvedFixtureRows: number;
  byTradition: Record<string, { total: number; live: number; liveUnfixtured: number; deferred: number }>;
  rows: CoverageRow[];
};

type AuditLogRow = {
  id: string;
  case_id: string;
  festival_id: string;
  year: number;
  actor: string;
  action: 'newly_approved' | 're_confirmed' | 'rejected' | 'content_updated';
  previous_approved: boolean | null;
  new_approved: boolean | null;
  review_notes: string | null;
  diff: Record<string, unknown>;
  created_at: string;
  display_name: string;
  emoji: string;
  tradition: string;
};

type ToastFeedback = {
  id: string;
  tone: 'ok' | 'info' | 'warn' | 'danger';
  title: string;
  detail: string;
  timestamp: string;
};

type Tab = 'fixtures' | 'review-queue' | 'coverage' | 'activity';
type SourceFilter = 'all' | 'real' | 'stub' | 'approved';
type CategorySel = { tradition: string; kind: string | null } | null;

const TRADITION_LABELS: Record<string, string> = {
  hindu: 'Hindu', sikh: 'Sikh', buddhist: 'Buddhist', jain: 'Jain', all: 'All traditions',
};
const KIND_LABELS: Record<string, string> = {
  major: 'Major festivals', vrat: 'Vrats', regional: 'Regional',
};
const TRADITION_ORDER = ['hindu', 'sikh', 'buddhist', 'jain', 'all'];
const KIND_ORDER = ['major', 'vrat', 'regional'];

const isRealFixture = (f: GoldenFixtureRow) =>
  f.expected != null && !(f.source?.ref ?? '').startsWith('TODO');

export default function CalendarGovernancePage() {
  const [tab, setTab] = useState<Tab>('coverage');
  const [toasts, setToasts] = useState<ToastFeedback[]>([]);
  const [governanceFilter, setGovernanceFilter] = useState<{
    tradition?: string;
    filterType?: SourceFilter;
  } | null>(null);

  const addToast = useCallback((t: ToastFeedback) => {
    setToasts(prev => [t, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== t.id));
    }, 6000);
  }, []);

  const navigateToFixtures = (tradition?: string, filterType?: SourceFilter) => {
    setGovernanceFilter({ tradition, filterType });
    setTab('fixtures');
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Calendar Governance</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">
                Golden Fixtures · Review Queue · Activity Log · Coverage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TabButton active={tab === 'coverage'} onClick={() => setTab('coverage')} icon={BarChart3} label="Coverage" />
            <TabButton active={tab === 'fixtures'} onClick={() => setTab('fixtures')} icon={FileCheck2} label="Fixtures" />
            <TabButton active={tab === 'review-queue'} onClick={() => setTab('review-queue')} icon={ListChecks} label="Review Queue" />
            <TabButton active={tab === 'activity'} onClick={() => setTab('activity')} icon={History} label="Activity Log" />
          </div>
        </div>
      </div>

      {/* Floating Real-Time Action Feedback Toasts */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-xl transition-all animate-in slide-in-from-bottom-5 duration-300 ${
              t.tone === 'ok' ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/30'
              : t.tone === 'warn' ? 'bg-amber-950/90 text-amber-100 border-amber-500/30'
              : t.tone === 'danger' ? 'bg-rose-950/90 text-rose-100 border-rose-500/30'
              : 'bg-stone-900/90 text-stone-100 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                {t.tone === 'ok' && <CheckCircle2 size={14} className="text-emerald-400" />}
                {t.tone === 'warn' && <FileEdit size={14} className="text-amber-400" />}
                {t.tone === 'danger' && <XCircle size={14} className="text-rose-400" />}
                {t.tone === 'info' && <Info size={14} className="text-sky-400" />}
                <span>{t.title}</span>
              </div>
              <span className="text-[9px] opacity-60 shrink-0">{t.timestamp}</span>
            </div>
            <p className="text-xs opacity-90 mt-1 leading-relaxed">{t.detail}</p>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {tab === 'coverage' && <CoverageSection onSelectFilter={navigateToFixtures} />}
        {tab === 'fixtures' && <FixturesSection initialFilter={governanceFilter} onToast={addToast} />}
        {tab === 'review-queue' && <ReviewQueueSection onToast={addToast} />}
        {tab === 'activity' && <ActivitySection />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof BarChart3; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
        active ? 'bg-[var(--premium-gold)] text-white' : 'text-[var(--brand-muted)] hover:bg-black/5'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

// ── Coverage ──────────────────────────────────────────────────────────────

function CoverageSection({
  onSelectFilter,
}: {
  onSelectFilter: (tradition?: string, filterType?: SourceFilter) => void;
}) {
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTradition, setSelectedTradition] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'total' | 'live' | 'liveUnfixtured' | 'deferred' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/admin/calendar-governance/coverage')
      .then(r => r.json())
      .then(json => { if (json.error) setError(json.error); else setData(json); })
      .catch(e => setError(String(e)));
  }, []);

  const filteredSlugs = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.filter((row) => {
      if (selectedTradition && row.tradition !== selectedTradition) return false;
      if (selectedMetric === 'live' && row.launchStatus !== 'included') return false;
      if (selectedMetric === 'deferred' && row.launchStatus !== 'deferred') return false;
      if (selectedMetric === 'liveUnfixtured' && (row.launchStatus !== 'included' || row.realFixtures > 0)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return row.slug.toLowerCase().includes(q) || row.tradition.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, selectedTradition, selectedMetric, searchQuery]);

  if (error) return <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>;
  if (!data) return <LoadingBlock label="Loading coverage..." />;

  const clearFilters = () => {
    setSelectedTradition(null);
    setSelectedMetric(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-8">
      {/* Interactive Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Rule Slugs"
          value={data.totalSlugs}
          active={selectedTradition === null && selectedMetric === null}
          onClick={clearFilters}
        />
        <StatCard
          label="Fixture Rows"
          value={data.totalFixtureRows}
          onClick={() => onSelectFilter(undefined, 'all')}
        />
        <StatCard
          label="Real (Sourced) Rows"
          value={data.realFixtureRows}
          tone={data.realFixtureRows > 0 ? 'ok' : 'warn'}
          onClick={() => onSelectFilter(undefined, 'real')}
        />
        <StatCard
          label="Approved Rows"
          value={data.approvedFixtureRows}
          tone={data.approvedFixtureRows > 0 ? 'ok' : 'danger'}
          onClick={() => onSelectFilter(undefined, 'approved')}
        />
      </div>

      {/* Interactive Tradition Breakdown Table */}
      <div className="glass-panel rounded-[2rem] border border-black/5 bg-white/40 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-muted)]">
            Tradition Coverage Matrix (Click any cell to filter rules)
          </span>
          {(selectedTradition || selectedMetric) && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--premium-gold)] hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear Filter ({selectedTradition || 'All'} · {selectedMetric || 'All'})
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] bg-black/[0.02]">
              <th className="px-4 py-3">Tradition</th>
              <th className="px-4 py-3 text-right">Total Rules</th>
              <th className="px-4 py-3 text-right">Live</th>
              <th className="px-4 py-3 text-right">Live, Unfixtured</th>
              <th className="px-4 py-3 text-right">Deferred</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.byTradition).map(([trad, t]) => {
              const isTradActive = selectedTradition === trad;
              return (
                <tr key={trad} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedTradition(isTradActive ? null : trad);
                        setSelectedMetric(null);
                      }}
                      className={`font-bold capitalize transition-all ${
                        isTradActive ? 'text-[var(--premium-gold)] underline' : 'theme-ink hover:text-[var(--premium-gold)]'
                      }`}
                    >
                      {trad}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <button
                      onClick={() => { setSelectedTradition(trad); setSelectedMetric(null); }}
                      className="hover:underline"
                    >
                      {t.total}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <button
                      onClick={() => { setSelectedTradition(trad); setSelectedMetric('live'); }}
                      className="text-emerald-600 hover:underline font-bold"
                    >
                      {t.live}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <button
                      onClick={() => { setSelectedTradition(trad); setSelectedMetric('liveUnfixtured'); }}
                      className={`${t.liveUnfixtured > 0 ? 'text-amber-600 font-bold' : 'text-[var(--brand-muted)]'} hover:underline`}
                    >
                      {t.liveUnfixtured}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <button
                      onClick={() => { setSelectedTradition(trad); setSelectedMetric('deferred'); }}
                      className="text-[var(--brand-muted)] hover:underline"
                    >
                      {t.deferred}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Filtered Rule Slugs Interactive Inspector */}
      <div className="glass-panel rounded-[2rem] border border-black/5 bg-white/40 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-muted)]">
              Filtered Rule Inspector ({filteredSlugs.length})
            </span>
            {selectedTradition && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--premium-gold)]/10 text-[var(--premium-gold)] text-[10px] font-bold uppercase">
                {selectedTradition}
              </span>
            )}
            {selectedMetric && (
              <span className="px-2 py-0.5 rounded-full bg-black/5 text-[var(--brand-muted)] text-[10px] font-bold uppercase">
                {selectedMetric}
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" />
            <input
              type="text"
              placeholder="Search rule slugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-black/[0.03] border border-black/5 text-xs theme-ink focus:outline-none focus:border-[var(--premium-gold)] w-48 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {filteredSlugs.map((r) => (
            <button
              key={r.slug}
              onClick={() => onSelectFilter(r.tradition, 'all')}
              className="text-left p-3 rounded-xl bg-black/[0.02] border border-black/5 hover:bg-black/[0.04] transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold theme-ink truncate group-hover:text-[var(--premium-gold)]">
                  {r.slug}
                </p>
                <p className="text-[10px] text-[var(--brand-muted)] capitalize">
                  {r.tradition} · {r.launchStatus}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.approvedFixtures > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                    ✓ {r.approvedFixtures}
                  </span>
                ) : r.realFixtures > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                    {r.realFixtures} src
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md bg-black/5 text-[var(--brand-muted)] text-[10px]">
                    0
                  </span>
                )}
              </div>
            </button>
          ))}
          {filteredSlugs.length === 0 && (
            <p className="text-xs text-[var(--brand-muted)] col-span-full py-4 text-center">
              No rule slugs match the active filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, tone, active, onClick,
}: {
  label: string; value: number; tone?: 'ok' | 'warn' | 'danger'; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left glass-panel rounded-2xl border p-4 space-y-1 transition-all ${
        active ? 'border-[var(--premium-gold)] ring-1 ring-[var(--premium-gold)] bg-white/60' : 'border-black/5 bg-white/40 hover:bg-white/60'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)]">{label}</p>
      <p className={`text-2xl font-bold font-serif ${
        tone === 'ok' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : tone === 'danger' ? 'text-rose-600' : 'theme-ink'
      }`}>
        {value}
      </p>
    </button>
  );
}

// ── Category Rail ──────────────────────────────────────────────────────────

function buildCategoryStats(rows: GoldenFixtureRow[]) {
  const stats: Record<string, { fixtureCount: number; liveRules: number; kinds: Record<string, { fixtureCount: number; liveRules: number }> }> = {};

  const ensure = (trad: string, kind: string) => {
    if (!stats[trad]) stats[trad] = { fixtureCount: 0, liveRules: 0, kinds: {} };
    if (!stats[trad].kinds[kind]) stats[trad].kinds[kind] = { fixtureCount: 0, liveRules: 0 };
  };

  const seenSlugs = new Set<string>();
  for (const rule of CANONICAL_RULES) {
    if (seenSlugs.has(rule.slug)) continue;
    seenSlugs.add(rule.slug);
    if ((rule.launch_status ?? 'included') !== 'included') continue;
    const trad = rule.tradition ?? 'unknown';
    const kind = rule.kind ?? 'unknown';
    ensure(trad, kind);
    stats[trad].liveRules++;
    stats[trad].kinds[kind].liveRules++;
  }

  for (const r of rows) {
    const trad = r.tradition ?? 'unknown';
    const kind = r.kind ?? 'unknown';
    ensure(trad, kind);
    stats[trad].fixtureCount++;
    stats[trad].kinds[kind].fixtureCount++;
  }

  return stats;
}

function CategoryRail({ rows, sel, onSelect }: {
  rows: GoldenFixtureRow[];
  sel: CategorySel;
  onSelect: (s: CategorySel) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['hindu', 'sikh', 'buddhist', 'jain']));
  const stats = useMemo(() => buildCategoryStats(rows), [rows]);

  const toggle = (trad: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(trad)) next.delete(trad); else next.add(trad);
      return next;
    });
  };

  return (
    <div className="w-52 shrink-0 space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          !sel ? 'bg-[var(--premium-gold)] text-white' : 'text-[var(--brand-muted)] hover:bg-black/5'
        }`}
      >
        All traditions ({rows.length})
      </button>

      {TRADITION_ORDER.filter(t => stats[t]).map(trad => {
        const s = stats[trad];
        const open = expanded.has(trad);
        const tradActive = sel?.tradition === trad && sel.kind === null;
        return (
          <div key={trad}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { if (!open) toggle(trad); onSelect({ tradition: trad, kind: null }); }}
                className={`flex-1 text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  tradActive ? 'bg-[var(--premium-gold)] text-white' : 'text-[var(--brand-muted)] hover:bg-black/5'
                }`}
              >
                <span className="capitalize">{TRADITION_LABELS[trad] ?? trad}</span>
                <span className={`text-[10px] ${tradActive ? 'opacity-80' : 'opacity-60'}`}>{s.fixtureCount} cases</span>
              </button>
              <button
                onClick={() => toggle(trad)}
                className="p-1.5 rounded-lg text-[var(--brand-muted)] hover:bg-black/5 transition-all"
              >
                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            </div>
            {open && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-black/5 pl-2">
                {KIND_ORDER.filter(k => s.kinds[k]).map(kind => {
                  const ks = s.kinds[kind];
                  const kindActive = sel?.tradition === trad && sel?.kind === kind;
                  return (
                    <button
                      key={kind}
                      onClick={() => onSelect({ tradition: trad, kind })}
                      className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-all ${
                        kindActive
                          ? 'bg-[var(--premium-gold)]/15 text-[var(--premium-gold)] font-bold'
                          : 'text-[var(--brand-muted)] hover:bg-black/5'
                      }`}
                    >
                      <span>{KIND_LABELS[kind] ?? kind}</span>
                      <span className="text-[10px] opacity-60">{ks.fixtureCount}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Golden Fixtures ────────────────────────────────────────────────────────

function FixturesSection({
  initialFilter,
  onToast,
}: {
  initialFilter?: { tradition?: string; filterType?: SourceFilter } | null;
  onToast?: (t: ToastFeedback) => void;
}) {
  const [rows, setRows] = useState<GoldenFixtureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(initialFilter?.filterType ?? 'real');
  const [categorySel, setCategorySel] = useState<CategorySel>(
    initialFilter?.tradition ? { tradition: initialFilter.tradition, kind: null } : null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/calendar-governance/fixtures');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch fixtures');
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fixtures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categoryFiltered = useMemo(() => {
    if (!categorySel) return rows;
    return rows.filter(f => {
      if (f.tradition !== categorySel.tradition) return false;
      if (categorySel.kind && f.kind !== categorySel.kind) return false;
      return true;
    });
  }, [rows, categorySel]);

  const handleSelectCategory = (sel: CategorySel) => {
    setCategorySel(sel);
    const match = !sel ? rows : rows.filter(f => f.tradition === sel.tradition && (!sel.kind || f.kind === sel.kind));
    const realCount = match.filter(isRealFixture).length;
    if (realCount === 0 && match.length > 0) {
      setSourceFilter("all");
    }
  };

  const filtered = useMemo(() => {
    if (sourceFilter === 'all')      return categoryFiltered;
    if (sourceFilter === 'real')     return categoryFiltered.filter(isRealFixture);
    if (sourceFilter === 'stub')     return categoryFiltered.filter(f => !isRealFixture(f));
    return categoryFiltered.filter(f => f.approved);
  }, [categoryFiltered, sourceFilter]);

  const counts = useMemo(() => ({
    real:     categoryFiltered.filter(isRealFixture).length,
    stub:     categoryFiltered.filter(f => !isRealFixture(f)).length,
    approved: categoryFiltered.filter(f => f.approved).length,
    all:      categoryFiltered.length,
  }), [categoryFiltered]);

  async function act(caseId: string, action: 'approve' | 'reject') {
    setBusyId(caseId);
    try {
      const res = await fetch('/api/admin/calendar-governance/fixtures', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Failed to ${action}`);

      if (json.diff) {
        const transition = json.diff.transition;
        const isReconfirm = transition === 're_confirmed';
        const isNewlyApproved = transition === 'newly_approved';
        onToast?.({
          id: `${caseId}-${Date.now()}`,
          tone: action === 'approve' ? 'ok' : 'danger',
          title: isReconfirm
            ? `Re-confirmed: ${caseId}`
            : isNewlyApproved
            ? `Newly Approved: ${caseId}`
            : `Rejected: ${caseId}`,
          detail: isReconfirm
            ? `Approval verified & re-stamped by ${json.diff.reviewer}`
            : `Status changed to ${json.diff.newApproved ? 'Approved' : 'Unapproved'} by ${json.diff.reviewer}`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally { setBusyId(null); }
  }

  async function saveEdit(caseId: string, patch: Record<string, unknown>) {
    setBusyId(caseId);
    try {
      const res = await fetch('/api/admin/calendar-governance/fixtures', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, action: 'update', patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save');
      setEditing(null);

      onToast?.({
        id: `${caseId}-${Date.now()}`,
        tone: 'warn',
        title: `Content Updated: ${caseId}`,
        detail: `Citation/Expected date updated by ${json.diff?.reviewer ?? 'admin'} (Approval reset to false pending re-review)`,
        timestamp: new Date().toLocaleTimeString(),
      });

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setBusyId(null); }
  }

  return (
    <div className="flex gap-6 items-start">
      {!loading && <CategoryRail rows={rows} sel={categorySel} onSelect={handleSelectCategory} />}

      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill active={sourceFilter === 'real'}     onClick={() => setSourceFilter('real')}     label={`Sourced (${counts.real})`} />
          <FilterPill active={sourceFilter === 'stub'}     onClick={() => setSourceFilter('stub')}     label={`Unsourced stubs (${counts.stub})`} />
          <FilterPill active={sourceFilter === 'approved'} onClick={() => setSourceFilter('approved')} label={`Approved (${counts.approved})`} />
          <FilterPill active={sourceFilter === 'all'}      onClick={() => setSourceFilter('all')}      label={`All (${counts.all})`} />
        </div>

        {error && <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>}

        {loading ? (
          <LoadingBlock label="Loading fixtures..." />
        ) : filtered.length === 0 ? (
          <EmptyBlock label="Nothing in this filter." />
        ) : (
          <div className="space-y-3">
            {filtered.map(f => (
              <FixtureCard
                key={f.case_id}
                fixture={f}
                busy={busyId === f.case_id}
                editing={editing === f.case_id}
                onEdit={() => setEditing(f.case_id)}
                onCancelEdit={() => setEditing(null)}
                onApprove={() => act(f.case_id, 'approve')}
                onReject={() => act(f.case_id, 'reject')}
                onSave={(patch) => saveEdit(f.case_id, patch)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FixtureCard({
  fixture, busy, editing, onEdit, onCancelEdit, onApprove, onReject, onSave,
}: {
  fixture: GoldenFixtureRow;
  busy: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const real = isRealFixture(fixture);
  const [civilDate, setCivilDate] = useState(fixture.expected?.civilDate ?? '');
  const [citation, setCitation] = useState(fixture.source.citation);
  const [tier, setTier] = useState(String(fixture.source.tier));
  const [ref, setRef] = useState(fixture.source.ref);
  const [reasoning, setReasoning] = useState(fixture.reasoning);

  return (
    <div className={`glass-panel rounded-[1.75rem] border p-5 space-y-3 ${real ? 'border-black/5 bg-white/40' : 'border-amber-500/20 bg-amber-500/[0.03]'}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold theme-ink">{fixture.festival_id}</h3>
            <span className="text-xs text-[var(--brand-muted)]">{fixture.year}</span>
            <span className="text-xs text-[var(--brand-muted)]">· {fixture.location.label}</span>
            <span className="text-xs text-[var(--brand-muted)]">· {fixture.profile.calendar}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/5 text-[10px] font-bold uppercase text-[var(--brand-muted)] capitalize">{fixture.tradition}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/5 text-[10px] font-bold uppercase text-[var(--brand-muted)] capitalize">{fixture.kind}</span>
            {fixture.approved && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase">Approved</span>}
            {!real && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase">Unsourced stub</span>}
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] mt-1">{fixture.case_id}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing && (
            <button onClick={onEdit} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 text-[var(--brand-muted)] text-xs font-bold hover:bg-black/10 transition-all disabled:opacity-50">
              <Pencil size={12} /> Edit
            </button>
          )}
          <button onClick={onApprove} disabled={busy || !real} title={!real ? 'Cannot approve an unsourced stub' : undefined}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50">
            <CheckCircle2 size={14} /> Approve
          </button>
          <button onClick={onReject} disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50">
            <XCircle size={14} /> Reject
          </button>
        </div>
      </div>

      <VerifyPanel fixture={fixture} onUseEngineDate={editing ? () => setCivilDate(fixture.engineHint?.civilDate ?? '') : undefined} />

      {editing ? (
        <div className="space-y-2 border-t border-black/5 pt-3">
          <LabeledInput label="civilDate (YYYY-MM-DD)" value={civilDate} onChange={setCivilDate} />
          <LabeledInput label="Source tier (1-4)" value={tier} onChange={setTier} />
          <LabeledInput label="Source ref" value={ref} onChange={setRef} />
          <LabeledTextarea label="Citation" value={citation} onChange={setCitation} />
          <LabeledTextarea label="Reasoning" value={reasoning} onChange={setReasoning} />
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => onSave({ expected: civilDate ? { ...fixture.expected, civilDate } : null, source: { ...fixture.source, tier: Number(tier), ref, citation }, reasoning })}
              disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--premium-gold)] text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50">
              <Save size={12} /> Save (resets approval)
            </button>
            <button onClick={onCancelEdit} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/5 text-[var(--brand-muted)] text-xs font-bold hover:bg-black/10 transition-all disabled:opacity-50">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-[var(--brand-muted)] leading-relaxed">{fixture.source.citation}</p>
          {fixture.reviewed_by && (
            <p className="text-[10px] text-[var(--brand-muted)]">
              Last reviewed by {fixture.reviewed_by}{fixture.reviewed_at ? ` on ${new Date(fixture.reviewed_at).toLocaleDateString()}` : ''}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// Two independent answers, shown side by side so a reviewer can eyeball
// agreement before approving: what the engine currently computes (a hint,
// never authoritative) vs. what the saved citation currently states (the
// actual sourced answer key, blank on an unsourced stub). Never auto-fills
// or auto-approves anything -- "Use engine date" only pre-fills the edit
// form's input for the reviewer to accept or overwrite themselves, and only
// appears while editing.
function VerifyPanel({ fixture, onUseEngineDate }: { fixture: GoldenFixtureRow; onUseEngineDate?: () => void }) {
  const engineDate = fixture.engineHint?.civilDate ?? null;
  const engineError = fixture.engineHint?.error;
  const citationDate = fixture.expected?.civilDate ?? null;
  const bothPresent = engineDate && citationDate;
  const agree = bothPresent && engineDate === citationDate;
  const disagree = bothPresent && engineDate !== citationDate;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-black/5 bg-black/[0.02] p-3">
      <div>
        <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--brand-muted)]">Engine computes</p>
        <p className={`text-sm font-semibold ${engineDate ? 'theme-ink' : 'text-[var(--brand-muted)]'}`}>
          {engineDate ?? (engineError ? '(engine error)' : '(no candidate)')}
        </p>
        {onUseEngineDate && engineDate && (
          <button onClick={onUseEngineDate} className="mt-1 text-[10px] font-bold text-[var(--premium-gold)] hover:underline">
            Use this date →
          </button>
        )}
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-widest font-bold text-[var(--brand-muted)]">Citation states</p>
        <p className={`text-sm font-semibold ${citationDate ? 'theme-ink' : 'text-[var(--brand-muted)]'}`}>
          {citationDate ?? '(no expected date)'}
        </p>
      </div>
      {agree && (
        <p className="col-span-2 text-[10px] font-bold text-emerald-600">✓ Engine and citation agree</p>
      )}
      {disagree && (
        <p className="col-span-2 text-[10px] font-bold text-rose-600">⚠ Engine and citation disagree — check the citation before approving</p>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] mb-1">{label}</p>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/5 text-sm theme-ink focus:outline-none focus:border-[var(--premium-gold)]" />
    </div>
  );
}

function LabeledTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] mb-1">{label}</p>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/5 text-sm theme-ink focus:outline-none focus:border-[var(--premium-gold)] resize-y" />
    </div>
  );
}

// ── Review Queue ───────────────────────────────────────────────────────────

function ReviewQueueSection({ onToast }: { onToast?: (t: ToastFeedback) => void }) {
  const [rows, setRows] = useState<ReviewQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rulesBySlug = useMemo(() => new Map(CANONICAL_RULES.map(r => [r.slug, r])), []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/calendar-governance/review-queue');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch review queue');
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review queue');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function act(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/calendar-governance/review-queue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Failed to ${action}`);

      onToast?.({
        id: `${id}-${Date.now()}`,
        tone: action === 'approve' ? 'ok' : 'danger',
        title: `${action === 'approve' ? 'Approved' : 'Rejected'} Review Item`,
        detail: `Review queue item '${id}' marked as ${action}d`,
        timestamp: new Date().toLocaleTimeString(),
      });

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally { setBusyId(null); }
  }

  if (error) return <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>;
  if (loading) return <LoadingBlock label="Loading review queue..." />;
  if (rows.length === 0) return <EmptyBlock label="Nothing disputed right now." />;

  const byTradition = new Map<string, ReviewQueueRow[]>();
  for (const r of rows) {
    const def = Array.isArray(r.observance_definitions) ? r.observance_definitions[0] : r.observance_definitions;
    const slug = def?.slug ?? '';
    const trad = rulesBySlug.get(slug)?.tradition ?? 'unknown';
    if (!byTradition.has(trad)) byTradition.set(trad, []);
    byTradition.get(trad)!.push(r);
  }

  return (
    <div className="space-y-6">
      {[...byTradition.entries()].map(([trad, tradRows]) => (
        <div key={trad}>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] mb-3 capitalize">
            {TRADITION_LABELS[trad] ?? trad} — {tradRows.length} item{tradRows.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {tradRows.map(r => {
              const def = Array.isArray(r.observance_definitions) ? r.observance_definitions[0] : r.observance_definitions;
              return (
                <div key={r.id} className="glass-panel rounded-[1.75rem] border border-black/5 bg-white/40 p-5 space-y-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold theme-ink">{def?.display_name ?? def?.slug ?? '(unknown)'}</h3>
                        <span className="text-xs text-[var(--brand-muted)]">{r.year}</span>
                        <span className="px-2 py-0.5 rounded-full bg-black/5 text-[10px] font-bold uppercase text-[var(--brand-muted)]">{r.ambiguity_type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.review_status === 'approved' ? 'bg-emerald-500/10 text-emerald-600'
                          : r.review_status === 'rejected' ? 'bg-rose-500/10 text-rose-600'
                          : 'bg-amber-500/10 text-amber-600'
                        }`}>{r.review_status}</span>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] mt-1">
                        {r.variant_key}{r.spiritual_tradition ? ` · ${r.spiritual_tradition}` : ''} · {r.location_label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => act(r.id, 'approve')} disabled={busyId === r.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50">
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button onClick={() => act(r.id, 'reject')} disabled={busyId === r.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-sm theme-ink">Candidates: {Array.isArray(r.candidate_dates) ? r.candidate_dates.join(', ') : '(none)'}</p>
                  <p className="text-xs text-[var(--brand-muted)] leading-relaxed">{r.reasoning}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Activity Log (Audit History) ───────────────────────────────────────────

function ActivitySection() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<'all' | 'newly_approved' | 're_confirmed' | 'rejected' | 'content_updated'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/calendar-governance/activity');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch activity log');
      setLogs(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.case_id.toLowerCase().includes(q) ||
          log.festival_id.toLowerCase().includes(q) ||
          log.display_name.toLowerCase().includes(q) ||
          log.actor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, actionFilter, searchQuery]);

  if (error) return <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Action Filters & Refresh Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass-panel rounded-2xl p-4 border border-black/5 bg-white/40">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill active={actionFilter === 'all'} onClick={() => setActionFilter('all')} label={`All Activities (${logs.length})`} />
          <FilterPill active={actionFilter === 'newly_approved'} onClick={() => setActionFilter('newly_approved')} label="Newly Approved" />
          <FilterPill active={actionFilter === 're_confirmed'} onClick={() => setActionFilter('re_confirmed')} label="Re-confirmed" />
          <FilterPill active={actionFilter === 'rejected'} onClick={() => setActionFilter('rejected')} label="Rejected" />
          <FilterPill active={actionFilter === 'content_updated'} onClick={() => setActionFilter('content_updated')} label="Content Edited" />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)]" />
            <input
              type="text"
              placeholder="Search case, festival, reviewer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-black/[0.03] border border-black/5 text-xs theme-ink focus:outline-none focus:border-[var(--premium-gold)] w-56"
            />
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--brand-muted)] transition-all disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Activity Timeline Feed */}
      {loading ? (
        <LoadingBlock label="Loading audit activity..." />
      ) : filteredLogs.length === 0 ? (
        <EmptyBlock label="No governance actions recorded yet. Every click on Approve, Reject, or Edit will record an immutable log entry here." />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => (
            <div key={log.id} className="glass-panel rounded-[1.75rem] border border-black/5 bg-white/40 p-5 space-y-3 shadow-sm hover:bg-white/60 transition-all">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{log.emoji}</span>
                    <h3 className="font-bold theme-ink">{log.display_name}</h3>
                    <span className="text-xs text-[var(--brand-muted)]">{log.year}</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/5 text-[10px] font-bold uppercase text-[var(--brand-muted)] capitalize">{log.tradition}</span>
                    
                    {/* Status transition badge */}
                    {log.action === 'newly_approved' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 size={10} /> Newly Approved
                      </span>
                    )}
                    {log.action === 're_confirmed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 text-[10px] font-bold uppercase flex items-center gap-1">
                        <Sparkles size={10} /> Re-confirmed Active
                      </span>
                    )}
                    {log.action === 'rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-bold uppercase flex items-center gap-1">
                        <XCircle size={10} /> Rejected
                      </span>
                    )}
                    {log.action === 'content_updated' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase flex items-center gap-1">
                        <FileEdit size={10} /> Content Edited (Reset)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-mono font-bold text-[var(--brand-muted)] mt-1">{log.case_id}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[var(--brand-muted)] flex items-center gap-1 justify-end">
                    <Clock size={12} /> {new Date(log.created_at).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--premium-gold)] uppercase tracking-wider">
                    Actor: {log.actor}
                  </span>
                </div>
              </div>

              {/* Action Diff & Notes Body */}
              <div className="pt-2 border-t border-black/5 text-xs space-y-1.5">
                {log.review_notes && (
                  <p className="theme-ink italic bg-black/[0.02] p-2.5 rounded-xl border border-black/5">
                    "{log.review_notes}"
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-[var(--brand-muted)] flex-wrap">
                  <span className="flex items-center gap-1 font-mono">
                    State: {log.previous_approved ? 'Approved (true)' : 'Unapproved (false)'} → <span className="font-bold text-emerald-600">{log.new_approved ? 'Approved (true)' : 'Unapproved (false)'}</span>
                  </span>
                  {log.diff && typeof log.diff === 'object' && 'changed_fields' in log.diff && Array.isArray((log.diff as any).changed_fields) && (
                    <span className="font-mono text-amber-600">
                      Modified: {(log.diff as any).changed_fields.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${active ? 'bg-black/10 theme-ink' : 'text-[var(--brand-muted)] hover:bg-black/5'}`}>
      {label}
    </button>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="p-12 text-center text-[var(--brand-muted)] flex items-center justify-center gap-2">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="p-12 text-center text-[var(--brand-muted)] glass-panel rounded-[2rem] border border-black/5 bg-white/40">
      {label}
    </div>
  );
}
