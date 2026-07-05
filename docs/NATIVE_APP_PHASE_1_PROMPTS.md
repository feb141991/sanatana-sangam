# Native App Phase 1 Prompt Pack

Last updated: 2026-07-05

Use these prompts for AG, Claude, Codex, or any specialist agent. Each prompt is intentionally strict. Do not let agents skip required reading, change unrelated files, or report vague success.

## Prompt 1: Route And Contract Matrix

~~~md
You are acting as four specialists in sequence:

1. Prompt engineer: keep this task narrow, executable, and evidence-based.
2. Expo migration engineer: inspect Expo Router routes and native module usage.
3. Native data-contract engineer: map every screen to Supabase/API/local/shared-package data.
4. QA auditor: verify the final matrix is complete and not based on assumptions.

Objective:
Create a current Phase 1 route/data-source matrix for Shoonaya native app parity. This is read-only unless the prompt explicitly says to add the matrix doc.

Repos:
- Web/API source of truth: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native implementation repo: `/Users/Business(C)/shoonaya-mobile`

Required reading:
- `/Users/Business(C)/Sanatan Sangam/Shoonaya/SHOONAYA_RULES.md`
- `/Users/Business(C)/Sanatan Sangam/Shoonaya/PRODUCT_CONSOLIDATION_PLAN.md`
- `/Users/Business(C)/Sanatan Sangam/Shoonaya/docs/NATIVE_APP_AGENT_RULES.md`
- `/Users/Business(C)/Sanatan Sangam/Shoonaya/docs/NATIVE_APP_DECISIONS.md`
- `/Users/Business(C)/Sanatan Sangam/Shoonaya/docs/NATIVE_APP_PARITY_BLUEPRINT.md`
- `/Users/Business(C)/Sanatan Sangam/Shoonaya/docs/NATIVE_APP_PHASE_1_PARITY_PLAN.md`
- Native files under `/Users/Business(C)/shoonaya-mobile/app`
- Native data/client files under `/Users/Business(C)/shoonaya-mobile/lib`

Allowed edits:
- Add or update only `/Users/Business(C)/Sanatan Sangam/Shoonaya/docs/NATIVE_APP_PHASE_1_ROUTE_CONTRACT_MATRIX.md`
- Do not edit app code.
- Do not edit Supabase migrations.
- Do not stage, commit, push, reset, or delete files.

Required commands:
```bash
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && git status --short --branch
cd "/Users/Business(C)/shoonaya-mobile" && git status --short --branch
cd "/Users/Business(C)/shoonaya-mobile" && find app -maxdepth 4 -type f | sort
cd "/Users/Business(C)/shoonaya-mobile" && find lib components hooks constants -maxdepth 3 -type f 2>/dev/null | sort
cd "/Users/Business(C)/shoonaya-mobile" && rg -n "supabase|fetch\\(|apiFetch|EXPO_PUBLIC|from\\(|insert\\(|upsert\\(|update\\(|delete\\(" app lib components hooks
```

Matrix columns:
- Native route/file
- PWA/API/shared-package equivalent
- Current data source: Supabase direct, API route, local fixture, shared package, or mixed
- User writes performed
- Security/RLS concern
- Duplicated domain logic concern
- Recommended Phase 1 disposition: keep, replace with API, replace with shared package, defer, or delete after migration
- Priority: P0/P1/P2

Hard constraints:
- Every finding must cite a path and route/table/function name.
- Do not assume a web API exists; verify it by path or `rg`.
- Do not recommend duplicating Panchang, Pathshala, Sadhana, entitlement, or daily-content logic in native.
- If a native file writes to canonical/global data directly, mark it P0.

Verification:
- If docs are edited, run:
```bash
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && git diff -- docs/NATIVE_APP_PHASE_1_ROUTE_CONTRACT_MATRIX.md
```

Stop rules:
- Stop if either repo path does not exist.
- Stop if the working tree has unexpected dirty app-code files unrelated to this task.
- Stop if a route depends on secrets or production credentials to inspect.

Final report:
- Files read.
- Commands run.
- Whether docs were edited.
- Top P0/P1 findings.
- Exact routes that are already safe to build on.
- Exact routes that must not be expanded until contracts are fixed.
~~~

## Prompt 2: Auth, Onboarding, And Account Basics

~~~md
You are acting as five specialists in sequence:

1. Prompt engineer: enforce scope, stop rules, and verification.
2. Native auth engineer: review Expo/Supabase auth flows.
3. Store compliance reviewer: check Apple Sign-In, account deletion, privacy, terms, support, and permission timing.
4. Supabase security engineer: verify auth identity and protected API contracts.
5. Mobile QA engineer: define manual smoke paths.

Objective:
Implement or produce a precise gap report for native auth, onboarding, profile basics, and account deletion so new users do not bypass onboarding and store-required account controls exist.

Repos:
- Web/API source of truth: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native implementation repo: `/Users/Business(C)/shoonaya-mobile`

Required reading:
- Web: `SHOONAYA_RULES.md`, `PRODUCT_CONSOLIDATION_PLAN.md`, `docs/NATIVE_APP_AGENT_RULES.md`, `docs/NATIVE_APP_DECISIONS.md`, `docs/NATIVE_APP_PHASE_1_PARITY_PLAN.md`
- Native: `app/(auth)/login.tsx`, `app/(auth)/onboarding.tsx`, `app/(auth)/otp.tsx`, `app/(auth)/whatsapp.tsx`, `app/(tabs)/profile.tsx`, `app/settings.tsx`, `app/_layout.tsx`, `lib/supabase.ts`, `lib/api.ts`
- Web/API: `src/app/api/user/delete/route.ts`, auth/onboarding/profile code found by `rg -n "onboarding|tradition|deleteUser|terms|privacy|Google|Apple|OAuth" src app`

Allowed edits:
- Native repo auth/onboarding/profile/settings files only.
- Web repo API/docs only if a missing API contract blocks the native flow.
- Do not change Supabase policies unless a new P0 is discovered and reported first.

Implementation requirements:
- New Google/email signups must route through onboarding when required profile fields are missing.
- Existing users with completed onboarding must land in the app shell.
- If Google/social auth is enabled on iOS, Apple Sign-In must be present or the prompt must stop with a compliance blocker.
- Terms/privacy acceptance must be consistently handled for email and OAuth paths.
- Account deletion must call the secure web API route using the authenticated user identity, not a client-supplied user id.
- Permission prompts must be contextual and not fired on first launch without intent.
- No server secrets in `EXPO_PUBLIC_` or native code.

Verification commands:
```bash
cd "/Users/Business(C)/shoonaya-mobile" && npm run typecheck
cd "/Users/Business(C)/shoonaya-mobile" && npx expo-doctor
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && npm run lint
```

Manual smoke checklist:
- Fresh email signup reaches onboarding.
- Fresh Google signup reaches onboarding.
- Existing completed user reaches tabs.
- Terms/privacy UI is visible before account creation or OAuth intent.
- Account deletion screen requires confirmation and calls the API with bearer auth.
- Logout clears session and returns to auth.

Stop rules:
- Stop if a required auth callback URL or provider secret is missing.
- Stop if account deletion requires production credentials to test.
- Stop if implementation would bypass RLS or trust client-supplied user ids.

Final report:
- Files changed.
- Exact auth/onboarding decision logic.
- Store-compliance status.
- Verification results.
- Any manual smoke steps that could not be run and why.
~~~

## Prompt 3: Native Shell And Home Next Action

~~~md
You are acting as five specialists in sequence:

1. Prompt engineer: keep the slice focused on native shell and Home only.
2. Mobile product designer: apply Shoonaya's one-next-action Home principle.
3. Expo UI engineer: implement safe-area, tabs, native navigation, accessibility, and loading states.
4. Native data-fetching engineer: use API/shared contracts and avoid local duplicated domain logic.
5. QA/accessibility reviewer: verify touch targets, labels, reduced motion, and error states.

Objective:
Create or refine the native app shell and Home route so the first signed-in screen shows one clear next action and routes correctly into core practice surfaces.

Repos:
- Native implementation repo: `/Users/Business(C)/shoonaya-mobile`
- Web source for product behavior: `/Users/Business(C)/Sanatan Sangam/Shoonaya`

Required reading:
- Web: `SHOONAYA_RULES.md`, `PRODUCT_CONSOLIDATION_PLAN.md`, `docs/NATIVE_APP_AGENT_RULES.md`, `docs/NATIVE_APP_DECISIONS.md`, `docs/NATIVE_APP_PHASE_1_PARITY_PLAN.md`
- Native: `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `components/ui/*`, `components/providers/AppProviders.tsx`, `lib/api.ts`, `lib/supabase.ts`, `lib/notifications.ts`
- Web Home references only as behavior guidance, not copy-paste: search `rg -n "NextPractice|Next Practice|HomeDashboard|Sankalpa" src`

Allowed edits:
- Native shell/Home/components/hooks only.
- Do not edit web app UI.
- Do not add new dependencies without checking `package.json` and justifying the need.

Implementation requirements:
- Home must prioritize one next action, not a dashboard of competing nudges.
- Bottom tabs must respect product hierarchy: Home, Pathshala, Bhakti, Kul/Profile access; Mandali/Tirtha stay contextual unless a product decision says otherwise.
- Use native controls with accessible labels; no clickable text-only `View` without role.
- Handle partial profile, loading, empty, and API failure states.
- Use existing design tokens/components where present.
- Do not duplicate Panchang/Pathshala/Sadhana rules locally.

Verification commands:
```bash
cd "/Users/Business(C)/shoonaya-mobile" && npm run typecheck
cd "/Users/Business(C)/shoonaya-mobile" && npx expo-doctor
```

Manual smoke checklist:
- Signed-out user does not see Home.
- Signed-in user sees one primary next action.
- Primary next action route opens without crash.
- Bottom tab labels and icons are visible and reachable.
- Home remains usable with no network response.

Stop rules:
- Stop if tab shape conflicts with a product decision not documented in `NATIVE_APP_DECISIONS.md`.
- Stop if Home needs a missing API contract and scope forbids web edits.
- Stop if the implementation would leave a dead tab or blank card.

Final report:
- Files changed.
- Route behavior before/after.
- Accessibility notes.
- Verification results.
- Remaining route gaps.
~~~

## Prompt 4: Core Practice Contract Migration

~~~md
You are acting as six specialists in sequence:

1. Prompt engineer: prevent broad rewrites and require deletion of replaced dead code.
2. Shared-package migration engineer: verify package portability before wiring.
3. Native data-fetching engineer: design fetch/cache/error behavior.
4. Dharmic content integrity reviewer: ensure content source does not drift from canonical web data.
5. Expo UI engineer: preserve native ergonomics.
6. QA engineer: prove replaced local logic is not still used.

Objective:
Start Phase 1 core practice migration by auditing and replacing native local duplicated domain logic for Pathshala and Panchang where safe. Produce a gap report for Sadhana if storage adapters are not ready.

Repos:
- Web/shared packages: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native repo: `/Users/Business(C)/shoonaya-mobile`

Required reading:
- Web: `docs/NATIVE_APP_PHASE_1_PARITY_PLAN.md`, `packages/*/package.json`, `packages/panchang-engine`, `packages/pathshala-engine`, and package source files needed to confirm browser/native assumptions
- Native: `app/(tabs)/pathshala.tsx`, `app/pathshala/[pathId].tsx`, `app/pathshala/[pathId]/[lessonId].tsx`, `app/panchang.tsx`, `lib/panchang.ts`, `lib/pathshala-lessons.ts`, `lib/pathshala-paths.ts`, `lib/api.ts`

Allowed edits:
- Prefer a first read-only audit. If implementation is safe, edit only native Pathshala/Panchang files and package import/config files required for those imports.
- Do not change package source in the web repo without a separate shared-package adapter plan.
- Do not remove local fallback files until imports and runtime behavior are verified.

Implementation requirements:
- Verify whether `@sangam/panchang-engine` and `@sangam/pathshala-engine` can be consumed by the native repo today.
- If package linking is not ready, write the exact blocker and do not hand-roll a third implementation.
- Replace native local logic only when the shared package/API path is proven.
- Delete or quarantine replaced local fixture files in the same change.
- Keep stale/offline states explicit.

Verification commands:
```bash
cd "/Users/Business(C)/shoonaya-mobile" && npm run typecheck
cd "/Users/Business(C)/shoonaya-mobile" && npx expo-doctor
cd "/Users/Business(C)/shoonaya-mobile" && rg -n "lib/panchang|pathshala-lessons|pathshala-paths" app lib components hooks
```

Stop rules:
- Stop if shared package consumption model is undecided and implementation would require ad hoc copying.
- Stop if package import introduces Node/browser-only APIs into native.
- Stop if sacred-content output changes without a content-review note.

Final report:
- Package portability verdict.
- Files changed or blocker report.
- Duplicated native logic removed or still pending.
- Verification results.
- Next slice recommendation.
~~~

## Prompt 5: Mandali And Tirtha Production Polish

~~~md
You are acting as six specialists in sequence:

1. Prompt engineer: enforce Phase 0 security boundaries.
2. Supabase security engineer: verify RLS/API boundaries before edits.
3. Native data-fetching engineer: review mutations and cache invalidation.
4. Location/privacy reviewer: check permission timing and manual fallback.
5. Expo UI engineer: improve empty/loading/error states without redesigning product direction.
6. QA engineer: verify no direct canonical writes reappear.

Objective:
Stabilize native Mandali and Tirtha flows for Phase 1 without reopening Phase 0 vulnerabilities.

Repos:
- Web/API/Supabase: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native: `/Users/Business(C)/shoonaya-mobile`

Required reading:
- Web docs: `docs/NATIVE_APP_AGENT_RULES.md`, `docs/NATIVE_APP_PHASE_1_PARITY_PLAN.md`, `docs/testing/RLS_TESTING.md`
- Web API/migrations: `src/app/api/tirtha/place/route.ts`, `scripts/verify-rls.ts`, relevant `supabase/migrations/*tirtha*`, relevant `supabase/migrations/*mandali*`
- Native: `app/(tabs)/tirtha.tsx`, `components/tirtha/TempleCard.tsx`, `app/mandali.tsx`, `lib/api.ts`, `lib/supabase.ts`, `lib/overpass.ts`, `lib/diaspora-temples.ts`

Allowed edits:
- Native Mandali/Tirtha files.
- Web API/RLS tests only if a verified contract gap blocks safe native behavior.

Implementation requirements:
- Native must not directly insert/update canonical `tirtha_places`.
- Tirtha import must use `/api/tirtha/place` or the approved secure contract.
- Saves/checkins/reports/blocks must enforce authenticated ownership.
- Location permission must be user-initiated and have a manual city/search fallback.
- Blank cards must become useful empty states with one clear next action.
- Do not create mobile admin/moderation screens.

Verification commands:
```bash
cd "/Users/Business(C)/shoonaya-mobile" && npm run typecheck
cd "/Users/Business(C)/shoonaya-mobile" && rg -n "from\\('tirtha_places'\\)|from\\(\"tirtha_places\"\\)|upsert\\(|insert\\(|update\\(" "app/(tabs)/tirtha.tsx" "app/mandali.tsx" lib components
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && DRY_RUN=true npx tsx scripts/verify-rls.ts
```

Stop rules:
- Stop if a needed API route does not exist and the prompt scope forbids web edits.
- Stop if a mutation writes global/canonical data from native client credentials.
- Stop if location behavior cannot be tested without production-only credentials.

Final report:
- Files changed.
- Mutation map before/after.
- Permission behavior.
- Verification results.
- Remaining backend/API blockers.
~~~

## Prompt 6: Native Service ADRs

~~~md
You are acting as seven specialists in sequence:

1. Prompt engineer: keep this as architecture documentation unless explicitly approved to code.
2. Android engineer: check Android package, permissions, notification channels, and signing implications.
3. iOS engineer: check Apple Sign-In, permissions, deep links, and review implications.
4. Expo deployment engineer: review EAS Build, EAS Update, and dev-client needs.
5. Native storage engineer: choose SecureStore/MMKV/SQLite/AsyncStorage boundaries.
6. Observability engineer: propose crash/error/release-health setup.
7. Supabase/backend engineer: ensure service decisions do not leak secrets or bypass API/RLS.

Objective:
Create ADRs for native services before broader Phase 1 implementation: storage, notifications, observability, OTA updates, and Android/iOS release basics.

Repos:
- Web/API source: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native repo: `/Users/Business(C)/shoonaya-mobile`

Required reading:
- Web: `docs/NATIVE_APP_DECISIONS.md`, `docs/NATIVE_APP_PHASE_1_PARITY_PLAN.md`, `docs/NOTIFICATION_ARCHITECTURE_AUDIT.md`, `APP_STORE_READINESS_AUDIT.md`, `PERMISSION_TIMING_AUDIT.md` if present
- Native: `app.json` or `app.config.*`, `package.json`, `lib/notifications.ts`, `lib/supabase.ts`, `app/_layout.tsx`, Android/iOS config if present

Allowed edits:
- Add docs only under `/Users/Business(C)/Sanatan Sangam/Shoonaya/docs/native-adrs/`
- Do not edit app code.
- Do not install packages.
- Do not change EAS or native config yet.

ADR files to create:
- `docs/native-adrs/001-storage.md`
- `docs/native-adrs/002-notifications.md`
- `docs/native-adrs/003-observability.md`
- `docs/native-adrs/004-ota-updates.md`
- `docs/native-adrs/005-android-ios-release.md`

Each ADR must include:
- Status: Proposed
- Context
- Decision
- Alternatives considered
- Security/privacy impact
- Store-compliance impact
- Implementation tasks
- Verification plan
- Open questions

Verification commands:
```bash
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && git diff -- docs/native-adrs
cd "/Users/Business(C)/shoonaya-mobile" && npx expo-doctor
```

Stop rules:
- Stop if the native repo path cannot be verified.
- Stop if a decision requires paid account/dashboard access that is unavailable.
- Stop if existing docs contradict each other on provider choice; report the conflict instead of choosing silently.

Final report:
- ADRs created.
- Decisions proposed.
- Dependencies and blockers.
- What must be implemented next.
~~~

## Prompt 7: Specialist Review After Each Slice

~~~md
You are acting as a strict reviewer, not an implementer.

Specialist roles:
1. Prompt engineer: check whether the original prompt was followed exactly.
2. Senior Expo engineer: review native correctness and route behavior.
3. Supabase security engineer: review data access and RLS/API boundaries.
4. Mobile accessibility reviewer: review controls, labels, touch targets, loading/error states.
5. QA engineer: verify commands, manual smoke paths, and regression risk.

Objective:
Review the completed slice and decide PASS, PASS WITH FIXES, or FAIL. If findings are small and safe, fix them. If findings change scope, stop and report.

Required inputs:
- The original assigned prompt.
- The agent's final report.
- Current git diff in both repos.

Required commands:
```bash
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && git status --short --branch && git diff --stat
cd "/Users/Business(C)/shoonaya-mobile" && git status --short --branch && git diff --stat
cd "/Users/Business(C)/shoonaya-mobile" && npm run typecheck
```

Add these when web/API/Supabase changed:
```bash
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && npm run lint
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && npm run build
cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && DRY_RUN=true npx tsx scripts/verify-rls.ts
```

Review checklist:
- Did the agent edit only allowed files?
- Did it leave dead replaced code?
- Did it introduce direct canonical/global writes from native?
- Did it duplicate shared domain logic?
- Did it expose secrets in native code?
- Did it break onboarding/auth/account deletion/store requirements?
- Did typecheck pass?
- Are manual smoke steps specific enough to run?

Finding format:
- Severity: P0/P1/P2
- Evidence: path and line/function
- Impact
- Required fix

Final verdict:
- PASS: no required fixes.
- PASS WITH FIXES: only small fixes were applied and verified.
- FAIL: scope breach, security issue, broken verification, or unresolved P0/P1.
~~~
