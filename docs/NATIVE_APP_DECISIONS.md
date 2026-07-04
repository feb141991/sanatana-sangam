# Native App Decisions

Last updated: 2026-07-03

This file records decisions that agents must treat as settled unless the user explicitly reopens them.

| ID | Decision | Status | Rationale | Reopen Only If |
|---|---|---|---|---|
| D001 | Use Expo / React Native for the native app instead of Flutter. | Accepted | Shoonaya already uses TypeScript, React, Supabase JS, and shared TS packages. Flutter would create a second domain ecosystem. | Expo cannot satisfy a required native capability after proof. |
| D002 | Native app owns experience; shared platform owns truth. | Accepted | Prevents duplicate domain logic and keeps web/native behavior aligned. | A feature needs offline-first native-only behavior with an explicit sync contract. |
| D003 | Supabase and server API contracts remain the data source of truth. | Accepted | Existing backend, auth, RLS, migrations, and APIs are reusable. | A native-only store is required for a specific offline feature and has a sync design. |
| D004 | Shared TypeScript packages must be reused for core logic where portable. | Accepted | `panchang-engine` and `pathshala-engine` are intended to avoid duplicated calculations/content rules. | Package audit proves a package cannot be made portable within reasonable scope. |
| D005 | `sadhana-engine` requires a React Native storage adapter before full reuse. | Accepted | Dexie/IndexedDB is not React Native-compatible. | The engine is refactored to storage abstraction or usage is restricted to API contracts. |
| D006 | OneSignal native is the current push direction. | Accepted pending Phase 0 audit | Web uses OneSignal concepts and the existing native setup reportedly includes OneSignal packages/config. Provider choice should be ratified, not casually reopened. | Phase 0 finds a concrete OneSignal blocker or unacceptable cost/compliance issue. |
| D007 | Admin dashboards stay web-only for v1. | Accepted | Admin/moderation/cron operations should not expand native scope unless there is a real mobile admin use case. | User explicitly asks for mobile admin tooling. |
| D008 | Kul has higher primary-navigation priority than Mandali for launch. | Accepted | `PRODUCT_CONSOLIDATION_PLAN.md` names Kul as a primary destination and Mandali as contextual until usage proves otherwise. | Product direction changes in an updated consolidation doc. |
| D009 | AI Chat / Dharma AI must be classified in the parity matrix. | Accepted | It is a headline feature and reportedly already has a native screen; omission would distort scope. | Feature is intentionally removed from native v1 by product decision. |
| D010 | My Progress must be classified in the parity matrix. | Accepted | It is the planned cross-pillar ledger tying practice, learning, family, and community together. | Product explicitly defers unified progress from native. |
| D011 | Apple Sign-In is required on iOS if Google/social login ships. | Accepted | App Store guideline risk; not optional if third-party login is present. | Google/social login is removed from iOS native app. |
| D012 | Native paid digital content must use StoreKit / Play Billing. | Accepted | Store policy risk. Razorpay-in-WebView is not acceptable for native digital subscriptions. | Paid native digital content is not shipped. |
| D013 | Existing web/Razorpay subscriber entitlement must reconcile with native IAP. | Accepted | Users should not be double-charged, and native apps must avoid anti-steering violations. | Premium is deferred entirely from native launch. |
| D014 | OTA update and crash observability are architecture requirements, not polish. | Accepted | Native release quality requires EAS Update discipline and crash/error telemetry. | App is not being distributed beyond internal test builds. |
| D015 | Phase 0 audit must finish before broad native coding starts. | Accepted | Existing native screens and duplicate logic must be classified before implementation prompts. | User explicitly asks for a narrow direct implementation. |
| D016 | Do not revive the deprecated Capacitor wrapper as the native app path. | Accepted | The web repo marks Capacitor as deprecated and package scripts/dependencies no longer support it. Native parity should proceed through a standalone Expo/React Native app unless a new decision replaces this. | Phase 0 proves the standalone native repo is unavailable and user explicitly chooses a new native architecture. |
| D017 | Native repo is `/Users/Business(C)/shoonaya-mobile`. | Accepted | The actual native repo is present, has Expo SDK 56 / React Native 0.85.3, existing screens, local generated Android files, and a local stabilization commit `707f35f` that passes typecheck and Expo Doctor. | The repo is moved, replaced, or proven unusable by build/runtime verification. |
| D018 | Salvage the native repo after audit; do not restart from scratch today. | Accepted | Phase 0 found a real Expo app with useful routes and clean typecheck/doctor, but also found P0/P1 gates. The right path is keep/harden/replace per screen, not blind continuation. | A local Android/iOS runtime build proves unrecoverable architecture failure. |
| D019 | Android release signing is a P0 gate. | Accepted | The generated local Android folder is ignored, so signing must be solved through an explicit tracked-Android decision or EAS/prebuild credentials; release signing still requires verification. | EAS-managed signing or tracked Android release signing is verified with a production Android build. |

## Open Decisions

| ID | Question | Owner | Needed Before |
|---|---|---|---|
| O001 | Whether the 13 local commits ahead of origin in `/Users/Business(C)/shoonaya-mobile` should be pushed, rebased, or squashed. | Engineering | Before collaborative native work |
| O002 | Whether shared packages are consumed by workspace linking or published internal packages. | Engineering | Phase 1 setup |
| O003 | Native storage choice for non-sensitive local state: MMKV, SQLite, AsyncStorage, or hybrid. | Engineering | Sadhana/offline work |
| O004 | Exact bottom-tab shape for native v1 after Kul/Mandali priority is applied. | Product + Design | Phase 1 shell |
| O005 | Whether Tirtha is native v1, Phase 2, or contextual web-linked. | Product | Phase 1 scope |
| O006 | Whether premium ships in native v1 or is deferred until after free parity. | Product + Compliance | Phase 5 scope |
| O007 | Whether Sthapaka and Founding remain separate native classifications. | Product | Parity matrix |
| O008 | Whether the root `app.json` in the web repo is stale/deprecated or intentionally retained for EAS metadata. | Engineering | Before native repo setup |
| O009 | Android package name, signing ownership, notification channel model, deep-link hosts, and Play Console readiness. | Android engineer | Phase 1 setup |
| O010 | Whether the native repo's 13 local commits should be pushed as-is, squashed into a stabilization baseline, or split by concern. | Engineering | Before multi-agent feature work |
| O011 | Whether native Android should keep a checked-in `android/` directory or regenerate through Expo prebuild/EAS. | Android engineer | Before release setup |

## Decision Update Rule

Do not overwrite accepted decisions silently. If an agent believes a decision is wrong, it must propose a change with:

- evidence
- user impact
- engineering impact
- store/compliance impact where relevant
- recommended replacement decision
