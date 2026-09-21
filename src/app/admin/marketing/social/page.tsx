"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Instagram, Calendar, ClipboardList, AlertTriangle, Settings, RefreshCw, ArrowLeft
} from "lucide-react";

interface PostSummary {
  id: string;
  internal_label: string;
  pipeline_stage: string;
  theme_type: "festival" | "general";
  frozen_scheduled_publish_at: string;
}

const STAGE_GROUPS: Array<{ label: string; stages: string[]; href: string; tone: string }> = [
  { label: "Needs review", stages: ["review", "captions_drafted"], href: "/admin/marketing/social/queue?stage=review", tone: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { label: "Approved, awaiting publish", stages: ["approved"], href: "/admin/marketing/social/queue?stage=approved", tone: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  { label: "Needs investigation", stages: ["needs_investigation"], href: "/admin/marketing/social/issues", tone: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  { label: "Completed", stages: ["completed", "partially_published"], href: "/admin/marketing/social/queue?stage=completed", tone: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" }
];

export default function SocialOverviewPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing/social/posts?limit=200");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const countFor = (stages: string[]) => posts.filter(p => stages.includes(p.pipeline_stage)).length;

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/marketing" className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
              <ArrowLeft size={16} />
            </Link>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 border border-pink-500/20">
              <Instagram size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-tight">Social Publishing Studio</h1>
              <p className="text-xs text-[var(--text-muted)]">Daily Instagram, Facebook & LinkedIn content pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <Link href="/admin/marketing/social/accounts" className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2">
              <Settings size={14} /> Accounts & Automation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGE_GROUPS.map(group => (
            <Link
              key={group.label}
              href={group.href}
              className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-amber-500/40 transition-all space-y-2"
            >
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${group.tone}`}>
                {group.label}
              </span>
              <p className="text-3xl font-bold font-serif">{loading ? "—" : countFor(group.stages)}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/marketing/social/queue"
            className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-amber-500/40 transition-all flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600"><Calendar size={22} /></div>
            <div>
              <h3 className="text-sm font-bold">Calendar & Queue</h3>
              <p className="text-xs text-[var(--text-muted)]">See every reserved/drafted/scheduled post, and add one manually.</p>
            </div>
          </Link>
          <Link
            href="/admin/marketing/social/issues"
            className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-rose-400/40 transition-all flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600"><AlertTriangle size={22} /></div>
            <div>
              <h3 className="text-sm font-bold">Published & Issues</h3>
              <p className="text-xs text-[var(--text-muted)]">Investigate outcome-unknown sends and confirm what actually happened.</p>
            </div>
          </Link>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold px-1 flex items-center gap-2"><ClipboardList size={16} /> Recent Posts</h2>
          <div className="space-y-2">
            {posts.slice(0, 10).map(p => (
              <Link
                key={p.id}
                href={`/admin/marketing/social/posts/${p.id}`}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-amber-500/40 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold">{p.internal_label}</p>
                  <p className="text-[11px] text-[var(--text-muted)] capitalize">{p.theme_type} • {p.pipeline_stage.replace("_", " ")}</p>
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">{new Date(p.frozen_scheduled_publish_at).toLocaleString()}</span>
              </Link>
            ))}
            {!loading && posts.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] p-4">No posts yet -- they appear once the daily pipeline reserves one, or you add one manually from Calendar & Queue.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
