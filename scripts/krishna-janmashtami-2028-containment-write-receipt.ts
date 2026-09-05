/**
 * Post-hoc containment verification for the single production write made
 * during Prompt 3's krishna-janmashtami remediation: setting the 2028
 * occurrence's publication_status from 'published' to 'withheld_disputed'.
 *
 * WHAT THIS IS, PRECISELY -- narrowed twice after review, each time because
 * the claim was stronger than the evidence:
 *
 * Round 1 claimed "machine-readable proof that only one field changed."
 * Round 2 narrowed that to "current state is consistent with a recorded
 * historical preflight," expanded to more columns, and moved off raw ids
 * onto a business-key selector -- but round 2's own selector (year, date,
 * variant_key, spiritual_tradition, calendar_profile) is not guaranteed
 * unique: the 2026 rows for this same slug include two entries with
 * IDENTICAL values on every one of those fields (both `gaudiya_iskcon`,
 * both 2026-09-04, both `north_indian_purnimanta` -- two separate database
 * rows, confirmed by direct query, differing only by database id and
 * timestamps this script never captured). Round 2's comparison used that
 * selector as a Map key across all 8 rows, so one of those two rows
 * silently overwrote the other -- the comparison could not actually have
 * checked all 8 rows as claimed, and the row-count check could not have
 * proven no row was added or removed, because full row identity (which
 * also depends on computed_latitude/computed_longitude/computed_timezone,
 * never captured here) was not established before the write.
 *
 * FIXED: the multi-row historical comparison is removed entirely, not
 * patched. It cannot be made sound after the fact -- the required full
 * identity for every row was never captured before the UPDATE ran, and
 * there is no way to retroactively obtain it. Rather than construct a
 * selector that merely looks more complete, this script now asserts only
 * what a live query can actually, defensibly establish about CURRENT
 * state, for the one row this remediation actually targeted:
 *
 *  1. Exactly one row exists for (slug=krishna-janmashtami, year=2028) --
 *     checked by count, not assumed.
 *  2. That row's publication_status is 'withheld_disputed'.
 *  3. Zero rows for (slug=krishna-janmashtami, year=2028) have
 *     publication_status='published' -- the fact that actually matters for
 *     read-path exclusion, independent of anything else on this page.
 *
 * This is NOT a transactional mutation receipt. It was not captured inside
 * the write's own transaction, and there is no database audit log or
 * point-in-time-recovery snapshot backing it. The human-readable before/
 * after narrative in PROMPT3_REPORT.md remains a disclosed, non-provable
 * historical claim, exactly as re-labelled there -- this script does not
 * attempt to make that claim machine-provable, because it cannot be.
 *
 * No raw database id appears anywhere in this file or its output.
 *
 * Run: npx tsx scripts/krishna-janmashtami-2028-containment-write-receipt.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

const BACKEND_ROOT = path.join(__dirname, '..');
loadEnv({ path: path.join(BACKEND_ROOT, '.env.local'), quiet: true });

const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/krishna-janmashtami-2025-2028-reproduction');
const SLUG = 'krishna-janmashtami';
const TARGET_YEAR = 2028;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // (1) Exactly one row for this slug/year -- checked, not assumed.
  const { data: yearRows, error: yearError } = await db
    .from('observance_occurrences')
    .select('date, variant_key, spiritual_tradition, calendar_profile, calculated_by, publication_status, computed_latitude, computed_longitude, computed_timezone, observance_definitions!inner(slug)')
    .eq('observance_definitions.slug', SLUG)
    .eq('year', TARGET_YEAR);
  if (yearError) throw yearError;

  const rowCountForYear = (yearRows ?? []).length;
  const exactlyOneRowForYear = rowCountForYear === 1;
  const theRow = exactlyOneRowForYear ? (yearRows as any[])[0] : null;

  // (2) The fact that actually matters for read-path exclusion, queried
  // independently of the row lookup above.
  const { count: publishedCount, error: countError } = await db
    .from('observance_occurrences')
    .select('date, observance_definitions!inner(slug)', { count: 'exact', head: true })
    .eq('observance_definitions.slug', SLUG)
    .eq('year', TARGET_YEAR)
    .eq('publication_status', 'published');
  if (countError) throw countError;

  const document = {
    _label: 'POST-HOC CONTAINMENT VERIFICATION -- current-state facts only, not a transactional mutation receipt, not a historical comparison',
    _explanation:
      'Asserts three facts about CURRENT database state, each independently queried: (1) exactly one row exists for this slug/year; (2) that row\'s publication_status is withheld_disputed; (3) zero published rows exist for this slug/year. It does NOT compare against any historical/preflight snapshot -- an earlier version of this script did, using a selector later found not to be unique across this table\'s own rows for other years, which meant its multi-row comparison silently dropped information and could not have proven what it claimed. Removed rather than patched. See the file header for the full explanation. No raw database id appears anywhere in this file.',
    generated_at: new Date().toISOString(),
    generator: 'scripts/krishna-janmashtami-2028-containment-write-receipt.ts',
    target: { slug: SLUG, year: TARGET_YEAR },
    current_row: theRow && {
      date: theRow.date,
      variant_key: theRow.variant_key,
      spiritual_tradition: theRow.spiritual_tradition,
      calendar_profile: theRow.calendar_profile,
      calculated_by: theRow.calculated_by,
      publication_status: theRow.publication_status,
      computed_latitude: theRow.computed_latitude,
      computed_longitude: theRow.computed_longitude,
      computed_timezone: theRow.computed_timezone,
    },
    assertions: {
      exactly_one_row_for_slug_and_year: exactlyOneRowForYear,
      row_count_for_slug_and_year: rowCountForYear,
      current_publication_status_is_withheld_disputed: exactlyOneRowForYear && theRow.publication_status === 'withheld_disputed',
      published_row_count_for_slug_and_year: publishedCount ?? -1,
      published_row_count_is_zero: (publishedCount ?? -1) === 0,
    },
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, 'write-receipt.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`Wrote ${jsonPath}`);
  console.log(JSON.stringify(document.assertions, null, 2));

  const allPass =
    document.assertions.exactly_one_row_for_slug_and_year &&
    document.assertions.current_publication_status_is_withheld_disputed &&
    document.assertions.published_row_count_is_zero;
  if (!allPass) {
    console.error('ASSERTION FAILURE -- see assertions above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
