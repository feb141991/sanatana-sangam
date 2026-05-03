'use client';

// ─── Admin: Hindi Meanings Generator ─────────────────────────────────────────
// Batch-generates Hindi meanings for all library entries via Gemini.
// Saves directly to the hindi_meanings Supabase table.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { GITA_FULL_DATA } from '@/lib/gita-full-data';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';

const BATCH_SIZE = 20;

type Status = 'idle' | 'running' | 'done' | 'error';

interface BatchResult {
  batchIdx: number;
  label: string;
  saved: number;
  error?: string;
}

export default function HindiGeneratorPage() {
  const [status,   setStatus]   = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [total,    setTotal]    = useState(0);
  const [results,  setResults]  = useState<BatchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const allEntries = [
    // Gita entries
    ...GITA_FULL_DATA.map(e => ({ id: e.id, meaning: (e as any).meaning as string })),
    // Library entries
    ...ALL_LIBRARY_ENTRIES.map(e => ({ id: e.id, meaning: e.meaning })),
  ].filter(e => e.id && e.meaning);

  const run = useCallback(async () => {
    setStatus('running');
    setProgress(0);
    setResults([]);
    setErrorMsg('');

    const batches: typeof allEntries[] = [];
    for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
      batches.push(allEntries.slice(i, i + BATCH_SIZE));
    }
    setTotal(batches.length);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const label = `${batch[0].id} … ${batch[batch.length - 1].id}`;
      try {
        const res = await fetch('/api/admin/generate-hindi-meanings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: batch }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Unknown error');
        setResults(prev => [...prev, { batchIdx: i + 1, label, saved: data.saved }]);
      } catch (err: any) {
        const errResult = { batchIdx: i + 1, label, saved: 0, error: err.message };
        setResults(prev => [...prev, errResult]);
        setErrorMsg(`Batch ${i + 1} failed: ${err.message}`);
        setStatus('error');
        setProgress(i + 1);
        return;
      }
      setProgress(i + 1);
      // Small delay to avoid rate limits
      if (i < batches.length - 1) await new Promise(r => setTimeout(r, 600));
    }

    setStatus('done');
  }, [allEntries]);

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  const totalEntries = allEntries.length;
  const totalBatches = Math.ceil(totalEntries / BATCH_SIZE);

  return (
    <div className="min-h-screen bg-[#0c0c0a] text-white p-6 pb-24 max-w-2xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6">
        <ChevronLeft size={14} /> Back to Admin
      </Link>

      <h1 className="text-2xl font-bold mb-1">Hindi Meanings Generator</h1>
      <p className="text-sm text-white/50 mb-8">
        Generates Hindi translations for all {totalEntries} scripture entries ({totalBatches} batches of {BATCH_SIZE}).
        Results are saved directly to Supabase and served to Hindi-language users.
      </p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>{progress} / {total || totalBatches} batches</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: '#c8924a' }}
          />
        </div>
      </div>

      {/* Action button */}
      {status === 'idle' && (
        <button
          onClick={run}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1c1c1a]"
          style={{ background: '#c8924a' }}
        >
          <Play size={16} /> Start Generation
        </button>
      )}
      {status === 'running' && (
        <button disabled className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1c1c1a] opacity-70" style={{ background: '#c8924a' }}>
          <Loader2 size={16} className="animate-spin" /> Generating…
        </button>
      )}
      {status === 'done' && (
        <div className="flex items-center gap-2 text-green-400 font-semibold">
          <CheckCircle2 size={20} /> All {totalEntries} entries translated and saved.
        </div>
      )}
      {status === 'error' && (
        <div>
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-3">
            <AlertCircle size={20} /> {errorMsg}
          </div>
          <button
            onClick={run}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#1c1c1a]"
            style={{ background: '#c8924a' }}
          >
            Retry from beginning
          </button>
        </div>
      )}

      {/* Batch log */}
      {results.length > 0 && (
        <div className="mt-8 space-y-1.5">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Batch Log</p>
          {results.map(r => (
            <div key={r.batchIdx} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${r.error ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/60'}`}>
              <span className="font-mono truncate max-w-[70%]">{r.label}</span>
              <span>{r.error ? `✗ ${r.error}` : `✓ ${r.saved} saved`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
