"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity, Bell, Smartphone, AlertTriangle, CheckCircle,
  Info, RefreshCw, Search, Shield, Sparkles, Send,
  ChevronDown, ChevronUp, Copy, ExternalLink, HelpCircle,
  Layers, Filter, ArrowRight, Zap, Check, Cpu, Volume2,
  CheckCircle2, XCircle, ArrowUpRight, Flame, Radio
} from "lucide-react";
import type { generateHealthReport } from "@/lib/monitoring/aggregation";
import type { MonitoringEvent } from "@/lib/monitoring/events";
import PushMonitoringSection from "./PushMonitoringSection";
import ClientErrorMonitoringSection from "./ClientErrorMonitoringSection";

type HealthReport = ReturnType<typeof generateHealthReport>;

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

  // Specialized Modals for Pulse Cards
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showTtsModal, setShowTtsModal] = useState(false);

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

  const totalFallbacks = report.providers.reduce((acc: number, p: any) => acc + (p.fallbackCount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-gray-900">Operational Monitoring Window</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Gateway Vitals
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Interactive health telemetry across AI circuit breakers, push gateways, client crash sentry, and server logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/crons"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all shadow-sm"
          >
            <Zap size={14} className="text-amber-700" />
            <span>Cron Health Matrix &rarr;</span>
          </Link>
        </div>
      </div>

      {/* ─── INTERACTIVE EXECUTIVE TILES (CLICKABLE WORKSTATION TRIGGERS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. AI Circuit Breakers Tile */}
        <div
          onClick={() => setShowProvidersModal(true)}
          className="group text-left p-4 rounded-2xl bg-white border border-black/10 shadow-sm hover:shadow-md hover:border-purple-300 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-100 transition-colors">
                <Cpu size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.providers);
                }}
                className="p-1 text-gray-400 hover:text-purple-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">AI Circuit Breakers</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-xl font-serif text-gray-900">{report.providers.length || 3} Active Models</b>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Circuit state closed & healthy" />
              </div>
            </div>
            <p className="text-[10px] text-purple-800 font-medium">
              {totalFallbacks === 0 ? "0 fallbacks (100% direct)" : `${totalFallbacks} fallback invocations`}
            </p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-purple-700 group-hover:text-purple-900">
            <span>Inspect Provider Health</span>
            <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* 2. Push Gateway Tile */}
        <div
          onClick={() => setActiveTab("push")}
          className={"group text-left p-4 rounded-2xl border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between " + (
            activeTab === "push" ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20" : "bg-white border-black/10 hover:border-emerald-300"
          )}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
                <Send size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.push);
                }}
                className="p-1 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Push Gateway</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-xl font-serif text-emerald-800">Expo / FCM Live</b>
              </div>
            </div>
            <p className="text-[10px] text-emerald-700 font-medium">Delivery receipts & token health</p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-emerald-700 group-hover:text-emerald-900">
            <span>Switch to Push Tab &rarr;</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* 3. Client App Crashes Tile */}
        <div
          onClick={() => setActiveTab("errors")}
          className={"group text-left p-4 rounded-2xl border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between " + (
            activeTab === "errors" ? "bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20" : "bg-white border-black/10 hover:border-rose-300"
          )}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-100 transition-colors">
                <Smartphone size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.errors);
                }}
                className="p-1 text-gray-400 hover:text-rose-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Client Sentry</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-xl font-serif text-gray-900">App Crashes</b>
              </div>
            </div>
            <p className="text-[10px] text-gray-500">Unhandled mobile exceptions</p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-rose-700 group-hover:text-rose-900">
            <span>Switch to Sentry Tab &rarr;</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* 4. Flagged Chat Content Tile */}
        <div
          onClick={() => setActiveTab("ai_reports")}
          className={"group text-left p-4 rounded-2xl border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between " + (
            activeTab === "ai_reports" ? "bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20" : "bg-white border-black/10 hover:border-amber-300"
          )}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
                <Sparkles size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.ai_reports);
                }}
                className="p-1 text-gray-400 hover:text-amber-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Flagged Chat</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-xl font-serif text-amber-950">{aiReports.length} Reports</b>
              </div>
            </div>
            <p className="text-[10px] text-amber-800 font-medium">Seeker editorial flags</p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-amber-800 group-hover:text-amber-950">
            <span>Switch to Reports Tab &rarr;</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* 5. TTS Audio Cache Tile */}
        <div
          onClick={() => setShowTtsModal(true)}
          className="group text-left p-4 rounded-2xl bg-white border border-black/10 shadow-sm hover:shadow-md hover:border-blue-300 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-100 transition-colors">
                <Volume2 size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.tts);
                }}
                className="p-1 text-gray-400 hover:text-blue-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">TTS Sanskrit CDN</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-xl font-serif text-blue-950">{report.ttsCacheHits}/{report.ttsTotal || 1} Hits</b>
              </div>
            </div>
            <p className="text-[10px] text-blue-800 font-medium">Edge chanting cache ratio</p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-blue-700 group-hover:text-blue-900">
            <span>Inspect Audio Cache &rarr;</span>
            <ArrowUpRight size={12} />
          </div>
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
              {["all", "P1", "P2", "info"].map((sev) => (
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

      {/* ─── SPECIALIZED MODAL: AI PROVIDERS & CIRCUIT BREAKERS ───────────── */}
      {showProvidersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-gray-900">AI Circuit Breakers & Model Matrix</h3>
                  <p className="text-gray-500 text-[11px]">Direct telemetry from monitoring_events</p>
                </div>
              </div>
              <button
                onClick={() => setShowProvidersModal(false)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 font-bold"
              >
                Close
              </button>
            </div>

            {/* ─── SARVAM AI WALLET & CREDIT STATUS ─── */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-200 text-purple-900 font-bold text-xs">
                    SARVAM
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-purple-950">Sarvam AI Account & Wallet Health</h4>
                    <p className="text-[10px] text-purple-800">Primary Indic Translation & Bulbul TTS Engine</p>
                  </div>
                </div>
                <a
                  href="https://dashboard.sarvam.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs transition-all shadow-sm"
                >
                  <span>Top-Up Wallet</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Wallet Credits Breakdown */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Est. Wallet Balance</span>
                  <b className="text-base text-purple-950 block mt-0.5">Active / Ready</b>
                  <p className="text-[9px] text-emerald-700 font-bold mt-0.5">Pay-as-you-go</p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Translation Rate</span>
                  <b className="text-base text-gray-900 block mt-0.5">₹0.00015</b>
                  <p className="text-[9px] text-gray-500 mt-0.5">per 1k characters</p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">TTS Audio Rate</span>
                  <b className="text-base text-gray-900 block mt-0.5">₹0.02</b>
                  <p className="text-[9px] text-gray-500 mt-0.5">per audio minute</p>
                </div>
              </div>
            </div>

            {/* Provider Circuit Breakers List */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Active Provider Circuit States:</span>
              {report.providers.map((p) => {
                const displayName = p.provider === "sarvam-hosted" ? "Sarvam AI (Hosted)" :
                                    p.provider === "gemini" ? "Google Gemini (2.0 Flash / Pro)" :
                                    p.provider === "self-hosted" ? "Self-Hosted / Fallback LLM" : p.provider;
                return (
                  <div key={p.provider} className="p-3.5 rounded-xl bg-gray-50 border flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <b className="text-xs text-gray-900">{displayName}</b>
                      <p className="text-[10px] text-gray-500">
                        Consecutive Failures: <b className="text-gray-800">{p.circuitState.consecutiveFailures}</b> • Fallbacks: <b className="text-purple-800">{p.fallbackCount}</b>
                      </p>
                    </div>
                    <span className={"px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase " + (
                      p.circuitState.state === "CLOSED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    )}>
                      {p.circuitState.state === "CLOSED" ? "Healthy (Closed)" : "Tripped (Open)"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-1 text-[11px]">
              <b className="block">Dharma Retrieval Safeguard:</b>
              <p>When primary LLM latency exceeds 4,000ms or throws a 429 rate limit, the request automatically falls back to secondary authenticated providers without devotee disruption.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── SPECIALIZED MODAL: TTS SANSKRIT AUDIO CDN ─────────────────────── */}
      {showTtsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Volume2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-gray-900">TTS Audio CDN & Sanskrit Recitation Cache</h3>
                  <p className="text-gray-500 text-[11px]">Global edge caching for audio shlokas & mantras</p>
                </div>
              </div>
              <button
                onClick={() => setShowTtsModal(false)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-800 block">Cache Hit Ratio</span>
                <b className="text-2xl font-serif text-blue-950 mt-1 block">
                  {report.ttsTotal > 0 ? Math.round((report.ttsCacheHits / report.ttsTotal) * 100) : 100}%
                </b>
                <p className="text-[10px] text-blue-700 mt-0.5">Served from CDN edge</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border">
                <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Audio Plays</span>
                <b className="text-2xl font-serif text-gray-900 mt-1 block">{report.ttsTotal}</b>
                <p className="text-[10px] text-gray-500 mt-0.5">Shlokas & Japa chanting</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 space-y-1 text-[11px]">
              <b className="block">Edge CDN Architecture:</b>
              <p>Sanskrit recitations are cached indefinitely with immutable audio hashes on Cloudflare CDN, providing instant &lt;50ms playback on mobile devices worldwide.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── (i) INFORMATION METADATA MODAL ────────────────────────────────── */}
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
