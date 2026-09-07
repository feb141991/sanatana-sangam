"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, ShieldCheck, Mail, MessageSquare, 
  Send, AlertTriangle, CheckCircle2, XCircle, 
  Edit3, Save, RotateCcw
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  
  // Variant Edit State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [whatsappBody, setWhatsappBody] = useState("");
  const [savingVariant, setSavingVariant] = useState(false);
  const [emailVariant, setEmailVariant] = useState<any>(null);
  const [whatsappVariant, setWhatsappVariant] = useState<any>(null);
  
  // Action Modals
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [dispatchMeta, setDispatchMeta] = useState<{ campaignStatus?: string; remainingPending?: number | null }>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorKind, setActionErrorKind] = useState<"error" | "conflict">("error");

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

  const fetchCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${id}`);
      const data = await res.json();
      if (res.ok) {
        setCampaign(data.campaign);
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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleSaveVariant = async (channel: "email" | "whatsapp") => {
    setSavingVariant(true);
    setActionError(null);

    try {
      const payload = channel === "email"
        ? { channel: "email", subject: emailSubject, body: emailBody }
        : { channel: "whatsapp", body: whatsappBody };

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

            {(campaign.status === "approved" || campaign.status === "dispatching") && (
              <button
                onClick={openDispatchConfirm}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2"
              >
                <Send size={16} />
                {campaign.status === "dispatching" ? `Continue Sending ${activeTab.toUpperCase()}` : `Dispatch ${activeTab.toUpperCase()}`}
              </button>
            )}
          </div>
        </div>

        {/* Campaign Header Summary */}
        <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{campaign.campaign_key}</span>
              <h1 className="text-xl font-bold font-serif">{campaign.title}</h1>
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
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveTab("email")}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "email" ? "border-amber-600 text-amber-700" : "border-transparent text-[var(--text-muted)]"
              }`}
            >
              <Mail size={16} /> Email Variant
            </button>
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "whatsapp" ? "border-amber-600 text-amber-700" : "border-transparent text-[var(--text-muted)]"
              }`}
            >
              <MessageSquare size={16} /> WhatsApp Variant
            </button>
          </div>

          {activeTab === "email" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Email Draft Content</h3>
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

              {/* Preview */}
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">HTML Rendered Preview</h3>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 text-slate-800 space-y-4 shadow-sm">
                  <div className="text-center border-b pb-4">
                    <p className="font-serif font-bold text-lg text-[#1A140E]">Shoonaya</p>
                    <p className="text-[9px] uppercase tracking-widest text-[#854F0B]">Find Your Infinity</p>
                  </div>
                  <h4 className="font-bold text-sm text-center">{emailSubject || "Weekly Subject Line"}</h4>
                  <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {emailBody || "Email preview content will render here..."}
                  </div>
                </div>
                <VariantProvenancePanel variant={emailVariant} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">WhatsApp Broadcast Copy</h3>
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Message Body</label>
                  <textarea
                    rows={12}
                    value={whatsappBody}
                    onChange={e => setWhatsappBody(e.target.value)}
                    className="w-full mt-1 p-3 rounded-xl border border-[var(--border-subtle)] text-xs font-medium outline-none focus:border-amber-600 font-mono"
                    placeholder="*Shoonaya Weekly Dharma* 🪔

Peace and stillness..."
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

              {/* Preview */}
              <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">WhatsApp Chat Bubble Preview</h3>
                <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-slate-300">
                  <div className="p-4 rounded-2xl bg-white shadow-sm max-w-sm space-y-2 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {whatsappBody || "*Shoonaya Weekly Reflection* 🪔\n\nPreview text..."}
                  </div>
                </div>
                <VariantProvenancePanel variant={whatsappVariant} />
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
                onClick={() => setShowDispatchConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
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
