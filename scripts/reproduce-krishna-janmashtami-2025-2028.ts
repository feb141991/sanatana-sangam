/**
 * Prompt 3 (controlled remediation) read-only step for krishna-janmashtami,
 * scoped to exactly what was authorized: a reproduction receipt for 2025 and
 * 2028, NOT a fixture.
 *
 * IMPORTANT DISTINCTION, stated once here and repeated in the receipt itself
 * -- corrected after a second review, which is why this paragraph is worded
 * more narrowly than an earlier version: this script runs the project's OWN
 * engine/conditions evaluator (`calculateOccurrencesWithEvaluator` in
 * src/lib/calendar/materialize.ts, the same EVALUATOR_RULES entry the
 * rule's own ratification_note describes having been run manually, at some
 * unrecorded prior time) and records what THIS checkout's evaluator returns
 * TODAY. It does not, and cannot, prove that today's output matches
 * whatever the evaluator returned at that prior time -- there is no stored
 * historical evaluator output, source revision, or transactional record to
 * compare against, only the ratification_note's prose description of a past
 * run. This is a record of the current checkout's evaluator output at
 * explicit Ujjain coordinates, not independent verification and not
 * evidence of historical output. It is NOT an independent citation and NOT
 * approved evidence, and its output is never written to golden_fixtures.
 * Golden fixtures require a source external to this codebase (a printed
 * panchang, a scholarly text); an engine's own current output is not that,
 * however many times it is re-run.
 *
 * Read-only: one calculation (pure function, no I/O) and one SELECT against
 * observance_occurrences. No table is written by this script.
 *
 * Fixed after review: an earlier version selected and printed each stored
 * row's raw database id. Rows are now identified only by a hash of their
 * business-key selector (year, date, variant_key, spiritual_tradition,
 * calendar_profile) -- consistent with the sibling write-receipt script in
 * this directory, and with the report's own no-raw-id convention.
 *
 * Run: npx tsx scripts/reproduce-krishna-janmashtami-2025-2028.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { calculateOccurrencesWithEvaluator } from '../src/lib/calendar/materialize';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

const BACKEND_ROOT = path.join(__dirname, '..');
loadEnv({ path: path.join(BACKEND_ROOT, '.env.local'), quiet: true });

const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/krishna-janmashtami-2025-2028-reproduction');
const SLUG = 'krishna-janmashtami';
const YEARS = [2025, 2028];

type VariantResult = {
  variant_id: string;
  spiritual_tradition: string | null;
  status: 'resolved' | 'unresolved';
  computed_date: string | null;
  reasons: unknown;
  diagnostics: unknown;
  ambiguity_type?: string;
  candidate_dates?: string[];
  raw_result_count?: number;
};

/**
 * calculateOccurrencesWithEvaluator scans from EVERY baseline recurring
 * anchor in its search window, and for krishna-janmashtami the baseline
 * legitimately produces more than one nearby anchor candidate per year --
 * each one re-finds the SAME qualifying date via its own +/-15-day window.
 * Confirmed by direct inspection of the raw output: both years produced two
 * identical `smarta` entries (same date, same reasons) and two identical
 * `gaudiya_iskcon` UNRESOLVED entries. This is a pre-existing property of
 * the baseline/window-scan design, not something this script changes or
 * should paper over silently -- deduped here (by tradition+status+date) so
 * the receipt's classification counts DISTINCT VARIANTS, not raw scan hits,
 * while `raw_result_count` keeps the undeduplicated count visible.
 *
 * Location is passed EXPLICITLY (not left to calculateOccurrencesWithEvaluator's
 * own default parameter) -- fixed after review: relying on an imported
 * function's current default silently breaks reproducibility if that
 * default ever changes, and reads as if this script were doing something
 * location-aware when it is really just hardcoding the same constant the
 * function does. This is also why the result is an EVALUATOR-DEFAULT
 * reproduction, not a "profile evaluation": calculateOccurrencesWithEvaluator
 * takes a raw lat/lon/tz, not a `calendar_profile` string, so passing
 * 'legacy-ujjain' as a profile is not possible -- UJJAIN_COORDINATES below
 * is the same numeric point that profile string resolves to elsewhere in
 * this codebase (materialize.ts:770), reproduced here as a literal, not
 * because the evaluator consumed the stored calendar_profile value.
 */
const UJJAIN_COORDINATES = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' } as const;

function computeVariants(year: number): VariantResult[] {
  const { resolved, unresolved } = calculateOccurrencesWithEvaluator(year, UJJAIN_COORDINATES);
  const raw: VariantResult[] = [];
  for (const r of resolved.filter(o => o.slug === SLUG)) {
    raw.push({
      variant_id: r.variant_key ?? 'unknown',
      spiritual_tradition: r.spiritual_tradition ?? null,
      status: 'resolved',
      computed_date: r.date,
      reasons: r.reasons ?? null,
      diagnostics: r.diagnostics ?? null,
    });
  }
  for (const u of unresolved.filter(o => o.slug === SLUG)) {
    raw.push({
      variant_id: u.variant_key ?? 'unknown',
      spiritual_tradition: u.spiritual_tradition ?? null,
      status: 'unresolved',
      computed_date: null,
      reasons: u.evaluator_details ?? null,
      diagnostics: null,
      ambiguity_type: u.ambiguity_type,
      candidate_dates: u.candidate_dates,
    });
  }
  const seen = new Set<string>();
  const deduped: VariantResult[] = [];
  for (const r of raw) {
    const key = `${r.spiritual_tradition ?? r.variant_id}|${r.status}|${r.computed_date ?? r.ambiguity_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...r, raw_result_count: raw.filter(x => (x.spiritual_tradition ?? x.variant_id) === (r.spiritual_tradition ?? r.variant_id)).length } as VariantResult);
  }
  return deduped;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // No raw row id is selected at all -- per review, a prior version selected
  // and printed `id` directly, which is inconsistent with this repository's
  // non-PII artifact convention even though a UUID is not itself PII. Rows
  // are identified below by a hash of their own business-key selector
  // (year, date, variant_key, spiritual_tradition, calendar_profile).
  const { data: rows, error } = await db
    .from('observance_occurrences')
    .select('date, year, publication_status, calculated_by, variant_key, spiritual_tradition, calendar_profile, observance_definitions!inner(slug)')
    .eq('observance_definitions.slug', SLUG)
    .in('year', YEARS)
    .order('year');
  if (error) throw error;

  const perYear = YEARS.map(year => {
    const computed = computeVariants(year);
    const stored = (rows ?? []).filter((r: any) => r.year === year);
    const storedWithMatch = stored.map((s: any) => {
      const matches = computed.filter(c => c.status === 'resolved' && c.computed_date === s.date);
      // Distinct traditions only -- computeVariants already dedupes its own
      // raw scan hits, but this counts distinct VARIANTS matched, never raw
      // hit count, as the second line of defense against that artifact.
      const matchedTraditions = [...new Set(matches.map(m => m.spiritual_tradition ?? m.variant_id))];
      return {
        stored_row_selector_sha256: sha256([SLUG, s.year, s.date, s.variant_key ?? '', s.spiritual_tradition ?? '', s.calendar_profile ?? ''].join('|')),
        stored_date: s.date,
        stored_publication_status: s.publication_status,
        stored_calculated_by: s.calculated_by,
        stored_variant_key: s.variant_key,
        stored_spiritual_tradition: s.spiritual_tradition,
        stored_calendar_profile: s.calendar_profile,
        matches_variant_count: matchedTraditions.length,
        matched_traditions: matchedTraditions,
        classification:
          matchedTraditions.length === 0 ? 'matches_neither_variant'
          : matchedTraditions.length === 1 ? `matches_only_${matchedTraditions[0]}`
          : 'matches_both_variants',
      };
    });
    return { year, computed_variants: computed, stored_occurrences: storedWithMatch };
  });

  const document = {
    _label: 'CURRENT EVALUATOR OUTPUT -- NOT PROOF OF HISTORICAL OUTPUT, NOT AN APPROVED FIXTURE, NOT AN INDEPENDENT CITATION, NOT A PROFILE-AWARE EVALUATION',
    _explanation:
      'This file records the current checkout\'s evaluator output at explicit Ujjain coordinates; it is not independent verification or evidence of historical output. There is no stored historical evaluator output, source revision, or transactional record to compare today\'s run against -- only the ratification_note\'s prose description of some earlier manual run -- so this file cannot and does not claim to prove today\'s result matches a prior one. It also does not independently verify its result against any external source, and it is NOT a `calendar_profile`-aware evaluation: calculateOccurrencesWithEvaluator takes a raw lat/lon/tz, not a profile string, so this is an evaluator-current-output reproduction at the coordinates the \'legacy-ujjain\' profile happens to resolve to elsewhere in this codebase (materialize.ts:770) -- not proof the evaluator consumed that profile. Do not cite this file as evidence in golden_fixtures, in a ratification_note, or in any user-facing claim of correctness. It exists solely to compare currently-stored occurrence rows against the engine\'s current output for the purpose of Prompt 3\'s krishna-janmashtami remediation scope.',
    generated_at: new Date().toISOString(),
    generator: 'scripts/reproduce-krishna-janmashtami-2025-2028.ts',
    slug: SLUG,
    location_used: { ...UJJAIN_COORDINATES, label: 'Ujjain, India -- passed explicitly as raw coordinates; matches, but is not derived from, the legacy-ujjain calendar_profile string' },
    years: perYear,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, 'receipt.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`Wrote ${jsonPath}`);
  for (const y of perYear) {
    console.log(`\nYear ${y.year}:`);
    for (const c of y.computed_variants) {
      console.log(`  computed [${c.spiritual_tradition ?? c.variant_id}]: ${c.status === 'resolved' ? c.computed_date : `UNRESOLVED (${c.ambiguity_type})`}`);
    }
    for (const s of y.stored_occurrences) {
      console.log(`  stored [${s.stored_row_selector_sha256.slice(0, 12)}] date=${s.stored_date} status=${s.stored_publication_status} variant_key=${s.stored_variant_key} -> ${s.classification}`);
    }
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
