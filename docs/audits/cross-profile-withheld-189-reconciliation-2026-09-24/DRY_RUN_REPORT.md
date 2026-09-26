# Cross-profile withheld-occurrence review — current read-only status

**Refreshed:** 2026-09-26. No production data was changed and no migration was
applied.

## What the checks establish

Commands:

- `npx tsx scripts/reproduce-cross-profile-withheld-189.ts` — reads the tagged
  occurrence rows and compares their dates with the current engine at each
  stored location. It writes the reproducible receipt alongside this report.
- `npx tsx scripts/reconcile-cross-profile-withheld-189.ts` — classifies the
  receipt against exact rule identities and known rule metadata blockers. It
  writes the current reconciliation receipt.
- `npx tsx scripts/dry-run-legacy-seed-provenance-relabel.ts` — read-only,
  exact-predicate count for migration `20260924120000`.
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

The read-only production preflight currently reports **47** exact matches for
the provenance-label migration's forward selector, **0** rows already carrying
its marker, and `safe_to_apply_count_guard: true`. The migration changes
`final_date_source`, appends its rollback marker, and refreshes `updated_at` on
those 47 rows. The SQL row-count guard aborts if the count differs from 47. It
does not change a date or `publication_status`.

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

The provenance-label migration is prepared but **not applied**. Before applying
it in any environment, rerun the read-only preflight against that environment
and require the exact count to remain 47 with zero preexisting markers. Any
production application also requires the calendar shadow-branch procedure in
`AGENTS.md`; the local synthetic migration test is not a substitute for that
branch. No commit or deployment is part of this report.
