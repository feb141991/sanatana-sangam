"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe2, Info, ShieldCheck, Sparkles } from "lucide-react";

interface Claim { id: string; statement: string; status: "confirmed" | "needs_confirmation"; evidence: string }
interface Pillar { id: string; title: string; audience: string; message: string; claims: string[]; needsOccasion: boolean }
interface Region { id: string; label: string; spelling: string }
interface Observance { occurrence_id?: string; display_name?: string; date?: string; tradition?: string }
interface Violation { channel: string; rule: string; excerpt: string; message: string }
interface Result {
  campaign: { id: string; title: string; status: string };
  variants: Array<{ id: string; channel: string; subject: string | null; body: string; cta_text: string | null }>;
  attempts: Record<string, number>;
}

const TRADITION_LABEL: Record<string, string> = { hindu: "Hindu", sikh: "Sikh", buddhist: "Buddhist", jain: "Jain" };
const CHANNEL_LABEL: Record<string, string> = { email: "Email", whatsapp: "WhatsApp" };

async function readAnswer(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`The server did not answer properly (status ${res.status}). Try again in a moment.`);
  }
}

export default function DiasporaContentPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [traditions, setTraditions] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [observances, setObservances] = useState<Observance[]>([]);
  const [loading, setLoading] = useState(true);

  const [pillarId, setPillarId] = useState("");
  const [regionId, setRegionId] = useState("uk");
  const [tradition, setTradition] = useState("");
  const [chosenChannels, setChosenChannels] = useState<string[]>(["email", "whatsapp"]);
  const [occurrenceId, setOccurrenceId] = useState("");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [problem, setProblem] = useState<{ message: string; violations: Violation[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing/diaspora", { cache: "no-store" });
      const data = await readAnswer(res);
      if (!res.ok) throw new Error(data.error ?? "Could not load the options");
      setPillars(data.pillars ?? []);
      setRegions(data.regions ?? []);
      setTraditions(data.traditions ?? []);
      setChannels(data.channels ?? []);
      setClaims(data.claims ?? []);
      setPillarId((current) => current || data.pillars?.[0]?.id || "");
      setProblem((current) => (current && current.violations.length === 0 ? null : current));
      // Verified occasions are optional; a failure here only hides the list.
      try {
        const occ = await fetch("/api/admin/marketing/sources/observances", { cache: "no-store" });
        const occData = await readAnswer(occ);
        setObservances(occ.ok ? occData.observances ?? [] : []);
      } catch {
        setObservances([]);
      }
    } catch (err) {
      setProblem({ message: err instanceof Error ? err.message : "Could not load the options", violations: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pillar = pillars.find((p) => p.id === pillarId);
  const usedClaims = (pillar?.claims ?? []).map((id) => claims.find((c) => c.id === id)).filter((c): c is Claim => Boolean(c));
  const notUsable = claims.filter((c) => c.status !== "confirmed");
  const needsOccasion = Boolean(pillar?.needsOccasion);
  const canGenerate = !generating && Boolean(pillar) && chosenChannels.length > 0 && (!needsOccasion || Boolean(occurrenceId));

  async function generate() {
    setGenerating(true);
    setResult(null);
    setProblem(null);
    try {
      const res = await fetch("/api/admin/marketing/diaspora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pillar_id: pillarId, region_id: regionId, tradition, channels: chosenChannels, occurrence_id: occurrenceId })
      });
      const data = await readAnswer(res);
      if (!res.ok) {
        // A refused draft already has its own plain sentence; the server's detail would only repeat it.
        const detail = data.detail && data.error !== "content_check_failed" ? ` ${data.detail}` : "";
        setProblem({ message: `${describeError(data.error)}${detail}`, violations: data.violations ?? [] });
        return;
      }
      setResult(data as Result);
    } catch (err) {
      setProblem({ message: err instanceof Error ? err.message : "Could not generate the draft", violations: [] });
    } finally {
      setGenerating(false);
    }
  }

  const field = "mt-1 w-full min-h-11 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs font-normal";

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-6">
          <Link href="/admin/marketing/social" aria-label="Back to the Social Publishing Studio" className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
            <ArrowLeft size={16} />
          </Link>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20"><Globe2 size={22} /></div>
          <div>
            <h1 className="text-xl font-bold font-serif tracking-tight">Diaspora Content</h1>
            <p className="text-xs text-[var(--text-muted)]">Draft email and WhatsApp copy for people keeping a tradition far from where it began.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs space-y-1" role="note">
          <p className="flex items-center gap-2 font-semibold"><ShieldCheck size={14} /> This only drafts.</p>
          <p className="text-[var(--text-muted)]">You review and approve the draft on its campaign page. Email and WhatsApp reach only people who agreed to receive them. The writer may only use the facts listed below, and every draft is checked against the content rules before it is saved.</p>
        </div>

        <div aria-live="polite">
          {problem && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-800 space-y-2">
              <p className="font-semibold">{problem.message}</p>
              {problem.violations.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {problem.violations.map((v) => (
                    <li key={`${v.channel}-${v.rule}-${v.excerpt}`}>{CHANNEL_LABEL[v.channel] ?? v.channel}: {v.message} <span className="opacity-70">(“{v.excerpt}”)</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <section aria-labelledby="pillar-heading" className="space-y-3">
          <h2 id="pillar-heading" className="text-sm font-bold">1. Choose the angle</h2>
          <div role="radiogroup" aria-labelledby="pillar-heading" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pillars.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={p.id === pillarId}
                onClick={() => setPillarId(p.id)}
                className={`text-left p-4 rounded-2xl border min-h-11 space-y-1 transition-all ${p.id === pillarId ? "border-amber-500 bg-amber-500/10" : "border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-amber-500/40"}`}
              >
                <span className="block text-sm font-bold">{p.title}</span>
                <span className="block text-[11px] text-[var(--text-muted)]">{p.audience}</span>
                <span className="block text-xs">{p.message}</span>
                {p.needsOccasion && <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border border-blue-500/20 bg-blue-500/10 text-blue-700">Needs a verified festival</span>}
              </button>
            ))}
            {!loading && pillars.length === 0 && <p className="text-xs text-[var(--text-muted)]">No angles could be loaded. Try Refresh.</p>}
          </div>
        </section>

        <section aria-labelledby="who-heading" className="space-y-3">
          <h2 id="who-heading" className="text-sm font-bold">2. Who and where</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Region
              <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className={field}>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.label} ({r.spelling} English)</option>)}
              </select>
            </label>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Tradition
              <select value={tradition} onChange={(e) => setTradition(e.target.value)} className={field}>
                <option value="">All, none in particular</option>
                {traditions.map((t) => <option key={t} value={t}>{TRADITION_LABEL[t] ?? t}</option>)}
              </select>
            </label>
            <fieldset className="block">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Channels</legend>
              <div className="mt-1 flex gap-2 flex-wrap">
                {channels.map((c) => (
                  <label key={c} className="min-h-11 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs font-semibold flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={chosenChannels.includes(c)}
                      onChange={(e) => setChosenChannels((cur) => (e.target.checked ? [...cur, c] : cur.filter((x) => x !== c)))}
                    />
                    {CHANNEL_LABEL[c] ?? c}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Verified festival {needsOccasion ? "(required for this angle)" : "(optional)"}
            <select value={occurrenceId} onChange={(e) => setOccurrenceId(e.target.value)} className={field} aria-required={needsOccasion}>
              <option value="">{needsOccasion ? "Choose a verified festival…" : "None"}</option>
              {observances.map((o) => (
                <option key={o.occurrence_id} value={o.occurrence_id}>{o.display_name} · {o.date}{o.tradition ? ` · ${TRADITION_LABEL[o.tradition] ?? o.tradition}` : ""}</option>
              ))}
            </select>
            <span className="block mt-1 text-[11px] normal-case tracking-normal font-normal">Only festivals whose dates are verified for publication are listed. The writer is given the name and date and may not add any other date or time.</span>
          </label>
        </section>

        <section aria-labelledby="facts-heading" className="space-y-3">
          <h2 id="facts-heading" className="text-sm font-bold flex items-center gap-2"><Info size={14} /> Facts this draft may rely on</h2>
          <ul className="space-y-1 text-xs list-disc pl-5">
            {usedClaims.map((c) => <li key={c.id}>{c.statement}</li>)}
            {usedClaims.length === 0 && <li className="list-none text-[var(--text-muted)]">Choose an angle to see its facts.</li>}
          </ul>
          <details className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
            <summary className="text-xs font-bold cursor-pointer min-h-11 flex items-center">Not used yet, and why ({notUsable.length})</summary>
            <ul className="mt-2 space-y-2 text-xs">
              {notUsable.map((c) => (
                <li key={c.id}><span className="font-semibold">{c.statement}</span><br /><span className="text-[var(--text-muted)]">{c.evidence}</span></li>
              ))}
            </ul>
          </details>
        </section>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => void generate()}
            disabled={!canGenerate}
            className="min-h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={14} /> {generating ? "Writing and checking…" : "Draft the campaign"}
          </button>
          {needsOccasion && !occurrenceId && <span className="text-[11px] text-amber-700">Choose a verified festival first.</span>}
          {chosenChannels.length === 0 && <span className="text-[11px] text-amber-700">Choose at least one channel.</span>}
        </div>

        {result && (
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4" aria-label="Draft created">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold">Draft created: {result.campaign.title}</h2>
                <p className="text-[11px] text-[var(--text-muted)]">Status: {result.campaign.status}. Nothing has been approved or sent.</p>
              </div>
              <Link href={`/admin/marketing/${result.campaign.id}`} className="min-h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center">
                Review and approve
              </Link>
            </div>
            {result.variants.map((v) => (
              <article key={v.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider">{CHANNEL_LABEL[v.channel] ?? v.channel}{result.attempts[v.channel] > 1 ? " (second attempt: the first broke a rule)" : ""}</h3>
                {v.subject && <p className="text-xs font-semibold">{v.subject}</p>}
                <p className="text-xs whitespace-pre-wrap">{v.body}</p>
                {v.cta_text && <p className="text-[11px] text-[var(--text-muted)]">Button: {v.cta_text}</p>}
              </article>
            ))}
            <p className="text-[11px] text-[var(--text-muted)]">Checked before saving: no numbers or popularity claims, no scripture or mantra text, no dates or times except the verified festival&apos;s, no unconfirmed features, no outcome promises.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function describeError(code: string | undefined): string {
  switch (code) {
    case "content_check_failed": return "The writer broke the content rules twice, so nothing was saved.";
    case "occasion_required": return "This angle needs a verified festival.";
    case "occasion_not_publishable": return "That festival is not currently verified for publication, so nothing was written.";
    case "generation_failed":
    case "empty_content": return "The writer did not return usable copy. Nothing was saved. Try again.";
    case "invalid_channels": return "Choose email, WhatsApp or both.";
    case "invalid_pillar":
    case "invalid_region":
    case "invalid_tradition": return "One of the choices was not recognised. Refresh the page and try again.";
    default: return "Could not draft the campaign. Nothing was saved.";
  }
}
