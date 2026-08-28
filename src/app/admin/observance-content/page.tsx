'use client';

import { useEffect, useMemo, useState } from 'react';

type Row = {
  id: string; slug: string; display_name: string; tradition: string; kind: string;
  current: { id: string; version: number; status: string; updated_at: string } | null;
  sourceCount: number; approvedArtworkCount: number; approvedShareCount: number;
  previousOccurrence: string | null; nextOccurrence: string | null;
};

export default function ObservanceContentStudioPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const load = () => fetch('/api/admin/observance-content').then(async (response) => {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not load content studio');
    setRows(payload.rows ?? []);
  }).catch((reason) => setError(String(reason.message ?? reason)));
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => rows.filter((row) => `${row.display_name} ${row.slug}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const counts = useMemo(() => ({ published: rows.filter((row) => row.current?.status === 'published').length, review: rows.filter((row) => row.current?.status === 'needs_review').length, missing: rows.filter((row) => !row.current).length }), [rows]);

  async function generate(row: Row) {
    setError(null);
    const response = await fetch('/api/admin/observance-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate_draft', definitionId: row.id }) });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error || 'Draft generation failed');
    load();
  }

  return <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] md:px-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Editorial operations</p><h1 className="text-3xl font-semibold">Observance Content Studio</h1><p className="mt-2 text-sm opacity-70">Approved sources → AI draft → human review → published PWA and Native projection.</p></div><input className="h-11 min-w-72 rounded-md border bg-transparent px-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search observances" /></header>
    <section className="mb-6 grid grid-cols-3 gap-3 border-y py-4"><div><b>{counts.published}</b><p className="text-xs opacity-65">Published</p></div><div><b>{counts.review}</b><p className="text-xs opacity-65">Needs review</p></div><div><b>{counts.missing}</b><p className="text-xs opacity-65">Missing</p></div></section>
    {error && <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-3">Observance</th><th className="p-3">Tradition</th><th className="p-3">Previous / next</th><th className="p-3">Status</th><th className="p-3">Sources</th><th className="p-3">Artwork</th><th className="p-3">Share</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id} className="border-b"><td className="p-3"><b>{row.display_name}</b><p className="text-xs opacity-60">{row.slug}</p></td><td className="p-3">{row.tradition}</td><td className="p-3 text-xs"><span className="opacity-60">{row.previousOccurrence ?? '—'}</span><br />{row.nextOccurrence ?? '—'}</td><td className="p-3">{row.current?.status ?? 'missing'}</td><td className="p-3">{row.sourceCount}</td><td className="p-3">{row.approvedArtworkCount}</td><td className="p-3">{row.approvedShareCount}</td><td className="p-3 text-right"><button disabled={row.sourceCount === 0} title={row.sourceCount === 0 ? 'Approve a source first' : 'Generate a source-grounded draft'} className="min-h-11 rounded-md border px-3 disabled:opacity-40" onClick={() => void generate(row)}>Generate draft</button></td></tr>)}</tbody></table></div>
  </main>;
}
