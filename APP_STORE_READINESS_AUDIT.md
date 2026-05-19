# App Store Readiness Audit

Last updated: 2026-05-19

## Status

This app is not store-ready yet. The main blockers are entitlement truth, permission timing consistency, content/source trust clarity, and incomplete launch notes for review teams.

## Blockers

### 1. Entitlements / billing

- Current Pro flow is still early-access oriented, not store-billing oriented.
- `profiles.is_pro` exists, but there is no production subscription provider, no webhook truth path, no restore purchase flow, and no manage subscription path.
- A direct early-access activation endpoint exists and must not be used as production billing.

Required before App Store / Play review:
- server-side entitlement truth
- subscription restore flow
- manage/cancel guidance
- localized pricing/renewal copy
- reviewer notes explaining which surfaces are paid

### 2. Permission timing

- Notification prompts are reasonably contextual from the bell sheet.
- Location permission is still requested directly from onboarding and discovery actions, but the wording is not yet standardized.
- Microphone permission is contextual in recitation/audio flows, which is acceptable, but reviewer-facing explanation is not documented.
- Camera/photo usage is still implicit through file pickers and avatar/cover flows; explicit store copy should mention profile images and family/place memories.

### 3. Spiritual/content trust

- Panchang is still guidance-grade, not priest-grade. Product copy must stay restrained.
- Pathshala has a source policy, but launch scope must explicitly state which corpora are fully in-app and which remain companion-only.
- Multi-tradition parity is not strong enough for broad “all traditions fully supported” marketing.

### 4. Moderation and safety

- Admin moderation exists.
- User-facing report/block/mute/hide should be verified route by route and documented for reviewers.
- Support contact path must be obvious and staffed.

### 5. PWA / install / offline claims

- Installability exists in the web shell.
- Offline support is not yet strong enough for broad claim language.
- Store-facing copy must avoid claiming robust offline functionality until service-worker coverage is validated.

## Reviewer Prep Needed

- demo account / test path
- explanation of spiritual-data handling
- explanation of notifications use cases
- explanation of microphone use in recitation flows
- explanation of location use in Tirtha / Mandali discovery
- explanation of paid surfaces and restore path

## Recommended launch posture

- Treat current distribution as beta / testflight / internal until entitlements and permission notes are complete.
- Keep the free tier broad and credible.
- Do not submit with the current early-access Pro activation path enabled as if it were billing.
