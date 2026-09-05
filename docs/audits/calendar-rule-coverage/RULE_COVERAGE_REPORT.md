# Prompt 2 — Rule Coverage and Fixture Gap Report

**Status:** Read-only audit. No production data, migrations, rules, occurrences, fixtures, or publication statuses were modified to produce this report.
**Generated:** 2026-09-05, by `scripts/audit-calendar-rule-coverage.ts` (re-run with `npx tsx scripts/audit-calendar-rule-coverage.ts`; full per-definition data: `docs/audits/calendar-rule-coverage/rule-coverage.json`).
**Built on:** the Prompt 0 baseline (`docs/audits/phase0-ground-truth/`) and the Prompt 1 lean policy (`docs/CALENDAR_RULES_AND_VERIFICATION.md`).
**Scope:** all 103 active `observance_definitions` rows across Hindu, Sikh, Jain, and Buddhist traditions.

**Revision note:** this report went through two rounds of correction before
being treated as final. Round 1 fixed three classification defects and two
reporting gaps (category 1 dropped from 19 definitions to 2). Round 2 fixed a
further defect in round 1's own fix: the location/profile bar used OR instead
of AND, and counted the literal string `"unspecified"` as if it were a real
profile value — which wrongly passed `mahavir-jayanti` at category 1 on
location spread alone, with zero real profile evidence. Category 1 is now
**1** definition. Every correction is documented in place below rather than
quietly smoothed over.

## Methodology — every proxy stated plainly

This report classifies real code and data facts. Three of its dimensions are
**disclosed proxies** for a real product behavior, not a re-implementation of
that behavior — treat them as such, not as ground truth about what a specific
user will see on a specific day:

- **`notification_eligible`** = `has_rule && launch_statuses includes 'included'`.
  This mirrors, but does not exactly replicate, the real gate in
  `src/app/api/cron/festival-email/route.ts` (a `RULED_SLUGS` existence check
  plus `filterWithheldJoinedRows`, which additionally excludes a specific
  disputed/withheld **year** — a distinction this definition-level proxy
  cannot see, since it has no per-year granularity).
- **`known_opted_in_user_exposure`** = the number of `profiles` rows with
  `email_festivals = true` whose `tradition` column matches this definition's
  tradition (or, for `tradition: 'all'`, the total across every non-null
  tradition with that same opt-in filter). **Fixed after review**: the first
  draft queried `email_festivals` but never filtered on it, and called the
  result "opted-in profiles" without actually checking the preference — it
  was really `profiles_with_tradition`, which is not the same claim. The
  field is now genuinely filtered, and its real number today is tiny: 5
  opted-in profiles total (4 `hindu`, 1 `jain`) — see "A note on scale" below
  before reading anything into the exposure column.
- **`upcoming_occurrence_date`** = the earliest `observance_occurrences.date`
  on or after today with `publication_status = 'published'`, queried fresh
  (not from the Phase 0 baseline, which does not carry per-row dates). `null`
  means no future published row exists for that definition today — itself a
  fact worth noting, not necessarily a defect (see "Definitions with no
  upcoming published date" below).

Everything else (`has_rule`, `launch_statuses`, `fixture_total`,
`fixture_real_citations`, `fixture_years`) is read directly from the Phase 0
baseline's per-definition data. Three additional fixture fields are queried
fresh for this report only: `fixture_real_years`, `fixture_real_locations`,
`fixture_real_profiles` — see "Category 1's fixture bar" immediately below
for why.

### Category 1's fixture bar — fixed after review

The first draft assigned category 1 ("rule-backed and fixture-covered") to
any included rule with at least one non-placeholder fixture citation, using
`fixture_years` (a count across ALL fixture rows for that festival, including
placeholders) as a secondary "at least 2 years" check. That produced a real
contradiction: `naraka-chaturdashi` and `vijaya-ekadashi` were labelled
"fixture-covered" (category 1) while simultaneously being told to "add
fixture" — two claims about the same row that cannot both be true.

Fixed (round 1): category 1 now requires the actual standard this project
has already committed to (the "required safety sequence" below): **at least
one real citation, across at least 2 distinct years, across at least 2
distinct locations OR at least 2 distinct profiles — all computed from
non-placeholder rows only** (`fixture_real_years`, `fixture_real_locations`,
`fixture_real_profiles`, queried fresh from `golden_fixtures.location` /
`golden_fixtures.profile`, not estimated). Anything short of that full bar is
category 2 ("rule-backed but lacking adequate fixtures") with next action
"add fixture" — never both "covered" and "needs more" about the same fact.
Round 1 dropped category 1 from 19 definitions to 2: `ram-navami` and
`mahavir-jayanti`, the only two whose real citations spanned 2+ years across
2+ distinct locations **or** profiles.

**Fixed again (round 2): OR was still too weak, and a sentinel value was
being counted as real evidence.** Direct inspection of `mahavir-jayanti`'s 4
real fixture rows found every one of them recorded `profile:
{"calendar": null, "tradition": "unspecified"}` — "unspecified" is a
sentinel meaning no real profile was ever recorded, structurally identical to
null, not a second real data point. The OR bar let `mahavir-jayanti` pass on
location spread (Bedford, Ujjain) alone, with **zero** real profile/tradition
evidence — while claiming "fixture-covered." `ram-navami`, by contrast,
genuinely has two *real*, distinct calendar-profile citations
(`north_indian_purnimanta` / `gujarati_amanta`), confirmed by direct query
against `golden_fixtures`. The bar is now: **AND, not OR** (locations AND
profiles, both required), and `isRealCoverageValue()` excludes `null`,
empty, and the case-insensitive `"unspecified"` sentinel from ever counting
toward either distinct-value set. A regression test for both fixes
(`mahavir-jayanti`'s exact shape, and a general "2 locations but only 1 real
profile" case) was written and confirmed failing before the fix landed, then
passing after.

**This changed the numbers again, and that is the correct result of fixing a
real defect, not a modelling choice to be smoothed over:** category 1 is now
**1** definition — `ram-navami` alone. Every other previously-"covered"
definition, including `mahavir-jayanti`, genuinely lacks real evidence across
one of the three required dimensions (years, locations, profiles) — which is
a real, honest gap in this catalogue's fixture coverage that the looser bars
in both earlier drafts were hiding, not creating.

### The possible-duplicate/identity detector — one rejected version, one shipped

An earlier version of this script's duplicate detector used two signals:
"resolves to the same upcoming date" and "shares any name word not extremely
common across the catalogue." Run against the real 103-definition catalogue,
**that flagged 59 of 103 definitions (57%)** — reviewed and rejected before
this report was written, because most of those flags were real but harmless
coincidences this catalogue is *supposed* to contain: Guru Purnima, Asalha
Puja, and Raksha Bandhan genuinely share one full-moon date across three
different traditions; every named Ekadashi shares its date with the generic
`ekadashi` catch-all rule; Ganesh / Sankashti / Vinayaka Chaturthi all
legitimately contain the word "Chaturthi." None of that is a duplicate-identity
problem — it is what a panchang is supposed to show.

The shipped detector (`findIdentityFlags` in the script) uses two narrower,
purely structural signals instead, chosen because this catalogue's own naming
convention makes them observable facts rather than fuzzy guesses:

1. **`compound_name_matches_standalone_definition`** — this catalogue itself
   names tradition/regional variants with a `"X (Y)"` or `"X / Y"` pattern
   (e.g. `"Akshaya Tritiya (Jain)"`, `"Gudi Padwa / Ugadi"`). When `X` or `Y`
   matches, or is a sufficiently distinctive whole-word substring of, another
   active definition's name, the pair is flagged. A document-frequency guard
   (≤2 display_names) stops a generic word like "Ekadashi" (20+ definitions)
   from ever triggering this on its own.
2. **`slug_is_prefix_of_another_definition`** — one slug's hyphen-separated
   tokens are a strict prefix of another's, requiring ≥2 shared leading
   tokens (so a single generic token can never trigger it), e.g.
   `vassa-begins` / `vassa-begins-rains-retreat`.

This intentionally trades recall for precision: every one of the 22 flagged
definitions below is a real, inspectable structural fact, not a coincidence
of the ritual calendar. It can still miss a genuine duplicate pair named with
zero shared tokens in either direction (none found in this catalogue today).

One additional flag is carried over directly from the Phase 0 audit rather
than re-derived: `krishna-janmashtami`'s 2 published occurrence rows that
match neither of its own rule variants (Phase 0 §3,
`ambiguous_variant_rule_backed`) — a real, already-confirmed data
inconsistency, not a cross-slug naming collision, so it could not have been
found by either structural signal above.

### The identity flag no longer forces one verdict — fixed after review

The first draft treated every identity flag identically: category 5, and a
single hardcoded next action, "submit a merge/retirement decision for human
approval," for every flagged row. That wrongly implied `Diwali` and `Jain
Diwali (Nirvana Ladnun)`, or the Hindu and Jain `Akshaya Tritiya` rows, were
duplicate candidates headed for retirement — when this catalogue's own naming
convention (`"X (Jain)"`) suggests they may be *deliberately* distinct
tradition-scoped observances that just need their relationship formalized,
not merged away.

Fixed: an identity flag still overrides the **category** to 5 (an identity
question makes every other fact about the row provisional until a human
resolves it — this is required by the runbook's "classify as exactly one of
five categories," so category 5 itself is not optional). But the **next
action** now depends on whether the flagged pair spans different traditions:

- If every partner this row was flagged against is in a **different**
  tradition, the action is **"add an explicit profile/region variant"** —
  read as the catalogue's own naming convention working as intended, needing
  confirmation/formalization, not retirement.
- If any partner shares this row's **own** tradition (or there is no partner
  at all, as with `krishna-janmashtami`'s within-slug finding), the action
  stays **"submit a merge/retirement decision for human approval"** — two
  rows in the same tradition cannot be explained as a deliberate
  cross-tradition split.

**The underlying rule/fixture status is also now preserved, not discarded**,
per review: every row carries `underlying_category` and
`underlying_next_action` — what the row would have been classified as if it
had no identity flag at all — so a reviewer resolving an identity question
can see "this was otherwise a well-covered, included rule" versus "this was
otherwise completely unruled" rather than only "possible duplicate."

### The runbook's five actions, plus one disclosed sixth

The runbook names five actions: add fixture, clarify convention, add an
explicit profile/region variant, submit a merge/retirement decision, leave
deferred. None of those means "this item is already complete." Rather than
force a genuinely fixture-complete row into one of the five, this report adds
**`no_action_required`** as an explicit, disclosed sixth outcome in this
report's own action schema — not smuggled into the runbook document itself,
and not hidden inside a long qualifying sentence the way the first draft did.
Only 2 rows receive it today (the same 2 that meet the full category-1 bar
above).

### Category and next-action assignment (corrected)

```
underlying = (
  if !has_rule                    -> category 4 (manual-seed-only or unruled)
  else if launch_statuses has     -> category 3 (deferred: convention incomplete)
       'deferred'
  else if real_citations>0        -> category 1 (rule-backed, fixture-covered)
       AND real_years>=2
       AND real_locations>=2       (each real_* value excludes null and
       AND real_profiles>=2         the "unspecified" sentinel)
  else                            -> category 2 (rule-backed, lacking fixtures)
)

if identity_flags present:
  category = 5
  next_action = all partners in a different tradition
    ? "add an explicit profile/region variant"
    : "submit a merge/retirement decision for human approval"
else:
  category = underlying.category
  next_action = underlying.next_action
```

No definition in this catalogue has mixed `included`/`deferred` launch
statuses across its own variants (verified directly against the Phase 0
data), so the `underlying` branch never has to arbitrate a mixed case.

## Category counts (corrected)

| Category | Count |
|---|---|
| 1 — rule-backed and fixture-covered (full 2-year AND location AND profile bar) | **1** |
| 2 — rule-backed but lacking adequate fixtures | **43** |
| 3 — deferred because the rule convention is incomplete | 37 |
| 4 — manual-seed-only or unruled | **0** (see below — not the same as "none exist") |
| 5 — possible duplicate, incorrect identity, or incorrect content model | 22 |
| **Total** | **103** |

| Next action | Count |
|---|---|
| add fixture | 43 |
| leave deferred | 37 |
| submit a merge/retirement decision for human approval | 16 |
| add an explicit profile/region variant | 6 |
| no_action_required (disclosed sixth outcome, see above) | 1 |
| clarify convention | 0 |

## Manual-seed / unruled rows absorbed into Category 5 — surfaced explicitly

**Category 4 is 0. This is not the same fact as "no unruled rows exist."**
All 7 definitions Phase 0 confirmed as manual-seed/`legacy_sync`-only exist
today exactly as before; every one of them also matches the identity detector
(each has an active sibling sharing its name or slug stem), so category 5
takes priority over category 4 for all 7. Reported here as its own explicit
finding, per review, rather than left to disappear inside a category-4 count
of zero:

| Slug | Tradition | Sibling it was flagged against |
|---|---|---|
| `das-lakshana-dharma` | jain | `das-lakshana-dharma-begins` |
| `gudi-padwa-ugadi` | hindu | `gudi-padwa`, `ugadi` |
| `paryushana-parva` | jain | `paryushana-parva-begins` |
| `pavarana` | buddhist | `pavarana-end-of-vassa` |
| `samvatsari` | jain | `samvatsari-paryushana-ends` |
| `sangha-day` | buddhist | `sangha-day-loy-krathong` |
| `vassa-begins` | buddhist | `vassa-begins-rains-retreat` |

**7 of 103 active definitions (100% of the confirmed manual-seed set) require
identity review** — matching `docs/RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md`
exactly. For these 7, "does it need a rule" cannot be answered before "is
this actually a duplicate of its already-considered sibling," which is
exactly the question the existing reconciliation packet was already raising.
The JSON's `manual_seed_unruled_finding` block carries this as a standing,
machine-checkable field (`unruled_total: 7`,
`unruled_absorbed_into_category_5: 7`, `unruled_not_absorbed_slugs: []`) so a
future re-run cannot silently let one of these 7 fall out of view.

## Notable structural findings

- **Buddhist observances: zero are both rule-backed-included and free of an
  identity flag.** All 14 active Buddhist definitions split 8
  deferred / 6 flagged as possible duplicates (the `vassa`/`pavarana`/
  `sangha-day` cluster, all same-tradition — see action split below).
- **Jain observances: 9 of 11 are identity-flagged.** Of those 9, 5
  (`akshaya-tritiya-jain`, `kartik-purnima-jain`, `jain-diwali-nirvana-ladnun`,
  and their Hindu counterparts) are flagged against a **different**-tradition
  partner and get "add an explicit profile/region variant" — plausibly
  intentional tradition-scoped rows, not duplicates. The remaining 4
  same-tradition Jain pairs (`das-lakshana-dharma` + `-begins`,
  `paryushana-parva` + `-begins`, `samvatsari` + `-paryushana-ends`) get
  "submit a merge/retirement decision."
- **After both fixture-bar corrections, only 1 of 103 definitions meets the
  full declared fixture standard: `ram-navami`.** `mahavir-jayanti` looked
  like a second one under the first fix's looser OR bar, but its real
  fixtures all record profile.tradition as the "unspecified" sentinel —
  zero real profile evidence, not a second real value — so it correctly
  drops to category 2 under the round-2 fix. 43 definitions have some real
  evidence but not the full 2-year/2-location/2-profile matrix. This is the
  single most consequential number in this report and should not be read
  past quickly because 1 is a small, unglamorous headline.
- **A note on scale.** `known_opted_in_user_exposure` is computed from real,
  filtered data, but that real number is 5 total opted-in profiles with a
  known tradition today. At this size, the exposure column should be read as
  "hindu and jain currently have any known opted-in user at all; sikh and
  buddhist currently have none" — a coarse, honest signal — not as a
  meaningfully differentiated ranking within hindu or jain.
- **Definitions with no upcoming published occurrence at all** (`null`
  `upcoming_occurrence_date`, distinct from being deferred):
  `naraka-chaturdashi` (category 2, included), `nirjala-ekadashi` (category
  2, included), `saphala-ekadashi` (category 2, included — already
  diagnosed earlier this session as a real Pausha double-window materialization
  edge case straddling the Gregorian year boundary in 2027, via
  `scripts/sweep-adhika-masa-collisions.ts`, not a new finding here), and
  `yogini-ekadashi` (category 3, deferred, where a missing future row is
  expected). `naraka-chaturdashi` and `nirjala-ekadashi` have no prior
  diagnosis on record and are flagged here as observed fact only — this
  report does not speculate on their cause.

## Category 5 — full candidate list, with the corrected action split

| Slug | Tradition | Flagged with | Action | Underlying category |
|---|---|---|---|---|
| `diwali` | all | `jain-diwali-nirvana-ladnun` | add explicit variant | 2 |
| `jain-diwali-nirvana-ladnun` | jain | `diwali` | add explicit variant | 3 |
| `akshaya-tritiya` | hindu | `akshaya-tritiya-jain` | add explicit variant | 3 |
| `akshaya-tritiya-jain` | jain | `akshaya-tritiya` | add explicit variant | 3 |
| `kartik-purnima` | hindu | `kartik-purnima-jain` | add explicit variant | 3 |
| `kartik-purnima-jain` | jain | `kartik-purnima` | add explicit variant | 3 |
| `krishna-janmashtami` | hindu | *(within-slug, no partner)* | merge/retirement | 2 |
| `gudi-padwa` | hindu | `gudi-padwa-ugadi` | merge/retirement | 3 |
| `ugadi` | hindu | `gudi-padwa-ugadi` | merge/retirement | 3 |
| `gudi-padwa-ugadi` | hindu | `gudi-padwa`, `ugadi` | merge/retirement | 4 |
| `das-lakshana-dharma` | jain | `das-lakshana-dharma-begins` | merge/retirement | 4 |
| `das-lakshana-dharma-begins` | jain | `das-lakshana-dharma` | merge/retirement | 3 |
| `paryushana-parva` | jain | `paryushana-parva-begins` | merge/retirement | 4 |
| `paryushana-parva-begins` | jain | `paryushana-parva` | merge/retirement | 2 |
| `samvatsari` | jain | `samvatsari-paryushana-ends` | merge/retirement | 4 |
| `samvatsari-paryushana-ends` | jain | `samvatsari` | merge/retirement | 2 |
| `pavarana` | buddhist | `pavarana-end-of-vassa` | merge/retirement | 4 |
| `pavarana-end-of-vassa` | buddhist | `pavarana` | merge/retirement | 3 |
| `vassa-begins` | buddhist | `vassa-begins-rains-retreat` | merge/retirement | 4 |
| `vassa-begins-rains-retreat` | buddhist | `vassa-begins` | merge/retirement | 3 |
| `sangha-day` | buddhist | `sangha-day-loy-krathong` | merge/retirement | 4 |
| `sangha-day-loy-krathong` | buddhist | `sangha-day` | merge/retirement | 3 |

6 of 22 get "add an explicit profile/region variant" (all cross-tradition
pairs); 16 get "submit a merge/retirement decision for human approval" (all
same-tradition pairs, plus `krishna-janmashtami`'s within-slug finding). This
report does not recommend which side of any merge/retirement pair should
survive, nor does it assert the 6 variant-candidates definitely should stay
separate — both are named-human-reviewer decisions under
`docs/CALENDAR_RULES_AND_VERIFICATION.md`, not engineering ones.

## Priority-ordered view (top 30 of 103)

Sorted by: notification-eligible first, then known opted-in user exposure
(descending), then soonest upcoming published date, then slug for stability.
Full 103-row order is in `rule-coverage.json`.

| # | Slug | Tradition | Kind | Cat. | Next action | Notif. | Exposure | Upcoming date |
|---|---|---|---|---|---|---|---|---|
| 1 | diwali | all | major | 5 | add explicit variant | yes | 5 | 2026-11-08 |
| 2 | guru-purnima | all | major | 2 | add fixture | yes | 5 | 2027-07-18 |
| 3 | aja-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2026-09-07 |
| 4 | ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2026-09-07 |
| 5 | pradosh-vrat | hindu | vrat | 2 | add fixture | yes | 4 | 2026-09-08 |
| 6 | amavasya-vrat | hindu | vrat | 2 | add fixture | yes | 4 | 2026-09-11 |
| 7 | ganesh-chaturthi | hindu | major | 2 | add fixture | yes | 4 | 2026-09-14 |
| 8 | parivartini-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2026-09-22 |
| 9 | purnima-vrat | hindu | vrat | 2 | add fixture | yes | 4 | 2026-09-26 |
| 10 | navratri-begins | hindu | major | 2 | add fixture | yes | 4 | 2026-10-11 |
| 11 | karva-chauth | hindu | vrat | 2 | add fixture | yes | 4 | 2026-10-15 |
| 12 | dussehra | hindu | major | 2 | add fixture | yes | 4 | 2026-10-21 |
| 13 | rama-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2026-11-04 |
| 14 | dhanteras | hindu | major | 2 | add fixture | yes | 4 | 2026-11-06 |
| 15 | govardhan-puja | hindu | major | 2 | add fixture | yes | 4 | 2026-11-09 |
| 16 | bhai-dooj | hindu | major | 2 | add fixture | yes | 4 | 2026-11-10 |
| 17 | devutthana-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2026-11-20 |
| 18 | utpanna-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2026-12-04 |
| 19 | makar-sankranti | hindu | major | 2 | add fixture | yes | 4 | 2027-01-14 |
| 20 | vijaya-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2027-03-04 |
| 21 | maha-shivaratri | hindu | major | 2 | add fixture | yes | 4 | 2027-03-06 |
| 22 | ram-navami | hindu | major | **1** | **no action required** | yes | 4 | 2027-03-17 |
| 23 | amalaki-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2027-03-18 |
| 24 | holi | hindu | major | 2 | add fixture | yes | 4 | 2027-03-22 |
| 25 | kamada-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2027-04-17 |
| 26 | papmochani-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2027-05-02 |
| 27 | apara-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2027-06-01 |
| 28 | devshayani-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2027-07-14 |
| 29 | raksha-bandhan | hindu | major | 2 | add fixture | yes | 4 | 2027-07-18 |
| 30 | kamika-ekadashi | hindu | vrat | 2 | add fixture | yes | 4 | 2027-07-30 |

Reading note: under the corrected fixture bar, the top of this
notification-priority list is now almost entirely "add fixture" — an honest
reflection that very little of this catalogue's frequently-seen content meets
the full declared evidence standard yet, not a defect in the sort. The
category-5 candidates and the Buddhist/Jain structural findings above are the
substantive content of this report; several of them (the whole Buddhist
cluster, most of the same-tradition Jain cluster) are not currently
notification-eligible at all, so they do not sort to the top here by design.

## Required safety sequence for any future rule change

Per the runbook (Prompt 2) and the lean policy
(`docs/CALENDAR_RULES_AND_VERIFICATION.md`), before any rule in this report
moves category:

1. **Explicit convention** — name the exact date convention (sunrise tithi,
   madhyahna, arunodaya, moonrise, full moon, solar date, or a named regional
   convention) before writing or changing a rule.
2. **≥2-year fixtures across locations/profiles** — not one year, not one
   location. (This is now the literal bar category 1 checks, above.)
3. **Run the engine** — the engine calculates the declared rule; it does not
   validate the convention choice itself.
4. **Manual spot-check without scraping** — a single verified, cited date;
   never systematic harvesting of a commercial calendar service.
5. **Preserve disagreement; keep deferred rather than force a date** — an
   unresolved or incomplete convention stays `draft`/`deferred`/`withheld`.
   Guessing a date to close a gap is never an acceptable substitute for step 1.

## Annual operation note

Per the runbook: once a rule/fixture matrix is sound, it does not need
re-verification every year. Revisit a category-1 item only when its
implementation, ephemeris, scope, or fixture set changes, or a credible new
disagreement is identified — not on a recurring schedule.

## Verification receipt

- `npx tsx --test scripts/audit-calendar-rule-coverage.test.ts` — 21/21 pass
  (12 → 18 in round 1: coverage for the 1-year-fixture defect, the
  2-year-but-1-location/profile defect, the placeholder-years-don't-count
  case, and the cross-tradition vs. same-tradition action split, including
  the mixed-partner default case. 18 → 21 in round 2: `isRealCoverageValue`'s
  own sentinel-rejection test, the OR-was-too-weak "2 locations, 1 real
  profile" case, and the exact `mahavir-jayanti` shape — all three written
  and confirmed **failing** against the pre-fix code before the fix landed,
  matching the runbook's own regression discipline).
- `npx tsx --test scripts/audit-phase0-ground-truth.test.ts` — 8/8 pass,
  unaffected (confirms this phase touched no Phase 0 code or its behavior).
- `npx tsc --noEmit` — clean.
- `npm test` — still has no bare `test` script in this repo (pre-existing,
  confirmed unrelated to this change, same as reported in the Phase 0 and
  Phase 1 receipts).
- `git diff --check` — clean.
- `git status --short` — only this report's own files
  (`scripts/audit-calendar-rule-coverage.ts`, its test file,
  `docs/audits/calendar-rule-coverage/rule-coverage.json`, this report).
- **Zero production writes.** Every database call in
  `scripts/audit-calendar-rule-coverage.ts` and in this investigation's
  ad hoc queries was a `SELECT`. No rule, occurrence, fixture, or
  publication-status row was created, modified, or deleted.
- **Zero live-date changes.** No `observance_occurrences` row's `date` or
  `publication_status` was touched. No `rules.json` entry was added, removed,
  or re-scoped.
