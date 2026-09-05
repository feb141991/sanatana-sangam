"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Calendar,
  Smartphone,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  User,
} from "lucide-react";
import {
  type AdminInspectableRecord,
  type CalendarFindingRecord,
  type ContentReportRecord,
  type ClientErrorRecord,
  type DharmVeerRecord,
  sanitizeAdminMetadata,
} from "@/lib/admin-inspector-types";
import { useDialogFocusTrap } from "@/lib/admin-accessibility";

interface Props {
  record: AdminInspectableRecord | null;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onActionComplete?: (record: AdminInspectableRecord, action: string) => void;
}

export function AdminRecordInspector({
  record,
  isOpen,
  isLoading = false,
  error = null,
  onClose,
  onActionComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Focus trap, Escape key handling, and return focus upon close
  useDialogFocusTrap(isOpen, onClose, containerRef);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Actions by Record Type ──

  const handleResolveCalendarFinding = async (item: CalendarFindingRecord) => {
    setActionInProgress("resolve_finding");
    setActionFeedback(null);
    try {
      const res = await fetch("/api/admin/calendar-governance/integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", findingId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to resolve finding");
      setActionFeedback({ ok: true, message: "Finding marked resolved" });
      onActionComplete?.(item, "resolve");
    } catch (err: any) {
      setActionFeedback({ ok: false, message: err?.message || "Action failed" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleModerationAction = async (
    item: ContentReportRecord,
    action: "reviewed" | "dismissed" | "actioned",
    extra?: { banUser?: boolean; removeContent?: boolean }
  ) => {
    setActionInProgress(action);
    setActionFeedback(null);
    try {
      if (extra?.banUser && item.contentAuthorId) {
        const banRes = await fetch(`/api/admin/users/${item.contentAuthorId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBanned: true, banReason: `Reported content: ${item.reason}` }),
        });
        if (!banRes.ok) {
          const b = await banRes.json().catch(() => null);
          throw new Error(b?.error || "Failed to ban user");
        }
      }

      const res = await fetch(`/api/admin/reports/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          removeContent: extra?.removeContent || false,
          contentType: item.contentType,
          contentId: item.contentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update report");

      setActionFeedback({
        ok: true,
        message: extra?.removeContent
          ? "Content removed and report actioned"
          : extra?.banUser
          ? "Author banned and report actioned"
          : `Report marked ${action}`,
      });
      onActionComplete?.(item, action);
    } catch (err: any) {
      setActionFeedback({ ok: false, message: err?.message || "Action failed" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDharmVeerAction = async (item: DharmVeerRecord, action: "approve" | "reject") => {
    setActionInProgress(action);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/admin/dharm-veer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: item.slug, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed to ${action} biography`);
      setActionFeedback({ ok: true, message: `Biography ${action}d successfully` });
      onActionComplete?.(item, action);
    } catch (err: any) {
      setActionFeedback({ ok: false, message: err?.message || "Action failed" });
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Record Inspector"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-outfit animate-in fade-in duration-150 motion-reduce:animate-none"
      onClick={onClose}
    >
      {/* Screen Reader Live Region for Mutation Feedback */}
      {actionFeedback && (
        <div aria-live="polite" role="status" className="sr-only">
          {actionFeedback.message}
        </div>
      )}

      <div
        ref={containerRef}
        tabIndex={-1}
        className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-black/10 flex flex-col z-10 animate-in slide-in-from-right duration-200 motion-reduce:animate-none overflow-hidden focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Strip */}
        <div className="p-4 sm:p-5 border-b border-black/5 bg-black/[0.01] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {record?.type === "calendar_finding" && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 border border-amber-500/20">
                <Calendar size={11} />
                Calendar Finding
              </span>
            )}
            {record?.type === "content_report" && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 border border-rose-500/20">
                <ShieldAlert size={11} />
                Content Report
              </span>
            )}
            {record?.type === "client_error" && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 border border-indigo-500/20">
                <Smartphone size={11} />
                Client Crash
              </span>
            )}
            {record?.type === "dharm_veer" && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-900 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 border border-emerald-500/20">
                <ShieldCheck size={11} />
                Dharm Veer Biography
              </span>
            )}
            {!record && (
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                Record Inspector
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Close record inspector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`p-3.5 mx-4 mt-3 rounded-xl border text-xs flex items-center justify-between shrink-0 ${
              actionFeedback.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.ok ? <CheckCircle2 size={15} className="text-emerald-600" /> : <AlertTriangle size={15} className="text-rose-600" />}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-[11px] font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 space-y-2 flex flex-col items-center justify-center">
              <Loader2 size={24} className="animate-spin text-amber-600" />
              <p className="font-bold text-gray-600">Loading record details...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 space-y-2 bg-rose-50/50 rounded-2xl border border-rose-200">
              <AlertTriangle size={24} className="mx-auto text-rose-600" />
              <b className="block text-sm">Failed to Load Record</b>
              <p className="text-rose-800">{error}</p>
            </div>
          ) : !record ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <Shield size={28} className="mx-auto text-gray-300" />
              <b className="block text-sm text-gray-600">No Record Selected</b>
              <p className="text-gray-400">Select an item in an operational queue to view its verified details.</p>
            </div>
          ) : (
            <>
              {/* ── RECORD VIEW: CALENDAR FINDING ── */}
              {record.type === "calendar_finding" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold font-serif theme-ink">{record.title}</h2>
                    <p className="text-gray-500 mt-0.5">{record.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-sans block">Severity</span>
                      <span className={`font-bold uppercase ${record.severity === "critical" ? "text-rose-700" : "text-amber-700"}`}>
                        {record.severity}
                      </span>
                    </div>
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-sans block">Status</span>
                      <span className="font-bold uppercase text-gray-800">{record.status}</span>
                    </div>
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-sans block">Rule Slug</span>
                      <span className="text-gray-900 font-bold truncate block">{record.slug}</span>
                    </div>
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 font-sans block">Calendar Year</span>
                      <span className="text-gray-900 font-bold">{record.year}</span>
                    </div>
                  </div>

                  {record.discrepancy && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                      <b className="text-[11px] uppercase tracking-wider text-amber-950 font-bold block">
                        Engine vs Sourced Discrepancy
                      </b>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-amber-800 block font-bold">Curated / Fixture:</span>
                          <code className="font-mono text-amber-950 font-bold">
                            {record.discrepancy.expectedDate || "No civil date"}
                          </code>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-800 block font-bold">Calculated Output:</span>
                          <code className="font-mono text-amber-950 font-bold">
                            {record.discrepancy.calculatedDate || "Withheld"}
                          </code>
                        </div>
                      </div>
                      {record.discrepancy.ruleReasoning && (
                        <p className="text-[11px] text-amber-900 leading-relaxed italic border-t border-amber-200/50 pt-1.5">
                          &ldquo;{record.discrepancy.ruleReasoning}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      href={`/admin/calendar-governance?tab=integrity&findingId=${record.id}&slug=${record.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                    >
                      <span>Open in Calendar Governance Hub</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── RECORD VIEW: CONTENT REPORT ── */}
              {record.type === "content_report" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Report Reason</span>
                      <h2 className="text-sm font-bold font-serif theme-ink capitalize mt-0.5">
                        {record.reason.replace(/_/g, " ")}
                      </h2>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        record.status === "pending"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : record.status === "reviewed" || record.status === "actioned"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>

                  {/* Q&A Context comparison */}
                  <div className="p-3.5 bg-gray-50 border rounded-xl space-y-3">
                    {record.metadata?.user_prompt && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Seeker Question</span>
                        <p className="text-xs text-gray-900 font-medium italic">
                          &ldquo;{String(record.metadata.user_prompt)}&rdquo;
                        </p>
                      </div>
                    )}
                    {record.metadata?.ai_text && (
                      <div className="space-y-1 border-t pt-2">
                        <span className="text-[10px] font-bold uppercase text-purple-700">AI Response</span>
                        <p className="text-xs text-gray-700 leading-relaxed max-h-48 overflow-y-auto">
                          {String(record.metadata.ai_text)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sanitized Metadata */}
                  {record.metadata && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sanitized Metadata</span>
                        <button
                          onClick={() => copyText(JSON.stringify(sanitizeAdminMetadata(record.metadata), null, 2), "meta")}
                          className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
                        >
                          {copiedKey === "meta" ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          <span>{copiedKey === "meta" ? "Copied" : "Copy JSON"}</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-black/90 text-amber-200 font-mono text-[10px] overflow-x-auto max-h-36">
                        {JSON.stringify(sanitizeAdminMetadata(record.metadata), null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <Link
                      href={`/admin/moderation?reportId=${record.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                    >
                      <span>Open in Moderation Hub</span>
                      <ExternalLink size={12} />
                    </Link>

                    {record.contentAuthorId && (
                      <Link
                        href={`/admin/users/${record.contentAuthorId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                      >
                        <User size={12} />
                        <span>Author Dossier</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* ── RECORD VIEW: CLIENT CRASH ERROR ── */}
              {record.type === "client_error" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono font-bold border border-rose-200">
                        {record.errorName}
                      </span>
                      <code className="text-[11px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                        {record.route}
                      </code>
                    </div>
                    <p className="text-xs font-bold theme-ink mt-2 leading-snug">{record.errorMessage}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">1h Incidents</span>
                      <b className="text-base font-serif text-rose-700">{record.count1h}</b>
                    </div>
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">24h Incidents</span>
                      <b className="text-base font-serif text-gray-900">{record.count24h}</b>
                    </div>
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Affected Sessions</span>
                      <b className="text-base font-serif text-emerald-800">{record.distinctSessionsCount}</b>
                    </div>
                    <div className="p-3 bg-black/[0.02] border rounded-xl space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Platform & OS</span>
                      <span className="font-mono text-gray-700 truncate block">
                        {record.browserFamily} / {record.osFamily}
                      </span>
                    </div>
                  </div>

                  {/* Stack trace */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stack Trace</span>
                      <button
                        onClick={() => copyText(record.sampleStack || record.errorMessage, "stack")}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded px-1"
                      >
                        {copiedKey === "stack" ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                        <span>{copiedKey === "stack" ? "Copied" : "Copy Trace"}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-black/90 text-rose-300 font-mono text-[10px] overflow-x-auto max-h-48 whitespace-pre-wrap">
                      {record.sampleStack || "No stack trace available"}
                    </pre>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/admin/monitoring?tab=errors&fingerprint=${record.fingerprint}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                    >
                      <span>Open in Monitoring Window</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── RECORD VIEW: DHARM VEER REVIEW ── */}
              {record.type === "dharm_veer" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold font-serif theme-ink">{record.name}</h2>
                      {record.nameLocal && <span className="text-xs text-gray-400 font-medium">({record.nameLocal})</span>}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mt-0.5">
                      {record.tradition} · {record.era || "era unknown"}
                    </p>
                    <p className="text-xs theme-ink italic mt-1">&ldquo;{record.tagline}&rdquo;</p>
                  </div>

                  {/* Sourced citations */}
                  {record.sourceCitations && record.sourceCitations.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Public Domain Source Citations
                      </span>
                      {record.sourceCitations.map((c, i) => (
                        <div key={i} className="p-3 bg-black/[0.02] border rounded-xl space-y-1.5">
                          <a
                            href={c.sourceUrl || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                          >
                            <span>{c.sourceName} ({c.rightsStatus})</span>
                            <ExternalLink size={10} />
                          </a>
                          {c.excerpt && (
                            <p className="text-[11px] text-gray-600 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-line">
                              {c.excerpt}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Biography text */}
                  <div className="space-y-2.5 border-t pt-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Journey</span>
                      <p className="text-xs text-gray-700 leading-relaxed mt-0.5">{record.journey}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Trial & Conflict</span>
                      <p className="text-xs text-gray-700 leading-relaxed mt-0.5">{record.trial}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Dharmic Teaching</span>
                      <p className="text-xs text-gray-700 leading-relaxed mt-0.5">{record.teaching}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/admin/dharm-veer-review?slug=${record.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                    >
                      <span>Open in Dharm Veer Review Queue</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 3. Action Footer */}
        {record && (
          <div className="p-4 border-t border-black/5 bg-black/[0.02] shrink-0 flex items-center justify-end gap-2">
            {record.type === "calendar_finding" && (
              <button
                onClick={() => handleResolveCalendarFinding(record)}
                disabled={actionInProgress !== null}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {actionInProgress === "resolve_finding" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Resolve Finding</span>
              </button>
            )}

            {record.type === "content_report" && record.status === "pending" && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => handleModerationAction(record, "dismissed")}
                  disabled={actionInProgress !== null}
                  className="px-3 py-1.5 rounded-xl border text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleModerationAction(record, "reviewed")}
                  disabled={actionInProgress !== null}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {actionInProgress === "reviewed" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Mark Reviewed</span>
                </button>
                {record.contentId && (
                  <button
                    onClick={() => handleModerationAction(record, "actioned", { removeContent: true })}
                    disabled={actionInProgress !== null}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <Trash2 size={12} />
                    <span>Remove Content</span>
                  </button>
                )}
              </div>
            )}

            {record.type === "dharm_veer" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDharmVeerAction(record, "reject")}
                  disabled={actionInProgress !== null}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleDharmVeerAction(record, "approve")}
                  disabled={actionInProgress !== null}
                  className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {actionInProgress === "approve" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Approve Hero</span>
                </button>
              </div>
            )}

            {record.type === "client_error" && (
              <button
                onClick={() => copyText(record.sampleStack || record.errorMessage, "footer_copy")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-gray-800 font-bold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {copiedKey === "footer_copy" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedKey === "footer_copy" ? "Copied Signature" : "Copy Signature"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
