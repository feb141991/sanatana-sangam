"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity, Bell, Smartphone, AlertTriangle, CheckCircle,
  Info, RefreshCw, Search, Shield, Sparkles, Send,
  ChevronDown, ChevronUp, Copy, ExternalLink, HelpCircle,
  Layers, Filter, ArrowRight, Zap, Check
} from "lucide-react";
import type { MonitoringEvent } from "@/lib/monitoring/events";
import type { generateHealthReport } from "@/lib/monitoring/aggregation";
type HealthReport = ReturnType<typeof generateHealthReport>;
import PushMonitoringSection from "./PushMonitoringSection";
import ClientErrorMonitoringSection from "./ClientErrorMonitoringSection";

interface ContentReport {
  id: string;
  status: string;
  reason: string;
  metadata: Record<string, unknown> | null;
  reported_by: string | null;
  created_at: string;
}

interface Props {
  report: HealthReport;
  recentEvents: MonitoringEvent[];
  aiReports: ContentReport[];
}

interface InfoModalData {
  title: string;
  sourceTable: string;
  cadence: string;
  description: string;
  adminAction: string;
}

const SECTION_INFO: Record<string, InfoModalData> = {
  providers: {
    title: "AI / Provider Circuit Breakers",
    sourceTable: "monitoring_events (domain: ai_chat / llm)",
    cadence: "Real-time on every LLM generation",
    description: "Monitors primary and fallback AI model availability (Gemini, Claude, OpenAI). If consecutive failures exceed threshold, the circuit breaker opens to prevent cascading latency.",
    adminAction: "If circuit is OPEN, check API keys in Vercel environment variables or review fallback provider rate limits.",
  },
  push: {
    title: "Push Notification Delivery Gateway",
    sourceTable: "notification_deliveries & push_tokens",
    cadence: "Real-time on every push dispatch batch",
    description: "Tracks delivery receipt tickets returned by Apple APNs and Google FCM via Expo Push Services. Reconciles delivered vs invalid or unregistered device tokens.",
    adminAction: "If delivery failure exceeds 5%, inspect Dead / Failed rows in Cron Telemetry or prune dead push tokens.",
  },
  errors: {
    title: "Client Application Sentry & Crashes",
    sourceTable: "client_error_events",
    cadence: "Real-time on unhandled JS / React Native exceptions",
    description: "Captures unhandled exceptions from iOS, Android, and Web clients with device models, OS versions, and minified stack traces.",
    adminAction: "Inspect recurring error fingerprints to identify faulty component renders or missing null-checks in app releases.",
  },
  ai_reports: {
    title: "Seeker AI Chat & Content Reports",
    sourceTable: "content_reports (content_type: ai_chat_response)",
    cadence: "Real-time when seekers flag responses in app",
    description: "Editorial review queue of AI chat answers reported by seekers for scriptural inaccuracy, hallucination, or tone.",
    adminAction: "Review flagged question and answer pair. Dismiss false alarms or add corrective guardrails to Dharma retrieval rules.",
  },
  tts: {
    title: "TTS Audio Cache & Sanskrit Recitation CDN",
    sourceTable: "monitoring_events (domain: tts)",
    cadence: "Hourly rolling edge cache metrics",
    description: "Measures edge caching performance for audio shlokas and mantras. High cache hits reduce external voice API latency and cost.",
    adminAction: "If cache hit ratio drops below 70%, verify Cloudflare / Supabase Storage CDN caching headers.",
  },
  telemetry: {
    title: "System-Wide Telemetry Event Stream",
    sourceTable: "monitoring_events",
    cadence: "Real-time event-driven log buffer",
    description: "Unified ingestion stream of all backend errors, warnings, cron completions, and latency spikes across the entire platform.",
    adminAction: "Filter by severity to triage P1 alerts or inspect request IDs for root-cause reproduction.",
  },
};

export default function MonitoringClient({ report, recentEvents, aiReports }: Props) {
  const [activeTab, setActiveTab] = useState<"telemetry" | "push" | "errors" | "ai_reports">("telemetry");
  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null);

  // Telemetry event filters
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [eventSearch, setEventSearch] = useState<string>("");
  const [inspectEvent, setInspectEvent] = useState<MonitoringEvent | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return recentEvents.filter((ev) => {
      if (severityFilter !== "all" && ev.severity !== severityFilter) return false;
      if (eventSearch.trim()) {
        const q = eventSearch.toLowerCase();
        const matchesRoute = ev.route?.toLowerCase().includes(q);
        const matchesMsg = ev.error_message?.toLowerCase().includes(q);
        const matchesDomain = ev.domain?.toLowerCase().includes(q);
        if (!matchesRoute && !matchesMsg && !matchesDomain) return false;
      }
      return true;
    });
  }, [recentEvents, severityFilter, eventSearch]);

  const errorEventsCount = recentEvents.filter((e) => e.severity === "P1").length;

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-gray-900">Operational Monitoring Window</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              Live Gateway Vitals
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time diagnostics across AI circuit breakers, push gateways, client crashes, and telemetry logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/crons"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all"
          >
            <Zap size={13} className="text-amber-700" />
            <span>Cron Health Matrix &rarr;</span>
          </Link>
        </div>
      </div>

      {/* ─── EXECUTIVE PULSE CARDS (WITH (i) BUTTONS) ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. AI Circuit Breakers */}
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">AI Circuit</span>
            <button
              onClick={() => setInfoModal(SECTION_INFO.providers)}
              className="text-gray-400 hover:text-amber-600 p-0.5 rounded"
              title="What is this metric?"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <b className="text-xl font-serif text-gray-900">{report.providers.length} Models</b>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="All circuits closed & healthy" />
          </div>
          <p className="text-[10px] text-gray-500">
            {report.providers.reduce((acc: number, p: any) => acc + (p.fallbackCount || 0), 0)} fallbacks triggered
          </p>
        </div>

        {/* 2. Push Gateway */}
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Push Gateway</span>
            <button
              onClick={() => setInfoModal(SECTION_INFO.push)}
              className="text-gray-400 hover:text-amber-600 p-0.5 rounded"
              title="What is this metric?"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <b className="text-xl font-serif text-emerald-700">Expo / FCM</b>
          </div>
          <p className="text-[10px] text-gray-500">Active tokens & receipt tickets</p>
        </div>

        {/* 3. Client Sentry */}
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Client Crashes</span>
            <button
              onClick={() => setInfoModal(SECTION_INFO.errors)}
              className="text-gray-400 hover:text-amber-600 p-0.5 rounded"
              title="What is this metric?"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <b className="text-xl font-serif text-gray-900">App Sentry</b>
          </div>
          <p className="text-[10px] text-gray-500">Unhandled mobile/web exceptions</p>
        </div>

        {/* 4. AI Content Reports */}
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Flagged Chat</span>
            <button
              onClick={() => setInfoModal(SECTION_INFO.ai_reports)}
              className="text-gray-400 hover:text-amber-600 p-0.5 rounded"
              title="What is this metric?"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <b className="text-xl font-serif text-amber-900">{aiReports.length} Reports</b>
          </div>
          <p className="text-[10px] text-gray-500">Seeker editorial flags</p>
        </div>

        {/* 5. TTS Audio Cache */}
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">TTS Audio CDN</span>
            <button
              onClick={() => setInfoModal(SECTION_INFO.tts)}
              className="text-gray-400 hover:text-amber-600 p-0.5 rounded"
              title="What is this metric?"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <b className="text-xl font-serif text-blue-900">{report.ttsCacheHits}/{report.ttsTotal}</b>
          </div>
          <p className="text-[10px] text-gray-500">Edge chanting cache hits</p>
        </div>
      </div>

      {/* ─── TABBED WORKSTATIONS NAVIGATION ────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-black/10 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
            activeTab === "telemetry"
              ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Activity size={14} />
          <span>Server Telemetry & Logs ({filteredEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("push")}
          className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
            activeTab === "push"
              ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Bell size={14} />
          <span>Push Delivery Gateway</span>
        </button>

        <button
          onClick={() => setActiveTab("errors")}
          className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
            activeTab === "errors"
              ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Smartphone size={14} />
          <span>Client App Crashes & Sentry</span>
        </button>

        <button
          onClick={() => setActiveTab("ai_reports")}
          className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
            activeTab === "ai_reports"
              ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Sparkles size={14} />
          <span>AI Chat & Content Reports ({aiReports.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: SERVER TELEMETRY & LOGS ────────────────────────────────── */}
      {activeTab === "telemetry" && (
        <div className="space-y-4">
          {/* Controls & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-gray-400">Severity:</span>
              {["all", "error", "P1", "P2", "info"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={"px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all " + (
                    severityFilter === sev ? "bg-amber-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search route, message, or domain..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-black/10 text-xs focus:outline-none focus:border-amber-500 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Events Stream Table */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-black/[0.02] border-b text-[11px] font-bold uppercase tracking-wider text-gray-500 grid grid-cols-12 gap-4 items-center">
              <span className="col-span-2 flex items-center gap-1">
                <span>Severity / Time</span>
                <button onClick={() => setInfoModal(SECTION_INFO.telemetry)} className="text-gray-400 hover:text-amber-700"><Info size={11} /></button>
              </span>
              <span className="col-span-3">Domain / Route</span>
              <span className="col-span-5">Message / Context</span>
              <span className="col-span-2 text-right">Duration / Action</span>
            </div>

            <div className="divide-y text-xs">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No telemetry events match your criteria.</div>
              ) : (
                filteredEvents.slice(0, 30).map((ev, idx) => (
                  <div key={idx} className="px-6 py-3 grid grid-cols-12 gap-4 items-center hover:bg-black/[0.01]">
                    <div className="col-span-2 space-y-0.5">
                      <span className={"px-2 py-0.5 rounded text-[10px] font-bold uppercase " + (
                        ev.severity === "P1" ? "bg-rose-100 text-rose-800" :
                        ev.severity === "P2" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      )}>
                        {ev.severity}
                      </span>
                      <p className="text-[10px] font-mono text-gray-400">{new Date(ev.timestamp).toLocaleTimeString()}</p>
                    </div>

                    <div className="col-span-3 space-y-0.5">
                      <b className="text-gray-900 truncate block">{ev.domain || "system"}</b>
                      <code className="text-[10px] text-amber-800 truncate block font-mono">{ev.route || "internal"}</code>
                    </div>

                    <div className="col-span-5 space-y-0.5">
                      <p className="text-gray-700 truncate">{ev.error_message || "Execution successful"}</p>
                      {ev.provider && <p className="text-[10px] text-gray-400">Provider: {ev.provider} ({ev.model || "default"})</p>}
                    </div>

                    <div className="col-span-2 text-right space-y-0.5">
                      <span className="font-mono text-[11px] text-gray-600 block">{ev.latency_ms ? `${ev.latency_ms}ms` : "0ms"}</span>
                      <button
                        onClick={() => setInspectEvent(ev)}
                        className="text-[10px] text-amber-800 underline font-sans"
                      >
                        Inspect &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PUSH NOTIFICATIONS GATEWAY ──────────────────────────────── */}
      {activeTab === "push" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-gray-900">Push Notification Gateway Health</h3>
                <button onClick={() => setInfoModal(SECTION_INFO.push)} className="text-gray-400 hover:text-amber-700"><Info size={14} /></button>
              </div>
              <p className="text-xs text-gray-500">Live Expo & OneSignal provider response receipts and token pruning telemetry.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/crons"
                className="px-3 py-1.5 rounded-xl border text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Inspect Schedule Queue &rarr;
              </Link>
            </div>
          </div>

          <PushMonitoringSection />
        </div>
      )}

      {/* ─── TAB 3: CLIENT APP CRASHES ─────────────────────────────────────── */}
      {activeTab === "errors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-gray-900">Client Error Stream & Crash Fingerprints</h3>
                <button onClick={() => setInfoModal(SECTION_INFO.errors)} className="text-gray-400 hover:text-amber-700"><Info size={14} /></button>
              </div>
              <p className="text-xs text-gray-500">Live unhandled exception telemetry captured directly from iOS, Android, and Web clients.</p>
            </div>
          </div>

          <ClientErrorMonitoringSection />
        </div>
      )}

      {/* ─── TAB 4: AI CHAT & CONTENT REPORTS ──────────────────────────────── */}
      {activeTab === "ai_reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-gray-900">AI Chat & Editorial Content Reports</h3>
                <button onClick={() => setInfoModal(SECTION_INFO.ai_reports)} className="text-gray-400 hover:text-amber-700"><Info size={14} /></button>
              </div>
              <p className="text-xs text-gray-500">Responses flagged by seekers in the AI Guru chat requiring editorial review.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            {aiReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                <p>Zero pending AI content reports. All chat responses are clean.</p>
              </div>
            ) : (
              <div className="divide-y text-xs">
                {aiReports.map((report) => (
                  <div key={report.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          {report.status}
                        </span>
                        <b className="text-gray-900">{report.reason}</b>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono">
                        Reported on {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── (i) INFORMATION MODAL ─────────────────────────────────────────── */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Info size={16} />
                </div>
                <h3 className="text-base font-bold font-serif text-gray-900">{infoModal.title}</h3>
              </div>
              <button
                onClick={() => setInfoModal(null)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gray-50 border space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Canonical Database Source</span>
                <code className="text-amber-900 font-bold font-mono text-xs">{infoModal.sourceTable}</code>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Measurement & Work Description</span>
                <p className="text-gray-700 leading-relaxed">{infoModal.description}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Sampling Cadence</span>
                <p className="text-gray-600 font-mono">{infoModal.cadence}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <b className="block text-[11px]">Recommended Administrator Action:</b>
                <p className="text-[11px] leading-relaxed">{infoModal.adminAction}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── EVENT INSPECT MODAL ────────────────────────────────────────────── */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-gray-900">Telemetry Event Inspector</h3>
              <button
                onClick={() => setInspectEvent(null)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 font-bold"
              >
                Close
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 border">
              {JSON.stringify(inspectEvent, null, 2)}
            </pre>

            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-400 text-[10px]">Source: monitoring_events table</span>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(JSON.stringify(inspectEvent, null, 2));
                  setCopiedJson(true);
                  setTimeout(() => setCopiedJson(false), 2000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-gray-50"
              >
                <Copy size={12} />
                <span>{copiedJson ? "Copied!" : "Copy Event JSON"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
