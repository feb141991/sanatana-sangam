'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import type { ClaimComparison } from '@/lib/calendar/official-calendar-claims';
import { FixtureCorrectionForm } from './FixtureCorrectionForm';

type EvidenceResponse = { comparisons: ClaimComparison[]; notice: string };
type EvidenceFilter = 'needs_review' | 'all' | 'matching_approved';

const STATUS_LABEL: Record<ClaimComparison['status'], string> = {
  no_fixture: 'No fixture for cited year',
  fixture_needs_source: 'Fixture has no cited date',
  matching_unapproved: 'Date matches · review pending',
  matching_approved: 'Date matches · fixture approved',
  different_date: 'Date differs · investigate',
  mixed_dates: 'Some fixtures differ · investigate',
};

export default function CalendarEvidencePage() {
  const [data, setData] = useState<EvidenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EvidenceFilter>('needs_review');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/calendar-evidence', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not load calendar evidence');
      setData(body as EvidenceResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load calendar evidence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => (data?.comparisons ?? []).filter((row) => {
    if (filter === 'all') return true;
    if (filter === 'matching_approved') return row.status === 'matching_approved';
    return row.status !== 'matching_approved';
  }), [data, filter]);

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/admin/calendar-governance" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-[var(--brand-muted)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">
              <ArrowLeft size={17} /> Calendar governance
            </Link>
            <h1 className="font-serif text-2xl font-bold theme-ink">Official calendar evidence</h1>
            <Link href="/admin/calendar-dates" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">View verified and held date register</Link>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--brand-muted)]">
              Compare edition-cited spot checks against the existing golden fixtures. This page only flags work for review; it never approves or publishes dates.
            </p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--card-border)] px-4 text-sm font-semibold theme-ink hover:bg-[var(--surface-soft)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50">
            <RefreshCw size={16} /> Refresh comparison
          </button>
        </div>

        <section aria-label="Evidence scope" className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm leading-relaxed text-[var(--brand-muted)]">
          <p>Sources in this pass: Rashtriya Panchang Saka 1948 and SGPC Nanakshahi 558. Jain and Buddhist calendars are not in this comparison until an edition-specific, tradition-qualified claim is verified. Drik Panchang is excluded pending permitted access.</p>
          {data?.notice && <p className="mt-2">{data.notice}</p>}
        </section>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter evidence">
          {(['needs_review', 'all', 'matching_approved'] as const).map((option) => (
            <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${filter === option ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] theme-ink' : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--brand-muted)]'}`}>
              {option === 'needs_review' ? 'Needs review' : option === 'all' ? 'All evidence' : 'Approved fixtures'}
            </button>
          ))}
        </div>

        {loading && <p role="status" className="text-sm text-[var(--brand-muted)]">Loading existing fixtures and comparing cited dates…</p>}
        {error && <div role="alert" className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm">{error}</div>}
        {!loading && !error && visible.length === 0 && <p className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--brand-muted)]">No evidence in this filter.</p>}

        {!loading && !error && <div className="space-y-3">
          {visible.map(({ claim, fixtures, status }) => (
            <article key={`${claim.slug}:${claim.date}:${claim.variant ?? ''}`} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold theme-ink">{claim.slug.replaceAll('-', ' ')}</h2>
                  <p className="mt-1 text-sm text-[var(--brand-muted)]">{claim.date}{claim.variant ? ` · ${claim.variant}` : ''}</p>
                </div>
                <span className="rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold theme-ink">{STATUS_LABEL[status]}</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-semibold theme-ink">Official evidence</p>
                  <p className="mt-1 text-[var(--brand-muted)]">{claim.edition} · {claim.locator}</p>
                  <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Official publisher <ExternalLink size={14} /></a>
                </div>
                <div>
                  <p className="font-semibold theme-ink">Already in admin</p>
                  {fixtures.length === 0 ? <p className="mt-1 text-[var(--brand-muted)]">No fixture for this rule and calendar year.</p> : <ul className="mt-1 space-y-3 text-[var(--brand-muted)]">{fixtures.map((fixture) => {
                    const key = `${claim.slug}:${claim.date}:${claim.variant ?? ''}:${fixture.case_id}`;
                    return <li key={key} className="rounded-lg border border-[var(--card-border)] p-3">
                      <p>{fixture.case_id}: {fixture.expected?.civilDate ?? 'no expected date'} · {fixture.approved ? 'approved' : 'unapproved'} · {fixture.profile?.calendar ?? 'unknown profile'} · {fixture.location?.label ?? 'unknown location'}</p>
                      <button type="button" onClick={() => setEditingKey(key)} className="mt-2 min-h-11 text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Propose date correction</button>
                      {editingKey === key && <FixtureCorrectionForm claim={claim} fixture={fixture} onSaved={async () => { setEditingKey(null); await load(); }} onCancel={() => setEditingKey(null)} />}
                    </li>;
                  })}</ul>}
                  <Link href="/admin/calendar-governance?tab=fixtures" className="mt-2 inline-flex min-h-11 items-center text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Open fixture review</Link>
                </div>
              </div>
            </article>
          ))}
        </div>}
      </div>
    </div>
  );
}
