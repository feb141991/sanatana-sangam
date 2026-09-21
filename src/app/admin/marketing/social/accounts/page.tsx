"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Facebook, Instagram, Linkedin, Plug, Unplug, ShieldAlert, RefreshCw,
  PauseCircle, PlayCircle, AlertTriangle, ArrowLeft
} from "lucide-react";

interface Account {
  id: string;
  provider: "meta" | "linkedin";
  account_type: "facebook_page" | "instagram_business" | "linkedin_organization";
  external_account_id: string;
  display_name: string | null;
  token_expires_at: string | null;
  status: "active" | "expiring_soon" | "expired" | "revoked" | "error";
  last_error: string | null;
  connected_by: string;
  connected_at: string;
}

interface ConfigRow {
  id: string;
  content_type: "festival" | "general";
  automation_mode: "manual" | "automatic" | "paused";
  destination_account_ids: string[];
  publish_time_local: string | null;
  version: number;
}

interface GlobalPause {
  generation_paused: boolean;
  publishing_paused: boolean;
}

const ACCOUNT_ICON: Record<Account["account_type"], any> = {
  facebook_page: Facebook,
  instagram_business: Instagram,
  linkedin_organization: Linkedin
};

const STATUS_STYLE: Record<Account["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  expiring_soon: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  expired: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  revoked: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  error: "bg-rose-500/10 text-rose-700 border-rose-500/20"
};

export default function SocialAccountsPage() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [config, setConfig] = useState<ConfigRow[]>([]);
  const [globalPause, setGlobalPause] = useState<GlobalPause | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/marketing/social/accounts"),
        fetch("/api/admin/marketing/social/settings")
      ]);
      const accountsData = await accountsRes.json();
      const settingsData = await settingsRes.json();
      if (!accountsRes.ok) throw new Error(accountsData.error);
      if (!settingsRes.ok) throw new Error(settingsData.error);
      setAccounts(accountsData.accounts ?? []);
      setConfig(settingsData.config ?? []);
      setGlobalPause(settingsData.globalPause ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const disconnectAccount = async (accountId: string) => {
    if (!confirm("Disconnect this account? Its stored token will be cleared; historical posts keep their record of it.")) return;
    setSavingKey(accountId);
    try {
      const res = await fetch("/api/admin/marketing/social/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const updateConfig = async (row: ConfigRow, patch: Partial<Pick<ConfigRow, "automation_mode" | "destination_account_ids" | "publish_time_local">>) => {
    setSavingKey(`config:${row.content_type}`);
    try {
      const res = await fetch("/api/admin/marketing/social/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "config", ...row, ...patch })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  const updateGlobalPause = async (patch: Partial<GlobalPause>) => {
    setSavingKey("global_pause");
    try {
      const res = await fetch("/api/admin/marketing/social/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "global_pause", ...globalPause, ...patch })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGlobalPause(data.globalPause);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/marketing/social" className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-tight">Accounts & Automation</h1>
              <p className="text-xs text-[var(--text-muted)]">Connect destinations, and control per-content-type automation.</p>
            </div>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] text-xs font-semibold flex items-center gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Global kill switches */}
        <section className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><ShieldAlert size={16} /> Global Safety Switches</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Live overrides on top of every content type&apos;s own automation mode. Generation pause stops new drafts;
            publishing pause stops every external send, even an already-approved post.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {(["generation_paused", "publishing_paused"] as const).map(key => (
              <button
                key={key}
                disabled={savingKey === "global_pause"}
                onClick={() => updateGlobalPause({ [key]: !globalPause?.[key] } as Partial<GlobalPause>)}
                className={`p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  globalPause?.[key] ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/5 border-emerald-500/20"
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{key === "generation_paused" ? "Generation" : "Publishing"}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{globalPause?.[key] ? "Paused" : "Running normally"}</p>
                </div>
                {globalPause?.[key] ? <PauseCircle size={20} className="text-rose-600" /> : <PlayCircle size={20} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        </section>

        {/* Connect accounts */}
        <section className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2"><Plug size={16} /> Connected Destinations</h2>

          <div className="flex flex-wrap gap-3">
            <a href="/api/admin/marketing/social/oauth/meta/connect" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2">
              <Facebook size={14} /> Connect Facebook / Instagram
            </a>
            <a href="/api/admin/marketing/social/oauth/linkedin/connect" className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold flex items-center gap-2">
              <Linkedin size={14} /> Connect LinkedIn
            </a>
          </div>

          {loading ? (
            <p className="text-xs text-[var(--text-muted)] py-4">Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4">No destinations connected yet.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map(a => {
                const Icon = ACCOUNT_ICON[a.account_type];
                return (
                  <div key={a.id} className="p-3.5 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-[var(--text-muted)]" />
                      <div>
                        <p className="text-xs font-bold">{a.display_name ?? a.external_account_id}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {a.account_type.replace("_", " ")} • connected by {a.connected_by}
                          {a.token_expires_at ? ` • expires ${new Date(a.token_expires_at).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${STATUS_STYLE[a.status]}`}>
                        {a.status.replace("_", " ")}
                      </span>
                      {a.status !== "revoked" && (
                        <button
                          disabled={savingKey === a.id}
                          onClick={() => disconnectAccount(a.id)}
                          className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-rose-50 hover:border-rose-300 text-rose-600"
                          title="Disconnect"
                        >
                          <Unplug size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Per-content-type automation */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold px-1">Automation Mode by Content Type</h2>
          {config.map(row => (
            <div key={row.id} className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold capitalize">{row.content_type}</h3>
                <span className="text-[11px] text-[var(--text-muted)]">policy v{row.version}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["manual", "automatic", "paused"] as const).map(mode => (
                  <button
                    key={mode}
                    disabled={savingKey === `config:${row.content_type}`}
                    onClick={() => updateConfig(row, { automation_mode: mode })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      row.automation_mode === mode
                        ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] border border-transparent"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="text-xs space-y-1">
                  <span className="font-semibold text-[var(--text-muted)]">Publish time (local)</span>
                  <input
                    type="time"
                    defaultValue={row.publish_time_local ?? "09:00"}
                    onBlur={e => updateConfig(row, { publish_time_local: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-transparent"
                  />
                </label>
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-[var(--text-muted)]">Destinations</span>
                  <div className="flex flex-wrap gap-1.5">
                    {accounts.filter(a => a.status === "active").map(a => {
                      const selected = row.destination_account_ids.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() =>
                            updateConfig(row, {
                              destination_account_ids: selected
                                ? row.destination_account_ids.filter(id => id !== a.id)
                                : [...row.destination_account_ids, a.id]
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                            selected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                          }`}
                        >
                          {a.display_name ?? a.account_type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
