# Native App Agent Rules

Last updated: 2026-07-03

These rules control all agent work for Shoonaya native app parity planning.

## Read Order

Every agent must read these files before producing recommendations or edits:

1. `SHOONAYA_RULES.md`
2. `PRODUCT_CONSOLIDATION_PLAN.md`
3. `docs/NATIVE_APP_PARITY_BLUEPRINT.md`
4. This file
5. The assigned prompt file for the task

If a file is missing, stop and report that before continuing.

## Operating Principle

Native app owns experience. Shared platform owns truth.

Agents must preserve this separation:

- Expo / React Native owns native navigation, screens, gestures, permissions, and device UX.
- Supabase, API routes, and shared TypeScript packages own domain truth.
- Native screens must not duplicate Panchang, Pathshala, Sadhana, entitlement, notification, or sacred-content logic when a shared package or API contract exists.

## Default Mode

Default mode is read-only audit.

An agent may edit files only when the assigned prompt explicitly says edits are allowed. If edits are allowed, the agent must keep them inside the named files or named directory scope.

## Evidence Standard

Every finding must cite concrete evidence:

- file path
- line number or route/table/function name
- observed behavior or exact mismatch
- impact on native parity, store readiness, maintainability, or user experience

Do not make claims from memory, taste, or product intuition without repo evidence.

## Severity Scale

- P0: blocks Phase 0 sign-off, store submission, security, data integrity, or core architecture.
- P1: likely causes rework, user-visible parity gaps, duplicated logic, or compliance risk.
- P2: useful improvement or documentation clarification that should not block immediate planning.

## Forbidden Actions

Agents must not:

- make broad code edits during audit prompts
- stage, commit, push, reset, or delete files unless explicitly instructed
- revive the deprecated Capacitor wrapper path
- mix native Android/iOS scaffolding into the web repo without an accepted architecture decision
- rewrite product direction without citing an existing product doc or asking for a decision
- invent provider choices where the repo already has a direction
- assume a skill, package, plugin, native module, or service exists without verifying it
- add a second implementation of existing shared domain logic
- put server secrets in `EXPO_PUBLIC_` or native client code
- bypass RLS or client-safe API boundaries
- recommend Razorpay-in-WebView for native paid digital content
- treat Apple Sign-In as optional if Google or equivalent social login ships on iOS
- collapse distinct route groups or products without an explicit product decision
- leave dead legacy code in place after replacing a flow

## Product Hierarchy Guardrails

Respect `PRODUCT_CONSOLIDATION_PLAN.md` unless the user explicitly changes it:

- Primary launch destinations: Home, Pathshala, Bhakti, Kul, Profile/progress access.
- Tirtha and Mandali are contextual destinations until usage proves one should become primary.
- Center action menu should stay small: Start mala, Today&apos;s nitya, Ask Dharma AI.
- Home should focus on one next action, not a dashboard of competing nudges.

## Store Compliance Guardrails

Native planning must include:

- in-app account deletion
- privacy, terms, support/contact
- permission purpose copy for notifications, location, microphone, camera/photos
- Apple Sign-In if iOS offers Google or equivalent social login
- restore/manage subscription if paid digital content ships
- entitlement reconciliation for existing web/Razorpay subscribers and native StoreKit/Play Billing subscribers
- reviewer notes and demo account

## Required Output Format

Audit agents must respond in this structure:

```md
# Findings

## P0
- [Title]
  Evidence:
  Impact:
  Required correction:

## P1
- [Title]
  Evidence:
  Impact:
  Required correction:

## P2
- [Title]
  Evidence:
  Impact:
  Suggested correction:

# Verified As Correct
- ...

# Open Questions
- ...

# Recommended Next Edits
- ...
```

If there are no findings at a severity level, write `None`.

## Stop Rules

Stop and ask for a decision if:

- the native repo path cannot be confirmed
- the web repo appears to contain active native scaffolding that conflicts with the standalone Expo plan
- live repo state contradicts the planning document in a product-critical way
- store policy conflicts with a proposed monetization flow
- a shared package is not portable and no adapter boundary exists
- entitlement truth is split across incompatible systems
- the task requires secrets or production credentials

## Final Handoff

Every agent must end with:

- files read
- commands run
- whether edits were made
- whether verification passed
- exact remaining blockers
