"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Bell, Smartphone, AlertTriangle, CheckCircle, 
  Clock, RefreshCw, ChevronDown, ChevronUp, Copy, 
  Search, ExternalLink, ShieldCheck, Filter
} from "lucide-react";

interface DeliveryRow {
  id: string;
  user_id: string;
  provider: "expo" | "onesignal";
  type: string;
  status: "sent" | "failed" | "skipped" | "unconfigured" | "dry_run";
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
}

interface PendingReceipt {
  ticket_id: string;
  token: string;
  user_id?: string | null;
  created_at: string;
}

interface MonitoringData {
  activeTokens: number;
  pendingReceiptsCount: number;
  pendingReceipts: PendingReceipt[];
  last24h: {
    expo: {
      sent: number;
      failed: number;
      skipped: number;
      successRate: number;
    };
    onesignal: {
      sent: number;
      failed: number;
      unconfigured: number;
    };
  };
  recentFailures: DeliveryRow[];
  allRecentDeliveries: DeliveryRow[];
}

export default function PushMonitoringSection() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/push-monitoring");
      if (!res.ok) throw new Error("Failed to load push monitoring data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredDeliveries = useMemo(() => {
    if (!data) return [];
    let rows = data.allRecentDeliveries || [];

    if (statusFilter === "failed") {
      rows = rows.filter(r => r.status === "failed");
    } else if (statusFilter === "sent") {
      rows = rows.filter(r => r.status === "sent");
    } else if (statusFilter === "skipped") {
      rows = rows.filter(r => r.status === "skipped" || r.status === "unconfigured");
    }

    if (providerFilter !== "all") {
      rows = rows.filter(r => r.provider === providerFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r => 
        r.user_id?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q) ||
        r.error_code?.toLowerCase().includes(q) ||
        r.error_message?.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [data, statusFilter, providerFilter, searchQuery]);

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Push Notification Gateway & Delivery Monitor</h2>
            <p className="text-xs text-gray-500">Live delivery metrics, APNs/FCM receipt verification, and failure tracking</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 flex items-center gap-3">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => { setStatusFilter("all"); setProviderFilter("expo"); }}
          className={"p-4 rounded-xl text-left border transition-all " + (providerFilter === "expo" && statusFilter === "all" ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20" : "bg-gray-50/70 border-gray-100 hover:bg-gray-100/70")}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Device Tokens</span>
            <Smartphone size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.activeTokens?.toLocaleString() ?? "-"}</div>
          <div className="text-[11px] text-gray-500 mt-1">Native iOS & Android devices</div>
        </button>

        <button
          onClick={() => { setStatusFilter("sent"); setProviderFilter("expo"); }}
          className={"p-4 rounded-xl text-left border transition-all " + (statusFilter === "sent" && providerFilter === "expo" ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20" : "bg-gray-50/70 border-gray-100 hover:bg-gray-100/70")}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expo Success (24h)</span>
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {data ? (data.last24h.expo.successRate + "%") : "-"}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Sent: {data?.last24h.expo.sent ?? 0} • Skipped: {data?.last24h.expo.skipped ?? 0}
          </div>
        </button>

        <button
          onClick={() => { setStatusFilter("failed"); setProviderFilter("all"); }}
          className={"p-4 rounded-xl text-left border transition-all " + (statusFilter === "failed" ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20" : "bg-gray-50/70 border-gray-100 hover:bg-gray-100/70")}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed Dispatches (7d)</span>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {data?.recentFailures?.length ?? 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Click to filter failed logs</div>
        </button>

        <button
          onClick={() => { setStatusFilter("pending_tickets"); }}
          className={"p-4 rounded-xl text-left border transition-all " + (statusFilter === "pending_tickets" ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20" : "bg-gray-50/70 border-gray-100 hover:bg-gray-100/70")}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Receipts</span>
            <Clock size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {data?.pendingReceiptsCount ?? 0}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Awaiting APNs/FCM ticket check</div>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold mr-1">
            <Filter size={13} />
            <span>Filter:</span>
          </div>
          {[
            { id: "all", label: "All Statuses" },
            { id: "failed", label: "Failed Only" },
            { id: "sent", label: "Sent Only" },
            { id: "skipped", label: "Skipped / Unconfigured" },
            { id: "pending_tickets", label: "Pending Tickets" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={"px-3 py-1 rounded-lg text-xs font-semibold transition-all " + (statusFilter === f.id ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100")}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Providers</option>
            <option value="expo">Expo (Native iOS & Android)</option>
            <option value="onesignal">OneSignal (PWA Browser)</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search user, error, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1 rounded-lg border border-gray-200 text-xs bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      {statusFilter === "pending_tickets" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket ID</th>
                <th className="px-4 py-3 font-semibold">Token</th>
                <th className="px-4 py-3 font-semibold">User ID</th>
                <th className="px-4 py-3 font-semibold">Queued Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.pendingReceipts?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No pending receipts. All dispatches have been resolved by FCM/APNs!
                  </td>
                </tr>
              ) : (
                data?.pendingReceipts?.map((t) => (
                  <tr key={t.ticket_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-gray-900">{t.ticket_id}</td>
                    <td className="px-4 py-3 font-mono text-gray-500 truncate max-w-xs">{t.token}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{t.user_id || "Anonymous"}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">User ID</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Error / Code</th>
                <th className="px-4 py-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No delivery records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  const isFailed = row.status === "failed";
                  const isSent = row.status === "sent";

                  return (
                    <tbody key={row.id} className="border-b border-gray-100">
                      <tr 
                        onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                        className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={"px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider " + (row.provider === "expo" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800")}>
                            {row.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.type}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 truncate max-w-[120px]" title={row.user_id}>
                          {row.user_id ? row.user_id.slice(0, 8) + "..." : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider " + (isSent ? "bg-emerald-100 text-emerald-700" : isFailed ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600")}>
                            {isSent ? "Sent" : isFailed ? "Failed" : row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-xs" title={row.error_message || row.error_code || ""}>
                          {row.error_code ? (
                            <span className="font-mono text-rose-600 font-semibold">{row.error_code}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                          {row.error_message && (
                            <span className="text-gray-500 ml-1.5 truncate">
                              {row.error_message.slice(0, 40)}...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/80">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-xs font-bold text-gray-700">Dispatch Inspection Details</div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(JSON.stringify(row, null, 2), row.id);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    <Copy size={12} />
                                    {copiedId === row.id ? "Copied JSON!" : "Copy Payload"}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-white rounded-lg border border-gray-200/70">
                                  <span className="text-gray-400 block mb-1">Full User ID:</span>
                                  <span className="font-mono text-gray-800 break-all">{row.user_id || "None"}</span>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-gray-200/70">
                                  <span className="text-gray-400 block mb-1">Deep Link / URL:</span>
                                  <span className="font-mono text-amber-700 break-all">{row.metadata?.url || "None"}</span>
                                </div>
                              </div>

                              {row.error_message && (
                                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 text-xs">
                                  <span className="text-rose-600 font-bold block mb-1">Raw Error Message:</span>
                                  <pre className="font-mono text-rose-800 whitespace-pre-wrap break-all text-[11px]">
                                    {row.error_message}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}