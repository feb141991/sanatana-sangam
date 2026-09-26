/**
 * Reconciles rows withheld by the 2026-09-09 cross-profile duplicate migration
 * against the committed reproduction receipt and current rule metadata.
 *
 * This script is classification-only. The current engine does not accept a
 * calendar profile, so an exact same-location date match is NOT profile
 * verification and cannot nominate a row for restoration. It never writes to
 * the database or changes publication state.
 *
 * Run: npx tsx scripts/reconcile-cross-profile-withheld-189.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { findKnownRulePublicationBlockers } from '../src/lib/calendar/rule-publication-blockers';

const BACKEND_ROOT = path.join(__dirname, '..');
const RECEIPT_PATH = path.join(
  BACKEND_ROOT,
  'docs/audits/observance-cross-profile-engine-reproduction-2026-09-24/receipt.json',
);
const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/cross-profile-withheld-189-reconciliation-2026-09-24');

type ReceiptRow = {
  selector_sha256: string;
  slug: string;
  year: number;
  stored_date: string;
  stored_calendar_profile: string;
  stored_variant_key: string;
  stored_timezone: string;
  stored_lat: number;
  stored_lon: number;
  stored_final_date_source: string;
  stored_calculated_by: string;
  stored_calculation_version: string;
  stored_publication_status: string;
  engine_dates_for_variant: string[];
  classification: 'exact_match' | 'slug_absent_from_engine' | 'stored_variant_absent_from_engine' | 'stored_date_absent_from_engine_output' | 'stored_coordinates_missing';
};

function findExactRule(slug: string, variantKey: string) {
  const candidates = CANONICAL_RULES.filter((rule) => rule.slug === slug);
  const matching = candidates.filter((rule) => {
    const qualifier = rule.variant_key ?? rule.sampradaya ?? 'legacy-default';
    return qualifier === variantKey ||
      ((qualifier === 'legacy-default' || qualifier === 'standard') &&
       (variantKey === 'legacy-default' || variantKey === 'standard'));
  });
  return matching.length === 1 ? matching[0] : null;
}

function main() {
  const receipt = JSON.parse(fs.readFileSync(RECEIPT_PATH, 'utf8')) as { rows: ReceiptRow[] };
  const rows = receipt.rows.map((row) => {
    const rule = findExactRule(row.slug, row.stored_variant_key);
    const knownBlockers = findKnownRulePublicationBlockers(rule, row.year);
    const engineReproduces = row.classification === 'exact_match';
    let category: string;

    if (!rule || row.classification === 'slug_absent_from_engine' || row.classification === 'stored_coordinates_missing') {
      category = 'unresolved_or_rule_identity_missing';
    } else if (!engineReproduces) {
      category = 'engine_date_differs_at_stored_location';
    } else {
      category = 'engine_reproduces_profile_unverified';
    }

    return {
      selector_sha256: row.selector_sha256,
      slug: row.slug,
      variant_key: row.stored_variant_key,
      year: row.year,
      stored_date: row.stored_date,
      stored_calendar_profile: row.stored_calendar_profile,
      engine_reproduces_at_stored_location: engineReproduces,
      engine_dates_for_variant: row.engine_dates_for_variant,
      exact_rule_identity_found: rule !== null,
      known_rule_publication_blockers: knownBlockers,
      category,
    };
  });

  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.category] = (counts[row.category] ?? 0) + 1;
  const publicationStatusCounts: Record<string, number> = {};
  for (const row of receipt.rows) {
    publicationStatusCounts[row.stored_publication_status] =
      (publicationStatusCounts[row.stored_publication_status] ?? 0) + 1;
  }
  const allRowsRemainWithheld = receipt.rows.every((row) => row.stored_publication_status === 'withheld_disputed');

  const report = {
    _label: 'CLASSIFICATION ONLY — no row is eligible for restoration from this profile-agnostic reproduction',
    generated_at: new Date().toISOString(),
    generator: 'scripts/reconcile-cross-profile-withheld-189.ts',
    inputs: {
      reproduction_receipt: 'docs/audits/observance-cross-profile-engine-reproduction-2026-09-24/receipt.json',
      rule_source: 'packages/dharma-rules/src/festivals/rules.json (via CANONICAL_RULES)',
      profile_limitation: 'calculateObservancesForYear(year, location) accepts no calendar profile; exact date reproduction is not profile validation',
      rule_gate: 'findKnownRulePublicationBlockers() only detects known metadata blockers; an empty list is not approval or ratification',
    },
    total_rows: rows.length,
    counts,
    stored_publication_status_counts: publicationStatusCounts,
    restoration_decision: {
      eligible_rows: 0,
      reason: 'Not evaluated as restore candidates: no profile-aware calculation path or structured council-ratification evidence is available.',
      all_rows_remain_withheld: allRowsRemainWithheld,
    },
    rows,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'receipt.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path.join(OUTPUT_DIR, 'receipt.json')}`);
  console.log(`Total rows: ${rows.length}`);
  for (const [category, count] of Object.entries(counts)) console.log(`  ${category}: ${count}`);
  console.log(`Publication statuses: ${JSON.stringify(publicationStatusCounts)}`);
  console.log('Restore candidates: 0 (profile validation and explicit ratification are unavailable)');
}

main();
