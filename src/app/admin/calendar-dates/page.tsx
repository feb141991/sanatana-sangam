'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { AdminDateAssessment } from '@/lib/calendar/admin-date-register';
import { NewDateCandidateForm } from './NewDateCandidateForm';

type RegisterResponse = {
  rows: AdminDateAssessment[];
  total: number;
  page: number;
  pageSize: number;
  notice: string;
};
type View = 'verified' | 'held' | 'all';

const STATUS_LABEL: Record<AdminDateAssessment['register_status'], string> = {
  held: 'Held from publication',
  verified_published: 'Verified · stored published',
  published_needs_review: 'Stored published · review incomplete',
};

export default function CalendarDatesPage() {
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [yearInput, setYearInput] = useState(String(new Date().getUTCFullYear()));
  const [view, setView] = useState<View>('verified');
  const [slug, setSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<RegisterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [holdAcknowledged, setHoldAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialYear = Number(params.get('year'));
    if (Number.isInteger(initialYear) && initialYear >= 2000 && initialYear <= 2100) { setYear(initialYear); setYearInput(String(initialYear)); }
    const initialSlug = params.get('slug') ?? '';
    if (/^[a-z0-9-]{1,100}$/.test(initialSlug)) { setSlug(initialSlug); setSlugInput(initialSlug); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ year: String(year), view, page: String(page) });
      if (slug.trim()) params.set('slug', slug.trim());
      const response = await fetch(`/api/admin/calendar-dates?${params}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not load date register');
      setData(body as RegisterResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load date register');
    } finally {
      setLoading(false);
    }
  }, [year, view, slug, page]);

  useEffect(() => { void load(); }, [load]);

  async function hold(id: string) {
    if (!holdAcknowledged || holdReason.trim().length < 12) {
      setError('Give a reason of at least 12 characters and acknowledge the withdrawal.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/calendar-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hold', id, reason: holdReason.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not hold occurrence');
      setMessage('Occurrence held for future backend reads. Cached or offline Native views may remain stale until refreshed; already-sent notifications cannot be recalled.');
      setHoldId(null);
      setHoldReason('');
      setHoldAcknowledged(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not hold occurrence');
    } finally {
      setSaving(false);
    }
  }

  const pageCount = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/admin/calendar-evidence" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--brand-muted)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"><ArrowLeft size={17} /> Calendar evidence</Link>
            <h1 className="font-serif text-2xl font-bold theme-ink">Canonical date register</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--brand-muted)]">Stored final occurrence dates, their verification state and publication hold. Dates are profile- and location-qualified, not universal.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--card-border)] px-4 text-sm font-semibold theme-ink focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50"><RefreshCw size={16} /> Refresh</button>
        </div>

        <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm leading-relaxed text-[var(--brand-muted)]" aria-label="Register interpretation">
          {data?.notice ?? 'A stored published date is not necessarily visible to every app user. The core gate check below is advisory; the app still selects by profile, tradition and location.'}
        </section>

        <form onSubmit={(event) => { event.preventDefault(); const nextYear = Number(yearInput); const nextSlug = slugInput.trim(); if (!Number.isInteger(nextYear) || nextYear < 2000 || nextYear > 2100 || (nextSlug && !/^[a-z0-9-]{1,100}$/.test(nextSlug))) { setError('Use a year from 2000–2100 and an exact lowercase observance slug.'); return; } setError(null); setYear(nextYear); setSlug(nextSlug); setPage(0); }} className="grid gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:grid-cols-3">
          <label className="text-sm font-medium theme-ink">Calendar row year
            <input type="number" min={2000} max={2100} value={yearInput} onChange={(event) => setYearInput(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
          </label>
          <label className="text-sm font-medium theme-ink">Register view
            <select value={view} onChange={(event) => { setView(event.target.value as View); setPage(0); }} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">
              <option value="verified">Verified · stored published</option>
              <option value="held">Held</option>
              <option value="all">All stored rows</option>
            </select>
          </label>
          <label className="text-sm font-medium theme-ink">Observance slug
            <input type="search" value={slugInput} onChange={(event) => setSlugInput(event.target.value)} placeholder="Optional exact slug" className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
          </label>
          <button type="submit" className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] sm:col-span-3 sm:justify-self-start">Apply filters</button>
        </form>

        {message && <p role="status" className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm theme-ink">{message}</p>}
        {createdCaseId && <Link href={`/admin/calendar-governance?tab=fixtures&caseId=${encodeURIComponent(createdCaseId)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Open new unapproved fixture {createdCaseId}</Link>}
        {error && <p role="alert" className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm theme-ink">{error}</p>}
        {loading && <p role="status" className="text-sm text-[var(--brand-muted)]">Loading date records and publication gates…</p>}
        {!loading && !error && data?.rows.length === 0 && <p className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--brand-muted)]">No rows in this view. Try another year or filter.</p>}

        {!loading && !error && <div className="space-y-3">
          {data?.rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold theme-ink">{row.observance_definitions?.display_name ?? row.observance_definitions?.slug ?? 'Unknown observance'}</h2>
                  <p className="mt-1 font-mono text-sm theme-ink">{row.date} <span className="font-sans text-[var(--brand-muted)]">· {row.observance_definitions?.slug ?? row.definition_id}</span></p>
                </div>
                <span className="h-fit rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold theme-ink">{STATUS_LABEL[row.register_status]}</span>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold theme-ink">Profile / variant</dt><dd className="text-[var(--brand-muted)]">{row.calendar_profile ?? 'unspecified'} · {row.variant_key ?? row.spiritual_tradition ?? 'default'}</dd></div>
                <div><dt className="font-semibold theme-ink">Calculation location</dt><dd className="text-[var(--brand-muted)]">{row.computed_latitude ?? 'unknown'}, {row.computed_longitude ?? 'unknown'} · {row.computed_timezone ?? 'unknown timezone'}</dd></div>
                <div><dt className="font-semibold theme-ink">Core app gates</dt><dd className="text-[var(--brand-muted)]">{row.passes_core_app_gates ? 'Pass · user-specific selection still applies' : 'Not confirmed for app display'}</dd></div>
                <div><dt className="font-semibold theme-ink">Source / reviewer</dt><dd className="text-[var(--brand-muted)]">{row.final_date_source ?? 'unknown'} · {row.reviewed_at ? new Date(row.reviewed_at).toLocaleDateString() : 'not reviewed'}</dd></div>
              </dl>
              {row.review_notes && <details className="mt-3 text-sm text-[var(--brand-muted)]"><summary className="cursor-pointer font-semibold">Review notes</summary><p className="mt-2 whitespace-pre-wrap">{row.review_notes}</p></details>}
              <details className="mt-3 text-sm text-[var(--brand-muted)]">
                <summary className="cursor-pointer font-semibold">Source and version details</summary>
                <p className="mt-2">Rule {row.rule_version ?? 'unknown'} · astronomy {row.astronomy_version ?? 'unknown'} · day boundary {row.day_boundary_version ?? 'unknown'}</p>
                <p>Manual override: {row.manual_date_override ?? 'none'} · locked for regeneration: {row.locked_for_regeneration ? 'yes' : 'no'}</p>
                {row.source_refs != null && <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[var(--surface-soft)] p-3 text-xs whitespace-pre-wrap">{JSON.stringify(row.source_refs, null, 2)}</pre>}
              </details>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {row.fixture_case_id ? <Link href={`/admin/calendar-governance?tab=fixtures&caseId=${encodeURIComponent(row.fixture_case_id)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Review / edit linked fixture</Link> : <button type="button" onClick={() => { setCandidateId(row.id); setHoldId(null); }} className="min-h-11 text-sm font-semibold text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Propose date correction</button>}
                {row.observance_definitions?.slug && <Link href={`/admin/calendar-governance?tab=integrity&slug=${encodeURIComponent(row.observance_definitions.slug)}&year=${row.year}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-primary)] underline focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Inspect integrity</Link>}
                {row.publication_status === 'published' && <button type="button" onClick={() => { setHoldId(row.id); setCandidateId(null); setHoldReason(''); setHoldAcknowledged(false); setError(null); }} className="min-h-11 rounded-lg border border-[var(--card-border)] px-4 text-sm font-semibold theme-ink focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Hold date</button>}
              </div>
              {candidateId === row.id && <NewDateCandidateForm row={row} onCreated={(caseId) => { setCreatedCaseId(caseId); setCandidateId(null); setMessage('Unapproved date candidate created. Review the new fixture before any publication.'); }} onCancel={() => setCandidateId(null)} />}
              {holdId === row.id && <form onSubmit={(event) => { event.preventDefault(); void hold(row.id); }} className="mt-4 space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
                <p className="text-sm font-semibold theme-ink">Withdraw this exact occurrence from future backend reads</p>
                <label className="block text-sm font-medium theme-ink">Reason for hold
                  <textarea value={holdReason} onChange={(event) => setHoldReason(event.target.value)} rows={3} required className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
                </label>
                <label className="flex items-start gap-3 text-sm text-[var(--brand-muted)]"><input type="checkbox" checked={holdAcknowledged} onChange={(event) => setHoldAcknowledged(event.target.checked)} className="mt-1 h-5 w-5" /> I understand this blocks future publication and requires separate review before restoration.</label>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50">{saving ? 'Holding…' : 'Confirm hold'}</button>
                  <button type="button" disabled={saving} onClick={() => setHoldId(null)} className="min-h-11 rounded-lg border border-[var(--card-border)] px-4 text-sm font-semibold theme-ink focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Cancel</button>
                </div>
              </form>}
            </article>
          ))}
        </div>}

        {!loading && !error && pageCount > 1 && <nav aria-label="Date register pages" className="flex items-center justify-between gap-3 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="min-h-11 rounded-lg border border-[var(--card-border)] px-4 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50">Previous</button>
          <span className="text-[var(--brand-muted)]">Page {page + 1} of {pageCount}</span>
          <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded-lg border border-[var(--card-border)] px-4 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50">Next</button>
        </nav>}
      </div>
    </div>
  );
}
