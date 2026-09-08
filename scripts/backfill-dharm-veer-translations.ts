/**
 * Backfills detailed Hindi + real Punjabi translations onto existing
 * dharm_veers rows.
 *
 * Root cause this repairs: the generation prompt (src/lib/dharm-veer-generation.ts)
 * used to say "same in Hindi" for every _local field with no independent
 * length instruction, so the model regularly produced a one-sentence stub
 * against a full English paragraph (measured: journey_local averaged 41% of
 * journey's length across the live table, worst case 12%). Punjabi never
 * existed in the pipeline at all.
 *
 * This is explicitly a TRANSLATION task, not a research task: each row's
 * EXISTING, already human-approved English fields are treated as fixed
 * source-of-truth facts. The model is asked to render them faithfully into
 * detailed Hindi and Punjabi -- never to add or drop a fact. This sidesteps
 * the fact that only 6 of 76 rows have their original grounding
 * source_citations stored; re-deriving facts from scratch for the other 70
 * would risk surfacing different facts than what a human already approved.
 *
 * Usage:
 *   npx tsx scripts/backfill-dharm-veer-translations.ts [--dry-run] [--slug=<slug>]
 *     [--limit=N] [--concurrency=3] [--min-ratio=0.6] [--force] [--report-out <path>]
 *
 * --dry-run: runs the full pipeline (including AI calls) but logs the diff
 *   instead of writing. Not free -- still costs AI calls. Run this first,
 *   manually spot-check the known-worst cases, before a real run.
 * --force: bypass the "already healthy" skip check and re-process every row.
 * --report-out <path>: write a JSON report of every row processed (changed
 *   or skipped) to this path -- this report is what
 *   scripts/apply-dharm-veer-static-translations.ts consumes for the
 *   generated_by === 'static-curated-v1' subset.
 */

import { config } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

import { generateWithProvider } from '../src/lib/ai/providers/inference';

config({ path: '.env.local' });
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const FIELD_NAMES = ['tagline', 'journey', 'trial', 'teaching', 'moral', 'legacy'] as const;
type FieldName = (typeof FIELD_NAMES)[number];

interface DharmVeerRow {
  slug: string;
  name: string;
  generated_by: string | null;
  tagline: string;
  journey: string;
  trial: string;
  teaching: string;
  moral: string;
  legacy: string | null;
  quote: string | null;
  tagline_local: string | null;
  journey_local: string | null;
  trial_local: string | null;
  teaching_local: string | null;
  moral_local: string | null;
  legacy_local: string | null;
  quote_local: string | null;
  tagline_pa: string | null;
  journey_pa: string | null;
  trial_pa: string | null;
  teaching_pa: string | null;
  moral_pa: string | null;
  legacy_pa: string | null;
  quote_pa: string | null;
}

interface TranslatedFields {
  tagline_local: string;
  tagline_pa: string;
  journey_local: string;
  journey_pa: string;
  trial_local: string;
  trial_pa: string;
  teaching_local: string;
  teaching_pa: string;
  moral_local: string;
  moral_pa: string;
  legacy_local: string;
  legacy_pa: string;
  quote_local: string;
  quote_pa: string;
}

interface Options {
  dryRun: boolean;
  slug?: string;
  limit?: number;
  concurrency: number;
  minRatio: number;
  force: boolean;
  reportOut?: string;
}

interface FieldChangeReport {
  field: FieldName;
  englishLength: number;
  before: { hiLength: number; hiRatio: number; paLength: number; paRatio: number };
  after: { hiLength: number; hiRatio: number; paLength: number; paRatio: number };
}

interface RowReport {
  slug: string;
  generatedBy: string | null;
  status: 'updated' | 'skipped_already_healthy' | 'skipped_dry_run' | 'failed';
  changedFields: FieldChangeReport[];
  failureReason?: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = { dryRun: false, concurrency: 3, minRatio: 0.6, force: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--force') {
      opts.force = true;
    } else if (arg.startsWith('--slug=')) {
      opts.slug = arg.slice('--slug='.length);
    } else if (arg.startsWith('--limit=')) {
      opts.limit = parseInt(arg.slice('--limit='.length), 10);
    } else if (arg.startsWith('--concurrency=')) {
      opts.concurrency = parseInt(arg.slice('--concurrency='.length), 10);
    } else if (arg.startsWith('--min-ratio=')) {
      opts.minRatio = parseFloat(arg.slice('--min-ratio='.length));
    } else if (arg.startsWith('--report-out=')) {
      opts.reportOut = arg.slice('--report-out='.length);
    } else if (arg === '--report-out' && args[i + 1]) {
      opts.reportOut = args[++i];
    }
  }

  return opts;
}

/** True when candidate is a real, sufficiently-detailed rendering of english. */
function isTranslationAcceptable(english: string, candidate: string | undefined, minRatio: number): boolean {
  if (!english) return true; // nothing to translate
  if (!candidate || !candidate.trim()) return false;
  if (candidate.trim() === english.trim()) return false; // lazy no-op "translation"
  return candidate.length / english.length >= minRatio;
}

function fieldEnglishText(row: DharmVeerRow, field: FieldName): string {
  return field === 'legacy' ? row.legacy ?? '' : row[field];
}

function fieldExistingText(row: DharmVeerRow, field: FieldName, lang: 'local' | 'pa'): string | undefined {
  const key = `${field}_${lang}` as keyof DharmVeerRow;
  return (row[key] as string | null) ?? undefined;
}

/**
 * Which fields on this row need a fresh translation. A field only needs work
 * if either its Hindi or Punjabi sibling fails the acceptability check --
 * this makes the script safe to re-run: a row that's already fully healthy
 * costs zero AI calls.
 */
function needsBackfill(row: DharmVeerRow, minRatio: number, force: boolean): FieldName[] {
  if (force) return [...FIELD_NAMES];
  return FIELD_NAMES.filter((field) => {
    const english = fieldEnglishText(row, field);
    if (!english) return false;
    const hi = fieldExistingText(row, field, 'local');
    const pa = fieldExistingText(row, field, 'pa');
    return !isTranslationAcceptable(english, hi, minRatio) || !isTranslationAcceptable(english, pa, minRatio);
  });
}

/**
 * One field, one language, per call. The active inference provider
 * (sarvam-hosted) enforces a hard server-side ceiling of 4096 output tokens
 * (SARVAM_MAX_TOKENS_LIMIT, packages/pramana-serve/src/providers/sarvam.ts)
 * -- raising maxOutputTokens past that has no effect, it's silently clamped.
 * Even a single language's full 7 fields (several ~150 English words each,
 * rendered into non-Latin scripts that tokenize less efficiently) reliably
 * exceeded that ceiling before completing. A single field in a single
 * language is comfortably within it, at the cost of more total calls (14 per
 * row instead of 1) -- reliability over round-trip count, given the ceiling
 * can't be raised.
 */
async function callTranslateField(
  row: DharmVeerRow,
  field: FieldName,
  language: 'hi' | 'pa',
  english: string,
  followUp?: string,
): Promise<string> {
  const languageName = language === 'hi' ? 'Hindi (Devanagari script)' : 'Punjabi (Gurmukhi script)';

  const prompt = {
    system:
      `You are a careful localization assistant for a spiritual-education app. You are given a single passage of ` +
      `English biographical prose that a human editor has ALREADY reviewed and approved as factually correct. Your ` +
      `ONLY job is to render it faithfully into detailed, natural ${languageName}. This is translation/localization ` +
      `of already-approved content, not research: do not add any fact, name, date, or detail that is not present in ` +
      `the given English text, and do not omit any fact from it or summarize it down. Match the English text's depth ` +
      `and approximate length. Respond with the ${languageName} rendering only -- no preamble, no explanation, no ` +
      `English text, just the translated passage itself.`,
    user: `Hero: ${row.name}
Field: ${field}

English text:
${english}
${followUp ? `\n${followUp}\n` : ''}
Render the above faithfully in ${languageName}, matching its depth and approximate length. Respond with ONLY the translated text, nothing else.`,
    reasoningEffort: 'none' as const,
  };

  // 1200 was too tight -- the longer fields (journey/trial, ~150 English
  // words) regularly needed the provider's own automatic retry (which
  // doubles this budget, capped at the 4096 hard ceiling) to complete.
  // Requesting a generous budget up front means most calls succeed on the
  // first attempt instead of relying on that retry, which matters here:
  // this repo's circuit breaker (src/lib/monitoring/circuit-breaker.ts,
  // shared per-provider across ALL concurrent calls) opens after 5
  // consecutive failures -- firing many fields at once each needing a retry
  // can trip it and take down otherwise-fine calls too.
  const result = await generateWithProvider(prompt, { maxOutputTokens: 2500 });
  return result.text.trim();
}

/**
 * Retries at the individual field+language level, not the whole row. With
 * 14 independent calls per row, requiring all of them to succeed together in
 * one pass (the original design) meant a single stubborn field forced the
 * entire row to be re-translated from scratch, and with any non-trivial
 * per-call failure rate the odds of getting all 14 to land simultaneously
 * are poor. Retrying (and ratio-checking) each field independently is far
 * more likely to converge, and wastes far less work when it doesn't.
 */
async function translateFieldForLanguage(
  row: DharmVeerRow,
  field: FieldName,
  language: 'hi' | 'pa',
  minRatio: number,
): Promise<string> {
  const english = fieldEnglishText(row, field);
  if (!english) return '';

  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const followUp =
      attempt === 0
        ? undefined
        : 'Your previous output was too short relative to the English source (or missing) -- expand it to match depth, still using only the given facts.';
    try {
      const text = await callTranslateField(row, field, language, english, followUp);
      if (isTranslationAcceptable(english, text, minRatio)) {
        return text;
      }
      lastError = new Error(`Translation for ${field}/${language} failed the ${minRatio} length-ratio check`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Bounded-concurrency Promise.allSettled -- limits how many jobs run at once. */
async function settleInBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    batchResults.forEach((result, j) => {
      results[i + j] = result;
    });
  }
  return results;
}

async function translateRowContent(
  row: DharmVeerRow,
  fieldsNeeded: FieldName[],
  minRatio: number,
): Promise<{ translated: TranslatedFields; failures: string[] }> {
  const languages: Array<'hi' | 'pa'> = ['hi', 'pa'];
  const jobs = fieldsNeeded.flatMap((field) => languages.map((language) => ({ field, language })));

  // Bounded, not all 14 at once -- firing every field+language job for a row
  // simultaneously (previously via a single Promise.allSettled) creates
  // enough concurrent load that a run of failures trips the shared circuit
  // breaker (5 consecutive failures) and takes down otherwise-fine calls
  // alongside the genuinely struggling ones.
  const results = await settleInBatches(jobs, 4, async ({ field, language }) => ({
    field,
    language,
    text: await translateFieldForLanguage(row, field, language, minRatio),
  }));

  const translated: Record<string, string> = {};
  const failures: string[] = [];
  results.forEach((result, i) => {
    const { field, language } = jobs[i];
    const suffix = language === 'hi' ? 'local' : 'pa';
    if (result.status === 'fulfilled') {
      translated[`${field}_${suffix}`] = result.value.text;
    } else {
      failures.push(`${field}_${suffix}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    }
  });

  return { translated: translated as unknown as TranslatedFields, failures };
}

function fieldReport(row: DharmVeerRow, field: FieldName, translated: TranslatedFields): FieldChangeReport {
  const english = fieldEnglishText(row, field);
  const enLen = english.length || 1;
  const beforeHi = fieldExistingText(row, field, 'local') ?? '';
  const beforePa = fieldExistingText(row, field, 'pa') ?? '';
  const afterHi = translated[`${field}_local` as keyof TranslatedFields] ?? '';
  const afterPa = translated[`${field}_pa` as keyof TranslatedFields] ?? '';

  return {
    field,
    englishLength: english.length,
    before: {
      hiLength: beforeHi.length,
      hiRatio: Math.round((beforeHi.length / enLen) * 100) / 100,
      paLength: beforePa.length,
      paRatio: Math.round((beforePa.length / enLen) * 100) / 100,
    },
    after: {
      hiLength: afterHi.length,
      hiRatio: Math.round((afterHi.length / enLen) * 100) / 100,
      paLength: afterPa.length,
      paRatio: Math.round((afterPa.length / enLen) * 100) / 100,
    },
  };
}

// Kept untyped (matches src/app/api/admin/dharm-veer-review/route.ts's own
// convention/comment): this repo's hand-written generated Database type
// intersects some ad-hoc columns/tables into `never`, and this is a
// service-role batch script, not a request handler needing that safety net.
async function backfillRow(
  supabase: any,
  row: DharmVeerRow,
  opts: Options,
): Promise<RowReport> {
  const fieldsNeeded = needsBackfill(row, opts.minRatio, opts.force);
  if (fieldsNeeded.length === 0) {
    return { slug: row.slug, generatedBy: row.generated_by, status: 'skipped_already_healthy', changedFields: [] };
  }

  // Retries happen inside translateRowContent, per field+language -- see its
  // own doc comment for why. A row only truly fails here if at least one
  // field exhausted its own retries.
  const { translated, failures } = await translateRowContent(row, fieldsNeeded, opts.minRatio);

  if (failures.length > 0) {
    return {
      slug: row.slug,
      generatedBy: row.generated_by,
      status: 'failed',
      changedFields: [],
      failureReason: failures.join('; '),
    };
  }

  const changedFields = fieldsNeeded.map((field) => fieldReport(row, field, translated));

  if (opts.dryRun) {
    return { slug: row.slug, generatedBy: row.generated_by, status: 'skipped_dry_run', changedFields };
  }

  const update: Record<string, string | null> = {};
  for (const field of fieldsNeeded) {
    update[`${field}_local`] = translated[`${field}_local` as keyof TranslatedFields] || null;
    update[`${field}_pa`] = translated[`${field}_pa` as keyof TranslatedFields] || null;
  }

  const { error } = await supabase.from('dharm_veers').update(update).eq('slug', row.slug);
  if (error) {
    return { slug: row.slug, generatedBy: row.generated_by, status: 'failed', changedFields: [], failureReason: error.message };
  }

  await supabase.from('dharm_veer_generation_log').upsert(
    {
      slug: row.slug,
      status: 'generated_approved',
      notes: `Hindi/Punjabi backfilled by scripts/backfill-dharm-veer-translations.ts on ${new Date().toISOString()}; fields: ${fieldsNeeded.join(', ')}.`,
    },
    { onConflict: 'slug' },
  );

  return { slug: row.slug, generatedBy: row.generated_by, status: 'updated', changedFields };
}

async function processInBatches<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn));
  }
}

async function main() {
  const opts = parseArgs();
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  let query = supabase
    .from('dharm_veers')
    .select(
      'slug, name, generated_by, tagline, journey, trial, teaching, moral, legacy, quote, ' +
        'tagline_local, journey_local, trial_local, teaching_local, moral_local, legacy_local, quote_local, ' +
        'tagline_pa, journey_pa, trial_pa, teaching_pa, moral_pa, legacy_pa, quote_pa',
    );

  if (opts.slug) query = query.eq('slug', opts.slug);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as DharmVeerRow[];

  console.log(`[backfill-dharm-veer] loaded ${rows.length} row(s)${opts.dryRun ? ' [DRY RUN]' : ''}`);

  const reports: RowReport[] = [];
  await processInBatches(rows, opts.concurrency, async (row) => {
    const report = await backfillRow(supabase, row, opts);
    reports.push(report);
    console.log(
      `[backfill-dharm-veer] ${row.slug} (${row.generated_by ?? 'unknown'}): ${report.status}` +
        (report.failureReason ? ` -- ${report.failureReason}` : '') +
        (report.changedFields.length ? ` -- fields: ${report.changedFields.map((f) => f.field).join(', ')}` : ''),
    );
  });

  const summary = {
    total: reports.length,
    updated: reports.filter((r) => r.status === 'updated').length,
    skippedAlreadyHealthy: reports.filter((r) => r.status === 'skipped_already_healthy').length,
    skippedDryRun: reports.filter((r) => r.status === 'skipped_dry_run').length,
    failed: reports.filter((r) => r.status === 'failed').length,
  };
  console.log('[backfill-dharm-veer] summary:', JSON.stringify(summary, null, 2));

  const failed = reports.filter((r) => r.status === 'failed');
  if (failed.length > 0) {
    console.warn(`[backfill-dharm-veer] ${failed.length} row(s) failed:`, failed.map((r) => r.slug).join(', '));
  }

  if (opts.reportOut) {
    writeFileSync(opts.reportOut, JSON.stringify({ options: opts, summary, rows: reports }, null, 2), 'utf8');
    console.log(`[backfill-dharm-veer] report written to ${opts.reportOut}`);
  }
}

void main().catch((error) => {
  console.error('[backfill-dharm-veer] failed:', error);
  process.exit(1);
});
