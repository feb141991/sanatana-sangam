'use client';

import { useState, useMemo, useEffect } from "react";
import {
  Globe, CheckCircle2, AlertTriangle, XCircle, Clock,
  RefreshCw, Search, Filter, Copy, ExternalLink, Zap,
  ChevronDown, ChevronUp, Terminal, Shield, ArrowUpDown,
  Sparkles, Moon, Sun, Flame, Database, Compass, Bell, User, Check,
  Activity, Layers, Hash
} from "lucide-react";
import type { MonitoringEvent } from "@/lib/monitoring/events";

export interface ApiEndpointDef {
  id: string;
  path: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  name: string;
  domain: "calendar" | "jyotish" | "ai" | "sadhana" | "community" | "notifications" | "auth" | "system";
  domainLabel: string;
  auth: "public" | "bearer_or_cookie" | "bearer_required" | "admin_only";
  description: string;
  cachePolicy?: string;
  sampleQueryOrBody?: string;
  safeProbeEndpoint?: string;
  safeProbeMethod?: "GET" | "POST";
}

export const API_CATALOG: ApiEndpointDef[] = [
  {
    id: "calendar-upcoming",
    path: "/api/calendar/upcoming",
    method: "GET",
    name: "Upcoming Observances & Story Cards",
    domain: "calendar",
    domainLabel: "Calendar & Panchang",
    auth: "bearer_or_cookie",
    description: "Returns verified spiritual observances, fasting days, festival series and published story cards for a rolling 7-60 day window qualified by user profile and tradition.",
    cachePolicy: "Dynamic (User & Tradition Qualified)",
    sampleQueryOrBody: "?days=14&tradition=all&tz=Asia/Kolkata",
    safeProbeEndpoint: "/api/calendar/upcoming?days=7",
    safeProbeMethod: "GET",
  },
  {
    id: "calendar-month",
    path: "/api/calendar/month",
    method: "GET",
    name: "Monthly Calendar Matrix",
    domain: "calendar",
    domainLabel: "Calendar & Panchang",
    auth: "bearer_or_cookie",
    description: "Computes full month calendar matrix with tithi transitions, sunrise/sunset, and tradition-qualified festivals.",
    cachePolicy: "s-maxage=3600 (Per Month)",
    sampleQueryOrBody: "?month=2026-09&tz=Asia/Kolkata",
    safeProbeEndpoint: "/api/calendar/month?month=2026-09",
    safeProbeMethod: "GET",
  },
  {
    id: "calendar-day",
    path: "/api/calendar/day",
    method: "GET",
    name: "Daily Observance & Tithi Context",
    domain: "calendar",
    domainLabel: "Calendar & Panchang",
    auth: "bearer_or_cookie",
    description: "Detailed astronomical day breakdown for a single civil/spiritual date with muhurtas and rituals.",
    cachePolicy: "s-maxage=1800",
    sampleQueryOrBody: "?date=2026-09-01&tz=Asia/Kolkata",
    safeProbeEndpoint: "/api/calendar/day?date=2026-09-01",
    safeProbeMethod: "GET",
  },
  {
    id: "panchang-core",
    path: "/api/panchang",
    method: "GET",
    name: "Panchang Astronomical Engine",
    domain: "calendar",
    domainLabel: "Calendar & Panchang",
    auth: "public",
    description: "Swiss Ephemeris / Panchang Engine core calculating 5 angas (Tithi, Vara, Nakshatra, Yoga, Karana), Rahu Kalam, and auspicious windows.",
    cachePolicy: "s-maxage=3600, stale-while-revalidate=86400",
    sampleQueryOrBody: "?lat=23.1765&lon=75.7885&tz=Asia/Kolkata",
    safeProbeEndpoint: "/api/panchang",
    safeProbeMethod: "GET",
  },
  {
    id: "vrat-occurrence",
    path: "/api/vrat/occurrence",
    method: "GET",
    name: "Vrat & Fasting Occurrence Resolver",
    domain: "calendar",
    domainLabel: "Calendar & Panchang",
    auth: "bearer_or_cookie",
    description: "Resolves next occurrence and parana breaking-fast windows for Ekadashi, Pradosham, Sankashti, and regional vrats.",
    cachePolicy: "s-maxage=3600",
    sampleQueryOrBody: "?slug=ekadashi",
    safeProbeEndpoint: "/api/vrat/occurrence?slug=ekadashi",
    safeProbeMethod: "GET",
  },
  {
    id: "jyotish-kundali",
    path: "/api/jyotish/kundali",
    method: "POST",
    name: "Vedic Kundali & Birth Chart Engine",
    domain: "jyotish",
    domainLabel: "Jyotish & Ephemeris",
    auth: "bearer_or_cookie",
    description: "Computes Lagna chart, Bhavas, Navamsha (D9), Vimshottari Dasha, Planetary dignities, and Shadbala from birth coordinates.",
    cachePolicy: "Client-side / Database persisted",
    sampleQueryOrBody: JSON.stringify({ name: "Seeker", dob: "1991-02-14", tob: "06:30", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" }, null, 2),
    safeProbeEndpoint: "/api/jyotish/kundali",
    safeProbeMethod: "POST",
  },
  {
    id: "ai-chat",
    path: "/api/ai/chat",
    method: "POST",
    name: "Pramana AI Dharma Guru",
    domain: "ai",
    domainLabel: "AI & Dharma Knowledge",
    auth: "bearer_or_cookie",
    description: "Multi-tiered AI Dharma Q&A with Sarvam AI primary, Google Gemini & OpenAI fallbacks, scripture vector grounding, and tradition guardrails.",
    cachePolicy: "Semantic Embedding Cache (Supabase pgvector)",
    sampleQueryOrBody: JSON.stringify({ message: "What is Nishkama Karma?", tradition: "sanatan" }, null, 2),
    safeProbeEndpoint: "/api/ai/chat",
    safeProbeMethod: "POST",
  },
  {
    id: "tts-audio",
    path: "/api/tts",
    method: "POST",
    name: "Sanskrit Shloka & Mantra Audio Voice Generator",
    domain: "ai",
    domainLabel: "AI & Dharma Knowledge",
    auth: "public",
    description: "Generates authentic Sanskrit and Indic voice audio recitations for Gita shlokas and mantras with edge caching.",
    cachePolicy: "Edge CDN Cached (Cloudflare / Supabase Storage)",
    sampleQueryOrBody: JSON.stringify({ text: "ॐ नमः शिवाय", language: "sa" }, null, 2),
    safeProbeEndpoint: "/api/tts",
    safeProbeMethod: "POST",
  },
  {
    id: "dharm-veer-roster",
    path: "/api/dharm-veer/roster",
    method: "GET",
    name: "Dharm Veer Daily Hero Roster",
    domain: "sadhana",
    domainLabel: "Sadhana & Japa",
    auth: "public",
    description: "Curated Dharmic spiritual icons, warriors, and saints across Sanatan, Sikh, Jain, and Buddhist traditions.",
    cachePolicy: "public, s-maxage=3600, stale-while-revalidate=86400",
    sampleQueryOrBody: "?tradition=all",
    safeProbeEndpoint: "/api/dharm-veer/roster",
    safeProbeMethod: "GET",
  },
  {
    id: "sadhana-daily",
    path: "/api/sadhana/daily",
    method: "GET",
    name: "Daily Sadhana Habits & Checklists",
    domain: "sadhana",
    domainLabel: "Sadhana & Japa",
    auth: "bearer_or_cookie",
    description: "Devotee daily sadhana tracking, morning meditation, Gita recitation, and spiritual streak calculation.",
    cachePolicy: "Private per User",
    sampleQueryOrBody: "?date=today",
  },
  {
    id: "japa-sync",
    path: "/api/japa/sync",
    method: "POST",
    name: "Japa Mala Sadhana Sync & Ledger",
    domain: "sadhana",
    domainLabel: "Sadhana & Japa",
    auth: "bearer_or_cookie",
    description: "Atomic batch synchronization for offline/online Japa mala counters, mantra completions, and devotee karma points.",
    cachePolicy: "Atomic DB Write (Idempotent)",
    sampleQueryOrBody: JSON.stringify({ mantraId: "om-namah-shivaya", beadCount: 108, completedAt: "2026-08-31T03:00:00Z" }, null, 2),
  },
  {
    id: "mandali-posts",
    path: "/api/mandali/posts",
    method: "GET",
    name: "Mandali Community Feed & Reflections",
    domain: "community",
    domainLabel: "Mandali Community",
    auth: "public",
    description: "Sacred community reflections, satsang discussions, spiritual questions, and dharmic insights with RLS.",
    cachePolicy: "s-maxage=60, stale-while-revalidate=300",
    sampleQueryOrBody: "?limit=20&filter=trending",
  },
  {
    id: "mandali-comments",
    path: "/api/mandali/comments",
    method: "GET",
    name: "Mandali Comments & Multi-Type Reactions",
    domain: "community",
    domainLabel: "Mandali Community",
    auth: "public",
    description: "Threaded discussions on community posts with Pranam, Love, and Insightful reaction tallies.",
    cachePolicy: "s-maxage=30",
    sampleQueryOrBody: "?postId=123",
  },
  {
    id: "notifications-dispatch",
    path: "/api/notifications/dispatch",
    method: "POST",
    name: "Push Notification Gateway Dispatcher",
    domain: "notifications",
    domainLabel: "Push & Notifications",
    auth: "admin_only",
    description: "Dispatches Brahma Muhurta, Sandhya, Tithi, and Festival push notifications across Apple APNs and Google FCM via Expo.",
    cachePolicy: "No-Store",
    sampleQueryOrBody: JSON.stringify({ type: "brahma_muhurta", dryRun: true }, null, 2),
  },
  {
    id: "user-profile",
    path: "/api/user/profile",
    method: "GET",
    name: "User Profile & Dharma Preferences",
    domain: "auth",
    domainLabel: "Auth & Profile",
    auth: "bearer_or_cookie",
    description: "Fetches user identity, spiritual tradition, sampradaya, regional calendar system, notification preferences, and saved locations.",
    cachePolicy: "Private per User",
    sampleQueryOrBody: "Bearer <token>",
  },
  {
    id: "apple-revoke",
    path: "/api/auth/apple/revoke",
    method: "POST",
    name: "Apple TN3194 Account Revocation & Deletion",
    domain: "auth",
    domainLabel: "Auth & Profile",
    auth: "bearer_or_cookie",
    description: "Apple App Store Review guideline 5.1.1(v) compliant server-to-server token revocation and GDPR/Data Deletion handler.",
    cachePolicy: "No-Store",
    sampleQueryOrBody: JSON.stringify({ confirmDeletion: true }, null, 2),
  },
  {
    id: "admin-stats",
    path: "/api/admin/stats",
    method: "GET",
    name: "Platform Telemetry & User Analytics",
    domain: "system",
    domainLabel: "System & Telemetry",
    auth: "admin_only",
    description: "Admin analytics on active users, daily sadhana completions, AI token usage, and database health.",
    cachePolicy: "s-maxage=120",
    safeProbeEndpoint: "/api/admin/stats",
    safeProbeMethod: "GET",
  },
  {
    id: "csp-report",
    path: "/api/csp-report",
    method: "POST",
    name: "CSP Browser Security Violation Ingest",
    domain: "system",
    domainLabel: "System & Telemetry",
    auth: "public",
    description: "Ingests Content Security Policy violation reports from browsers and stores security telemetry.",
    cachePolicy: "No-Store",
  },
];

interface ProbeStatus {
  status: number;
  ok: boolean;
  statusText: string;
  latencyMs: number;
  timestamp: string;
  error?: string;
  responsePreview?: string;
  headers?: {
    region?: string;
    cacheControl?: string;
    contentType?: string;
  };
}

interface Props {
  recentEvents: MonitoringEvent[];
}

export default function ApiMonitoringSection({ recentEvents }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [httpCodeFilter, setHttpCodeFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"status" | "latency" | "events" | "name">("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [probeResults, setProbeResults] = useState<Record<string, ProbeStatus>>({});
  const [probingAll, setProbingAll] = useState(false);
  const [probingSingle, setProbingSingle] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Aggregate stats per route from recentEvents (monitoring_events table)
  const telemetryByRoute = useMemo(() => {
    const map: Record<string, { totalEvents: number; errors: number; totalLatency: number; maxLatency: number; lastTimestamp?: string; lastError?: string; statusCodes: Record<string, number> }> = {};

    recentEvents.forEach((ev) => {
      const route = ev.route || "unknown";
      if (!map[route]) {
        map[route] = { totalEvents: 0, errors: 0, totalLatency: 0, maxLatency: 0, statusCodes: {} };
      }
      map[route].totalEvents += 1;
      const code = String(ev.error_code || "200");
      map[route].statusCodes[code] = (map[route].statusCodes[code] || 0) + 1;

      if (ev.severity === "P1" || ev.severity === "P2" || (ev.error_code && ev.error_code !== "200")) {
        map[route].errors += 1;
        if (ev.error_message) map[route].lastError = ev.error_message;
      }
      if (ev.latency_ms) {
        map[route].totalLatency += ev.latency_ms;
        if (ev.latency_ms > map[route].maxLatency) map[route].maxLatency = ev.latency_ms;
      }
      if (!map[route].lastTimestamp || ev.timestamp > map[route].lastTimestamp!) {
        map[route].lastTimestamp = ev.timestamp;
      }
    });

    return map;
  }, [recentEvents]);

  // Aggregate overall HTTP Status Code counts across live probes + telemetry
  const httpCodeCounts = useMemo(() => {
    const counts = {
      c200: 0,
      c201: 0,
      c304: 0,
      c400: 0,
      c401: 0,
      c403: 0,
      c429: 0,
      c500: 0,
      c504: 0,
      c4xx: 0,
      c5xx: 0,
    };

    // 1. From live probe results
    Object.values(probeResults).forEach((p) => {
      if (p.status === 200) counts.c200++;
      else if (p.status === 201) counts.c201++;
      else if (p.status === 304) counts.c304++;
      else if (p.status === 400) { counts.c400++; counts.c4xx++; }
      else if (p.status === 401) { counts.c401++; counts.c4xx++; }
      else if (p.status === 403) { counts.c403++; counts.c4xx++; }
      else if (p.status === 429) { counts.c429++; counts.c4xx++; }
      else if (p.status === 500) { counts.c500++; counts.c5xx++; }
      else if (p.status === 504) { counts.c504++; counts.c5xx++; }
      else if (p.status >= 400 && p.status < 500) counts.c4xx++;
      else if (p.status >= 500) counts.c5xx++;
    });

    // 2. From telemetry events
    recentEvents.forEach((ev) => {
      const code = String(ev.error_code || "200");
      if (code === "200") counts.c200++;
      else if (code === "401" || code === "403") { counts.c401++; counts.c4xx++; }
      else if (code === "429") { counts.c429++; counts.c4xx++; }
      else if (code === "500" || code === "P1" || code === "P2") { counts.c500++; counts.c5xx++; }
      else if (code === "504") { counts.c504++; counts.c5xx++; }
    });

    return counts;
  }, [probeResults, recentEvents]);

  // Run live probe for single endpoint
  const handleProbeEndpoint = async (endpointDef: ApiEndpointDef) => {
    const probePath = endpointDef.safeProbeEndpoint || endpointDef.path;
    const probeMethod = endpointDef.safeProbeMethod || endpointDef.method;

    setProbingSingle(endpointDef.id);
    try {
      const res = await fetch("/api/admin/api-probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: probePath, method: probeMethod }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setProbeResults((prev) => ({ ...prev, [endpointDef.id]: data.result }));
      } else {
        setProbeResults((prev) => ({
          ...prev,
          [endpointDef.id]: {
            status: 500,
            ok: false,
            statusText: "Probe Error",
            latencyMs: 0,
            timestamp: new Date().toISOString(),
            error: data.error || "Failed to probe",
          },
        }));
      }
    } catch (err: unknown) {
      setProbeResults((prev) => ({
        ...prev,
        [endpointDef.id]: {
          status: 500,
          ok: false,
          statusText: "Network Failed",
          latencyMs: 0,
          timestamp: new Date().toISOString(),
          error: err instanceof Error ? err.message : "Error",
        },
      }));
    } finally {
      setProbingSingle(null);
    }
  };

  // Run live probe for all testable endpoints
  const handleProbeAll = async () => {
    setProbingAll(true);
    try {
      const res = await fetch("/api/admin/api-probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        const next: Record<string, ProbeStatus> = {};
        data.results.forEach((r: any) => {
          const match = API_CATALOG.find((def) => (def.safeProbeEndpoint || def.path).startsWith(r.endpoint.split("?")[0]));
          if (match) {
            next[match.id] = r;
          }
        });
        setProbeResults((prev) => ({ ...prev, ...next }));
      }
    } catch {
      // ignore
    } finally {
      setProbingAll(false);
    }
  };

  // Auto-probe on initial load
  useEffect(() => {
    handleProbeAll();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered and Sorted list
  const filteredAndSortedApis = useMemo(() => {
    return API_CATALOG.filter((api) => {
      // Domain filter
      if (domainFilter !== "all" && api.domain !== domainFilter) return false;

      const probe = probeResults[api.id];
      const telem = telemetryByRoute[api.path];
      const hasError = (probe && !probe.ok) || (telem && telem.errors > 0);
      const isSlow = (probe && probe.latencyMs > 200) || (telem && telem.totalLatency / (telem.totalEvents || 1) > 200);

      // Status filter
      if (statusFilter === "healthy") {
        if (!probe || !probe.ok || isSlow) return false;
      } else if (statusFilter === "degraded") {
        if (!isSlow || hasError) return false;
      } else if (statusFilter === "error") {
        if (!hasError) return false;
      } else if (statusFilter === "unprobed") {
        if (probe) return false;
      }

      // Explicit HTTP Status Code filter
      if (httpCodeFilter !== "all") {
        if (httpCodeFilter === "200") {
          const is200 = probe?.status === 200 || telem?.statusCodes["200"];
          if (!is200) return false;
        } else if (httpCodeFilter === "4xx") {
          const is4xx = (probe && probe.status >= 400 && probe.status < 500) || (telem && (telem.statusCodes["401"] || telem.statusCodes["403"] || telem.statusCodes["400"] || telem.statusCodes["429"]));
          if (!is4xx) return false;
        } else if (httpCodeFilter === "5xx") {
          const is5xx = (probe && probe.status >= 500) || (telem && (telem.statusCodes["500"] || telem.statusCodes["504"] || telem.statusCodes["P1"]));
          if (!is5xx) return false;
        } else {
          const exactMatch = String(probe?.status) === httpCodeFilter || telem?.statusCodes[httpCodeFilter];
          if (!exactMatch) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPath = api.path.toLowerCase().includes(q);
        const matchesName = api.name.toLowerCase().includes(q);
        const matchesDesc = api.description.toLowerCase().includes(q);
        if (!matchesPath && !matchesName && !matchesDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      const probeA = probeResults[a.id];
      const probeB = probeResults[b.id];
      const telemA = telemetryByRoute[a.path];
      const telemB = telemetryByRoute[b.path];

      if (sortBy === "status") {
        const errorA = (!probeA?.ok && probeA) || telemA?.errors ? 2 : probeA?.latencyMs > 200 ? 1 : 0;
        const errorB = (!probeB?.ok && probeB) || telemB?.errors ? 2 : probeB?.latencyMs > 200 ? 1 : 0;
        return errorB - errorA;
      }
      if (sortBy === "latency") {
        const latA = probeA?.latencyMs ?? (telemA ? telemA.totalLatency / telemA.totalEvents : 0);
        const latB = probeB?.latencyMs ?? (telemB ? telemB.totalLatency / telemB.totalEvents : 0);
        return latB - latA;
      }
      if (sortBy === "events") {
        const evA = telemA?.totalEvents || 0;
        const evB = telemB?.totalEvents || 0;
        return evB - evA;
      }
      return a.path.localeCompare(b.path);
    });
  }, [domainFilter, statusFilter, httpCodeFilter, searchQuery, sortBy, probeResults, telemetryByRoute]);

  // Overall fleet stats
  const fleetSummary = useMemo(() => {
    let healthyCount = 0;
    let degradedCount = 0;
    let errorCount = 0;
    let totalLatency = 0;
    let probeCount = 0;

    API_CATALOG.forEach((api) => {
      const probe = probeResults[api.id];
      if (probe) {
        probeCount++;
        totalLatency += probe.latencyMs;
        if (!probe.ok || probe.status >= 400) {
          errorCount++;
        } else if (probe.latencyMs > 200) {
          degradedCount++;
        } else {
          healthyCount++;
        }
      }
    });

    const avgLatency = probeCount > 0 ? Math.round(totalLatency / probeCount) : 0;

    return {
      total: API_CATALOG.length,
      probed: probeCount,
      healthy: healthyCount,
      degraded: degradedCount,
      errors: errorCount,
      avgLatency,
    };
  }, [probeResults]);

  return (
    <div className="space-y-4">
      {/* ─── SUMMARY PULSE KPI CARDS (INTERACTIVE FILTERS) ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => { setStatusFilter("all"); setHttpCodeFilter("all"); }}
          className={"text-left p-3.5 rounded-2xl border shadow-sm space-y-1 transition-all cursor-pointer " + (
            statusFilter === "all" && httpCodeFilter === "all"
              ? "bg-white border-amber-600 ring-2 ring-amber-500/20 shadow-md scale-[1.02]"
              : "bg-white border-black/5 hover:scale-[1.01]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total APIs</span>
            <Globe size={15} className="text-gray-400" />
          </div>
          <div className="text-xl font-bold text-gray-900">{fleetSummary.total} Endpoints</div>
          <p className="text-[10px] text-gray-400 font-mono">Multi-region ({fleetSummary.probed} probed)</p>
        </button>

        <button
          onClick={() => { setStatusFilter(statusFilter === "healthy" ? "all" : "healthy"); setHttpCodeFilter("all"); }}
          className={"text-left p-3.5 rounded-2xl border shadow-sm space-y-1 transition-all cursor-pointer " + (
            statusFilter === "healthy"
              ? "bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md scale-[1.02]"
              : "bg-emerald-50/50 border-emerald-200/60 hover:scale-[1.01]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Healthy (200 OK)</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{fleetSummary.healthy}</div>
          <div className="flex items-center justify-between text-[10px] text-emerald-600 font-medium">
            <span>Fast (&le; 200ms)</span>
            <span className="text-[9px] font-bold bg-emerald-200/60 px-1 py-0.2 rounded">Filter</span>
          </div>
        </button>

        <button
          onClick={() => { setStatusFilter(statusFilter === "degraded" ? "all" : "degraded"); setHttpCodeFilter("all"); }}
          className={"text-left p-3.5 rounded-2xl border shadow-sm space-y-1 transition-all cursor-pointer " + (
            statusFilter === "degraded"
              ? "bg-amber-100/80 border-amber-500 ring-2 ring-amber-500/20 shadow-md scale-[1.02]"
              : "bg-amber-50/50 border-amber-200/60 hover:scale-[1.01]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Degraded / Slow</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">{fleetSummary.degraded}</div>
          <div className="flex items-center justify-between text-[10px] text-amber-600 font-medium">
            <span>&gt; 200ms latency</span>
            <span className="text-[9px] font-bold bg-amber-200/60 px-1 py-0.2 rounded">Filter</span>
          </div>
        </button>

        <button
          onClick={() => { setStatusFilter(statusFilter === "error" ? "all" : "error"); setHttpCodeFilter("all"); }}
          className={"text-left p-3.5 rounded-2xl border shadow-sm space-y-1 transition-all cursor-pointer " + (
            statusFilter === "error"
              ? "bg-rose-100/80 border-rose-500 ring-2 ring-rose-500/20 shadow-md scale-[1.02]"
              : "bg-rose-50/50 border-rose-200/60 hover:scale-[1.01]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Failing (4xx/5xx)</span>
            <XCircle size={15} className="text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{fleetSummary.errors}</div>
          <div className="flex items-center justify-between text-[10px] text-rose-600 font-medium">
            <span>{fleetSummary.errors === 0 ? "Zero errors" : "Needs triage"}</span>
            <span className="text-[9px] font-bold bg-rose-200/60 px-1 py-0.2 rounded">Filter</span>
          </div>
        </button>

        <div className="bg-white p-3.5 rounded-2xl border border-black/5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Avg Latency</span>
            <Zap size={15} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{fleetSummary.avgLatency} ms</div>
          <p className="text-[10px] text-gray-400 font-mono">BOM1 / FRA1 Fleet</p>
        </div>
      </div>

      {/* ─── INTERACTIVE HTTP STATUS CODE COUNTERS BAR ───────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-amber-700" />
            <span className="text-xs font-bold text-gray-900">Interactive HTTP Response Code Matrix</span>
            <span className="text-[10px] text-gray-400 font-mono">(Click any response code to filter)</span>
          </div>
          {httpCodeFilter !== "all" && (
            <button
              onClick={() => setHttpCodeFilter("all")}
              className="text-[11px] font-bold text-amber-800 hover:underline"
            >
              Reset Status Filter (Showing: {httpCodeFilter})
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setHttpCodeFilter(httpCodeFilter === "200" ? "all" : "200")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer " + (
              httpCodeFilter === "200"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-sm scale-105"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            )}
          >
            <CheckCircle2 size={12} />
            <span>200 OK: <strong>{httpCodeCounts.c200}</strong></span>
          </button>

          <button
            onClick={() => setHttpCodeFilter(httpCodeFilter === "201" ? "all" : "201")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer " + (
              httpCodeFilter === "201"
                ? "bg-blue-600 text-white border-blue-700 shadow-sm scale-105"
                : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
            )}
          >
            <span>201 Created: <strong>{httpCodeCounts.c201}</strong></span>
          </button>

          <button
            onClick={() => setHttpCodeFilter(httpCodeFilter === "304" ? "all" : "304")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer " + (
              httpCodeFilter === "304"
                ? "bg-amber-600 text-white border-amber-700 shadow-sm scale-105"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            )}
          >
            <span>304 Not Modified: <strong>{httpCodeCounts.c304}</strong></span>
          </button>

          <button
            onClick={() => setHttpCodeFilter(httpCodeFilter === "401" ? "all" : "401")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer " + (
              httpCodeFilter === "401"
                ? "bg-orange-600 text-white border-orange-700 shadow-sm scale-105"
                : "bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100"
            )}
          >
            <span>401 Unauthorized: <strong>{httpCodeCounts.c401}</strong></span>
          </button>

          <button
            onClick={() => setHttpCodeFilter(httpCodeFilter === "429" ? "all" : "429")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer " + (
              httpCodeFilter === "429"
                ? "bg-purple-600 text-white border-purple-700 shadow-sm scale-105"
                : "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
            )}
          >
            <span>429 Rate Limit: <strong>{httpCodeCounts.c429}</strong></span>
          </button>

          <button
            onClick={() => setHttpCodeFilter(httpCodeFilter === "500" ? "all" : "500")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer " + (
              httpCodeFilter === "500"
                ? "bg-rose-600 text-white border-rose-700 shadow-sm scale-105"
                : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
            )}
          >
            <XCircle size={12} />
            <span>500 Server Error: <strong>{httpCodeCounts.c500}</strong></span>
          </button>

          <button
            onClick={() => setHttpCodeFilter(httpCodeFilter === "504" ? "all" : "504")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer " + (
              httpCodeFilter === "504"
                ? "bg-red-700 text-white border-red-800 shadow-sm scale-105"
                : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
            )}
          >
            <Clock size={12} />
            <span>504 Gateway Timeout: <strong>{httpCodeCounts.c504}</strong></span>
          </button>
        </div>
      </div>

      {/* ─── CONTROLS & FILTER BAR ──────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by API path (/api/calendar/upcoming), name, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-600 bg-gray-50/50"
            />
          </div>

          {/* Probe All & Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-xl text-xs">
              <ArrowUpDown size={12} className="text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-gray-700 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="status">Sort: Status (Errors First)</option>
                <option value="latency">Sort: Latency (Slowest First)</option>
                <option value="events">Sort: Traffic (Most Active)</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
            </div>

            <button
              onClick={handleProbeAll}
              disabled={probingAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw size={13} className={probingAll ? "animate-spin" : ""} />
              <span>{probingAll ? "Probing Fleet..." : "⚡ Probe All APIs"}</span>
            </button>
          </div>
        </div>

        {/* Status & Domain Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-400 mr-1">Status:</span>
            {[
              { id: "all", label: "All Status" },
              { id: "healthy", label: "Healthy (200 OK)" },
              { id: "degraded", label: "Degraded (>200ms)" },
              { id: "error", label: "Errors (4xx/5xx)" },
              { id: "unprobed", label: "Unchecked" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer " + (
                  statusFilter === st.id
                    ? "bg-amber-800 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Domain Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-400 mr-1">Domain:</span>
            {[
              { id: "all", label: "All" },
              { id: "calendar", label: "Calendar & Panchang" },
              { id: "jyotish", label: "Jyotish" },
              { id: "ai", label: "AI & Media" },
              { id: "sadhana", label: "Sadhana & Japa" },
              { id: "community", label: "Community" },
              { id: "auth", label: "Auth & Account" },
              { id: "system", label: "System" },
            ].map((dom) => (
              <button
                key={dom.id}
                onClick={() => setDomainFilter(dom.id)}
                className={"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer " + (
                  domainFilter === dom.id
                    ? "bg-purple-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {dom.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── API ENDPOINTS TABLE / LIST ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50/80 border-b text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">Method</div>
          <div className="col-span-4">Endpoint & Service</div>
          <div className="col-span-2">Domain & Auth</div>
          <div className="col-span-2">Live Probe Status</div>
          <div className="col-span-2 text-right">Telemetry (24h)</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredAndSortedApis.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No API endpoints match the selected filters.
            </div>
          ) : (
            filteredAndSortedApis.map((api) => {
              const probe = probeResults[api.id];
              const telem = telemetryByRoute[api.path];
              const isExpanded = expandedId === api.id;
              const isProbing = probingSingle === api.id || probingAll;

              const statusColor = !probe
                ? "bg-gray-100 text-gray-600 border-gray-200"
                : !probe.ok || probe.status >= 400
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : probe.latencyMs > 200
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200";

              return (
                <div key={api.id} className="transition-colors hover:bg-amber-50/20">
                  <div className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center text-xs">
                    {/* Method */}
                    <div className="col-span-1">
                      <span
                        className={"px-2 py-0.5 rounded-md font-mono text-[10px] font-bold " + (
                          api.method === "GET"
                            ? "bg-blue-100 text-blue-800"
                            : api.method === "POST"
                            ? "bg-purple-100 text-purple-800"
                            : api.method === "PATCH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {api.method}
                      </span>
                    </div>

                    {/* Endpoint & Service Name */}
                    <div className="col-span-4 space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-xs truncate">{api.name}</span>
                      </div>
                      <code className="text-[11px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded truncate inline-block max-w-full">
                        {api.path}
                      </code>
                    </div>

                    {/* Domain & Auth */}
                    <div className="col-span-2 space-y-1">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold block w-fit">
                        {api.domainLabel}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Shield size={10} />
                        <span className="capitalize">{api.auth.replace(/_/g, " ")}</span>
                      </div>
                    </div>

                    {/* Live Probe Status */}
                    <div className="col-span-2 space-y-0.5">
                      {probe ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setHttpCodeFilter(String(probe.status))}
                            title="Filter by this HTTP code"
                            className={"px-2 py-0.5 rounded-lg border text-[11px] font-mono font-bold inline-flex items-center gap-1 hover:scale-105 transition-all cursor-pointer " + statusColor}
                          >
                            {probe.ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                            {probe.status} {probe.statusText}
                          </button>
                          <span className="font-mono text-[11px] text-gray-500 font-medium">
                            {probe.latencyMs}ms
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Not probed</span>
                      )}
                      {probe?.headers?.region && (
                        <p className="text-[9px] font-mono text-gray-400 truncate">
                          Region: {probe.headers.region.split("::")[0] || probe.headers.region}
                        </p>
                      )}
                    </div>

                    {/* 24h Telemetry */}
                    <div className="col-span-2 text-right space-y-0.5">
                      {telem ? (
                        <>
                          <div className="text-[11px] font-bold text-gray-800">
                            {telem.totalEvents} calls
                            {telem.errors > 0 && (
                              <span className="text-rose-600 ml-1 font-mono">({telem.errors} err)</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono">
                            Avg: {Math.round(telem.totalLatency / (telem.totalEvents || 1))}ms
                          </p>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400">0 events</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleProbeEndpoint(api)}
                        disabled={isProbing}
                        title="Probe this API"
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-40 transition-all cursor-pointer"
                      >
                        <RefreshCw size={13} className={probingSingle === api.id ? "animate-spin text-amber-800" : ""} />
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : api.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-all cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* ─── EXPANDED DETAILS DRAWER ──────────────────────────────── */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Description & Config */}
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-bold text-gray-900 text-xs">Endpoint Specification</h4>
                            <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{api.description}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                              <strong>Auth:</strong> {api.auth}
                            </span>
                            {api.cachePolicy && (
                              <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                                <strong>Cache:</strong> {api.cachePolicy}
                              </span>
                            )}
                          </div>

                          {/* Curl Snippet */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1">
                              <span>Curl Command</span>
                              <button
                                onClick={() => copyToClipboard(`curl -i -X ${api.method} "https://www.shoonaya.com${api.path}${api.sampleQueryOrBody?.startsWith("?") ? api.sampleQueryOrBody : ""}"`, api.id)}
                                className="flex items-center gap-1 text-amber-800 hover:underline cursor-pointer"
                              >
                                {copiedId === api.id ? <Check size={11} /> : <Copy size={11} />}
                                <span>{copiedId === api.id ? "Copied!" : "Copy Curl"}</span>
                              </button>
                            </div>
                            <pre className="p-2.5 rounded-xl bg-gray-900 text-amber-200 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                              {`curl -i -X ${api.method} "https://www.shoonaya.com${api.path}${api.sampleQueryOrBody?.startsWith("?") ? api.sampleQueryOrBody : ""}"`}
                            </pre>
                          </div>
                        </div>

                        {/* Live Probe Result & Telemetry Details */}
                        <div className="space-y-2 bg-white p-3.5 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-900 text-xs">Live Probe Response</h4>
                            <button
                              onClick={() => handleProbeEndpoint(api)}
                              disabled={isProbing}
                              className="px-2.5 py-1 rounded-lg bg-amber-800 text-white text-[11px] font-bold hover:bg-amber-900 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw size={11} className={probingSingle === api.id ? "animate-spin" : ""} />
                              <span>Ping Live</span>
                            </button>
                          </div>

                          {probe ? (
                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex items-center justify-between text-gray-600 font-mono">
                                <span>HTTP Status: <strong className={probe.ok ? "text-emerald-700" : "text-rose-700"}>{probe.status} {probe.statusText}</strong></span>
                                <span>Round-trip: <strong>{probe.latencyMs}ms</strong></span>
                              </div>
                              {probe.headers?.cacheControl && (
                                <p className="text-gray-500 font-mono truncate">Cache-Control: {probe.headers.cacheControl}</p>
                              )}
                              {probe.responsePreview && (
                                <div>
                                  <span className="text-gray-400 block mb-0.5 text-[10px]">Response Body Preview:</span>
                                  <pre className="p-2 rounded bg-gray-50 text-gray-800 font-mono text-[10px] max-h-24 overflow-y-auto whitespace-pre-wrap border">
                                    {probe.responsePreview}
                                  </pre>
                                </div>
                              )}
                              {probe.error && (
                                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[11px]">
                                  Error: {probe.error}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-400 italic text-[11px]">Click Ping Live above to probe this endpoint in real time.</p>
                          )}

                          {telem?.lastError && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <span className="text-[10px] font-bold text-rose-700 uppercase">Recent Telemetry Error:</span>
                              <p className="text-rose-600 text-[11px] font-mono mt-0.5">{telem.lastError}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
