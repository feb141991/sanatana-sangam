# Marketing Feature Routing — Public Detail Pages, Then Native Beta

**Date:** 2026-09-11
**Session context:** Replacing the PWA-promoting landing page with a premium website that serves as the gateway to the native app
**Category:** decision

## What we decided

Public feature cards link to indexable marketing detail pages under `/features/*`.
Conversion actions lead to `/beta/android`, not `/signup`, `/login`, or protected browser-app routes.
Account creation and sign-in are native-app experiences going forward.

## Why

Shoonaya.com is now the public brand, education and acquisition surface. Visitors should be able
to understand each feature without entering the legacy browser application, while the final
conversion journey remains honest about current Android beta availability.

## Constraints this creates

- Public navigation must not promote the PWA or Add to Home Screen.
- Marketing cards must not link directly to authenticated browser routes.
- The Android beta page fails closed until `NEXT_PUBLIC_ANDROID_BETA_URL` contains a verified URL.
- App Store and Google Play badges appear only when their real destinations are published.
- OAuth callbacks, recovery routes and existing browser access may remain during transition, but
  are infrastructure or legacy access—not the public product proposition.

## What we explicitly rejected

- Sending marketing visitors to `/signup` as though Shoonaya were still a browser product.
- Publishing placeholder store links or implying native availability before verification.
- Using one long landing page as the only public explanation of the product.

---
