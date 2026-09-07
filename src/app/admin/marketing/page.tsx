"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Mail, MessageSquare, Plus, ShieldCheck, 
  Calendar, CheckCircle2, Clock, AlertTriangle, 
  ChevronRight, Filter, RefreshCw
} from "lucide-react";

export default function MarketingCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Modal State
  const [title, setTitle] = useState("");
  const [campaignKey, setCampaignKey] = useState("");
  const [campaignType, setCampaignType] = useState<"newsletter" | "festival_reminder" | "announcement">("newsletter");
  const [sourceType, setSourceType] = useState<"manual" | "published_observance">("manual");
  const [observances, setObservances] = useState<any[]>([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAiDraft, setUseAiDraft] = useState(false);
  const [aiChannels, setAiChannels] = useState<{ email: boolean; whatsapp: boolean }>({ email: true, whatsapp: false });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const url = filterStatus === "all" ? "/api/admin/marketing/campaigns" : `/api/admin/marketing/campaigns?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns ?? []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [filterStatus]);

  useEffect(() => {
    if (showCreateModal && sourceType === "published_observance") {
      fetch("/api/admin/marketing/sources/observances")
        .then(res => res.json())
        .then(data => setObservances(data.observances ?? []))
        .catch(() => {});
    }
  }, [showCreateModal, sourceType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !campaignKey.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const endpoint = useAiDraft ? "/api/admin/marketing/generate" : "/api/admin/marketing/campaigns";
      const channels = Object.entries(aiChannels)
        .filter(([, enabled]) => enabled)
        .map(([channel]) => channel);

      if (useAiDraft && channels.length === 0) {
        throw new Error("Select at least one channel for the AI to draft");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          campaign_key: campaignKey.trim(),
          campaign_type: campaignType,
          source_type: sourceType,
          source_occurrence_id: sourceType === "published_observance" ? selectedOccurrenceId : null,
          ...(useAiDraft ? { channels } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Creation failed");

      setShowCreateModal(false);
      setTitle("");
      setCampaignKey("");
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header Deck */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Mail size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif tracking-tight">Marketing Campaign Hub</h1>
                <p className="text-xs text-[var(--text-muted)]">Human-approved, consent-verified communications</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchCampaigns()}
              className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} /> New Campaign Draft
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {["all", "draft", "in_review", "approved", "dispatching", "completed", "cancelled"].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                filterStatus === st
                  ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] border border-transparent"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Campaign List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)]">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)]">
            <p className="text-sm font-semibold text-[var(--text-secondary)]">No marketing campaigns found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Create a new draft to prepare email and WhatsApp outreach.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {campaigns.map(c => {
              const statusColors: Record<string, string> = {
                draft: "bg-slate-500/10 text-slate-700 border-slate-500/20",
                in_review: "bg-blue-500/10 text-blue-700 border-blue-500/20",
                approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
                dispatching: "bg-amber-500/10 text-amber-700 border-amber-500/20",
                completed: "bg-purple-500/10 text-purple-700 border-purple-500/20",
                cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/20",
              };

              return (
                <Link
                  key={c.id}
                  href={`/admin/marketing/${c.id}`}
                  className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-amber-500/40 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${statusColors[c.status] ?? ""}`}>
                        {c.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">{c.campaign_key}</span>
                      <span className="text-xs text-[var(--text-muted)]">• {c.campaign_type.replace("_", " ")}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-amber-700 transition-colors">
                      {c.title}
                    </h3>
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
                      <span>Source: {c.source_type}</span>
                      <span>Created by: {c.created_by}</span>
                      {c.approved_by && <span>Approved by: {c.approved_by}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[var(--text-muted)] group-hover:text-amber-700 transition-colors">
                    <span className="text-xs font-semibold">Inspect</span>
                    <ChevronRight size={18} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-black/10">
            <h3 className="text-base font-bold text-slate-800">Create New Campaign Draft</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campaign Key (Identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. weekly-2026-w38 or diwali-reminder-2026"
                  value={campaignKey}
                  onChange={e => setCampaignKey(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Dharma: Awakening & Inner Stillness"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</label>
                  <select
                    value={campaignType}
                    onChange={e => setCampaignType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  >
                    <option value="newsletter">Weekly Newsletter</option>
                    <option value="festival_reminder">Festival Reminder</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Source Grounding</label>
                  <select
                    value={sourceType}
                    onChange={e => setSourceType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  >
                    <option value="manual">Manual / Editorial</option>
                    <option value="published_observance">Published Observance</option>
                  </select>
                </div>
              </div>

              {sourceType === "published_observance" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Verified Observance (Next 30 Days)</label>
                  <select
                    value={selectedOccurrenceId}
                    onChange={e => setSelectedOccurrenceId(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  >
                    <option value="">-- Choose verified occurrence --</option>
                    {observances.map(obs => (
                      <option key={obs.occurrence_id} value={obs.occurrence_id}>
                        {obs.date} • {obs.display_name} ({obs.tradition})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAiDraft}
                    onChange={e => setUseAiDraft(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  Draft initial content with AI
                </label>
                <p className="text-[10px] text-slate-500 pl-6">
                  Creates the campaign and drafts variant copy for the channels below. The campaign stays in
                  draft status -- a human still reviews, approves, and dispatches. Generation fails and creates
                  nothing if it can&apos;t attach a source citation for a published-observance campaign.
                </p>
                {useAiDraft && (
                  <div className="flex items-center gap-4 pl-6">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiChannels.email}
                        onChange={e => setAiChannels(prev => ({ ...prev, email: e.target.checked }))}
                        className="rounded text-amber-600"
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiChannels.whatsapp}
                        onChange={e => setAiChannels(prev => ({ ...prev, whatsapp: e.target.checked }))}
                        className="rounded text-amber-600"
                      />
                      WhatsApp
                    </label>
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-rose-600">{error}</p>}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  {creating ? (useAiDraft ? "Generating..." : "Creating Draft...") : useAiDraft ? "Generate Draft" : "Create Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
