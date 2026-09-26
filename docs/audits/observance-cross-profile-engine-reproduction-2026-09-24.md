# Cross-profile withheld observance reproduction

**Audit first run:** 2026-09-24 · **Refreshed:** 2026-09-26

## Current result

The current read-only reproduction examines every row tagged
`withheld_cross_profile_reviewed_duplicate_20260909` in the linked database.
It compares the stored date with `calculateObservancesForYear(year, location)`
from this checkout (`RULE_ENGINE_VERSION` 2.0.0), requiring a compatible
`ruleKey` variant as well as the same slug and date. The only accepted alias is
generic `standard` ↔ `legacy-default`; named variants must match exactly.

| Classification | Rows |
|---|---:|
| Exact date and compatible rule-variant reproduction | 185 |
| Stored date absent from current output for that variant | 4 |

The four mismatches are all at `(52.0, -0.5)` / `Europe/London` /
`north_indian_purnimanta`:

| Slug | Stored date | Current engine at stored location |
|---|---|---|
| `amavasya-vrat` | 2026-03-19 | 2026-03-18 |
| `amavasya-vrat` | 2026-06-15 | No resolved occurrence emitted |
| `purnima-vrat` | 2026-04-02 | 2026-04-01 |
| `purnima-vrat` | 2026-10-26 | 2026-10-25 |

This verifies reproduction by the current engine at recorded coordinates. It
is not independent source verification, and it does not prove correctness for
the stored calendar profile: the calculation entry point accepts year and
location, but no `calendar_profile`. All 189 rows remain withheld; no date is
being restored or republished based on this comparison.

## Provenance-label correction

Forty-seven rows match the proposed migration's exact current forward predicate:
with the cross-profile diagnostic tag, `final_date_source = 'legacy_seed'`,
`calculated_by = 'lazy_materialize_on_read'`, `calculation_version = '1.0.0'`,
and no migration marker. The separate read-only preflight reports 0 existing
migration markers. The migration corrects only the provenance label, appends a
rollback marker, and refreshes `updated_at`; it does not change dates or
publication state. Its SQL requires exactly 47 targets and aborts otherwise.

The isolated PostgreSQL shadow test passed: it relabeled exactly 47 of 189
synthetic rows, preserved 140 similar calculation-engine rows, and kept dates
and publication states unchanged. Rollback restored the original source labels
and diagnostics; `updated_at` is refreshed by both directions.

## Why these rows said `legacy_seed`

All 47 target rows record `calculated_by = 'lazy_materialize_on_read'` and
`calculation_version = '1.0.0'`. Before commit `f0f450a` (2026-09-04), the lazy
materializer omitted `final_date_source`, so the database default mislabeled
these rows as `legacy_seed`. That commit fixed new writes to set
`final_date_source = 'calculation_engine'` explicitly. The historical code and
current row metadata support a provenance-label correction; they do not verify
the calendar dates.

## Reproduction and coverage

Run `npx tsx scripts/reproduce-cross-profile-withheld-189.ts`. It reads the
occurrences in stable, 500-row pages, verifies each returned row's shape, and
writes `docs/audits/observance-cross-profile-engine-reproduction-2026-09-24/receipt.json`.
Each output row uses a full SHA-256 of the database row ID as its selector, so
recurring dates and multiple locations cannot collapse to the same audit key.
The receipt also records both all same-slug dates and dates matching the exact
stored rule variant.

The separate live preflight is `npx tsx scripts/dry-run-legacy-seed-provenance-relabel.ts`.
It performs exact-count reads using the migration's current selectors and does
not write to Supabase. The migration and rollback are exercised locally by
`scripts/shadow/verify-cross-profile-provenance-shadow.sh`; that synthetic
shadow test is not a substitute for the required Supabase shadow-branch check
before a production migration.

`docs/REVIEW_CHECKLIST.md` coverage sign-off:

- **3.1 Cardinality:** checked — stable pagination and unique row-ID hashes
  preserve each recurring occurrence independently.
- **3.2 Detection capability:** checked — the audit distinguishes missing
  slug, missing variant, nonmatching date, missing coordinates, and exact
  matches. It cannot detect an incorrect date emitted by the engine for the
  same rule identity.
- **3.3 Both directions:** checked for the migration — the local shadow test
  applies and rolls back the label change. It does not prove production
  historical provenance beyond recorded writer/version metadata.
- **3.4 Detection vs. behaviour:** checked — engine reproduction is not used
  as a restore/publish policy; all 189 remain withheld.
- **3.5 Degenerate/boundary inputs:** checked for missing coordinates and
  missing engine occurrences; the London Amavasya row is a no-output case and
  remains withheld.
- **3.6 Units, frames and pairs:** checked — each engine call receives the
  same row's stored latitude, longitude, and IANA timezone together.
- **3.7 Compensation:** not applicable — no astronomy or rule computation was
  changed.
- **3.7b Reproducible evidence:** checked — the commands and generated
  receipts are committed with the scripts.
- **3.8 Scope honesty:** checked — no production data changed; no migration
  applied; no profile-differentiated schema field is being proposed.
- **3.9 Cross-engine consistency:** not applicable — this reproduction calls
  only the canonical `calculateObservancesForYear` entry point and compares
  that output with stored rows; it does not compare multiple engines.
