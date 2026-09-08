# Task: Multi-Day Observance Rule Research, Batch 1

## Goal

Resolve the next set of multi-day observance candidates enough that engineering
can safely decide whether to add rules/series later. This is source and rule
research only. Do not write app copy, do not change production files, and do not
promote any deferred observance.

Use `scripts/multiday-rule-research-batch1-needed.json` as the input list.

## Scope

Research only these candidates:

- `holi-two-day-split`
- `onam-ten-day-series`
- `pitru-paksha-season`
- `das-lakshana-dharma`
- `pongal-four-day-cycle`
- `hola-mohalla-three-day-series`
- `tulsi-vivah-bhishma-panchaka`

These were chosen first because they are likely to become implementable with
source/rule clarification. Leave Gupt Navratri, Losar, Vassa/Pavarana/Kathina,
Ayambil Oli, and Shaheedi Jor Mela for a later specialist batch unless you find
an obvious official source while working.

## Repository Context

Existing files:

- `packages/dharma-rules/src/festivals/rules.json`
- `packages/dharma-rules/src/festivals/series.json`
- `packages/dharma-rules/src/festivals/series-content.json`
- `src/lib/calendar/observance-series.ts`
- `src/lib/pitru-paksha.ts`
- `docs/UNRESOLVED_MULTIDAY_CANDIDATES_STATUS.md`

Current production-ready series already exist for Sharad Navratri, Diwali,
Paryushana, Ganeshotsav, and Chhath. Do not rework those here.

Chaitra Navratri is content-only and has its own prompt:
`scripts/chaitra-navratri-content-prompt-for-antigravity.md`. Do not mix it into
this research batch.

## Required Output

Create `scripts/multiday-rule-research-batch1-output.json` with one object per
candidate:

```json
{
  "candidate": "onam-ten-day-series",
  "verdict": "ready_for_engineering | content_only_after_engineering | needs_scholar_decision | keep_deferred",
  "recommendedShape": "daily_journey | festival_cluster | season | single_day | banner_only",
  "recommendedAudienceScope": "all | hindu | jain | sikh | regional | sampradaya_specific | institution_specific",
  "sourceConfidence": "high | medium | low",
  "proposedCanonicalSlug": "string-or-null",
  "backwardCompatibilityNotes": "string",
  "proposedChildren": [
    {
      "slug": "string",
      "sequence": 1,
      "title": "string",
      "ruleType": "anchor | relative_offset | independent_rule | external_calendar",
      "relativeBaseSlug": "string-or-null",
      "offsetDays": 0,
      "notes": "string"
    }
  ],
  "ruleSources": [
    {
      "sourceName": "string",
      "sourceAuthorOrPublisher": "string",
      "pageOrSection": "string",
      "url": "string",
      "tier": 1,
      "supports": "date_rule | child_sequence | naming | scope",
      "confidence": "high | medium | low",
      "accessDate": "2026-09-08"
    }
  ],
  "openQuestions": ["string"],
  "risks": ["string"],
  "engineeringNotes": "Exact fields/rules that would need to change later.",
  "recommendation": "One concise final recommendation."
}
```

## Acceptance Criteria

- Every candidate must include a verdict.
- Every `ready_for_engineering` verdict must include at least one rule source
  supporting the date/sequence model.
- If sources disagree, keep the candidate as `needs_scholar_decision` and record
  the disagreement instead of picking silently.
- If a candidate depends on a local institution or community calendar, mark it
  `institution_specific` or `keep_deferred`; do not force it into one global app
  date.
- If a slug migration is proposed, include a backward-compatibility note.
- Do not quote long copyrighted passages. Use concise paraphrase and cite source
  location/URL.

## Guardrails

- Do not invent scripture or calendar sources.
- Do not treat blog posts as primary authority when an official calendar,
  institutional source, or well-known almanac source is available.
- Do not change `rules.json`, `series.json`, `series-content.json`, migrations,
  database rows, or generated mobile snapshots.
- Do not author devotional prose. This batch only decides whether later
  engineering/content work is safe.
