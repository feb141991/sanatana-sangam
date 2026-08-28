"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, RefreshCw, User, Shield, ShieldAlert, Sparkles,
  Clock, Calendar, Bell, Heart, Flame, Flag, AlertTriangle,
  CheckCircle, XCircle, Search, Filter, ChevronDown, ChevronUp,
  Layers, MapPin, Send, Smartphone, FileText, Gift, Award,
  Check, Copy, Play, ArrowUpDown, ArrowUp, ArrowDown, Ban, UserCheck
} from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  sampradaya: string | null;
  tradition: string | null;
  ishta_devata: string | null;
  spiritual_level: string | null;
  timezone: string | null;
  shloka_streak: number;
  karma_points: number;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  is_deleting: boolean;
  deletion_requested_at: string | null;
  created_at: string;
  notification_quiet_hours_start: string | null;
  notification_quiet_hours_end: string | null;
  wants_festival_reminders: boolean;
  wants_shloka_reminders: boolean;
  wants_nitya_reminders: boolean;
}

interface LegalAcceptance {
  id: string;
  document: string;
  version: string;
  accepted_at: string;
  surface: string;
}

interface PushToken {
  id: string;
  token: string;
  platform: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

interface UserActivityEvent {
  id: string;
  domain: string;
  timestamp: string;
  title: string;
  subtitle?: string;
  badge: string;
  badgeColor: string;
  icon: string;
  rawDetail: Record<string, unknown>;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  send_at: string;
  notification_type: string;
  status: "pending" | "claimed" | "sent" | "failed";
  error: string | null;
  created_at: string;
  notification_key: string;
  metadata: Record<string, unknown> | null;
}

interface KarmaLedgerItem {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  earned_date: string;
  source_route: string | null;
  metadata: Record<string, unknown> | null;
}

interface UserDossier {
  profile: UserProfile;
  legalAcceptances: LegalAcceptance[];
  pushTokens: PushToken[];
  pushEvents: any[];
  timeline: UserActivityEvent[];
  notifications: ScheduledNotification[];
  karma: {
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
    ledger: KarmaLedgerItem[];
    awards: any[];
  };
  moderation: {
    kuls: any[];
    reports: any[];
    warnings: any[];
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;

  const [dossier, setDossier] = useState<UserDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "notifications" | "karma" | "moderation" | "compliance">("timeline");

  // Timeline filters
  const [timelineDomain, setTimelineDomain] = useState<string>("all");
  const [timelineSearch, setTimelineSearch] = useState<string>("");
  const [timelineSort, setTimelineSort] = useState<"desc" | "asc">("desc");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Karma Adjustment Modal
  const [showKarmaModal, setShowKarmaModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [adjustingKarma, setAdjustingKarma] = useState(false);

  // Inspector Modal
  const [inspectItem, setInspectItem] = useState<{ title: string; payload: Record<string, unknown> } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const fetchDossier = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch user dossier (${res.status})`);
      }
      const data = await res.json();
      setDossier(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchDossier();
  }, [fetchDossier]);

  const handleAdjustKarma = async () => {
    if (!adjustAmount || !adjustReason.trim()) {
      toast.error("Please provide a valid points amount and reason");
      return;
    }
    setAdjustingKarma(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: adjustAmount, reason: adjustReason }),
      });
      if (!res.ok) throw new Error("Adjustment failed");
      toast.success(`Adjusted karma by ${adjustAmount > 0 ? "+" : ""}${adjustAmount} points`);
      setShowKarmaModal(false);
      setAdjustReason("");
      void fetchDossier();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust karma");
    } finally {
      setAdjustingKarma(false);
    }
  };

  // Filtered Timeline
  const filteredTimeline = useMemo(() => {
    if (!dossier?.timeline) return [];
    let list = dossier.timeline.filter((item) => {
      if (timelineDomain !== "all" && item.domain !== timelineDomain) return false;
      if (timelineSearch.trim()) {
        const q = timelineSearch.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return timelineSort === "desc" ? tB - tA : tA - tB;
    });

    return list;
  }, [dossier, timelineDomain, timelineSearch, timelineSort]);

  if (loading && !dossier) {
    return (
      <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-amber-600 mx-auto" />
          <p className="text-sm font-bold text-gray-700">Loading Seeker Dossier & Multi-Domain Ledger...</p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] p-6 flex items-center justify-center">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-rose-200 shadow-sm text-center space-y-4">
          <AlertTriangle size={32} className="text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">User Dossier Unavailable</h2>
          <p className="text-xs text-gray-600">{error || "User could not be found."}</p>
          <Link href="/admin/users" className="inline-block px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold">
            Back to Seeker Directory
          </Link>
        </div>
      </div>
    );
  }

  const p = dossier.profile;

  return (
    <div className="min-h-screen bg-[var(--divine-bg,#FAF6EF)] font-outfit pb-24">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-[var(--divine-bg,#FAF6EF)]/90 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-[var(--brand-muted)] hover:text-gray-900 text-xs font-bold transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to Seekers</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif theme-ink leading-tight">
                  {p.full_name || p.username || "Anonymous Seeker"}
                </h1>
                {p.is_admin && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase">
                    Admin
                  </span>
                )}
                {p.is_banned ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                    Banned
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-gray-500">ID: {p.id}</p>
            </div>
          </div>

          <button
            onClick={() => void fetchDossier()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10 text-xs font-bold theme-ink hover:border-[var(--premium-gold)] transition-all shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-amber-600" : ""} />
            <span>Refresh Dossier</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* DPDP Deletion Warning Banner */}
        {p.is_deleting && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-700 shrink-0" />
            <div>
              <b className="font-bold">⚠️ Account Deletion Pending (DPDP Cooling Period):</b>
              <p className="mt-0.5">
                Deletion requested on {p.deletion_requested_at ? new Date(p.deletion_requested_at).toLocaleDateString() : "N/A"}. Scheduled for permanent cryptographic purge after the cooling-off period.
              </p>
            </div>
          </div>
        )}

        {/* ─── IDENTITY & COMPLIANCE HEADER CARD ──────────────────────────── */}
        <div className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Identity Vitals */}
            <div className="md:col-span-2 flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-800 font-serif font-bold text-2xl flex items-center justify-center border border-amber-200 shrink-0">
                {p.full_name ? p.full_name[0].toUpperCase() : p.username ? p.username[0].toUpperCase() : "🕉️"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-serif text-gray-900">{p.full_name || "No name set"}</h2>
                  <span className="text-xs font-mono text-gray-500">@{p.username || "anonymous"}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{p.bio || "No spiritual bio provided."}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-amber-600" />
                    <span>{p.city ? `${p.city}, ${p.country || ""}` : "Location hidden"}</span>
                  </span>
                  <span>•</span>
                  <span>Timezone: <b>{p.timezone || "Asia/Kolkata"}</b></span>
                  <span>•</span>
                  <span>Joined: <b>{new Date(p.created_at).toLocaleDateString()}</b></span>
                </div>
              </div>
            </div>

            {/* Devotional Alignment */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Spiritual Profile</span>
              <p>Tradition: <b className="text-gray-900">{p.tradition || "Sanatan"}</b></p>
              <p>Sampradaya: <b className="text-gray-900">{p.sampradaya || "Universal"}</b></p>
              <p>Ishta Devata: <b className="text-gray-900">{p.ishta_devata || "Universal"}</b></p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Karma Punya</span>
                <b className="text-base text-amber-700">{p.karma_points || 0}</b>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Shloka Streak</span>
                <b className="text-base text-emerald-700">{p.shloka_streak || 0}d</b>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATION ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-black/10 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("timeline")}
            className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
              activeTab === "timeline"
                ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            <Layers size={14} />
            <span>Devotional Activity Timeline ({dossier.timeline.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
              activeTab === "notifications"
                ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            <Bell size={14} />
            <span>Notification & Push Ledger ({dossier.notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("karma")}
            className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
              activeTab === "karma"
                ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            <Award size={14} />
            <span>Karma & Rewards Reconciler</span>
          </button>

          <button
            onClick={() => setActiveTab("moderation")}
            className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
              activeTab === "moderation"
                ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            <Shield size={14} />
            <span>Social & Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab("compliance")}
            className={"flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap " + (
              activeTab === "compliance"
                ? "border-amber-600 text-amber-900 bg-amber-500/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-900"
            )}
          >
            <Smartphone size={14} />
            <span>Devices & Legal ToS</span>
          </button>
        </div>

        {/* ─── TAB 1: UNIFIED DEVOTIONAL ACTIVITY TIMELINE ─────────────────── */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {/* Timeline Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { key: "all", label: "All Events" },
                  { key: "japa", label: "📿 Japa" },
                  { key: "nitya", label: "🌅 Nitya" },
                  { key: "mood", label: "🌿 Mood" },
                  { key: "quiz", label: "🧠 Quiz" },
                  { key: "sankalpa", label: "🎯 Sankalpa" },
                  { key: "tirtha", label: "🏛️ Tirtha" },
                  { key: "karma", label: "✨ Karma" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTimelineDomain(item.key)}
                    className={"px-2.5 py-1 rounded-lg font-bold text-xs transition-all " + (
                      timelineDomain === item.key
                        ? "bg-amber-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search actions or notes..."
                    value={timelineSearch}
                    onChange={(e) => setTimelineSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-black/10 text-xs focus:outline-none focus:border-amber-500 bg-gray-50/50"
                  />
                </div>

                <button
                  onClick={() => setTimelineSort(timelineSort === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  <ArrowUpDown size={12} />
                  <span>{timelineSort === "desc" ? "Newest" : "Oldest"}</span>
                </button>
              </div>
            </div>

            {/* Timeline Stream */}
            {filteredTimeline.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-black/5 text-xs text-gray-400 space-y-2">
                <Layers size={24} className="mx-auto text-gray-300" />
                <p>No activity events match the selected filters for this seeker.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm divide-y overflow-hidden">
                {filteredTimeline.map((event) => {
                  const isExpanded = expandedEventId === event.id;
                  return (
                    <div key={event.id} className="p-4 hover:bg-black/[0.01] transition-colors space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="text-xl p-2 rounded-xl bg-gray-50 border shrink-0">
                            {event.icon}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <b className="text-sm text-gray-900">{event.title}</b>
                              <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold border " + event.badgeColor}>
                                {event.badge}
                              </span>
                            </div>
                            {event.subtitle && (
                              <p className="text-xs text-gray-600">{event.subtitle}</p>
                            )}
                            <p className="text-[10px] font-mono text-gray-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setInspectItem({ title: event.title, payload: event.rawDetail })}
                            className="px-2.5 py-1 rounded-lg border text-[11px] font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                          >
                            <span>Inspect JSON</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: NOTIFICATION & PUSH LEDGER ───────────────────────────── */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Per-User Notification Dispatch Tracer</h3>
                <p className="text-xs text-gray-500">
                  Every scheduled alert, quiet hours evaluation, and push delivery result for this specific seeker.
                </p>
              </div>
              <div className="text-xs text-right font-mono text-gray-600">
                Quiet Hours: <b>{p.notification_quiet_hours_start || "22:00"}</b> to <b>{p.notification_quiet_hours_end || "06:00"}</b>
              </div>
            </div>

            {dossier.notifications.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-black/5 text-xs text-gray-400 space-y-2">
                <Bell size={24} className="mx-auto text-gray-300" />
                <p>No notifications scheduled or dispatched for this seeker yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm divide-y overflow-hidden">
                {dossier.notifications.map((n) => (
                  <div key={n.id} className="p-4 hover:bg-black/[0.01] transition-colors space-y-1.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <b className="text-sm text-gray-900">{n.title}</b>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/5 text-gray-700">
                            {n.notification_type}
                          </span>
                          <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase " + (
                            n.status === "sent" ? "bg-emerald-100 text-emerald-800" :
                            n.status === "claimed" ? "bg-blue-100 text-blue-800" :
                            n.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          )}>
                            {n.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{n.body}</p>
                        <p className="text-[10px] font-mono text-gray-400">Key: {n.notification_key}</p>
                      </div>

                      <div className="text-right text-xs shrink-0 font-mono space-y-0.5">
                        <p className="text-gray-900 font-bold">Target: {new Date(n.send_at).toLocaleString()}</p>
                        {n.error && (
                          <p className="text-rose-600 font-semibold text-[10px]">{n.error}</p>
                        )}
                        <button
                          onClick={() => setInspectItem({ title: `Notification: ${n.title}`, payload: n as any })}
                          className="text-[10px] text-amber-800 underline font-sans"
                        >
                          View Delivery Payload
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: KARMA & REWARDS RECONCILER ───────────────────────────── */}
        {activeTab === "karma" && (
          <div className="space-y-4">
            {/* Karma Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] font-bold uppercase text-amber-800 block">Current Balance</span>
                <b className="text-3xl font-bold font-serif text-amber-950 mt-1 block">{dossier.karma.currentBalance}</b>
                <p className="text-[10px] text-amber-700 mt-1">Punya points in profile</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold uppercase text-emerald-800 block">Total Earned</span>
                <b className="text-3xl font-bold font-serif text-emerald-950 mt-1 block">+{dossier.karma.totalEarned}</b>
                <p className="text-[10px] text-emerald-700 mt-1">Lifetime sadhana awards</p>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50 border">
                <span className="text-[11px] font-bold uppercase text-gray-500 block">Total Spent</span>
                <b className="text-3xl font-bold font-serif text-gray-900 mt-1 block">-{dossier.karma.totalSpent}</b>
                <p className="text-[10px] text-gray-600 mt-1">Redeemed rewards</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-black/5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-gray-500 block">Manual Adjustment</span>
                  <p className="text-[11px] text-gray-500 mt-1">Grant or reconcile missing points</p>
                </div>
                <button
                  onClick={() => setShowKarmaModal(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition-all"
                >
                  + Adjust Karma Points
                </button>
              </div>
            </div>

            {/* Karma Ledger Table */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-black/[0.02] border-b text-[11px] font-bold uppercase tracking-wider text-gray-500 grid grid-cols-12 gap-4">
                <span className="col-span-3">Date</span>
                <span className="col-span-2">Amount</span>
                <span className="col-span-5">Reason</span>
                <span className="col-span-2 text-right">Route</span>
              </div>
              <div className="divide-y text-xs">
                {dossier.karma.ledger.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No karma ledger entries found.</div>
                ) : (
                  dossier.karma.ledger.map((item) => (
                    <div key={item.id} className="px-6 py-3.5 grid grid-cols-12 gap-4 items-center">
                      <span className="col-span-3 font-mono text-gray-500">{new Date(item.created_at).toLocaleString()}</span>
                      <span className={"col-span-2 font-bold font-mono " + (item.amount > 0 ? "text-emerald-700" : "text-rose-700")}>
                        {item.amount > 0 ? `+${item.amount}` : item.amount}
                      </span>
                      <span className="col-span-5 text-gray-800">{item.reason}</span>
                      <span className="col-span-2 text-right font-mono text-gray-400 text-[10px] truncate">{item.source_route || "api"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: SOCIAL & MODERATION ──────────────────────────────────── */}
        {activeTab === "moderation" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-gray-900">Mandali & Kul Memberships</h3>
                <span className="px-2 py-0.5 rounded bg-black/5 text-[11px] font-bold">{dossier.moderation.kuls.length}</span>
              </div>
              {dossier.moderation.kuls.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Not currently a member of any Mandali or Kul.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {dossier.moderation.kuls.map((k) => (
                    <div key={k.id} className="p-3 rounded-xl bg-gray-50 border flex items-center justify-between">
                      <div>
                        <b>{k.kuls?.name || "Kul Community"}</b>
                        <p className="text-[10px] text-gray-500 capitalize">Role: {k.role}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date(k.joined_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-gray-900">Content Reports & Warnings</h3>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[11px] font-bold">
                  {dossier.moderation.reports.length + dossier.moderation.warnings.length}
                </span>
              </div>
              {dossier.moderation.reports.length === 0 && dossier.moderation.warnings.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 space-y-1">
                  <CheckCircle size={24} className="text-emerald-500 mx-auto" />
                  <p>Clean record. No flags or warnings on this account.</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {dossier.moderation.warnings.map((w, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                      <b>Warning: {w.reason}</b>
                      <p className="text-[10px] text-gray-500 mt-0.5">{new Date(w.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: COMPLIANCE & DEVICES ─────────────────────────────────── */}
        {activeTab === "compliance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Legal Acceptances */}
            <div className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-gray-900">Legal Compliance & Consent (DPDP)</h3>
                <FileText size={16} className="text-gray-400" />
              </div>
              {dossier.legalAcceptances.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No legal acceptances recorded.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {dossier.legalAcceptances.map((l) => (
                    <div key={l.id} className="p-3 rounded-xl bg-gray-50 border flex items-center justify-between">
                      <div>
                        <b className="capitalize">{l.document.replace("_", " ")}</b>
                        <p className="text-[10px] font-mono text-gray-500">Version: {l.version} • Surface: {l.surface}</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">{new Date(l.accepted_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registered Push Devices */}
            <div className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-gray-900">Registered Push Tokens ({dossier.pushTokens.length})</h3>
                <Smartphone size={16} className="text-gray-400" />
              </div>
              {dossier.pushTokens.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No push notification tokens currently registered.</p>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {dossier.pushTokens.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-gray-50 border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-amber-100 text-amber-900">
                          {t.platform || "Mobile"}
                        </span>
                        <span className="text-[10px] text-gray-400">Seen: {new Date(t.last_seen_at || t.updated_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 truncate">{t.token}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── KARMA ADJUSTMENT MODAL ────────────────────────────────────────── */}
      {showKarmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 font-sans text-xs">
            <h3 className="text-base font-bold font-serif text-gray-900">Adjust Seeker Karma Points</h3>
            <p className="text-gray-600">
              Manually award or deduct points for {p.full_name || p.username}. An immutable ledger record will be created.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-bold block text-gray-700 mb-1">Points Amount (+ or -)</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold block text-gray-700 mb-1">Administrative Audit Reason</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Compensation for Chaitra Navratri Day 3 service outage"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKarmaModal(false)}
                className="px-4 py-2 rounded-xl border text-gray-600 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleAdjustKarma()}
                disabled={adjustingKarma}
                className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold hover:bg-amber-900 disabled:opacity-50"
              >
                {adjustingKarma ? "Applying..." : "Confirm Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── JSON PAYLOAD INSPECTOR MODAL ──────────────────────────────────── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-black/10 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-gray-900">{inspectItem.title}</h3>
              <button
                onClick={() => setInspectItem(null)}
                className="px-2.5 py-1 rounded-lg border text-gray-600 hover:bg-gray-50 font-bold"
              >
                Close
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 border">
              {JSON.stringify(inspectItem.payload, null, 2)}
            </pre>

            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-400 text-[10px]">Direct from canonical database table</span>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(JSON.stringify(inspectItem.payload, null, 2));
                  setCopiedPayload(true);
                  setTimeout(() => setCopiedPayload(false), 2000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-gray-50"
              >
                <Copy size={12} />
                <span>{copiedPayload ? "Copied!" : "Copy Payload JSON"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
