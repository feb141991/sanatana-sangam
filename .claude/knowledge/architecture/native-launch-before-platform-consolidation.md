# Native Launch Before Platform Consolidation

**Date:** 2026-09-13  
**Session context:** Planning PWA retirement, repository consolidation, and production environment separation  
**Category:** architecture

## What we decided

Shoonaya will launch and stabilise the iOS and Android applications before
retiring the remaining PWA surface or merging the platform and Native
repositories. Until the store launch succeeds, `Sanatan Sangam/Shoonaya`
continues to own the website, admin interface, API, Supabase migrations, and
shared server packages; `shoonaya-mobile` continues to own the Expo/React
Native applications.

After launch stability is established, the preferred target is one monorepo
with independently deployable public-site, admin, API, and mobile applications.
The platform API and production database remain canonical. Repository
consolidation must not turn those applications into one deployable artifact.

## Why

Store readiness, real-device behaviour, authentication, notifications, and
production API stability are the immediate release risks. Combining PWA
retirement, repository history migration, route deletion, environment changes,
and Native launch would enlarge the blast radius and make failures harder to
attribute or roll back.

A later monorepo can improve API-contract coordination and eliminate manually
duplicated domain catalogues, but that benefit is not required to prove the
first store release. The launch should therefore use the existing two-repository
boundary and defer structural consolidation until production evidence exists.

## Constraints this creates

- Do not remove authenticated web/PWA routes before Native launch and parity
  auditing are complete.
- Do not merge repository histories before the store launch is stable.
- Keep the website, admin, API, auth callbacks, legal pages, deep-link fallbacks,
  payment returns, and Supabase migrations operational during launch.
- Shared Native/platform route changes still require auditing in both
  repositories; the platform repository owns the canonical server contract.
- Before consolidation, separate development, preview, staging, and production
  services so non-production mobile builds do not use production by default.
- A future monorepo should use `apps/site`, `apps/admin`, `apps/api`, and
  `apps/mobile`, plus generated versioned contracts and offline snapshots.
- Web/API, Android, and iOS remain separate build and release artifacts even
  after repository consolidation.
- `main` should ultimately promote to staging; production should use an approved
  release tag and the same verified artifact.

## Deferred implementation sequence

1. Complete iOS and Android store launch and real-device smoke testing.
2. Observe production health and confirm API/auth/notification stability.
3. Establish isolated development, preview, staging, and production services.
4. Introduce generated, versioned Native API contracts.
5. Audit every consumer web route against its Native equivalent and required
   callback, legal, sharing, and support behaviour.
6. Retire PWA installation, offline, and browser-push remnants using a temporary
   service-worker cleanup path for previously installed clients.
7. Import both Git histories into the monorepo without losing provenance.
8. Promote the same tested commit from staging to production with explicit
   migration and release approvals.

## What we explicitly rejected

- Retiring the PWA before the Native applications launch successfully.
- A big-bang repository merge during store-release preparation.
- Deleting the public website or backend merely because the installable PWA is
  retired.
- Combining the website, API, admin portal, Android app, and iOS app into one
  production artifact.
- Maintaining automatic production deployment to both Vercel and GCP.

---
