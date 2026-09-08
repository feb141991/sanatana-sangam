# Task: Round 2 — fix 17 remaining Dharm Veer translation issues (a different defect type)

## Context

You (or a prior pass) already fixed the first round of 28 flagged rows — the invented
names/places/numbers (fake antagonists, fake ages, fake events) are confirmed gone. An
independent re-audit of all 76 rows then found a SECOND, subtler defect type surviving in 17
rows, listed in `dharm-veer-round2-corrections-needed.json` (this folder). This is a smaller,
more targeted correction than round 1 — only these 17 rows, only the specific fields listed.

## The defect this time: substitution and silent drops, not invented facts

Round 1 was about facts appearing in Hindi/Punjabi that weren't in the English at all. Round 2 is
about two related but different problems:

1. **Substitution**: a `teaching` or `moral` field where the Hindi/Punjabi expresses a
   DIFFERENT claim or theme than the English sentence, rather than translating it. Example (now
   fixed, for reference): English says "Absolute surrender to the Divine will is the highest form
   of spiritual strength" (a general principle) — the broken Hindi instead said "surrender turns
   death and suffering into peaceful bliss" (a specific, different claim). Both sentences are
   individually reasonable and "sound right" for the figure, which is exactly why this is easy to
   miss — but the job is to translate the given sentence, not write a different-but-plausible one.

2. **Silent drops**: a specific word, phrase, or clause from the English is simply missing from
   the Hindi/Punjabi, especially when that word is doing real work — a hedge like "allegedly"
   (dropping it turns an unverified claim into a stated fact), a qualifier like "severed" or
   "meager" (dropping it loses the point of the detail), or a full clause/sentence at the end of a
   field.

3. **One severe case (`maitreyi`)**: this is actually a round-1-style violation that slipped
   through — the English explicitly says no moral is offered for this figure, and the
   Hindi/Punjabi invented one anyway. Treat this with the same seriousness as round 1: if the
   English says data doesn't exist, the correct translation says that, full stop — never fill the
   gap with plausible-sounding content.

## What to fix

For each of the 17 entries in `dharm-veer-round2-corrections-needed.json`, regenerate ONLY the
`field` + `languages_to_fix` listed. Each entry gives you: the exact `issue` description, the
`english_source` for that field, and the `current_hindi_wrong`/`current_punjabi_wrong` text for
reference (do not reuse it — it's there so you can see exactly what's wrong).

`severity_tier`: `A` = severe (a substitution affecting the core meaning, or the maitreyi
fabrication), `B` = moderate (one field substituted or a meaningful drop), `C` = minor (a single
dropped/softened word). Fix all three, but if triaging, A and B first.

Translate the `english_source` field faithfully and completely — every clause, every hedge word,
every qualifier. Do not add anything not present in it, and do not drop anything that is.

## Output format

Produce `dharm-veer-round2-corrections-output.json`, a flat array:

```json
{
  "slug": "maitreyi",
  "field": "moral",
  "hi": "<corrected Hindi, only if hi was in languages_to_fix>",
  "pa": "<corrected Punjabi, only if pa was in languages_to_fix>"
}
```

One element per `{slug, field}` pair (17 total, one language-pair fix each in this batch). Report
back: how many of the 17 you completed, and flag anything you were unsure how to translate rather
than guessing.
