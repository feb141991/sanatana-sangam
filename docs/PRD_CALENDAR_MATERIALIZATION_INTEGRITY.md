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

### 2.5 `ensureYearMaterialized` hardening (this section is the one to keep
current — see §4 for the mechanism)
`src/lib/calendar/resolve-occurrences.ts` now:
- Validates `spiritual_tradition` against a live `tradition_profiles.slug`
  read before writing, falling back through `variant-qualifier.ts`'s
  evaluator-vocabulary crosswalk, and writing `null` rather than an
  unresolvable value.
- Collapses same-`display_name` sampradaya-variant collisions to one row
  (preferring the Smarta/default variant) for the one `calendar_profile`
  (`legacy-ujjain`) that a DB trigger mirrors into a legacy `festivals` table.
- Covered by `src/lib/calendar/__tests__/resolve-occurrences.test.ts` (4
  tests: collision collapse, profile scoping, crosswalk resolution, safe null
  fallback).

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
Any write to `observance_occurrences` under `legacy-ujjain` that includes two
rows whose `observance_definitions.display_name` is identical for the same
year (currently: Krishna Janmashtami's Smarta and Gaudiya/ISKCON variant
definitions both display as plain "Krishna Janmashtami") throws a unique
violation on `festivals`. Because Postgres treats a multi-row `INSERT`/
`upsert` as one atomic statement, this **rolls back every row in that batch**,
including completely unrelated slugs. This is not a small edge case: it
silently discarded 4 correct, unrelated rows (Ram Navami, Guru Ravidas
Jayanti, Guru Nanak Gurpurab, Maha Shivaratri) alongside the 2 Janmashtami
rows on the first attempt to backfill this incident, with zero error surfaced
to anything except the script's own stdout.

### Fix in place
`ensureYearMaterialized` now collapses same-name collisions to one row
(preferring Smarta) *only* for `calendar_profile === 'legacy-ujjain'` — see
§2.5. This is scoped to the one function known to write this table
proactively. **Not yet audited:** `materializeOccurrencesForYears` (the
nightly cron's batch materializer, `src/lib/calendar/materialize.ts:1242`)
and any other write path into `observance_occurrences` under `legacy-ujjain`
could hit the identical failure mode if a future rule introduces a second
festival with colliding display names. This should be swept before the next
festival with multiple named variants is added.

### Open question for product/architecture
Is `legacy-ujjain` + the `festivals` mirror table still required by anything
live (a legacy PWA surface, a notification job, search), or is it now dead
infrastructure that should be formally retired? This investigation did not
trace its remaining readers — flagged for a follow-up sweep, not resolved
here.

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

- `npx tsc --noEmit` clean (both the route.ts and resolve-occurrences.ts
  changes).
- `src/lib/calendar` test suite: 187 passed / 12 pre-existing, unrelated
  failures in `materialize-commit.test.ts` (stale mock, confirmed present
  before this cycle's changes too) / 199 total.
- Production DB state (Supabase project `mnbwodcswxoojndytngu`) verified via
  direct SQL after each write: 54-row migration batch deleted (0 remaining),
  5-row targeted backfill landed with correct dates and no `festivals`
  conflict, 5 deferred slugs confirmed absent as intended.
