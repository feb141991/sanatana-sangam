# Lean Calendar Rules Prompts

## Operating Boundary

This runbook simplifies calendar governance without weakening the calendar
contract. The canonical delivery path remains:

```text
rule definition -> panchang engine -> profile/location-aware occurrence
-> verified fixture -> publication gate
```

The engine computes the declared astronomical convention. A rule declares the
observance convention. Neither an LLM nor a third-party calendar page may
create or auto-publish a date.

Do not combine prompts. Stop after each prompt and provide the required
verification receipt for independent review.

---

## Prompt 0 - Read-Only Baseline

```text
Work only in /Users/Business(C)/Sanatan Sangam/Shoonaya.

Create a reproducible, read-only baseline for a lean calendar-rules migration.
Do not modify rules.json, database rows, migrations, API behavior, cron jobs,
notifications, fixture expectations, or publication statuses.

Audit and report:
1. Every active runtime import/reference to the heavyweight source-governance,
   advisory-council, source-tier, source_references, and ratification model.
2. Every active rules.json definition with tradition, calendar/profile scope,
   rule family, launch status, and fixture coverage.
3. Current stored occurrences classified as rule-backed engine rows, manual/
   legacy rows, and deferred-rule rows.
4. Every API, cron, notification, admin, and UI route that reads or publishes
   observance occurrences.
5. Existing date-validation fixtures and the provenance currently attached to
   them.

Write a machine-readable JSON receipt and a concise Markdown report under
docs/audits/calendar-rules-baseline/. The report must distinguish observed
facts from inference. Do not claim a date or rule is verified merely because
the engine produces output.

Run the relevant audit command, npm test, npx tsc --noEmit, git diff --check,
and git status --short. Report all pre-existing failures separately. Confirm
zero production writes and zero behavior changes.
Stop here.
```

---

## Prompt 1 - Documentation-Only Simplification

```text
Read the baseline produced by Prompt 0 before editing.

Replace the active heavyweight calendar-governance guidance with one concise
document: docs/CALENDAR_RULES_AND_VERIFICATION.md.

The new active policy must say only:
- Rules and fixtures are the canonical technical contract.
- Rules explicitly model tradition, calendar profile, location/region, and the
  date convention such as sunrise tithi, madhyahna, arunodaya, moonrise, full
  moon, solar date, or a named regional convention.
- The engine calculates the declared rule; external sources are manual
  spot-check evidence for a rule or fixture, not a replacement calculator.
- LLM output may draft research notes or candidate rules only. It must never
  create, approve, or publish a date automatically.
- Unknown, conflicting, or incomplete rules remain draft, deferred, or
  withheld. Do not guess.
- Do not scrape or bulk-import third-party calendar services.
- A named human review is required before a draft rule becomes included.

Use only these runtime statuses: draft, included, deferred, withheld. Do not
change the database schema or existing behavior in this prompt.

Move the former heavyweight policy to docs/archive/ with a prominent
SUPERSEDED header and a link to the new document. Do not delete historical
audits, incident records, reconciliation packets, or their correction history.
Update active documentation links. Historical documents may state that their
old framework was superseded, but must retain factual records.

Do not change rules, occurrences, fixtures, APIs, crons, notifications, or
publication statuses. Run npm test, npx tsc --noEmit, git diff --check, and
git status --short. Report the exact active references changed and confirm
zero production writes. Stop here.
```

---

## Prompt 2 - Rule Coverage and Fixture Gap Report

```text
Read the Prompt 0 baseline and the lean policy. Do not mutate production data,
rules, fixtures, APIs, cron jobs, or publication statuses.

Create a deterministic rule-coverage report for Hindu, Sikh, Jain, and
Buddhist observances. For every definition, classify it as exactly one of:
1. rule-backed and fixture-covered;
2. rule-backed but lacking adequate fixtures;
3. deferred because the rule convention is incomplete;
4. manual-seed-only or unruled;
5. possible duplicate, incorrect identity, or incorrect content model.

For each item, name one next action only: add fixture, clarify convention, add
an explicit profile/region variant, submit a merge/retirement decision for
human approval, or leave deferred.

Prioritize the report by notification eligibility, current user exposure, and
upcoming occurrence date. Keep manual-seed data visible as an audit finding;
do not delete or rewrite it.

For a future rule change, specify the required safety sequence:
- express the convention explicitly;
- add representative fixtures for at least two years, affected locations, and
  every affected profile/tradition variant;
- run the engine against those fixtures;
- manually spot-check a small number of high-impact fixtures without scraping;
- preserve a disagreement and keep the rule deferred rather than force a date.

Write JSON and Markdown reports under docs/audits/calendar-rule-coverage/.
Run the report, npm test, npx tsc --noEmit, git diff --check, and git status
--short. Confirm zero production writes and zero live-date changes. Stop here.
```

---

## Prompt 3 - Controlled Rule Remediation Template

```text
Use this prompt only after one specific item from Prompt 2 has been selected.

Target rule(s): <EXACT_SLUGS>
Target tradition/profile(s): <EXACT_SCOPE>
Target years and locations: <EXACT_FIXTURE_MATRIX>

First trace the entire path: rule -> engine -> fixture -> materialization ->
API -> notification/publication output. State any manual-seed collision or
existing publication row before changing code.

Make the smallest rule or fixture change needed. Do not change unrelated
definitions. Do not delete legacy rows. Do not mark a rule included unless the
request explicitly authorizes that transition and the named human reviewer is
recorded.

Add regression fixtures for the full requested matrix. Where external evidence
is used, record a source title/URL, checked date, and concise rationale. Do
not scrape, bulk-copy, or treat LLM output as evidence.

Run exact targeted tests, the relevant calendar verification suite, npm test,
npx tsc --noEmit, git diff --check, and git status --short. Report before/after
computed dates for every changed fixture and whether any stored occurrence or
notification behavior was intentionally changed. Stop for review.
```

## Annual Operation

Do not repeat manual verification every year. Once a rule and its fixture
matrix are sound, materialization is deterministic for future years. Revisit a
rule only when its implementation, ephemeris/date-boundary dependency,
tradition/profile scope, or fixture behavior changes, or when a rare calendar
condition or credible disagreement is identified.
