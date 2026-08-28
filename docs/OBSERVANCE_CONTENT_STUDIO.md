# Observance Content Studio

## Ownership

The backend owns festival and vrat story content. PWA and Native consume the
same `PublishedObservanceStory` contract. Native's generated contract must stay
byte-identical to `contracts/observance-story-contract.ts`.

## Editorial lifecycle

1. Add source excerpts with a URL, exact citation, source tier, and rights status.
2. A human approves the source. Unapproved sources are never sent to AI.
3. Sarvam generates a `draft` in English, Hindi, and Punjabi from approved
   excerpts only. The provider cannot publish.
4. A reviewer checks every historical claim, ritual, verse, translation, and
   share template, then approves the draft.
5. Reviewed artwork is attached by URL with dimensions, crop focal point,
   localized alt text, generation metadata, and cultural-review notes.
6. Publication fails unless all three translations, an approved source, card
   artwork, and a neutral share template are approved.
7. Published stories appear through `/api/calendar/upcoming` and
   `/api/native/home-summary`. Missing or incomplete content is withheld.

## Artwork policy

No image-generation provider is wired by this change. Artwork is a reviewed
editorial upload. Do not imply that Sarvam text inference generates images.
Store generation prompt/provider metadata when externally generated art is
uploaded, and never publish unreviewed religious depictions.

## Deployment order

1. Apply `20260828010000_create_observance_content_studio.sql` to a Supabase
   branch/shadow environment.
2. Regenerate database types after the migration exists in that environment.
3. Run the contract parity script, backend tests/typecheck/build, and Native
   tests/typecheck/build.
4. Apply to production only after independent schema/RLS review.
5. Seed and review sources and content. Empty tables are safe: both clients
   simply render no canonical story cards.

The rollback is in `supabase/rollbacks/`, not the forward migration directory.
