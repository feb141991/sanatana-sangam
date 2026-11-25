# Flag to Founder: Surya Arghya Essay Pulled for an Eye-Safety Defect

**Date:** 2026-11-25
**Raised by:** Independent review of a SEO/content audit report, cross-checked against source (Claude Code agent)
**File:** `src/config/journal-surya-arghya.ts`
**Action taken:** `publicationStatus` flipped from `"published"` to `"pending_review"`. Still on branch `feature/sacred-samagri`, uncommitted — not yet deployed.

## What was wrong

The published essay ("Surya Arghya: The Sacred Science of Offering Water to the Morning Sun") instructed readers to:
- raise the water vessel "so the water stream flows between you and the solar disc,"
- "gaze softly at the refracted solar rays" while pouring,

and asserted as fact that the water droplets form a "natural celestial diffraction grating" that "filters out harsh ultraviolet exposure," and that this "preserves ophthalmic health... and maintains razor-sharp vision."

None of that is true. Water droplets do not reduce solar brightness or UV/IR exposure to a safe level. Looking toward the sun — directly, through water, through mist, through sunglasses, through anything short of a certified solar filter — risks solar retinopathy: real, sometimes permanent retinal damage that is often painless at the time, so a person doing exactly what the essay described would have no warning signal. This was live, user-facing content (`publicationStatus: "published"`), gated only by `isPublishableJournalEssay` checking that `reviewerName` is a non-empty string and `sourcesVerified === true` — not by any actual verification that the claim is safe.

## What was fixed

In the same file, the eye-gazing instruction and the UV/safety claim were removed from:
- `keyTakeaways[1]` ("The Optical Prism Effect")
- Section 2 body ("The Optical Physics of Cascading Water Droplets") — rewritten to describe the visual effect in the water itself, state plainly that the earlier claim was wrong, and attribute the Markandeya Purana's eye-health praise as a traditional scriptural claim, not a medical one
- `practiceGuidance` step 4 — now explicitly says to keep the gaze on the water or the horizon, never on the sun

The devotional/liturgical content (Gayatri Mantra, Mandeha Vajra narrative, Rigveda/Taittiriya Aranyaka quotes) and the legitimate circadian-biology material (ipRGC/melatonin science, which doesn't require looking at the sun's disc) were left in place.

## Still needs the founder's decision

1. **Re-review before republishing.** This correction was made by an AI agent, not a named human reviewer. Per `JournalEssay`'s own contract ("Publication requires a named, dated human check of the text and its sources"), it should not go back to `publicationStatus: "published"` until someone with the authority used in `docs/reviews/RATIFICATION_PT_PRINCE_20261031.md` actually reads and signs off on the corrected text.
2. **Deploy path.** This file is uncommitted on `feature/sacred-samagri`, which also carries unrelated in-progress changes (`src/lib/panchang.ts`, the AI chat route, katha/stotram pages, etc.) that were not touched or reviewed as part of this fix. Taking the corrected (or even just pulled) version live needs its own commit and a deploy decision — this file's current state only removes the claim from the source, not from whatever is already deployed to production.
3. **Same defect, other essays?** This was found via a single flagged essay. Nobody has swept the other ~35+ journal essays for the same shape of claim (a devotional/traditional belief rewritten as an unqualified modern safety or medical claim). Worth a scoped pass before calling this closed.
4. **The review-gate gap itself.** Separately from this one essay: 23 of ~39 `reviewerName` values repo-wide are `"Shoonaya Astrometry & Dharmic Research Council"` and 16 are `"Shoonaya Editorial Council"` — generic labels, not named humans — yet they satisfy the publish gate's only check (`Boolean(review?.reviewerName.trim())`). Only one essay (`"Pt. Prince Sharma"`) has a real named reviewer matching the ratification-doc pattern this repo otherwise uses. That gate issue is not fixed by this change and is a founder-level call on process, not a code fix someone should make unilaterally.
