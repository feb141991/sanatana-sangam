"use client";

import { useState, useEffect } from "react";
import { 
  Mail, ShieldCheck, AlertTriangle, CheckCircle2, 
  RefreshCw, Send, Users, Activity, Check, Copy, 
  ExternalLink, Globe, Lock, AlertCircle, Info, Sparkles
} from "lucide-react";

interface EmailMonitoringData {
  overview: {
    totalUsers: number;
    totalConfirmed: number;
    totalUnconfirmed: number;
    recent7DaysCount: number;
    confirmed7d: number;
    unconfirmed7d: number;
    bounceRiskRate7d: number;
    recent30DaysCount: number;
  };
  health: {
    status: "healthy" | "warning" | "critical";
    message: string;
    customSmtpConfigured: boolean;
    provider: string;
  };
  domains: Array<{ domain: string; total: number; confirmed: number; unconfirmed: number }>;
  providers: Array<{ name: string; count: number }>;
  unconfirmedUsers: Array<{
    id: string;
    email: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    provider: string;
    full_name: string | null;
  }>;
}

export default function EmailMonitoringSection() {
  const [data, setData] = useState<EmailMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test Email State
  const [testEmail, setTestEmail] = useState("pprince.ssharma@live.com");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/email-monitoring");
      if (!res.ok) throw new Error("Failed to load email monitoring data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching email monitoring stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes("@")) return;

    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/email-monitoring/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to dispatch test email");
      setTestResult({ success: true, message: `Email delivered! Message ID: ${json.messageId}` });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to send email",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-neutral-400 text-sm font-medium">Aggregating transactional email & auth health...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <h4 className="text-red-300 font-semibold">Failed to load Email Deliverability Monitor</h4>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-200 text-sm font-medium rounded-lg border border-red-700/50 flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const { overview, health, domains, providers, unconfirmedUsers } = data!;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Health Status */}
      <div className="p-5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20 border border-neutral-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">Auth & Transactional Email Deliverability</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  health.status === "healthy"
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                    : health.status === "warning"
                    ? "bg-amber-950/60 text-amber-400 border border-amber-800/50"
                    : "bg-red-950/60 text-red-400 border border-red-800/50"
                }`}
              >
                {health.status === "healthy" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                {health.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-neutral-400 mt-1">{health.message}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
              <span>Active Gateway: <strong className="text-neutral-300 font-medium">{health.provider}</strong></span>
              <span>•</span>
              <span>DKIM/SPF Insulation: <strong className="text-emerald-400 font-medium">Enabled (Resend)</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 rounded-xl transition"
            title="Refresh Deliverability Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="https://resend.com/emails"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-700 flex items-center gap-2 transition"
          >
            Resend Dashboard <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://supabase.com/dashboard/project/mnbwodcswxoojndytngu/settings/auth"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center gap-2 transition"
          >
            Supabase SMTP <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Total Devotees</span>
            <Users className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{overview.totalUsers}</div>
          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">{overview.totalConfirmed} verified</span>
            <span>•</span>
            <span className="text-neutral-400">{overview.totalUnconfirmed} unverified</span>
          </div>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>7-Day Signups</span>
            <Activity className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{overview.recent7DaysCount}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {overview.confirmed7d} confirmed, {overview.unconfirmed7d} pending
          </div>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>7-Day Bounce Risk</span>
            <AlertTriangle className={`w-4 h-4 ${overview.bounceRiskRate7d > 10 ? "text-amber-400" : "text-emerald-400"}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 ${overview.bounceRiskRate7d > 10 ? "text-amber-400" : "text-emerald-400"}`}>
            {overview.bounceRiskRate7d}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {overview.bounceRiskRate7d > 10 ? "Above 10% threshold" : "Safe deliverability floor"}
          </div>
        </div>

        <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>30-Day Growth</span>
            <Globe className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{overview.recent30DaysCount}</div>
          <div className="text-xs text-neutral-500 mt-1">New accounts in last month</div>
        </div>
      </div>

      {/* 3. Live Test Dispatcher & Provider Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Test Email Tool */}
        <div className="lg:col-span-2 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Live SMTP Dispatch Tester</h4>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Send an instant test email through your connected <strong>Resend API</strong> pipe to verify deliverability and inbox latency in real-time.
          </p>

          <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition"
              required
            />
            <button
              type="submit"
              disabled={sendingTest}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test Email
            </button>
          </form>

          {testResult && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                testResult.success
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/40 border-red-800/60 text-red-300"
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Auth Provider Distribution */}
        <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Auth Method Mix</h4>
          </div>
          <div className="space-y-3">
            {providers.map((p) => {
              const pct = overview.totalUsers > 0 ? Math.round((p.count / overview.totalUsers) * 100) : 0;
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-300 capitalize">{p.name === "google" ? "Google OAuth" : p.name === "apple" ? "Apple Sign-In" : "Email / Password"}</span>
                    <span className="text-neutral-400">{p.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Domain Health & Unconfirmed Account Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Distribution */}
        <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recipient Domains</h4>
          </div>
          <div className="space-y-2.5">
            {domains.slice(0, 8).map((d) => (
              <div key={d.domain} className="flex items-center justify-between p-2.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 text-xs">
                <span className="font-mono text-neutral-300">@{d.domain}</span>
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-emerald-400">{d.confirmed} ok</span>
                  {d.unconfirmed > 0 && (
                    <span className="text-amber-400">{d.unconfirmed} unverified</span>
                  )}
                  <span className="text-neutral-500">({d.total})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unconfirmed / Pending Account Watchlist */}
        <div className="lg:col-span-2 p-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Unconfirmed Accounts Watchlist</h4>
            </div>
            <span className="text-xs text-neutral-500">{unconfirmedUsers.length} total</span>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Accounts created without email confirmation. Unconfirmed dummy emails are the primary source of mailer hard bounces.
          </p>

          {unconfirmedUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-950/50 rounded-xl border border-neutral-800/50">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              Zero unconfirmed accounts. All devotee signups are fully verified.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {unconfirmedUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl text-xs">
                  <div>
                    <div className="font-mono text-amber-200/90 font-medium">{u.email || "No email"}</div>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      Created: {new Date(u.created_at).toLocaleDateString()} • Provider: {u.provider}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(u.id, u.id)}
                      className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg transition"
                      title="Copy User ID"
                    >
                      {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-800/50 text-amber-400 rounded-md font-medium text-[10px]">
                      Pending Verification
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
