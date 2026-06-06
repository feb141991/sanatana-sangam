# Feature Card Routing — Link to /signup, Not App Routes

**Date:** 2026-06-06
**Session context:** Landing page feature/platform cards clicking through to protected routes
**Category:** decision

## What we decided

Feature and platform cards on the landing page link to `/signup`, not to protected app routes
such as `/discover` or `/japa`.

## Why

Unauthenticated users who click a feature card get redirected back to landing by the auth guard —
a dead end that signals a broken product. Linking directly to `/signup` delivers the correct next
step and avoids a redirect loop.

The feature cards are aspirational, not functional entry points for anonymous visitors. Their job
is to convert interest into signup intent.

## Constraints this creates

- Landing page cards must never hardcode internal app paths (`/japa`, `/kosh`, `/discover`, etc.)
- If a card needs to deep-link post-auth (e.g., land the user on `/japa` after signup), that must
  be handled via a `?redirect=` query param on `/signup`, not a direct link
- This rule applies to all marketing surfaces (landing, blog embeds, email CTAs)

## What we explicitly rejected

- Linking to the protected route directly (auth redirect loop, poor first impression)
- Showing the feature only to signed-in users in the marketing cards (reduces aspiration signal)

---
