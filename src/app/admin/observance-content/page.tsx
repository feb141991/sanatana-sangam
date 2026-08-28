"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, Search,
  CheckCircle, AlertTriangle, Sparkles, BookOpen, Image as ImageIcon,
  Share2, RefreshCw, XCircle, ShieldCheck, Play, Zap, Calendar, Bell, Mail,
  Layers, Eye, History, RotateCcw, CheckSquare, Edit3, Send, Users, Shield,
  Copy, ExternalLink, ChevronRight
} from "lucide-react";

type TabId = "coverage" | "queue" | "review" | "artwork" | "published" | "share";

type Row = {
  id: string;
  slug: string;
  display_name: string;
  tradition: string;
  kind: string;
  current: { id: string; version: number; status: string; updated_at: string } | null;
  publishedVersion: { id: string; version: number; status: string; published_at: string } | null;
  sourceCount: number;
  approvedArtworkCount: number;
  approvedShareCount: number;
  previousOccurrence: string | null;
  nextOccurrence: string | null;
};

type StoryTranslation = {
  language: "en" | "hi" | "pa";
  teaser: string;
  origin: string;
  significance: string;
  rituals: string[];
  verse: { original: string; transliteration?: string; translation: string; sourceId: string } | null;
  personal_practice: string;
  review_status: string;
};

type SourceRecord = {
  id: string;
  title: string;
  author?: string;
  source_url: string;
  citation: string;
  source_tier: number;
  rights_status: string;
  excerpt: string;
  language: string;
  approved: boolean;
};

type ArtworkRecord = {
  id: string;
  kind: "card" | "reader_hero" | "share";
  version: number;
  uri: string;
  width: number;
  height: number;
  focal_x?: number;
  focal_y?: number;
  alt_text?: Record<string, string>;
  review_status: string;
  cultural_review_notes?: string;
};

type ShareRecord = {
  id: string;
  language: "en" | "hi" | "pa";
  audience: string;
  cta: string;
  title: string;
  message: string;
  review_status: string;
};

type AuditLogRecord = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: Record<string, unknown>;
  created_at: string;
};

type StoryDetail = {
  story: { id: string; version: number; status: string; review_notes?: string; generation_provider?: string; generation_model?: string; prompt_version?: string } | null;
  allVersions: Array<{ id: string; version: number; status: string; published_at?: string; created_at: string; review_notes?: string }>;
  translations: StoryTranslation[];
  linkedSources: Array<{ source_id: string; observance_content_sources: SourceRecord }>;
  allSources: SourceRecord[];
  artwork: ArtworkRecord[];
  shares: ShareRecord[];
  auditLog: AuditLogRecord[];
};

type PublishGateFailure = {
  missingLanguages?: string[];
  approvedSource?: boolean;
  approvedCardArt?: boolean;
  approvedNeutralShare?: boolean;
};

type SortField = "name" | "tradition" | "status" | "sources" | "artwork" | "shares" | "nextDate";
type SortOrder = "asc" | "desc";

export default function ObservanceContentStudioPage() {
  const [activeTab, setActiveTab] = useState<TabId>("coverage");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [traditionFilter, setTraditionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all");

  const [sortField, setSortField] = useState<SortField>("nextDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [error, setError] = useState<string | null>(null);
  const [publishGateError, setPublishGateError] = useState<PublishGateFailure | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<StoryDetail | null>(null);
  const [activeLang, setActiveLang] = useState<"en" | "hi" | "pa">("en");

  // Queue state
  const [queueSelectedIds, setQueueSelectedIds] = useState<string[]>([]);
  const [isBulkDrafting, setIsBulkDrafting] = useState(false);

  // Artwork Tab Form State
  const [showAddArtwork, setShowAddArtwork] = useState(false);
  const [artForm, setArtForm] = useState({
    kind: "card" as "card" | "reader_hero" | "share",
    uri: "https://images.unsplash.com/photo-1544816155-12df9643f363",
    width: 1200,
    height: 630,
    focalX: 0.5,
    focalY: 0.5,
    altTextEn: "Sacred festival celebration depicting traditional diya lamp and flowers",
    altTextHi: "पारंपरिक दीप और पुष्पों से सुसज्जित पावन पर्व का दृश्य",
    altTextPa: "ਪਵਿੱਤਰ ਤਿਉਹਾਰ ਦਾ ਦ੍ਰਿਸ਼ ਜਿਸ ਵਿੱਚ ਦੀਵੇ ਅਤੇ ਫੁੱਲ ਸਜਾਏ ਗਏ ਹਨ",
  });

  // Source Form State
  const [showAddSource, setShowAddSource] = useState(false);
  const [sourceForm, setSourceForm] = useState({
    title: "",
    author: "",
    url: "https://",
    citation: "",
    tier: 1,
    rightsStatus: "public_domain",
    excerpt: "",
    language: "en",
  });

  // Edit Translation State
  const [editingTranslation, setEditingTranslation] = useState<StoryTranslation | null>(null);

  const [reviewNotes, setReviewNotes] = useState("");

  const load = () =>
    fetch("/api/admin/observance-content")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load content studio");
        setRows(payload.rows ?? []);
        if (!selectedRow && (payload.rows ?? []).length > 0) {
          void loadDetail(payload.rows[0]);
        }
      })
      .catch((reason) => setError(String(reason.message ?? reason)));

  useEffect(() => {
    void load();
  }, []);

  const loadDetail = async (row: Row) => {
    setSelectedRow(row);
    setDetailLoading(true);
    setError(null);
    setPublishGateError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/observance-content?definitionId=" + encodeURIComponent(row.id));
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load details");
      setDetail(payload.detail);
      const enTrans = payload.detail?.translations?.find((t: StoryTranslation) => t.language === "en");
      if (enTrans) setEditingTranslation({ ...enTrans });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
  };

  const counts = useMemo(
    () => ({
      published: rows.filter((row) => row.current?.status === "published").length,
      approved: rows.filter((row) => row.current?.status === "approved").length,
      review: rows.filter((row) => row.current?.status === "needs_review" || row.current?.status === "draft").length,
      missing: rows.filter((row) => !row.current).length,
    }),
    [rows]
  );

  const traditionCounts = useMemo(() => {
    const res: Record<string, number> = { all: rows.length };
    for (const r of rows) {
      res[r.tradition] = (res[r.tradition] || 0) + 1;
    }
    return res;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const list = rows.filter((row) => {
      if (query.trim()) {
        const text = (row.display_name + " " + row.slug).toLowerCase();
        if (!text.includes(query.toLowerCase())) return false;
      }

      if (traditionFilter !== "all" && row.tradition !== traditionFilter) return false;
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;

      const status = row.current?.status ?? "missing";
      if (statusFilter === "published" && status !== "published") return false;
      if (statusFilter === "approved" && status !== "approved") return false;
      if (statusFilter === "review" && status !== "needs_review" && status !== "draft") return false;
      if (statusFilter === "missing" && row.current) return false;

      if (quickFilter === "needs_sources" && row.sourceCount > 0) return false;
      if (quickFilter === "needs_artwork" && row.approvedArtworkCount > 0) return false;
      if (quickFilter === "needs_review" && status !== "draft" && status !== "needs_review") return false;
      if (quickFilter === "ready_to_publish" && status !== "approved") return false;

      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.display_name.localeCompare(b.display_name);
      } else if (sortField === "tradition") {
        cmp = a.tradition.localeCompare(b.tradition);
      } else if (sortField === "status") {
        const order = { published: 4, approved: 3, draft: 2, needs_review: 2, missing: 1 };
        const statusA = (a.current?.status ?? "missing") as keyof typeof order;
        const statusB = (b.current?.status ?? "missing") as keyof typeof order;
        cmp = (order[statusA] || 0) - (order[statusB] || 0);
      } else if (sortField === "sources") {
        cmp = a.sourceCount - b.sourceCount;
      } else if (sortField === "artwork") {
        cmp = a.approvedArtworkCount - b.approvedArtworkCount;
      } else if (sortField === "shares") {
        cmp = a.approvedShareCount - b.approvedShareCount;
      } else if (sortField === "nextDate") {
        const dateA = a.nextOccurrence || "9999-99-99";
        const dateB = b.nextOccurrence || "9999-99-99";
        cmp = dateA.localeCompare(dateB);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [rows, query, traditionFilter, statusFilter, kindFilter, quickFilter, sortField, sortOrder]);

  async function handleAction(body: Record<string, unknown>, successMsg: string) {
    setError(null);
    setPublishGateError(null);
    setActionSuccess(null);
    try {
      const response = await fetch("/api/admin/observance-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (response.status === 409 && payload.error === "Publication gate failed") {
        setPublishGateError(payload);
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Action failed");
      setActionSuccess(successMsg);
      await load();
      if (selectedRow) await loadDetail(selectedRow);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Execution failed");
    }
  }

  async function handleBulkDraft() {
    if (queueSelectedIds.length === 0) return;
    setIsBulkDrafting(true);
    setActionSuccess(null);
    setError(null);

    let draftedCount = 0;
    for (const defId of queueSelectedIds) {
      try {
        const response = await fetch("/api/admin/observance-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate_draft", definitionId: defId }),
        });
        if (response.ok) draftedCount++;
      } catch {
        // continue batch
      }
    }

    setIsBulkDrafting(false);
    setActionSuccess(`Successfully generated ${draftedCount}/${queueSelectedIds.length} drafts!`);
    setQueueSelectedIds([]);
    await load();
  }

  return (
    <main className="min-h-screen bg-[var(--background,#FAF6EF)] px-4 py-8 text-[var(--foreground,#2D241E)] md:px-8 font-sans pb-28">
      {/* Top Header with Back Navigation */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-gray-700 hover:text-gray-900 transition-all mb-2"
          >
            <ArrowLeft size={16} />
            <span>Back to Command Center</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold font-serif">Observance Content Studio</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Editorial Governance
            </span>
          </div>
          <p className="mt-1 text-sm opacity-70">Canonical sources → AI draft generation → editorial review & translation parity → multi-ratio artwork & share copy → published PWA/Native projection.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void load()}
            className="h-10 px-4 rounded-xl border bg-white hover:bg-gray-50 flex items-center gap-1.5 text-xs font-bold shadow-2xs"
            title="Refresh studio state"
          >
            <RefreshCw size={14} />
            <span>Refresh Studio</span>
          </button>
        </div>
      </header>

      {/* 6 Studio Navigation Tabs */}
      <nav className="mb-8 flex items-center gap-2 overflow-x-auto border-b border-black/10 pb-1">
        {[
          { id: "coverage", label: "1. Coverage Matrix", icon: Layers, count: rows.length },
          { id: "queue", label: "2. Generation Queue", icon: Zap, count: rows.filter((r) => r.sourceCount > 0 && !r.current).length },
          { id: "review", label: "3. Review Desk", icon: Eye, count: counts.review },
          { id: "artwork", label: "4. Artwork Canvas", icon: ImageIcon, count: selectedRow?.approvedArtworkCount ?? 0 },
          { id: "published", label: "5. Published & Rollback", icon: History, count: counts.published },
          { id: "share", label: "6. Share Templates", icon: Share2, count: selectedRow?.approvedShareCount ?? 0 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={"flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-b-2 " + (
                isActive
                  ? "border-amber-700 bg-white text-amber-900 shadow-2xs"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-black/5"
              )}
            >
              <Icon size={15} className={isActive ? "text-amber-700" : "text-gray-400"} />
              <span>{tab.label}</span>
              <span className={"px-2 py-0.5 rounded-full text-[10px] " + (isActive ? "bg-amber-100 text-amber-800" : "bg-black/5 text-gray-500")}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </nav>

      {error && <p className="mb-6 rounded-xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-semibold text-rose-800">{error}</p>}
      {actionSuccess && <p className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">{actionSuccess}</p>}

      {/* ─── TAB 1: COVERAGE MATRIX ────────────────────────────────────────── */}
      {activeTab === "coverage" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-600">
                <b className="text-3xl font-serif">{counts.published}</b>
                <CheckCircle size={20} />
              </div>
              <p className="text-xs font-bold opacity-65 mt-1">Live & Published</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PWA & Native offline snapshots</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-blue-600">
                <b className="text-3xl font-serif">{counts.approved}</b>
                <ShieldCheck size={20} />
              </div>
              <p className="text-xs font-bold opacity-65 mt-1">Approved & Ready</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Gated, ready for 1-click publish</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-amber-600">
                <b className="text-3xl font-serif">{counts.review}</b>
                <Sparkles size={20} />
              </div>
              <p className="text-xs font-bold opacity-65 mt-1">Draft / In Review</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Awaiting human review check</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-gray-400">
                <b className="text-3xl font-serif">{counts.missing}</b>
                <XCircle size={20} />
              </div>
              <p className="text-xs font-bold opacity-65 mt-1">Missing Story</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Requires source reference first</p>
            </div>
          </section>

          {/* Filters Area */}
          <div className="space-y-3 bg-white p-5 rounded-2xl border shadow-2xs">
            {/* Row 1: Search & Tradition */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px] mr-1">Tradition:</span>
                {["all", "hindu", "sikh", "buddhist", "jain"].map((trad) => (
                  <button
                    key={trad}
                    onClick={() => setTraditionFilter(trad)}
                    className={"px-3.5 py-1.5 rounded-xl font-bold capitalize transition-all " + (
                      traditionFilter === trad
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {trad} ({traditionCounts[trad] || 0})
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="h-10 min-w-64 rounded-xl border bg-white pl-9 pr-3 text-xs focus:outline-none focus:border-amber-600 shadow-2xs"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search observance name or slug..."
                />
              </div>
            </div>

            {/* Row 2: Status & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px] mr-1">Status:</span>
                {[
                  { key: "all", label: "All Statuses" },
                  { key: "published", label: "Published" },
                  { key: "approved", label: "Approved" },
                  { key: "review", label: "In Review / Draft" },
                  { key: "missing", label: "Missing" },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={"px-3 py-1 rounded-lg font-bold transition-all " + (
                      statusFilter === st.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[11px] mr-1">Quick Action:</span>
                {[
                  { key: "all", label: "All Items" },
                  { key: "needs_sources", label: "⚠️ Needs Sources" },
                  { key: "needs_artwork", label: "🎨 Needs Artwork" },
                  { key: "needs_review", label: "📝 Needs Review" },
                  { key: "ready_to_publish", label: "🚀 Ready to Publish" },
                ].map((qf) => (
                  <button
                    key={qf.key}
                    onClick={() => setQuickFilter(qf.key)}
                    className={"px-3 py-1 rounded-lg font-bold transition-all " + (
                      quickFilter === qf.key
                        ? "bg-amber-800 text-white"
                        : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60"
                    )}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border bg-white shadow-2xs">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="p-4">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-gray-900">
                      <span>Observance</span>
                      {sortField === "name" ? (
                        sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
                      ) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  </th>

                  <th className="p-4">
                    <button onClick={() => toggleSort("tradition")} className="flex items-center gap-1 hover:text-gray-900">
                      <span>Tradition</span>
                      {sortField === "tradition" ? (
                        sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
                      ) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  </th>

                  <th className="p-4">
                    <button onClick={() => toggleSort("nextDate")} className="flex items-center gap-1 hover:text-gray-900">
                      <span>Next Occurrence</span>
                      {sortField === "nextDate" ? (
                        sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
                      ) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  </th>

                  <th className="p-4">
                    <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-gray-900">
                      <span>Story Status</span>
                      {sortField === "status" ? (
                        sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
                      ) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  </th>

                  <th className="p-4">
                    <button onClick={() => toggleSort("sources")} className="flex items-center gap-1 hover:text-gray-900">
                      <span>Sources</span>
                      {sortField === "sources" ? (
                        sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
                      ) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  </th>

                  <th className="p-4">
                    <button onClick={() => toggleSort("artwork")} className="flex items-center gap-1 hover:text-gray-900">
                      <span>Artwork</span>
                      {sortField === "artwork" ? (
                        sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
                      ) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  </th>

                  <th className="p-4">
                    <button onClick={() => toggleSort("shares")} className="flex items-center gap-1 hover:text-gray-900">
                      <span>Share Copy</span>
                      {sortField === "shares" ? (
                        sortOrder === "asc" ? <ArrowUp size={12} className="text-amber-600" /> : <ArrowDown size={12} className="text-amber-600" />
                      ) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  </th>

                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => { void loadDetail(row); setActiveTab("review"); }}
                    className={"border-b border-black/5 transition-colors cursor-pointer hover:bg-amber-500/5 " + (selectedRow?.id === row.id ? "bg-amber-500/10" : "")}
                  >
                    <td className="p-4">
                      <b className="text-gray-900 font-serif text-base">{row.display_name}</b>
                      <p className="text-xs opacity-60 font-mono">{row.slug}</p>
                    </td>
                    <td className="p-4 capitalize font-semibold text-gray-700">{row.tradition}</td>
                    <td className="p-4 text-xs font-mono">
                      <b>{row.nextOccurrence ?? "—"}</b>
                      {row.previousOccurrence && <p className="text-gray-400 text-[11px]">Prev: {row.previousOccurrence}</p>}
                    </td>
                    <td className="p-4">
                      <span className={"px-2.5 py-1 rounded-full text-[11px] font-bold uppercase " + (
                        row.current?.status === "published" ? "bg-emerald-100 text-emerald-800" :
                        row.current?.status === "approved" ? "bg-blue-100 text-blue-800" :
                        row.current?.status === "draft" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
                      )}>
                        {row.current?.status ?? "missing"}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      {row.sourceCount > 0 ? (
                        <span className="text-emerald-700">✓ {row.sourceCount} approved</span>
                      ) : (
                        <span className="text-rose-500">0</span>
                      )}
                    </td>
                    <td className="p-4 font-bold">
                      {row.approvedArtworkCount > 0 ? (
                        <span className="text-emerald-700">✓ {row.approvedArtworkCount} approved</span>
                      ) : (
                        <span className="text-rose-500">0</span>
                      )}
                    </td>
                    <td className="p-4 font-bold">
                      {row.approvedShareCount > 0 ? (
                        <span className="text-emerald-700">✓ {row.approvedShareCount} approved</span>
                      ) : (
                        <span className="text-rose-500">0</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="min-h-8 rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 text-xs font-bold text-amber-800 hover:bg-amber-500/20 shadow-2xs"
                        onClick={() => { void loadDetail(row); setActiveTab("review"); }}
                      >
                        Review Desk
                      </button>
                      <button
                        disabled={row.sourceCount === 0}
                        title={row.sourceCount === 0 ? "Approve a source reference first" : "Generate source-grounded draft"}
                        className="min-h-8 rounded-lg border bg-white hover:bg-gray-50 px-3 text-xs font-medium disabled:opacity-40 shadow-2xs"
                        onClick={() => void handleAction({ action: "generate_draft", definitionId: row.id }, "Draft generated successfully")}
                      >
                        Generate Draft
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: GENERATION QUEUE ────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">AI Drafting Pipeline</span>
              <h2 className="text-xl font-bold font-serif text-gray-900 mt-1">Generation Queue & Sourced Candidate Pipeline</h2>
              <p className="text-xs text-gray-500 mt-1">Select candidate observances with approved sources to generate grounded multilingual drafts.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const eligible = rows.filter((r) => r.sourceCount > 0 && !r.current).map((r) => r.id);
                  setQueueSelectedIds(eligible);
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-gray-50"
              >
                Select All Eligible ({rows.filter((r) => r.sourceCount > 0 && !r.current).length})
              </button>
              <button
                disabled={queueSelectedIds.length === 0 || isBulkDrafting}
                onClick={() => void handleBulkDraft()}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-600/20 disabled:opacity-40"
              >
                <Zap size={14} className={isBulkDrafting ? "animate-spin" : ""} />
                <span>{isBulkDrafting ? "Drafting Candidates..." : `Draft Selected (${queueSelectedIds.length})`}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((row) => {
              const isEligible = row.sourceCount > 0;
              const isSelected = queueSelectedIds.includes(row.id);
              return (
                <div
                  key={row.id}
                  className={"p-5 rounded-2xl border transition-all " + (
                    isSelected ? "bg-amber-500/10 border-amber-500" :
                    isEligible ? "bg-white border-black/10 hover:border-amber-500/40" : "bg-gray-50/70 border-dashed border-gray-200 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <b className="font-serif text-base text-gray-900">{row.display_name}</b>
                      <p className="text-xs font-mono text-gray-500">{row.slug}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/5">{row.tradition}</span>
                        <span className="text-xs text-gray-400 font-mono">Next: {row.nextOccurrence ?? "—"}</span>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      disabled={!isEligible}
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setQueueSelectedIds([...queueSelectedIds, row.id]);
                        else setQueueSelectedIds(queueSelectedIds.filter((id) => id !== row.id));
                      }}
                      className="w-5 h-5 rounded text-amber-600 accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                    <span className={row.sourceCount > 0 ? "text-emerald-700 font-bold" : "text-rose-500 font-medium"}>
                      {row.sourceCount > 0 ? `✓ ${row.sourceCount} approved sources` : "⚠️ 0 sources"}
                    </span>
                    <button
                      disabled={!isEligible}
                      onClick={() => void handleAction({ action: "generate_draft", definitionId: row.id }, "Draft generated")}
                      className="text-amber-800 font-bold hover:underline disabled:opacity-30"
                    >
                      Draft Now →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: REVIEW DESK ────────────────────────────────────────────── */}
      {activeTab === "review" && (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Editorial Desk</span>
              <h2 className="text-2xl font-bold font-serif text-gray-900 mt-0.5">{selectedRow?.display_name ?? "Select an observance"}</h2>
              <p className="text-xs text-gray-500 font-mono">
                Slug: {selectedRow?.slug} • Current Version: v{detail?.story?.version ?? 1} • Status: {detail?.story?.status ?? "Missing"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {detail?.story && (
                <>
                  <button
                    onClick={() => void handleAction({ action: "approve_draft", storyId: detail.story!.id, reviewNotes }, "Story draft and translations approved")}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs"
                  >
                    Approve Draft
                  </button>
                  <button
                    onClick={() => void handleAction({ action: "publish", storyId: detail.story!.id, definitionId: selectedRow!.id }, "Story published live to PWA and Native!")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
                  >
                    Publish Live
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Gate Failure Banner */}
          {publishGateError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-50 p-5 text-xs text-rose-900">
              <p className="font-bold text-sm">⛔ Publication Refused: Hard Gate Checks Failed</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Approved Source: {publishGateError.approvedSource ? "✅ Passed" : "❌ Failed (At least 1 approved source link required)"}</li>
                <li>Card Artwork: {publishGateError.approvedCardArt ? "✅ Passed" : "❌ Failed (Approved card artwork required)"}</li>
                <li>Neutral Share Template: {publishGateError.approvedNeutralShare ? "✅ Passed" : "❌ Failed (Approved neutral share template required)"}</li>
                {publishGateError.missingLanguages && publishGateError.missingLanguages.length > 0 && (
                  <li>Approved Translations: ❌ Missing approved translations for: <b>{publishGateError.missingLanguages.join(", ")}</b></li>
                )}
              </ul>
            </div>
          )}

          {detailLoading ? (
            <p className="py-20 text-center text-sm opacity-60">Loading review desk content...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Multilingual Story Content & Inline Editor */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Multilingual Drafted Story</h3>
                  <div className="flex gap-2">
                    {(["en", "hi", "pa"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setActiveLang(lang);
                          const t = detail?.translations?.find((x) => x.language === lang);
                          if (t) setEditingTranslation({ ...t });
                        }}
                        className={"px-3.5 py-1 rounded-xl text-xs font-bold uppercase transition-all " + (
                          activeLang === lang ? "bg-amber-600 text-white shadow-2xs" : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {editingTranslation ? (
                  <div className="space-y-4 rounded-2xl bg-white p-6 text-sm border shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase bg-black/5 px-2.5 py-1 rounded-lg">Language: {editingTranslation.language}</span>
                      <span className="text-xs font-bold text-amber-800">{editingTranslation.review_status}</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase opacity-60">Teaser Line</label>
                      <textarea
                        className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                        rows={2}
                        value={editingTranslation.teaser}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, teaser: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase opacity-60">Historical Origin & Legend</label>
                      <textarea
                        className="mt-1 w-full rounded-xl border p-2.5 text-sm leading-relaxed"
                        rows={4}
                        value={editingTranslation.origin}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, origin: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase opacity-60">Spiritual Significance</label>
                      <textarea
                        className="mt-1 w-full rounded-xl border p-2.5 text-sm leading-relaxed"
                        rows={4}
                        value={editingTranslation.significance}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, significance: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase opacity-60">Step-by-Step Rituals (One per line)</label>
                      <textarea
                        className="mt-1 w-full rounded-xl border p-2.5 text-sm"
                        rows={4}
                        value={editingTranslation.rituals.join("\n")}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, rituals: e.target.value.split("\n").filter(Boolean) })}
                      />
                    </div>

                    {editingTranslation.verse && (
                      <div className="rounded-2xl border bg-amber-50/80 p-4 space-y-2">
                        <p className="text-xs font-bold uppercase text-amber-800">Sacred Verse Reference</p>
                        <textarea
                          className="w-full rounded-xl border bg-white p-2 font-serif text-base"
                          rows={2}
                          value={editingTranslation.verse.original}
                          onChange={(e) => setEditingTranslation({
                            ...editingTranslation,
                            verse: { ...editingTranslation.verse!, original: e.target.value }
                          })}
                        />
                        <input
                          className="w-full rounded-lg border bg-white p-1.5 text-xs italic"
                          placeholder="Transliteration"
                          value={editingTranslation.verse.transliteration ?? ""}
                          onChange={(e) => setEditingTranslation({
                            ...editingTranslation,
                            verse: { ...editingTranslation.verse!, transliteration: e.target.value }
                          })}
                        />
                        <textarea
                          className="w-full rounded-lg border bg-white p-2 text-xs"
                          rows={2}
                          placeholder="Translation"
                          value={editingTranslation.verse.translation}
                          onChange={(e) => setEditingTranslation({
                            ...editingTranslation,
                            verse: { ...editingTranslation.verse!, translation: e.target.value }
                          })}
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold uppercase opacity-60">Personal Practice Nudge</label>
                      <textarea
                        className="mt-1 w-full rounded-xl border p-2.5 text-sm italic"
                        rows={2}
                        value={editingTranslation.personal_practice}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, personal_practice: e.target.value })}
                      />
                    </div>

                    <button
                      onClick={() => void handleAction({
                        action: "update_translations",
                        storyId: detail!.story!.id,
                        translations: [editingTranslation]
                      }, "Translation draft updated")}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs"
                    >
                      Save Translation Changes
                    </button>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs opacity-50 border border-dashed rounded-2xl bg-white">
                    No drafted story available for this observance yet. Generate a draft to start review.
                  </div>
                )}
              </div>

              {/* Right Column: Source Verification Excerpts */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-black/10 pb-2">
                    <h3 className="font-bold text-sm uppercase tracking-wider">Source Packet (Ground Truth)</h3>
                    <button
                      onClick={() => setShowAddSource(!showAddSource)}
                      className="text-xs font-bold text-amber-700 hover:underline"
                    >
                      {showAddSource ? "Cancel" : "+ Add Source"}
                    </button>
                  </div>

                  {showAddSource && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleAction({ action: "add_source", definitionId: selectedRow!.id, ...sourceForm }, "Source added");
                        setShowAddSource(false);
                      }}
                      className="space-y-2 rounded-2xl border bg-white p-4 text-xs shadow-2xs"
                    >
                      <p className="font-bold">Register Sourced Excerpt</p>
                      <input className="w-full rounded-lg border p-2" placeholder="Title (e.g. Rigveda)" value={sourceForm.title} onChange={(e) => setSourceForm({ ...sourceForm, title: e.target.value })} required />
                      <input className="w-full rounded-lg border p-2" placeholder="Citation (e.g. 1.115.1)" value={sourceForm.citation} onChange={(e) => setSourceForm({ ...sourceForm, citation: e.target.value })} required />
                      <input className="w-full rounded-lg border p-2" placeholder="URL (https://...)" value={sourceForm.url} onChange={(e) => setSourceForm({ ...sourceForm, url: e.target.value })} required />
                      <textarea className="w-full rounded-lg border p-2" rows={3} placeholder="Sourced Excerpt Text" value={sourceForm.excerpt} onChange={(e) => setSourceForm({ ...sourceForm, excerpt: e.target.value })} required />
                      <button type="submit" className="w-full rounded-xl bg-amber-600 p-2 font-bold text-white">Save Source</button>
                    </form>
                  )}

                  <div className="space-y-3">
                    {detail?.allSources?.map((src) => (
                      <div key={src.id} className="rounded-2xl border p-4 text-xs bg-white space-y-2 shadow-2xs">
                        <div className="flex justify-between items-start">
                          <b className="font-serif text-sm">{src.title}</b>
                          {src.approved ? (
                            <span className="text-emerald-600 font-bold">Approved</span>
                          ) : (
                            <button
                              onClick={() => void handleAction({ action: "approve_source", sourceId: src.id }, "Source approved")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white"
                            >
                              Approve Source
                            </button>
                          )}
                        </div>
                        <p className="text-gray-500 font-mono text-[11px]">{src.citation}</p>
                        <p className="bg-gray-50 p-3 rounded-xl text-gray-700 italic border border-black/5 leading-relaxed">{src.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: ARTWORK CANVAS ────────────────────────────────────────── */}
      {activeTab === "artwork" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Visual Asset Governance</span>
              <h2 className="text-2xl font-bold font-serif text-gray-900 mt-0.5">Artwork Multi-Ratio Canvas & Cultural Review</h2>
              <p className="text-xs text-gray-500">Preview artwork across Card (1.91:1), Reader Hero (16:9), and Share (1:1) aspect ratios with focal point coordinators.</p>
            </div>

            <button
              onClick={() => setShowAddArtwork(!showAddArtwork)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs"
            >
              {showAddArtwork ? "Cancel" : "+ Register Artwork Asset"}
            </button>
          </div>

          {showAddArtwork && detail?.story && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleAction({
                  action: "save_artwork",
                  definitionId: selectedRow!.id,
                  storyId: detail.story!.id,
                  version: detail.story!.version,
                  kind: artForm.kind,
                  uri: artForm.uri,
                  width: artForm.width,
                  height: artForm.height,
                  focalX: artForm.focalX,
                  focalY: artForm.focalY,
                  altText: { en: artForm.altTextEn, hi: artForm.altTextHi, pa: artForm.altTextPa },
                }, "Artwork asset registered");
                setShowAddArtwork(false);
              }}
              className="space-y-3 rounded-2xl border bg-white p-6 text-xs shadow-2xs"
            >
              <p className="font-bold text-sm">Register Artwork Asset</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold">Kind</label>
                  <select className="w-full rounded-lg border p-2 mt-1" value={artForm.kind} onChange={(e) => setArtForm({ ...artForm, kind: e.target.value as any })}>
                    <option value="card">Card (1.91:1 - Feed & Cards)</option>
                    <option value="reader_hero">Reader Hero (16:9 - Header Banner)</option>
                    <option value="share">Share Image (1:1 - Square Social)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold">Image URI</label>
                  <input className="w-full rounded-lg border p-2 mt-1" placeholder="https://..." value={artForm.uri} onChange={(e) => setArtForm({ ...artForm, uri: e.target.value })} required />
                </div>
                <div>
                  <label className="font-bold">Focal Point X / Y (0..1)</label>
                  <div className="flex gap-2 mt-1">
                    <input type="number" step="0.05" min="0" max="1" className="w-1/2 rounded-lg border p-2" value={artForm.focalX} onChange={(e) => setArtForm({ ...artForm, focalX: parseFloat(e.target.value) })} />
                    <input type="number" step="0.05" min="0" max="1" className="w-1/2 rounded-lg border p-2" value={artForm.focalY} onChange={(e) => setArtForm({ ...artForm, focalY: parseFloat(e.target.value) })} />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold">Localized Alt Text (EN / HI / PA)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  <input className="rounded-lg border p-2" placeholder="English alt-text" value={artForm.altTextEn} onChange={(e) => setArtForm({ ...artForm, altTextEn: e.target.value })} />
                  <input className="rounded-lg border p-2" placeholder="Hindi alt-text" value={artForm.altTextHi} onChange={(e) => setArtForm({ ...artForm, altTextHi: e.target.value })} />
                  <input className="rounded-lg border p-2" placeholder="Punjabi alt-text" value={artForm.altTextPa} onChange={(e) => setArtForm({ ...artForm, altTextPa: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-600 p-2 font-bold text-white">Save Artwork Asset</button>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {detail?.artwork?.map((art) => (
              <div key={art.id} className="rounded-2xl border bg-white p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-xs text-amber-800">{art.kind} (v{art.version})</span>
                  {art.review_status === "approved" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Approved</span>
                  ) : (
                    <button
                      onClick={() => void handleAction({ action: "approve_artwork", artworkId: art.id }, "Artwork approved")}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs"
                    >
                      Approve Asset
                    </button>
                  )}
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black/5 aspect-[16/9] border">
                  <img src={art.uri} alt="Artwork asset" className="w-full h-full object-cover" />
                  <div
                    className="absolute w-4 h-4 border-2 border-white rounded-full bg-red-500 shadow-md transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${(art.focal_x ?? 0.5) * 100}%`, top: `${(art.focal_y ?? 0.5) * 100}%` }}
                    title="Focal Point Coordinator"
                  />
                </div>

                <div className="space-y-1 text-xs text-gray-500">
                  <p className="font-mono text-[11px] truncate">{art.uri}</p>
                  <p>Dimensions: {art.width} × {art.height} px</p>
                  <p>Focal Point: ({art.focal_x ?? 0.5}, {art.focal_y ?? 0.5})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 5: PUBLISHED & ROLLBACK ──────────────────────────────────── */}
      {activeTab === "published" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Audit & Rollback Desk</span>
              <h2 className="text-2xl font-bold font-serif text-gray-900 mt-0.5">{selectedRow?.display_name ?? "Select an observance"}</h2>
              <p className="text-xs text-gray-500 font-mono">Live Published Version: v{selectedRow?.publishedVersion?.version ?? "None"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Version History Table */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider">Immutable Version History</h3>
              <div className="rounded-2xl border bg-white divide-y overflow-hidden shadow-2xs">
                {(detail?.allVersions || []).map((ver) => (
                  <div key={ver.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <b className="text-sm font-serif">Version {ver.version}</b>
                      <span className={"ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase " + (
                        ver.status === "published" ? "bg-emerald-100 text-emerald-800" :
                        ver.status === "approved" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"
                      )}>
                        {ver.status}
                      </span>
                      <p className="text-gray-400 text-[11px] mt-0.5">{new Date(ver.created_at).toLocaleString()}</p>
                    </div>

                    {ver.status !== "published" && (
                      <button
                        onClick={() => void handleAction({
                          action: "rollback",
                          storyId: ver.id,
                          definitionId: selectedRow!.id
                        }, `Rolled back to version ${ver.version}`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 shadow-2xs"
                      >
                        <RotateCcw size={12} />
                        <span>Rollback to v{ver.version}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* DTO Projection Viewer */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider">Native / PWA Render DTO Projection</h3>
              <pre className="p-4 rounded-2xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96 border shadow-2xs">
                {JSON.stringify({
                  observance: selectedRow,
                  story: detail?.story,
                  translations: detail?.translations,
                  artwork: detail?.artwork,
                  shares: detail?.shares,
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: SHARE TEMPLATES ────────────────────────────────────────── */}
      {activeTab === "share" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-2xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Social Share Copy Studio</span>
              <h2 className="text-2xl font-bold font-serif text-gray-900 mt-0.5">Audience & Contextual Share Copy Studio</h2>
              <p className="text-xs text-gray-500">Curate privacy-safe share copies by audience (Neutral, Family, Sibling, Teacher, Community) and language.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detail?.shares?.map((s) => (
              <div key={s.id} className="rounded-2xl border bg-white p-5 space-y-3 shadow-2xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="uppercase text-amber-800 font-mono">{s.language} • {s.audience}</span>
                    <span className="text-emerald-700">{s.review_status}</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-60">Share Title</label>
                    <input
                      className="w-full rounded-lg border p-2 text-xs font-bold mt-0.5"
                      value={s.title}
                      onChange={(e) => {
                        const updated = detail.shares.map((x) => x.id === s.id ? { ...x, title: e.target.value } : x);
                        setDetail({ ...detail, shares: updated });
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-60">Share Message Body</label>
                    <textarea
                      className="w-full rounded-lg border p-2 text-xs text-gray-700 mt-0.5"
                      rows={3}
                      value={s.message}
                      onChange={(e) => {
                        const updated = detail.shares.map((x) => x.id === s.id ? { ...x, message: e.target.value } : x);
                        setDetail({ ...detail, shares: updated });
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-60">Call to Action (CTA)</label>
                    <input
                      className="w-full rounded-lg border p-2 text-xs text-amber-700 italic mt-0.5"
                      value={s.cta}
                      onChange={(e) => {
                        const updated = detail.shares.map((x) => x.id === s.id ? { ...x, cta: e.target.value } : x);
                        setDetail({ ...detail, shares: updated });
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => void handleAction({
                    action: "update_share_template",
                    templateId: s.id,
                    title: s.title,
                    message: s.message,
                    cta: s.cta,
                  }, "Share template updated")}
                  className="w-full py-2 rounded-xl bg-gray-900 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs"
                >
                  Save Copy Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
