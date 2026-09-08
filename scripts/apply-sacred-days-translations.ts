/**
 * Merges externally-generated Hindi/Punjabi translations for
 * observance_definitions (SacredDaysCard) into rules.json -- the git-reviewed
 * source of truth for this table (see scripts/seed-observance-definitions.ts,
 * which upserts CANONICAL_RULES into the DB keyed by slug).
 *
 * This script only edits rules.json. It does NOT write to the database --
 * after reviewing the diff and committing, run
 * `npx tsx scripts/seed-observance-definitions.ts` separately to push the
 * new columns live. Keeping these as two steps means a bad translation batch
 * never reaches production without a human looking at the rules.json diff
 * first (the same reason dharm_veers content flows through a git-tracked
 * source rather than being written to the DB directly).
 *
 * Input: a JSON file shaped like the sacred-days-translation-prompt's output
 * -- an array of { slug, display_name_hi, display_name_pa, description_hi,
 * description_pa }. Applies the same acceptance gate as
 * apply-dharm-veer-external-translations.ts (reject empty, reject a lazy
 * identical-to-English copy) -- no length-ratio check here, since these are
 * short captions where script-density differences make ratio an unreliable
 * signal (unlike the paragraph-length Dharm Veer biographies).
 *
 * Usage:
 *   npx tsx scripts/apply-sacred-days-translations.ts <input.json> [--dry-run] [--report-out <path>]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RULES_PATH = path.resolve(__dirname, '../packages/dharma-rules/src/festivals/rules.json');

interface InputRow {
  slug: string;
  display_name_hi?: string | null;
  display_name_pa?: string | null;
  description_hi?: string | null;
  description_pa?: string | null;
}

interface RuleRow {
  slug: string;
  display_name: string;
  display_name_local?: string;
  display_name_pa?: string;
  description: string;
  description_local?: string;
  description_pa?: string;
  [key: string]: unknown;
}

interface Options {
  inputPath: string;
  dryRun: boolean;
  reportOut?: string;
}

type FieldOutcome = 'accepted' | 'rejected_identical' | 'skipped_empty' | 'skipped_slug_not_found';

interface RowReport {
  slug: string;
  display_name_local: FieldOutcome;
  display_name_pa: FieldOutcome;
  description_local: FieldOutcome;
  description_pa: FieldOutcome;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith('--'));
  const inputPath = positional[0];
  if (!inputPath) {
    throw new Error('Usage: npx tsx scripts/apply-sacred-days-translations.ts <input.json> [--dry-run] [--report-out <path>]');
  }
  const opts: Options = { inputPath, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg.startsWith('--report-out=')) opts.reportOut = arg.slice('--report-out='.length);
    else if (arg === '--report-out' && args[i + 1]) opts.reportOut = args[++i];
  }
  return opts;
}

/** Reject a stub/empty non-answer or a lazy identical copy of the English text. */
function evaluate(english: string, candidate: string | null | undefined): 'accepted' | 'rejected_identical' | 'skipped_empty' {
  if (!candidate || !candidate.trim()) return 'skipped_empty';
  if (candidate.trim() === english.trim()) return 'rejected_identical';
  return 'accepted';
}

function main() {
  const opts = parseArgs();
  const inputRows = JSON.parse(readFileSync(opts.inputPath, 'utf8')) as InputRow[];
  const rules = JSON.parse(readFileSync(RULES_PATH, 'utf8')) as RuleRow[];
  const rulesBySlug = new Map(rules.map((r) => [r.slug, r]));

  console.log(`[apply-sacred-days] loaded ${inputRows.length} input row(s), ${rules.length} rules.json row(s)${opts.dryRun ? ' [DRY RUN]' : ''}`);

  const reports: RowReport[] = [];
  let changedCount = 0;

  for (const input of inputRows) {
    const rule = rulesBySlug.get(input.slug);
    if (!rule) {
      reports.push({
        slug: input.slug,
        display_name_local: 'skipped_slug_not_found',
        display_name_pa: 'skipped_slug_not_found',
        description_local: 'skipped_slug_not_found',
        description_pa: 'skipped_slug_not_found',
      });
      console.warn(`[apply-sacred-days] ${input.slug}: no matching slug in rules.json -- skipped`);
      continue;
    }

    const nameHiOutcome = evaluate(rule.display_name, input.display_name_hi);
    const namePaOutcome = evaluate(rule.display_name, input.display_name_pa);
    const descHiOutcome = evaluate(rule.description, input.description_hi);
    const descPaOutcome = evaluate(rule.description, input.description_pa);

    if (nameHiOutcome === 'accepted') { rule.display_name_local = input.display_name_hi!.trim(); changedCount++; }
    if (namePaOutcome === 'accepted') { rule.display_name_pa = input.display_name_pa!.trim(); changedCount++; }
    if (descHiOutcome === 'accepted') { rule.description_local = input.description_hi!.trim(); changedCount++; }
    if (descPaOutcome === 'accepted') { rule.description_pa = input.description_pa!.trim(); changedCount++; }

    reports.push({
      slug: input.slug,
      display_name_local: nameHiOutcome,
      display_name_pa: namePaOutcome,
      description_local: descHiOutcome,
      description_pa: descPaOutcome,
    });
  }

  console.log(`[apply-sacred-days] ${changedCount} field(s) accepted across ${inputRows.length} row(s)`);

  if (!opts.dryRun) {
    writeFileSync(RULES_PATH, JSON.stringify(rules, null, 2) + '\n', 'utf8');
    console.log(`[apply-sacred-days] rules.json updated -- review the diff, then run scripts/seed-observance-definitions.ts to push live`);
  } else {
    console.log('[apply-sacred-days] dry run -- rules.json not written');
  }

  if (opts.reportOut) {
    writeFileSync(opts.reportOut, JSON.stringify({ options: opts, changedCount, rows: reports }, null, 2), 'utf8');
    console.log(`[apply-sacred-days] report written to ${opts.reportOut}`);
  }
}

main();
