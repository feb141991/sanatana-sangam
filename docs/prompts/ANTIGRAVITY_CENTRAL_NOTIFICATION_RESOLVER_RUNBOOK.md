# Antigravity Runbook: Central Notification Candidate Resolver

Execute these prompts sequentially. Stop after each prompt for independent review. Do not
combine prompts, apply production migrations, deploy, trigger production notifications, or
change a feature flag without explicit founder approval.

Canonical backend/PWA repository:
`/Users/Business(C)/Sanatan Sangam/Shoonaya`

Native repository:
`/Users/Business(C)/shoonaya-mobile`

## Shared preamble for every prompt

- Read `AGENTS.md`, `SHOONAYA_WORKFLOW.md`, `SHOONAYA_RULES.md`, and the relevant
  `.claude/agents/*.md` files first.
- Inspect both repositories before asserting shared-contract behavior.
- Preserve the existing `notification_schedule`, atomic claim RPC,
  `notification-dispatch`, Expo delivery, receipt checking, token pruning, bell inbox,
  timezone helpers, quiet hours, dry-run controls, and audit tables.
- A producer may calculate eligibility/content and create a candidate. It must not send a
  push after it has migrated to the candidate pipeline.
- PostgreSQL triggers may insert an outbox/candidate row only when transactional atomicity
  is necessary. They must never perform HTTP or provider delivery.
- Never notify from unresolved, disputed, fallback, unaudited, unverified, withheld, or
  non-live calendar/content data.
- Never run legacy and candidate delivery simultaneously for one notification type.
- Derive identity server-side. Never accept a client-supplied user ID as authoritative.
- Treat timezone, local civil date, spiritual date, calendar profile, tradition,
  sampradaya, language, and location as separate dimensions.
- Every decision must be explainable through a structured audit reason.
- Report passed, failed, and skipped counts. Run `git diff --check` and
  `git status --short`. Do not stage unrelated dirty files.
- One scoped objective and one scoped commit per prompt. Do not push until independently
  reviewed.

---

## Prompt 0 - Ground-truth notification topology audit

Audit the complete notification system before changing behavior.

### Required

1. Produce a machine-generated inventory of every notification producer, including API
   route, schedule, source table, preference columns, timezone logic, quiet-hour logic,
   notification key shape, bell insertion, push call, deep link, dry-run support, retry
   path, and receipt path.
2. Classify each producer as:
   - `direct_send_legacy`
   - `notification_schedule_producer`
   - `transactional_event`
   - `admin_or_test`
   - `in_app_only`
3. Programmatically identify every import/call of `sendPushNotification()` and every write
   to `notifications` and `notification_schedule`.
4. Detect key collisions and semantic overlaps, especially festival/vrat/tithi and D-7,
   D-1, D0 occurrence reminders.
5. Inventory all existing preference columns and Native/PWA settings controls. Do not
   assume a preference exists because a cron checks a similarly named field.
6. Report whether current production migrations for `notification_schedule`, lease
   recovery, dispatch scheduling, and audit tables are applied. Read-only metadata only.
7. Generate:
   - `docs/notifications/NOTIFICATION_TOPOLOGY.json`
   - `docs/notifications/NOTIFICATION_TOPOLOGY.md`
   - one reproducible script and package command.

### Verification

- The Markdown must be generated from JSON, not maintained independently.
- Every count and conclusion must be printed by the script.
- No behavior changes.

Stop for review.

---

## Prompt 1 - Candidate and resolver database contracts

Create schema and types only. Do not migrate any producer.

### Required schema

Create `notification_candidates` with at least:

- `id`
- `user_id`
- `event_type`
- `event_id`
- `event_instance`
- `local_date`
- `audience_variant`
- `scheduled_for`
- `expires_at`
- `priority`
- `title`
- `body`
- `action_url`
- `language`
- `timezone`
- `tradition`
- `calendar_profile`
- `source_status`
- `source_refs`
- `metadata`
- `status`: `pending | accepted | suppressed | expired | cancelled`
- `decision_reason`
- `resolved_at`
- timestamps

Create `notification_resolver_events` as an append-only audit table containing candidate
identity, decision, reason, winning candidate where applicable, policy version, and time.

### Constraints

- Service-role-only writes and reads; RLS enabled and forced.
- No `anon` or `authenticated` grants.
- Structured semantic uniqueness, not only a free-form key:
  `(user_id, event_type, event_id, event_instance, local_date, audience_variant)`.
- Define explicit null semantics; do not use nullable identity columns that silently bypass
  uniqueness.
- Index pending resolution by status and scheduled time.
- Preserve existing `notification_schedule` schema and rows.
- Add migration, rollback under `supabase/rollbacks/`, regenerated DB types, and a real
  PostgreSQL shadow test. A fake Supabase client is insufficient for conflict targets,
  RLS, constraints, or null uniqueness.

Do not apply to production. Stop for review.

---

## Prompt 2 - Pure central resolver and policy contract

Implement the resolver as a deterministic, testable domain function. Do not wire crons.

### Policy

Default devotional budget per user/local spiritual date:

- maximum one routine engagement notification;
- maximum two total devotional notifications;
- approved time-sensitive ritual windows may override the routine slot;
- security, account, moderation, and transactional safety messages are outside this
  devotional budget;
- sent notifications cannot be displaced retroactively;
- candidates may be deferred only while `scheduled_for < expires_at`.

Default priority classes:

1. critical ritual window
2. same-day reviewed observance
3. explicit user reminder
4. streak rescue
5. learning/story engagement
6. non-urgent milestone

Store the policy in one versioned backend-owned module. Do not scatter numeric priorities
through producers.

### Resolver checks

- active account and deletion state;
- candidate completeness and expiry;
- per-type preference;
- tradition, sampradaya, profile, language, and region applicability;
- reviewed/live source status;
- valid timezone and local/spiritual date;
- OS push token availability where push is requested;
- semantic duplicate;
- existing sent/scheduled notification;
- quiet hours and permissible deferral;
- daily budget;
- priority arbitration.

Use structured reasons including:

`preference_disabled`, `user_missing`, `account_deletion_pending`, `invalid_timezone`,
`content_not_reviewed`, `profile_not_applicable`, `language_unavailable`, `duplicate_event`,
`quiet_hours_deferred`, `quiet_hours_unrecoverable`, `daily_budget_exhausted`,
`lower_priority_candidate`, `expired`, and `accepted`.

The resolver must return decisions; it must not write to Postgres or send pushes. Add
cardinality, tie-break, DST, midnight, empty-set, duplicate, and competing-priority tests.

Stop for review.

---

## Prompt 3 - Resolver persistence and schedule promotion

Wire the pure resolver to database persistence without migrating producers.

### Required

1. Atomically claim pending candidates with lease recovery and `FOR UPDATE SKIP LOCKED`.
2. Resolve candidates grouped by user and local spiritual date.
3. Promote accepted candidates into existing `notification_schedule` idempotently.
4. Derive the legacy-compatible `notification_key` from structured semantic identity in
   one helper.
5. Write accepted/suppressed/expired decisions to `notification_resolver_events`.
6. Never insert a bell notification here; the existing dispatcher remains responsible.
7. Add dry-run/preview mode that performs no mutation.
8. Add global and per-type kill switches, defaulting new candidate types off.
9. Expose one protected cron/admin route for resolver execution and one read-only admin
   preview route.
10. Add retention cleanup for terminal candidate/audit data with documented periods.

Test using a real shadow database, including concurrent claims, reruns, equal priorities,
partial failures, and byte-identical idempotent reruns.

Stop for review.

---

## Prompt 4 - Low-risk pilot: Dharm Veer and Quiz

Implement two new candidate producers as the first live-capable pilot. Keep their feature
flags off.

### Dharm Veer

- Candidate only when the selected hero is approved, source-backed, live, available in
  the user's tradition/language, and routes to `/dharm-veer/[id]`.
- Do not include an unsupported quotation or generated religious claim in push copy.

### Quiz

- Candidate only when the daily quiz is published and retrievable.
- Route precisely to `/quiz` or the canonical daily quiz route.
- Do not promise Karma unless the live award contract actually grants that amount.

### Arbitration

- They must compete for the same `learning_engagement` routine slot.
- Alternate by a documented deterministic policy; do not send both on one day.
- Respect settings, language, timezone, quiet hours, budget, expiry, and dedupe.

Add Native and PWA granular preference controls only if Prompt 0 proves they do not exist.
Use one shared backend preference contract and validate Native Bearer auth.

Run dry-run previews across multiple timezones before any flag is enabled. Stop for review.

---

## Prompt 5 - Migrate routine reminders

Migrate Japa, Shloka/streak rescue, mood, Sattvic, and Nitya reminder producers one type at
a time.

For each type:

1. Preserve existing eligibility and completion semantics.
2. Replace direct bell insertion/push delivery with candidate creation.
3. Add a pipeline mode: `legacy | candidate | disabled`.
4. Prove only one mode can execute for the type.
5. Run old-vs-new dry-run parity for 14 days of representative users/timezones.
6. Record intentional differences caused by the central budget or priority resolver.
7. Hard-cut the type from legacy to candidate only after independent approval.
8. Remove its direct `sendPushNotification()` call after the candidate path is proven.

Streak rescue must query actual incomplete activity and suppress for recently active users.
Do not use guilt or loss-pressure copy.

Stop for review after every notification type; do not bulk-cut all types.

---

## Prompt 6 - Observance hard cutover: festival, vrat, and tithi

This is the highest-risk migration. Do not execute until Prompts 0-5 are approved.

### Required

- Source only canonical reviewed/verified/audited/non-fallback occurrences.
- Carry occurrence ID, definition slug, profile, sampradaya, variant, local date, location,
  source references, diagnostics, and route metadata into candidate provenance.
- Establish one semantic event identity so tithi, vrat, and festival producers cannot
  independently notify for the same Ekadashi or observance instance.
- Preserve D-7, D-1, and D0 as distinct lead-time instances without overlapping legacy
  namespaces.
- Preserve women-focused audience variants without duplicating shared plumbing.
- Use precise per-occurrence routes from canonical route metadata.
- Withhold unresolved/disputed/fallback/unreviewed occurrences.
- Expose high-latitude, proxy, compressed-night, extended-moonrise, and other required
  diagnostics where relevant.

Run a machine-generated 60-day comparison of legacy and candidate outputs by user,
timezone, profile, occurrence, lead time, audience, copy, and route. Any unexplained
difference blocks cutover.

Cutover must be atomic by overlapping category. Never run legacy tithi and occurrence
candidate delivery concurrently for migrated indices.

Stop for review before changing flags.

---

## Prompt 7 - Time-sensitive and series candidates

Add only after their underlying domain contracts are approved.

### Navratri/observance series

- Consume the canonical sourced observance-series contract.
- Send only published, reviewed daily children.
- No unsourced daily colours, mantras, deity claims, or ritual instructions.

### Ekadashi Parana

- Consume an approved, profile/location-qualified Parana window.
- Schedule relative to the actual approved opening, not a fixed morning hour.
- Missing or ambiguous Hari Vasara, sunrise, Dwadashi, proxy, or high-latitude results must
  fail closed and enter review.

### Pradosha Kala

- Consume an approved local-sunset rule and calculation contract.
- Never encode the ritual-window definition inside notification copy or cron code.
- Handle polar/high-latitude cases through the approved diagnostic/proxy policy.

### Sankranti

- Notify only from canonical reviewed occurrences and approved Punya Kala data.

Add each type behind a default-off flag and require a 14-day preview before activation.

Stop for review.

---

## Prompt 8 - Admin control, monitoring, and release gate

Extend the existing notification admin/monitoring surfaces; do not create an isolated tool.

### Required views

- candidates generated by type;
- accepted/suppressed/expired counts;
- suppression reasons;
- scheduled, sent, failed, receipt-pending, and receipt-error counts;
- semantic duplicates prevented;
- daily sends per user/type without exposing sensitive user data;
- current pipeline mode and kill-switch state;
- next-14-days dry-run preview;
- exact title, body, route, audience, local time, source status, and diagnostics;
- stale leases and retry exhaustion.

### Release checks

- alert when resolver/dispatcher errors exceed a defined threshold;
- alert when a candidate-enabled type still directly calls `sendPushNotification()`;
- CI guard forbidding producer imports of `push-server` outside approved dispatcher,
  admin/test, security, and transactional exceptions;
- migration applied-state report;
- Android and iOS real-device push tests;
- bell insertion, read/clear, and exact tap-routing tests;
- Expo ticket plus receipt evidence; a ticket alone is not delivery proof.

Document rollback per type: switch to `disabled` first, then explicitly approved legacy
fallback only where duplicate risk has been eliminated.

Stop before production activation and present the complete release checklist to the
founder.

