---
name: journal-essay-integrity
description: >-
  Procedure for drafting or correcting a Sanctuary Journal essay (src/config/journal-*.ts and
  the inline essays in src/config/journal.ts) without inventing physics, medicine, or citations.
  Use whenever writing a new journal essay, editing an existing one, or auditing one for
  overclaiming. Pairs with shoonaya-journal-essay-writer (drafts/fixes) and
  shoonaya-pramana-content-reviewer / shoonaya-ritual-practice-reviewer (review before publish).
---

# Journal Essay Content & Citation Integrity

Origin: 2026-11-25/26. `journal-surya-arghya.ts` told readers to gaze at the solar disc through
the Arghya water stream and claimed the droplets filter UV and "preserve ophthalmic health" --
false, and a real solar-retinopathy risk since the injury is often painless at the time.
`journal-chhath-puja.ts` had the identical defect, cross-linked to it by `relatedSlugs`. A sweep
of all 32 journal essays found 10 more with the same shape of problem at lower severity: a
traditional/scriptural belief restated by Shoonaya's own narrative voice as an unqualified
modern scientific or medical fact, backed by vague or outright invented citations ("BMJ Rhythm
Studies", "Current Biology (Human Circalunar Rhythms Research)" -- neither is a real
publication). Two of those ten risked something specific: a Rudraksha paragraph claiming it
"stabilizes blood pressure and still erratic heart-rate rhythms", and a Hanuman Chalisa section
titled "The Medical and Psychological Verses" offering recitation as the remedy for panic attacks
and sleep paralysis -- both could read as a reason to skip real treatment.

## 1. Default to the Shastra. Modern science is optional, never required.

Vedic/Dharmic practice does not need invented physics to be sacred or worth doing. A ritual,
mantra, or observance is fully justified by what the Purana, Upanishad, Smriti, or Agama actually
says, by its devotional and psychological meaning, and by its lineage. Write that first, in the
tradition's own terms, clearly attributed ("the Markandeya Purana declares...", "in Vedic
psychology, Chandra governs Manas...").

Do not reach for a scientific-sounding mechanism to make a devotional claim feel more credible.
"Water molecules possess liquid crystalline properties capable of imprinting... the vibrational
frequency of the sacred Gotra" is not more respectful of Pitru Paksha than plainly saying water is
held, in Agamic understanding, to carry the practitioner's intention -- it is less honest, and it
is the kind of sentence that doesn't survive a reader who knows what "liquid crystalline" actually
means.

## 2. If you invoke modern science, it must be real, specific, and checked -- not remembered

A claim that borrows the voice of science ("studies show", "modern chronobiology confirms",
"electromagnetic properties", any specific percentage or Hz value) is a factual claim a reader can
check, exactly like a scriptural citation. It gets the same bar:

- **Search before you write.** Use WebSearch/WebFetch to confirm the claim and find the real
  source -- author, year, journal, and (where findable) volume/issue/pages. Do not cite from
  training-data memory alone, even for something that feels well known; this session's citations
  were only safe to write after verification turned up that one remembered figure (digestion
  consumes "30-40% of daily energy") was wrong by a factor of 3-4x (real: ~5-15%, the thermic
  effect of food), and that another (the "lunar effect" on ER visits/psychiatric admissions) is
  the opposite of the actual scientific consensus (the dominant finding, from a 37-study
  meta-analysis, is null).
- **If you can't verify a citation, remove the claim -- never invent a plausible-sounding
  replacement.** A specific, real, boring citation is always better than a vague evocative one.
  "Cell; Nature Neuroscience" with no author, year, or title is not a citation, it's a costume.
- **Prefer a verified specific number over a vague one.** Once a fact is actually checked, state
  it precisely with its source (`Westerterp KR. Diet induced thermogenesis. Nutrition &
  Metabolism. 2004;1:5.`) rather than retreating to "a significant portion" -- vagueness is only
  the right call when you genuinely couldn't verify a number, not a style preference.
- **Keep the citation honest about what it actually found.** A real paper studying prayer/mantra
  breathing rhythms (Bernardi et al., BMJ 2001) supports a claim about breathing and heart-rate
  variability during chanting. It does not support a claim about Rudraksha seeds specifically --
  don't let a real citation drift to cover more than it actually measured.
- **Say when the science is contested, not settled.** If there are small or non-replicated
  findings alongside a null consensus (the lunar-sleep literature is the example that triggered
  this rule), report both honestly rather than picking the more interesting one.

## 3. Never let a citation imply science "proves" the ritual

A real citation earns its place by being accurate and relevant, not by sounding like it validates
the devotional practice. "Rhythmic mantra recitation measurably increases heart-rate variability
(Bernardi 2001)" is an honest, separate fact placed next to the devotional meaning of Japa -- it
is not evidence that the Meru bead rule is correct, or that 108 repetitions is the right number.
Keep the devotional claim and the scientific claim clearly separate sentences; don't let one
borrow the other's authority.

## 4. Anything a reader could physically act on needs the safety read

Before publishing, read every instruction in `practiceGuidance.steps` and every sentence
describing a physical action, and ask: if a reader did exactly this, literally, could it hurt
them?

- **Looking toward the sun, a flame, or any bright light "safely"** -- no winnow basket, water
  stream, cloth, or angle makes this safe. If an essay describes gazing in the sun's direction,
  the gaze must be explicitly on the water/object/horizon, never the solar disc, and this needs
  saying plainly, not just implying.
- **Ingestion, fasting duration, or substances** (herbs, copper/metal-infused water, ash) --
  never claim medical safety, detoxification, or absence of risk for people with existing
  conditions, pregnancy, children, or the elderly as a blanket fact. "Should be observed only by
  healthy individuals without severe medical frailties" (the existing Nirjala Vrata caveat in
  `journal-fasting-science.ts`) is the pattern to match.
- **Fire/flame handling** -- don't claim indoor combustion is risk-free or air-purifying; real
  flames do produce some particulate smoke, which is a ventilation consideration, not a benefit
  to overclaim away.
- **Any claim of curing, preventing, or treating a named disease, panic attacks, sleep paralysis,
  or another real condition** -- reframe as devotional comfort and explicitly say this is not a
  substitute for a doctor or mental-health professional. See the Hanuman Chalisa fix for the
  pattern: name the real practice (reciting for comfort during illness/distress), keep the
  devotional meaning, and add the "alongside -- never instead of -- medical care" line wherever a
  reasonable reader could otherwise think the verse is the treatment.

## 5. Write the correction in the essay's own voice, not as a visible erratum

For a genuine safety pull (the eye-gazing class above), it's right to tell the reader directly
that a specific claim was wrong and has been removed -- that transparency has independent value
when the earlier version was live and unsafe. For an ordinary accuracy fix (a wrong statistic, an
invented "electromagnetic" mechanism, an overclaimed citation), just write the corrected sentence
in the essay's normal devotional register. Don't leave "this essay previously claimed X" scaffolding
in finished public-facing prose where the correction itself isn't the thing worth telling the
reader -- that belongs in the commit message and the content-review doc, not the essay body.

## 6. Provenance and review

- Record what was checked and how in a `docs/content-reviews/*.md` entry (see
  `surya-arghya-eye-safety-pulled-2026-11-25.md` for the shape): what was wrong, what changed, and
  which citations are now backed by what source.
- This agent's/skill's own correction is not the "named, dated human check" `JournalEssay.editorialReview`
  requires. Do not set or leave `publicationStatus: "published"` with `sourcesVerified: true`
  implying a human reviewed it if a person hasn't. Flag the file for `shoonaya-pramana-content-reviewer`
  (source correctness, tradition boundaries) and `shoonaya-ritual-practice-reviewer` (practice
  sequencing, safety), and for the founder's own sign-off before the essay is treated as reviewed.
  A `reviewerName` of a generic label ("Shoonaya Astrometry & Dharmic Research Council") is not a
  named human reviewer, however the type's string check is satisfied -- see
  `docs/content-reviews/surya-arghya-eye-safety-pulled-2026-11-25.md` section "The review-gate gap
  itself" for why this matters.

## 7. Sweep the class, not just the instance

A defect found in one essay (a specific false claim, a specific fabricated citation shape) almost
certainly exists in others published the same way. Grep the rest of `src/config/journal*.ts` for
the same pattern before calling the fix done, and report the sweep -- this is what turned one
flagged essay (Surya Arghya) into the two genuinely urgent fixes (plus Chhath Puja) and the ten
lower-severity ones this skill exists because of.
