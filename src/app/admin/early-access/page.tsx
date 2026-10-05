"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Search,
  RefreshCw,
  Download,
  Smartphone,
  Calendar,
  Mail,
  Users,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Copy,
  Check,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface EarlyAccessSeeker {
  id: string;
  email: string;
  name: string | null;
  tradition: string | null;
  source: string | null;
  timezone: string | null;
  founding_number: number | null;
  email_sent: boolean;
  email_status: "accepted" | "queued" | "sending" | "suppressed" | "needs_attention" | "not_queued";
  email_error_code: string | null;
  email_accepted_at: string | null;
  referred_by_number: number | null;
  referral_source: string | null;
  created_at: string;
}

interface EarlyAccessStats {
  total: number;
  today: number;
  thisWeek: number;
  androidInterestCount: number;
  iosInterestCount: number;
  webInterestCount: number;
  traditions: Record<string, number>;
}

const TRADITION_BADGES: Record<string, { label: string; icon: string; style: string }> = {
  hindu: { label: "Sanatani / Hindu", icon: "🕉", style: "bg-amber-50 text-amber-900 border-amber-200" },
  sikh: { label: "Sikh", icon: "☬", style: "bg-sky-50 text-sky-900 border-sky-200" },
  buddhist: { label: "Buddhist", icon: "☸", style: "bg-rose-50 text-rose-900 border-rose-200" },
  jain: { label: "Jain", icon: "☮", style: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  universal: { label: "Universal", icon: "🪔", style: "bg-purple-50 text-purple-900 border-purple-200" },
};

export default function EarlyAccessAdminPage() {
  const [seekers, setSeekers] = useState<EarlyAccessSeeker[]>([]);
  const [stats, setStats] = useState<EarlyAccessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [query, setQuery] = useState("");
  const [tradition, setTradition] = useState("all");
  const [device, setDevice] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const limit = 50;

  const fetchSeekers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (tradition !== "all") params.set("tradition", tradition);
      if (device !== "all") params.set("device", device);
      if (sort !== "newest") params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/admin/early-access?${params.toString()}`);
      const payload: unknown = await res.json();
      const data = typeof payload === "object" && payload !== null
        ? payload as { seekers?: EarlyAccessSeeker[]; total?: number; stats?: EarlyAccessStats; error?: unknown }
        : {};
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to load early access list");

      setSeekers(data.seekers || []);
      setTotalCount(data.total || 0);
      setStats(data.stats || null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load seekers");
    } finally {
      setLoading(false);
    }
  }, [query, tradition, device, sort, page]);

  useEffect(() => {
    fetchSeekers();
  }, [fetchSeekers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSeekers();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (tradition !== "all") params.set("tradition", tradition);
      if (device !== "all") params.set("device", device);
      if (sort !== "newest") params.set("sort", sort);
      params.set("format", "csv");

      const response = await fetch(`/api/admin/early-access?${params.toString()}`);
      if (!response.ok) {
        const payload: unknown = await response.json();
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Could not export early-access requests.";
        throw new Error(message);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `shoonaya-early-access-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      toast.success("Filtered CSV export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export early-access requests.");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-900 border border-amber-500/30">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
              Early Access & Waitlist
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Early-access requests, self-reported platform interest, tradition preferences, and referral attribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchSeekers()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/80 hover:bg-white text-gray-700 border border-[rgba(197,160,89,0.3)] shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-700" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white shadow-xs transition"
          >
            <Download className={`w-3.5 h-3.5 ${exporting ? "animate-pulse" : ""}`} />
            {exporting ? "Preparing CSV…" : "Export filtered CSV"}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[rgba(197,160,89,0.2)] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/70">Total Requests</span>
              <Users className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-bold font-serif text-gray-900">{stats.total.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Requests recorded
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[rgba(197,160,89,0.2)] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/70">This Week</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold font-serif text-gray-900">+{stats.thisWeek.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              +{stats.today} requests today
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[rgba(197,160,89,0.2)] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/70">Android Interest</span>
              <Smartphone className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-gray-900">{stats.androidInterestCount.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              Self-reported · {stats.total > 0 ? Math.round((stats.androidInterestCount / stats.total) * 100) : 0}%
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[rgba(197,160,89,0.2)] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/70">iOS Interest</span>
              <Smartphone className="w-4 h-4 text-stone-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-gray-900">{stats.iosInterestCount.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              Self-reported · {stats.total > 0 ? Math.round((stats.iosInterestCount / stats.total) * 100) : 0}%
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[rgba(197,160,89,0.2)] shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/70">Web Interest</span>
              <Smartphone className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-gray-900">{stats.webInterestCount.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              Self-reported · {stats.total > 0 ? Math.round((stats.webInterestCount / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* 3. Search and Filters */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[rgba(197,160,89,0.2)] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email, name, or request #..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tradition}
              onChange={(e) => {
                setTradition(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Traditions</option>
              <option value="hindu">🕉 Hindu / Sanatani</option>
              <option value="sikh">☬ Sikh</option>
              <option value="buddhist">☸ Buddhist</option>
              <option value="jain">☮ Jain</option>
              <option value="universal">🪔 Universal</option>
            </select>

            <select
              value={device}
              onChange={(e) => {
                setDevice(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Platform Interests</option>
              <option value="android">Android Interest</option>
              <option value="ios">iOS Interest</option>
              <option value="web">Web Interest</option>
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="founding_asc">Request # (Low → High)</option>
              <option value="founding_desc">Request # (High → Low)</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-800 hover:bg-amber-900 text-white transition"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* 4. Registrations Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[rgba(197,160,89,0.2)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-amber-50/50 border-b border-[rgba(197,160,89,0.2)] text-amber-950/70 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Request #</th>
                <th className="py-3.5 px-4">Seeker</th>
                <th className="py-3.5 px-4">Tradition</th>
                <th className="py-3.5 px-4">Platform Interest</th>
                <th className="py-3.5 px-4">Confirmation Email</th>
                <th className="py-3.5 px-4">Source Page</th>
                <th className="py-3.5 px-4">Timezone</th>
                <th className="py-3.5 px-4">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-700 mb-2" />
                    Loading early access seekers...
                  </td>
                </tr>
              ) : seekers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Mail className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700">No seekers found</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">Try clearing or adjusting your search filters.</p>
                  </td>
                </tr>
              ) : (
                seekers.map((seeker) => {
                  const traditionInfo = TRADITION_BADGES[seeker.tradition || "universal"] || TRADITION_BADGES.universal;
                  const isAndroid = seeker.source?.toLowerCase().includes("android");
                  const isIos = seeker.source?.toLowerCase().includes("ios");
                  const deviceLabel = isAndroid ? "Android interest" : isIos ? "iOS interest" : "Web interest";
                  const emailStatusLabel: Record<EarlyAccessSeeker["email_status"], string> = {
                    accepted: "Provider accepted",
                    queued: "Queued",
                    sending: "Sending",
                    suppressed: "Suppressed",
                    needs_attention: "Needs attention",
                    not_queued: seeker.email_sent ? "Provider accepted" : "Not queued",
                  };

                  return (
                    <tr key={seeker.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {seeker.founding_number ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300/60">
                            #{seeker.founding_number}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {seeker.name || <span className="text-gray-400 italic">No name provided</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                          <span className="font-mono text-[11px]">{seeker.email}</span>
                          <button
                            onClick={() => copyToClipboard(seeker.email)}
                            title="Copy email"
                            className="p-0.5 text-gray-400 hover:text-amber-800 transition"
                          >
                            {copiedEmail === seeker.email ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${traditionInfo.style}`}>
                          <span>{traditionInfo.icon}</span>
                          <span>{traditionInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          isAndroid
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : isIos
                            ? "bg-stone-100 text-stone-800 border border-stone-300"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}>
                          <Smartphone className="w-3 h-3" />
                          {deviceLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          title={seeker.email_error_code ? `Last provider error: ${seeker.email_error_code}` : seeker.email_accepted_at ? `Provider accepted at ${seeker.email_accepted_at}` : "Provider acceptance does not confirm inbox delivery"}
                          className={`inline-flex rounded-lg border px-2 py-1 text-[10px] font-semibold ${
                            seeker.email_status === "accepted" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : seeker.email_status === "needs_attention" ? "border-rose-200 bg-rose-50 text-rose-800"
                                : seeker.email_status === "suppressed" ? "border-stone-200 bg-stone-100 text-stone-700"
                                  : "border-amber-200 bg-amber-50 text-amber-900"
                          }`}
                        >
                          {emailStatusLabel[seeker.email_status]}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-mono text-[10px] text-gray-700">
                          {seeker.source || "direct"}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-[11px]">
                        {seeker.timezone || "Asia/Kolkata"}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-[11px]">
                        <div>{new Date(seeker.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-[10px] text-gray-400">{new Date(seeker.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination */}
        {totalCount > limit && (
          <div className="p-4 border-t border-[rgba(197,160,89,0.2)] flex items-center justify-between text-xs text-gray-600 bg-amber-50/20">
            <div>
              Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount} seekers
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
