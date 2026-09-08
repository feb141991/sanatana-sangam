# Task: Author + source EN/HI/PA content for 3 new Navratri series (27 days total)

## Context

Our app already has one fully-live, source-backed multi-day series: Sharad Navratri (10 days,
in `packages/dharma-rules/src/festivals/series-content.json` under `definitionKey:
"sharad-navratri"` -- read that as your quality, depth, and format reference before writing
anything). We've just added the structural scaffolding (dates, slugs, sequence) for three more
Navratri observances that previously existed only as single-day rule stubs:

1. **Chaitra Navratri** (9 days, Chaitra Shukla Pratipada → Navami/Ram Navami) -- the spring
   Navratri. Same Navadurga deity sequence as Sharad Navratri (Shailaputri → Siddhidatri), just a
   different lunar month.
2. **Ashadha Gupt Navratri** (9 days, Ashadha month) -- a quieter, tantra-associated Devi sadhana
   period.
3. **Magha Gupt Navratri** (9 days, Magha month) -- same tradition as above, different month.

`navratri-series-content-export.json` (this folder) lists all 27 child days across the 3 series
with their slugs and sequence numbers. For Chaitra, the deity for each day is already fixed
(matches Sharad Navratri's Navadurga order exactly -- given in the export as `deityForm`). For
both Gupt Navratris, `deityForm` is `null` for every day -- **this is the first thing you need to
resolve, and it is a real open question, not an oversight.**

## The core rule (same as every other content task here): real sources or an honest "unverifiable"

This app has a hard rule against ever presenting fabricated content as real: no invented facts, no
invented scripture/citation, no invented page or verse number, no presenting one tradition's
reading as universal without saying so. For every piece of content you produce:

- If you can point to a genuine, checkable source (a named Purana with chapter/section, a
  recognized published Panchang, a reputable scholarly reference on Hindu festivals), cite it:
  `{ "sourceName": "...", "pageOrSection": "...", "tier": 1|2|3, "confidence": "high"|"medium" }`.
- If you cannot find a genuine source for a specific claim, do not invent one -- mark that field
  `"verdict": "unverifiable"` and leave it out rather than guess. An honest gap is fine; a
  plausible-sounding fabricated citation is not.
- If a claim is genuinely disputed or sampradaya-dependent (this is very likely for the Gupt
  Navratri Mahavidya sequence -- some traditions assign one Mahavidya per day across 9 days with
  one day covering two, others read the sequence differently, and some texts frame it as parallel
  to rather than identical with the Navadurga forms), **say so explicitly** rather than picking one
  reading and presenting it as settled. Name which tradition/text a given reading comes from.

## Part 1: Chaitra Navratri (9 days) -- content authoring, deity sequence already fixed

For each of the 9 days (deity given in the export), produce:
- `canonicalTitle` (EN/HI/PA) -- e.g. "Chaitra Navratri Day 1 — Shailaputri"
- `deityOrTheme` (EN/HI/PA) -- e.g. "Maa Shailaputri"
- `rituals` (EN/HI/PA, as a list) -- specific rituals for that day, if any are established beyond
  the general daily Navaratra puja (day 1 = Ghatasthapana, as in Sharad Navratri)
- `significance` (EN/HI/PA) -- 1-2 sentences on the day's meaning, matching Sharad Navratri's
  register and length exactly

Day 9 is also **Ram Navami** -- note this connection in the day's significance, but do not
duplicate content from our existing separate `ram-navami` rule; keep this day's content focused on
its place within the Navratri sequence (Siddhidatri, the culmination), with Ram Navami mentioned as
context.

## Part 2: Gupt Navratri x2 (9 days each) -- research the day-mapping first, then author

Before writing any per-day content, research and report: what is the most widely-attested mapping
of the 10 Mahavidyas onto Gupt Navratri's 9 days? Cite your source(s). If multiple traditions exist,
document the most common/mainstream one as the primary reading and note the variant(s) exist, rather
than silently picking one. Then, using that resolved mapping, produce the same four fields
(canonicalTitle, deityOrTheme, rituals, significance, all EN/HI/PA) for each of the 9 days in BOTH
the Ashadha and Magha series (content can be identical between the two since it's the same
tradition in a different month -- only the month name in canonicalTitle should differ).

If you cannot find a source-backed mapping at all, say so plainly rather than inventing one --
report back "no reliable source found for the day-by-day Mahavidya sequence" and leave those fields
unauthored. That is a legitimate, expected outcome, not a failure.

## Translation quality (once EN content is drafted)

Closed-book: translate only what the EN field you just wrote actually says. Devanagari for Hindi,
Gurmukhi for Punjabi. Match Sharad Navratri's tone and detail level -- not a stub, not padded.

## Output format

Produce `navratri-series-content-output.json`, an array with one entry per {series, day}:

```json
{
  "definitionKey": "chaitra-navratri",
  "slug": "chaitra-navratri-day-1-shailaputri",
  "canonicalTitle": { "en": "...", "hi": "...", "pa": "..." },
  "deityOrTheme": { "en": "...", "hi": "...", "pa": "...", "verdict": "sourced", "sourceRefs": [...] },
  "rituals": { "en": [...], "hi": [...], "pa": [...], "verdict": "sourced", "sourceRefs": [...] },
  "significance": { "en": "...", "hi": "...", "pa": "...", "verdict": "sourced", "sourceRefs": [...] }
}
```

Any field you couldn't source: omit the language values, set `"verdict": "unverifiable"`, and add a
`"note"` explaining what you tried. Report back separately (in your own summary, not the JSON): what
you found for the Gupt Navratri Mahavidya-mapping question specifically, since that determines
whether these two series can even be reviewed as-is or need a human/editorial decision first.
