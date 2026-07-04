# Native App Migration Readiness Review

Last updated: 2026-07-03

Reviewer stance: migration engineer + Android engineer.

## Verdict

Proceed with repair-in-place, not a restart.

The standalone native repo is confirmed at `/Users/Business(C)/shoonaya-mobile`. It is a real Expo / React Native app with existing screens, Android project files, OneSignal packages, Supabase client dependencies, and EAS config. It is not throwaway work.

The repo is not fully collaboration-ready yet because it is ahead of origin, but the immediate SDK stabilization blockers were fixed in place and committed locally as `707f35f chore: stabilize native sdk baseline`. Dharm Veer and Quiz share handlers now use the SDK 56 FileSystem API, Expo SDK patch versions are aligned, `npm run typecheck` passes, and `npx expo-doctor` passes 21/21 checks in the native repo.

## What Is Ready

- Expo / React Native is the accepted native stack.
- Flutter is intentionally rejected for this migration because Shoonaya already has React, TypeScript, Supabase JS, and shared TypeScript packages.
- The architecture rule is clear: native app owns experience, shared platform owns truth.
- The web repo no longer shows active Capacitor dependencies or scripts in `package.json`.
- Native repo exists at `/Users/Business(C)/shoonaya-mobile`.
- Native repo has Expo SDK 56, React Native 0.85.3, Expo Router, Supabase JS, OneSignal, and existing route screens.
- Native repo typecheck passes after the SDK 56 FileSystem fix.
- Native repo Expo Doctor passes after aligning SDK 56 patch versions.
- Native stabilization baseline is committed locally as `707f35f`.
- Control docs now exist:
  - `docs/NATIVE_APP_AGENT_RULES.md`
  - `docs/NATIVE_APP_DECISIONS.md`
  - `docs/NATIVE_APP_PHASE_0_PROMPTS.md`
  - `docs/NATIVE_APP_PARITY_BLUEPRINT.md`
- The native parity blueprint now includes missing surfaces such as AI Chat, My Progress, Discover/Mood, Guest mode, and existing native screen audit requirements.
- Store blockers are named: account deletion, Apple Sign-In, privacy/terms/support, subscriptions, entitlement reconciliation, and reviewer notes.

## Resolved P0

### Native repo source of truth is confirmed

Evidence:

- `/Users/Business(C)/shoonaya-mobile` exists.
- It is on `main...origin/main [ahead 13]`.
- It contains `app/`, `android/`, `components/`, `lib/`, `app.json`, `eas.json`, `package.json`, and `tsconfig.json`.
- `npm run typecheck` passes after the SDK 56 FileSystem migration fix.

Outcome:

- Use `/Users/Business(C)/shoonaya-mobile` for native implementation.
- Do not restart from scratch unless build/runtime verification proves the repo cannot be recovered.

## P0 Blockers Before Broad Implementation

### 1. Native repo branch state must be pushed or intentionally rebased

Evidence:

- Native repo contains local commit `707f35f chore: stabilize native sdk baseline`.
- Native repo is ahead of `origin/main`.
- `expo-doctor` now passes 21/21 checks.
- `npm run typecheck` now passes.

Impact:

- Multiple agents could work from different assumptions.
- EAS/remote agent behavior may differ from local behavior until this stack is pushed or intentionally rebased.

Required correction:

- Decide whether to push, squash, or rebase the local native commit stack.
- Use `707f35f` as the current local stabilization baseline if accepted.

### 2. Web repo still has native migration history that must not become the implementation target

Evidence:

- `CAPACITOR_SETUP.md` marks Capacitor as deprecated and says the canonical native app is standalone Expo/React Native.
- `package.json` no longer contains Capacitor dependencies or `cap:*` scripts.
- A root `app.json` exists with EAS project metadata, but this web repo is not the confirmed standalone native app.
- Current dirty files include deleted/stale native-related paths:
  - `android/app/src/main/assets/public/index.html`
  - `capacitor.config.ts`
  - `native-config/android/AndroidManifest.additions.xml`
  - `native-config/android/network_security_config.xml`
  - `native-config/ios/Info.plist.additions.xml`

Impact:

- Android/native work could accidentally proceed inside the web repo.
- Deprecated Capacitor decisions could leak into the Expo migration.

Required correction:

- Classify root `app.json` as retain, move, or remove.
- Keep Capacitor wrapper deprecated unless the user explicitly reopens native architecture.
- Do not generate or restore Android/iOS folders in this web repo as part of Expo parity work.

## P1 Risks To Resolve In Phase 0

### Android release ownership

Required decisions:

- Android package name.
- signing key/keystore custody.
- versionCode/versionName policy.
- app links and `assetlinks.json`.
- notification channel taxonomy.
- Android 13 notification permission timing.
- Android 14 foreground-service needs for audio, recording, location, or background work.

### Push provider and native extension

OneSignal is currently ratified as the direction, but native repo evidence must confirm:

- installed packages
- config plugin
- Android manifest/plugin outputs
- iOS notification service extension if required
- token mapping to the backend profile/user model

### Data and entitlement migration

Native implementation must not begin premium work until:

- `is_pro` legacy paths are not the native source of truth
- web/Razorpay entitlements are reconciled with StoreKit/Play Billing entitlements
- direct Supabase access has RLS coverage
- service-role operations stay behind API routes

### Shared package portability

Before coding screens:

- import or link `@sangam/panchang-engine`
- import or link `@sangam/pathshala-engine`
- add a storage adapter boundary for `@sangam/sadhana-engine`
- remove/avoid duplicate native seed/calculation logic

## Android Engineer Checklist

| Area | Status | Required Next Step |
|---|---|---|
| Native repo path | Ready | Use `/Users/Business(C)/shoonaya-mobile` |
| Android source of truth | Needs decision | Confirm generated EAS/prebuild vs manually maintained Android |
| Package name | Present | Current `app.json` uses `com.shoonaya.app`; confirm final ownership |
| Signing | Partial | Generated Android is ignored; decide tracked vs generated Android, assign keystore custody, and verify EAS credentials |
| Versioning | Unknown | Define versionCode/versionName strategy |
| Push notifications | Partially ready | OneSignal packages/config present; verify native runtime |
| Notification channels | Missing from implementation | Design channel taxonomy before build |
| Deep links/app links | Unknown | Map hosts and auth callbacks |
| Permissions | Unknown | Map notification/location/mic/camera/audio needs |
| Play data safety | Unknown | Map SDK/data collection after actual packages are confirmed |
| Capacitor artifacts | Risk controlled by docs | Do not revive |

## Recommendation

Do not restart from scratch.

Next step is stabilization and Phase 0 audit using:

- Prompt 1: Native Repo Reality Audit
- Prompt 9: Android Migration Readiness Audit

After those pass, start ADR drafting and Phase 1 implementation prompts.
