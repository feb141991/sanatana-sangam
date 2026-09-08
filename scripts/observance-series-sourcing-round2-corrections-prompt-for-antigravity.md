# Task: Round 2 — fix 10 flagged citations in the Navratri/Diwali sourcing pass

## Context

You (or a prior pass) verified 52 fields of Navratri/Diwali content and returned "sourced" for
all 52. An independent re-audit, using web search to check the actual cited texts, confirmed most
of that work is solid (21 citations strongly corroborated, including all the Devi Kavacham verse
attributions) — but found 8 confirmed citation errors and 2 more worth double-checking, listed in
`observance-series-sourcing-round2-corrections-needed.json` (this folder). This is a small,
targeted correction — only these 10 records.

## What went wrong

Two distinct citation errors were found, one of them systematic (repeated 4 times):

1. **Padma Purana "Chapter 124" should be "Chapter 122."** Chapter 122 of the Padma Purana's
   Uttara Khanda is independently confirmed to be titled "The Celebration of Dipavali" and to
   contain exactly the ritual content being cited (oil bath, water offerings to Yama, lamps,
   Lakshmi worship). Chapter 124 is confirmed to be about a different, unrelated topic
   (Haribodhini/Bhishmapanchaka, an Ekadashi-cycle subject). This exact wrong chapter number was
   reused across 4 different records (`naraka-chaturdashi`/rituals, `diwali`/deityOrTheme,
   `diwali`/rituals, `diwali`/significance) — almost certainly one mistake copied forward rather
   than four independent research errors. Two more records (`bhai-dooj`/deityOrTheme,
   `bhai-dooj`/significance) cite "Chapter 125" and are not confirmed wrong, but are flagged for
   a second look given the adjacent chapter's confirmed error.

2. **Devi Mahatmya chapter misattribution.** Chapter 10 of the Devi Mahatmya (Durga Saptashati)
   is the slaying of Shumbha, not Mahishasura — Mahishasura is slain earlier, in the Chapter 2-4
   narrative arc. Two `dussehra` records cite Chapter 10 for the Mahishasura connection. A related
   error appears in `navratri-day-6-katyayani`/significance, which cites Chapter 5 (also wrong —
   Chapter 5 is the later Shumbha-messenger episode) for the same Mahishasura-slaying origin
   story, plus a separate wrong verse range for a Vamana Purana citation in that same record.

3. **One unrelated error**: `navratri-day-5-skandamata`/significance cites "Skanda Purana,
   Kaumarika Khanda" — independently confirmed to be a pilgrimage/geography section about the
   Cambay confluence, unrelated to Skandamata. Likely confused by the name similarity to "Kaumara"
   (Skanda's other name).

## What to do

For each of the 10 records, either:
1. **Find and supply the correct citation** if you can verify one (the specific corrections
   needed are described in each record's `ask` field), or
2. **Report it unverifiable** if you cannot independently confirm a correct source — do not leave
   the wrong pinpoint in place, and do not replace it with a different guess you can't verify
   either. An honest "I could not confirm the correct chapter/section" is the right outcome if
   that's genuinely where you land.

Do not touch any of the other 42 records in the original file — this is a narrow fix to the 10
flagged citations only, not a re-verification of the whole set.

## Output format

Produce `observance-series-sourcing-round2-output.json`, a flat array:

```json
{
  "slug": "naraka-chaturdashi",
  "field": "rituals",
  "verdict": "corrected" | "unverifiable",
  "sourceRefs": [{ "sourceName": "...", "pageOrSection": "...", "tier": 1, "confidence": "high" }],
  "note": "..."
}
```

One element per record (10 total). Report back a summary: how many you corrected vs. reported
unverifiable, and for the `bhai-dooj` Chapter 125 records specifically, what you found either way.
