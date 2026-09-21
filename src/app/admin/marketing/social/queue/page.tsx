"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw, Plus, AlertTriangle } from "lucide-react";

interface PostSummary {
  id: string;
  post_key: string;
  internal_label: string;
  pipeline_stage: string;
  theme_type: "festival" | "general";
  objective: string;
  frozen_scheduled_publish_at: string;
}

const STAGE_TONE: Record<string, string> = {
  reserved: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  image_ready: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  captions_drafted: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  review: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  approved: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  publishing: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  partially_published: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  needs_investigation: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  failed: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  expired: "bg-slate-500/10 text-slate-500 border-slate-500/20"
};

const ALL_STAGES = [
  "all", "reserved", "image_ready", "captions_drafted", "review", "approved",
  "publishing", "completed", "partially_published", "needs_investigation", "failed", "expired"
];

export default function QueuePage() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState(searchParams.get("stage") ?? "all");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [contentType, setContentType] = useState<"festival" | "general">("general");
  const [targetDate, setTargetDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = stage === "all" ? "/api/admin/marketing/social/posts" : `/api/admin/marketing/social/posts?stage=${stage}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [stage]);

  useEffect(() => {
    load();
  }, [load]);

  const createPost = async () => {
    if (!targetDate) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: contentType, target_date: targetDate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.reserved) throw new Error(`Not reserved: ${data.reason}`);
      setShowCreate(false);
      setTargetDate("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/marketing/social" className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-tight">Calendar & Queue</h1>
              <p className="text-xs text-[var(--text-muted)]">Every post in the pipeline, by stage.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2">
              <Plus size={16} /> Reserve a Post
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {ALL_STAGES.map(st => (
            <button
              key={st}
              onClick={() => setStage(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${
                stage === st
                  ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] border border-transparent"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)]">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)]">
            <p className="text-sm font-semibold text-[var(--text-secondary)]">No posts in this stage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {posts.map(p => (
              <Link
                key={p.id}
                href={`/admin/marketing/social/posts/${p.id}`}
                className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-amber-500/40 transition-all flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${STAGE_TONE[p.pipeline_stage] ?? ""}`}>
                      {p.pipeline_stage.replace("_", " ")}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">{p.post_key}</span>
                  </div>
                  <h3 className="text-sm font-bold">{p.internal_label}</h3>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">{new Date(p.frozen_scheduled_publish_at).toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-black/10">
            <h3 className="text-sm font-bold">Reserve a post manually</h3>
            <p className="text-xs text-[var(--text-muted)]">Goes through the same idempotent reservation path as the daily tick.</p>
            <label className="block text-xs space-y-1">
              <span className="font-semibold text-[var(--text-muted)]">Content type</span>
              <select value={contentType} onChange={e => setContentType(e.target.value as "festival" | "general")} className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
                <option value="general">General</option>
                <option value="festival">Festival</option>
              </select>
            </label>
            <label className="block text-xs space-y-1">
              <span className="font-semibold text-[var(--text-muted)]">Target date</span>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)]" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)]">Cancel</button>
              <button disabled={creating || !targetDate} onClick={createPost} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50">
                {creating ? "Reserving..." : "Reserve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
