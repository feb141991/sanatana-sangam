# Task: Translate 97 festival/vrat names + descriptions into Hindi and Punjabi

## Context

`SacredDaysCard` (a compact card shown on the Home screen for the next upcoming
observance) currently shows every festival/vrat name and description in English only,
regardless of the viewer's language setting. The source data
(`sacred-days-english-export.json`, in this same folder) is 97 rows, each with a
`slug`, `display_name` (e.g. "Makar Sankranti"), and `description` — a short, one-line
factual caption (e.g. "Harvest festival marking the sun's transition into Capricorn").
These descriptions average ~90 characters; the longest is ~200.

## The rule (closed-book translation, same as always)

Translate ONLY what is in the given English text. Do not add a fact, name, date, place,
or ritual detail that is not already present in the English `display_name`/`description`
pair for that row — even if you know it to be true from general knowledge of the
festival. Do not drop anything either. If the English description is generic
("Harvest festival marking..."), the Hindi/Punjabi should be an equally generic,
faithful translation — not an expanded, more detailed version invented from your own
knowledge of the festival. This is a caption for a small card, not a biography — match
its brevity and register, don't pad it.

Devanagari for Hindi, Gurmukhi for Punjabi. Use natural, commonly-recognized Hindi/Punjabi
names for well-known festivals (e.g. "मकर संक्रांति" for Makar Sankranti) rather than a
literal transliteration, since these are established festival names, not invented terms
— but the description sentence itself must still translate only what's given.

## Output format

Produce `sacred-days-corrections-output.json`, a flat array with one entry per row:

```json
{
  "slug": "makar-sankranti",
  "display_name_hi": "मकर संक्रांति",
  "display_name_pa": "ਮਕਰ ਸੰਕ੍ਰਾਂਤੀ",
  "description_hi": "...",
  "description_pa": "..."
}
```

All 97 slugs from the input file should appear in the output. Report when done: how many
rows completed, and flag any row where you were unsure of the standard/traditional
Hindi or Punjabi name for that festival rather than guessing.
