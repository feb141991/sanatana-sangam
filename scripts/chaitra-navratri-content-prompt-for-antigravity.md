# Task: Author sourced Chaitra Navratri series content only

## Context

Shoonaya already has the structural rule scaffold for `chaitra-navratri-begins` in
`packages/dharma-rules/src/festivals/rules.json`.

This is not a rule/date task. Do not change date logic, calendar profiles, launch
status, or any other observance. This is a content-only task for the nine
Chaitra Navratri child days.

Use the existing live Sharad Navratri content in
`packages/dharma-rules/src/festivals/series-content.json` as the style, length,
field shape, and quality bar.

## Fixed structure

The Chaitra Navratri deity sequence is already fixed. Use exactly these slugs:

1. `chaitra-navratri-day-1-shailaputri` — Shailaputri
2. `chaitra-navratri-day-2-brahmacharini` — Brahmacharini
3. `chaitra-navratri-day-3-chandraghanta` — Chandraghanta
4. `chaitra-navratri-day-4-kushmanda` — Kushmanda
5. `chaitra-navratri-day-5-skandamata` — Skandamata
6. `chaitra-navratri-day-6-katyayani` — Katyayani
7. `chaitra-navratri-day-7-kalaratri` — Kalaratri
8. `chaitra-navratri-day-8-mahagauri` — Mahagauri
9. `chaitra-navratri-day-9-siddhidatri` — Siddhidatri, with Ram Navami context

Day 9 may mention Ram Navami as context, but do not duplicate the standalone
`ram-navami` rule or make the Chaitra Navratri day depend on the Ram Navami
content record. Keep it focused on Siddhidatri and the completion of the
Navratri journey.

## Required output

Produce `chaitra-navratri-content-output.json`, a flat array with 9 entries:

```json
{
  "definitionKey": "chaitra-navratri",
  "slug": "chaitra-navratri-day-1-shailaputri",
  "canonicalTitle": { "en": "...", "hi": "...", "pa": "..." },
  "deityOrTheme": {
    "en": "...",
    "hi": "...",
    "pa": "...",
    "verdict": "sourced",
    "sourceRefs": [
      { "sourceName": "...", "pageOrSection": "...", "tier": 1, "confidence": "high" }
    ]
  },
  "rituals": {
    "en": ["..."],
    "hi": ["..."],
    "pa": ["..."],
    "verdict": "sourced",
    "sourceRefs": [
      { "sourceName": "...", "pageOrSection": "...", "tier": 1, "confidence": "high" }
    ]
  },
  "significance": {
    "en": "...",
    "hi": "...",
    "pa": "...",
    "verdict": "sourced",
    "sourceRefs": [
      { "sourceName": "...", "pageOrSection": "...", "tier": 1, "confidence": "high" }
    ]
  }
}
```

## Source rules

Use real, checkable sources only. Prefer:

- Primary or traditional textual sources where the claim is textual.
- Government or official panchang references where the claim is calendar/date
  related.
- Reputable published references for day-by-day Navadurga worship if a primary
  text does not give the exact modern practice wording.

Do not invent chapter names, verse ranges, page numbers, rituals, regional
customs, or citations. If a specific field cannot be sourced, output:

```json
{
  "verdict": "unverifiable",
  "note": "What was checked and why it could not be confirmed."
}
```

## Translation rules

Write English first, then translate only that English into Hindi and Punjabi.
Hindi must be Devanagari. Punjabi must be Gurmukhi.

Do not add new claims in Hindi/Punjabi that are absent from English. Do not drop
qualifiers, uncertainty, or source limitations.

## Guardrails

- Do not touch Gupt Navratri.
- Do not touch Sharad Navratri.
- Do not touch Diwali, Paryushana, Ganeshotsav, Chhath, or any other series.
- Do not promote `launch_status`.
- Do not update database rows.
- Return the JSON output and a short summary listing any unverifiable fields.
