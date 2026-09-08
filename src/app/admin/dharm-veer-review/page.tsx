'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminRecordInspector } from "@/components/admin/AdminRecordInspector";
import type { DharmVeerRecord } from "@/lib/admin-inspector-types";
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parseAdminStringParam } from "@/lib/admin-url-state";

type SourceCitation = {
  sourceName: string;
  sourceUrl: string;
  rightsStatus: string;
  excerpt: string;
};

type PendingDharmVeer = {
  slug: string;
  name: string;
  name_local: string | null;
  name_pa: string | null;
  tradition: string;
  era: string | null;
  tagline: string;
  tagline_local: string | null;
  tagline_pa: string | null;
  journey: string;
  journey_local: string | null;
  journey_pa: string | null;
  trial: string;
  trial_local: string | null;
  trial_pa: string | null;
  teaching: string;
  teaching_local: string | null;
  teaching_pa: string | null;
  moral: string;
  moral_local: string | null;
  moral_pa: string | null;
  legacy: string | null;
  legacy_local: string | null;
  legacy_pa: string | null;
  quote: string | null;
  quote_local: string | null;
  quote_pa: string | null;
  quote_source: string | null;
  source_citations: SourceCitation[] | null;
  generated_by: string | null;
  created_at: string;
};

export default function DharmVeerReviewPage() {
  const searchParams = useSearchParams();
  const targetSlug = parseAdminStringParam(searchParams, "slug");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PendingDharmVeer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const inspectedHero: DharmVeerRecord | null = useMemo(() => {
    if (!targetSlug) return null;
    const match = rows.find((r) => r.slug === targetSlug);
    if (!match) return null;
    return {
      type: "dharm_veer",
      slug: match.slug,
      name: match.name,
      nameLocal: match.name_local,
      namePa: match.name_pa,
      tradition: match.tradition,
      era: match.era,
      tagline: match.tagline,
      taglineLocal: match.tagline_local,
      taglinePa: match.tagline_pa,
      journey: match.journey,
      journeyLocal: match.journey_local,
      journeyPa: match.journey_pa,
      trial: match.trial,
      trialLocal: match.trial_local,
      trialPa: match.trial_pa,
      teaching: match.teaching,
      teachingLocal: match.teaching_local,
      teachingPa: match.teaching_pa,
      moral: match.moral,
      moralLocal: match.moral_local,
      moralPa: match.moral_pa,
      legacy: match.legacy,
      legacyLocal: match.legacy_local,
      legacyPa: match.legacy_pa,
      quote: match.quote,
      quoteLocal: match.quote_local,
      quotePa: match.quote_pa,
      quoteSource: match.quote_source,
      generatedBy: match.generated_by,
      createdAt: match.created_at,
      sourceCitations: match.source_citations,
    };
  }, [targetSlug, rows]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dharm-veer-review');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch review queue');
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (targetSlug && rows.length > 0) {
      if (rows.some((r) => r.slug === targetSlug)) {
        setExpanded(targetSlug);
      }
    }
  }, [targetSlug, rows]);

  async function act(slug: string, action: 'approve' | 'reject') {
    setBusySlug(slug);
    try {
      const res = await fetch('/api/admin/dharm-veer-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Failed to ${action}`);
      setRows((prev) => prev.filter((r) => r.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197, 160, 89,0.15)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Dharm Veer Review Queue</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">
                Auto-Sourced Biographies Awaiting Approval
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
            {rows.length} pending
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4">
        <p className="text-xs text-[var(--brand-muted)] leading-relaxed max-w-2xl">
          These heroes were generated by the auto-sourcing cron from a real, fetched public-domain
          excerpt (archive.org) rather than a hand-verified manifest. Nothing here is visible to
          users until approved — check the citation against the excerpt before approving.
        </p>

        {targetSlug && !loading && !rows.some((r) => r.slug === targetSlug) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>Target hero biography <code className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">{targetSlug}</code> is not in the pending review queue.</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>
        )}

        {loading ? (
          <div className="p-12 text-center text-[var(--brand-muted)] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading review queue...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-[var(--brand-muted)] glass-panel rounded-[2rem] border border-black/5 bg-white/40">
            Nothing pending review right now.
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.slug} className="glass-panel rounded-[2rem] border border-black/5 bg-white/40 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-[var(--brand-muted)]" />
                    <h3 className="font-bold theme-ink">{r.name}</h3>
                    {r.name_local && <span className="text-xs text-[var(--brand-muted)]">{r.name_local}</span>}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] mt-1">
                    {r.tradition} · {r.era || 'era unknown'} · generated_by: {r.generated_by || 'unknown'}
                  </p>
                  <p className="text-sm theme-ink mt-2 italic">&ldquo;{r.tagline}&rdquo;</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => act(r.slug, 'approve')}
                    disabled={busySlug === r.slug}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => act(r.slug, 'reject')}
                    disabled={busySlug === r.slug}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 text-xs font-bold hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>

              {Array.isArray(r.source_citations) && r.source_citations.length > 0 && (
                <div className="space-y-3">
                  {r.source_citations.map((c, i) => (
                    <div key={i} className="rounded-2xl bg-black/[0.03] border border-black/5 p-3 space-y-2">
                      <a
                        href={c.sourceUrl || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 text-[10px] font-bold text-[var(--brand-muted)] hover:bg-black/10 transition-all w-fit"
                      >
                        <LinkIcon size={10} /> {c.sourceName} ({c.rightsStatus})
                      </a>
                      {c.excerpt && (
                        <p className="text-xs leading-relaxed text-[var(--brand-muted)] whitespace-pre-line max-h-40 overflow-y-auto">
                          {c.excerpt}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setExpanded(expanded === r.slug ? null : r.slug)}
                className="text-[10px] font-bold uppercase tracking-widest text-[var(--premium-gold)]"
              >
                {expanded === r.slug ? 'Hide full content ▲' : 'Show full content ▼'}
              </button>

              {expanded === r.slug && (
                <div className="space-y-4 text-sm theme-ink border-t border-black/5 pt-4">
                  <LocalizedField label="Tagline" en={r.tagline} hi={r.tagline_local} pa={r.tagline_pa} />
                  <LocalizedField label="Journey" en={r.journey} hi={r.journey_local} pa={r.journey_pa} />
                  <LocalizedField label="Trial" en={r.trial} hi={r.trial_local} pa={r.trial_pa} />
                  <LocalizedField label="Teaching" en={r.teaching} hi={r.teaching_local} pa={r.teaching_pa} />
                  <LocalizedField label="Moral" en={r.moral} hi={r.moral_local} pa={r.moral_pa} />
                  {r.legacy && <LocalizedField label="Legacy" en={r.legacy} hi={r.legacy_local} pa={r.legacy_pa} />}
                  {r.quote && (
                    <LocalizedField
                      label="Quote"
                      en={`"${r.quote}" — ${r.quote_source || 'unattributed'}`}
                      hi={r.quote_local}
                      pa={r.quote_pa}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AdminRecordInspector
        record={inspectedHero}
        isOpen={Boolean(targetSlug && inspectedHero)}
        onClose={() => {
          const sp = new URLSearchParams(window.location.search);
          sp.delete("slug");
          const qs = sp.toString();
          const newUrl = qs ? `/admin/dharm-veer-review?${qs}` : "/admin/dharm-veer-review";
          window.history.replaceState(null, "", newUrl);
        }}
        onActionComplete={(rec) => {
          setRows((prev) => prev.filter((r) => r.slug !== (rec as DharmVeerRecord).slug));
        }}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)] mb-1">{label}</p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

// Shows English alongside its Hindi/Punjabi siblings with a visible
// length ratio, so a reviewer can actually catch a thin/stub translation
// before approving -- previously this admin page didn't surface the
// *_local/*_pa fields at all, so a reviewer had no way to see this class of
// defect (see the 41%-average-length audit that prompted this fix).
function LocalizedField({
  label,
  en,
  hi,
  pa,
}: {
  label: string;
  en: string;
  hi: string | null;
  pa: string | null;
}) {
  const enLen = en.length;
  const ratioBadge = (text: string | null) => {
    if (!enLen) return null;
    if (!text) return <span className="text-rose-600 font-bold">missing</span>;
    const ratio = text.length / enLen;
    const color = ratio < 0.6 ? 'text-rose-600' : 'text-emerald-600';
    return <span className={`${color} font-bold`}>{Math.round(ratio * 100)}% of EN length</span>;
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)]">{label}</p>
      <div className="grid grid-cols-1 gap-2">
        <p className="text-sm leading-relaxed">
          <span className="text-[10px] font-bold text-[var(--brand-muted)] mr-1.5">EN</span>
          {en}
        </p>
        <p className="text-sm leading-relaxed">
          <span className="text-[10px] font-bold text-[var(--brand-muted)] mr-1.5">HI</span>
          {hi || <span className="text-rose-600 italic">missing</span>}{' '}
          <span className="text-[10px]">{ratioBadge(hi)}</span>
        </p>
        <p className="text-sm leading-relaxed">
          <span className="text-[10px] font-bold text-[var(--brand-muted)] mr-1.5">PA</span>
          {pa || <span className="text-rose-600 italic">missing</span>}{' '}
          <span className="text-[10px]">{ratioBadge(pa)}</span>
        </p>
      </div>
    </div>
  );
}
