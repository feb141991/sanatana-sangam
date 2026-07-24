/**
 * Automated (non-LLM) source-finder for the Dharm Veer generation pipeline.
 *
 * This module does real HTTP fetches against a small allowlist of known-good
 * public-domain text archives -- it never asks a language model to "recall" a
 * source or invent a citation. Everything it returns is text that was
 * actually fetched from a real URL, moments ago, by this code.
 *
 * IMPORTANT: this is a rough, automated first pass, not a final authority.
 * Every candidate it finds is written to `dharm_veers` with
 * `review_status: 'pending_review'` and must be approved by a human before
 * it is ever shown to a user (see src/lib/dharm-veer-review.ts and
 * src/app/admin/dharm-veer-review). The nuanced judgment calls made by hand
 * throughout this project's manual sourcing batches (translator death-year
 * checks, OCR-quality checks, "is this passage actually about the person or
 * just a tangential mention" checks) are NOT fully replicated here -- a
 * human reviewer is expected to make those calls before approval.
 *
 * Rolling US public-domain cutoff: works published in or before 1930 are
 * treated as safe (matches the cutoff used throughout this session's manual
 * sourcing work as of 2026). This module only auto-accepts items with a
 * confirmed publication year at or before that cutoff; anything with no
 * clear year, or a year after the cutoff, is discarded rather than guessed.
 */

const PD_YEAR_CUTOFF = 1930;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_EXCERPT_CHARS = 6_000;

export interface SourceCandidate {
  sourceName: string;
  sourceUrl: string;
  rightsStatus: 'public_domain';
  excerpt: string;
  /** Where this candidate came from, for audit/debugging. */
  provider: 'archive.org';
  /** Publication year used to justify the public_domain claim. */
  publicationYear: number;
}

interface ArchiveOrgSearchDoc {
  identifier: string;
  title?: string;
  year?: string;
  date?: string;
  creator?: string | string[];
  language?: string | string[];
}

async function fetchJson(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ShoonayaDharmVeerSourceFinder/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ShoonayaDharmVeerSourceFinder/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractYear(doc: ArchiveOrgSearchDoc): number | null {
  const raw = doc.year || doc.date || '';
  const match = String(raw).match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Searches archive.org's advancedsearch API for English-language text items
 * whose title mentions the hero's name. Real HTTP call, JSON response --
 * nothing here is model-generated.
 */
export async function searchArchiveOrgForHero(heroName: string): Promise<ArchiveOrgSearchDoc[]> {
  const q = `title:(${JSON.stringify(heroName)}) AND mediatype:texts AND language:(eng OR English)`;
  const url =
    'https://archive.org/advancedsearch.php' +
    `?q=${encodeURIComponent(q)}` +
    '&fl[]=identifier&fl[]=title&fl[]=year&fl[]=date&fl[]=creator&fl[]=language' +
    '&rows=10&output=json';

  try {
    const data = await fetchJson(url);
    const docs: ArchiveOrgSearchDoc[] = data?.response?.docs ?? [];
    return docs;
  } catch {
    // Network/timeout failure -- treat as "no candidates found", never throw
    // out of the source-finder into the generation pipeline.
    return [];
  }
}

/**
 * Given an archive.org identifier, fetches a leading excerpt of its plain-text
 * transcription and checks whether the hero's name actually appears in it.
 * Returns null if the fetch fails, times out, or the name doesn't appear --
 * all of those are legitimate "not a usable candidate" outcomes given this
 * session's repeated experience with archive.org djvu.txt fetches being
 * truncated, dominated by site-chrome, or landing on unrelated volumes.
 */
async function fetchExcerptIfRelevant(identifier: string, heroName: string): Promise<string | null> {
  const url = `https://archive.org/stream/${identifier}/${identifier}_djvu.txt`;
  let text: string;
  try {
    text = await fetchText(url);
  } catch {
    return null;
  }

  const nameParts = heroName
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length > 2);
  const lower = text.toLowerCase();
  const hitCount = nameParts.filter((part) => lower.includes(part)).length;

  // Require most of the name's significant words to actually appear --
  // guards against the "search matched the title but the body is something
  // else entirely" failure mode seen repeatedly in manual sourcing this
  // session (e.g. archive.org UI chrome, or a differently-scoped volume).
  if (nameParts.length > 0 && hitCount < Math.ceil(nameParts.length * 0.6)) {
    return null;
  }

  return text.slice(0, MAX_EXCERPT_CHARS);
}

/**
 * Top-level entry point: finds real, fetched, plausibly-relevant public-domain
 * source candidates for a hero. Returns an empty array (never throws, never
 * fabricates) when nothing usable is found -- callers should treat an empty
 * result as "skip this hero for now, do not generate", consistent with this
 * project's standing no-fabrication policy.
 */
export async function findSourceCandidates(heroName: string): Promise<SourceCandidate[]> {
  const docs = await searchArchiveOrgForHero(heroName);
  const candidates: SourceCandidate[] = [];

  for (const doc of docs) {
    const year = extractYear(doc);
    if (year === null || year > PD_YEAR_CUTOFF) continue;

    const excerpt = await fetchExcerptIfRelevant(doc.identifier, heroName);
    if (!excerpt) continue;

    candidates.push({
      sourceName: `${doc.title || doc.identifier}${doc.creator ? ` (${Array.isArray(doc.creator) ? doc.creator[0] : doc.creator})` : ''}, ${year}`,
      sourceUrl: `https://archive.org/details/${doc.identifier}`,
      rightsStatus: 'public_domain',
      excerpt,
      provider: 'archive.org',
      publicationYear: year,
    });

    // Cap at 3 candidates per hero -- this is a leads list for a human
    // reviewer, not an exhaustive search.
    if (candidates.length >= 3) break;
  }

  return candidates;
}
