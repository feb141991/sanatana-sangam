# Task: Fix 28 flagged Dharm Veer Hindi/Punjabi translations (correction pass, not a full redo)

You previously translated 76 Dharm Veer biography rows from English into Hindi (Devanagari)
and Punjabi (Gurmukhi). A manual audit compared every Hindi/Punjabi field against its English
source sentence-by-sentence. **48 of the 76 rows were fully faithful and need no changes.**
The other **28 rows have specific fields with fabricated content** — names, places, numbers,
or events that appear in the Hindi/Punjabi but do NOT appear anywhere in the approved English
source, or (in a few cases) an entire field replaced with a different quote/statement instead
of an actual translation.

This is a narrow correction pass. **Only touch the exact `slug` + `field` + `language`
combinations listed in `dharm-veer-translation-corrections-needed.json`.** Do not regenerate
any field not listed there, and do not touch any of the 48 clean slugs at all.

## The core rule (why this happened)

The most common failure pattern: for very famous figures (Krishna, Rama, Buddha, Guru Gobind
Singh), you appear to have drawn on general/independent knowledge about them — real facts, but
NOT present in the specific English paragraph you were given — and inserted those facts into
the translation. For example, the English `journey` for `sri-krishna` only says he was raised
in "Vrindavan" with no antagonist named; the Hindi output added "raised in Gokul" (a different
place), named "Kansa" as the antagonist, and added "built Dwarka" — none of which are in that
English text, even though they're true of Krishna in general tradition.

**This is a closed-book translation task.** For every field, translate ONLY the exact words,
names, numbers, places, and events present in the given English sentence. Do NOT add:
- A name (person, place, deity epithet) not in the English, even if you know it's the
  traditionally correct one.
- A number (age, year, duration, count) not in the English.
- An event or claim not described in the English.
- A quotation, mantra, or verse that is not a translation of the given text (some fields were
  replaced with a totally different — sometimes real — quote instead of being translated).

And do NOT drop content that IS in the English, even if the resulting Hindi/Punjabi reads more
smoothly without it. If the English field says "no source material is available," the correct
translation is a faithful rendering of THAT sentence — not an invented biography.

## Input file

`dharm-veer-english-export.json` (in this same folder) has the original approved English for
all 76 rows, in case you need full row context beyond what's inlined below.

## What to fix

`dharm-veer-translation-corrections-needed.json` (in this same folder) is a JSON array of 28
objects, one per problem slug, shaped like:

```json
{
  "slug": "sri-krishna",
  "name": "...",
  "tradition": "hindu",
  "severity_tier": "A",
  "fields_to_regenerate": [
    {
      "field": "journey",
      "languages_to_fix": ["hi", "pa"],
      "issue": "<description of exactly what was fabricated/dropped>",
      "english_source": "<the approved English text for this field>",
      "current_hindi_wrong": "<the current, incorrect Hindi -- for reference only, do not reuse>",
      "current_punjabi_wrong": "<the current, incorrect Punjabi -- for reference only, do not reuse>"
    }
  ]
}
```

`severity_tier`: `A` = severe (wholesale fabrication or a substituted quote), `B` = moderate
(a single fabricated name/place/number), `C` = minor (a factually-true but unauthorized
addition). Fix all three tiers unless told otherwise — but if you want to triage, A and B are
the priority.

For each entry, regenerate ONLY the `field` + `languages_to_fix` listed — e.g. if only
`"languages_to_fix": ["pa"]` is given, the Hindi for that field is already correct; leave it
alone and only replace the Punjabi.

## Output format

Produce a new JSON file, `dharm-veer-corrections-output.json`, as a flat array where each
element has just:

```json
{
  "slug": "sri-krishna",
  "field": "journey",
  "hi": "<corrected Hindi, only if hi was in languages_to_fix>",
  "pa": "<corrected Punjabi, only if pa was in languages_to_fix>"
}
```

One element per `{slug, field}` pair that had at least one language to fix (so up to 28 slugs
× however many fields each needed — do not emit an element for a language you weren't asked to
fix).

## Quality bar (same as before)

- Detailed, natural Hindi/Punjabi — not a stub, not a word-for-word gloss. Match the length and
  depth of the English field.
- No summaries, no omissions, no external embellishment — translate exactly what's given,
  nothing more, nothing less.
- Devanagari for Hindi, Gurmukhi for Punjabi.

When done, report how many of the 28 slugs / how many field+language corrections you produced,
and flag any case where you were unsure whether a detail was "in the English" or not, rather
than guessing.
