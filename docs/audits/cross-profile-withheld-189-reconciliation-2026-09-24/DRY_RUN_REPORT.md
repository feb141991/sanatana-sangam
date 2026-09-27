# Cross-profile withheld-occurrence review — current read-only status

**Refreshed:** 2026-09-27. The provenance-label migration was applied to
production on 2026-09-26; no occurrence dates or publication states changed.

## What the checks establish

Commands:

- `npx tsx scripts/reproduce-cross-profile-withheld-189.ts` — reads the tagged
  occurrence rows and compares their dates with the current engine at each
  stored location. It writes the reproducible receipt alongside this report.
- `npx tsx scripts/reconcile-cross-profile-withheld-189.ts` — classifies the
  receipt against exact rule identities and known rule metadata blockers. It
  writes the current reconciliation receipt.
- `npx tsx scripts/dry-run-legacy-seed-provenance-relabel.ts` — read-only,
  exact-predicate count for migration `20260926121048`.
- `scripts/shadow/verify-cross-profile-provenance-shadow.sh` — tests the
  forward provenance migration and rollback in a temporary local PostgreSQL
  database only.

The fresh reproduction contains **189 rows**: **185** stored dates appear in
current-engine output at the recorded location, and **4** do not. The four
current-engine differences are the two `purnima-vrat` London dates in April and
October, plus `amavasya-vrat` in March and June. These are engine reproductions,
not independent source verification. The run does not pass `calendar_profile`
to the engine.

The reconciliation therefore nominates **zero** rows for restoration. A date
matching the current profile-agnostic engine does not prove that it is correct
for the stored calendar profile. All **189** remain `withheld_disputed`.

The read-only production preflight reported **47** exact matches for the
provenance-label migration's forward selector and **0** rows already carrying
its marker. The migration updated `final_date_source`, appended its rollback
marker, and refreshed `updated_at` on exactly those 47 rows. Post-application
verification confirmed 47 marked rows, all correctly labeled
`calculation_engine`, all still `withheld_disputed`; all 189 tagged rows remain
withheld and 0 rows remain eligible for the forward selector. The SQL does not
change dates or `publication_status`.

The migration API registered the application as remote version
`20260926121048` (`correct_legacy_seed_provenance_label`) instead of the
original local filename version `20260924120000`. The local migration and
rollback files have been renamed to version `20260926121048` to match that
history. The existing data marker deliberately retains its
`20260924120000` suffix so the rollback continues to target the exact 47 rows.
The production application was authorized without a Supabase shadow branch;
the local synthetic PostgreSQL forward/rollback test had passed beforehand.

The isolated PostgreSQL test passed: the forward migration marked exactly 47
of 189 synthetic rows, left 140 similarly-written calculation-engine rows
untouched, and preserved dates and publication states. Rollback restored the
original source labels and diagnostics; `updated_at` is refreshed by both
directions and is intentionally not restored to its historical value.

## Decision and remaining boundary

The `profile_differentiated` column/API proposal was withdrawn during review.
The canonical calculation function accepts `(year, location)`, not a calendar
profile; looking up a profile-scoped rule would not prove that the rule drove a
date. The corrected architecture decision is in
`docs/PROFILE_AWARE_CALCULATION_CONTRACT_DESIGN.md`. No restoration migration
exists.

The provenance-label migration is applied and version-aligned locally/remotely.
The linked migration listing still has three local-only versions
(`20260923180000`, `20260923181000`, `20260926090000`) and twelve historical
remote-only versions (`20260902182522`, `20260904023808`, `20260905165719`,
`20260905212221`, `20260907234248`, `20260908111517`, `20260909125803`,
`20260910155634`, `20260914003002`, `20260920171732`, `20260921101523`,
`20260921101649`). These were not repaired or applied as part of this fix.
Review their SQL/history individually before any future `db push`. The new
`scripts/assert-supabase-migration-version.mjs` check verifies a just-applied
version has both local and remote entries. No code deployment is part of this
report.
