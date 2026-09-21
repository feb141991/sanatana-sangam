"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, Search, CheckCircle2, XCircle } from "lucide-react";

interface PostSummary {
  id: string;
  internal_label: string;
  pipeline_stage: string;
}

interface VariantDetail {
  id: string;
  platform: string;
  publish_status: string;
  caption: string;
}

interface Candidate {
  externalPostId: string;
  permalinkUrl: string | null;
  createdTime: string;
  captionSnippet: string | null;
}

function IssueRow({ post, onResolved }: { post: PostSummary; onResolved: () => void }) {
  const [variants, setVariants] = useState<VariantDetail[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [loadingCandidates, setLoadingCandidates] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVariants = useCallback(async () => {
    const res = await fetch(`/api/admin/marketing/social/posts/${post.id}`);
    const data = await res.json();
    if (res.ok) setVariants((data.variants ?? []).filter((v: VariantDetail) => v.publish_status === "outcome_unknown"));
  }, [post.id]);

  useEffect(() => {
    if (expanded) loadVariants();
  }, [expanded, loadVariants]);

  const searchCandidates = async (variantId: string) => {
    setLoadingCandidates(variantId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/marketing/social/posts/${post.id}/variants/${variantId}/reconcile`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCandidates(prev => ({ ...prev, [variantId]: data.candidates ?? [] }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingCandidates(null);
    }
  };

  const resolve = async (variantId: string, resolution: "confirmed_published" | "confirmed_not_published", candidate?: Candidate) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/marketing/social/posts/${post.id}/variants/${variantId}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          external_post_id: candidate?.externalPostId ?? null,
          permalink_url: candidate?.permalinkUrl ?? null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadVariants();
      onResolved();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--surface-hover)]">
        <div>
          <p className="text-xs font-bold">{post.internal_label}</p>
          <p className="text-[11px] text-[var(--text-muted)] capitalize">{post.pipeline_stage.replace("_", " ")}</p>
        </div>
        <Link href={`/admin/marketing/social/posts/${post.id}`} className="text-[11px] text-[var(--text-muted)] underline" onClick={e => e.stopPropagation()}>
          Open post
        </Link>
      </button>

      {expanded && (
        <div className="p-4 border-t border-[var(--border-subtle)] space-y-3">
          {error && <p className="text-xs text-rose-600">{error}</p>}
          {variants.length === 0 && <p className="text-xs text-[var(--text-muted)]">No outcome-unknown variants left on this post.</p>}
          {variants.map(v => (
            <div key={v.id} className="p-3.5 rounded-xl border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold capitalize">{v.platform}</span>
                <button
                  onClick={() => searchCandidates(v.id)}
                  disabled={loadingCandidates === v.id}
                  className="text-[11px] font-bold text-amber-700 flex items-center gap-1"
                >
                  <Search size={12} /> {loadingCandidates === v.id ? "Searching..." : "Search for candidates"}
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">{v.caption}</p>

              {candidates[v.id] !== undefined && (
                <div className="space-y-1.5">
                  {candidates[v.id].length === 0 && (
                    <p className="text-[11px] text-[var(--text-muted)] italic">
                      No probable match found. {v.platform === "linkedin" ? "LinkedIn offers no automated lookup -- confirm manually on the org page." : "Confirm manually if unsure."}
                    </p>
                  )}
                  {candidates[v.id].map(c => (
                    <div key={c.externalPostId} className="p-2.5 rounded-lg bg-[var(--surface-hover)] flex items-center justify-between gap-2">
                      <div className="text-[11px]">
                        <p className="font-mono">{c.externalPostId}</p>
                        <p className="text-[var(--text-muted)]">{c.captionSnippet}</p>
                      </div>
                      <button
                        onClick={() => resolve(v.id, "confirmed_published", c)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold whitespace-nowrap"
                      >
                        This is it
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => resolve(v.id, "confirmed_not_published")}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[11px] font-bold flex items-center gap-1 text-rose-700"
                >
                  <XCircle size={12} /> Confirm NOT published
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IssuesPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/marketing/social/posts?stage=needs_investigation&limit=100");
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/marketing/social" className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
              <ArrowLeft size={16} />
            </Link>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-tight">Published & Issues</h1>
              <p className="text-xs text-[var(--text-muted)]">Posts with at least one unresolved send outcome.</p>
            </div>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)]">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)] flex flex-col items-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">Nothing needs investigation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(p => (
              <IssueRow key={p.id} post={p} onResolved={load} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
