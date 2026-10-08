# Native Rashiphal guidance: scope and provenance

**Status:** Native editorial reflection layer; not a source-defined classical gochara model.
**Record updated:** 2026-10-08

## What is approved and what is recorded

On 2026-09-29, the product owner confirmed that the Native Rashiphal content had been reviewed and could be ungated. The same review explicitly selected **Kendra + Trikona** for House 1. The conversation does not record a named Jyotish reviewer, sampradaya or lineage, per-entry source citations, the exact content revision reviewed, or a Vedha convention. This record preserves those limits; it does not infer or invent missing scholarly provenance.

The source history also shows that commit `bfe2692` (2026-10-04) reworded entries in the 72-string table after that product-owner review. The surviving record cannot prove that the exact post-commit wording was re-reviewed. The 2026-09-29 statement is product-owner approval to ungate the then-reviewed Native feature; it is not evidence of a named Jyotish specialist's approval of every current sentence. Do not make that stronger claim.

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

An earlier implementation note said that Phaladeepika, Chapter 26, was consulted as a comparison. This repository record has no edition, translator, passage citation, or verification notes for that claim, so it is undocumented and must not be treated as a verified source for this feature. No universal Jyotish rule set is selected here.

Before a future source-defined classical model is presented, its owner must record the applicable text and edition, tradition/convention, reference point, included grahas, Vedha treatment, rule mapping, and a qualified human review of the exact rendered content. Until then, keep this feature explicitly editorial and neutral.

## Native REST contract boundary

The Native REST route's explicit `contract=2` response accepts Rashi keys, English names, and the Sanskrit transliterations used by saved birth charts (for example, `Makara` maps to `capricorn`). It rejects malformed or out-of-range dates and explicitly invalid timezones before doing profile/auth work. Dasha end dates are rendered in UTC so deployment-host timezone cannot change the displayed day. Requests without a contract version retain the existing v1 response for already-installed clients.

The Native response projection omits the legacy lucky color/number/time, house-derived work/relationship/practice outcomes, and sign-selected beeja-mantra fields. Native receives general life reflections and optional practice prompts that do not claim to be chart-derived or prescribe a ritual. The shared `getDailyHoroscope()` default path remains the PWA's existing output; no PWA UI or behavior is changed by this Native contract correction.

## Repository boundary

The backend owns the Rashiphal REST response consumed by Native. This work preserves the default `getDailyHoroscope()` output used by the PWA and makes no PWA UI or new PWA feature changes. Native uses the explicit `useDistinctGuidance` route option.
