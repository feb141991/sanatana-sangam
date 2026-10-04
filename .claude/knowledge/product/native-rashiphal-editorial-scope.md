# Native Rashiphal — Six-Graha Editorial Scope

Date: 2026-10-03
Session context: Native Rashiphal review, provenance correction, and transit-card clarity.
Category: product

## What decided

- Native shows six selected graha positions (Chandra, Guru, Shani, Mangal, Rahu, Ketu) and explicitly says the view is not a complete Navagraha reading; Surya, Budha, and Shukra are out of scope.
- The 72 planet-house strings are editorial reflections, not quotations or a source-defined classical gochara model. Native cards use neutral visual treatment; `tone` remains only as a compatibility field and is `neutral` for this path.
- House-group chips are descriptive structural tags, not a transit strength score. House 1 is Kendra + Trikona per the product owner's explicit 2026-09-29 confirmation.
- The product owner said the content had been reviewed and could be ungated, but the repository does not record a domain reviewer's name, lineage, per-entry sources, exact revision reviewed, or Vedha convention. Do not claim those missing details.
- Backend owns the REST contract. Keep the existing default `getDailyHoroscope()` behavior for the PWA unchanged; do not add PWA UI/features under the standing product direction.

## Why

The previous UI hid Rahu and Ketu, colored cards as favorable or adverse, and called the section “Transit Facts.” Those cues overstated the scope and certainty of an editorial six-graha layer. Durable provenance is needed so future edits do not turn product approval into an unsupported claim of scholarly validation.

## Constraints

- State the selected six and excluded three in user-visible scope/disclaimer text.
- Keep the Native-specific content opt-in isolated from legacy/default output.
- Do not add or describe source-defined planetary rules until the source, tradition, reference point, Vedha handling, and exact human review are recorded.
- Do not fabricate reviewer identity or source citations.

---
