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

interface SocialThemeSummary {
  id: string;
  title: string;
  prompt_seed: string;
  grounding_material: string;
  is_active: boolean;
}

type CreatePostPayload = {
  content_type: "festival" | "general";
  target_date: string;
  theme_id?: string;
  custom_theme?: {
    title: string;
    grounding_material: string;
  };
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isSocialThemeSummary(value: unknown): value is SocialThemeSummary {
  if (!value || typeof value !== "object") return false;
  const theme = value as Record<string, unknown>;
  return typeof theme.id === "string"
    && typeof theme.title === "string"
    && typeof theme.prompt_seed === "string"
    && typeof theme.grounding_material === "string"
    && typeof theme.is_active === "boolean";
}

const STAGE_TONE: Record<string, string> = {
  reserved: "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
  image_ready: "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
  captions_drafted: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[var(--brand-primary)]",
  review: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[var(--brand-primary)]",
  approved: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[var(--brand-primary)]",
  publishing: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border-[var(--brand-primary)]",
  completed: "bg-[var(--surface-soft)] text-[var(--text-primary)] border-[var(--border-subtle)]",
  partially_published: "bg-[var(--surface-soft)] text-[var(--text-primary)] border-[var(--border-subtle)]",
  needs_investigation: "bg-[var(--surface-soft)] text-[var(--text-primary)] border-[var(--border-subtle)]",
  failed: "bg-[var(--surface-soft)] text-[var(--text-primary)] border-[var(--border-subtle)]",
  expired: "bg-[var(--surface-soft)] text-[var(--text-muted)] border-[var(--border-subtle)]"
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
  const [themes, setThemes] = useState<SocialThemeSummary[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");
  const [customGrounding, setCustomGrounding] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!showCreate) return;
    setModalError(null);
    fetch("/api/admin/marketing/social/themes")
      .then(res => res.json())
      .then((data: unknown) => {
        if (!data || typeof data !== "object") return;
        const candidateThemes = (data as Record<string, unknown>).themes;
        if (Array.isArray(candidateThemes)) {
          setThemes(candidateThemes.filter(isSocialThemeSummary).filter(theme => theme.is_active));
        }
      })
      .catch(() => {});
  }, [showCreate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = stage === "all" ? "/api/admin/marketing/social/posts" : `/api/admin/marketing/social/posts?stage=${stage}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts ?? []);
    } catch (e: unknown) {
      setError(errorMessage(e, "Failed to load the social queue."));
    } finally {
      setLoading(false);
    }
  }, [stage]);

  useEffect(() => {
    load();
  }, [load]);

  const createPost = async () => {
    if (!targetDate) return;
    if (contentType === "general" && selectedThemeId === "custom") {
      if (!customTitle.trim()) {
        setModalError("Please enter a custom subcategory title.");
        return;
      }
      if (!customGrounding.trim()) {
        setModalError("Please enter grounding notes / scriptural backing to prevent AI hallucinations.");
        return;
      }
    }
    setCreating(true);
    setModalError(null);
    try {
      const payload: CreatePostPayload = {
        content_type: contentType,
        target_date: targetDate,
      };
      if (contentType === "general") {
        if (selectedThemeId === "custom") {
          payload.custom_theme = {
            title: customTitle.trim(),
            grounding_material: customGrounding.trim(),
          };
        } else if (selectedThemeId) {
          payload.theme_id = selectedThemeId;
        }
      }
      const res = await fetch("/api/admin/marketing/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reserve post");
      if (!data.reserved) {
        if (data.reason === "no_eligible_general_theme") {
          throw new Error("No active grounded subcategories available. Please select or create a custom subcategory.");
        }
        if (data.reason === "no_qualifying_festival_for_date") {
          throw new Error(`No published festival found for ${targetDate}. Choose "General" content type or select a date with an observance.`);
        }
        if (data.reason === "already_reserved_for_date") {
          throw new Error(`A post for ${targetDate} is already reserved in the queue.`);
        }
        throw new Error(`Not reserved: ${data.reason}`);
      }
      setShowCreate(false);
      setTargetDate("");
      setSelectedThemeId("");
      setCustomTitle("");
      setCustomGrounding("");
      await load();
    } catch (e: unknown) {
      setModalError(errorMessage(e, "Failed to reserve the post."));
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
            <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-[var(--text-cream)] text-xs font-bold flex items-center gap-2">
              <Plus size={16} /> Reserve a Post
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-[var(--surface-soft)] border border-[var(--border-subtle)] rounded-2xl text-xs text-[var(--text-primary)] flex items-center gap-2">
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
                  ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-primary)]"
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
                className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--brand-primary)] transition-all flex items-center justify-between"
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
        <div className="fixed inset-0 z-50 bg-[var(--divine-bg)] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface-card)] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-[var(--border-subtle)]">
            <h3 className="text-sm font-bold">Reserve a post manually</h3>
            <p className="text-xs text-[var(--text-muted)]">Goes through the same idempotent reservation path as the daily tick.</p>
            <label className="block text-xs space-y-1">
              <span className="font-semibold text-[var(--text-muted)]">Content type</span>
              <select value={contentType} onChange={e => setContentType(e.target.value as "festival" | "general")} className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
                <option value="general">General</option>
                <option value="festival">Festival</option>
              </select>
            </label>

            {contentType === "general" && (
              <label className="block text-xs space-y-1">
                <span className="font-semibold text-[var(--text-muted)]">Subcategory / Theme</span>
                <select
                  value={selectedThemeId}
                  onChange={e => setSelectedThemeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]"
                >
                  <option value="">Auto-rotate (Next in line)</option>
                  {themes.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                  <option value="custom">+ Create Custom Subcategory (On the go)</option>
                </select>
              </label>
            )}

            {contentType === "general" && selectedThemeId === "custom" && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-[var(--surface-soft)] border border-[var(--border-subtle)]">
                <label className="block text-xs space-y-1">
                  <span className="font-semibold text-[var(--text-secondary)]">Custom Subcategory Title</span>
                  <input
                    type="text"
                    placeholder="e.g. Navratri Day 3 reflection, Gita on work stress"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]"
                  />
                </label>
                <label className="block text-xs space-y-1">
                  <span className="font-semibold text-[var(--text-secondary)]">Grounding Notes</span>
                  <textarea
                    rows={3}
                    placeholder="Add reviewed sources, or label the text clearly as Shoonaya-curated editorial guidance."
                    value={customGrounding}
                    onChange={e => setCustomGrounding(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs"
                  />
                </label>
              </div>
            )}

            <label className="block text-xs space-y-1">
              <span className="font-semibold text-[var(--text-muted)]">Target date</span>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)]" />
            </label>

            {modalError && (
              <p className="text-xs text-[var(--text-primary)] bg-[var(--surface-soft)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                {modalError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)]">Cancel</button>
              <button disabled={creating || !targetDate} onClick={createPost} className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-[var(--text-cream)] text-xs font-bold disabled:opacity-50">
                {creating ? "Reserving..." : "Reserve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
