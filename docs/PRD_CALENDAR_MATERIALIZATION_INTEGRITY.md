# PRD: Calendar Occurrence Materialization Integrity

**Status:** Living document — update as further phases land.
**Origin:** 2026-09-04 incident — Krishna Janmashtami missing from the Native
Home hero pill. Investigation expanded into a full audit of festival-date
correctness and the materialization pipeline's failure modes.
**Owner:** Shoonaya calendar engineering.

## 1. Problem statement

The Home hero pill/upcoming-observances list was not showing Krishna
Janmashtami on its correct date (2026-09-04). Root-causing this surfaced four
distinct, independently-real defects, not one:

1. **Sampradaya default gap** — an authenticated Hindu user with no stated
   sampradaya resolved to method `'unknown'` instead of the documented
   Smarta-default fallback, so every disputed-tradition festival (Janmashtami,
   named Ekadashis) was silently withheld for the common no-sampradaya case.
2. **Bad manual migration data** — a batch (`corrected_2026_festival_migration`,
   54 rows) had overridden `observance_occurrences` with hand-entered dates
   that were wrong against real-world sources for every row checked, including
   one falsely cited to drikpanchang.com, and 5 rows that bypassed a
   deliberate `launch_status: 'deferred'` publication gate entirely.
3. **Duplicate Ekadashi cards** — the generic year-round `ekadashi` rule and a
   named, cited Ekadashi rule (Aja, Kamada, Nirjala, ...) both fire on the same
   date for ~17 of the year's ~24 Ekadashis, and nothing suppressed the
   duplicate.
4. **`ensureYearMaterialized` is unsafe against a legacy mirror table** — the
   self-heal-on-read materializer can write a batch that silently fails
   *in its entirety* (not just for the offending row) if a slug has two
   sampradaya variants sharing one display name, or if a rule's variant key
   isn't a valid `tradition_profiles` slug. See §4.

## 2. Fixes shipped this cycle

### 2.1 Sampradaya default (commit `72163ff`)
`src/app/api/native/home-summary/route.ts`'s Path A call to
`formatOccurrencesToResults` now fetches and passes a `calendarContext` built
the same way `resolveRequestProfile()` already does elsewhere: an
authenticated Hindu user with `sampradaya: null` resolves to
`displayedTraditionProfile: 'unspecified'`, `ekadashiMethod: 'smarta'`,
`janmashtamiMethod: 'smarta_nishita'` — never `'unknown'`. Regression test:
`src/lib/calendar/__tests__/request-profile.test.ts`.

Blast radius was wider than the single pill: `buildObservanceSeries()`
depends on the same `isPrimary` flag, so the `diwali-five-days` series could
mark `naraka-chaturdashi`/`diwali` as `status: 'missing'` for the same class
of user, not just deprioritized.

### 2.2 Migration batch deleted (2026-09-04, Supabase migration
`remove_corrected_2026_festival_migration_batch`)
All 54 `corrected_2026_festival_migration` rows removed from
`observance_occurrences` in production. Verified via
`calculateOccurrencesWithEvaluator`/`calculateObservancesForYear` (the
production engine, run standalone) that the underlying rule computation is
correct for the audited slugs once the override is gone.

### 2.3 Legacy-ujjain default bucket backfilled
The self-heal-on-read design (`ensureYearMaterialized`) only fires on a
completely *unmaterialized* bucket — it does not fill gaps in a bucket that
already has other rows, which the `legacy-ujjain` default (no-saved-location)
bucket did (132 pre-existing rows from earlier, unrelated batch jobs). A
targeted one-off backfill inserted the correct rows for the 6 live-rule slugs
directly (`calculated_by: 'targeted_backfill_2026_09_04'`). The 5
`launch_status: 'deferred'` slugs correctly received no row — see §3.

### 2.4 Duplicate Ekadashi suppression
`src/app/api/native/home-summary/route.ts`: `suppressGenericEkadashiWhenNamed()`
drops the generic `ekadashi` occurrence from the response whenever a named
`*-ekadashi` occurrence shares its date. Applied once, at the `observanceRows`
assignment, so it covers both the hero-pill/upcoming-cards path and the
series path (`occurrencesWithBatches` is derived from the same filtered
array). The underlying `ekadashi` rule and its DB rows are untouched — this
is a response-shaping filter, not a data or rule deletion, and months with no
named Ekadashi are unaffected.

### 2.5 Materializer hardening against the `festivals` mirror table
(this section is the one to keep current — see §4 for the full mechanism)
Both live write paths into `observance_occurrences` under `legacy-ujjain`:
- `src/lib/calendar/resolve-occurrences.ts` (`ensureYearMaterialized`, the
  self-heal-on-read path) validates `spiritual_tradition` against a live
  `tradition_profiles.slug` read before writing (falling back through
  `variant-qualifier.ts`'s evaluator-vocabulary crosswalk, writing `null`
  rather than an unresolvable value), and collapses same-`display_name`
  same-year collisions to one row (preferring Smarta), skipping `kind:
  'vrat'` definitions entirely. 5 tests in
  `__tests__/resolve-occurrences.test.ts`.
- `src/lib/calendar/materialize.ts` (`materializeOccurrencesForYears`'s
  condition-evaluator branch, the nightly cron) applies the same collision
  rule via `collapseFestivalMirrorNameCollisionsForEvaluatorOutput()`. 3
  tests in `__tests__/collapse-festival-mirror-collisions.test.ts`.

## 3. Governance-correct "nothing shown" is not a bug

Five slugs — `losar-tibetan-new-year`, `hanuman-jayanti`, `akshaya-tritiya`,
`onam`, `kartik-purnima` — carry `launch_status: 'deferred'` in
`packages/dharma-rules/src/festivals/rules.json`. `engine.ts:183` hard-gates
on this: `if (r.launch_status === 'deferred') return false`. These festivals
will show **no date** in the app until someone completes their review and
flips `launch_status` to `'included'`. This is the intended behavior per this
project's own governance rule (never present a date for a withheld
occurrence) — it is not a regression introduced by this cycle's fixes.
`akshaya-tritiya` and `onam` already carry a `ratification_note` showing the
correct date was independently re-derived and cross-validated against
Rashtriya Panchang Saka 1948 — their review may be closer to done than
`hanuman-jayanti`, `kartik-purnima`, and `losar-tibetan-new-year`, which have
no such note yet.

**Action needed (not engineering):** a calendar reviewer with authority over
`launch_status` needs to close these 5 reviews.

## 4. The `festivals` legacy-mirror hazard — a real, general risk, not a
one-off

### Mechanism
A DB trigger, `trg_sync_occurrence_to_festival` (function
`sync_occurrence_to_festival()`), fires on every INSERT/UPDATE/DELETE against
`observance_occurrences` and — **only when `calendar_profile = 'legacy-ujjain'`**
— mirrors the row into a separate `public.festivals` table that predates
sampradaya variants entirely. `festivals` is unique on `(name, year)` with no
variant column. It exists (as far as this investigation determined) purely
for legacy/PWA compatibility with code that reads festivals by name+year
without any sampradaya concept.

### Failure mode

**Correction (2026-09-04, after further investigation):** the initial
version of this section described the collision as "two different
`observance_definitions` rows sharing a `display_name`." That was checked
against production and is wrong. Krishna Janmashtami is a **single**
`observance_definitions` row (`kind: 'major'`) that legitimately produces
**two `variant_key` occurrence rows** for the same year — `smarta_nishita`
and `gaudiya_iskcon`. The trigger's `INSERT ... ON CONFLICT (id)` is keyed by
each occurrence row's own id, so both variant rows attempt their own
`festivals` insert under the same `(name, year)`, and the second one throws
the unique violation — same/definition-id-or-not makes no difference to this
constraint.

This also means the fix's applicability is much narrower than first framed:
for engine-generated `kind: 'vrat'` rows whose `final_date_source` is
`calculation_engine` or `calculation_engine_reviewed`, the trigger `DELETE`s
rather than `INSERT`s. Both live materializers write one of those values, so a
recurring vrat with many real dates per year sharing one display_name (the
generic `ekadashi` rule, ~24/year) never reaches this constraint through those
paths and must never be collapsed by the fix below — doing so would silently
destroy nearly all of a recurring vrat's real occurrences for the year. A
direct `rules.json` audit (2026-09-04) of the 13
disputed/cited slugs confirmed **Krishna Janmashtami is currently the only
slug in the whole ruleset** that is both `kind != 'vrat'` and has more than
one materialized sampradaya variant — every named Ekadashi is `kind: 'vrat'`
(exempt for these engine-generated paths), and the other `kind: 'major'` slugs checked (Maha Shivaratri,
Diwali, Naraka Chaturdashi) have only one rule entry each (no competing
variant to collide with).

Because Postgres treats a multi-row `INSERT`/`upsert` as one atomic
statement, a naive fix that just deletes the losing row rolls back **every
row in that batch**, including completely unrelated slugs — this is exactly
what happened on the first backfill attempt for this incident: 4 correct,
unrelated rows (Ram Navami, Guru Ravidas Jayanti, Guru Nanak Gurpurab, Maha
Shivaratri) were silently discarded alongside the 2 colliding Janmashtami
rows, with zero error surfaced beyond the script's own stdout.

**This does not mean a sampradaya's variant is hidden from users who have
it as their preference.** The collapse applies only to the `legacy-ujjain`
default bucket — used before a user has any saved location/sampradaya at
all. Any real calendar profile (`north_indian_purnimanta` and others) keeps
both variant rows untouched, and the existing, separate per-user variant
selection (`selectTraditionVariant`/`resolveCalendarContext`, §2.1) reads
whichever bucket serves that user and picks the variant matching their own
resolved sampradaya. `legacy-ujjain` collapsing to one variant is a
consequence of the legacy `festivals` table's schema having no variant
concept at all for that one bucket — not a product decision to suppress a
tradition's calculation.

### Fix in place
Both known live write paths into `observance_occurrences` under
`legacy-ujjain` are now hardened, using the same rule (collapse to one row
per colliding `(display_name, year)` pair, preferring Smarta, skipping
`kind: 'vrat'` definitions entirely):

- `ensureYearMaterialized` (`resolve-occurrences.ts`, the self-heal-on-read
  path) — `collapseFestivalMirrorNameCollisions()`, gated to
  `calendar_profile === 'legacy-ujjain'` since this function serves every
  profile. **A second, independent bug found and fixed in the same pass:**
  this function never set `final_date_source` on its own insert payload, so
  the column defaulted to `'legacy_seed'` (confirmed via schema read) —
  NOT one of the two values (`'calculation_engine'`,
  `'calculation_engine_reviewed'`) `sync_occurrence_to_festival()` checks
  for its own `kind: 'vrat'` exemption. Without this, a recurring vrat's
  *second* date in a year, lazily materialized for the first time under
  `legacy-ujjain`, would hit the identical `festivals(name, year)`
  collision regardless of this file's own app-level `kind: 'vrat'` skip —
  the DB trigger's real exemption was simply never reached. Fixed by
  setting `final_date_source: 'calculation_engine'` explicitly, matching
  the cron path's existing convention for engine-computed rows. Tested:
  `__tests__/resolve-occurrences.test.ts` (6 tests, including one asserting
  every upserted row — vrat and non-vrat together — carries this value).
- `materializeOccurrencesForYears`'s condition-evaluator branch
  (`materialize.ts`, the nightly cron —
  `vercel.json`: `/api/cron/materialize-occurrences`, `0 2 * * *`, confirmed
  live-scheduled) — `collapseFestivalMirrorNameCollisionsForEvaluatorOutput()`,
  applied unconditionally since this branch hardcodes `calendar_profile:
  'legacy-ujjain'` for every row it produces. Tested:
  `__tests__/collapse-festival-mirror-collisions.test.ts` (3 tests). The
  cron's actual writes are additionally gated behind
  `ENABLE_OBSERVANCE_MATERIALIZATION` (defaults to disabled unless the
  Vercel env var is explicitly `'true'`) — this repo could not confirm that
  flag's live production value, so the write path was hardened regardless of
  whether it is currently enabled.
- **Not yet audited, and currently unreachable / lower priority:** the
  non-evaluator ("legacy") branch of `materializeOccurrencesForYears` (the
  `else` of `if (USE_CONDITION_EVALUATOR)`) was not patched. `engine.ts:74`
  hardcodes `USE_CONDITION_EVALUATOR: boolean = true`, so that branch cannot
  currently run — flagged so it gets the same hardening before anyone ever
  flips that constant back to `false`.

### Open question for product/architecture
Is `legacy-ujjain` + the `festivals` mirror table still required by anything
live (a legacy PWA surface, a notification job, search), or is it now dead
infrastructure that should be formally retired? This investigation did not
trace its remaining readers — flagged for a follow-up sweep, not resolved
here.

## 4.1 Correction: location-bucket granularity is NOT an open risk

An earlier draft of this investigation (2026-09-04) raised "other location
buckets may have the same silent gap as legacy-ujjain's default bucket" as an
open risk, reasoning that per-user exact-GPS buckets could sprawl
uncontrolled. On inspection this is wrong: `resolveObservanceLocationBucket()`
in `packages/panchang-engine/src/index.ts` already rounds any real
device/saved coordinate to a 0.5° grid (~55km, city-scale) before it is used
as a materialization key, falls back to a curated
`TZ_REFERENCE_COORDINATES` table (major Hindu/Sikh/Buddhist/Jain diaspora
timezones) when only a timezone is known, and falls back to Ujjain last. Every
materialization call site in `home-summary/route.ts`
(`getOrMaterializeOccurrences`, `attachMaterialisationBatches`) consistently
uses this one bucketed location, never a raw per-user coordinate. The 132
pre-existing rows found in the `legacy-ujjain` bucket during this incident
were 132 different festival *definitions* sharing one correct coordinate, not
per-user location sprawl. No fix needed here; this design predates this
incident and was already correct.

One narrow, pre-existing, non-urgent nuance worth recording: the live daily
"tithi pulse" fallback (`calculatePanchang` at `home-summary/route.ts:908`)
uses the user's exact, unbucketed saved coordinates, while festival cards
come from the bucketed materialization cache -- a deliberate, documented
split (`resolveObservanceLocation`, display-exact, vs
`resolveObservanceLocationBucket`, materialization-coarse). These could
theoretically disagree on the rare day a tithi transition sits extremely
close to sunrise and the user sits near a 0.5° bucket edge. Not actioned;
flagged for awareness only.

## 5. Deferred to later phases (not started this cycle)

- **Phase 3:** Unify the Home pill's Path B (`observanceRows`/
  `firstObservance`) onto Path A's sampradaya-aware pipeline, keeping
  `fallbackPulse` as pill-specific logic.
- **Phase 4:** `calendar_profile` onboarding/adoption UX.
- **Phase 5:** Dead-code cleanup — `tithi`/`nakshatra` condition types
  (confirmed superseded by `tithi_presence`), 2 orphaned admin routes
  (`resolve-all`, `panchang-debug`) — ask before deleting.
- **Phase 6:** Surface the `viddha` (pierced-tithi) scope question — should
  the generic recurring Ekadashi stream apply viddha-disqualification, or
  only named/cited Ekadashis? This is a dharmashastra authority question, not
  an engineering one; `viddha` is fully implemented in
  `packages/dharma-rules/src/conditions/evaluator.ts` but referenced by zero
  current `EVALUATOR_RULES` entries.
- **`festivals` table retirement decision** — see §4's open question.

## 6. Verification record

- `npx tsc --noEmit` clean across all files touched this cycle (`route.ts`,
  `resolve-occurrences.ts`, `materialize.ts`).
- `src/lib/calendar` test suite: 192 passed / 12 pre-existing, unrelated
  failures in `materialize-commit.test.ts` (stale mock, confirmed present
  before this cycle's changes too) / 204 total.
- Production DB state (Supabase project `mnbwodcswxoojndytngu`) verified via
  direct SQL after each write: 54-row migration batch deleted (0 remaining),
  5-row targeted backfill landed with correct dates and no `festivals`
  conflict, 5 deferred slugs confirmed absent as intended, confirmed via
  direct query that `krishna-janmashtami` is a single `observance_
  definitions` row (not two) before designing the collision-collapse fix.

## 7. Full definition catalogue — reproducible audit (2026-09-04)

Scope-out for the broader accuracy audit beyond the original 10 migration-
touched slugs. `observance_definitions` has 103 active rows; `rules.json`
has 97 rows / 95 distinct slugs.

**Correction to an earlier version of this section**, per external review:
a first pass was prose-only (hand-transcribed lists, no committed script or
data snapshot) and its Saphala Ekadashi diagnosis cited an invented
mechanism ("adhika-masa insertion") and reported only one of two real 2027
occurrences. Both are fixed below. The audit is now a committed,
re-runnable script — `scripts/audit-observance-catalogue.ts` — whose output
is committed as data, not asserted as prose:
[`docs/audits/observance-catalogue/2026.json`](audits/observance-catalogue/2026.json)
/ [`.md`](audits/observance-catalogue/2026.md). Re-run with
`npx tsx scripts/audit-observance-catalogue.ts 2026`; the script itself
asserts its five-bucket count sums to the live DB total and throws if not,
so this can't silently drift out of sync the way the hand-transcribed
version did.

| Primary status | Count | Meaning |
|---|---|---|
| `resolved` | 47 | Engine produces a 2026 date. **This means "engine resolved," not "verified."** No broad accuracy conclusion should be drawn from this bucket until real-world source validation occurs — none of the 47 have been externally checked beyond the original 10 migration-touched slugs. |
| `deferred` | 48 | `launch_status: 'deferred'`. Correctly show no date, pending real review — governance-correct, not a defect. |
| `missing_rule` | 7 | `das-lakshana-dharma`, `gudi-padwa-ugadi`, `paryushana-parva`, `pavarana`, `samvatsari`, `sangha-day`, `vassa-begins` — no `rules.json` entry, and confirmed absent from `series.json` too. **This section's original "migration-era catalogue pollution" hypothesis was checked in §9 and is retracted**: all 7 have live, currently-`published` `observance_occurrences` rows from a distinct, legitimate manual-seed mechanism (`legacy_sync`, real external source citations) unrelated to the deleted migration batch. The real finding — two confirmed exact-date duplicates against a qualified sibling slug, three unexplained day-level discrepancies — is in §9, not here. |
| `expected_zero` | 1 | `saphala-ekadashi` — no 2026 date is expected for a documented calendar-boundary reason. The generated receipt links to the committed evidence rather than mislabelling this as an engine anomaly. |
| `engine_anomaly` | 0 | An included, rule-backed definition with no target-year output and no committed explanation. This status remains fail-closed for future discoveries. |

### `saphala-ekadashi` diagnosis — corrected

The real mechanism, found in already-existing project documentation
(`docs/CALENDAR_ENGINE_ASSESSMENT.md`, 2026-08-11 entry) that an earlier
pass of this investigation failed to search for before running its own
throwaway diagnostic: **not** an adhika-masa insertion. Pausha's
krishna-paksha fortnight straddles the Dec 31/Jan 1 boundary *twice* within
Gregorian 2027 — once as the tail of the 2026 lunar cycle
(`2027-01-01..01-07`) and once as the head of the next cycle
(`2027-12-14..12-27`) — a "double window," confirmed live via the project's
own existing tool, `scripts/sweep-adhika-masa-collisions.ts` (re-run
2026-09-04 for 2025-2028, output verbatim):

```
=== 2027 ===
  no adhika month this year
  ⚠ DOUBLE WINDOW purnimanta="Pausha": [2027-01-01..2027-01-07] + [2027-12-14..2027-12-27]

  2027 saphala-ekadashi (masa=Pausha, tithi=26) -> 2027-01-03, 2027-12-23 -- window 2 of 2 [2027-12-14..2027-12-27] (LATEST)
```

**Two real occurrences exist in 2027** — `2027-01-03` and `2027-12-23` — and
the project's already-established rule (per the same 2026-08-11 assessment,
with 5 passing regression tests in `harness/adhika-window.test.ts`) is that
the LATEST of the two is canonical: `2027-12-23`, not `2027-01-03`. An
earlier pass of this investigation reported only `2027-01-03`, from a
throwaway script whose evaluator call returns the first match, not an
exhaustive list — an incomplete receipt, corrected here.

2026 itself having zero occurrences is the documented, natural complement
of the 2027 double window (both nearby occurrences land in 2027; none lands
in 2026) — confirmed correct, not a defect. This was already investigated
and closed by prior work well before this session; this section's role is
to document that closure accurately, not to re-derive it.

**General caution this section carries forward:** do not treat "zero
output for the target year" as proof of a defect, and do not treat "engine
produced one date" as proof of completeness either — always check whether
the source tooling already exists before running a fresh diagnostic, and
check adjacent years for a double-window sibling before concluding
anything.

## 8. Ratification-note evidence pass (2026-09-04)

`scripts/classify-ratification-notes.ts` reads the `resolved` bucket from
§7's catalogue and extracts structured evidence per rule row — never a
free-text-derived verdict. Only two `rules.json` fields drive any flag:
`disputed_years` (authoritative per-year dispute list) and `citation`
(authoritative source name). `ratification_note` is carried through
verbatim for human review, never parsed into a conclusion. Output:
[`docs/audits/ratification-notes/2026.json`](audits/ratification-notes/2026.json)
/ [`.md`](audits/ratification-notes/2026.md).

**Self-caught false positive, fixed before this was reported anywhere:**
the first version of this script emitted a flag named
`current_year_confirmed` whenever a citation existed and the target year
wasn't in `disputed_years`. Real data immediately falsified this —
`maha-shivaratri` has a citation and empty `disputed_years`, yet its own
`ratification_note` reads *"PENDING COUNCIL RATIFICATION — not fully
settled."* `disputed_years` empty means "no specific year is flagged
astronomically disputed"; it says nothing about undeclared-per-year
disputes like month-system/profile-convention questions. Renamed to
`no_structured_dispute_for_target_year` (a materially weaker, accurate
claim) and added `has_ratification_note_requiring_human_read` so every row
with a note is flagged for a human to actually read it, rather than the
script pretending to have understood it.

**Second external review caught three more contract defects, all fixed
before proceeding:**
1. `future_year_disputed` was emitted for both "the target year itself is
   disputed" and "some other year is disputed" — collapsing the one case
   that matters most (the report's own target year being structurally
   disputed) into the same bucket as an unrelated future dispute. Split
   into a separate `target_year_disputed` flag.
2. A variant-bearing slug (Krishna Janmashtami's smarta_nishita +
   gaudiya_iskcon rows) produced duplicate copies of the same flag type —
   the JSON summary deduplicated by slug, but the per-slug evidence receipt
   did not. Rewritten so every flag type appears **at most once per slug**,
   carrying an `evidence` array naming every contributing rule row instead
   of repeating the flag.
3. `no_current_year_source` claimed something the data model can't support
   — it only checked whether `citation` was non-empty, not whether that
   citation's text actually supports the target year. `citation` is free
   text and can name a different year entirely (maha-shivaratri's own
   citation describes a 2027 occurrence, while this report concerns 2026).
   Renamed to `no_structured_citation` (paired with a new, equally scoped
   `has_citation`) — neither is a year-specific claim.

Corrected summary for 2026 (47 `resolved` slugs): `target_year_disputed` 0,
`future_year_disputed` 3, `no_structured_dispute_for_target_year` 11,
`has_citation` 11, `no_structured_citation` 36,
`has_ratification_note_requiring_human_read` 26,
`profile_scope_unverified` 47 (applies to all, by design — this audit run
only computed against the Ujjain reference point).

**This pass does not itself tell you which of the 47 are safe to trust.**
It tells you which ones have a citation, which have a structured per-year
dispute, and which have a note a human still needs to read. The actual
per-slug judgment call — is this settled enough to publish, notify on, or
treat as authoritative — remains a human decision, consistent with this
project's own rule that calendar/content judgment calls need a named
reviewer, not an inferred one.

## 9. Missing-rule reference audit (2026-09-04)

Read-only SQL against production (Supabase project `mnbwodcswxoojndytngu`).
**Corrects §7's premature "migration-era catalogue pollution" hypothesis —
that conclusion does not hold up and is retracted below.**

### FK check

Four tables carry a FK into `observance_definitions.id`:
`observance_occurrences`, `observance_review_queue`,
`observance_materialisation_batches`, `vrat_observations`. All 7
`missing_rule` slugs have **zero** rows in the latter three, but **all 7
have existing, `publication_status: 'published'` rows in
`observance_occurrences`** for 2026 and/or 2027 (1-2 rows each) — they are
not orphaned catalogue entries with no data; they are live, currently-served
festival dates.

### Where that data actually comes from

`calculated_by: 'legacy_sync'`, `final_date_source: 'legacy_seed'`,
`source_provenance` citing real external sites (myfest.in,
drikpanchang.com, timeanddate.com) — a distinct, older manual-seed
mechanism, unrelated to the deleted `corrected_2026_festival_migration`
batch (different `calculated_by` value entirely). The migration-window
timestamp correlation on `observance_definitions.created_at` that §7 flagged
was coincidental, not evidence of shared origin with the bad migration —
retracted.

### Real finding: two are confirmed exact-date duplicates, three show unexplained discrepancies with their own qualified sibling

Each of the 7 conceptually overlaps with an already-`rules.json`-backed
"qualified" sibling (`-begins`/`-ends`/etc.). Comparing actual stored dates
for years both have a row:

| Slug (no rule) | Sibling (has rule) | Year | Base date | Sibling date | Finding |
|---|---|---|---|---|---|
| `gudi-padwa-ugadi` | `gudi-padwa` **and** `ugadi` | 2027 | 2027-04-07 | 2027-04-07 (both) | **Exact triple duplicate.** Note: `gudi-padwa`/`ugadi` are `launch_status: 'deferred'` in `rules.json` yet both have their own independently-`published` 2027-04-07 row (`calculated_by: manual_engine_run_v2`/`cron_job`) — a separate governance gap (a deferred rule should never present a final date; these already do) outside this audit's scope, flagged for its own follow-up. |
| `vassa-begins` | `vassa-begins-rains-retreat` | 2027 | 2027-07-19 | 2027-07-19 | **Exact duplicate.** |
| `pavarana` | `pavarana-end-of-vassa` | 2027 | 2027-10-17 | 2027-10-15 | 2-day discrepancy — same event, two sources disagree. |
| `samvatsari` | `samvatsari-paryushana-ends` | 2026 | 2026-09-06 | 2026-09-15 | 9-day discrepancy. |
| `samvatsari` | `samvatsari-paryushana-ends` | 2027 | 2027-09-04 | 2027-09-05 | 1-day discrepancy. |
| `sangha-day` | `sangha-day-loy-krathong` | 2027 | 2027-11-11 | 2027-11-13 | 2-day discrepancy. |
| `paryushana-parva` | `paryushana-parva-begins` | 2026, 2027 | differ (08-30 vs 09-08; 08-26 vs 07-30) | — | No collision: dates differ and the 2027 sibling row is `publication_status: 'withheld_disputed'` anyway. |
| `das-lakshana-dharma` | `das-lakshana-dharma-begins` | — | 2026 only | no 2026 row | No overlapping year to compare. |

### Deletion-safety check

`materializeOccurrencesForYears`'s delete paths (`materialize.ts:1111`,
`:1212`) only operate on rows tied to a `batch_id` from
`observance_materialisation_batches` — confirmed zero such rows for all 7,
so the nightly cron's regeneration/reconciliation logic cannot touch or
delete them. They are not at risk of accidental automated deletion.

### What this actually means (not resolved here — needs a product/content decision)

- These are **not safe cleanup candidates** in the sense §7 first
  suggested. Two show real, currently-live duplicate displays (matching the
  Ekadashi-duplicate bug pattern fixed earlier this session); three show
  unexplained day-level discrepancies between two live, independent sources
  describing what should be the same festival moment.
  Nothing has been changed — this needs a decision on which source to
  trust, and likely consolidating each pair into one properly-`rules.json`-backed
  definition rather than maintaining two parallel, disagreeing ones.
- These 7 have **no automated path to generate dates beyond whatever years
  are already manually seeded** (currently 2026 and/or 2027 only) — once
  those pass, they will simply stop appearing unless someone repeats the
  manual seed process or a real `rules.json` rule is written. This is a
  maintenance gap, not an active bug today, but worth planning for.
- The separate, out-of-scope governance gap noted above (`gudi-padwa`/
  `ugadi` presenting a final published date despite `launch_status:
  'deferred'`) was not investigated further here — flagged only.

## 10. Manual-seed reconciliation and governance-gap closure (2026-09-04)

Five further, concrete pieces of work, per explicit sequencing: trace
exposure paths, reclassify, produce reviewer-owned reconciliation records,
close the governance-contradiction mechanism, and add regression coverage.
**"Legitimate manual seed" (§9) was correctly pushed back on as too strong a
claim** — it proves these rows are intentionally persisted with provenance,
not that their dates are authoritative. `myfest.in`, Drik Panchang, and
timeanddate.com are source records to evaluate, not automatic approval.

### 10.1 API/UI exposure trace

Every one of these 7 manual-seed rows sits under `calendar_profile:
'legacy-ujjain'` at the exact Ujjain reference coordinates — the default
bucket served to any user with no saved location, i.e. most traffic, not an
edge case.

Of the 12 routes reading `observance_occurrences` directly: `home-summary`,
`calendar/month`, `calendar/upcoming`, `calendar/day`, `calendar/export` are
all protected — either by calling `filterWithheldJoinedRows` directly, or
because they call `formatOccurrencesToResults`, which calls it internally
(`observance-formatter.ts:249`). `ai/chat` filters to `kind: 'vrat'` only, so
it structurally cannot surface any of the 7 (`kind: 'major'`/`'regional'`).

**But `isWithheldOccurrence` (`withheld.ts:87`) returns `false` (not
withheld) whenever a slug has zero `rules.json` rows at all** — so the
protected paths' filter is a no-op for exactly these 7 slugs, on every one of
them, regardless of how many other paths apply it correctly. The filter was
built for rules that ARE disputed/deferred; a slug with no rule to check
against was never something it was designed to catch.

**`cron/festival-email` had zero withheld-filtering of any kind** — the one
genuinely unprotected, user-facing path found. Fixed this cycle (§10.4).
`vrat/stats` and the 3 admin routes were not traced further (not user-facing
in the same way); `cron/verify-festival-dates` and `cron/calendar-health`
were not traced (read-only diagnostic tooling, lower risk, not started).

### 10.2 Reclassified: `missing_rule` → `manual_seed_without_rule`

`scripts/audit-observance-catalogue.ts` now distinguishes a slug with
genuinely nothing (no rule, no data — stays `missing_rule`, count now 0) from
one with no rule but live `published` occurrence data
(`manual_seed_without_rule`, count 7). The script also now flags, on every
row regardless of bucket, whether `launch_status: 'deferred'` coexists with
pre-existing published data — see §10.3. Regenerated:
[`docs/audits/observance-catalogue/2026.json`](audits/observance-catalogue/2026.json)
/ [`.md`](audits/observance-catalogue/2026.md). Updated counts: `resolved`
47, `deferred` 48, `missing_rule` 0, `manual_seed_without_rule` 7,
`expected_zero` 1, `engine_anomaly` 0 (sum 103, unchanged).

### 10.3 Governance contradiction — far larger than the 2 cases first found

Querying the new per-row flag across the whole catalogue: **all 48 of the
currently-`deferred` definitions have pre-existing `published`
`observance_occurrences` rows** — not just `gudi-padwa`/`ugadi`. This is
systemic, not an edge case, and it is exactly the risk `withheld.ts`'s own
header comment already named: *"The stored rows should also be quarantined
at the database level. This filter is defence in depth, not a replacement
for cleanup."* That comment was written before anyone had measured how many
rows were actually affected — this is the first measurement, and the answer
is all of them.

**This is not a full incident on its own**, because §10.1 already confirmed
`isPublishable()` correctly withholds every one of these 48 on every
protected read path (`isWithheldOccurrence` finds their rule, sees
`launch_status: 'deferred'`, returns withheld=true) — the defense-in-depth
layer is doing its job on the paths that call it. The uncovered risk is
narrower and now closed: paths that skip that layer entirely.

**First fix attempt overstated its own coverage — caught and corrected by a
second review before this closed.** The initial fix added
`filterWithheldJoinedRows` to `cron/festival-email` and claimed, in its own
commit message, to close exposure for "48 deferred definitions, plus 7
manual-seed slugs." It did not: `filterWithheldJoinedRows` is rule-based —
for a slug with **zero** `rules.json` rows it returns `false` (not withheld;
`withheld.ts:87`, `if (rulesForSlug.length === 0) return false`) because it
has no rule to check against. That function was correctly protecting the 48
deferred-*rule*-backed definitions, but it structurally could not, and did
not, protect the 7 manual-seed slugs at all — the route would have kept
emailing about `gudi-padwa-ugadi`, `samvatsari`, etc. exactly as before. The
one test added at the time (deferred Onam) happened to only exercise the
case the fix actually covered, so it passed without proving the claim.

Two further real gaps found in the same review, neither related to the
first: the query never restricted to `publication_status: 'published'` (a
`'draft'`/`'withheld_disputed'` row for an otherwise-fine rule would still
reach and pass the rule-based filter, since that filter checks the rule,
never the individual row's own publication status outside one narrow bypass
this route's rows never qualify for — `paryushana-parva-begins`' own 2027
row is `withheld_disputed` today, a live example of exactly this shape);
and the subject-line lookup read `def.name`/`def.theme`, neither of which
has ever existed as an `observance_definitions` column (only
`display_name` does), so every email's subject silently fell back to the
generic "Festival is in 3 days" regardless of which festival it was.

**All three now actually fixed**, in `src/app/api/cron/festival-email/route.ts`:
1. Query now includes `.eq('publication_status', 'published')`.
2. A second, existence-based gate (`RULED_SLUGS`, built from
   `CANONICAL_RULES`) runs after the rule-based filter and fails closed on
   any slug with no `rules.json` entry at all — closing the actual gap for
   the 7 manual-seed slugs, not just the 48 the first fix already covered.
3. Subject/body copy now reads `display_name`; the fabricated "theme"
   sentence (no such data ever existed to back it) was removed rather than
   backfilled with a hardcoded placeholder.

5 tests in `src/app/api/cron/festival-email/__tests__/route.test.ts`,
one per finding plus the original deferred-Onam case and a real-festival
control: a deferred rule with a stray published row, a manual-seed slug
with no rule at all, a non-published row for an otherwise-fine rule, a real
publishable+published festival (still sends), and the `display_name` fix
(subject contains the real name, not `"undefined"`).

**Fourth, non-blocking finding from the same review, fixed anyway (small
and in the same file):** `.limit(3)` applied to the raw query, before either
filter — up to 3 withheld/unruled rows could occupy the entire result set
and crowd out a genuinely publishable 4th festival sharing the same date,
with no `ORDER BY` making which 3 came back deterministic run to run. Not a
safety leak (worst case is under-notification, not over-exposure), but
fixed rather than deferred since it was a one-line move: the query now
takes `.order('id')` with no limit, both filters run on the full result,
and `.slice(0, 3)` applies only to the already-filtered list. 6th test:
3 withheld rows plus a valid 4th sharing one date — only the valid one is
emailed.

**Not resolved, and explicitly not an engineering call:** whether the 48
deferred slugs' 100+ published rows should be retracted/quarantined at the
database level, per `withheld.ts`'s own suggestion. That is data cleanup at
real scale, needs a reviewer decision on each affected family (or a policy
decision to blanket-withhold all `deferred`-backed published rows at once),
and was not attempted here.

### 10.4 Reconciliation packet

[`docs/RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md`](../RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md)
— one reviewer-owned record per collision, in this project's established
`[S]`-decision packet format (matching `COUNCIL_RATIFICATION_PACKET.md`'s
house style: "nothing changed yet," one question per item, `draft` state).
Covers the 5 discrepant/duplicate pairs (Gudi Padwa/Ugadi, Vassa, Pavarana,
Samvatsari, Sangha Day) plus the Gudi Padwa/Ugadi deferred-yet-published
contradiction specifically. Also surfaces a compliance point independent of
which date is correct: `docs/source-governance.md` §2 classifies all three
citation sources behind these 7 rows (myfest.in, drikpanchang.com,
timeanddate.com) as **Tier 5 — "may corroborate, never sole authority"** —
none of the 7 currently cite anything higher, so even the item that turns
out to have the right date still needs a Tier 1-4 source before it can be
`approved` under this project's own policy.

### 10.5 Regression coverage: unbatched rows are structurally untouchable

`src/lib/calendar/__tests__/materialize-unbatched-safety.test.ts` — proves,
via a real call to `commitOccurrencesWithBatches` (not just source reading),
that a manual-seed row (`batch_id: null`) is never deleted or unlinked when
the engine writes an unrelated identity in the same run. The cleanup pass's
query is `.eq('batch_id', batchId)` for a batch the run itself opened; a
`null` batch_id can never match that filter. Confirmed structurally, not
assumed.

### 10.6 Step 3, first pass: external verification of the reconciliation packet (2026-09-05)

Per the agreed sequencing, step 3 (broad external verification of the 47
`resolved` slugs) starts with the 5 reconciliation-packet discrepancies
first, not the full 47 — these were already flagged as disputed and are
higher-value to resolve first. Findings added directly to
`RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md`, per item, without making the
which-slug-survives call (still the reviewer's, per `source-governance.md`
§5):

- **Gudi Padwa/Ugadi**: already resolved by a Tier 1 source already in this
  repo (`docs/sources/rashtriya-panchang-saka-1948.manifest.md:190`) —
  2027-04-07 confirmed correct.
- **Vassa Begins**: 2027-07-19 confirmed via Asalha Puja's independently-reported
  2027-07-18 date + the traditional "begins the next day" rule. Matches both
  stored rows — a confirmed-correct duplicate, not an accuracy dispute.
- **Pavarana**: the astronomical full moon of October 2027 (2027-10-15,
  TheSkyLive) matches the rules-engine sibling exactly; the manual-seed row's
  2027-10-17 appears wrong.
- **Samvatsari (2026)**: resolved by the same in-repo Tier 1 source
  (manifest.md:230) — 2026-09-15 confirmed correct, matching the rules-engine
  sibling; the manual-seed row's 2026-09-06 (9 days off) appears wrong. 2027
  not independently re-checked.
- **Sangha Day**: the most consequential finding — this is not a date
  dispute at all. "Sangha Day" is independently and consistently documented
  as Māgha Pūjā, a February/March full-moon observance commemorating an
  unrelated event, with no connection to Loy Krathong (confirmed
  independently at 2027-11-14, the Thai 12th-lunar-month lantern festival).
  Both stored rows sit in November near-but-not-matching Loy Krathong,
  nowhere near real Sangha Day's actual window. Reads as a genuine
  content-modeling error (the wrong festival's name attached to a different
  festival's date), not an accuracy discrepancy between two sources for the
  same event.

4 of 5 items now have a real answer to "which date is correct"; none have a
Tier 1-4 citation actually *attached* to the surviving row yet, and none of
the structural questions (retire a duplicate slug, merge two into one,
correct/split the Sangha Day content error) have been decided — those
remain the reviewer's call.

## 11. Not yet done — explicitly deferred

- **Reconciliation decision** for the 5 slug-pairs in
  `RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md` — now backed by real
  external-verification findings (§10.6) for 4 of 5, but the which-source-
  to-trust ratification, whether to merge into one properly-ruled
  definition, the Sangha Day content-error correction, and attaching an
  actual Tier 1-4 citation to whichever row survives are all still open,
  still the reviewer's call.
  Needs a named reviewer; not an engineering call.
- **Database-level cleanup decision** for the 48 deferred-with-published-rows
  definitions found in §10.3 — whether to retract/quarantine those rows at
  the data level (matching `withheld.ts`'s own long-standing suggestion), on
  what timeline, and whether per-family or as one blanket policy change.
  Not started; explicitly a product/governance call, not resolved here.
- **Prioritized external verification**: use §8's evidence — especially the
  26 `has_ratification_note_requiring_human_read` rows and the 36
  `no_structured_citation` rows — to prioritize by upcoming date,
  notification eligibility, audience size, and calendar-profile divergence.
  Not started; the 5 reconciliation-packet items above are now the first
  priority once a reviewer answers them.
