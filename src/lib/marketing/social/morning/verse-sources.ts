/**
 * Which verse goes on which tradition's morning card, and whether a tradition may have one at all.
 *
 * Scripture integrity (AGENTS.md section 3) is enforced here, in code, on the data itself: a verse is only ever
 * shown if the corpus entry passes every check below, and a tradition whose corpus has no entry that passes is
 * WITHHELD with the reason, never filled with generic text. Because the checks read the data, a corpus that is
 * later repaired becomes usable by itself, and one that regresses is blocked again.
 *
 * What is shown is the corpus string, unchanged. The one thing this module decides is a translation credit, and
 * only when the corpus records enough to state one truthfully; otherwise no translation is shown.
 */
import { GITA_FULL_DATA } from "@/lib/gita-full-data";
import { JAPJI_SAHIB_ENTRIES } from "@/lib/data/sikh-japji-sahib";
import { DHAMMAPADA_ENTRIES } from "@/lib/data/buddhist-dhammapada";
import { METTA_SUTTA_ENTRIES } from "@/lib/data/buddhist-metta-sutta";
import { NAMOKAR_ENTRIES } from "@/lib/data/jain-namokar";
import { TATTVARTHA_ENTRIES } from "@/lib/data/jain-tattvartha-sutra";
import { BHAKTAMAR_ENTRIES } from "@/lib/data/jain-bhaktamar-stotra";
import type { MorningTradition, MorningVerse, PickResult, VerseScript } from "./types";

/** The fields of a corpus entry this module reads. */
export interface CorpusEntry {
  id: string;
  title?: string;
  source?: string;
  original?: string;
  transliteration?: string;
  meaning?: string;
  attribution?: string;
  tags?: readonly string[];
}

// Sizes the card can hold without shrinking the type below a readable size.
const MAX_ORIGINAL_CHARS = 200;
const MAX_ORIGINAL_LINES = 4;
const MAX_TRANSLATION_CHARS = 330;
const MIN_ORIGINAL_CHARS = 8;

/** Filler a data import leaves behind. Any of it in a field we would display makes the entry unusable. */
const PLACEHOLDER = /(romanized pali text|authentic pali verse covering|covering the subject of|meaning for verse \d+ goes here|goes here\b|placeholder|lorem ipsum|\btodo\b|\btbd\b)/i;

// Letters only. The danda marks U+0964 and U+0965 are shared by Devanagari and Gurbani, so they say nothing about script.
const DEVANAGARI_LETTER = /[ऀ-ॣ०-ॿ]/;
const GURMUKHI_LETTER = /[਀-੿]/;
const LATIN_LETTER = /[A-Za-z]/;

export type EntryProblem =
  | "original_missing_or_short"
  | "original_too_long"
  | "mixed_scripts"
  | "unsupported_script"
  | "script_not_expected"
  | "placeholder_text"
  | "duplicate_original"
  | "no_attribution"
  | "translation_too_long";

export function detectScript(text: string): VerseScript | "mixed" | "latin" | "none" {
  const dev = DEVANAGARI_LETTER.test(text);
  const gur = GURMUKHI_LETTER.test(text);
  if (dev && gur) return "mixed";
  if (dev) return "devanagari";
  if (gur) return "gurmukhi";
  return LATIN_LETTER.test(text) ? "latin" : "none";
}

function lineCount(text: string): number {
  return text.split("\n").filter((line) => line.trim()).length;
}

/**
 * Everything wrong with one entry. Empty means it may be shown.
 *
 * `expectedScripts` is the script(s) this tradition's text is actually written in. A Jain Prakrit line stored in
 * Gurmukhi, or a Sikh shabad stored in Devanagari, is a corrupted entry even though each is "one script".
 */
export function assessEntry(
  entry: CorpusEntry,
  duplicateOriginals: ReadonlySet<string>,
  expectedScripts?: readonly VerseScript[]
): EntryProblem[] {
  const problems: EntryProblem[] = [];
  const original = (entry.original ?? "").trim();

  if (original.length < MIN_ORIGINAL_CHARS) problems.push("original_missing_or_short");
  if (original.length > MAX_ORIGINAL_CHARS || lineCount(original) > MAX_ORIGINAL_LINES) problems.push("original_too_long");

  const script = detectScript(original);
  if (script === "mixed") problems.push("mixed_scripts");
  else if (original.length >= MIN_ORIGINAL_CHARS && script !== "devanagari" && script !== "gurmukhi") {
    problems.push("unsupported_script");
  } else if (expectedScripts && (script === "devanagari" || script === "gurmukhi") && !expectedScripts.includes(script)) {
    problems.push("script_not_expected");
  }

  if ([entry.original, entry.transliteration, entry.meaning].some((field) => PLACEHOLDER.test(field ?? ""))) {
    problems.push("placeholder_text");
  }
  if (duplicateOriginals.has(original)) problems.push("duplicate_original");
  if (!(entry.attribution ?? "").trim()) problems.push("no_attribution");
  return problems;
}

function findDuplicateOriginals(entries: readonly CorpusEntry[]): Set<string> {
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const key = (entry.original ?? "").trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, count]) => count > 1).map(([key]) => key));
}

export interface CorpusAssessment {
  usable: CorpusEntry[];
  total: number;
  /** How many entries have each problem (an entry can have several). */
  problemCounts: Partial<Record<EntryProblem, number>>;
}

export function assessCorpus(entries: readonly CorpusEntry[], expectedScripts?: readonly VerseScript[]): CorpusAssessment {
  const duplicates = findDuplicateOriginals(entries);
  const usable: CorpusEntry[] = [];
  const problemCounts: Partial<Record<EntryProblem, number>> = {};
  for (const entry of entries) {
    const problems = assessEntry(entry, duplicates, expectedScripts);
    if (problems.length === 0) usable.push(entry);
    for (const problem of problems) problemCounts[problem] = (problemCounts[problem] ?? 0) + 1;
  }
  return { usable, total: entries.length, problemCounts };
}

/** "423 of 423 have placeholder_text; 423 have unsupported_script" */
export function describeProblems(assessment: CorpusAssessment): string {
  const parts = Object.entries(assessment.problemCounts)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([problem, count]) => `${count} of ${assessment.total} have ${problem}`);
  return parts.length > 0 ? parts.join("; ") : "no entries";
}

// ── Translation credit ────────────────────────────────────────────────────────

/**
 * A translation is shown only when the corpus tags state whose it is and that it is free to use. The Gita corpus
 * is the public-domain Annie Besant translation (it says so in its tags and attribution). Gurbani and the other
 * corpora record no translator, so their English is NOT shown: the card then carries the original text only.
 */
export function translationCreditFor(entry: CorpusEntry): string | null {
  const tags = entry.tags ?? [];
  if (tags.includes("public-domain-translation") && tags.includes("wikisource-besant")) {
    return "Translation: Annie Besant (public domain)";
  }
  return null;
}

function toVerse(tradition: MorningTradition, entry: CorpusEntry): MorningVerse {
  const original = (entry.original ?? "").trim();
  const credit = translationCreditFor(entry);
  const translation = credit && (entry.meaning ?? "").trim() && (entry.meaning ?? "").trim().length <= MAX_TRANSLATION_CHARS
    ? (entry.meaning ?? "").trim()
    : null;
  return {
    tradition,
    sourceRef: entry.id,
    citation: (entry.source ?? entry.title ?? entry.id).trim(),
    script: detectScript(original) as VerseScript,
    original,
    transliteration: null,
    translation,
    translationCredit: translation ? credit : null,
    attribution: (entry.attribution ?? "").trim() || null
  };
}

// ── What each tradition draws from ────────────────────────────────────────────

/**
 * Bhagavad Gita verses chosen as self-contained and suited to the start of a day. They are picked by id; the text
 * is always read from the corpus. An id that does not exist, or fails the checks above, is simply skipped.
 */
export const GITA_MORNING_IDS: readonly string[] = [
  "gita-2-47", "gita-2-48", "gita-2-14", "gita-2-20", "gita-2-22", "gita-2-50", "gita-3-19", "gita-4-7", "gita-4-8",
  "gita-4-38", "gita-5-18", "gita-6-5", "gita-6-6", "gita-6-17", "gita-6-35", "gita-6-40", "gita-9-22", "gita-9-26",
  "gita-9-34", "gita-10-10", "gita-12-13", "gita-12-15", "gita-17-15", "gita-18-46", "gita-18-58", "gita-18-61",
  "gita-18-66", "gita-18-78"
];

export interface TraditionSource {
  tradition: MorningTradition;
  label: string;
  /** Every corpus this tradition could draw from, so the reason a tradition is withheld covers all of them. */
  /** The script this tradition's verses are written in. */
  scripts: readonly VerseScript[];
  corpora: Array<{ name: string; entries: readonly CorpusEntry[]; only?: readonly string[] }>;
}

const SOURCES: Record<MorningTradition, TraditionSource> = {
  hindu: {
    tradition: "hindu",
    label: "Hindu",
    scripts: ["devanagari"],
    corpora: [{ name: "Bhagavad Gita", entries: GITA_FULL_DATA as unknown as CorpusEntry[], only: GITA_MORNING_IDS }]
  },
  sikh: {
    tradition: "sikh",
    label: "Sikh",
    scripts: ["gurmukhi"],
    corpora: [{ name: "Japji Sahib", entries: JAPJI_SAHIB_ENTRIES as unknown as CorpusEntry[] }]
  },
  buddhist: {
    tradition: "buddhist",
    label: "Buddhist",
    // Pali is held here in Roman script, which the card cannot set; Devanagari Pali would be accepted.
    scripts: ["devanagari"],
    corpora: [
      { name: "Dhammapada", entries: DHAMMAPADA_ENTRIES as unknown as CorpusEntry[] },
      { name: "Metta Sutta", entries: METTA_SUTTA_ENTRIES as unknown as CorpusEntry[] }
    ]
  },
  jain: {
    tradition: "jain",
    label: "Jain",
    scripts: ["devanagari"],
    corpora: [
      { name: "Namokar Mantra", entries: NAMOKAR_ENTRIES as unknown as CorpusEntry[] },
      { name: "Tattvartha Sutra", entries: TATTVARTHA_ENTRIES as unknown as CorpusEntry[] },
      { name: "Bhaktamar Stotra", entries: BHAKTAMAR_ENTRIES as unknown as CorpusEntry[] }
    ]
  }
};

/** Whole days since 1970-01-01 for a "YYYY-MM-DD" date, so the pick depends on the date and nothing else. */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export interface TraditionPool {
  tradition: MorningTradition;
  usable: Array<{ corpus: string; entry: CorpusEntry }>;
  /** Why a corpus contributed nothing, for the withheld message. */
  corpusNotes: string[];
}

export function buildPool(source: TraditionSource): TraditionPool {
  const usable: TraditionPool["usable"] = [];
  const corpusNotes: string[] = [];
  for (const corpus of source.corpora) {
    const assessment = assessCorpus(corpus.entries, source.scripts);
    const allowed = corpus.only ? new Set(corpus.only) : null;
    const picked = assessment.usable.filter((entry) => !allowed || allowed.has(entry.id));
    if (allowed) {
      // Keep the curated order so the rotation is the one that was chosen.
      picked.sort((a, b) => corpus.only!.indexOf(a.id) - corpus.only!.indexOf(b.id));
    }
    for (const entry of picked) usable.push({ corpus: corpus.name, entry });
    if (picked.length === 0) corpusNotes.push(`${corpus.name}: ${describeProblems(assessment)}`);
  }
  return { tradition: source.tradition, usable, corpusNotes };
}

const poolCache = new Map<MorningTradition, TraditionPool>();
function poolFor(tradition: MorningTradition): TraditionPool {
  let pool = poolCache.get(tradition);
  if (!pool) {
    pool = buildPool(SOURCES[tradition]);
    poolCache.set(tradition, pool);
  }
  return pool;
}

/** The verse for one tradition on one date: the same answer every time it is asked, a different one each day. */
export function pickMorningVerse(tradition: MorningTradition, date: string): PickResult {
  const pool = poolFor(tradition);
  if (pool.usable.length === 0) {
    return {
      ok: false,
      reason: "corpus_not_usable",
      detail: `No ${SOURCES[tradition].label} text can be posted yet. ${pool.corpusNotes.join(" | ")}`
    };
  }
  const chosen = pool.usable[dayNumber(date) % pool.usable.length];
  return { ok: true, verse: toVerse(tradition, chosen.entry) };
}

/** For tests and the admin screen: how many distinct verses a tradition can rotate through. */
export function poolSize(tradition: MorningTradition): number {
  return poolFor(tradition).usable.length;
}
