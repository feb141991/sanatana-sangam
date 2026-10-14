'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, Database, ArrowLeft,
  RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Server, MessageSquare, Send, BellRing, Check, Info
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GlobalSettings() {
  const [flushing, setFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState<string | null>(null);
  const [flushSuccess, setFlushSuccess] = useState<boolean | null>(null);

  const [slackConfigured, setSlackConfigured] = useState<boolean | null>(null);
  const [slackMaskedUrl, setSlackMaskedUrl] = useState<string | null>(null);
  const [testingSlack, setTestingSlack] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/alerts/test-slack")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSlackConfigured(data.configured);
          setSlackMaskedUrl(data.maskedUrl || null);
        }
      })
      .catch(() => {});
  }, []);

  const handleTestSlack = async () => {
    setTestingSlack(true);
    setSlackTestResult(null);
    try {
      const res = await fetch("/api/admin/alerts/test-slack", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success(data.message || "Test alert sent to Slack!");
        setSlackTestResult({ ok: true, message: data.message || "Test alert delivered to Slack successfully!" });
      } else {
        toast.error(data.error || "Failed to send test alert to Slack");
        setSlackTestResult({ ok: false, message: data.error || "Failed to send alert. Check webhook URL." });
      }
    } catch (err: any) {
      toast.error("Network communication failure");
      setSlackTestResult({ ok: false, message: err?.message || "Network error" });
    } finally {
      setTestingSlack(false);
    }
  };

  const handleFlushCache = async () => {
    setFlushing(true);
    setFlushMessage(null);
    setFlushSuccess(null);
    try {
      const res = await fetch("/api/admin/flush-cache", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Cache flushed successfully");
        setFlushMessage(data.message || "All global edge caches and page layouts flushed and revalidated successfully.");
        setFlushSuccess(true);
      } else {
        toast.error(data.error || "Failed to flush cache");
        setFlushMessage(data.error || "Failed to flush edge cache.");
        setFlushSuccess(false);
      }
    } catch (err: any) {
      toast.error("Network error during cache flush");
      setFlushMessage(err?.message || "Network communication failed.");
      setFlushSuccess(false);
    } finally {
      setFlushing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--divine-bg)] pb-24 font-outfit">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--divine-bg)]/80 backdrop-blur-xl border-b border-[rgba(197,160,89,0.15)] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-xl hover:bg-black/5 text-[var(--brand-muted)] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif theme-ink">Global Settings & Infrastructure</h1>
              <p className="text-[10px] text-[var(--brand-muted)] uppercase tracking-[0.2em] font-bold">Platform Runtime Controls</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/monitoring"
              className="px-3.5 py-1.5 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-xs font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span>Monitoring Vitals</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Cache & Edge Infrastructure Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-2 text-sm font-bold theme-ink uppercase tracking-widest">
              <Database size={16} className="text-amber-500" /> Edge Caches & Revalidation
            </h2>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Active API Connected
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-black/5 p-6 bg-white/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
              <div className="flex items-start sm:items-center gap-3">
                <RefreshCw size={22} className={"text-amber-600 shrink-0 mt-0.5 sm:mt-0 " + (flushing ? "animate-spin" : "")} />
                <div>
                  <p className="text-sm font-bold text-amber-950">Flush Global Edge Cache</p>
                  <p className="text-xs text-amber-800/80 leading-relaxed">
                    Purges and revalidates all Next.js ISR, Edge caches, Panchang routes, and layout trees immediately across production.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleFlushCache}
                disabled={flushing}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
              >
                {flushing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Flushing...</span>
                  </>
                ) : (
                  <span>Run Flush</span>
                )}
              </button>
            </div>

            {flushMessage && (
              <div className={"p-4 rounded-2xl text-xs flex items-start gap-2.5 border " + (
                flushSuccess 
                  ? "bg-emerald-50 text-emerald-950 border-emerald-200" 
                  : "bg-rose-50 text-rose-950 border-rose-200"
              )}>
                {flushSuccess ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-bold">{flushSuccess ? "Purge Completed" : "Flush Failed"}</p>
                  <p className="leading-relaxed">{flushMessage}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Slack Operational & Moderation Alerting Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-2 text-sm font-bold theme-ink uppercase tracking-widest">
              <MessageSquare size={16} className="text-emerald-500" /> Slack Incident & Moderation Alerts
            </h2>
            <span
              className={
                "text-[10px] font-mono px-2 py-0.5 rounded border font-bold " +
                (slackConfigured
                  ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                  : "text-amber-800 bg-amber-50 border-amber-200")
              }
            >
              {slackConfigured === null
                ? "Checking..."
                : slackConfigured
                ? "Webhook Connected"
                : "Webhook Pending Setup"}
            </span>
          </div>

          <div className="glass-panel rounded-3xl border border-black/5 p-6 bg-white/60 shadow-xs space-y-4">
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <BellRing size={22} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-950">Real-time P0/P1 & Moderation Channel Broadcast</p>
                  <p className="text-xs text-emerald-800/80 leading-relaxed">
                    Automatically posts rich cards with action buttons directly into Slack whenever a critical operational incident occurs or a user report is filed in Mandali / Live Darshan.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTestSlack}
                disabled={testingSlack || slackConfigured === false}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
              >
                {testingSlack ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Test Alert</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">P0 / P1 Telemetry Alerts</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Instant</span>
                </div>
                <p className="text-gray-700 leading-snug">Dispatches directly from telemetry sink with deep link to <code className="text-gray-900 bg-gray-100 px-1 py-0.5 rounded">/admin/monitoring</code>.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">User Moderation Reports</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Instant</span>
                </div>
                <p className="text-gray-700 leading-snug">Dispatches report reason and direct action button to <code className="text-gray-900 bg-gray-100 px-1 py-0.5 rounded">/admin/moderation</code>.</p>
              </div>
            </div>

            {slackMaskedUrl && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                <Info size={14} className="text-gray-400 shrink-0" />
                <span>Active Target: <code className="font-mono text-gray-800">{slackMaskedUrl}</code></span>
              </div>
            )}

            {slackConfigured === false && (
              <div className="p-4 rounded-2xl text-xs bg-amber-50 text-amber-900 border border-amber-200 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Webhook Not Yet Set in Environment</p>
                  <p className="leading-relaxed">
                    To activate Slack alerts, add <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...</code> to your environment variables (<code className="font-mono">.env.local</code> / Vercel project settings).
                  </p>
                </div>
              </div>
            )}

            {slackTestResult && (
              <div
                className={
                  "p-4 rounded-2xl text-xs flex items-start gap-2.5 border " +
                  (slackTestResult.ok
                    ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                    : "bg-rose-50 text-rose-950 border-rose-200")
                }
              >
                {slackTestResult.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="font-bold">{slackTestResult.ok ? "Delivered to Slack" : "Delivery Error"}</p>
                  <p className="leading-relaxed">{slackTestResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Security & Access Environment Governance */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold theme-ink px-2 uppercase tracking-widest">
            <Shield size={16} className="text-blue-500" /> Security & Access Governance
          </h2>
          <div className="glass-panel rounded-3xl border border-black/5 p-6 space-y-4 bg-white/40 shadow-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] border border-black/5">
              <div>
                <p className="text-xs font-bold theme-ink">Production Maintenance Mode</p>
                <p className="text-[11px] text-[var(--brand-muted)]">Controlled by deployment gate flags & Vercel Edge middleware.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                Live (Disabled)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] border border-black/5">
              <div>
                <p className="text-xs font-bold theme-ink">Admin Session Authentication</p>
                <p className="text-[11px] text-[var(--brand-muted)]">HTTP-only signed JWT cookie enforcement with verified role claims.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                Enforced
              </span>
            </div>
          </div>
        </section>

        {/* Platform Architecture & Runtime Vitals */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-bold theme-ink px-2 uppercase tracking-widest">
            <Server size={16} className="text-purple-500" /> Platform Architecture
          </h2>
          <div className="glass-panel rounded-3xl border border-black/5 p-6 bg-white/40 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/80 border border-black/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Runtime Engine</span>
                <p className="font-bold font-mono text-gray-900">Next.js 15.5 Standalone</p>
              </div>
              <div className="p-3 rounded-xl bg-white/80 border border-black/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Database & Auth</span>
                <p className="font-bold font-mono text-gray-900">Supabase PostgreSQL with RLS</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
