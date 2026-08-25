# Antigravity Legal Engineering Remediation Runbook

**Purpose:** Close the engineering findings recorded in
`docs/LEGAL_RISK_ASSESSMENT.md` without turning an engineering agent into
legal counsel, weakening existing product behavior, or making an unaudited
production change.

**Repositories:**

- Backend/PWA: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native: `/Users/Business(C)/shoonaya-mobile`

Run these prompts **sequentially**. Stop after every prompt and obtain an
independent review before continuing. Prompt 1 is the urgent security gate.
Do not batch these into one implementation or one commit.

## Shared Preamble For Every Prompt

Copy this preamble above each prompt when running it in Antigravity:

```text
Work as a principal security, privacy, Supabase and cross-platform engineer.

Read first:
- AGENTS.md, ANTIGRAVITY.md, SHOONAYA_WORKFLOW.md and SHOONAYA_RULES.md
- docs/LEGAL_RISK_ASSESSMENT.md
- .claude/agents/shoonaya-supabase-backend-engineer.md
- .claude/agents/shoonaya-qa-test-engineer.md
- both repository git statuses and all code on the affected execution path

Binding rules:
1. Inspect before asserting. Prove claims with commands, queries, tests or
   programmatic diffs. Do not repeat the assessment narrative as evidence.
2. Trace every affected path end to end:
   UI -> local state -> request -> auth -> route -> query/RPC -> RLS/grants ->
   response -> cache/state -> user-visible result.
3. Never print, export or commit production PII, access tokens, secrets, row
   contents, emails, coordinates, dates of birth or religious-profile data.
   Aggregate counts and metadata only.
4. Production is read-only unless the founder gives explicit approval in the
   current chat for the exact migration/deploy. Build and test migrations on a
   local/shadow database or Supabase branch first. Do not create a billable
   Supabase branch without approval.
5. Do not invent legal rules, consent wording, age thresholds, retention
   periods, lawful bases, Article 9 conditions, jurisdictions, breach
   conclusions or store declarations. Represent unresolved policy choices as
   explicit decision gates and stop when a decision is required.
6. Preserve unrelated and parallel work. Do not modify, stage, commit or
   revert files outside this prompt's scope. Calendar rules, materialisation,
   AI providers, sacred content and notification schedules are out of scope.
7. One scoped objective and one scoped commit. Do not push, deploy, run paid
   infrastructure, apply production migrations, send notifications or submit
   store forms.
8. No `any`, no client-trusted user IDs, no service-role key in client code,
   no SECURITY DEFINER function exposed broadly, no `SELECT *` public profile
   projection, and no consent defaults that imply an unanswered choice.
9. A checkbox, toggle, banner, policy link or UI state is not enforcement.
   Prove server/database behavior and withdrawal/revocation behavior.
10. For every reported test result include passed, failed and skipped counts.
    Run focused tests, both repo typechecks where shared contracts change,
    git diff --check, git status --short, and `graphify update .` after code
    changes. Report every touched file, including files outside expected scope.
11. Before editing, present: ground truth, blast radius, proposed contract,
    forbidden changes, test plan and unresolved legal/product decisions.
12. After editing, present: changed files, migrations and rollback guidance,
    verification receipts, environment state (unapplied/applied), remaining
    risks and the exact independent-review gate. Stop after the prompt.
```

---

## Prompt 0 - Machine-Generated Privacy And Security Baseline

```text
Create a reproducible engineering baseline for the legal-risk remediation.
This prompt is inventory only. Do not change application behavior, schema,
policies, legal copy, SDK configuration or store declarations.

Required:
1. Generate a machine-readable inventory of:
   - sensitive profile fields and every read/write path in PWA and Native;
   - public schemas, table/view grants, RLS policies and RPC execute grants;
   - analytics, advertising, push, auth, payments, AI and infrastructure SDKs;
   - browser cookies/localStorage/AsyncStorage/cache keys involving identity;
   - all DOB, birthplace, device-location and guest-session entry points;
   - terms/privacy acceptance surfaces and any persisted receipts;
   - Mandali UGC creation, display, report, block and moderation paths;
   - account deletion, export and retention jobs.
2. Compare the source inventory with the live database metadata using only
   aggregate/schema queries. Never query or print profile row values.
3. Mark each result as VERIFIED, NOT FOUND, DRIFT or NEEDS POLICY DECISION.
4. Commit one script that regenerates JSON plus a concise Markdown report.
   Narrative counts must be derived from that script, never hardcoded.
5. Record canonical ownership for every shared contract: backend, Native or
   generated snapshot.

Acceptance:
- Running one documented command regenerates the inventory deterministically.
- No production data or secrets appear in output or git diff.
- No product behavior changes.
- Stop for independent review before Prompt 1.
```

## Prompt 1 - P0 Profiles Exposure Containment

```text
Remediate the confirmed public-read exposure of the `profiles` table. Treat
this as a P0 security change. Do not apply it to production in this prompt.

First prove the current state without selecting user data:
- table/view grants;
- RLS enabled/forced state;
- policy expressions and roles;
- dependent views, RPCs, routes, joins and direct client queries in both repos;
- anonymous access-log metadata if available without exposing identifiers.

Design constraints:
1. The base `profiles` table must become private. An authenticated user may
   read/update only their own permitted profile fields; privileged server/admin
   paths must remain explicit and audited.
2. If public profile data is a real product requirement, expose a narrowly
   typed projection containing only an approved allowlist such as public
   display name, avatar and public bio. Never expose sensitive columns and
   never use `SELECT *`.
3. Do not assume a `security_invoker` view automatically solves public access:
   prove how its caller can obtain only the allowed projection while the base
   table remains private. Prefer a dedicated public-profile relation or a
   narrowly scoped, parameterized RPC when that is safer.
4. Inventory and update every legitimate consumer. Do not silently break
   Mandali, admin tools, notifications, onboarding, profile editing or Native.
5. Include an additive migration, rollback guidance, generated database types
   and a deployment sequence that avoids an exposure window.

Required negative tests on a shadow/local database:
- anon cannot select any row or sensitive column from base `profiles`;
- authenticated user A cannot read/update user B;
- authenticated user can read/update their own allowed fields;
- public projection contains exactly the allowlist and no sensitive columns;
- broad REST/RPC enumeration and omitted-filter calls fail closed;
- service/admin behavior remains server-only;
- grants and policies are verified from PostgreSQL metadata, not inferred.

Incident evidence:
- Produce aggregate-only instructions for checking whether anonymous profile
  access occurred. Do not decide whether this is legally reportable and do not
  erase logs. Mark counsel/breach assessment as an external decision gate.

Stop after committing the unapplied migration, tests and deployment runbook.
Do not apply or deploy until independently reviewed and explicitly approved.
```

## Prompt 2 - Enforced Religious-Profile Consent Contract

```text
Replace the disconnected, default-on religious-data Settings toggle with an
enforced, versioned consent contract across onboarding, profile completion,
Settings, backend routes and database writes.

Before code, produce a decision table and stop if these product/legal rules are
not explicitly approved: covered fields, consent purpose/version, behavior when
declined, behavior on withdrawal, retention/deletion of previously supplied
data, and whether any fields are necessary for a user-requested feature.

Once decisions exist:
1. No unanswered/default state may be represented as consent=true.
2. Consent must be affirmative, purpose-specific, versioned and timestamped.
   Record source surface and policy version; do not store decorative UI state.
3. Server routes must reject or omit covered writes without valid consent.
   Client hiding alone is insufficient.
4. Declining must preserve a usable generic experience and must not create
   tradition/profile-qualified caches under false defaults.
5. Withdrawal must use the approved data-handling rule, clear affected private
   caches, and prevent future collection. Do not invent deletion semantics.
6. Keep religious-data consent distinct from Terms acceptance, privacy notice
   acknowledgement, notification permission and analytics consent.
7. Existing records require a migration/backfill strategy that does not
   fabricate historical consent.

Test signed-out, guest, new user, returning legacy user, declined, accepted,
withdrawn, account switch, offline/retry and concurrent submissions. Verify
both Native and PWA use one backend-owned contract.

Do not alter founder copy, calendar profiles or onboarding visual design beyond
what is required to present an approved consent decision.
```

## Prompt 3 - Web Consent Manager And Pre-Consent Tracker Blocking

```text
Implement real web consent enforcement for GA4, AdSense, OneSignal and other
non-essential browser technologies. A banner without script blocking fails.

Required:
1. Inventory every script, SDK, cookie, localStorage key, network endpoint and
   server-side event before choosing categories.
2. Separate strictly necessary, analytics, advertising and push/engagement.
   Do not classify a vendor as necessary merely because it is already loaded.
3. Before an affirmative choice, non-essential scripts must not be injected,
   initialized, called or set identifiers. Remove the hardcoded GA fallback;
   absence of configuration must fail closed.
4. Necessary auth/session behavior must continue working without consent.
5. Provide granular accept/reject/customize, persistent preference versioning,
   withdrawal and reopening from Settings/footer. Reject must be as easy as
   accept.
6. Consent Mode, if retained, is supplemental and must not replace actual
   blocking where required by the approved policy.
7. Do not conflate web push permission with tracking consent.

Regression tests must prove:
- globals/scripts/network calls are absent before consent;
- reject keeps them absent;
- category-specific accept enables only that category;
- withdrawal disables future initialization and clears only approved keys;
- SSR/hydration and browsers without Notification/storage APIs do not crash;
- auth, legal pages and accessibility work with JavaScript/storage constraints.

Do not change policy wording or claim jurisdictional compliance. Output a
vendor/category table for counsel review.
```

## Prompt 4 - Native Analytics Decision And Store-Safe Enforcement

```text
Audit and remediate Native Firebase Analytics without affecting Firebase app
registration, Expo notifications or Android FCM V1 delivery.

First present two scoped options with measured blast radius:
A. Remove Native Firebase Analytics entirely.
B. Retain Android-only analytics but disable collection before the first event,
   enable only after valid analytics consent, and support withdrawal.

Do not choose silently. If the founder has not selected A or B, stop with the
decision packet. If B is approved:
- prove native startup does not emit an automatic event before consent;
- call the existing analytics enable/disable API from one canonical consent
  state, not scattered UI toggles;
- keep events free of PII, DOB, coordinates, religion/tradition, free text,
  mantra/journal content and stable sensitive identifiers;
- clear user properties and reset analytics data on withdrawal/account switch
  where supported;
- document Android-only scope and verify iOS has no equivalent SDK path;
- verify removal/disablement does not affect google-services registration,
  Expo push token generation or FCM credentials.

Generate exact App Store/Play declaration evidence from the resulting code.
Do not add ATT unless an actual cross-company tracking use is proven.
```

## Prompt 5 - Centralized Age And Birth-Data Safety Gate

```text
Audit every DOB/birth-time/birthplace flow and implement one backend-enforced
age-policy boundary for guest and authenticated users.

Do not invent the legal threshold. Build a typed policy configuration only
after the founder/counsel supplies target markets, minimum ages and parental-
consent behavior. If unresolved, complete the inventory and contract proposal,
then stop before enforcement code.

Required once approved:
1. Server enforcement on every write/calculation path, including
   `/api/jyotish/chart`; UI validation is supplemental.
2. Distinguish account-holder age from a chart subject's DOB and relationship.
3. Use a non-bypassable, versioned policy with explicit region/unknown-region
   behavior. Never trust a client-claimed country without documenting the
   source and fallback.
4. Guest session tokens need sufficient entropy, expiry, rotation/rate limits,
   ownership isolation and a documented retention/deletion path.
5. Do not leak whether another person's birth profile exists.
6. Existing potentially underage records get aggregate-only assessment and a
   review/quarantine plan, not automatic production deletion.

Test boundary dates, timezone/date rollover, missing country, spoofed payload,
guest/auth parity, retries, expired tokens and concurrent requests.
```

## Prompt 6 - Versioned Terms Acceptance And Privacy Acknowledgement

```text
Implement durable, auditable acceptance of the applicable Terms across Native
and PWA without treating a passive sentence as proof of contract formation.

Before coding, obtain approved Terms version identifiers and acceptance copy.
Do not draft legal text.

Required:
- append-only acceptance receipt with user, document type/version, accepted_at,
  surface/client and locale; identity derived server-side;
- separate Terms acceptance from privacy-notice acknowledgement and optional
  consents;
- cover email, Google, Apple, OTP, existing-user reacceptance and guest upgrade;
- prevent protected account creation/completion when required acceptance has
  not occurred, while keeping legal pages reachable;
- idempotent writes and concurrency-safe uniqueness;
- no fake backfill of historical acceptance;
- admin/export evidence without exposing unrelated user data;
- policy-version update mechanism and explicit reacceptance rules supplied by
  product/legal, not inferred by engineering.

Test altered payload user IDs, double taps, OAuth callback continuation,
offline retry, old-version accounts and acceptance-service failure.
```

## Prompt 7 - Mandali UGC Safety And Moderation Verification

```text
Perform an end-to-end Mandali UGC safety audit, then implement only verified
gaps required for filtering, reporting, blocking, published contact and timely
moderation handling. Do not duplicate existing features.

Trace post/comment creation -> validation -> storage -> feed query -> report ->
block -> moderation queue -> enforcement -> appeal/audit trail.

Required:
- server-side validation and rate limits for posts/comments/reports;
- report reason taxonomy plus free-text handling appropriate for PII safety;
- block must prevent both discovery and interaction consistently;
- blocked/reported/removed content must not survive through caches or alternate
  feed endpoints;
- moderator authorization enforced by RLS/server role, not client UI;
- immutable moderation audit metadata without publicly exposing moderators;
- published support/contact path and operational queue visibility;
- account sanctions must not alter sacred/calendar data or unrelated users;
- multilingual and media/link abuse cases included.

Test user A/B isolation, blocked-user symmetry, report spam, deleted accounts,
legacy content, admin privilege escalation, pagination/cache bypass and errors.
Produce an App Review evidence checklist but do not claim guideline approval.
```

## Prompt 8 - Retention, Withdrawal And Deletion Enforcement

```text
Create and enforce a backend-owned data lifecycle registry for every personal
data category discovered in Prompt 0. Legal/product must approve each retention
period and exception before destructive behavior is implemented.

Required:
1. Map category -> purpose -> storage locations -> processor -> approved
   retention trigger/period -> deletion/anonymization job -> exception.
2. Cover guest birth profiles, inactive push tokens, analytics identifiers,
   notification deliveries, consent/Terms receipts, exports, moderation audit,
   AI requests, caches, uploads and backups/processor deletion limitations.
3. Integrate with the existing 30-day account-deletion workflow rather than
   adding a competing deletion system.
4. Use idempotent, resumable jobs with dry-run counts and audit receipts.
5. Verify cancellation before final deletion and test partial failures/retries.
6. Consent withdrawal is not automatically account deletion; use the approved
   field-specific rule from Prompt 2.
7. Never run cleanup against production in this prompt.

Build shadow fixtures proving complete deletion/anonymization and absence from
normal reads after completion. Document what backups/processors cannot delete
immediately as an external policy disclosure requirement.
```

## Prompt 9 - Apple Privacy Manifest And Store Data Declarations

```text
Generate store-disclosure evidence from the actual code and data inventory,
then correct technical declarations without guessing answers.

Required:
- enumerate Native permissions, APIs, SDKs, data categories, purpose, linkage,
  tracking status and optional/required collection;
- reconcile iOS `PrivacyInfo.xcprivacy` with app-owned collection and SDK
  manifests; keep the source configuration durable across Expo prebuild;
- verify Required Reason APIs from the final native dependency graph;
- produce a field-by-field App Store privacy questionnaire worksheet;
- produce the equivalent Google Play Data Safety worksheet;
- distinguish Android Firebase Analytics from Firebase/FCM app registration;
- confirm ATT is needed only if cross-company tracking/attribution is actually
  present; do not add it prophylactically;
- compare generated iOS/Android native projects after prebuild and detect drift.

Do not submit forms or assert legal correctness. Unknown items must remain
UNKNOWN with the evidence needed to decide. Verify local iOS and Android config
generation, but do not start EAS builds in this prompt.
```

## Prompt 10 - Public Content Provenance And Copyright Disclosure

```text
Add a user-facing, factual content provenance/source disclosure surface derived
from existing source-governance metadata. This is an engineering transparency
task, not permission to rewrite rights classifications.

Required:
- inventory all live scriptures, translations, kathas, Dharm Veer sources,
  generated explanations and third-party media;
- expose source title, author/translator, edition/link and rights label only
  where verified metadata exists;
- clearly distinguish verbatim source, licensed content, public-domain text,
  Shoonaya-curated retelling and AI-generated explanation;
- fail closed for missing or contradictory metadata; do not fabricate a source;
- use one backend-owned contract shared by PWA and Native;
- provide a legal/footer entry point and contextual citations where available;
- add tests preventing unpublished/uncleared content from appearing live.

Do not change scripture text, rights status, source tiers or council decisions.
Route unresolved rights cases to the existing editorial review process.
```

## Prompt 11 - Compliance Drift CI And Release Evidence

```text
Add deterministic CI checks that detect drift between implemented behavior and
the engineering evidence produced by Prompts 0-10. Do not encode legal opinions
as passing assertions.

Checks should fail on factual contradictions such as:
- public grants/policies reappearing on private profile data;
- a sensitive field added without inventory classification;
- analytics/ad/push scripts initialized before their approved gate;
- consent defaults true or protected writes bypassing consent enforcement;
- a new DOB/location route bypassing the centralized age policy;
- legal document version changed without receipt/version configuration;
- Native permission/SDK drift from Apple/Play evidence manifests;
- UGC write route without moderation/report/block coverage;
- retention job added without registry ownership;
- public content lacking required source/rights metadata.

Requirements:
- scripts generate conclusions from source/schema, not hardcoded narrative;
- CI uses local test schema/fixtures and never production PII or secrets;
- failures explain the exact field/route/SDK causing drift;
- developers can run the same commands locally;
- document which checks are factual engineering gates and which items still
  require human counsel/store review.

Run both repo typechecks, targeted suites, production build where feasible,
git diff --check and graphify. Report pass/fail/skipped honestly. Stop before
commit/push unless explicitly asked.
```

## Prompt 12 - Final Engineering Closure Audit

```text
Independently review Prompts 0-11 as a release gate. Do not rely on their
completion summaries. Re-run the generators, adversarial tests and end-to-end
traces against clean working trees and a fresh local/shadow database.

Report findings first, ordered P0-P3, with exact files/lines and reproduction.
For every risk-register item mark:
- CLOSED BY ENGINEERING;
- ENGINEERING COMPLETE / LEGAL DECISION PENDING;
- STORE OR OPERATIONAL ACTION PENDING;
- OPEN DEFECT;
- NOT APPLICABLE, with evidence.

Verify production state separately from committed code and deployment state.
Do not call an unapplied migration, unpushed commit, undeployed route, unfilled
store form or unreviewed legal choice complete. Produce a concise founder
checklist for the remaining manual actions. Make no code changes during this
audit unless the founder separately requests remediation.
```

## Execution Order And Gates

1. Run Prompt 0.
2. Run Prompt 1 and obtain independent security review.
3. With explicit approval, apply/deploy Prompt 1 using its reviewed runbook;
   then verify production metadata and aggregate logs.
4. Run Prompts 2 and 5 only after their legal/product decision tables are
   approved. They must not guess policy.
5. Prompts 3 and 4 can proceed in parallel only after the analytics/consent
   category decisions are aligned.
6. Run Prompt 6 after approved Terms versions/copy exist.
7. Prompts 7-10 may proceed independently after Prompt 0 inventory is approved.
8. Run Prompt 11 after the underlying contracts stabilize.
9. Prompt 12 is the final independent engineering closure audit.

**Manual work that these prompts cannot close:** breach-reportability advice,
lawful-basis/Article 9 selection, age thresholds and parental-consent policy,
retention periods, governing law/jurisdiction, legal copy approval, DPO status,
store-form submission and regulator/store acceptance.
