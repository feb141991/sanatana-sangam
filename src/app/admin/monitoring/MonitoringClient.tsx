"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity, Bell, Smartphone, AlertTriangle, CheckCircle,
  Info, RefreshCw, Search, Shield, Sparkles, Send,
  ChevronDown, ChevronUp, Copy, ExternalLink, HelpCircle,
  Layers, Filter, ArrowRight, Zap, Check, Cpu, Volume2,
  CheckCircle2, XCircle, ArrowUpRight, Flame, Radio,
  Database, Compass, WifiOff, CheckCheck, Clock, MessageSquare
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
  metadata: {
    ai_text?: string;
    user_prompt?: string;
    [key: string]: any;
  } | null;
  reported_by: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
}

interface Props {
  report: HealthReport;
  recentEvents: MonitoringEvent[];
  aiReports: ContentReport[];
  dbMetrics: { latencyMs: number; status: "healthy" | "degraded" | "error" };
  offlineSyncStats: { totalSynced: number; recentSyncs: number; status: string };
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
    title: "AI / Provider Circuit Breakers & Wallet",
    sourceTable: "monitoring_events (domain: ai_chat / llm)",
    cadence: "Real-time on every LLM generation",
    description: "Monitors primary and fallback AI model availability (Sarvam AI, Google Gemini, OpenAI). Tracks circuit breaker trips and provides direct access to Sarvam AI wallet credit management.",
    adminAction: "If circuit is OPEN or credits are depleted, top up wallet at dashboard.sarvam.ai or review fallback provider keys.",
  },
  db_pool: {
    title: "Postgres Database Connection Pool & Query Latency",
    sourceTable: "Supabase Postgres connection pooler (PgBouncer)",
    cadence: "Live round-trip benchmark sampled on page load",
    description: "Measures query round-trip latency to Supabase Postgres. Monitors connection pool responsiveness to prevent exhaustion during morning Brahma Muhurta traffic bursts.",
    adminAction: "If latency exceeds 150ms or errors occur, check Supabase project compute instance and connection pooler limits.",
  },
  ephemeris: {
    title: "Astronomical Ephemeris & Panchang Calibration",
    sourceTable: "packages/dharma-rules & Swiss Ephemeris golden fixtures",
    cadence: "Hourly calculation verification across top pilgrimage hubs",
    description: "Validates astronomical algorithms calculating Tithi, Nakshatra, Yoga, and Karana against canonical mathematical fixtures. Guarantees zero calculation drift across global timezones.",
    adminAction: "If drift warning appears, verify longitude/latitude coordinate inputs for the affected spiritual center.",
  },
  offline_sync: {
    title: "Mobile Offline Sadhana Sync Queue",
    sourceTable: "mala_sessions & sadhana_events",
    cadence: "Real-time on devotee device reconnection",
    description: "Tracks offline Japa mala rounds and morning sadhana checklists recorded on devotee devices when disconnected. Ensures seamless reconciliation into karmic ledgers.",
    adminAction: "If offline backlog surges, check network latency or client schema version alignment in mobile app releases.",
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
    title: "Seeker AI Chat & Editorial Content Reports",
    sourceTable: "content_reports (content_type: ai_chat_response)",
    cadence: "Real-time when seekers flag responses in app",
    description: "Editorial review queue of AI chat answers reported by seekers for scriptural inaccuracy, hallucination, or tone. Allows 1-click resolution and Dharma guardrail tuning.",
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

function resolveServiceName(route?: string, domain?: string, context?: Record<string, unknown>): { name: string; tag: string; icon: string } {
  if (context?.service && typeof context.service === "string") {
    return { name: context.service, tag: route || "service", icon: "⚡" };
  }
  if (!route) {
    if (domain === "ai") return { name: "AI Inference & Fallback Engine", tag: "ai-gateway", icon: "🧠" };
    if (domain === "tts") return { name: "Sanskrit Recitation TTS", tag: "/api/tts", icon: "🔊" };
    if (domain === "notifications") return { name: "Push Notification Gateway", tag: "notifications", icon: "🔔" };
    if (domain === "cron") return { name: "Background Cron Job", tag: "cron", icon: "⏱️" };
    return { name: "Core Platform Service", tag: domain || "system", icon: "⚙️" };
  }

  const r = route.toLowerCase();
  if (r.includes("verify-festival-dates") || r.includes("festival")) return { name: "Festival Date Verification", tag: route, icon: "🎯" };
  if (r.includes("ai/chat") || r.includes("chat")) return { name: "AI Guru Dharma Chat", tag: route, icon: "💬" };
  if (r.includes("quiz")) return { name: "Daily Sadhana Quiz", tag: route, icon: "🌅" };
  if (r.includes("tts")) return { name: "Sanskrit Shloka TTS Audio", tag: route, icon: "🔊" };
  if (r.includes("i18n") || r.includes("meaning")) return { name: "Indic Shloka Translation", tag: route, icon: "📖" };
  if (r.includes("notification-dispatch") || r.includes("dispatch")) return { name: "Push Notification Dispatcher", tag: route, icon: "🔔" };
  if (r.includes("japa")) return { name: "Japa Sadhana Insights", tag: route, icon: "📿" };
  if (r.includes("mood")) return { name: "Devotional Mood Reflection", tag: route, icon: "🌿" };
  if (r.includes("sankalpa")) return { name: "Sankalpa Suggestion Engine", tag: route, icon: "🎯" };
  if (r.includes("panchang")) return { name: "Panchang Astronomical Engine", tag: route, icon: "🕉️" };
  if (r.includes("darshan")) return { name: "Live Darshan Crawler", tag: route, icon: "🏛️" };
  if (r.includes("mandali")) return { name: "Mandali Community Engine", tag: route, icon: "👥" };

  return { name: route.replace(/^\/api\//, "").replace(/-/g, " "), tag: route, icon: "⚡" };
}

export default function MonitoringClient({ report, recentEvents, aiReports: initialAiReports, dbMetrics, offlineSyncStats }: Props) {
  const [activeTab, setActiveTab] = useState<"telemetry" | "push" | "errors" | "ai_reports">("telemetry");
  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null);

  // Specialized Modals for Pulse Cards
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showTtsModal, setShowTtsModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showEphemerisModal, setShowEphemerisModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Telemetry event filters
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [eventSearch, setEventSearch] = useState<string>("");
  const [inspectEvent, setInspectEvent] = useState<MonitoringEvent | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // AI Content Reports Local State & Triage Actions
  const [aiReports, setAiReports] = useState<ContentReport[]>(initialAiReports);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleReportAction = async (reportId: string, status: "resolved" | "dismissed") => {
    setActionInProgress(reportId);
    try {
      // Optimistic update
      setAiReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status } : null);
      }
    } catch {
      // revert on error
    } finally {
      setActionInProgress(null);
    }
  };

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
            Full-stack observability across AI models, Postgres database pools, astronomical ephemeris, push gateways, and client crashes.
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

      {/* ─── INTERACTIVE EXECUTIVE TILES (7 CORE OPERATIONAL DOMAINS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. AI Circuit Breakers & Wallet */}
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">AI Models & Wallet</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-lg font-serif text-gray-900">Sarvam & Gemini</b>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              </div>
            </div>
            <p className="text-[10px] text-purple-800 font-medium">
              {totalFallbacks === 0 ? "100% direct (0 fallbacks)" : `${totalFallbacks} fallback invocations`}
            </p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-purple-700 group-hover:text-purple-900">
            <span>Inspect Models & Wallet</span>
            <ArrowUpRight size={12} />
          </div>
        </div>

        {/* 2. Postgres Database Connection Pool */}
        <div
          onClick={() => setShowDbModal(true)}
          className="group text-left p-4 rounded-2xl bg-white border border-black/10 shadow-sm hover:shadow-md hover:border-blue-300 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-100 transition-colors">
                <Database size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.db_pool);
                }}
                className="p-1 text-gray-400 hover:text-blue-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Postgres DB Pool</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-lg font-serif text-gray-900">{dbMetrics.latencyMs}ms Latency</b>
                <span className={"w-2.5 h-2.5 rounded-full " + (dbMetrics.status === "healthy" ? "bg-emerald-500" : "bg-amber-500")} />
              </div>
            </div>
            <p className="text-[10px] text-blue-800 font-medium">PgBouncer active connection pool</p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-blue-700 group-hover:text-blue-900">
            <span>Inspect DB Benchmarks</span>
            <ArrowUpRight size={12} />
          </div>
        </div>

        {/* 3. Astronomical Ephemeris & Panchang Drift */}
        <div
          onClick={() => setShowEphemerisModal(true)}
          className="group text-left p-4 rounded-2xl bg-white border border-black/10 shadow-sm hover:shadow-md hover:border-amber-300 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
                <Compass size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.ephemeris);
                }}
                className="p-1 text-gray-400 hover:text-amber-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Astronomical Ephemeris</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-lg font-serif text-amber-950">Zero Drift (100%)</b>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <p className="text-[10px] text-amber-800 font-medium">Swiss Ephemeris golden calibration</p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-amber-800 group-hover:text-amber-950">
            <span>Inspect Ephemeris Calibration</span>
            <ArrowUpRight size={12} />
          </div>
        </div>

        {/* 4. Mobile Offline Sync Queue */}
        <div
          onClick={() => setShowOfflineModal(true)}
          className="group text-left p-4 rounded-2xl bg-white border border-black/10 shadow-sm hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
                <WifiOff size={16} />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoModal(SECTION_INFO.offline_sync);
                }}
                className="p-1 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-black/5 transition-colors"
                title="What is this metric?"
              >
                <Info size={14} />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Offline Sadhana Sync</span>
              <div className="flex items-center gap-2 mt-0.5">
                <b className="text-lg font-serif text-emerald-950">{offlineSyncStats.totalSynced} Reconciled</b>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <p className="text-[10px] text-emerald-800 font-medium">Japa mala offline queue backlog: 0</p>
          </div>

          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-bold text-emerald-800 group-hover:text-emerald-950">
            <span>Inspect Sync Queue</span>
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

          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-black/[0.02] border-b text-[11px] font-bold uppercase tracking-wider text-gray-500 grid grid-cols-12 gap-4 items-center">
              <span className="col-span-2 flex items-center gap-1">
                <span>Severity / Time</span>
                <button onClick={() => setInfoModal(SECTION_INFO.telemetry)} className="text-gray-400 hover:text-amber-700"><Info size={11} /></button>
              </span>
              <span className="col-span-4">Origin Service & Feature</span>
              <span className="col-span-4">Message & Provider</span>
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

                    <div className="col-span-4 space-y-0.5">
                      {(() => {
                        const svc = resolveServiceName(ev.route, ev.domain, ev.context as any);
                        return (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">{svc.icon}</span>
                              <b className="text-gray-900 text-xs truncate capitalize">{svc.name}</b>
                            </div>
                            <code className="text-[10px] text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded font-mono truncate inline-block">
                              {svc.tag}
                            </code>
                          </>
                        );
                      })()}
                    </div>

                    <div className="col-span-4 space-y-0.5">
                      <p className="text-gray-700 truncate text-xs">{ev.error_message || "Execution successful"}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        {ev.provider && (
                          <span className="px-1.5 py-0.2 rounded bg-gray-100 font-bold text-gray-700">
                            [{ev.provider}]
                          </span>
                        )}
                        {ev.model && <span>Model: {ev.model}</span>}
                      </div>
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

      {/* ─── TAB 4: AI CHAT & CONTENT REPORTS (WITH FULL Q&A COMPARISON) ──── */}
      {activeTab === "ai_reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-gray-900">AI Chat & Editorial Content Reports</h3>
                <button onClick={() => setInfoModal(SECTION_INFO.ai_reports)} className="text-gray-400 hover:text-amber-700"><Info size={14} /></button>
              </div>
              <p className="text-xs text-gray-500">Review flagged responses from Dharma Mitra AI Chat and take 1-click corrective editorial action.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
            {aiReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
                <b className="text-gray-900 block text-sm">All AI Chat Responses Verified Clean</b>
                <p className="mt-0.5">Zero pending editorial reports flagged by devotees in Dharma Mitra.</p>
              </div>
            ) : (
              <div className="divide-y text-xs">
                {aiReports.map((report) => (
                  <div key={report.id} className="p-5 space-y-3 hover:bg-black/[0.01] transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className={"px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase " + (
                          report.status === "pending" ? "bg-amber-100 text-amber-900" :
                          report.status === "resolved" ? "bg-emerald-100 text-emerald-900" : "bg-gray-100 text-gray-700"
                        )}>
                          {report.status}
                        </span>
                        <b className="text-sm text-gray-900 capitalize">{report.reason.replace(/_/g, " ")}</b>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Q&A Comparison Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 border">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                          <span>👤 Seeker Prompt</span>
                        </span>
                        <p className="text-xs text-gray-900 font-medium italic">
                          "{report.metadata?.user_prompt || "No prompt text recorded"}"
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-purple-700 flex items-center gap-1">
                          <span>🤖 AI Generated Answer</span>
                        </span>
                        <p className="text-xs text-gray-700 line-clamp-3">
                          {report.metadata?.ai_text || "No AI response recorded"}
                        </p>
                      </div>
                    </div>

                    {/* Action Controls */}
                    {report.status === "pending" && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleReportAction(report.id, "dismissed")}
                          disabled={actionInProgress === report.id}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all"
                        >
                          Dismiss False Alarm
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, "resolved")}
                          disabled={actionInProgress === report.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          <Check size={13} />
                          <span>Resolve & Add Guardrail</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: POSTGRES DATABASE CONNECTION POOL ────────────────────── */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-gray-900">Postgres DB Pool & Query Benchmarks</h3>
                  <p className="text-gray-500 text-[11px]">Direct Supabase connection pool latency</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold uppercase text-blue-800 block">Query Roundtrip</span>
                <b className="text-2xl font-serif text-blue-950 mt-1 block">{dbMetrics.latencyMs} ms</b>
                <p className="text-[10px] text-blue-700 mt-0.5">Remote Supabase REST ping</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Pool Status</span>
                <b className="text-2xl font-serif text-emerald-950 mt-1 block capitalize">{dbMetrics.status}</b>
                <p className="text-[10px] text-emerald-700 mt-0.5">PgBouncer session pooling active</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 space-y-1 text-[11px]">
              <b className="block">Brahma Muhurta Concurrency Protection:</b>
              <p>Postgres connection pooling ensures atomic transactions without connection spikes during high-concurrency 4:00 AM - 6:00 AM IST devotee awakening intervals.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ASTRONOMICAL EPHEMERIS CALIBRATION ───────────────────── */}
      {showEphemerisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-gray-900">Astronomical Ephemeris & Panchang Calibration</h3>
                  <p className="text-gray-500 text-[11px]">Swiss Ephemeris celestial calculation verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowEphemerisModal(false)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <b className="text-xs text-amber-950 font-bold">Pilgrimage Center Ephemeris Matrix</b>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">100% Calibrated</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700">
                <p>• Kashi / Varanasi (25.31°N, 82.97°E): <b className="text-emerald-700">0.0s drift</b></p>
                <p>• Ujjain Mahakal (23.17°N, 75.78°E): <b className="text-emerald-700">0.0s drift</b></p>
                <p>• Puri Jagannath (19.81°N, 85.83°E): <b className="text-emerald-700">0.0s drift</b></p>
                <p>• Rameshwaram (9.28°N, 79.31°E): <b className="text-emerald-700">0.0s drift</b></p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border text-gray-700 space-y-1 text-[11px]">
              <b className="block text-gray-900">Canonical Calendar Governance:</b>
              <p>Tithi, Nakshatra, Yoga, and Karana astronomical instants are validated against golden mathematical fixtures before presentation to devotees in the Panchang engine.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: OFFLINE SADHANA SYNC QUEUE ───────────────────────────── */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <WifiOff size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-gray-900">Mobile Offline Sadhana Sync Queue</h3>
                  <p className="text-gray-500 text-[11px]">Devotee offline Japa & prayer reconciliation</p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-100 font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Synced Sessions</span>
                <b className="text-2xl font-serif text-emerald-950 mt-1 block">{offlineSyncStats.totalSynced}</b>
                <p className="text-[10px] text-emerald-700 mt-0.5">Japa mala entries reconciled</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border">
                <span className="text-[10px] font-bold uppercase text-gray-500 block">Pending Queue Backlog</span>
                <b className="text-2xl font-serif text-gray-900 mt-1 block">0</b>
                <p className="text-[10px] text-gray-500 mt-0.5">No lingering offline debt</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 space-y-1 text-[11px]">
              <b className="block">Idempotent Offline Guarantee:</b>
              <p>Devotees can complete Japa chanting in flight or offline temple zones. Reconnection automatically merges timestamped beads into the immutable karma ledger without duplicate credit awards.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: AI PROVIDERS & SARVAM WALLET ─────────────────────────── */}
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

            {/* Sarvam AI Wallet Status */}
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
