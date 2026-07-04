# Shoonaya Native App Parity Blueprint

Last updated: 2026-07-03

## Purpose

Build a native Shoonaya mobile app with the same user-facing feature set and options as the current PWA, while keeping the existing Shoonaya backend and domain logic as the source of truth.

This is not a rewrite of Shoonaya from scratch. It is a native app program that should reuse Supabase, API contracts, shared TypeScript engines, existing content systems, notification concepts, and entitlement rules wherever possible.

Current readiness note: the standalone native repo has been located at `/Users/Business(C)/shoonaya-mobile`. Treat that repo as the native implementation source of truth. Phase 0 still needs a full screen/package/Android audit before broad feature migration.

## Architecture Rule

**Native app owns experience. Shared platform owns truth.**

- Core logic: shared TypeScript packages.
- Data: Supabase and stable API contracts.
- UI: Expo / React Native.
- Native services: thin adapters for notifications, storage, audio, microphone, location, camera, in-app purchase, and sharing.
- Provider abstractions: payments, push, WhatsApp, analytics, crash reporting, and future vendors.

Native screens must not reimplement Panchang, Pathshala, Sadhana rules, entitlement checks, notification semantics, or sacred content selection locally when a shared package or API contract already exists.

## Recommended Stack

### App Framework

- Expo + React Native + Expo Router.
- TypeScript.
- Expo Application Services for builds, submission, and OTA update strategy.

Expo is the preferred route because Shoonaya already uses TypeScript, React, Supabase JS, and portable domain packages. Flutter would force a Dart rewrite and a second domain ecosystem.

### Data and State

- Supabase Auth, Database, RLS, Realtime, Storage.
- API routes for server-computed features and protected operations.
- TanStack Query for client caching, mutations, retries, and offline-aware fetching.
- SecureStore for secrets/tokens.
- MMKV, SQLite, or AsyncStorage for non-sensitive local state depending on data shape.

### Native Services

- Push notifications: OneSignal native SDK is the current ratified direction unless Phase 0 finds a blocker.
  - Web already uses OneSignal architecture and server delivery concepts.
  - The existing native app setup must be audited before changing provider direction.
- Audio/microphone: `expo-audio` and permission-specific recording adapters.
- Video/live streams: `expo-video`.
- Image/media: `expo-image`, image picker, camera only from explicit user action.
- Location: Expo Location through contextual permission prompts.
- Sharing: native share sheets; image generation strategy decided per feature.
- Crash/error observability: Sentry or equivalent.
- OTA updates: EAS Update with release-channel discipline.

## Current Reuse Map

### Reuse Directly

- Supabase project, auth, DB, RLS, storage, and existing migrations.
- Existing API routes for AI, Jyotish, TTS, content generation, reminders, Mandali, Kul, and protected server work where contracts are stable.
- Notification architecture concepts: preference flags, dedupe keys, delivery logs, dry-run/kill-switch pattern.
- Content libraries and seed data where they are canonical.
- Existing app-store audit notes and permission timing policy.

### Reuse With Package Integration

- `@sangam/panchang-engine`: portable TypeScript package; should replace any mobile duplicate Panchang calculation.
- `@sangam/pathshala-engine`: portable enough for native reuse; React is optional peer dependency.
- `@sangam/pramana-core`, `@sangam/pramana-serve`, `@sangam/pramana-corpus`, `@sangam/pramana-eval`: reusable contracts/eval/retrieval layers where native needs only typed contracts or server API calls.

### Reuse After Adapter Work

- `@sangam/sadhana-engine`: mostly reusable, but `dexie` / IndexedDB code is not React Native-compatible. Add a storage adapter boundary and native implementation using SQLite/MMKV/AsyncStorage.

### Do Not Port

- Admin dashboards should stay web-only.
- Internal cron admin and moderation operations should remain server/web surfaces unless there is a clear mobile admin use case later.
- Deprecated Capacitor wrapper artifacts from the web repo must not be revived as the native strategy.

## Full Feature Inventory

Every PWA feature must be explicitly classified before implementation:

| Pillar | PWA Surfaces | Native Status Target |
|---|---|---|
| App shell | Home, navigation, search/discover entry, settings, profile | Native v1 core |
| Auth | Email, Google, Apple Sign-In on iOS if Google/social auth ships, onboarding redirect, account recovery | Native v1 core |
| Onboarding | tradition, language/script, location/Mandali, reminders, first practice | Native v1 core |
| Home | next practice, sacred time, digest, nudges, daily surfaces | Native v1 core |
| Japa | mala, sessions, insights, reminders, share milestones | Native v1 core |
| Nitya Karma | morning/midday/evening, AI sequence, reminders, plans | Native v1 core or Phase 2 depending complexity |
| Pathshala | browse, paths, lessons, saved, recite, insights | Native v1 core plus Phase 2 recitation |
| Panchang | today, calendar, tithi/festival context, local sacred times | Native v1 core |
| AI Chat / Dharma AI | chat surface, streamed answers, Pramana-backed sources, safety states | Audit existing native screen in Phase 0; likely Phase 1/2 hardening |
| Quiz | daily quiz, practice, stats | Existing native screen must be audited in Phase 0; likely Phase 2 hardening |
| Sadhana | challenge, journal, my-name, sankalpa | Phase 2 |
| My Progress | unified ledger, mood, shields, streaks, cross-pillar progress | Native v1/Phase 2 because it ties daily app surfaces together |
| Kul | family hub, members, tasks, events, vansh, sanskara | Primary destination per product consolidation; Phase 2 core family |
| Mandali | join, city resolution, feed, events, members, comments, invites | Contextual/community destination; Phase 2/3 after Kul priority is confirmed |
| Vichaar Sabha | feed/detail/react/report/block/moderation surfaces | Phase 3 |
| Bhakti | mala, aarti, katha, stotram, zen, browse, insights | Phase 2/3 |
| Dharma Veer | daily hero, detail, archive/content rotation | Existing native screen must be audited in Phase 0; likely Phase 2 data hardening |
| Vrat/Ekadashi | vrat detail, observe, reminders, stats | Existing native screen must be audited in Phase 0; likely Phase 2/3 hardening |
| Kosh | glossary/library exploration | Existing native screen must be audited in Phase 0; likely Phase 3 hardening |
| Discover / Mood | discover index, mood routes, content detail | Classify in Phase 0; no silent omission |
| Guest mode | guest route, preview affordances, upgrade/sign-in prompts | Classify in Phase 0; no silent omission |
| Tirtha | map, check-in, place detail, saved places, location | Phase 2/3; inventory current mobile state first |
| Kundali/Rashiphala | birth profiles, chart, rashiphal, share/claim | Phase 3 due chart and data complexity |
| Live Darshan | stream list, reports, preferences | Phase 3/4 due streaming and moderation |
| Seva | tier/check, seva surfaces | Phase 3 |
| Scoreboard | rankings, search, shruti | Phase 3 |
| Messages | inbox/conversation flows | Phase 3/4 |
| Sthapaka | registration and WhatsApp kit | likely web-first, explicitly defer unless required |
| Founding | founding member flows and WhatsApp kit | likely web-first, separate from Sthapaka until product confirms merge |
| Blessing/name-story | share pages, generated stories, OG/share cards | Phase 3/4 or native share-only subset |
| Invite/waitlist/referral | invite links, referral attribution, waitlist | Native v1 minimum invite handling |
| Premium | subscription, gates, restore, manage subscription | Isolated monetization phase |
| Legal/support | privacy, terms, account deletion, data export, contact | Required for store readiness |

## Compliance Requirements

These are not optional for native submission:

- In-app account deletion flow.
- Apple Sign-In on iOS if Google or any equivalent third-party/social login is offered.
- Privacy policy screen/link.
- Terms screen/link.
- Support/contact path.
- Data deletion and export guidance if supported on web.
- Clear permission purpose copy for notifications, location, microphone, camera/photos.
- Subscription restore and manage/cancel path if paid digital content exists.
- Reviewer notes and demo account.

Existing audits to keep aligned:

- `APP_STORE_READINESS_AUDIT.md`
- `APP_STORE_REVIEW_NOTES.md`
- `PERMISSION_TIMING_AUDIT.md`
- `SCHEMA_ALIGNMENT_AUDIT.md`
- `docs/NOTIFICATION_ARCHITECTURE_AUDIT.md`

## Data and Schema Prerequisites

Before broad native parity work:

1. Confirm `src/types/database.ts` is current with migrations.
2. Consolidate entitlement truth:
   - avoid new direct `is_pro` checks
   - use a shared entitlement resolver
   - define native subscription source of truth
   - reconcile existing web/Razorpay entitlements with native StoreKit/Play Billing entitlements without double-charging users or violating store anti-steering rules
3. Define notification preference contract:
   - channel: push, email, WhatsApp
   - type: japa, nitya, shloka, festival, tithi, etc.
   - enabled
   - local time
   - timezone
   - last sent
4. Define delivery log contract for native-visible notification troubleshooting.
5. Confirm RLS for all tables used by the native client.
6. Keep admin-only and service-role operations behind API routes.

## Native Architecture Decisions Needed

Create short ADRs before implementation:

1. **Navigation ADR**
   - Expo Router route groups
   - bottom tabs
   - stack boundaries
   - modal/form-sheet conventions
   - deep link map

2. **Data ADR**
   - Supabase client setup
   - API client wrapper
   - TanStack Query conventions
   - how TanStack Query cache invalidates when Supabase Realtime subscriptions update the same entities
   - offline caching rules
   - mutation/invalidation strategy

3. **Storage ADR**
   - SecureStore for credentials
   - SQLite/MMKV/AsyncStorage decision
   - `sadhana-engine` storage adapter
   - local cache expiration rules

4. **Notifications ADR**
   - ratify existing OneSignal native direction or document a concrete blocker before reopening provider choice
   - push token mapping
   - preference contract
   - timezone scheduling
   - dry-run and kill-switch parity

5. **Payments ADR**
   - StoreKit / Play Billing approach
   - receipt validation
   - restore purchases
   - subscription status mapping
   - web subscriber entitlement reconciliation
   - migration away from legacy `is_pro`

6. **Content Update ADR**
   - what updates server-side instantly
   - what updates via EAS Update
   - what requires app-store review
   - festival/corpus emergency correction path

7. **Observability ADR**
   - Sentry/release health
   - API error logging
   - crash triage
   - analytics events
   - privacy boundaries

## Required Skills and Specializations

Use these skills for planning and implementation in this Codex environment:

These IDs must be re-verified in the active agent environment before assignment. If an agent cannot call a named skill, it must state that clearly and use the nearest available equivalent instead of pretending the skill ran.

- `expo:building-native-ui`
  - native screen structure, Expo Router, safe areas, tabs, sheets, media, controls.
- `expo:native-data-fetching`
  - API contracts, React Query, offline/cache strategy, auth token handling.
- `expo:expo-deployment`
  - EAS Build, store submission, OTA release channels, deployment workflow.
- `supabase:supabase`
  - auth, RLS, migrations, edge/API contracts, schema checks.
- `supabase:supabase-postgres-best-practices`
  - schema design, query performance, indexes, policies.
- `ui-ux-pro-max`
  - mobile app information architecture, accessibility, interaction quality, visual system.
- `vercel:auth`
  - auth flow review where web/API auth behavior affects native callbacks.
- `vercel:observability`
  - production monitoring/analytics strategy for web/API side.
- `vercel:cron-jobs`
  - scheduled reminders and backend daily jobs.

Human/domain reviewer roles needed:

- Product architect.
- Native mobile engineer.
- Supabase/backend engineer.
- Native UI/UX designer.
- App Store / Play Store payments and compliance reviewer.
- Dharmic content/tradition reviewer.
- QA on real iOS and Android devices.

## Prerequisites Checklist

### Repository and Tooling

- [x] Confirm native app repo path and current state; current native repo is `/Users/Business(C)/shoonaya-mobile`.
- [ ] Confirm Expo SDK version and React Native version.
- [ ] Confirm package manager and workspace strategy.
- [ ] Decide whether shared packages are consumed from monorepo workspaces or published internal packages.
- [ ] Set up TypeScript path aliases.
- [ ] Set up lint, typecheck, test, and build scripts.
- [ ] Set up EAS project, profiles, and environments.

### Backend and Contracts

- [ ] Verify Supabase project ID and environments.
- [ ] Pull/verify database types.
- [ ] Define native-safe API contract folder.
- [ ] Create typed API client wrapper.
- [ ] Document client-exposed env vars and forbidden secrets.
- [ ] Confirm auth callback/deep link URLs.
- [ ] Confirm account deletion API contract.

### Shared Engines

- [ ] Build and import `@sangam/panchang-engine`.
- [ ] Build and import `@sangam/pathshala-engine`.
- [ ] Audit `@sangam/sadhana-engine` for React Native blockers.
- [ ] Introduce storage adapter interface for Sadhana.
- [ ] Remove/avoid duplicate mobile Panchang and Pathshala logic.
- [ ] Audit known duplicate/native-local files before coding:
  - mobile Panchang logic
  - Pathshala lesson/path seed logic
  - Vrat seed logic
  - Dharma Veer seed logic

### Native Platform

- [ ] iOS bundle ID.
- [ ] Android package name.
- [ ] Android signing ownership and keystore custody plan.
- [ ] Android notification channels for daily reminders, community, account/security, and marketing/optional content.
- [ ] Android deep links / app links hosts and verification.
- [ ] Android 13+ notification permission behavior.
- [ ] Android 14+ foreground-service review if audio/recording/background work is added.
- [ ] App icons and splash.
- [ ] Deep link scheme.
- [ ] Universal/app links.
- [ ] Push entitlement setup.
- [ ] Location permission strings.
- [ ] Microphone permission strings.
- [ ] Camera/photo permission strings if native capture is added.
- [ ] Privacy manifest / data safety metadata.
- [ ] Play Console data safety answers mapped to actual SDKs and data flows.
- [ ] Confirm whether any web-repo native files such as root `app.json` are stale and should move/remove before native launch.

### Store Readiness

- [ ] Privacy policy URL.
- [ ] Terms URL.
- [ ] Support URL/email.
- [ ] Account deletion route.
- [ ] Demo account.
- [ ] Review notes.
- [ ] Paid content explanation.
- [ ] Restore purchase flow.
- [ ] Apple Sign-In if iOS offers Google/social auth.
- [ ] Existing web/Razorpay subscriber entitlement behavior inside native app.

## Phased Plan

### Phase 0: Blueprint and Audit

Goal: produce exact implementation prompts and de-risk architecture before coding.

Deliverables:

- PWA feature inventory.
- Current native app inventory.
- Existing native screen status for AI Chat, Quiz, Vrat, Dharma Veer, Kosh, Mandali, and Tirtha.
- Parity matrix.
- Route/screen map.
- Shared engine reuse plan.
- Schema and entitlement risk map.
- Native architecture ADRs.
- Phase 1 task prompts.

Acceptance:

- Every PWA surface is classified as native v1, later phase, or web-only.
- No duplicate logic is knowingly left unclassified.
- Store blockers are named before code starts.
- Existing native screens are classified as keep, harden, replace, or remove.
- Standalone native repo path, branch, package manager, Expo SDK, Android package name, and build scripts are confirmed from live files.
- Deprecated Capacitor artifacts and root-level native metadata in the web repo are classified as remove, retain, or migrate.

### Phase 1: Core Native Shell and Daily App

Goal: a usable native app with auth, onboarding, Home, and the daily practice spine.

Build:

- Expo Router app shell.
- Native tabs/stacks.
- Auth session handling.
- Apple Sign-In on iOS if Google/social auth ships in the same app.
- Onboarding.
- Home next-action surface.
- Profile/settings baseline.
- Japa core.
- Panchang today.
- Pathshala browse/path/lesson baseline.
- Legal/support/account deletion screens.

Acceptance:

- New user can sign up, onboard, and reach Home.
- Existing user can sign in and resume.
- Core daily action can be completed.
- Basic app review compliance screens exist.
- No server secrets in native bundle.

### Phase 2: Practice and Learning Depth

Goal: reach meaningful parity for daily spiritual use.

Build:

- Nitya Karma.
- Quiz.
- Sadhana challenge/journal/my-name.
- Pathshala saved/insights/recitation.
- Bhakti essentials.
- Dharma Veer.
- Vrat/Ekadashi.
- Notification preference screens.

Acceptance:

- Practice progress writes to the same backend truth as PWA.
- Shared engines replace duplicate logic.
- Native permission prompts are contextual.
- Push reminders can be enabled, disabled, and tested.

### Phase 3: Community, Family, and Place

Goal: native parity for local and family belonging.

Build:

- Kul family hub, tasks, events, vansh, sanskara.
- Mandali feed/events/members/comments after Kul priority is validated.
- Vichaar Sabha.
- Tirtha map/check-in/place detail.
- Invite/referral flows.
- Basic moderation/report/block surfaces.

Acceptance:

- Community interactions respect RLS and moderation rules.
- Location is requested only after explicit user intent.
- Feeds paginate and recover from offline/network failure.

### Phase 4: Advanced Features

Goal: add complex PWA surfaces that need deeper native work.

Build:

- Kundali/Rashiphala.
- Live Darshan.
- Seva.
- Scoreboard.
- Messages.
- Kosh.
- Blessing/name-story native share variants.
- Sthapaka if product decides it belongs in native.

Acceptance:

- Heavy chart/media features are performant on real devices.
- Long-tail flows are either complete or deliberately web-linked.

### Phase 5: Monetization and Store Launch

Goal: production subscription and app-store readiness.

Build:

- StoreKit / Play Billing.
- Server-side receipt validation.
- Restore purchase.
- Manage/cancel guidance.
- Entitlement resolver used everywhere.
- Paid-surface copy.
- Review submission package.

Acceptance:

- No production paid digital content relies on Razorpay-in-WebView.
- `is_pro` legacy paths do not determine native premium access.
- App Store and Play Store review notes are complete.

## QA Strategy

Minimum real-device matrix:

- iPhone small screen.
- iPhone large screen.
- Android mid-range device.
- Android low-memory device if possible.
- Tablet sanity pass if tablet support is claimed.

Test areas:

- Auth and session restore.
- Onboarding.
- Deep links.
- Offline startup and cached surfaces.
- Push permission and delivery.
- Location denial/retry.
- Microphone denial/retry.
- Account deletion.
- Subscription restore.
- Panchang correctness against canonical API/package.
- Pathshala lesson progression.
- Nitya/Japa completion consistency with PWA.
- Mandali/Kul RLS and moderation.

## Stop Rules

Do not proceed to the next phase if:

- the standalone native repo path changes or cannot be accessed
- the web repo still appears to be the accidental native host
- shared logic is duplicated instead of reused without an explicit exception
- entitlement truth is split across `is_pro`, client flags, and provider status
- native secrets appear in `EXPO_PUBLIC_` env vars
- account deletion is missing
- permission prompts appear at app startup
- native app cannot pass lint/typecheck/build
- critical PWA parity surfaces are silently omitted from the matrix

## Immediate Next Step

Create a Phase 0 implementation prompt that:

1. Locates the native repo.
2. Audits current native screens.
3. Audits PWA routes/features.
4. Produces a detailed parity matrix.
5. Produces ADR drafts.
6. Produces Phase 1 implementation prompts.
7. Classifies deprecated Capacitor/web-root native artifacts.
8. Produces an Android readiness checklist.

No broad native coding should start before Phase 0 is complete.
