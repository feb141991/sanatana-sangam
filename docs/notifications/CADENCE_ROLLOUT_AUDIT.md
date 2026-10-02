# Engagement cadence rollout audit

**Status (2026-10-03):** the base cadence SQL migration is applied to production
as version `20261002181447`; the digest compatibility fix is deployed. The
flexible-producer/resolver release and follow-up reservation-consistency
migration are verified locally but not yet deployed/applied. Production
notification candidate flags remain unchanged.

## Enforced boundary after rollout

The database cadence trigger is the admission boundary for non-exempt
`notification_schedule` inserts. It serializes by user and local date, recounts
pending/sending/sent schedules plus bell history, admits at most five budgeted
keys, and finds a same-day slot at least three hours from other scheduled or
delivered notifications. The resolver's own transaction uses the same lock and
performs a live recount, protecting against another resolver or queue producer
reserving capacity at the same time.

The follow-up migration also checks that every genuinely new schedule key supplied
by candidate persistence was actually inserted. If the cadence trigger skips a
row because the requested time cannot move to a safe same-day slot, the transaction
rolls back instead of recording the candidate as accepted; the resolver requeues
the claim for a fresh evaluation.

The cap applies to flexible messages admitted through the schedule queue. A direct
push can still bypass it. Exempt direct paths are listed below so the product
boundary stays explicit instead of being described as a limit on every push.

## Producer treatment

| Producer | Current source path | Cadence treatment |
| --- | --- | --- |
| Midday mood | `/api/cron/mood-reminder` | Candidate mode remains resolver-owned. Legacy mode now uses the shared queue writer and database guard. |
| Evening mood | `/api/cron/mood-reminder-evening` | Candidate mode remains resolver-owned; legacy mode now queues at each user's next local 18:00. |
| Sattvic reminder | `/api/cron/sattvic-reminder` | Candidate mode remains resolver-owned; legacy mode uses the shared queue writer. Classified as budgeted engagement. |
| Shloka reminder | `/api/cron/shloka-reminder` | Candidate mode remains resolver-owned; legacy mode queues at each user's next local 19:00. |
| Quiz and Dharm Veer | `/api/cron/learning-engagement-candidates` | Candidate resolver owns budget and delivery scheduling. |
| Daily digest | `/api/digest/generate` | Now queues with a user-local daytime slot and recipient-scoped semantic key. |
| Weekly summary | `/api/cron/weekly-summary` | Generated content is now queued for the user's next local daytime slot; no direct push. |
| Journal anniversary | `/api/cron/journal-anniversary` | Now queues and writes a stable user/year/local-date key before any delivery. |
| Guided plan | `/api/cron/guided-plan-reminder` | Now queues by user, path, reached day, and local date; no cron-local-hour gate. |
| Japa milestone | `/api/notifications/milestone` | Now queues with a per-user key; it consumes the flexible engagement budget. |
| Seva tier | `/api/seva-tier/check` | Profile tier change and budgeted queue insert use one database RPC transaction. |
| Family Sanskar | `/api/sanskar/schedule` | Explicit user-configured reminder exception; now has stable recipient-scoped keys and local date/timezone metadata. |
| Sankalpa midpoint | `/api/cron/sankalpa-checkin` | Explicit user opt-in; candidate path remains exempt and mutually exclusive with legacy ownership. |
| Brahma Muhurta, Nitya, Sandhya | `/api/cron/brahma-muhurta`, `/api/cron/nitya-reminder*` | Approved ritual timing and opt-in remain exempt. Their fixed delivery instants block nearby flexible slots when queued. |
| Reviewed observances | `/api/cron/observance-schedule`, festival, vrat, tithi, and Pitru Paksha routes | Reviewed-source and existing preference gates remain exempt; direct legacy pushes keep their intended dates. |
| Live Aarti | `/api/cron/aarti-notify` | User-selected live ritual slot; direct and exempt from engagement spacing. |
| Calendar health | `/api/cron/calendar-health` | Admin operational alert; direct, outside consumer engagement cadence. |
| Mandali social | `/api/native/mandali/notify-push` | Real-time community activity; direct, with existing key claim and community preference checks. It can still burst across different events. |
| Admin broadcast/test | `/api/admin/broadcast`, `/api/admin/notification-templates/test` | Operator/campaign traffic stays on a separate direct path and needs separate campaign controls if volume grows. |

Other writers of `notification_schedule` (including observance and fixed ritual
queue producers) are protected by the database trigger after migration, but their
exempt event types retain their authored delivery times.

## Duplicate and failure behavior

The flexible direct-push routes that previously sent before persisting a durable
key now queue first and dispatch from `notification_schedule`. Stable per-user
keys prevent retries from creating another scheduled row. `/api/seva-tier/check`
updates the tier and queues its notification in one transaction so a failed queue
cannot silently consume the one-time transition. Queue admission errors return as
route failures rather than a false success.

Immediate Mandali and admin sends are outside this guarantee by design. The shared
cadence cap is not a global limit for those pushes. Their separate delivery controls
and any future coalescing policy should be reviewed independently.

## Verification record

- Targeted TypeScript and route tests cover queue admission, idempotent writes,
  local-time scheduling, and candidate/legacy ownership.
- The base migration passed 31 SQL assertions in an isolated PostgreSQL 18.3
  fixture using a small pgTAP-compatible shim. pgTAP itself and Docker were not
  available, so this is not a full Supabase shadow verification.
- The follow-up migration adds three SQL assertions covering the no-safe-slot
  rollback behavior. They have not run yet because no local database container is
  available; run them in a disposable Supabase shadow before treating that branch
  as independently integration-tested.
- A two-session database test held a user's local-date advisory lock, started a
  competing candidate reservation, and confirmed the second session waited for
  commit, observed the three existing reservations, and rejected an over-budget
  three-row batch.
- A full Supabase shadow test remains outstanding. The migration was applied
  through the targeted Supabase operation after production preflight, with the
  returned version reconciled to the local filename. Production catalog checks
  confirmed the global semantic-key index is absent, the recipient-scoped index
  remains, the triggers and resolver lock functions exist, and cadence audit data
  is service-role-only.

Run the actual pgTAP test in a disposable Supabase shadow when shadow
infrastructure is available. Keep candidate flags as-is until canary comparisons
show expected producer rows, cadence decisions, dispatches, receipts, and opt-out
behavior.
