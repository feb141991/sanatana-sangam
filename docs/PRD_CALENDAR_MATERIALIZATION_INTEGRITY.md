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
  profile. Tested: `__tests__/resolve-occurrences.test.ts` (5 tests).
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
- `src/lib/calendar` test suite: 191 passed / 12 pre-existing, unrelated
  failures in `materialize-commit.test.ts` (stale mock, confirmed present
  before this cycle's changes too) / 203 total.
- Production DB state (Supabase project `mnbwodcswxoojndytngu`) verified via
  direct SQL after each write: 54-row migration batch deleted (0 remaining),
  5-row targeted backfill landed with correct dates and no `festivals`
  conflict, 5 deferred slugs confirmed absent as intended, confirmed via
  direct query that `krishna-janmashtami` is a single `observance_
  definitions` row (not two) before designing the collision-collapse fix.
