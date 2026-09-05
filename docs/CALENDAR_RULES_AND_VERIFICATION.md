# Calendar Rules and Verification

**Status:** Active policy. Supersedes `docs/source-governance.md` (moved to
`docs/archive/source-governance.md`, superseded but not deleted).
**Applies to:** every rule in `packages/dharma-rules/src/festivals/rules.json`,
every golden fixture, every published `observance_occurrences` row.

## The canonical delivery path

```
rule definition -> panchang engine -> profile/location-aware occurrence
-> verified fixture -> publication gate
```

The engine calculates the astronomical condition a rule declares. A rule
declares the observance convention — it does not compute one into existence.

## Policy

- **Rules and fixtures are the canonical technical contract.** A rule's
  correctness is established by its own declared convention plus its
  fixture coverage, not by prose describing intent.
- **Rules explicitly model** tradition, calendar profile, and
  location/region, and they name the date convention precisely — e.g.
  sunrise tithi, madhyahna, arunodaya, moonrise, full moon, solar date, or a
  named regional convention. A rule that cannot name its own convention is
  not ready to be `included`.
- **The engine calculates the declared rule.** External sources are manual
  spot-check evidence for a rule or a fixture — never a replacement
  calculator, and never scraped or bulk-imported. See §3 below.
- **LLM output may draft research notes or candidate rules only.** It must
  never create, approve, or publish an observance date automatically, and
  it is never itself a citation.
- **Unknown, conflicting, or incomplete rules stay `draft`, `deferred`, or
  `withheld`.** Do not guess a date into existence to fill a gap.
- **A named human review is required before a draft rule becomes
  `included`.**
- **Represent recognised variants neutrally.** When two or more recognised
  traditions place an observance on different dates, present all of them and
  never call another tradition's date incorrect.

## Runtime statuses

Use only these four:

| Status | Meaning |
|---|---|
| `draft` | Rule authored, not yet reviewed. |
| `included` | Reviewed and live — the engine computes and publishes this rule's dates. |
| `deferred` | Knowable in principle, or under review, but not ready to stand behind. The engine withholds it (`isPublishable()`, `src/lib/calendar/engine.ts`). |
| `withheld` | A specific occurrence is disputed or otherwise blocked from publication, independent of the rule's own status (e.g. `disputed_years`, `publication_status: 'withheld_disputed'`). |

**Current implementation gap, stated plainly rather than glossed over:**
`rules.json` today only uses `included` and `deferred` as literal
`launch_status` values — `draft` and `withheld` are this policy's target
model, not yet distinct runtime states in that field. `withheld` already
exists as real, enforced behavior at the *occurrence* level
(`disputed_years`, `publication_status`), just not as a `launch_status`
value. Closing this gap is schema/behavior work, out of scope for this
documentation-only migration — tracked as an open item, not silently
assumed to already exist.

## Provenance — lightweight, not a workflow

Keep beside a rule or fixture:

- source title or URL
- date checked
- concise rationale
- reviewer name, when a human has actually reviewed it

This is deliberately smaller than a structured multi-field record with a
tier taxonomy and a tracked review-state machine. Those are real,
already-implemented mechanisms in this codebase today (see below) — this
policy does not remove them, it stops requiring new work to expand them
before a rule can ship.

## What already exists and is not being replaced

This is a documentation simplification, not a rewrite. The following are
real, load-bearing mechanisms, confirmed in production as of the Phase 0
audit (`docs/audits/phase0-ground-truth/`), and nothing about this document
changes their behavior:

- `golden_fixtures` (298 rows, 34 festivals) — the real fixture/evidence
  table, with an admin GUI at `/admin/calendar-governance`.
- `SourceTier`, `SourceReference`, and `reviewStatus` types
  (`packages/dharma-rules/src/conditions/types.ts`) — the real source-tier
  and review-status shape this document's "lightweight provenance"
  deliberately does not require expanding.
- `ratification_note`, `citation`, `disputed_years`, `launch_status` on
  `ObservanceRule` (`src/lib/calendar/rules.ts`) — read by the engine's
  publication gate today.
- `approved-fixture-governance.ts` / `approved-fixture-materializer.ts` /
  `approved-fixture-engine.ts` — the real enforcement path gating
  publication on `fixture.source.tier`.
- The read-time withholding layer (`src/lib/calendar/withheld.ts`,
  `filterWithheldJoinedRows`) — defense in depth for occurrences already
  stored before a rule's status changed.

**Not carried forward as required practice, confirmed unused:**
`source_references` (a table matching the old policy's spec exactly, zero
rows in production) and the literal 7-state
`draft→technical_ok→in_review→regional_review→approved→disputed→published`
workflow as a tracked column — neither has ever been operationalized.
Real ratification has instead happened as commit messages and
`ratification_note` prose (e.g. a founder's direct chat approval quoted in
a commit message). This document does not require building the unused
mechanism; it also does not remove the real ones above.

## No scraping, no bulk import

Do not scrape or bulk-import third-party calendar services (drikpanchang.com,
timeanddate.com, myfest.in, or similar). A single verified date, manually
checked and cited with its source, is acceptable evidence for a fixture or
rule. Systematic harvesting is not — both for licensing reasons (UK/EU
database right, ToS restrictions) and because the resulting citation would
not be a real spot-check.

## AI's role, stated once, plainly

An LLM (including this assistant) may:
- draft a candidate rule or fixture for human review,
- summarize or fetch a real external source's content for a human to
  evaluate,
- flag a discrepancy or a gap in a review queue.

An LLM must never:
- mark a rule `included`,
- write or overwrite a published occurrence date,
- be cited as a source,
- be described to a user as verification.

## What this document does not do

It does not delete or rewrite `docs/archive/source-governance.md`,
`docs/CALENDAR_LAUNCH_GOVERNANCE_DECISIONS.md`,
`docs/CALENDAR_ENGINE_ASSESSMENT.md`, `docs/RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md`,
or any audit under `docs/audits/` — those are historical/incident records
and keep their original findings intact, correction history included. It
does not change any rule, occurrence, fixture, API, cron, notification, or
publication status. It replaces only the *policy statement* — the previous
document's heavier apparatus (Calendar Advisory Council composition, the
7-state workflow, the `source_references` schema) is archived, not deleted,
should any of it need reviving later.
