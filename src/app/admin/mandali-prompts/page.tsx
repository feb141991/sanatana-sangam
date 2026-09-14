'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageCircle, Loader2, Trash2, Save, Plus } from 'lucide-react';
import Link from 'next/link';

type MandaliPrompt = {
  id: string;
  text_en: string;
  text_hi: string | null;
  text_pa: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const EMPTY_DRAFT = { text_en: '', text_hi: '', text_pa: '' };

export default function MandaliPromptsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MandaliPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [edits, setEdits] = useState<Record<string, Partial<MandaliPrompt>>>({});

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/mandali-prompts');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch prompts');
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function fieldFor(row: MandaliPrompt, key: keyof MandaliPrompt) {
    return edits[row.id]?.[key] ?? row[key];
  }

  function setField(id: string, key: keyof MandaliPrompt, value: string | boolean | null) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  async function createPrompt() {
    if (!draft.text_en.trim()) {
      setError('English text is required.');
      return;
    }
    setCreating(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/mandali-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_en: draft.text_en,
          text_hi: draft.text_hi || null,
          text_pa: draft.text_pa || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create prompt');
      setRows((prev) => [json, ...prev]);
      setDraft(EMPTY_DRAFT);
      setStatus('Prompt added to the rotation.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(row: MandaliPrompt) {
    const patch = edits[row.id];
    if (!patch) return;
    setBusyId(row.id);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/mandali-prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save prompt');
      setRows((prev) => prev.map((r) => (r.id === row.id ? json : r)));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      setStatus('Prompt saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(row: MandaliPrompt) {
    setBusyId(row.id);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/mandali-prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, active: !row.active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update prompt');
      setRows((prev) => prev.map((r) => (r.id === row.id ? json : r)));
      setStatus(row.active ? 'Prompt deactivated.' : 'Prompt activated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRow(row: MandaliPrompt) {
    if (!window.confirm(`Delete this prompt? "${row.text_en.slice(0, 60)}..."`)) return;
    setBusyId(row.id);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/mandali-prompts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete prompt');
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setStatus('Unused prompt deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[var(--card-border)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" aria-label="Back to admin" className="p-2 rounded-xl hover:bg-[var(--surface-soft)] text-[var(--brand-muted)] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Mandali Conversation-Starter Prompts</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">
                Curated evergreen prompts for community conversation
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
            {rows.filter((r) => r.active).length} active
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <p className="text-xs text-[var(--brand-muted)] leading-relaxed max-w-2xl">
          Every Mandali sees one active prompt per UTC day. Hindi and Punjabi are shown according
          to each viewer&apos;s app language, with English as the fallback. Use evergreen questions here;
          festival and calendar-specific prompts require verified calendar eligibility and are not
          part of this release. Deactivating a prompt removes it from future rotation without deleting
          discussions already created from it.
        </p>

        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>
        )}
        {status && (
          <div role="status" aria-live="polite" className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-700 text-sm font-medium">
            {status}
          </div>
        )}

        <div className="glass-panel rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-3">
          <h3 className="font-bold theme-ink flex items-center gap-2">
            <Plus size={16} /> Add a prompt
          </h3>
          <label htmlFor="new-prompt-en" className="block text-xs font-bold text-[var(--brand-muted)]">English <span aria-hidden="true">*</span></label>
          <textarea
            id="new-prompt-en"
            value={draft.text_en}
            onChange={(e) => setDraft((d) => ({ ...d, text_en: e.target.value }))}
            placeholder="What helped you make time for your practice today?"
            maxLength={500}
            required
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            rows={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="new-prompt-hi" className="block text-xs font-bold text-[var(--brand-muted)]">Hindi <span className="font-normal">(optional)</span></label>
              <textarea
                id="new-prompt-hi"
                value={draft.text_hi}
                onChange={(e) => setDraft((d) => ({ ...d, text_hi: e.target.value }))}
                maxLength={500}
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-prompt-pa" className="block text-xs font-bold text-[var(--brand-muted)]">Punjabi <span className="font-normal">(optional)</span></label>
              <textarea
                id="new-prompt-pa"
                value={draft.text_pa}
                onChange={(e) => setDraft((d) => ({ ...d, text_pa: e.target.value }))}
                maxLength={500}
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                rows={2}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={createPrompt}
              disabled={creating}
              className="min-h-11 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[var(--brand-muted)] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading prompts...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-[var(--brand-muted)] glass-panel rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]">
            No prompts yet -- add one above.
          </div>
        ) : (
          rows.map((row) => {
            const dirty = Boolean(edits[row.id]);
            const busy = busyId === row.id;
            return (
              <div key={row.id} className="glass-panel rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-[var(--brand-muted)]" />
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${row.active ? 'text-emerald-600' : 'text-[var(--brand-muted)]'}`}>
                      {row.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      disabled={busy}
                      className="min-h-11 px-3 py-1.5 rounded-xl bg-[var(--surface-soft)] text-sm font-bold text-[var(--brand-muted)] hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveRow(row)}
                      disabled={!dirty || busy}
                      className="min-h-11 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      <Save size={12} /> Save
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete prompt: ${row.text_en}`}
                      title="Delete unused prompt"
                      onClick={() => deleteRow(row)}
                      disabled={busy}
                      className="min-h-11 min-w-11 inline-flex items-center justify-center p-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`prompt-${row.id}-en`} className="block text-[10px] font-bold text-[var(--brand-muted)]">English</label>
                  <textarea
                    id={`prompt-${row.id}-en`}
                    value={String(fieldFor(row, 'text_en') ?? '')}
                    onChange={(e) => setField(row.id, 'text_en', e.target.value)}
                    maxLength={500}
                    className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor={`prompt-${row.id}-hi`} className="block text-[10px] font-bold text-[var(--brand-muted)]">Hindi</label>
                    <textarea
                      id={`prompt-${row.id}-hi`}
                      value={String(fieldFor(row, 'text_hi') ?? '')}
                      onChange={(e) => setField(row.id, 'text_hi', e.target.value)}
                      maxLength={500}
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`prompt-${row.id}-pa`} className="block text-[10px] font-bold text-[var(--brand-muted)]">Punjabi</label>
                    <textarea
                      id={`prompt-${row.id}-pa`}
                      value={String(fieldFor(row, 'text_pa') ?? '')}
                      onChange={(e) => setField(row.id, 'text_pa', e.target.value)}
                      maxLength={500}
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
