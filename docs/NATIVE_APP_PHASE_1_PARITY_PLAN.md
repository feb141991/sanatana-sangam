# Native App Phase 1 Parity Plan

Last updated: 2026-07-05

## Purpose

Phase 1 turns the hardened Expo repo at `/Users/Business(C)/shoonaya-mobile` into a controlled native parity program for Shoonaya. The goal is not to copy PWA screens blindly. The goal is to ship native user journeys that reuse Shoonaya's shared backend, API contracts, Supabase RLS, and portable TypeScript engines.

Phase 0 security and repository cleanup is treated as complete enough to start Phase 1 planning. Live RLS verification still needs disposable test credentials before it can be marked fully automated.

## Source Of Truth

- Web/API/Supabase repo: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native Expo repo: `/Users/Business(C)/shoonaya-mobile`
- Native implementation repo: `/Users/Business(C)/shoonaya-mobile`
- Web repo role during Phase 1: source of contracts, migrations, API routes, docs, shared packages, and product rules

The web repo should only change when Phase 1 needs API contracts, Supabase migrations, shared package adapters, docs, or test harness updates. Native UI and navigation work belongs in the native repo.

## Required Reading

Every agent must read these before Phase 1 work:

1. `SHOONAYA_RULES.md`
2. `PRODUCT_CONSOLIDATION_PLAN.md`
3. `docs/NATIVE_APP_AGENT_RULES.md`
4. `docs/NATIVE_APP_DECISIONS.md`
5. `docs/NATIVE_APP_PARITY_BLUEPRINT.md`
6. This file
7. The assigned Phase 1 prompt

If an assigned prompt touches Supabase, also read:

1. `docs/testing/RLS_TESTING.md`
2. `scripts/verify-rls.ts`
3. Relevant migration files under `supabase/migrations/`

## Current Native Inventory

Existing native routes found in `/Users/Business(C)/shoonaya-mobile/app`:

- Auth: `app/(auth)/login.tsx`, `app/(auth)/onboarding.tsx`, `app/(auth)/otp.tsx`, `app/(auth)/whatsapp.tsx`
- Tabs: `app/(tabs)/index.tsx`, `app/(tabs)/pathshala.tsx`, `app/(tabs)/bhakti.tsx`, `app/(tabs)/tirtha.tsx`, `app/(tabs)/profile.tsx`
- Standalone: `app/ai-chat.tsx`, `app/dharm-veer.tsx`, `app/kosh.tsx`, `app/mandali.tsx`, `app/panchang.tsx`, `app/quiz.tsx`, `app/settings.tsx`, `app/vrat.tsx`
- Pathshala detail: `app/pathshala/[pathId].tsx`, `app/pathshala/[pathId]/[lessonId].tsx`

Native local domain files that need contract review before expansion:

- `lib/pathshala-lessons.ts`
- `lib/pathshala-paths.ts`
- `lib/dharm-veer.ts`
- `lib/vrat-data.ts`
- `lib/diaspora-temples.ts`
- `lib/notifications.ts`
- `lib/api.ts`
- `lib/supabase.ts`

Already replaced:

- `lib/panchang.ts` was removed from the native repo and replaced with `@sangam/panchang-engine`.

## Phase 1 Principles

- Native app owns experience; shared platform owns truth.
- Prefer server/API contracts or shared packages over native-only duplicated logic.
- Do not introduce direct client writes to canonical/global tables.
- Do not add secrets to `EXPO_PUBLIC_` or native code.
- Do not revive Capacitor.
- Do not start native subscription/IAP work inside Phase 1 unless an accepted Payments ADR exists.
- Keep each slice small enough to verify with typecheck plus a manual route smoke path.
- Delete replaced legacy/native duplicate code after the replacement is proven.

## Phase 1 Slice Order

### Slice 1: Route And Contract Freeze

Objective: produce a current native route, data-source, and API-contract matrix before feature coding.

In scope:

- Map every native route to its web/PWA equivalent.
- Identify whether each route uses Supabase directly, a web API route, local fixture data, or a shared package.
- Mark duplicated native logic that must be replaced or deliberately retained.
- Update Phase 1 docs if live code contradicts the blueprint.

Out of scope:

- No UI changes.
- No schema changes unless a P0 security issue is discovered.

Acceptance:

- A route matrix exists in docs.
- Each duplicated local data source has a disposition: replace with API/package, keep temporarily, or delete after migration.
- `npm run typecheck` passes in the native repo if files are edited.

### Slice 2: Auth, Onboarding, And Account Basics

Objective: make native auth and onboarding consistent with web product rules and store compliance.

In scope:

- Email auth and social auth path review.
- Apple Sign-In requirement for iOS if Google/social auth is enabled.
- Onboarding capture for tradition, language/script, location/Mandali, reminder intent, and first practice where supported by current backend contracts.
- Profile/settings route review.
- Account deletion entry point wired to the existing secure delete API contract.
- Privacy, terms, and support/contact links.

Out of scope:

- Paid subscription purchase.
- Broad visual redesign.

Acceptance:

- New users do not bypass required onboarding silently.
- Existing users land in the correct app shell.
- Account deletion is reachable inside the app.
- Permission prompts are contextual, not fired on first launch without intent.

### Slice 3: Native Shell And Home Next Action

Objective: establish the native first-screen experience around one useful next action.

In scope:

- Bottom-tab shape aligned with `PRODUCT_CONSOLIDATION_PLAN.md`.
- Home route focused on one next practice/action.
- Safe-area, large-touch-target, dark/light theme, and loading/error states.
- Deep links or route pushes for the next action.

Out of scope:

- Full parity for every destination linked from Home.
- Gamified dashboard expansion.

Acceptance:

- Home has one primary next action, not competing nudges.
- Primary controls are native `Pressable`/`Link` equivalents with accessible labels.
- The route works for signed-in users with partial profile data.

### Slice 4: Core Practice Surfaces

Objective: make the core daily-practice surfaces native-safe and contract-backed.

Priority order:

1. Japa/Bhakti entry and session continuity.
2. Pathshala browse and lesson detail using canonical packages/contracts.
3. Panchang/today calendar using shared package or API contract.
4. Vrat/Ekadashi and reminders only after the data contract is clear.

Acceptance:

- No new native-only sacred-date or lesson-selection logic unless documented as temporary.
- Replaced local fixture files are deleted or marked with a removal ticket in the same docs.
- Offline fallbacks are explicit and do not claim freshness when stale.

Pathshala note:

- The native lesson reader currently calls `/api/pathshala/progress`, but that route does not exist in the web/API repo. The code then falls back to direct `guided_path_progress` writes.
- `guided_path_progress` RLS allows authenticated users to manage their own rows, so moving progress writes behind an API is a governance and side-effect consistency decision rather than an emergency RLS requirement.
- If `/api/pathshala/progress` is created, decide whether the web Pathshala lesson client should migrate to the same API contract. The web client currently writes `guided_path_progress` directly too.
- Before migrating browse or lesson UI, audit whether progress completion should also update `daily_sadhana`, karma, badges, streaks, notifications, or Pathshala recommendation state.

### Slice 5: Community And Location Surfaces

Objective: stabilize Mandali and Tirtha native flows without reopening Phase 0 security issues.

In scope:

- Mandali feed/events/member route contract checks.
- Tirtha place import/check-in/save flows through secure contracts.
- Location permission copy and manual fallbacks.
- Empty states that are useful, not blank.

Out of scope:

- Mobile admin/moderation dashboards.
- Client-side canonical place editing.

Acceptance:

- Native client does not write canonical/global place records directly.
- User-generated reports/blocks write only through approved tables/contracts.
- Location-based flows have manual fallback.

### Slice 6: Content Rotation And Daily Surfaces

Objective: remove repeated local-only content loops where the web platform now has canonical data.

In scope:

- Dharma Veer daily source of truth.
- Quiz and Kosh contract review.
- Share-card/native sharing hook review where applicable.
- Daily content cache freshness rules.

Acceptance:

- Daily content does not repeat due to tiny static arrays unless explicitly accepted for MVP.
- The app can recover when daily API/content fails.
- Native cache does not mask canonical content updates indefinitely.

### Slice 7: Native Service Foundations

Objective: put native-only services behind thin adapters.

In scope:

- Push notification adapter and preference contract.
- SecureStore/session handling review.
- Local storage choice for non-sensitive state.
- Audio/microphone adapter review for practice/recitation.
- Crash reporting and OTA update ADRs.

Out of scope:

- Monetization/IAP.

Acceptance:

- Permission prompts are tied to explicit user actions.
- Provider-specific code is isolated behind app-level adapters.
- No service secret is exposed in the native bundle.

### Slice 8: Device QA And Release Readiness

Objective: prove the app on actual mobile runtime, not only typecheck.

In scope:

- Expo Doctor.
- Android emulator/device smoke.
- iOS simulator/device smoke where available.
- Route smoke checklist.
- Store-compliance checklist refresh.

Acceptance:

- Typecheck passes.
- Expo Doctor has no unexplained blocker.
- At least one real Android path and one iOS simulator/device path are documented before wider testing.

## Verification Commands

Run from `/Users/Business(C)/shoonaya-mobile` when native files change:

```bash
npm run typecheck
npx expo-doctor
```

Run from `/Users/Business(C)/Sanatan Sangam/Shoonaya` when web/API/Supabase files change:

```bash
npm run lint
npm run build
npx supabase db push --linked --dry-run
DRY_RUN=true npx tsx scripts/verify-rls.ts
```

Use live RLS mode only against a disposable or explicitly approved test project with test users.

## Stop Rules

Stop and report before editing if:

- A prompt requires production secrets or real user credentials.
- A native flow would require direct client writes to a canonical/global table.
- A feature needs a missing web API contract and the assigned scope forbids web edits.
- Apple/Google policy conflicts with the proposed implementation.
- Shared package consumption cannot be resolved without a packaging decision.
- Native code would duplicate Panchang, Pathshala, Sadhana, entitlement, or daily-content logic already owned by the platform.
- A route has no clear product owner or launch priority.

## Phase 1 Deliverables

- `docs/NATIVE_APP_PHASE_1_ROUTE_CONTRACT_MATRIX.md`
- Auth/onboarding/account-deletion implementation or gap report
- Native shell/Home next-action implementation
- Core practice implementation slices with deleted or quarantined duplicate logic
- Community/location hardening report
- Native service ADRs for notifications, storage, observability, and OTA updates
- Device QA smoke report

## Open Decisions Before Broad Coding

- Shared package consumption model: workspace linking, package tarballs, or internal registry.
- Native storage strategy: MMKV, SQLite, AsyncStorage, or hybrid.
- Bottom tab final shape for native v1.
- Whether Tirtha is in v1 or stays contextual.
- Whether Premium is deferred entirely from native v1.
- Android release signing and EAS credential ownership.
