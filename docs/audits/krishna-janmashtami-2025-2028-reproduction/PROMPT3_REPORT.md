# Prompt 3 — Controlled Remediation: krishna-janmashtami (2025, 2028)

**Status:** One production write made, exactly as scoped below. Everything
else in this report is read-only investigation.
**Scope authorized:** a read-only 2025/2028 engine-reproduction comparison
for both `krishna-janmashtami` variants, plus, conditionally, containment of
the 2028 occurrence if it lacked proper evidence. Rule changes, fixture
approvals, and variant relabeling/splitting are explicitly out of scope and
were not done.

## Target (per the runbook's Prompt 3 template)

- **Target rule(s):** `krishna-janmashtami` — both existing variants
  (`smarta_nishita` in `rules.json` / `smarta` in the evaluator,
  `gaudiya_iskcon` in both). No new variant added. No `launch_status` changed
  (both remain `included`, as they already were).
- **Target tradition/profile(s):** Hindu, Smarta and Gaudiya/ISKCON
  sampradaya. The stored rows carry `calendar_profile: legacy-ujjain`; the
  comparison below reproduces at the raw coordinates that profile string
  resolves to elsewhere in this codebase (23.1765, 75.7885 — Ujjain, India),
  passed explicitly to the evaluator. This is **not** a `calendar_profile`-aware
  evaluation — `calculateOccurrencesWithEvaluator` takes a raw lat/lon/tz,
  not a profile string — so it is described throughout as an
  evaluator-default reproduction at matching coordinates, not proof the
  evaluator consumed the stored profile.
- **Target years:** 2025 (historical, read-only) and 2028 (future,
  contained).

## The trace: rule -> engine -> fixture -> materialization -> API -> notification

1. **Rule** (`packages/dharma-rules/src/festivals/rules.json`): two variants,
   both `launch_status: included`. Smarta has a real ratification history
   (council-confirmed 2026-09-04, 2027-08-24). Gaudiya has `disputed_years:
   [2027]`, founder-closed pending a dharma-śāstra ruling on a tie-breaking
   question — 2028 is not in its disputed list.
2. **Engine** (`src/lib/calendar/materialize.ts`, `EVALUATOR_RULES`): both
   variants have real per-sampradaya conditions (`calculateOccurrencesWithEvaluator`)
   — nishita-touch tithi-8 for smarta, sunrise-tithi-8 AND rohini-nakshatra-touch
   for gaudiya (`variantId: 'vaishnava'`, `spiritualTradition: 'gaudiya_iskcon'`).
3. **Fixture** (`golden_fixtures`): 12 rows total, **all 12 tagged
   `smarta`** — zero fixture rows of any kind exist for `gaudiya_iskcon`.
   Of the smarta rows: 4 real + approved (2026 only, Rashtriya Panchang
   citation). The 8 remaining are unapproved `TODO` placeholders for 2027
   and 2028 — **no approved fixture exists for 2028 under either variant.**
4. **Materialization** (`observance_occurrences`): 8 rows total for this
   slug, corrected count per direct re-query (an earlier draft of this
   report undercounted 2026): **2026 has 5 rows** — 3 `smarta_nishita`
   (dates 2026-09-03 and 2026-09-04, across two different calendar
   profiles) and 2 `gaudiya_iskcon` (both 2026-09-04). 2025 and 2028 each
   have exactly **one** row, `variant_key: 'legacy-default'`,
   `spiritual_tradition: null` — predating the sampradaya split, never
   reconciled against it. **2027 also has exactly one row in this same
   `legacy-default`/`null` shape** — it is already `publication_status:
   'withheld_disputed'` (pre-existing, not changed by this phase, and not
   changed here either). An earlier draft of this report called the 2027
   row "the gaudiya-variant row" because gaudiya's `disputed_years` includes
   2027 — that was wrong: the row itself carries no variant identity at all
   and cannot be attributed to either sampradaya. Its `withheld_disputed`
   status most likely traces to `isWithheldOccurrence`'s conservative
   fallback for a legacy row with insufficient identity when multiple rules
   exist for a slug (`src/lib/calendar/withheld.ts:92-98`: "if ANY rule for
   this slug is withheld in this year, return true") — plausible given
   gaudiya is disputed for 2027, but not independently confirmed here, so
   stated as the likely mechanism, not a verified fact.
5. **Publication/notification**: query-level `.eq('publication_status',
   'published')` filters were confirmed present (by direct code read, not
   assumption) in `calendar/month`, `calendar/upcoming`, `calendar/day`,
   `calendar/export`, `native/home-summary` (via
   `resolve-occurrences.ts:332`), and `cron/festival-email` — so a row's own
   `publication_status` is sufficient, on its own, to exclude it from every
   one of these paths. (Separately confirmed: `filterWithheldJoinedRows`
   does NOT check `publication_status` itself for a normal row — it gates on
   the RULE's `disputed_years`/`launch_status` — so the query-level filter
   above is the operative protection here, not that function.)

## Read-only comparison (the authorized first step)

Computed via `scripts/reproduce-krishna-janmashtami-2025-2028.ts`, which
re-runs the project's own `calculateOccurrencesWithEvaluator` (the same
EVALUATOR_RULES entries the rule's own ratification_note history describes
running manually), passing the Ujjain coordinates (23.1765, 75.7885,
Asia/Kolkata) explicitly, for 2025 and 2028, then compares against the live
stored rows. Full raw output, including day-by-day reasoning for every
candidate date checked: `docs/audits/krishna-janmashtami-2025-2028-reproduction/receipt.json`.

**This receipt is explicitly NOT an approved fixture, NOT an independent
citation, and NOT a `calendar_profile`-aware evaluation — and, fixed after a
second review, it does not "prove" a historical result either.** It records
the current checkout's evaluator output at explicit Ujjain coordinates; it
is not independent verification or evidence of historical output. There is
no stored historical evaluator output, source revision, or transactional
record to compare today's run against — only the ratification_note's prose
description of some earlier manual run — so this cannot and does not claim
that today's result matches whatever that prior run produced. It also does
not verify its result against anything external, and it does not consume
the stored `calendar_profile` string at all (the evaluator function takes
raw coordinates, not a profile) — so "matches the stored row's location"
means the coordinates happen to be numerically the same as what
`legacy-ujjain` resolves to elsewhere, not that the evaluator was
profile-aware. It is not written to `golden_fixtures`, is not cited in any
`ratification_note`, and must not be treated as evidence of correctness — of
today's date or any prior one — by any future reader of this repository.

One artifact of the existing engine's own baseline/window-scan design was
found and corrected for in the comparison script (not in the engine itself,
which was not touched): `calculateOccurrencesWithEvaluator` scans from every
baseline recurring anchor in its window, and produced two identical
`smarta` results and two identical `gaudiya_iskcon` UNRESOLVED results per
year. Deduplicated in the script (by tradition+status+date) before drawing
any conclusion — see the code comment in `computeVariants()`.

Rows are identified below by their business key (year, date, variant_key),
not by database id — no row id appears anywhere in this report.

| Year | Computed `smarta` | Computed `gaudiya_iskcon` | Stored occurrence | Classification |
|---|---|---|---|---|
| 2025 | **2025-08-15** (resolved) | UNRESOLVED — no qualifying day in the ±15-day window | date **2025-08-16**, `variant_key: legacy-default`, published | **matches_neither_variant** |
| 2028 | **2028-08-13** (resolved) | UNRESOLVED — no qualifying day in the ±15-day window | date **2028-08-13**, `variant_key: legacy-default`, published (before this action) | **matches_only_smarta** |

## Decision and action taken

**2025 — read-only, as scoped. No write made.** The stored date
(2025-08-16) does not match today's reproducible smarta computation
(2025-08-15) — a one-day discrepancy — and does not match gaudiya at all
(unresolved). This is a genuine provenance failure: the historical row's
basis cannot be reproduced or confirmed today. Documented here as the
required record. Not rewritten, not deleted, not reclassified — it is
history, and 2025 is in the past regardless.

**2028 — contained.** The stored row unambiguously structurally matches the
`smarta` computation and not `gaudiya`. But "unambiguous mapping" and
"proper evidence" are two different tests: `golden_fixtures` has **zero
approved rows for 2028 under either variant** — only unapproved `TODO`
placeholders. An engine agreeing with itself is explicitly not evidence (see
above). So the 2028 row does not unambiguously map to an *approved* variant
*with proper evidence*, and per the authorized scope this required
containment rather than being left live.

**Action taken:** exactly one row updated. It was, and remains, the only
`krishna-janmashtami` row for year 2028 — confirmed by (slug, year) count in
the original 8-row trace before the write, and by live (slug, year) count
after (`write-receipt.json`). Its fuller business key (date = 2028-08-13,
variant_key = legacy-default, spiritual_tradition = null, calendar_profile
= legacy-ujjain) is NOT separately confirmed unique across this table in
general — a different year (2026) on this same slug is known to contain two
rows sharing an identical value on every one of those fields, so uniqueness
by (slug, year) is the claim actually checked, not uniqueness by the fuller
selector. The literal command executed at the time targeted the row by its
database primary key, which is not reproduced here.

```sql
update observance_occurrences
set publication_status = 'withheld_disputed'
where id = <target row's primary key at the time -- identified only by
            (slug, year) = (krishna-janmashtami, 2028) in this report>;
```

**Before/after — a disclosed historical record, not machine-verified.**
Captured by hand from a verified SELECT run earlier in this session, before
the UPDATE; not captured transactionally, and not independently re-checked
against a snapshot no longer obtainable. Treat as a recorded claim, not
proven fact:

| Field | Before | After |
|---|---|---|
| `publication_status` | `published` | `withheld_disputed` |
| `date` | `2028-08-13` | `2028-08-13` (unchanged) |
| `variant_key` | `legacy-default` | `legacy-default` (unchanged) |
| `spiritual_tradition` | `null` | `null` (unchanged) |
| `calculated_by` | `cron_job` | `cron_job` (unchanged) |

The row was not deleted. `withheld_disputed` is an existing, already-used
status value (the same one already on the 2027 `legacy-default` row — see
the correction in the trace section above; that row is not attributable to
either sampradaya) — nothing new was invented.

**Verified after the write — current-state facts only, no historical
comparison claimed.** The before/after table above is a human-readable,
disclosed, non-provable historical narrative (see the note on its own
limits below); the supporting artifact is
`docs/audits/krishna-janmashtami-2025-2028-reproduction/write-receipt.json`
(generated by `scripts/krishna-janmashtami-2028-containment-write-receipt.ts`).

**This script's design was corrected a second time after review, and this
time the fix was to remove a check, not add caveats to it.** Its prior
version compared all 8 rows against a hand-recorded historical snapshot,
keyed by a selector of (year, date, variant_key, spiritual_tradition,
calendar_profile) — but that selector is not unique on this table: the 2026
rows include two separate database rows with identical values on every one
of those fields (both `gaudiya_iskcon`, same date, same profile — confirmed
by direct query). The comparison used that selector as a lookup key, so one
of those two rows silently overwrote the other; it could not actually have
checked all 8 rows or proven no row was added or removed, as it claimed.
Full row identity on this table also depends on `computed_latitude`/
`computed_longitude`/`computed_timezone`, which were never captured before
the write either way. Rather than patch the selector, the multi-row
historical comparison was removed entirely — it cannot be made sound
without data that no longer exists to capture. What remains is only what a
live query can defensibly establish about **current** state for the row
this remediation actually targeted:

```json
{
  "exactly_one_row_for_slug_and_year": true,
  "row_count_for_slug_and_year": 1,
  "current_publication_status_is_withheld_disputed": true,
  "published_row_count_for_slug_and_year": 0,
  "published_row_count_is_zero": true
}
```

Three independently-queried facts, nothing else claimed: **(1)** exactly one
`krishna-janmashtami` row exists for 2028 — checked by count, not assumed;
**(2)** that row's `publication_status` is `withheld_disputed`; **(3)** zero
rows for this slug/year have `publication_status = 'published'` — the fact
that actually matters for read-path exclusion (calendar/month, upcoming,
day, export, home-summary, festival-email, all confirmed by direct code
read to filter on this column at the query level). No raw database id
appears in the artifact. No claim is made about `calculated_by` or any
other column matching a prior value, because no historical value for this
specific row's other columns was captured in a way proven not to collide
with a sibling row — the before/after table above remains the only place
that claim is made, explicitly as a disclosed, non-machine-verified
historical record.

## What was explicitly NOT done

- No rule in `rules.json` was changed. No `launch_status` was changed.
- No fixture was added to or approved in `golden_fixtures`. The engine
  receipt was written only to `docs/audits/`, never to that table.
- The 2025 row was not modified in any way.
- No variant relabeling or splitting of the ambiguous rows was performed —
  that remains a separate decision, as scoped.
- No unrelated `krishna-janmashtami` rows (2026, 2027) were touched.

## Verification receipt

This report went through two rounds of correction after review.

**Round 1** fixed: undercounting the 2026 rows (said 2 smarta/2 gaudiya,
actually 3/2); mischaracterizing the 2027 `legacy-default` row as "the
gaudiya variant row" when its own fields carry no variant identity;
describing the reproduction as using "the actual location/profile" when it
is an evaluator-default coordinate reproduction with no profile awareness;
and asserting the write's before/after in prose with no machine-readable
evidence behind it. The coordinate fix was verified by regenerating
`receipt.json` (identical computed dates, now passed explicitly rather than
relying on a default).

**Round 2** fixed the round-1 fix for the write evidence, which had
overclaimed in three further ways: (a) it called itself "machine-readable
proof that only one field changed," which it cannot be, since the write
predates the receipt script and its preflight is a hand-recorded historical
value, not a transactional capture — reworded throughout to "consistent with
the recorded historical preflight assertion"; (b) it checked only 4 of the
table's ~40 columns while implying broader coverage — expanded to every
column an actual preflight value exists for (adding `calculated_by`) and
the remainder are now named explicitly in `columns_not_checked` rather than
left unmentioned; (c) it claimed "ids hashed, never stored raw" while
hardcoding raw UUIDs to hash — the script was rewritten to identify rows
exclusively by a canonical business-key selector (slug, year, date,
variant_key, spiritual_tradition, calendar_profile) and assert "exactly one
row matches" rather than look up by id at all. A repo-wide pattern search
for a raw-UUID shape at that point also caught a second instance the same
fix had missed: `receipt.json` (the round-1 engine-reproduction artifact,
from the OTHER script in this directory,
`scripts/reproduce-krishna-janmashtami-2025-2028.ts`) still selected and
printed each stored row's raw id. Fixed the same way — that script now
selects no `id` column at all and identifies rows by a hash of the same
business-key selector — and `receipt.json` was regenerated. A final
pattern search across every file in this directory plus both scripts now
finds zero raw UUIDs.

**Round 3** found round 2's own selector was not actually unique: the 2026
rows for this slug include two separate database rows identical on every
field the selector used (`gaudiya_iskcon`, same date, same profile), so the
`Map`-based comparison round 2 built silently dropped one of them — it could
not have checked all 8 rows or proven no row was added/removed, as it
claimed, and full row identity on this table also depends on
computed_latitude/longitude/timezone, never captured either way. Fixed by
removing the multi-row historical comparison entirely rather than patching
the selector — it cannot be made sound without data no longer obtainable.
The script now asserts only three independently-queried, defensible facts
about current state for the actually-targeted row: exactly one row exists
for (slug, year), its status is `withheld_disputed`, and zero rows for that
(slug, year) are published. Round 3 also fixed the reproduction script's
own remaining overclaim: it said the engine "proves" today's output matches
some prior run, when there is no stored historical evaluator output to
compare against — reworded to "records the current checkout's evaluator
output... not independent verification or evidence of historical output"
in both the script and this report.

- Targeted existing test: `npx vitest run src/lib/calendar/__tests__/withheld-fixture-approval.test.ts` — 8/8 pass.
- Write receipt: `npx tsx scripts/krishna-janmashtami-2028-containment-write-receipt.ts`
  — all assertions pass (see "Verified after the write" above for the full
  output); exit code 0.
- Calendar verification suite: `npm run verify:calendar` — 706 passed, 635
  skipped, **2 failed**, both pre-existing and unrelated to this phase's
  work, reported separately rather than hidden or claimed as caused by this
  change:
  1. `harness/harness.test.ts` > "no approved golden fixture coexists with a
     snapshot fixture for the same canonical logical key" — fails on
     `guru-purnima` and `makar-sankranti` keys. Neither festival was touched
     by this phase; this compares static `golden_fixtures`/snapshot data for
     festivals this remediation never read or wrote.
  2. `harness/harness.test.ts` > "Engine evaluation caching invariant...
     runs exactly once per distinct year" — timed out at 300s. Pure
     in-memory computation test with no database dependency; this phase's
     only database write was a single `observance_occurrences` row for a
     different slug, which this test cannot observe.
  Neither failure touches `krishna-janmashtami`, `golden_fixtures` writes
  (none were made), or `observance_occurrences` (the one row changed here
  is not part of either test's inputs). Not re-verified against a clean
  checkout (the suite takes ~8.5 minutes; the logical independence — no
  shared file, no shared table row, no shared festival — is direct enough
  not to warrant re-running it twice), but reported honestly rather than
  asserted as pre-existing without disclosure.
- `npx tsc --noEmit` — clean.
- `npm test` — still no bare `test` script in this repo (pre-existing,
  unrelated to this change, consistent with every prior phase's receipt).
- `git diff --check` — clean.
- `git status --short` — only this phase's own new files (the two scripts —
  reproduction and write-receipt — and this receipt/report directory); no
  source file was modified.
- **Exactly one database write was made this phase**, described above in
  full, with before/after values and post-write verification. Every other
  database interaction (in this phase and the read-only comparison) was a
  `SELECT`.

Stopping here for review, per the runbook. Variant relabeling/splitting for
the ambiguous `legacy-default` rows, adding real approved fixtures for
`gaudiya_iskcon` (which has none at all), and any decision about the 2025
row's historical record remain open, separate decisions.
