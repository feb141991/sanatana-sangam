"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Play, CheckCircle2, AlertCircle, Loader2, Square } from "lucide-react";

const BATCH_SIZE = 20;

type Status = "idle" | "running" | "done" | "error" | "stopped";

interface BatchResult {
  batchIdx: number;
  label: string;
  saved: number;
  error?: string;
}

interface HindiGeneratorClientProps {
  entries: { id: string; meaning: string }[];
}

export function HindiGeneratorClient({ entries }: HindiGeneratorClientProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isStopping, setIsStopping] = useState(false);
  const stopRequestedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = useCallback(() => {
    stopRequestedRef.current = true;
    setIsStopping(true);
    abortControllerRef.current?.abort();
  }, []);

  const run = useCallback(async () => {
    setStatus("running");
    setIsStopping(false);
    stopRequestedRef.current = false;
    setProgress(0);
    setResults([]);
    setErrorMsg("");

    const batches: typeof entries[] = [];
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      batches.push(entries.slice(i, i + BATCH_SIZE));
    }
    setTotal(batches.length);

    for (let i = 0; i < batches.length; i++) {
      if (stopRequestedRef.current) {
        setStatus("stopped");
        setIsStopping(false);
        break;
      }
      const batch = batches[i];
      const label = `${batch[0].id} … ${batch[batch.length - 1].id}`;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/admin/generate-hindi-meanings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: batch }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Unknown error");
        setResults((prev) => [...prev, { batchIdx: i + 1, label, saved: data.saved }]);
      } catch (err: any) {
        if (err.name === "AbortError" || stopRequestedRef.current) {
          setStatus("stopped");
          setIsStopping(false);
          break;
        }
        const errResult = { batchIdx: i + 1, label, saved: 0, error: err.message };
        setResults((prev) => [...prev, errResult]);
      }
      setProgress(i + 1);
    }

    if (!stopRequestedRef.current) {
      setStatus("done");
    }
    setIsStopping(false);
  }, [entries]);

  const totalSaved = results.reduce((acc, r) => acc + (r.saved || 0), 0);
  const totalErrors = results.filter((r) => r.error).length;

  return (
    <div className="min-h-screen bg-[#0E0C0A] text-[#EDE8E1] p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#C4A972] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-serif text-[#C4A972]">Generate Hindi Meanings</h1>
          <p className="text-xs text-[#EDE8E1]/50">
            Sarvam batch generator · {entries.length} total entries
          </p>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-medium">Batch Run</div>
            <div className="text-xs text-[#EDE8E1]/50">
              Processes {entries.length} entries in batches of {BATCH_SIZE}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === "running" && (
              <button
                type="button"
                onClick={handleStop}
                disabled={isStopping}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                title="Stop batch generation immediately"
              >
                <Square className="w-4 h-4 fill-current" />
                {isStopping ? "Stopping…" : "Stop Batch"}
              </button>
            )}
            <button
              onClick={run}
              disabled={status === "running"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C4A972] text-[#0E0C0A] font-semibold text-sm hover:bg-[#D4B982] disabled:opacity-50 transition-colors"
            >
              {status === "running" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  {status === "stopped" ? "Restart / Resume Generator" : "Start Generator"}
                </>
              )}
            </button>
          </div>
        </div>

        {status === "stopped" && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Batch Interrupted:</strong> Run stopped by user after batch {progress} of {total}. All {totalSaved} processed entries were safely saved.
              </span>
            </div>
          </div>
        )}

        {total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#EDE8E1]/60">
              <span>Progress</span>
              <span>{progress} / {total} batches ({Math.round((progress / total) * 100)}%)</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C4A972] transition-all duration-300"
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium">Results Summary</h2>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-400">✓ {totalSaved} saved</span>
              {totalErrors > 0 && <span className="text-red-400">✗ {totalErrors} errors</span>}
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {results.map((r) => (
              <div
                key={r.batchIdx}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <span className="font-mono text-[#EDE8E1]/60">{r.label}</span>
                {r.error ? (
                  <span className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {r.error}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {r.saved} saved
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
