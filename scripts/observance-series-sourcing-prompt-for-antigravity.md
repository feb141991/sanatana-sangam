# Task: Verify/source 52 flagged fields for Navratri + Diwali series content

## Context

`ObservanceSeriesCard` shows day-by-day content for two multi-day observance series:
Sharad Navratri (10 days) and the Diwali five-day cluster. The prose for each day
(deity/theme, rituals, significance, and — for 7 of the 10 Navratri days — the
canonical title) **already exists**, in detail, in English/Hindi/Punjabi. It is not
being written for the first time. It is currently withheld from display because our
system marks every field `status: "pending_source"` until it is backed by a real,
checkable citation — this is a deliberate integrity gate (see rule below), not a bug.

`observance-series-sourcing-export.json` (in this same folder) lists the 52 specific
fields across 15 series-children that are pending. Each entry gives you the current
English value and whatever `sourceRefs` already exist for it (often empty).

## The rule — this is NOT a content-writing task

**Do not invent, paraphrase-as-fact, or "reconstruct" a citation.** Fabricating a
source, page number, or source tier is treated as seriously as fabricating the content
itself. For each flagged field, do exactly one of:

1. **Find a genuine, checkable source** that supports the existing English claim (a
   named Purana/scripture with section reference, a recognized published Panchang, a
   reputable published reference work on Hindu festivals) and report it as:
   `{ "sourceName": "...", "pageOrSection": "...", "tier": 1|2|3, "confidence": "high"|"medium" }`
   — tier 1 = primary scriptural/Panchang source, tier 2 = reputable scholarly/reference
   secondary source, tier 3 = widely-established popular knowledge with no single
   citable text (e.g. a deity epithet used near-universally in devotional practice).
2. **If you cannot find a genuine source**, say so explicitly:
   `{ "verdict": "unverifiable", "note": "..." }` — do not fill this with a guessed or
   invented reference just to produce an answer. An honest "I couldn't verify this" is
   the correct and expected outcome for some of these 52 fields, not a failure.
3. **If the existing English claim itself looks wrong** (e.g. a deity association that
   doesn't match mainstream tradition for that Navratri day), flag it separately as
   `{ "verdict": "content_looks_wrong", "note": "..." }` rather than sourcing it as-is.

Do not translate or edit the Hindi/Punjabi text in this pass — that content is not the
problem; only the missing/weak sourcing is.

## Output format

Produce `observance-series-sourcing-output.json`, a flat array:

```json
{
  "slug": "navratri-day-1-shailaputri",
  "field": "deityOrTheme",
  "verdict": "sourced" | "unverifiable" | "content_looks_wrong",
  "sourceRefs": [{ "sourceName": "...", "pageOrSection": "...", "tier": 1, "confidence": "high" }],
  "note": "..."
}
```

One element per `{slug, field}` pair from the input (52 total). When done, report a
breakdown: how many resolved to `sourced` (and at what tier), how many `unverifiable`,
how many `content_looks_wrong`. This determines which fields our editorial team can
actually promote to visible/`source_backed` status — anything `unverifiable` stays
hidden on the card, which is the correct, safe outcome, not something to work around.
