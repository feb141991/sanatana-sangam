'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Trophy, Loader2, Trash2, Save, Plus } from 'lucide-react';
import Link from 'next/link';

type Season = {
  id: string;
  definition_key: string;
  title: string;
  badge_slug: string;
  active: boolean;
};

type Question = {
  id: string;
  definition_key: string;
  day_sequence: number;
  question_en: string;
  question_hi: string | null;
  question_pa: string | null;
  options_en: string[];
  options_hi: string[] | null;
  options_pa: string[] | null;
  correct_option_idx: number;
  explanation_en: string | null;
  explanation_hi: string | null;
  explanation_pa: string | null;
  source: string | null;
  active: boolean;
};

const EMPTY_OPTIONS: [string, string, string, string] = ['', '', '', ''];
function emptyDraft(definitionKey: string, daySequence: number) {
  return {
    definition_key: definitionKey,
    day_sequence: daySequence,
    question_en: '',
    options_en: [...EMPTY_OPTIONS] as string[],
    correct_option_idx: 0,
    explanation_en: '',
    source: '',
  };
}

export default function FestivalQuizAdminPage() {
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [edits, setEdits] = useState<Record<string, Partial<Question>>>({});

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/festival-quiz');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch');
      setSeasons(json.seasons ?? []);
      setQuestions(json.questions ?? []);
      setSelectedKey((prev) => prev ?? json.seasons?.[0]?.definition_key ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedSeason = seasons.find((s) => s.definition_key === selectedKey) ?? null;
  const seasonQuestions = useMemo(
    () => questions.filter((q) => q.definition_key === selectedKey).sort((a, b) => a.day_sequence - b.day_sequence),
    [questions, selectedKey],
  );
  const nextDaySequence = seasonQuestions.length > 0 ? Math.max(...seasonQuestions.map((q) => q.day_sequence)) + 1 : 1;
  const [draft, setDraft] = useState(() => emptyDraft(selectedKey ?? '', 1));

  useEffect(() => {
    if (selectedKey) setDraft(emptyDraft(selectedKey, nextDaySequence));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  function fieldFor(row: Question, key: keyof Question) {
    return edits[row.id]?.[key] ?? row[key];
  }
  function setField(id: string, key: keyof Question, value: unknown) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }
  function setOptionAt(id: string, current: string[], index: number, value: string) {
    const next = [...current];
    next[index] = value;
    setField(id, 'options_en', next);
  }

  async function createQuestion() {
    if (!draft.question_en.trim() || draft.options_en.some((o) => !o.trim())) {
      setError('English question and all 4 English options are required.');
      return;
    }
    setCreating(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/festival-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create question');
      setQuestions((prev) => [...prev, json]);
      setDraft(emptyDraft(selectedKey ?? '', draft.day_sequence + 1));
      setStatus(`Day ${draft.day_sequence} question added (inactive -- review before activating).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(row: Question) {
    const patch = edits[row.id];
    if (!patch) return;
    setBusyId(row.id);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/festival-quiz', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save');
      setQuestions((prev) => prev.map((r) => (r.id === row.id ? json : r)));
      setEdits((prev) => { const next = { ...prev }; delete next[row.id]; return next; });
      setStatus('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(row: Question) {
    setBusyId(row.id);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/festival-quiz', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, active: !row.active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update');
      setQuestions((prev) => prev.map((r) => (r.id === row.id ? json : r)));
      setStatus(row.active ? 'Deactivated -- withheld from the season until reactivated.' : 'Activated -- live for seekers once the day unlocks.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRow(row: Question) {
    if (!window.confirm(`Delete Day ${row.day_sequence}? "${row.question_en.slice(0, 60)}..."`)) return;
    setBusyId(row.id);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/festival-quiz', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete');
      setQuestions((prev) => prev.filter((r) => r.id !== row.id));
      setStatus('Deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
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
              <h1 className="text-xl font-bold font-serif theme-ink">Festival Quiz Seasons</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">
                Curated per-day questions for multi-day festival journeys
              </p>
            </div>
          </div>
          {selectedSeason && (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold">
              {seasonQuestions.filter((q) => q.active).length}/{seasonQuestions.length} active
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <p className="text-xs text-[var(--brand-muted)] leading-relaxed max-w-2xl">
          Each question is seeded inactive and must be reviewed and activated here before it can
          reach a seeker -- day unlock itself is fully automatic (panchang-driven, from the
          seeker&apos;s own resolved calendar), this page only controls curation. Hindi/Punjabi
          fall back to English when unset.
        </p>

        {error && <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 text-sm font-medium">{error}</div>}
        {status && <div role="status" aria-live="polite" className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-700 text-sm font-medium">{status}</div>}

        {loading ? (
          <div className="p-12 text-center text-[var(--brand-muted)] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : seasons.length === 0 ? (
          <div className="p-12 text-center text-[var(--brand-muted)] glass-panel rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]">
            No festival quiz seasons yet -- seed one via scripts/seed-festival-quiz-sharad-navratri.ts.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedKey(s.definition_key)}
                  className={`min-h-11 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    s.definition_key === selectedKey
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--surface-soft)] text-[var(--brand-muted)] hover:opacity-80'
                  }`}
                >
                  <Trophy size={12} className="inline mr-1.5 -mt-0.5" /> {s.title}
                </button>
              ))}
            </div>

            <div className="glass-panel rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-3">
              <h3 className="font-bold theme-ink flex items-center gap-2"><Plus size={16} /> Add Day {draft.day_sequence}</h3>
              <textarea
                value={draft.question_en}
                onChange={(e) => setDraft((d) => ({ ...d, question_en: e.target.value }))}
                placeholder="Question (English)"
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink"
                rows={2}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {draft.options_en.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm theme-ink">
                    <input
                      type="radio"
                      name="draft-correct"
                      checked={draft.correct_option_idx === i}
                      onChange={() => setDraft((d) => ({ ...d, correct_option_idx: i }))}
                    />
                    <input
                      value={opt}
                      onChange={(e) => {
                        const next = [...draft.options_en];
                        next[i] = e.target.value;
                        setDraft((d) => ({ ...d, options_en: next }));
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--surface-soft)] px-2 py-1.5 text-sm theme-ink"
                    />
                  </label>
                ))}
              </div>
              <textarea
                value={draft.explanation_en}
                onChange={(e) => setDraft((d) => ({ ...d, explanation_en: e.target.value }))}
                placeholder="Explanation shown after answering (English)"
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink"
                rows={2}
              />
              <div className="flex items-center gap-3">
                <input
                  value={draft.source}
                  onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
                  placeholder="Source (e.g. Devi Mahatmya / Durga Saptashati)"
                  className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink"
                />
                <button
                  type="button"
                  onClick={createQuestion}
                  disabled={creating}
                  className="min-h-11 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                </button>
              </div>
            </div>

            {seasonQuestions.length === 0 ? (
              <div className="p-12 text-center text-[var(--brand-muted)] glass-panel rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)]">
                No days added yet for this season.
              </div>
            ) : (
              seasonQuestions.map((row) => {
                const dirty = Boolean(edits[row.id]);
                const busy = busyId === row.id;
                const options = (fieldFor(row, 'options_en') as string[]) ?? row.options_en;
                const correctIdx = (fieldFor(row, 'correct_option_idx') as number) ?? row.correct_option_idx;
                return (
                  <div key={row.id} className="glass-panel rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold theme-ink">Day {row.day_sequence}</span>
                        <span className={`text-[10px] uppercase tracking-widest font-bold ${row.active ? 'text-emerald-600' : 'text-[var(--brand-muted)]'}`}>
                          {row.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                        <button type="button" onClick={() => toggleActive(row)} disabled={busy} className="min-h-11 px-3 py-1.5 rounded-xl bg-[var(--surface-soft)] text-sm font-bold text-[var(--brand-muted)] hover:opacity-80 disabled:opacity-50">
                          {row.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" onClick={() => saveRow(row)} disabled={!dirty || busy} className="min-h-11 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] text-sm font-bold hover:opacity-80 disabled:opacity-50">
                          <Save size={12} /> Save
                        </button>
                        <button type="button" aria-label={`Delete Day ${row.day_sequence}`} onClick={() => deleteRow(row)} disabled={busy} className="min-h-11 min-w-11 inline-flex items-center justify-center p-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white disabled:opacity-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={String(fieldFor(row, 'question_en') ?? '')}
                      onChange={(e) => setField(row.id, 'question_en', e.target.value)}
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink"
                      rows={2}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {options.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm theme-ink">
                          <input
                            type="radio"
                            name={`correct-${row.id}`}
                            checked={correctIdx === i}
                            onChange={() => setField(row.id, 'correct_option_idx', i)}
                          />
                          <input
                            value={opt}
                            onChange={(e) => setOptionAt(row.id, options, i, e.target.value)}
                            className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--surface-soft)] px-2 py-1.5 text-sm theme-ink"
                          />
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={String(fieldFor(row, 'explanation_en') ?? '')}
                      onChange={(e) => setField(row.id, 'explanation_en', e.target.value)}
                      placeholder="Explanation"
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink"
                      rows={2}
                    />
                    <input
                      value={String(fieldFor(row, 'source') ?? '')}
                      onChange={(e) => setField(row.id, 'source', e.target.value)}
                      placeholder="Source"
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm theme-ink"
                    />
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
