# Festival Content — Evidence Before Publication

**Date:** 2026-09-15  
**Session context:** Correcting unsupported authenticity and council-review claims in the backend-owned native festival catalogue  
**Category:** decision

## What we decided

Festival drafts may remain in the canonical backend catalogue and generated Native snapshot, but they remain `pending_source` and non-displayable until their evidence is complete. A source label, numeric-looking citation, or generic review token does not establish textual accuracy, translation accuracy, rights clearance, or council approval.

## Why

The 114-entry catalogue had 912 editorial fields marked `council_reviewed_editorial` with the same generic token, while no durable human-review record existed. Publishing those fields would turn unverified metadata into an unsupported authenticity claim. Withholding preserves the drafts for review while ensuring users do not see sacred text, translations, rituals, or sharing output as approved content prematurely.

## Constraints this creates

- The backend JSON remains the canonical source; Native receives a generated snapshot and is never edited as a second catalogue.
- `source_backed` content needs an HTTPS source, an exact page/section locator, and an explicit rights/usage state.
- `council_reviewed_editorial` content needs complete source provenance and a durable record under `docs/content-reviews/`.
- Pending or withheld fields carry neither review claims nor source-tier metadata that could be mistaken for approval.
- Rendering and sharing must both fail closed; raw stored drafts must not bypass editorial resolvers.
- Human reviewers—not engineering or automated tests—approve religious correctness.

## What we explicitly rejected

- Treating non-empty citations as proof of authenticity.
- Retaining a generic `council-verified-YYYY-MM` token as evidence of human approval.
- Expanding or polishing retired PWA story content merely to satisfy an obsolete word-count target.

---
