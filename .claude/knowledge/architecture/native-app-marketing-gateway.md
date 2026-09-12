# Native App Marketing Gateway

**Date:** 2026-09-11
**Session context:** Establishing Shoonaya.com as a premium multi-page website and gateway to the native app
**Category:** architecture

## What we decided

Shoonaya.com keeps the established standalone homepage and its full interactive content. The
root route serves `public/landing.html`; only its opening hero is replaced when the marketing
direction changes. Public feature, tradition, community, trust/source and Android beta pages
remain in the shared Next.js marketing shell. The native app is the canonical product
experience; the website is its public doorway.

## Why

The established homepage contains distinctive interactive material—including Gyan Chaupar,
tradition panels, the lineage story, festival presentation, community, the complete feature
catalogue, Kids Zone and FAQ. Reconstructing those sections lost product history and was outside
the requested hero-only scope. The exact homepage therefore remains canonical for `/`, while
new supporting pages use the route-group architecture.

## Constraints this creates

- `/` is served by `src/app/route.ts` from `public/landing.html`.
- Homepage redesigns must preserve the established body content unless replacement is explicit.
- Supporting marketing routes live in the `(marketing)` route group and share one shell.
- Feature marketing paths use `/features/*` to avoid colliding with legacy application routes.
- `/` remains the public website even when an authentication cookie exists.
- Marketing imagery is separate from HTML copy and real product UI.
- The public site may describe verified product capabilities but may not fabricate screenshots,
  availability, community scale or religious authority.
- PWA install metadata and public PWA promotion remain disabled; native beta is the public CTA.

## What we explicitly rejected

- Reconstructing or replacing established homepage sections during a hero-only request.
- Redirecting authenticated visitors away from the public root website.
- Treating visual weight as permission for large unoptimised assets or autoplay effects.

---
