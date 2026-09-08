/**
 * Applies externally-generated Hindi/Punjabi translations for dharm_veers
 * onto the live table, with the SAME validation gate as
 * scripts/backfill-dharm-veer-translations.ts (length-ratio check against
 * the English source, reject lazy identical copies) -- regardless of which
 * tool produced the translations (this exists specifically so a different
 * agent/model, e.g. Antigravity, can do the generation step while this
 * script remains the one and only path that actually writes to the DB).
 *
 * Input: a JSON file shaped like scripts/dharm-veer-english-export.json,
 * with each row's *_local/*_pa/name_pa fields filled in with NEW
 * translations (not the stale ones from the export -- this script
 * overwrites unconditionally for whichever rows are present in the input,
 * subject to the ratio gate below).
 *
 * Usage:
 *   npx tsx scripts/apply-dharm-veer-external-translations.ts <input.json> [--dry-run] [--min-ratio=0.6] [--report-out <path>]
 */

import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const FIELD_NAMES = ['tagline', 'journey', 'trial', 'teaching', 'moral', 'legacy', 'quote'] as const;
type FieldName = (typeof FIELD_NAMES)[number];

interface InputRow {
  slug: string;
  name: string;
  tagline: string;
  journey: string;
  trial: string;
  teaching: string;
  moral: string;
  legacy: string | null;
  quote: string | null;
  name_pa?: string | null;
  tagline_local?: string | null;
  tagline_pa?: string | null;
  journey_local?: string | null;
  journey_pa?: string | null;
  trial_local?: string | null;
  trial_pa?: string | null;
  teaching_local?: string | null;
  teaching_pa?: string | null;
  moral_local?: string | null;
  moral_pa?: string | null;
  legacy_local?: string | null;
  legacy_pa?: string | null;
  quote_local?: string | null;
  quote_pa?: string | null;
}

interface Options {
  inputPath: string;
  dryRun: boolean;
  minRatio: number;
  reportOut?: string;
}

interface FieldOutcome {
  field: FieldName;
  hi: 'accepted' | 'rejected_thin' | 'rejected_identical' | 'skipped_empty';
  pa: 'accepted' | 'rejected_thin' | 'rejected_identical' | 'skipped_empty';
}

interface RowReport {
  slug: string;
  status: 'updated' | 'skipped_dry_run' | 'skipped_no_fields' | 'failed';
  fields: FieldOutcome[];
  failureReason?: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith('--'));
  const inputPath = positional[0];
  if (!inputPath) {
    throw new Error('Usage: npx tsx scripts/apply-dharm-veer-external-translations.ts <input.json> [--dry-run] [--min-ratio=0.6] [--report-out <path>]');
  }

  const opts: Options = { inputPath, dryRun: false, minRatio: 0.6 };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg.startsWith('--min-ratio=')) opts.minRatio = parseFloat(arg.slice('--min-ratio='.length));
    else if (arg.startsWith('--report-out=')) opts.reportOut = arg.slice('--report-out='.length);
    else if (arg === '--report-out' && args[i + 1]) opts.reportOut = args[++i];
  }
  return opts;
}

/** Same acceptance rule as backfill-dharm-veer-translations.ts: reject a
 * stub, an empty non-answer, or a lazy identical copy of the English text. */
function isTranslationAcceptable(english: string, candidate: string | null | undefined, minRatio: number): 'accepted' | 'rejected_thin' | 'rejected_identical' | 'skipped_empty' {
  if (!english) return 'skipped_empty';
  if (!candidate || !candidate.trim()) return 'rejected_thin';
  if (candidate.trim() === english.trim()) return 'rejected_identical';
  return candidate.length / english.length >= minRatio ? 'accepted' : 'rejected_thin';
}

function fieldEnglishText(row: InputRow, field: FieldName): string {
  if (field === 'legacy') return row.legacy ?? '';
  if (field === 'quote') return row.quote ?? '';
  return row[field];
}

async function main() {
  const opts = parseArgs();
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  const rows = JSON.parse(readFileSync(opts.inputPath, 'utf8')) as InputRow[];
  console.log(`[apply-external] loaded ${rows.length} row(s) from ${opts.inputPath}${opts.dryRun ? ' [DRY RUN]' : ''}`);

  const reports: RowReport[] = [];

  for (const row of rows) {
    const fieldOutcomes: FieldOutcome[] = [];
    const update: Record<string, string | null> = {};
    let anyAccepted = false;

    if (row.name_pa && row.name_pa.trim()) {
      update.name_pa = row.name_pa.trim();
    }

    for (const field of FIELD_NAMES) {
      const english = fieldEnglishText(row, field);
      const hiCandidate = row[`${field}_local` as keyof InputRow] as string | null | undefined;
      const paCandidate = row[`${field}_pa` as keyof InputRow] as string | null | undefined;

      const hiOutcome = isTranslationAcceptable(english, hiCandidate, opts.minRatio);
      const paOutcome = isTranslationAcceptable(english, paCandidate, opts.minRatio);
      fieldOutcomes.push({ field, hi: hiOutcome, pa: paOutcome });

      if (hiOutcome === 'accepted') {
        update[`${field}_local`] = hiCandidate!.trim();
        anyAccepted = true;
      }
      if (paOutcome === 'accepted') {
        update[`${field}_pa`] = paCandidate!.trim();
        anyAccepted = true;
      }
    }

    if (!anyAccepted && !update.name_pa) {
      reports.push({ slug: row.slug, status: 'skipped_no_fields', fields: fieldOutcomes });
      console.log(`[apply-external] ${row.slug}: skipped_no_fields (nothing passed validation)`);
      continue;
    }

    if (opts.dryRun) {
      reports.push({ slug: row.slug, status: 'skipped_dry_run', fields: fieldOutcomes });
      console.log(`[apply-external] ${row.slug}: skipped_dry_run -- would update: ${Object.keys(update).join(', ')}`);
      continue;
    }

    const { error } = await supabase.from('dharm_veers').update(update).eq('slug', row.slug);
    if (error) {
      reports.push({ slug: row.slug, status: 'failed', fields: fieldOutcomes, failureReason: error.message });
      console.warn(`[apply-external] ${row.slug}: failed -- ${error.message}`);
      continue;
    }

    await supabase.from('dharm_veer_generation_log').upsert(
      {
        slug: row.slug,
        status: 'generated_approved',
        notes: `Hindi/Punjabi applied by scripts/apply-dharm-veer-external-translations.ts (externally generated) on ${new Date().toISOString()}; fields: ${Object.keys(update).join(', ')}.`,
      },
      { onConflict: 'slug' },
    );

    reports.push({ slug: row.slug, status: 'updated', fields: fieldOutcomes });
    console.log(`[apply-external] ${row.slug}: updated -- ${Object.keys(update).join(', ')}`);
  }

  const summary = {
    total: reports.length,
    updated: reports.filter((r) => r.status === 'updated').length,
    skippedDryRun: reports.filter((r) => r.status === 'skipped_dry_run').length,
    skippedNoFields: reports.filter((r) => r.status === 'skipped_no_fields').length,
    failed: reports.filter((r) => r.status === 'failed').length,
  };
  console.log('[apply-external] summary:', JSON.stringify(summary, null, 2));

  if (opts.reportOut) {
    writeFileSync(opts.reportOut, JSON.stringify({ options: opts, summary, rows: reports }, null, 2), 'utf8');
    console.log(`[apply-external] report written to ${opts.reportOut}`);
  }
}

void main().catch((error) => {
  console.error('[apply-external] failed:', error);
  process.exit(1);
});
