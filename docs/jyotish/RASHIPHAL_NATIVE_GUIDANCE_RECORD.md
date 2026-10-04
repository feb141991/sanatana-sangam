# Native Rashiphal guidance: scope and provenance

**Status:** Native editorial reflection layer; not a source-defined classical gochara model.
**Record updated:** 2026-10-03

## What is approved and what is recorded

On 2026-09-29, the product owner confirmed that the Native Rashiphal content had been reviewed and could be ungated. The same review explicitly selected **Kendra + Trikona** for House 1. The conversation does not record a named Jyotish reviewer, sampradaya or lineage, per-entry source citations, the exact content revision reviewed, or a Vedha convention. This record preserves those limits; it does not infer or invent missing scholarly provenance.

The 72 planet-house strings are Shoonaya editorial reflections. They are not quotations, source-backed predictions, or a computed favorable/unfavorable score. Tests establish completeness, distinct wording, and safety constraints; they do not establish astrological correctness.

## Native display scope

The Native transit section shows six selected sidereal positions relative to the selected Chandra rashi:

- Chandra
- Guru
- Shani
- Mangal
- Rahu
- Ketu

Surya, Budha, and Shukra are not included in this view. The section must disclose that limit and must not be described as a complete Navagraha reading. The API retains its legacy `tone` field for DTO compatibility, but all entries on the distinct Native path use `neutral`; the mobile UI must not present the reflections as favorable/unfavorable status colors.

Kendra, Trikona, Upachaya, and Dusthana chips are structural house labels. They can overlap and are not a score of a planet's strength or the outcome of a transit. House 1 is displayed as Kendra + Trikona per the product owner's explicit 2026-09-29 decision.

## Source and rule boundary

Phaladeepika, Chapter 26, was consulted as a comparison during the implementation review. It describes a particular transit convention counted from the natal Moon and includes Vedha considerations. That comparison did not establish that the current editorial strings implement that text, and no such classical convention is claimed by this feature. No universal Jyotish rule set is selected here.

Before a future source-defined classical model is presented, its owner must record the applicable text and edition, tradition/convention, reference point, included grahas, Vedha treatment, rule mapping, and a qualified human review of the exact rendered content. Until then, keep this feature explicitly editorial and neutral.

## Repository boundary

The backend owns the Rashiphal REST response consumed by Native. This work preserves the default `getDailyHoroscope()` output used by the PWA and makes no PWA UI or new PWA feature changes. Native uses the explicit `useDistinctGuidance` route option.
