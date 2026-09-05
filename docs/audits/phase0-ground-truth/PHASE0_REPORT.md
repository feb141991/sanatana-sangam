# Phase 0 — Read-Only Ground Truth

**Status:** Read-only audit. No production data, migrations, rules, occurrences, or APIs were modified to produce this report.
**Generated:** 2026-09-05, alongside `scripts/audit-phase0-ground-truth.ts` (re-run with `npx tsx scripts/audit-phase0-ground-truth.ts`; full data: `docs/audits/phase0-ground-truth/ground-truth.json`).

## 1. Runtime references to governance terminology

Scope: real code (not docs/tests) that implements or consumes the Calendar
Advisory Council workflow states, source tiers, `source_references`, or
ratification/reviewer concepts from `docs/source-governance.md`. Full
per-file classification via a dedicated sub-agent pass (initial ~40-file
keyword hit list, each file actually read, not just grepped).

**Corrects an earlier characterization made in this same conversation**
that source-governance infrastructure was "mostly designed but unused."
That was wrong. This is genuinely, deeply load-bearing in real, running
code and even in user-visible UI copy — not paperwork sitting next to a
working system.

**Core, real consumers (not incidental):**
- `packages/dharma-rules/src/conditions/types.ts` — the strongest match:
  `SourceTier = 1|2|3|4|5|6`, a `SourceReference` interface mirroring
  §4 almost verbatim, and `reviewStatus: 'draft'|'technical_ok'|'in_review'|'approved'|'disputed'|'reviewed'`
  on the live `ObservanceResult` type every evaluated observance carries.
- `src/lib/calendar/rules.ts` — `ratification_note`, `citation` (Tier 1-4),
  `disputed_years`, `launch_status` are real fields on the core
  `ObservanceRule` type this whole session's work has been reading from
  `rules.json` all along.
- `src/lib/calendar/approved-fixture-governance.ts`,
  `approved-fixture-materializer.ts`, `approved-fixture-engine.ts` — gate
  directly on `fixture.source.tier !== 1` and write
  `councilReviewer: fixture.reviewedBy` into published rows. This is the
  real enforcement path behind `golden_fixtures`.
- `scripts/build-council-packet.ts` — live-queries `observance_review_queue.review_status`
  and writes `docs/COUNCIL_RATIFICATION_PACKET.md` (a real, already-shipped
  packet from 2026-08-12, same house style — "we are not asking you to
  check our astronomy," "nothing has been changed yet" — this session's own
  reconciliation packet independently landed on the identical format).
- **User-visible UI copy**, not just backend logic: `HomeDashboard.tsx`,
  `ProfileClient.tsx`, `OnboardingClient.tsx` all render the literal string
  `"⚖️ [S] ratification pending"` on the calendar-profile/sampradaya
  picker. End users see this governance-status language today.
- `src/lib/ai/retrieval.ts` surfaces `rule.ratification_note` directly into
  AI-facing context.
- `scripts/flag-raksha-bandhan-divergence.mts`, `diagnose-calendar-harness.ts`,
  `generate-festival-fallback.ts`, `diff-masa-correction.ts`, the two
  `scripts/shadow/*.mts` pilots, and `packages/dharma-rules/scripts/generate-golden-placeholders.ts`
  are all real, additional consumers (tier assertions, `disputed_ratification`
  classification, "MUST be individually approved by council review" text).

**Genuinely unused, confirmed:** `source_references` — migration
`supabase/migrations/20260814201500_create_source_references.sql`
(2026-08-14) creates it verbatim to §4's spec (tier `smallint` 1-6 CHECK,
review_status/reviewed_by/reviewed_at, copyright_status, usage_permitted,
RLS, a dedupe index) — and it has zero rows. No migration anywhere
implements the literal 7-state `draft→...→published` enum as a tracked DB
column; that workflow exists only as design intent plus several partial,
divergent approximations already in production: `golden_fixtures.approved`
(boolean, not the 7 states) + `reviewed_by`/`effective_from`,
`observance_review_queue.review_status` (`pending_review`/`approved`/`rejected`
— 3 states), `source_references.review_status` (spec'd, unused), and the
`SourceReference.reviewStatus` type above (6 of the 7 spec'd states, missing
`regional_review`). Real, founder-level ratification decisions exist too —
e.g. Dussehra's 2026 date, ratified by direct quote in a commit message:
*"I, Prince Sharma, as council approve it, go ahead"* — recorded as commit
messages and `ratification_note` prose, never through any of the four
structured mechanisms above.

**Confirmed incidental (not governance-related despite the keyword match):**
`api/ai/chat/route.ts` (`tier` = a user gamification perk tier),
`JsonLd.tsx`/`seo/geo-model.ts` (`reviewedBy` = schema.org SEO metadata),
`library-content-summary.ts` (plain scripture attribution string),
`gita-full-data.ts` ("ratif" matched inside "gratification").

## 2. Every `rules.json` definition — status, scope, family, fixture coverage

Full per-slug table: `ground-truth.json`'s `rule_definitions` array (103
rows, one per active `observance_definitions` row). Includes: `has_rule`,
`launch_statuses`, `rule_families`, `variant_count`, `variants`
(sampradaya/regional), and joined `golden_fixtures` coverage (`fixture_total`,
`fixture_real_citations`, `fixture_placeholder_citations`, `fixture_approved`,
`fixture_years`).

Corrected during this pass: `hasRule` initially checked only top-level
`rules.json` slugs, missing that `lunar_tithi_span` rules (e.g.
`navratri-begins`) declare named `sub_observances` (`dussehra`,
`durga-ashtami`, `maha-navami`, ...) that are real, cited, `launch_status`-bearing
content with no standalone top-level row. `dussehra` was
initially misclassified as ruleless; fixed by synthesizing a pseudo-rule
entry per sub-observance before classification. `durga-ashtami` and
`maha-navami` are sub-observances only (no standalone `observance_definitions`
row of their own), so they don't appear in the 103-definition set at all —
expected, not a gap.

## 3. Published occurrences classified by provenance (798 total, sum-check PASS)

**Corrected after review (2026-09-05)** — two real contract defects fixed
in `scripts/audit-phase0-ground-truth.ts` before this was treated as a
migration baseline. See the script's own header comment and
`scripts/audit-phase0-ground-truth.test.ts` (7 tests) for the full
before/after. In short: the original pass classified deferred status at
the SLUG level (a slug counted as deferred only if *every* rule variant for
it was) and inferred "manual seed" purely from "no rule exists" without
checking `calculated_by`. Both are fixed — `classifyOccurrence()` now
resolves each row to its specific matching rule variant via
`variant_key`/`spiritual_tradition` first, and the unruled bucket is split
by whether `calculated_by === 'legacy_sync'` is actually verified.

| Bucket | Rows | Distinct slugs |
|---|---|---|
| `rule_backed` | 553 | 46 |
| `ambiguous_variant_rule_backed` (couldn't match to a specific variant; none of the slug's variants are deferred) | 2 | 1 (`krishna-janmashtami`) |
| `ambiguous_variant_deferred_risk` (couldn't match to a specific variant; ≥1 of the slug's variants IS deferred) | **0** | 0 |
| `deferred_rule_backed_but_published` | 232 | **48** |
| `unruled_published_legacy_sync_confirmed` (no rule anywhere, `calculated_by` verified as `legacy_sync`) | 11 | 7 |
| `unruled_published_other_provenance` (no rule anywhere, NOT verified as `legacy_sync`) | **0** | 0 |

**The corrected classification does not change the headline story, but it
was necessary rather than assumed**: `ambiguous_variant_deferred_risk` and
`unruled_published_other_provenance` both come back at zero — meaning, for
today's actual data, no row's deferred-publication status was being masked
by the slug-level bug, and all 11 previously-bucketed "manual seed" rows
are genuinely confirmed `legacy_sync`, not just assumed to be. That is a
fact now established by the audit, not inferred from how the data looked.
One real, previously-invisible edge case did surface:
`krishna-janmashtami` has 2 published rows whose `variant_key`/
`spiritual_tradition` don't match either of its rule variants' own
`variant_key`/`sampradaya` field exactly (a data inconsistency from this
slug's own materialization history, documented earlier this session) —
correctly flagged as ambiguous rather than silently guessed either way.

The `deferred_rule_backed_but_published` bucket is the same governance gap
flagged earlier this session for `gudi-padwa`/`ugadi` specifically
(`docs/PRD_CALENDAR_MATERIALIZATION_INTEGRITY.md` §10.3) — this pass
confirms it at full scale with row-level counts: **48 slugs, 232 live
published rows**, each one a rule the codebase's own `launch_status:
'deferred'` flag says "not ready to stand behind," already presenting a
final date regardless. Full slug lists in `ground-truth.json`.

The 7 `unruled_published_legacy_sync_confirmed` slugs match the
reconciliation packet exactly: `das-lakshana-dharma`, `gudi-padwa-ugadi`,
`paryushana-parva`, `pavarana`, `samvatsari`, `sangha-day`, `vassa-begins`.

Raw `calculated_by` distribution (13 distinct values, reflecting
accumulated one-off batch scripts over time — `cron_job` 299,
`lazy_materialize_on_read` 226, `manual_engine_run_v2` 109,
`codex-20260719-recurring-materialize` 93, and 9 smaller ad hoc values) is
in `ground-truth.json`'s `published_occurrences_by_calculated_by`.

## 4. API / cron / notification / UI paths reading calendar occurrences

Grep-verified, not tabular (12 route files query `observance_occurrences`
directly):

**Protected** (call `filterWithheldJoinedRows` directly, or via
`formatOccurrencesToResults` which calls it internally):
- `calendar/month`, `calendar/upcoming`, `calendar/day` (via `formatOccurrencesToResults`)
- `calendar/export` (direct)
- `native/home-summary` (direct — both the Path A series pipeline and the
  Path B `observanceRows`/`firstObservance` pill path, per this session's
  earlier fix)
- `cron/festival-email` (direct, plus the additional `RULED_SLUGS`
  existence-based gate added this session for the no-rule-at-all case
  `filterWithheldJoinedRows` alone can't catch)

**Not filtered, and why that's evaluated as low-risk-by-scope, not
unverified:**
- `ai/chat`: queries with a hardcoded `kind.eq.vrat,route_kind.eq.vrat`
  filter — naturally excludes the major/regional festivals carrying the
  deferred/disputed gap found in §3. A future `vrat`-kind deferred rule
  would reopen this; not currently exposed.
- `admin/observance-content`, `admin/verify-festivals`, `admin/festivals`:
  all confirmed gated behind `requireAdminAccess()`/`verifyAdminCookieAuth`
  — unfiltered raw data is the intended behavior for an admin review
  surface, not an oversight.
- `cron/calendar-health`: sends a push notification only to one hardcoded
  admin profile (a "<60 fixtures remaining" ops alert), not user-facing.
- `cron/verify-festival-dates`: read/verification only, no notification
  send found.

**Not verified either way (flagged, not resolved):**
- `vrat/stats`: no auth check or withheld-filter call found in this route;
  scope/impact not further checked in this pass.

**Native app (`shoonaya-mobile`)**: reads calendar data exclusively through
the backend API (`home-summary`, `panchang`, etc.) — it does not
independently query Supabase for `observance_occurrences`, so it inherits
whichever protection the backend route it calls provides. Not a separate
risk surface on its own.

## 5. Fixture coverage summary

See §1/§2 above (`golden_fixtures`: 298 rows / 34 festivals / 89 real
citations / 209 placeholders / 89 approved). Per-slug fixture years and
counts are in `ground-truth.json`'s `rule_definitions[].fixture_*` fields —
**69 of the 103 active definitions have zero fixture rows of any kind**
(neither real nor placeholder), confirmed by direct count against the
generated JSON, not estimated. Fixture coverage today is concentrated in 34
festivals; the other 69 (including all 48 `deferred_rule_backed_but_published`
slugs from §3, and most of the 30 `vrat`-kind definitions) have none at all.
