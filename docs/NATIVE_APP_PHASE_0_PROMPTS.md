# Native App Phase 0 Prompts

Last updated: 2026-07-03

Use these prompts to coordinate Codex, Claude, Antigravity, or another agent. Each prompt is intentionally bounded. Do not combine all prompts into one long implementation run.

## Shared Instruction Header

Paste this at the top of every agent prompt:

```text
You are working on Shoonaya native app parity planning.

Required reading, in order:
1. SHOONAYA_RULES.md
2. PRODUCT_CONSOLIDATION_PLAN.md
3. docs/NATIVE_APP_PARITY_BLUEPRINT.md
4. docs/NATIVE_APP_AGENT_RULES.md
5. docs/NATIVE_APP_DECISIONS.md

Default mode is read-only audit. Do not edit files, stage, commit, push, delete, or reformat unless the task explicitly allows edits.

Every claim must cite repo evidence: file path, route/table/function, and line number where practical.

Use P0/P1/P2 severity:
- P0 blocks Phase 0 sign-off, store submission, security, data integrity, or core architecture.
- P1 causes likely rework, parity gaps, duplicated logic, or compliance risk.
- P2 is useful but not blocking.

Final output must include files read, commands run, edits made or "none", verification status, and remaining blockers.
```

## Prompt 1: Native Repo Reality Audit

```text
[Use the shared instruction header.]

Role: senior Expo / React Native engineer.

Task:
Locate the native Shoonaya repo and audit its current state against docs/NATIVE_APP_PARITY_BLUEPRINT.md.

Native repo path:
/Users/Business(C)/shoonaya-mobile

If that path does not exist in a future environment, search reasonable local workspace roots for Shoonaya/native repos and report all candidates. Do not proceed as if the candidate exists.

Audit:
1. Confirm repo path, branch, dirty files, package manager, Expo SDK, React Native version, Expo Router presence, and build scripts.
2. List existing screens/routes.
3. Classify each existing screen as keep, harden, replace, remove, or unknown.
4. Identify duplicate local domain logic that should move to shared packages/API contracts.
5. Identify native packages already installed for push, auth, storage, audio, location, maps, analytics, and payments.
6. Compare findings against docs/NATIVE_APP_PARITY_BLUEPRINT.md and docs/NATIVE_APP_DECISIONS.md.
7. Confirm whether the web repo contains stale native artifacts such as root app.json, android/, ios/, capacitor config, or native-config files.

Forbidden:
- Do not edit files.
- Do not install dependencies.
- Do not run destructive commands.

Output:
Use the required findings format from docs/NATIVE_APP_AGENT_RULES.md.
Add a "Native Inventory Table" with columns: Route, Feature, Status, Keep/Harden/Replace/Remove, Evidence, Notes.
If the native repo cannot be found, mark this as P0 and stop before estimating implementation work.
```

## Prompt 2: PWA Feature Inventory Audit

```text
[Use the shared instruction header.]

Role: senior product engineer and information architect.

Task:
Audit the web/PWA repo and produce a complete feature inventory for native parity planning.

Audit:
1. Enumerate user-facing routes under src/app, excluding admin-only routes unless they affect user entitlement or support.
2. Map routes to product pillars: Home, Auth, Onboarding, Japa, Nitya, Pathshala, Panchang, AI Chat, Quiz, Sadhana, My Progress, Bhakti, Kul, Mandali, Vichaar, Dharma Veer, Vrat/Ekadashi, Kosh, Tirtha, Kundali/Rashiphala, Live Darshan, Seva, Scoreboard, Messages, Sthapaka, Founding, Blessing/name-story, Invite/waitlist/referral, Premium, Legal/support.
3. Identify surfaces missing from docs/NATIVE_APP_PARITY_BLUEPRINT.md.
4. Identify web-only surfaces that should stay web-only.
5. Identify which routes depend on Supabase tables, API routes, localStorage, browser-only APIs, or third-party services.

Forbidden:
- Do not edit files.
- Do not make product priority changes without citing PRODUCT_CONSOLIDATION_PLAN.md or marking as an open question.

Output:
Use the required findings format.
Add a "PWA Route Matrix" with columns: Route, Pillar, Native Target, Dependencies, Notes.
```

## Prompt 3: Shared Package Portability Audit

```text
[Use the shared instruction header.]

Role: TypeScript platform engineer.

Task:
Audit shared packages for native reuse readiness.

Packages to inspect:
- packages/panchang-engine
- packages/pathshala-engine
- packages/sadhana-engine
- packages/pramana-* if present
- src/shared-core if relevant

Audit:
1. Detect browser-only dependencies: window, document, localStorage, IndexedDB, Dexie, DOMParser, Web Audio, canvas.
2. Detect Node-only dependencies that will not run in React Native.
3. Identify exported APIs that native should consume.
4. Identify adapter boundaries needed for storage, time, locale, fetch, or crypto.
5. Compare package truth with duplicate logic in the native repo if available.

Forbidden:
- Do not edit package code.
- Do not add abstractions yet.

Output:
Use the required findings format.
Add a "Portability Table" with columns: Package, Portable Now, Blockers, Native Adapter Needed, Recommended Owner.
```

## Prompt 4: Supabase, RLS, and Entitlement Audit

```text
[Use the shared instruction header.]

Role: Supabase / Postgres security engineer.

Task:
Audit data and security prerequisites for native parity.

Required skills if available:
- supabase:supabase
- supabase:supabase-postgres-best-practices

Audit:
1. Identify tables the native app will need for Phase 1 and Phase 2.
2. Verify RLS expectations for direct native Supabase access.
3. Identify operations that must stay behind API routes/service role.
4. Audit entitlement truth: legacy is_pro, subscription_status, provider fields, Razorpay/web entitlements, native IAP needs.
5. Identify account deletion, profile deletion, storage cleanup, and data export contract status.
6. Identify notification preference and delivery-log table status.

Forbidden:
- Do not run migrations.
- Do not change policies.
- Do not expose secrets.

Output:
Use the required findings format.
Add a "Native Data Access Table" with columns: Feature, Table/API, Direct Supabase Allowed, API Required, RLS Risk, Notes.
```

## Prompt 5: Native UX and Product Priority Review

```text
[Use the shared instruction header.]

Role: mobile product designer and UX reviewer for a premium spiritual lifestyle app.

Required skill if available:
- ui-ux-pro-max

Task:
Review the native parity blueprint for product clarity, mobile IA, accessibility, and launch focus.

Audit:
1. Verify that PRODUCT_CONSOLIDATION_PLAN.md is respected.
2. Check whether Home, Pathshala, Bhakti, Kul, and Profile/progress are handled as launch-shape priorities.
3. Check whether Mandali/Tirtha are contextual unless product evidence promotes them.
4. Identify screens that should be native-first versus web-linked initially.
5. Identify where native UI must differ from the PWA instead of copying web layout.
6. Identify accessibility requirements: font sizes, target sizes, reduced motion, screen reader labels, dialogs/sheets.

Forbidden:
- Do not create a new visual design system.
- Do not add new features.
- Do not use vague phrases like "make it more premium" without concrete screen-level recommendations.

Output:
Use the required findings format.
Add a "Launch IA Recommendation" with proposed tab structure, contextual entry points, and deferred surfaces.
```

## Prompt 6: Store Compliance and Release Readiness Audit

```text
[Use the shared instruction header.]

Role: App Store / Play Store compliance and release engineer.

Required skill if available:
- expo:expo-deployment

Task:
Audit native app launch requirements before implementation begins.

Audit:
1. Apple Sign-In requirement if Google/social login ships.
2. Account deletion flow.
3. Privacy, terms, support/contact.
4. Permission strings and permission timing.
5. Push entitlements and notification service extension status.
6. Paid digital content compliance: StoreKit/Play Billing, restore purchase, manage subscription, web/Razorpay entitlement reconciliation.
7. EAS Build profiles, bundle IDs/package names, app icons/splash, release channels, OTA update policy.
8. Crash/error observability and analytics privacy.

Forbidden:
- Do not submit builds.
- Do not configure production credentials.
- Do not change payment logic.

Output:
Use the required findings format.
Add a "Store Blocker Checklist" with Pass/Fail/Unknown.
```

## Prompt 7: ADR Drafting Pass

```text
[Use the shared instruction header.]

Role: architecture decision recorder.

Task:
Using the outputs of Prompts 1-6, draft ADRs for:
1. Navigation
2. Data
3. Storage
4. Notifications
5. Payments
6. Content updates
7. Observability

Edits allowed:
- You may create Markdown ADR drafts under docs/native/adr/ only.
- Do not edit application code.

Each ADR must include:
- Status: Proposed / Accepted / Deferred
- Context
- Decision
- Alternatives considered
- Consequences
- Verification needed
- Open questions

Stop if:
- Any P0 from Prompts 1-6 remains unresolved.
```

## Prompt 8: Phase 1 Implementation Prompt Builder

```text
[Use the shared instruction header.]

Role: senior implementation planner and prompt engineer.

Task:
After Phase 0 audits and ADRs are complete, write strict implementation prompts for Phase 1 only.

Phase 1 scope:
- Expo Router shell
- native tabs/stacks
- auth session handling
- onboarding
- Home next-action surface
- profile/settings baseline
- Japa core
- Panchang today
- Pathshala browse/path/lesson baseline
- legal/support/account deletion screens

Do not include:
- payments/IAP
- Mandali full feed
- Kundali/Rashiphala
- Live Darshan
- broad redesign
- duplicate shared logic

Output:
Create or update docs/NATIVE_APP_PHASE_1_PROMPTS.md.
Each prompt must include exact files/directories, allowed edits, required reading, verification commands, stop rules, and final report format.
```

## Prompt 9: Android Migration Readiness Audit

```text
[Use the shared instruction header.]

Role: senior Android migration engineer for Expo / React Native apps.

Required skills if available:
- expo:building-native-ui
- expo:expo-deployment

Task:
Audit Android-specific readiness before any native implementation starts.

Audit:
1. Confirm the actual native repo path and Android project source of truth.
2. Confirm whether Android is generated by Expo prebuild/EAS or manually maintained.
3. Check package/application ID plan, app name, versionCode/versionName strategy, signing ownership, and keystore custody.
4. Check required Android permissions for notifications, location, microphone, camera/photos, media playback, network, and foreground services.
5. Check Android 13+ notification permission timing and channel design.
6. Check Android 14+ foreground-service constraints if recording, audio, location, or background jobs are planned.
7. Check deep links / app links, assetlinks.json, verified domains, and auth callback URLs.
8. Check OneSignal Android setup if it remains the ratified push provider.
9. Check Play Console data safety, account deletion URL, privacy policy, support contact, and test account needs.
10. Identify deprecated Capacitor or web-root Android artifacts that must not be reused.

Forbidden:
- Do not generate Android folders.
- Do not run prebuild.
- Do not change signing, app IDs, or credentials.
- Do not edit application code.

Output:
Use the required findings format.
Add an "Android Readiness Checklist" with columns: Area, Current Evidence, Ready/Blocked/Unknown, Required Next Step.
```
