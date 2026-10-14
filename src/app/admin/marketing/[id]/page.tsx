"use client";

import { useCallback, useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, ShieldCheck, Mail, MessageSquare, 
  Send, AlertTriangle, CheckCircle2, XCircle, Square, 
  Edit3, Save, RotateCcw, Sparkles, Instagram, Twitter, Linkedin, Copy, ExternalLink, Share2, Hash
} from "lucide-react";
import type { MarketingChannel } from "@/lib/marketing/types";

interface TraditionOption {
  key: string;
  label_en: string;
  emoji: string;
  subcategories: Array<{ key: string; label_en: string }>;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function readTraditions(value: unknown): TraditionOption[] {
  if (typeof value !== "object" || value === null || !("traditions" in value) || !Array.isArray(value.traditions)) {
    return [];
  }
  return value.traditions.filter((tradition): tradition is TraditionOption => (
    typeof tradition === "object" && tradition !== null
    && "key" in tradition && typeof tradition.key === "string"
    && "label_en" in tradition && typeof tradition.label_en === "string"
    && "emoji" in tradition && typeof tradition.emoji === "string"
    && "subcategories" in tradition && Array.isArray(tradition.subcategories)
    && tradition.subcategories.every((subcategory: unknown) => (
      typeof subcategory === "object" && subcategory !== null
      && "key" in subcategory && typeof subcategory.key === "string"
      && "label_en" in subcategory && typeof subcategory.label_en === "string"
    ))
  ));
}

function VariantProvenancePanel({ variant }: { variant: any }) {
  if (!variant) return null;
  const citations: unknown[] = Array.isArray(variant.source_citations) ? variant.source_citations : [];
  const isApproved = Boolean(variant.approved_manifest_hash);

  return (
    <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-2 text-xs">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Source &amp; Provenance</h3>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isApproved ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
          {isApproved ? "Approved manifest bound" : "Not approved -- editing will not invalidate anything further"}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">rev {variant.content_version ?? 1}</span>
      </div>
      {citations.length > 0 ? (
        <ul className="list-disc list-inside space-y-1 text-[11px] text-[var(--text-primary)]">
          {citations.map((c: any, i: number) => (
            <li key={i}>{typeof c === "string" ? c : JSON.stringify(c)}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-[var(--text-muted)] italic">No source citations attached.</p>
      )}
      {variant.generation_provenance && (
        <p className="text-[10px] text-[var(--text-muted)] font-mono">
          AI-generated: {JSON.stringify(variant.generation_provenance)}
        </p>
      )}
    </div>
  );
}

export default function MarketingCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<any>(null);
  const [dispatchSummary, setDispatchSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MarketingChannel>("email");
  
  // Audience Targeting State
  const [traditionsList, setTraditionsList] = useState<TraditionOption[]>([]);
  const [targetTradition, setTargetTradition] = useState("");
  const [targetSampradaya, setTargetSampradaya] = useState("");
  const [savingAudience, setSavingAudience] = useState(false);
  const [audienceSavedSuccess, setAudienceSavedSuccess] = useState(false);

  // Test Email State
  const [testRecipientChoice, setTestRecipientChoice] = useState("info@shoonaya.com");
  const [customTestEmail, setCustomTestEmail] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState<string | null>(null);
  const [testEmailError, setTestEmailError] = useState<string | null>(null);

  // Variant Edit State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [whatsappBody, setWhatsappBody] = useState("");
  const [instagramBody, setInstagramBody] = useState("");
  const [twitterBody, setTwitterBody] = useState("");
  const [linkedinBody, setLinkedinBody] = useState("");
  const [savingVariant, setSavingVariant] = useState(false);
  const [emailVariant, setEmailVariant] = useState<any>(null);
  const [whatsappVariant, setWhatsappVariant] = useState<any>(null);
  const [instagramVariant, setInstagramVariant] = useState<any>(null);
  const [twitterVariant, setTwitterVariant] = useState<any>(null);
  const [linkedinVariant, setLinkedinVariant] = useState<any>(null);
  const [aiRegenerating, setAiRegenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiRegenPanel, setShowAiRegenPanel] = useState(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedToast(null), 3000);
  };
  
  // Action Modals
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const dispatchAbortRef = useRef<AbortController | null>(null);

  const handleCancelCampaign = async () => {
    if (!window.confirm("Are you sure you want to halt this campaign? Any recipients already sent will be kept in the ledger, but all remaining unsent/pending recipients will be aborted and no further batches can be sent.")) {
      return;
    }
    setCancelling(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? "Failed to cancel campaign");
        return;
      }
      fetchCampaign();
    } catch (err: any) {
      setActionError(err.message ?? "Failed to cancel campaign");
    } finally {
      setCancelling(false);
    }
  };
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [dispatchMeta, setDispatchMeta] = useState<{ campaignStatus?: string; remainingPending?: number | null }>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorKind, setActionErrorKind] = useState<"error" | "conflict">("error");
  const hasUnsavedEmailChanges = !emailVariant
    || emailSubject !== (emailVariant.subject ?? "")
    || emailBody !== (emailVariant.body ?? "");

  // Live-send typed confirmation -- a checkbox alone is not sufficient for an
  // irreversible external send; the admin must type both the fixed phrase and the
  // campaign's own current title, validated server-side (not just here).
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [confirmedTitle, setConfirmedTitle] = useState("");

  // Recipient-count preview, fetched from the same eligibility logic dispatch itself
  // uses -- shown before the admin can confirm a live send.
  const [audiencePreview, setAudiencePreview] = useState<{
    total: number;
    eligible: number;
    suppressedByReason: Record<string, number>;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCampaign(data.campaign);
        setTargetTradition(data.campaign.target_tradition ?? "");
        setTargetSampradaya(data.campaign.target_sampradaya ?? "");
        setDispatchSummary(data.dispatchSummary ?? {});

        const emailVar = (data.campaign.marketing_campaign_variants ?? []).find((v: any) => v.channel === "email");
        setEmailVariant(emailVar ?? null);
        if (emailVar) {
          setEmailSubject(emailVar.subject ?? "");
          setEmailBody(emailVar.body ?? "");
        }

        const waVar = (data.campaign.marketing_campaign_variants ?? []).find((v: any) => v.channel === "whatsapp");
        setWhatsappVariant(waVar ?? null);
        if (waVar) {
          setWhatsappBody(waVar.body ?? "");
        }

        const instaVar = (data.campaign.marketing_campaign_variants ?? []).find((v: any) => v.channel === "instagram");
        setInstagramVariant(instaVar ?? null);
        if (instaVar) {
          setInstagramBody(instaVar.body ?? "");
        }

        const twVar = (data.campaign.marketing_campaign_variants ?? []).find((v: any) => v.channel === "twitter");
        setTwitterVariant(twVar ?? null);
        if (twVar) {
          setTwitterBody(twVar.body ?? "");
        }

        const liVar = (data.campaign.marketing_campaign_variants ?? []).find((v: any) => v.channel === "linkedin");
        setLinkedinVariant(liVar ?? null);
        if (liVar) {
          setLinkedinBody(liVar.body ?? "");
        }

        // Auto-select the first channel that has content if current active tab is empty
        const allVars = data.campaign.marketing_campaign_variants ?? [];
        if (allVars.length > 0) {
          setActiveTab(prev => {
            const currentHasVar = allVars.some((v: any) => v.channel === prev && Boolean(v.body?.trim()));
            if (!currentHasVar) {
              const firstWithContent = allVars.find((v: any) => Boolean(v.body?.trim()));
              if (firstWithContent) return firstWithContent.channel;
            }
            return prev;
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    fetch("/api/traditions")
      .then(res => res.json())
      .then((data: unknown) => setTraditionsList(readTraditions(data)))
      .catch(() => {});
  }, []);

  const handleSaveAudience = async () => {
    setSavingAudience(true);
    setActionError(null);
    setAudienceSavedSuccess(false);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_metadata",
          target_tradition: targetTradition || null,
          target_sampradaya: targetSampradaya || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save audience");
      setAudienceSavedSuccess(true);
      fetchCampaign();
      setTimeout(() => setAudienceSavedSuccess(false), 3000);
    } catch (error: unknown) {
      setActionError(errorMessage(error, "Failed to save audience"));
    } finally {
      setSavingAudience(false);
    }
  };

  const handleSendTestEmail = async () => {
    const finalEmail = testRecipientChoice === "custom" ? customTestEmail.trim() : testRecipientChoice;
    if (!finalEmail) {
      setTestEmailError("Please specify a test recipient email address.");
      return;
    }
    setSendingTestEmail(true);
    setTestEmailSuccess(null);
    setTestEmailError(null);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: finalEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send test email");
      setTestEmailSuccess(`Test email sent to ${finalEmail}! (ID: ${data.messageId ?? "sent"})`);
    } catch (error: unknown) {
      setTestEmailError(errorMessage(error, "Failed to send test email"));
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleAiRegenerateVariant = async (channel: MarketingChannel) => {
    setAiRegenerating(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}/generate-variant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          strategy_prompt: aiPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate copy");

      if (channel === "email" && data.variant) {
        setEmailSubject(data.variant.subject ?? "");
        setEmailBody(data.variant.body ?? "");
      } else if (channel === "whatsapp" && data.variant) {
        setWhatsappBody(data.variant.body ?? "");
      } else if (channel === "instagram" && data.variant) {
        setInstagramBody(data.variant.body ?? "");
      } else if (channel === "twitter" && data.variant) {
        setTwitterBody(data.variant.body ?? "");
      } else if (channel === "linkedin" && data.variant) {
        setLinkedinBody(data.variant.body ?? "");
      }
      fetchCampaign();
      setShowAiRegenPanel(false);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setAiRegenerating(false);
    }
  };

  const handleSaveVariant = async (channel: MarketingChannel) => {
    setSavingVariant(true);
    setActionError(null);

    try {
      let payload: any;
      if (channel === "email") {
        payload = { channel: "email", subject: emailSubject, body: emailBody };
      } else if (channel === "whatsapp") {
        payload = { channel: "whatsapp", body: whatsappBody };
      } else if (channel === "instagram") {
        payload = { channel: "instagram", body: instagramBody };
      } else if (channel === "twitter") {
        payload = { channel: "twitter", body: twitterBody };
      } else if (channel === "linkedin") {
        payload = { channel: "linkedin", body: linkedinBody };
      }

      const res = await fetch(`/api/admin/marketing/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save variant");

      fetchCampaign();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSavingVariant(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_review" }),
      });
      if (res.ok) fetchCampaign();
    } catch {}
  };

  const handleApprove = async () => {
    setActionError(null);
    setActionErrorKind("error");
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error ?? "Failed to approve campaign");
        setActionErrorKind(res.status === 409 ? "conflict" : "error");
        return;
      }
      fetchCampaign();
    } catch (err: any) {
      setActionError(err.message ?? "Failed to approve campaign");
    }
  };

  const fetchAudiencePreview = async (channel: "email" | "whatsapp") => {
    setLoadingPreview(true);
    setAudiencePreview(null);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}/audience-preview?channel=${channel}`);
      const data = await res.json();
      if (res.ok) setAudiencePreview(data.preview);
    } finally {
      setLoadingPreview(false);
    }
  };

  const openDispatchConfirm = () => {
    if (activeTab !== "email" && activeTab !== "whatsapp") return;
    setConfirmationPhrase("");
    setConfirmedTitle("");
    setShowDispatchConfirm(true);
    fetchAudiencePreview(activeTab);
  };

  const handleExecuteDispatch = async () => {
    setDispatching(true);
    setDispatchResult(null);
    setActionError(null);
    setActionErrorKind("error");
    const controller = new AbortController();
    dispatchAbortRef.current = controller;

    try {
      const payload: Record<string, unknown> = { channel: activeTab, dry_run: dryRun };
      if (!dryRun) {
        payload.confirmation_phrase = confirmationPhrase;
        payload.confirmed_title = confirmedTitle;
      }

      const res = await fetch(`/api/admin/marketing/campaigns/${id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? "Dispatch failed");
        setActionErrorKind(res.status === 409 ? "conflict" : "error");
        return;
      }

      setDispatchResult(data.result);
      setDispatchMeta({ campaignStatus: data.campaignStatus, remainingPending: data.remainingPending });
      setShowDispatchConfirm(false);
      fetchCampaign();
    } catch (err: any) {
      setActionError(err.message ?? "Dispatch failed");
    } finally {
      setDispatching(false);
    }
  };

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)]">
                <div className="p-12 text-center text-xs text-[var(--text-muted)]">Loading campaign...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans pb-24">
      
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <Link href="/admin/marketing" className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-amber-700 font-semibold">
            <ArrowLeft size={16} /> Back to Campaigns
          </Link>

          <div className="flex items-center gap-3">
            {campaign.status === "draft" && (
              <button
                onClick={handleSubmitReview}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Submit for Review
              </button>
            )}

            {campaign.status === "in_review" && (
              <button
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2"
              >
                <ShieldCheck size={16} /> Approve Campaign
              </button>
            )}
            {campaign.status === "draft" && (
              <span className="text-[10px] text-[var(--text-muted)] italic">
                A draft cannot be approved directly -- submit it for review first.
              </span>
            )}

            {(campaign.status === "approved" || campaign.status === "dispatching") && (activeTab === "email" || activeTab === "whatsapp") && (
              <div className="flex items-center gap-2">
                {campaign.status === "dispatching" && (
                  <button
                    onClick={handleCancelCampaign}
                    disabled={cancelling}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                    title="Halt campaign and stop remaining batches from dispatching"
                  >
                    <Square size={13} className="fill-current" />
                    <span>{cancelling ? "Halting..." : "Halt / Stop Remaining Batches"}</span>
                  </button>
                )}
                <button
                  onClick={openDispatchConfirm}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2"
                >
                  <Send size={16} />
                  {campaign.status === "dispatching" ? `Continue Sending ${activeTab.toUpperCase()}` : `Dispatch ${activeTab.toUpperCase()}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Header Summary */}
        <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{campaign.campaign_key}</span>
              <h1 className="text-xl font-bold font-serif">{campaign.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {campaign.target_tradition ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20">
                    🎯 Scoped Audience: {campaign.target_tradition.toUpperCase()}{campaign.target_sampradaya ? ` • ${campaign.target_sampradaya}` : ""}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    🎯 Scoped Audience: All Traditions (Universal)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase border bg-slate-100 text-slate-800">
                {campaign.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {campaign.source_type === "published_observance" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-600" />
                <span>Grounded in calendar occurrence: <strong>{campaign.source_occurrence_id}</strong></span>
              </div>
              {/* source_type alone does not mean verified -- only source_verified_at, set
                  exclusively by the server-side re-validation step, does. */}
              {campaign.source_verified_at ? (
                <p className="text-[10px] text-emerald-800 pl-6">
                  ✓ Server-verified against the canonical occurrence filter at{" "}
                  {new Date(campaign.source_verified_at).toLocaleString()}
                </p>
              ) : (
                <p className="text-[10px] text-rose-800 pl-6 font-bold">
                  ⚠ Not yet server-verified -- this occurrence has not passed the withheld/disputed/publication check
                </p>
              )}
            </div>
          )}

          {campaign.approved_by && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>
                Approved by <strong>{campaign.approved_by}</strong> at{" "}
                {campaign.approved_at ? new Date(campaign.approved_at).toLocaleString() : "unknown time"}
              </span>
            </div>
          )}

          {actionError && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                actionErrorKind === "conflict"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-900"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-800"
              }`}
            >
              <XCircle size={16} className={actionErrorKind === "conflict" ? "text-amber-600" : "text-rose-600"} />
              <span>
                {actionErrorKind === "conflict"
                  ? "Someone else already changed this campaign's state -- "
                  : ""}
                {actionError}
              </span>
            </div>
          )}
        </div>

        {/* Audience Targeting & Test Dispatch Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Audience Targeting Box */}
          <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>🎯 Audience Targeting</span>
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Target all subscribers or scope to a specific spiritual tradition
                </p>
              </div>
              {audienceSavedSuccess && (
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Tradition
                </label>
                <select
                  value={targetTradition}
                  onChange={e => {
                    setTargetTradition(e.target.value);
                    setTargetSampradaya("");
                  }}
                  disabled={campaign.status === "dispatching" || campaign.status === "completed" || campaign.status === "cancelled"}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs font-semibold outline-none focus:border-amber-600 disabled:opacity-60"
                >
                  <option value="">All Traditions (Universal)</option>
                  {traditionsList.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.emoji} {t.label_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Focus / Subcategory
                </label>
                <select
                  value={targetSampradaya}
                  onChange={e => setTargetSampradaya(e.target.value)}
                  disabled={!targetTradition || campaign.status === "dispatching" || campaign.status === "completed" || campaign.status === "cancelled"}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs font-semibold outline-none focus:border-amber-600 disabled:opacity-60"
                >
                  <option value="">
                    {targetTradition ? "All in this tradition" : "-- Select tradition first --"}
                  </option>
                  {targetTradition &&
                    (traditionsList.find(t => t.key === targetTradition)?.subcategories || []).map(sub => (
                      <option key={sub.key} value={sub.key}>
                        {sub.label_en}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {(campaign.status === "draft" || campaign.status === "in_review") && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAudience}
                  disabled={savingAudience}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {savingAudience ? "Saving..." : "Save Audience"}
                </button>
              </div>
            )}
          </div>

          {/* Test Email Dispatcher Box */}
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Mail size={14} className="text-amber-600" />
                  <span>Send Test Email (Inbox Preview)</span>
                </h3>
                <p className="text-[11px] text-amber-700/80">
                  Sends the saved email copy to verify formatting before releasing to subscribers
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Test Recipient
                </label>
                <select
                  value={testRecipientChoice}
                  onChange={e => setTestRecipientChoice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-amber-500/30 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-amber-600"
                >
                  <option value="info@shoonaya.com">info@shoonaya.com</option>
                  <option value="custom">Enter custom test email...</option>
                </select>
              </div>

              {testRecipientChoice === "custom" && (
                <div>
                  <input
                    type="email"
                    placeholder="e.g. test@example.com"
                    value={customTestEmail}
                    onChange={e => setCustomTestEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-500/30 bg-white text-xs outline-none focus:border-amber-600"
                  />
                </div>
              )}

              {testEmailSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  ✓ {testEmailSuccess}
                </div>
              )}

              {testEmailError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  ⚠ {testEmailError}
                </div>
              )}

              {hasUnsavedEmailChanges && (
                <div className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-primary)] text-xs font-medium">
                  Save the email copy before sending a preview so the inbox matches this editor.
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-amber-800/70 italic">
                  Does not affect dispatch counts or subscriber records.
                </span>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail || hasUnsavedEmailChanges}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send size={13} />
                  {sendingTestEmail ? "Sending Preview..." : hasUnsavedEmailChanges ? "Save Email First" : "Send Test Email"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Last Dispatch Result -- previously computed but never rendered. */}
        {dispatchResult && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 ${
              dispatchResult.dryRun ? "bg-slate-50 border-slate-300" : "bg-emerald-50 border-emerald-300"
            }`}
          >
            <p className="font-bold uppercase tracking-wider text-[10px]">
              {dispatchResult.dryRun ? "DRY RUN — no messages sent, no delivery state changed" : "Live Dispatch Result"}
            </p>
            <div className="flex gap-6 font-mono">
              <span>total {dispatchResult.total}</span>
              <span className="text-emerald-700">sent {dispatchResult.sent}</span>
              <span className="text-amber-700">suppressed {dispatchResult.suppressed}</span>
              <span className="text-rose-700">failed {dispatchResult.failed}</span>
            </div>
            {typeof dispatchMeta.remainingPending === "number" && (
              <p className="text-[10px] text-slate-600">
                {dispatchMeta.remainingPending > 0
                  ? `${dispatchMeta.remainingPending} recipients still pending -- click "Continue Sending" to drain the next batch.`
                  : "No recipients remaining for this channel."}
              </p>
            )}
          </div>
        )}

        {/* Delivery Ledger: pending (not yet claimed), claimed (in flight -- becomes
            reclaimable/uncertain if a worker dies mid-send without resolving it),
            sent (terminal, immutable), failed (retryable), suppressed (consent
            declined, not a delivery failure). */}
        {Object.keys(dispatchSummary).length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Delivery Ledger</h3>
            <div className="grid grid-cols-5 gap-3 text-center">
              {(["pending", "claimed", "sent", "failed", "suppressed"] as const).map(status => (
                <div key={status} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
                  <p className="text-lg font-bold font-mono">{String(dispatchSummary[status] ?? 0)}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    {status === "claimed" ? "claimed (uncertain if stuck)" : status === "failed" ? "failed (retryable)" : status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channel Variants Deck */}
        <div className="space-y-4">
          {/* Toast Notification */}
          {copiedToast && (
            <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
              ✓ {copiedToast}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("email")}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "email" ? "border-amber-600 text-amber-700" : "border-transparent text-[var(--text-muted)] hover:text-slate-700"
              }`}
            >
              <Mail size={15} />
              <span>Email</span>
              <span className={`w-2 h-2 rounded-full ${emailVariant ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${emailVariant ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                {emailVariant ? "Drafted" : "Empty"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "whatsapp" ? "border-amber-600 text-amber-700" : "border-transparent text-[var(--text-muted)] hover:text-slate-700"
              }`}
            >
              <MessageSquare size={15} />
              <span>WhatsApp</span>
              <span className={`w-2 h-2 rounded-full ${whatsappVariant ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${whatsappVariant ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                {whatsappVariant ? "Drafted" : "Empty"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("instagram")}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "instagram" ? "border-pink-600 text-pink-700" : "border-transparent text-[var(--text-muted)] hover:text-slate-700"
              }`}
            >
              <Instagram size={15} />
              <span>Instagram</span>
              <span className={`w-2 h-2 rounded-full ${instagramVariant ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${instagramVariant ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                {instagramVariant ? "Drafted" : "Empty"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("twitter")}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "twitter" ? "border-sky-600 text-sky-700" : "border-transparent text-[var(--text-muted)] hover:text-slate-700"
              }`}
            >
              <Twitter size={15} />
              <span>Twitter / X</span>
              <span className={`w-2 h-2 rounded-full ${twitterVariant ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${twitterVariant ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                {twitterVariant ? "Drafted" : "Empty"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("linkedin")}
              className={`px-3.5 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                activeTab === "linkedin" ? "border-blue-700 text-blue-800" : "border-transparent text-[var(--text-muted)] hover:text-slate-700"
              }`}
            >
              <Linkedin size={15} />
              <span>LinkedIn</span>
              <span className={`w-2 h-2 rounded-full ${linkedinVariant ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${linkedinVariant ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                {linkedinVariant ? "Drafted" : "Empty"}
              </span>
            </button>
          </div>

          {/* AI Regeneration Drawer (Global for any selected channel) */}
          {showAiRegenPanel && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Creative Angle &amp; Custom Prompt for {activeTab.toUpperCase()}
              </label>
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder={`e.g. Focus on ${activeTab} audience: diaspora belonging, quiet reflection, sacred stillness, daily sadhana...`}
                className="w-full p-2.5 rounded-lg border border-amber-500/30 text-xs font-medium outline-none focus:border-amber-600 bg-white"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleAiRegenerateVariant(activeTab)}
                  disabled={aiRegenerating}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles size={13} className={aiRegenerating ? "animate-spin" : ""} />
                  {aiRegenerating ? `Drafting ${activeTab}...` : `Generate ${activeTab} Copy`}
                </button>
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {activeTab === "email" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Draft Content</h3>
                  {(campaign.status === "draft" || campaign.status === "in_review") && (
                    <button
                      type="button"
                      onClick={() => setShowAiRegenPanel(!showAiRegenPanel)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} /> {showAiRegenPanel ? "Close AI Writer" : "✨ AI Writer"}
                    </button>
                  )}
                </div>

                {!emailVariant && !emailBody && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                    <p className="text-xs text-amber-800">No email draft generated yet.</p>
                    <button
                      onClick={() => handleAiRegenerateVariant("email")}
                      disabled={aiRegenerating}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                    >
                      Generate Email
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl border border-[var(--border-subtle)] text-xs font-semibold outline-none focus:border-amber-600"
                    placeholder="Weekly Dharma • Sacred Contemplation"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Body (Markdown/Plain)</label>
                  <textarea
                    rows={12}
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl border border-[var(--border-subtle)] text-xs font-medium outline-none focus:border-amber-600 font-mono"
                    placeholder="Write email body text..."
                  />
                </div>
                <button
                  onClick={() => handleSaveVariant("email")}
                  disabled={savingVariant}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-2"
                >
                  <Save size={14} /> {savingVariant ? "Saving..." : "Save Email Draft"}
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">HTML Rendered Preview</h3>
                  {emailBody && (
                    <button
                      onClick={() => copyToClipboard(`${emailSubject}\n\n${emailBody}`, "Email Copy")}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  )}
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-slate-800 space-y-4 shadow-sm">
                  <div className="text-center border-b pb-4">
                    <p className="font-serif font-bold text-lg text-[#1A140E]">Shoonaya</p>
                    <p className="text-[9px] uppercase tracking-widest text-[#854F0B]">Find your infinite.</p>
                  </div>
                  <h4 className="font-bold text-sm text-center">{emailSubject || "Weekly Subject Line"}</h4>
                  <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {emailBody || "Email preview content will render here..."}
                  </div>
                </div>
                <VariantProvenancePanel variant={emailVariant} />
              </div>
            </div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === "whatsapp" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">WhatsApp Broadcast Copy</h3>
                  {(campaign.status === "draft" || campaign.status === "in_review") && (
                    <button
                      type="button"
                      onClick={() => setShowAiRegenPanel(!showAiRegenPanel)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} /> {showAiRegenPanel ? "Close AI Writer" : "✨ AI Writer"}
                    </button>
                  )}
                </div>

                {!whatsappVariant && !whatsappBody && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                    <p className="text-xs text-amber-800">No WhatsApp broadcast generated yet.</p>
                    <button
                      onClick={() => handleAiRegenerateVariant("whatsapp")}
                      disabled={aiRegenerating}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                    >
                      Generate WhatsApp
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Message Body</label>
                  <textarea
                    rows={12}
                    value={whatsappBody}
                    onChange={e => setWhatsappBody(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl border border-[var(--border-subtle)] text-xs font-medium outline-none focus:border-amber-600 font-mono"
                    placeholder="*Shoonaya Daily Dharma* 🪔\n\nPeace and stillness..."
                  />
                </div>
                <button
                  onClick={() => handleSaveVariant("whatsapp")}
                  disabled={savingVariant}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-2"
                >
                  <Save size={14} /> {savingVariant ? "Saving..." : "Save WhatsApp Draft"}
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">WhatsApp Chat Bubble Preview</h3>
                  {whatsappBody && (
                    <button
                      onClick={() => copyToClipboard(whatsappBody, "WhatsApp Message")}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-slate-300">
                  <div className="p-4 rounded-2xl bg-white shadow-sm max-w-sm space-y-2 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {whatsappBody || "*Shoonaya Weekly Reflection* 🪔\n\nPreview text..."}
                  </div>
                </div>
                <VariantProvenancePanel variant={whatsappVariant} />
              </div>
            </div>
          )}

          {/* INSTAGRAM TAB */}
          {activeTab === "instagram" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Instagram Post Caption</h3>
                  {(campaign.status === "draft" || campaign.status === "in_review") && (
                    <button
                      type="button"
                      onClick={() => setShowAiRegenPanel(!showAiRegenPanel)}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} /> {showAiRegenPanel ? "Close AI Writer" : "✨ AI Writer"}
                    </button>
                  )}
                </div>

                {!instagramVariant && !instagramBody && (
                  <div className="p-3.5 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-between gap-3">
                    <p className="text-xs text-pink-800">No Instagram caption generated yet.</p>
                    <button
                      onClick={() => handleAiRegenerateVariant("instagram")}
                      disabled={aiRegenerating}
                      className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold"
                    >
                      Generate Instagram
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Caption &amp; Hashtags</label>
                  <textarea
                    rows={12}
                    value={instagramBody}
                    onChange={e => setInstagramBody(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl border border-[var(--border-subtle)] text-xs font-medium outline-none focus:border-pink-600 font-mono"
                    placeholder="Evocative hook line...\n\nSacred reflection...\n\n#Shoonaya #Dharma"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveVariant("instagram")}
                    disabled={savingVariant}
                    className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-pink-700"
                  >
                    <Save size={14} /> {savingVariant ? "Saving..." : "Save Instagram Draft"}
                  </button>
                  <Link
                    href="/admin/marketing/social/queue"
                    className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-bold flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} /> Open Social Studio
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Instagram Post Preview</h3>
                  {instagramBody && (
                    <button
                      onClick={() => copyToClipboard(instagramBody, "Instagram Caption")}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Copy Caption
                    </button>
                  )}
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 max-w-sm mx-auto">
                  <div className="flex items-center gap-2.5 border-b pb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-[10px] text-amber-700">
                        शू
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1">shoonaya.app <span className="text-blue-500 text-[10px]">✓</span></p>
                      <p className="text-[10px] text-slate-500">Find your infinite</p>
                    </div>
                  </div>
                  <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center p-6 text-center border border-amber-200/50">
                    <p className="text-2xl font-serif text-amber-900 mb-2">ॐ</p>
                    <p className="text-sm font-serif font-bold text-slate-800 leading-snug">{campaign.title}</p>
                    <p className="text-[9px] uppercase tracking-widest text-amber-800/80 mt-2">Shoonaya Sanctuary</p>
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {instagramBody || "Instagram caption preview will render here..."}
                  </div>
                </div>
                <VariantProvenancePanel variant={instagramVariant} />
              </div>
            </div>
          )}

          {/* TWITTER / X TAB */}
          {activeTab === "twitter" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Twitter / X Post (280 char limit)</h3>
                  {(campaign.status === "draft" || campaign.status === "in_review") && (
                    <button
                      type="button"
                      onClick={() => setShowAiRegenPanel(!showAiRegenPanel)}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} /> {showAiRegenPanel ? "Close AI Writer" : "✨ AI Writer"}
                    </button>
                  )}
                </div>

                {!twitterVariant && !twitterBody && (
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-3">
                    <p className="text-xs text-sky-800">No Twitter / X post generated yet.</p>
                    <button
                      onClick={() => handleAiRegenerateVariant("twitter")}
                      disabled={aiRegenerating}
                      className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold"
                    >
                      Generate Tweet
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    <span>Tweet Text</span>
                    <span className={twitterBody.length > 280 ? "text-rose-600 font-bold" : twitterBody.length > 250 ? "text-amber-600" : "text-emerald-600"}>
                      {twitterBody.length} / 280 characters
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={twitterBody}
                    onChange={e => setTwitterBody(e.target.value)}
                    className={`w-full mt-1 p-3 rounded-xl border text-xs font-medium outline-none font-mono ${
                      twitterBody.length > 280 ? "border-rose-500 focus:border-rose-600" : "border-[var(--border-subtle)] focus:border-sky-600"
                    }`}
                    placeholder="Short sacred insight or shloka takeaway... #Shoonaya"
                  />
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        twitterBody.length > 280 ? "bg-rose-500" : twitterBody.length > 250 ? "bg-amber-500" : "bg-sky-500"
                      }`}
                      style={{ width: `${Math.min(100, (twitterBody.length / 280) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveVariant("twitter")}
                    disabled={savingVariant}
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-sky-700"
                  >
                    <Save size={14} /> {savingVariant ? "Saving..." : "Save Tweet Draft"}
                  </button>
                  {twitterBody && (
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterBody)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                    >
                      <Twitter size={13} /> Post on X ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Twitter / X Card Preview</h3>
                  {twitterBody && (
                    <button
                      onClick={() => copyToClipboard(twitterBody, "Tweet Text")}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Copy Tweet
                    </button>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 max-w-sm mx-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                      शू
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        Shoonaya <span className="text-sky-500 text-[11px]">✓</span>
                      </p>
                      <p className="text-[10px] text-slate-500">@ShoonayaApp</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {twitterBody || "Tweet preview content will appear here..."}
                  </div>
                  <div className="border-t pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Shoonaya Sanctuary</span>
                    <span className="text-sky-600 font-semibold">shoonaya.com</span>
                  </div>
                </div>
                <VariantProvenancePanel variant={twitterVariant} />
              </div>
            </div>
          )}

          {/* LINKEDIN TAB */}
          {activeTab === "linkedin" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">LinkedIn Reflection</h3>
                  {(campaign.status === "draft" || campaign.status === "in_review") && (
                    <button
                      type="button"
                      onClick={() => setShowAiRegenPanel(!showAiRegenPanel)}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} /> {showAiRegenPanel ? "Close AI Writer" : "✨ AI Writer"}
                    </button>
                  )}
                </div>

                {!linkedinVariant && !linkedinBody && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
                    <p className="text-xs text-blue-800">No LinkedIn reflection generated yet.</p>
                    <button
                      onClick={() => handleAiRegenerateVariant("linkedin")}
                      disabled={aiRegenerating}
                      className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold"
                    >
                      Generate LinkedIn
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Reflection Body</label>
                  <textarea
                    rows={12}
                    value={linkedinBody}
                    onChange={e => setLinkedinBody(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl border border-[var(--border-subtle)] text-xs font-medium outline-none focus:border-blue-700 font-mono"
                    placeholder="Thought-provoking opening on equanimity and dharma...\n\n#MindfulLeadership #Shoonaya"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveVariant("linkedin")}
                    disabled={savingVariant}
                    className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold flex items-center gap-2 hover:bg-blue-800"
                  >
                    <Save size={14} /> {savingVariant ? "Saving..." : "Save LinkedIn Draft"}
                  </button>
                  {linkedinBody && (
                    <button
                      onClick={() => copyToClipboard(linkedinBody, "LinkedIn Post")}
                      className="px-4 py-2 rounded-xl border border-blue-700 text-blue-700 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50"
                    >
                      <Copy size={13} /> Copy for LinkedIn
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">LinkedIn Post Preview</h3>
                  {linkedinBody && (
                    <button
                      onClick={() => copyToClipboard(linkedinBody, "LinkedIn Post")}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-[11px] font-bold flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Copy Post
                    </button>
                  )}
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 max-w-sm mx-auto">
                  <div className="flex items-center gap-2.5 border-b pb-2">
                    <div className="w-9 h-9 rounded-md bg-[#0077B5] text-white flex items-center justify-center font-bold text-sm">
                      in
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Shoonaya</p>
                      <p className="text-[10px] text-slate-500">Spiritual Tech &amp; Sanctuary • 1,200+ followers</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {linkedinBody || "LinkedIn post preview will appear here..."}
                  </div>
                  <div className="border-t pt-2 text-[10px] text-slate-400">
                    <span>Shoonaya • Find your infinite</span>
                  </div>
                </div>
                <VariantProvenancePanel variant={linkedinVariant} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dispatch Confirmation Modal */}
      {showDispatchConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-black/10 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertTriangle size={22} />
              <h3 className="text-base font-bold">Confirm Campaign Dispatch</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are preparing to dispatch the <strong>{activeTab.toUpperCase()}</strong> variant of <strong>{campaign.title}</strong>. Consent will be re-evaluated live for every recipient immediately before send.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recipient Preview</p>
              {loadingPreview ? (
                <p className="text-slate-500">Calculating eligible audience...</p>
              ) : audiencePreview ? (
                <>
                  <p>
                    <strong>{audiencePreview.eligible}</strong> eligible of {audiencePreview.total} candidates checked
                  </p>
                  {Object.entries(audiencePreview.suppressedByReason).length > 0 && (
                    <ul className="text-[10px] text-slate-500 list-disc list-inside">
                      {Object.entries(audiencePreview.suppressedByReason).map(([reason, count]) => (
                        <li key={reason}>{String(count)} suppressed: {reason}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="text-slate-500">Preview unavailable.</p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
              <label className="flex items-center gap-2 text-amber-900 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={e => setDryRun(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Simulate Dispatch Only (Dry Run)</span>
              </label>
              <p className="text-[10px] text-amber-800">
                {dryRun ? "Dry-run verifies consent and logs without contacting live delivery providers or writing any delivery state." : "⚠️ REAL DISPATCH: Will send actual emails/WhatsApp messages to opted-in users. This cannot be undone."}
              </p>
            </div>

            {!dryRun && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-3">
                <p className="text-rose-900 font-bold">Type to confirm this irreversible live send:</p>
                <div>
                  <label className="text-[10px] text-rose-800">Type <code className="font-mono">LIVE SEND</code></label>
                  <input
                    type="text"
                    value={confirmationPhrase}
                    onChange={e => setConfirmationPhrase(e.target.value)}
                    className="w-full mt-1 p-2 rounded-lg border border-rose-300 text-xs font-mono outline-none focus:border-rose-600"
                    placeholder="LIVE SEND"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-rose-800">Type the campaign&apos;s exact title: <strong>{campaign.title}</strong></label>
                  <input
                    type="text"
                    value={confirmedTitle}
                    onChange={e => setConfirmedTitle(e.target.value)}
                    className="w-full mt-1 p-2 rounded-lg border border-rose-300 text-xs outline-none focus:border-rose-600"
                    placeholder={campaign.title}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (dispatching) {
                    dispatchAbortRef.current?.abort();
                  }
                  setShowDispatchConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 text-slate-700"
              >
                {dispatching ? "Abort Send" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleExecuteDispatch}
                disabled={
                  dispatching || (!dryRun && (confirmationPhrase !== "LIVE SEND" || confirmedTitle !== campaign.title))
                }
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {dispatching ? "Dispatching..." : dryRun ? "Run Dry-Run" : "Confirm Live Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
