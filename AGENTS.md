# Shoonaya Agent Instructions

This file is for Codex and other coding agents.

Before changing files, follow `SHOONAYA_WORKFLOW.md` and `SHOONAYA_RULES.md`.

## Required Behavior

- Read the relevant `.claude/agents/*.md` role file before implementing specialized work.
- Keep edits scoped to the user request.
- Preserve existing working flows and completion logic.
- Do not revert unrelated user or Claude changes.
- Use existing local patterns before introducing abstractions.
- For reviews, lead with findings, risks, and file references.

## Verification

Run targeted checks for touched files. For code edits, also run `graphify update .` after the change.

If full TypeScript is blocked by the known `ProfileClient.tsx` issue, say that directly and still run useful narrower checks.

## Reporting

Final responses must include what changed, checks run, and remaining risk. Do not claim a clean build unless it was actually verified.

## Calendar Engineering Rules

Binding for anything touching `packages/panchang-engine`, `packages/panchanga-core`,
`packages/dharma-rules`, `src/lib/calendar/*`, or the `observance_*` tables.

Specifications are authoritative: `docs/calendar-domain-model.md`,
`docs/astronomy-conventions.md`, `docs/calendar-profiles.md`,
`docs/festival-rule-schema.md`, `docs/calculation-examples.md`,
`docs/source-governance.md`. Current state and open work:
`docs/CALENDAR_ENGINE_ASSESSMENT.md`.

1. **Never hard-code Gregorian festival dates.** A date belongs in an occurrence row
   produced by a rule, or in a council-approved `manual_date_override` — nowhere else.
2. **All astronomical timestamps are stored in UTC.** ISO-8601 with `Z`.
3. **All displayed times must use an IANA timezone.** Fixed offsets like `+05:30`
   are forbidden in storage and in computation.
4. **Calculation location and tradition region are separate concepts.** Never derive
   a calendar profile from GPS; never compute a user's timings from a region's
   reference city.
5. **Festival rules must be represented as versioned data**, not code. Adding a
   regional or sampradāya variant must never require an engine change.
6. **Every occurrence must include its rule version and explanation.** An occurrence
   without `versions`, `reasons`, `profile`, and `location` must not be persisted or
   displayed.
7. **Never silently choose between recognised traditions.** Return all recognised
   variants; mark the user's as primary; never imply another is wrong.
8. **Do not modify astronomical conventions without updating the ADR.** Anything
   marked `[C]` in `docs/astronomy-conventions.md` is a breaking change requiring a
   version bump, re-materialisation, and a golden re-run.
9. **Every rule change requires golden test cases.** A rule at `approved` without a
   sourced golden fixture fails CI.
10. **A passing unit test does not prove religious correctness.** Items marked `[S]`
    require Calendar Advisory Council ratification; engineering may implement and
    flag, never ratify.
11. **Do not label a calendar result universal unless it is astronomical data.**
    Layer A is universal; Layers B and C are always profile-qualified.
12. **Use appropriately precise calculations.** Respect the tolerance budget in
    `docs/astronomy-conventions.md` §1.2 — tithi boundaries to ≤ 60 s. Never return
    an estimated boundary; return `null` and a diagnostic.

13. **One concept, one implementation.** Do not add a second copy of astronomy,
    a constant table, a solver, or a data source. If a transitional duplicate is
    genuinely unavoidable (e.g. a corrected implementation beside a load-bearing
    buggy one), you **must** register it in `docs/CALENDAR_ENGINE_ASSESSMENT.md`
    §7 with an explicit retirement gate, and say so in your report. **An
    unregistered duplicate is a defect** — a fix applied to one copy silently
    misses the other, which is exactly how defects D1/D2 were created.

14. **Every change and every review runs `docs/REVIEW_CHECKLIST.md`.** It is the
    coverage contract. §2 is the evidence rule: every reported number must be
    printed by a committed script runnable with one command, no hardcoded
    conclusions, and a source is a citation with query parameters — not a label.
    §3 is the standing invariant list: cardinality, detection capability, both
    directions, detection-vs-behaviour, degenerate inputs, frames and units,
    compensation, scope honesty. Checking a change against its own task
    description is **not a review** — that is a closed loop, and it is how D15's
    cardinality gap, D26 and D28 all reached `main` past a green suite. Sign off
    per §5: for each §3 heading, clear / finding / not-applicable-because.
    **Silence is not an answer.**

Additional hard constraints:

- **Layer discipline:** Layer A must not import Layer B or C; Layer B must not import
  Layer C. A violation is a defect even if the output looks correct.
- **Before adding a helper, grep for it.** `normalizeAngle`, `computeAstronomy`,
  month-name arrays and boundary solvers already exist. Import, do not redefine.
- **The mobile vendored tarball is a release artefact, not a copy to edit.**
  Re-vendor from source; never hand-modify `vendor/*.tgz` contents.
- **Swiss Ephemeris** must not be enabled without a recorded commercial-licence
  decision. Keep the existing `licenseMode: 'undecided'` guard.
- **No scraping** of commercial panchāṅga services. See `docs/source-governance.md` §3.
- **LLM output is never a source.** Triage signal only; it may not set
  `review_status` or write a published date.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
