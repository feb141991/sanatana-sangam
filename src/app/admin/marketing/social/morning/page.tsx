"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, Copy, Download, Image as ImageIcon, RefreshCw, RotateCcw, Sunrise, X
} from "lucide-react";

type Tradition = "hindu" | "sikh" | "buddhist" | "jain";
type Status = "draft" | "approved" | "rejected" | "withheld";

interface Card {
  id: string;
  card_date: string;
  tradition: Tradition;
  status: Status;
  withheld_reason: string | null;
  withheld_detail: string | null;
  citation: string | null;
  caption: string;
  hashtags: string[];
  image_url: string | null;
  approved_by: string | null;
}

interface ArtPrompt {
  tradition: Tradition;
  prompt: string;
  negativePrompt: string;
}

type Outcome =
  | { tradition: Tradition; result: "created" | "regenerated" | "already_generated"; cardId: string }
  | { tradition: Tradition; result: "withheld"; reason: string; detail: string }
  | { tradition: Tradition; result: "not_regenerated"; detail: string }
  | { tradition: Tradition; result: "error"; detail: string };

const NAMES: Record<Tradition, string> = { hindu: "Sanatan Dharma", sikh: "Sikhi", buddhist: "Buddha Dharma", jain: "Jain Dharma" };
const ORDER: Tradition[] = ["hindu", "sikh", "buddhist", "jain"];

const STATUS_STYLE: Record<Status, string> = {
  draft: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  withheld: "bg-amber-500/10 text-amber-700 border-amber-500/20"
};

const WITHHELD_HELP: Record<string, string> = {
  corpus_not_usable: "No text can be posted for this tradition yet. Its source text failed the checks that keep placeholder, repeated or corrupted scripture off the cards.",
  font_missing: "A font this script needs is not installed on the server, so the card cannot be drawn correctly.",
  render_failed: "The card could not be drawn. Nothing was saved as a card.",
  no_usable_verse: "No verse could be chosen for this day."
};

function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Reads an API answer. An empty or non-JSON body (a proxy error page, a timeout) becomes a plain sentence, never a JavaScript error. */
async function readAnswer(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`The server did not answer properly (status ${res.status}). Try again in a moment.`);
  }
}

function parseTags(text: string): string[] {
  return text.split(/[\s,]+/).map((t) => t.replace(/^#+/, "")).filter(Boolean);
}

function describe(outcome: Outcome): string {
  const name = NAMES[outcome.tradition];
  switch (outcome.result) {
    case "created": return `${name}: card made.`;
    case "regenerated": return `${name}: card made again.`;
    case "already_generated": return `${name}: already made, left as it is.`;
    case "withheld": return `${name}: held back. ${outcome.detail}`;
    case "not_regenerated": return `${name}: ${outcome.detail}`;
    case "error": return `${name}: failed. ${outcome.detail}`;
  }
}

export default function MorningCardsPage() {
  const [date, setDate] = useState(todayInIndia());
  const [cards, setCards] = useState<Card[]>([]);
  const [prompts, setPrompts] = useState<ArtPrompt[]>([]);
  const [edits, setEdits] = useState<Record<string, { caption: string; tags: string }>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; lines: string[] } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const adopt = useCallback((next: Card[]) => {
    setCards(next);
    setEdits(Object.fromEntries(next.map((c) => [c.id, { caption: c.caption, tags: c.hashtags.map((t) => `#${t}`).join(" ") }])));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketing/social/morning-cards?date=${date}`, { cache: "no-store" });
      const data = await readAnswer(res);
      if (!res.ok) throw new Error(data.error ?? "Could not load the cards");
      adopt(data.cards ?? []);
      setPrompts(data.artPrompts ?? []);
      // A successful load means an earlier failed one is no longer true.
      setMessage((current) => (current?.kind === "error" ? null : current));
    } catch (err) {
      setMessage({ kind: "error", lines: [err instanceof Error ? err.message : "Could not load the cards"] });
    } finally {
      setLoading(false);
    }
  }, [date, adopt]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate(regenerate = false) {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/marketing/social/morning-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, regenerate })
      });
      const data = await readAnswer(res);
      if (!res.ok) throw new Error(data.error ?? "Could not generate the cards");
      adopt(data.cards ?? []);
      const failed = (data.outcomes as Outcome[]).some((o) => o.result === "error");
      setMessage({ kind: failed ? "error" : "ok", lines: (data.outcomes as Outcome[]).map(describe) });
    } catch (err) {
      setMessage({ kind: "error", lines: [err instanceof Error ? err.message : "Could not generate the cards"] });
    } finally {
      setGenerating(false);
    }
  }

  async function act(card: Card, action: "save" | "approve" | "reject") {
    setBusy((b) => ({ ...b, [card.id]: action }));
    setMessage(null);
    try {
      const edit = edits[card.id];
      const res = await fetch(
        action === "save" ? `/api/admin/marketing/social/morning-cards/${card.id}` : `/api/admin/marketing/social/morning-cards/${card.id}/${action}`,
        {
          method: action === "save" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: action === "save" ? JSON.stringify({ caption: edit.caption, hashtags: parseTags(edit.tags) }) : undefined
        }
      );
      const data = await readAnswer(res);
      if (!res.ok) throw new Error(data.error ?? "That did not work");
      await load();
      setMessage({ kind: "ok", lines: [action === "save" ? "Caption saved." : action === "approve" ? `${NAMES[card.tradition]} approved.` : `${NAMES[card.tradition]} rejected.`] });
    } catch (err) {
      setMessage({ kind: "error", lines: [err instanceof Error ? err.message : "That did not work"] });
    } finally {
      setBusy((b) => {
        const { [card.id]: _done, ...rest } = b;
        return rest;
      });
    }
  }

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      setMessage({ kind: "error", lines: ["Could not copy. Select the text and copy it by hand."] });
    }
  }

  const byTradition = new Map(cards.map((c) => [c.tradition, c]));
  const button = "min-h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] font-sans">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/marketing/social" aria-label="Back to the Social Publishing Studio" className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]">
              <ArrowLeft size={16} />
            </Link>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20"><Sunrise size={22} /></div>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-tight">Morning Cards</h1>
              <p className="text-xs text-[var(--text-muted)]">One verse card per tradition. You approve; nothing is posted from here.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-semibold flex items-center gap-2">
              Day
              <input
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="min-h-11 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs"
              />
            </label>
            <button onClick={() => void load()} className={`${button} border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={() => void generate(false)} disabled={generating} className={`${button} bg-slate-800 hover:bg-slate-900 text-white`}>
              <Sunrise size={14} /> {generating ? "Making the cards…" : "Generate this day's cards"}
            </button>
          </div>
        </div>

        <div aria-live="polite">
          {message && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${message.kind === "error" ? "bg-rose-500/10 border-rose-500/30 text-rose-800" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"}`}>
              {message.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
          )}
        </div>

        {!loading && cards.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] p-4 border border-dashed border-[var(--border-subtle)] rounded-xl">
            Nothing has been made for this day yet. Click “Generate this day&apos;s cards”.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ORDER.map((tradition) => {
            const card = byTradition.get(tradition);
            if (!card) return null;
            const edit = edits[card.id] ?? { caption: card.caption, tags: "" };
            const dirty = edit.caption !== card.caption || parseTags(edit.tags).join(" ") !== card.hashtags.join(" ");
            const working = busy[card.id];
            const full = `${edit.caption}${parseTags(edit.tags).length ? `\n\n${parseTags(edit.tags).map((t) => `#${t}`).join(" ")}` : ""}`;
            return (
              <section key={card.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 space-y-4" aria-label={`${NAMES[tradition]} card`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">{NAMES[tradition]}</h2>
                    {card.citation && <p className="text-[11px] text-[var(--text-muted)]">{card.citation}</p>}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${STATUS_STYLE[card.status]}`}>{card.status}</span>
                </div>

                {card.status === "withheld" ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                    <p className="font-semibold">Held back. No card was made.</p>
                    <p>{WITHHELD_HELP[card.withheld_reason ?? ""] ?? "This card could not be made."}</p>
                    {card.withheld_detail && <p className="text-[11px] text-[var(--text-muted)] break-words">{card.withheld_detail}</p>}
                    <p className="text-[11px] text-[var(--text-muted)]">It is tried again each time you generate, so fixing the cause needs no other step.</p>
                  </div>
                ) : (
                  <>
                    {card.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a signed link to a private-bucket draft; the image optimiser cannot fetch it
                      <img
                        src={card.image_url}
                        alt={`Morning card for ${NAMES[tradition]}${card.citation ? `: ${card.citation}` : ""}`}
                        className="w-full max-w-sm mx-auto rounded-xl border border-[var(--border-subtle)] aspect-[4/5] object-cover"
                      />
                    ) : (
                      <div className="w-full max-w-sm mx-auto rounded-xl border border-dashed border-[var(--border-subtle)] aspect-[4/5] flex items-center justify-center text-xs text-[var(--text-muted)]">
                        <ImageIcon size={18} className="mr-2" /> Image unavailable. Refresh.
                      </div>
                    )}

                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Caption
                      <textarea
                        aria-label={`Caption for ${NAMES[tradition]}`}
                        value={edit.caption}
                        onChange={(e) => setEdits((all) => ({ ...all, [card.id]: { ...edit, caption: e.target.value } }))}
                        rows={9}
                        maxLength={2200}
                        className="mt-1 w-full p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs font-normal normal-case tracking-normal"
                      />
                    </label>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Hashtags
                      <input
                        aria-label={`Hashtags for ${NAMES[tradition]}`}
                        value={edit.tags}
                        onChange={(e) => setEdits((all) => ({ ...all, [card.id]: { ...edit, tags: e.target.value } }))}
                        className="mt-1 w-full min-h-11 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs font-normal normal-case tracking-normal"
                      />
                    </label>

                    {card.status === "approved" && <p className="text-[11px] text-emerald-700">Approved by {card.approved_by}. Editing the caption sends it back to draft.</p>}
                    {dirty && <p className="text-[11px] text-amber-700">You have unsaved changes. Save the caption before approving.</p>}

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => void act(card, "save")} disabled={!dirty || !!working} className={`${button} border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`}>
                        {working === "save" ? "Saving…" : "Save caption"}
                      </button>
                      <button onClick={() => void act(card, "approve")} disabled={card.status !== "draft" || dirty || !!working} className={`${button} bg-emerald-600 hover:bg-emerald-700 text-white`}>
                        <Check size={14} /> {working === "approve" ? "Approving…" : "Approve"}
                      </button>
                      <button onClick={() => void act(card, "reject")} disabled={(card.status !== "draft" && card.status !== "approved") || !!working} className={`${button} border border-rose-500/40 text-rose-700 hover:bg-rose-500/10`}>
                        <X size={14} /> Reject
                      </button>
                      {card.image_url && (
                        <a href={card.image_url} download={`shoonaya-${card.card_date}-${card.tradition}.png`} className={`${button} border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`}>
                          <Download size={14} /> Download image
                        </a>
                      )}
                      <button onClick={() => void copy(card.id, full)} className={`${button} border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`}>
                        <Copy size={14} /> {copied === card.id ? "Copied" : "Copy caption"}
                      </button>
                    </div>
                  </>
                )}

                {(card.status === "rejected") && (
                  <button onClick={() => void generate(true)} disabled={generating} className={`${button} border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`}>
                    <RotateCcw size={14} /> Make this day&apos;s cards again
                  </button>
                )}
              </section>
            );
          })}
        </div>

        <details className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5">
          <summary className="text-sm font-bold cursor-pointer min-h-11 flex items-center">Background art prompts (for an image tool or an artist)</summary>
          <p className="text-[11px] text-[var(--text-muted)] mt-2">
            Nothing here generates art: no image tool is connected. These carry the app&apos;s own colours and say what must not appear. The cards above are drawn without any AI image, so every character is exactly the source text.
          </p>
          <div className="mt-4 space-y-5">
            {prompts.map((p) => (
              <div key={p.tradition} className="space-y-2">
                <h3 className="text-xs font-bold">{NAMES[p.tradition]}</h3>
                <p className="text-xs whitespace-pre-wrap p-3 rounded-xl bg-[var(--surface-base)] border border-[var(--border-subtle)]">{p.prompt}</p>
                <p className="text-[11px] text-[var(--text-muted)]">Avoid: {p.negativePrompt}</p>
                <div className="flex gap-2">
                  <button onClick={() => void copy(`${p.tradition}-prompt`, p.prompt)} className={`${button} border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`}>
                    <Copy size={14} /> {copied === `${p.tradition}-prompt` ? "Copied" : "Copy prompt"}
                  </button>
                  <button onClick={() => void copy(`${p.tradition}-neg`, p.negativePrompt)} className={`${button} border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]`}>
                    <Copy size={14} /> {copied === `${p.tradition}-neg` ? "Copied" : "Copy what to avoid"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      </main>
    </div>
  );
}
