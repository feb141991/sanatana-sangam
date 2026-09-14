'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageCircle, Loader2, Trash2, Save, Plus } from 'lucide-react';
import Link from 'next/link';

type MandaliPrompt = {
  id: string;
  text_en: string;
  text_hi: string | null;
  text_pa: string | null;
  tradition: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const EMPTY_DRAFT = { text_en: '', text_hi: '', text_pa: '', tradition: '' };

export default function MandaliPromptsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MandaliPrompt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [edits, setEdits] = useState<Record<string, Partial<MandaliPrompt>>>({});

  const fetchData = useCallback(async () => {
    try {
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
    try {
      const res = await fetch('/api/admin/mandali-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_en: draft.text_en,
          text_hi: draft.text_hi || null,
          text_pa: draft.text_pa || null,
          tradition: draft.tradition || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create prompt');
      setRows((prev) => [json, ...prev]);
      setDraft(EMPTY_DRAFT);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(row: MandaliPrompt) {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/mandali-prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, active: !row.active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update prompt');
      setRows((prev) => prev.map((r) => (r.id === row.id ? json : r)));
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
    try {
      const res = await fetch('/api/admin/mandali-prompts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete prompt');
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Mandali Conversation-Starter Prompts</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">
                Curated prompt bank, rotated daily as a pinned post
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
          Every Mandali sees one active prompt per day, picked deterministically by day-of-year
          from this pool and pinned to the top of its feed (src/lib/mandali-data-server.ts). Hindi
          and Punjabi are optional -- a missing translation simply falls back to English for that
          viewer. Deactivating a prompt removes it from tomorrow&apos;s rotation; it does not delete any
          post already made from it.
        </p>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>
        )}

        <div className="glass-panel rounded-[2rem] border border-black/5 bg-white/40 p-6 space-y-3">
          <h3 className="font-bold theme-ink flex items-center gap-2">
            <Plus size={16} /> Add a prompt
          </h3>
          <textarea
            value={draft.text_en}
            onChange={(e) => setDraft((d) => ({ ...d, text_en: e.target.value }))}
            placeholder="English (required) -- e.g. Who's observing Ekadashi this week?"
            className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm theme-ink"
            rows={2}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea
              value={draft.text_hi}
              onChange={(e) => setDraft((d) => ({ ...d, text_hi: e.target.value }))}
              placeholder="Hindi (optional)"
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm theme-ink"
              rows={2}
            />
            <textarea
              value={draft.text_pa}
              onChange={(e) => setDraft((d) => ({ ...d, text_pa: e.target.value }))}
              placeholder="Punjabi (optional)"
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm theme-ink"
              rows={2}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              value={draft.tradition}
              onChange={(e) => setDraft((d) => ({ ...d, tradition: e.target.value }))}
              placeholder="Tradition scope (optional -- blank = shown to every Mandali)"
              className="flex-1 rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm theme-ink"
            />
            <button
              onClick={createPrompt}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
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
          <div className="p-12 text-center text-[var(--brand-muted)] glass-panel rounded-[2rem] border border-black/5 bg-white/40">
            No prompts yet -- add one above.
          </div>
        ) : (
          rows.map((row) => {
            const dirty = Boolean(edits[row.id]);
            const busy = busyId === row.id;
            return (
              <div key={row.id} className="glass-panel rounded-[2rem] border border-black/5 bg-white/40 p-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} className="text-[var(--brand-muted)]" />
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${row.active ? 'text-emerald-600' : 'text-[var(--brand-muted)]'}`}>
                      {row.active ? 'Active' : 'Inactive'}
                    </span>
                    {row.tradition && (
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--brand-muted)]">
                        · {row.tradition}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(row)}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-xl bg-black/5 text-[10px] font-bold text-[var(--brand-muted)] hover:bg-black/10 transition-colors disabled:opacity-50"
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => saveRow(row)}
                      disabled={!dirty || busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Save size={12} /> Save
                    </button>
                    <button
                      onClick={() => deleteRow(row)}
                      disabled={busy}
                      className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-[var(--brand-muted)]">EN</p>
                  <textarea
                    value={String(fieldFor(row, 'text_en') ?? '')}
                    onChange={(e) => setField(row.id, 'text_en', e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm theme-ink"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-[var(--brand-muted)]">HI</p>
                    <textarea
                      value={String(fieldFor(row, 'text_hi') ?? '')}
                      onChange={(e) => setField(row.id, 'text_hi', e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm theme-ink"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-[var(--brand-muted)]">PA</p>
                    <textarea
                      value={String(fieldFor(row, 'text_pa') ?? '')}
                      onChange={(e) => setField(row.id, 'text_pa', e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm theme-ink"
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
