# Native App Marketing Gateway

**Date:** 2026-09-11
**Session context:** Establishing Shoonaya.com as a premium multi-page website and gateway to the native app
**Category:** architecture

## What we decided

Shoonaya.com uses a shared Next.js marketing shell with a configurable Notch Navbar, public
feature and tradition pages, community storytelling, trust/source pages, and an Android beta
gateway. The native app is the canonical product experience; the website is its public doorway.

## Why

The previous root was a large standalone HTML document with its own visual system and client
scripts. It could not reuse React navigation or scale cleanly into a coherent multi-page website.
A route-group architecture makes navigation, metadata, accessibility, design tokens and product
status consistent while keeping rich editorial content fast and indexable.

## Constraints this creates

- Marketing routes live in the `(marketing)` route group and share one shell.
- Feature marketing paths use `/features/*` to avoid colliding with legacy application routes.
- `/` remains the public website even when an authentication cookie exists.
- Marketing imagery is separate from HTML copy and real product UI.
- The public site may describe verified product capabilities but may not fabricate screenshots,
  availability, community scale or religious authority.
- Existing PWA/browser routes remain transitional until retired through an explicit migration.

## What we explicitly rejected

- Continuing to serve `public/landing.html` through a root route handler.
- Recreating the React Notch Navbar in standalone HTML.
- Treating visual weight as permission for large unoptimised assets or autoplay effects.

---
