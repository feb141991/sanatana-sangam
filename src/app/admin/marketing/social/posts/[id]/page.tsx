"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2, Send, AlertTriangle, RefreshCw, Image as ImageIcon } from "lucide-react";

interface Variant {
  id: string;
  platform: "instagram" | "facebook" | "linkedin";
  caption: string;
  hashtags: string[];
  cta_url: string | null;
  publish_status: string;
  approved_platform_account_id: string | null;
  last_error_code: string | null;
  external_post_id: string | null;
  permalink_url: string | null;
}

interface PostDetail {
  id: string;
  internal_label: string;
  pipeline_stage: string;
  theme_type: string;
  objective: string;
  frozen_scheduled_publish_at: string;
  source_snapshot: Record<string, unknown>;
  image_asset_url: string | null;
}

interface Account {
  id: string;
  account_type: string;
  display_name: string | null;
  status: string;
}

export default function PostReviewPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [publishConfirmText, setPublishConfirmText] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postRes, accountsRes] = await Promise.all([
        fetch(`/api/admin/marketing/social/posts/${postId}`),
        fetch("/api/admin/marketing/social/accounts")
      ]);
      const postData = await postRes.json();
      const accountsData = await accountsRes.json();
      if (!postRes.ok) throw new Error(postData.error);
      setPost(postData.post);
      setVariants(postData.variants ?? []);
      setImagePreviewUrl(postData.imagePreviewUrl);
      setAccounts((accountsData.accounts ?? []).filter((a: Account) => a.status === "active"));
      const nextAssignments: Record<string, string> = {};
      for (const v of postData.variants ?? []) {
        if (v.approved_platform_account_id) nextAssignments[v.id] = v.approved_platform_account_id;
      }
      setAssignments(nextAssignments);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadImage = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/marketing/social/posts/${postId}/image`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveVariant = async (variantId: string, patch: Partial<Pick<Variant, "caption" | "hashtags" | "cta_url">>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/marketing/social/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_id: variantId, ...patch })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/marketing/social/posts/${postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_account_assignments: assignments })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const publishNow = async () => {
    if (!post) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/marketing/social/posts/${postId}/publish-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation_phrase: "LIVE SEND", confirmed_label: post.internal_label })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowPublishModal(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-xs text-[var(--text-muted)]">Loading...</div>;
  if (!post) return <div className="p-12 text-center text-xs text-rose-600">Post not found</div>;

  const canApprove = ["review", "captions_drafted"].includes(post.pipeline_stage) && Boolean(post.image_asset_url) &&
    variants.every(v => v.caption.trim() && assignments[v.id]);

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/marketing/social/queue" className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-lg font-bold font-serif tracking-tight">{post.internal_label}</h1>
              <p className="text-xs text-[var(--text-muted)] capitalize">{post.pipeline_stage.replace("_", " ")} • scheduled {new Date(post.frozen_scheduled_publish_at).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Source grounding, read-only */}
        <section className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Source (fixed, not editable here)</h2>
          <pre className="text-[11px] whitespace-pre-wrap font-mono text-[var(--text-secondary)]">{JSON.stringify(post.source_snapshot, null, 2)}</pre>
        </section>

        {/* Image */}
        <section className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2"><ImageIcon size={14} /> Artwork</h2>
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="Draft artwork" className="max-h-96 rounded-xl border border-[var(--border-subtle)]" />
          ) : (
            <p className="text-xs text-[var(--text-muted)]">No artwork attached yet.</p>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-bold cursor-pointer">
            <Upload size={14} /> Upload artwork
            <input
              type="file"
              accept="image/webp,image/jpeg,image/png"
              className="hidden"
              disabled={busy}
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}
            />
          </label>
        </section>

        {/* Per-platform captions */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">Per-Platform Captions</h2>
          {variants.map(v => (
            <div key={v.id} className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold capitalize">{v.platform}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md border border-[var(--border-subtle)] text-[var(--text-muted)] capitalize">
                  {v.publish_status.replace("_", " ")}
                </span>
              </div>

              <textarea
                defaultValue={v.caption}
                disabled={busy}
                onBlur={e => e.target.value !== v.caption && saveVariant(v.id, { caption: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-transparent text-xs"
              />
              <input
                defaultValue={v.hashtags.join(" ")}
                disabled={busy}
                onBlur={e => saveVariant(v.id, { hashtags: e.target.value.split(/\s+/).filter(Boolean) })}
                placeholder="hashtags separated by spaces"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-transparent text-xs"
              />
              <input
                defaultValue={v.cta_url ?? ""}
                disabled={busy}
                onBlur={e => saveVariant(v.id, { cta_url: e.target.value })}
                placeholder="CTA URL"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-transparent text-xs"
              />

              <label className="block text-xs space-y-1">
                <span className="font-semibold text-[var(--text-muted)]">Destination account</span>
                <select
                  value={assignments[v.id] ?? ""}
                  onChange={e => setAssignments(prev => ({ ...prev, [v.id]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)]"
                >
                  <option value="">Select an account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.display_name ?? a.account_type}</option>
                  ))}
                </select>
              </label>

              {v.external_post_id && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  Published: {v.permalink_url ? <a href={v.permalink_url} target="_blank" rel="noreferrer" className="underline">{v.external_post_id}</a> : v.external_post_id}
                </p>
              )}
              {v.last_error_code && <p className="text-[11px] text-rose-600">Last error: {v.last_error_code}</p>}
            </div>
          ))}
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {["review", "captions_drafted"].includes(post.pipeline_stage) && (
            <button
              disabled={busy || !canApprove}
              onClick={approve}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-40"
            >
              <CheckCircle2 size={16} /> Approve
            </button>
          )}
          {post.pipeline_stage === "approved" && (
            <button
              onClick={() => setShowPublishModal(true)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2"
            >
              <Send size={16} /> Publish Now
            </button>
          )}
        </div>
      </main>

      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-black/10">
            <h3 className="text-sm font-bold text-rose-700">Publish now -- irreversible</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Type <code className="font-mono font-bold">LIVE SEND</code> and confirm the exact post label
              (<code className="font-mono font-bold">{post.internal_label}</code>) to send to every assigned platform right now, bypassing the scheduled time window.
            </p>
            <input
              value={publishConfirmText}
              onChange={e => setPublishConfirmText(e.target.value)}
              placeholder="LIVE SEND"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)]">Cancel</button>
              <button
                disabled={busy || publishConfirmText !== "LIVE SEND"}
                onClick={publishNow}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40"
              >
                {busy ? "Sending..." : "Confirm Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
