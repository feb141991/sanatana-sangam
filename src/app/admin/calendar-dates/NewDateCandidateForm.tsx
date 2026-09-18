'use client';

import { useState } from 'react';
import type { AdminDateAssessment } from '@/lib/calendar/admin-date-register';

export function NewDateCandidateForm({ row, onCreated, onCancel }: {
  row: AdminDateAssessment;
  onCreated: (caseId: string) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(row.date);
  const [tier, setTier] = useState(1);
  const [sourceUrl, setSourceUrl] = useState('');
  const [citation, setCitation] = useState('');
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!acknowledged) { setError('Confirm that this is an unapproved candidate.'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/calendar-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_candidate', occurrenceId: row.id, date, tier, sourceUrl: sourceUrl.trim(), citation: citation.trim(), reason: reason.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not create date candidate');
      onCreated(body.caseId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create date candidate');
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-4 rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
    <p className="text-sm font-semibold theme-ink">Create a sourced date candidate for this exact profile and location</p>
    <p className="text-sm text-[var(--brand-muted)]">This does not change or hold the currently stored date. The candidate starts unapproved and must pass fixture, rule and profile review before any materialization.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium theme-ink">Proposed civil date
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
      </label>
      <label className="text-sm font-medium theme-ink">Source tier
        <select value={tier} onChange={(event) => setTier(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">
          <option value={1}>1 · Official calendar authority</option>
          <option value={2}>2 · Traditional source</option>
          <option value={3}>3 · Scholarly source</option>
          <option value={4}>4 · Community authority</option>
        </select>
        <span className="mt-1 block text-xs text-[var(--brand-muted)]">The current approved-fixture materializer requires Tier 1; other tiers remain review evidence.</span>
      </label>
    </div>
    <label className="block text-sm font-medium theme-ink">HTTPS source URL
      <input type="url" maxLength={2048} value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
    </label>
    <label className="block text-sm font-medium theme-ink">Exact citation or page locator
      <input maxLength={500} value={citation} onChange={(event) => setCitation(event.target.value)} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
    </label>
    <label className="block text-sm font-medium theme-ink">Why the stored date should change
      <textarea maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} required rows={3} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
    </label>
    <label className="flex items-start gap-3 text-sm text-[var(--brand-muted)]"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-5 w-5" /> I understand this is evidence for review, not an immediate app date.</label>
    {error && <p role="alert" className="text-sm theme-ink">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50">{saving ? 'Creating candidate…' : 'Create review candidate'}</button>
      <button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-lg border border-[var(--card-border)] px-4 text-sm font-semibold theme-ink focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">Cancel</button>
    </div>
  </form>;
}
