# Task: Portraits, Hindi gap-fill, and depth expansion for all 98 Panchatantra stories

Supersedes an earlier, incorrectly-scoped version of this prompt that only covered 7 stories —
that was based on an incomplete read of the source file (it missed a second array holding the
other 91). The real scope is **98 stories**, split across two exports in
`src/lib/katha-library.ts`: `PANCHATANTRA_STORIES` (7) and `MORE_PANCHATANTRA_STORIES` (91),
both spread into the live app catalog identically — there is no meaningful difference between
the two arrays from a content standpoint, they're just historical.

Current state, audited directly against the live file:

| | count | portrait set | bodyHi set | avg body words |
|---|---|---|---|---|
| Panchatantra (all) | 98 | **0/98** | 63/98 | 184 (range 63–333) |
| Heroes of Bharat (reference) | 8 | 8/8 | 8/8 | 410 (range 375–458) |

Full current content for all 98 — id, title, titleHi, preview, body, bodyHi, phal, phalHi,
durationMin, tags — is in `panchatantra-full-export.json` (same folder). Read it before
starting; every instruction below assumes you have each story's existing text in front of you.

## The most important rule: work from each story's OWN existing text, not an external version

Several of these 98 stories carry distinctive character names — "Mister Duly," "Slow the
Weaver," "Spot," "Flop-Ear and Dusty," "Godly and June" — that come from a specific published
English translation tradition (Arthur W. Ryder's 1925 Panchatantra translation uses exactly this
naming style), not generic "classical Sanskrit" retellings. Other entries use more literal
animal names (lion, jackal, crow). **Do not substitute a different version's names, plot
details, or character count for what's already written in that entry's own `body`.** If an
entry already names a character "Mister Duly," your expanded version keeps that name — it does
not become "the wise merchant's son" or revert to a generic retelling. Treat each entry's
existing `body` as the authoritative version of that story; you are expanding it, not
re-sourcing it.

This is the same closed-book discipline as the Dharm Veer corrections pass, applied to
expansion rather than correction: add narrative detail (setting, sensory detail, dialogue)
without changing who does what, changing the resolution, or introducing a character/place/event
that isn't already implied by the existing text.

## Task 1 — Portraits (all 98, single emoji each)

Every entry needs a `portrait` emoji representing its central character or image, matching the
style already used in `HEROES_KATHAS` (e.g. `hero-mirabai: "🪷"`, `hero-maharana-pratap: "🏹"`)
— specific to that story, not a generic book/scroll icon. For animal-fable entries this is
usually straightforward (rabbit, crow, jackal); for the Ryder-named entries, use the emoji that
fits the character's actual role in the story (e.g. a stag antler for a mistaken-identity deer
story, a loom for a weaver character).

## Task 2 — Fill in the 35 missing `bodyHi` entries

35 of the 98 entries have no Hindi body at all (full list derivable from
`panchatantra-full-export.json` — any row where `"bodyHi": null`). Write a faithful Hindi
translation of that entry's **existing** English `body` (or the depth-expanded version from
Task 3, if you're doing both in one pass — translate the final English, not an intermediate
draft). Devanagari, natural Hindi prose, not a word-for-word gloss — same standard as the 63
entries that already have it.

## Task 3 — Depth expansion (all 98, target ~350–450 words / 6 paragraphs)

Bring each story toward Heroes of Bharat's depth. This varies by starting point — some entries
are already close (max is 333 words), most need real expansion (min is 63 words). Add narrative
detail, dialogue, and scene-setting; do not add plot, characters, or a different moral. Update
the matching `bodyHi` to stay faithful to the new English (whether newly written for Task 2 or
re-expanded for an entry that already had one).

- Do not touch `phal`/`phalHi` unless the current one is factually inconsistent with the
  (unchanged) plot.
- `durationMin` may need a small upward adjustment if reading time meaningfully increases —
  include the new value only where it changes.
- Leave `title`, `titleHi`, `preview`, `previewHi`, `tags` alone.

## Output format

Produce `panchatantra-full-content-output.json`, a flat array, one object per story, every
field you touched:

```json
{
  "id": "panchatantra-mister-duly",
  "portrait": "📖",
  "body": ["paragraph 1...", "...", "paragraph 6..."],
  "bodyHi": ["पैराग्राफ 1...", "...", "पैराग्राफ 6..."],
  "durationMin": 6
}
```

Include only the fields you actually changed for each entry (every entry gets `portrait`; not
every entry needs a `durationMin` change).

## Not in scope for this pass

- `titlePa`/`bodyPa` (Punjabi) — Heroes of Bharat is also at 0/8 on this; it's a separate,
  app-wide gap.
- `relatedJapaMantra` / `relatedPathshalaId` — leave as-is.
- Adding new stories beyond these 98.

## Given the scale, work and report in batches

98 stories with full depth expansion and translation is a large pass. Report progress in
batches of ~20 (which ids are done) rather than going silent until all 98 are finished, so this
can be checked in as you go rather than reviewed as one massive diff at the end. For each batch,
flag any story where you were genuinely unsure what counts as "already implied by the existing
text" rather than guessing and moving on.
