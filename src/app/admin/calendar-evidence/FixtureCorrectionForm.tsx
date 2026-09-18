'use client';

import { useState } from 'react';
import type { FixtureEvidence, OfficialCalendarClaim } from '@/lib/calendar/official-calendar-claims';

function validCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function FixtureCorrectionForm({ claim, fixture, onSaved, onCancel }: {
  claim: OfficialCalendarClaim;
  fixture: FixtureEvidence;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(fixture.expected?.civilDate ?? claim.date);
  const [sourceUrl, setSourceUrl] = useState(fixture.source?.ref?.startsWith('https://') ? fixture.source.ref : '');
  const [citation, setCitation] = useState(fixture.source?.citation ?? '');
  const [tier, setTier] = useState(fixture.source?.tier ?? 1);
  const [reasoning, setReasoning] = useState(fixture.reasoning ?? '');
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!validCivilDate(date)) { setError('Enter a real civil date in YYYY-MM-DD format.'); return; }
    if (!/^https:\/\/[^\s]+$/i.test(sourceUrl)) { setError('Provide the HTTPS source page for the proposed date.'); return; }
    if (citation.trim().length < 12 || reasoning.trim().length < 12) { setError('Add a precise citation and a short rationale for the change.'); return; }
    if (!acknowledged) { setError('Confirm that this is a review candidate, not an immediate app date.'); return; }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/calendar-governance/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          evidenceCorrection: true,
          caseId: fixture.case_id,
          expectedUpdatedAt: fixture.updated_at,
          patch: {
            expected: { ...fixture.expected, civilDate: date },
            source: { ...fixture.source, tier, ref: sourceUrl.trim(), citation: citation.trim(), verifiedBy: 'pending review', verifiedOn: '' },
            reasoning: reasoning.trim(),
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not save fixture correction');
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save fixture correction');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="mt-4 space-y-4 rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4" aria-label={`Propose date correction for ${fixture.case_id}`}>
      <p className="text-sm font-semibold theme-ink">Edit sourced fixture · {fixture.case_id}</p>
      <p className="text-sm leading-relaxed text-[var(--brand-muted)]">Saving resets fixture approval. A previously materialized fixture-backed occurrence can disappear from future backend responses until a reviewer re-approves it and materialization passes. Cached Native views may remain stale until refreshed. Hold its published occurrence in the date register if it must be withdrawn from new backend reads.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium theme-ink">Proposed civil date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
        </label>
        <label className="block text-sm font-medium theme-ink">Source tier
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
        <input type="text" maxLength={500} value={citation} onChange={(event) => setCitation(event.target.value)} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
      </label>
      <label className="block text-sm font-medium theme-ink">Why this date should change
        <textarea maxLength={1000} value={reasoning} onChange={(event) => setReasoning(event.target.value)} required rows={3} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]" />
      </label>
      <label className="flex items-start gap-3 text-sm text-[var(--brand-muted)]"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-5 w-5" /> I understand this is a candidate requiring independent review and will not publish a date.</label>
      {error && <p role="alert" className="text-sm text-[var(--brand-primary)]">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50">{saving ? 'Saving candidate…' : 'Save for review'}</button>
        <button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-lg border border-[var(--card-border)] px-4 text-sm font-semibold theme-ink focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-50">Cancel</button>
      </div>
    </form>
  );
}
