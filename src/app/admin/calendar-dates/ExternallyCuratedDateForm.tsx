'use client';

import { useState } from 'react';

type Readiness = { slug: string; displayName: string; launchStatus: string; pendingSourceFields: string[] };

export function ExternallyCuratedDateForm({ readiness, defaultYear, onSaved }: {
  readiness: Readiness[];
  defaultYear: number;
  onSaved: (message: string) => void;
}) {
  const [observance, setObservance] = useState(readiness[0]?.slug ?? '');
  const [year, setYear] = useState(String(defaultYear));
  const [date, setDate] = useState('');
  const [authorityName, setAuthorityName] = useState('');
  const [sourceUrlOrCitation, setSourceUrlOrCitation] = useState('');
  const [tier, setTier] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/calendar-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_externally_curated', observance, year: Number(year), date, authorityName, sourceUrlOrCitation, tier: Number(tier) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not enter authority date');
      onSaved(body.alreadyExists ? 'That authority date already exists.' : 'Authority date entered and withheld pending approval.');
      setDate('');
      setAuthorityName('');
      setSourceUrlOrCitation('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not enter authority date');
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
    <div>
      <h2 className="font-semibold theme-ink">Yearly authority date</h2>
      <p className="mt-1 text-sm text-[var(--brand-muted)]">Entry creates one locked, withheld row. It does not publish until approved below.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm font-medium theme-ink">Observance
        <select value={observance} onChange={(event) => setObservance(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3">
          {readiness.map((item) => <option key={item.slug} value={item.slug}>{item.displayName}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium theme-ink">Year
        <input type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(event.target.value)} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3" />
      </label>
      <label className="text-sm font-medium theme-ink">Civil date
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3" />
      </label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium theme-ink">Authority name
        <input value={authorityName} onChange={(event) => setAuthorityName(event.target.value)} maxLength={300} required className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3" />
      </label>
      <label className="text-sm font-medium theme-ink">Source tier
        <select value={tier} onChange={(event) => setTier(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3">
          {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
    <label className="block text-sm font-medium theme-ink">Source URL or citation
      <textarea value={sourceUrlOrCitation} onChange={(event) => setSourceUrlOrCitation(event.target.value)} maxLength={2048} required rows={2} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2" />
    </label>
    {error && <p role="alert" className="text-sm theme-ink">{error}</p>}
    <button type="submit" disabled={saving || readiness.length === 0} className="min-h-11 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Entering…' : 'Enter withheld authority date'}</button>
  </form>;
}
