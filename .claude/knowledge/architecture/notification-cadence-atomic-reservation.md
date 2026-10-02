# Engagement Notification Cadence — Shared Budget and Atomic Admission

**Date:** 2026-10-02
**Session context:** Completing the shared cadence policy for scheduled engagement notifications
**Category:** architecture

## What we decided

Flexible, non-exempt engagement shares a ceiling of five notifications per user per local
civil day, with at most five for any canonical type. Delivery times should preserve each
producer's requested local time when possible and shift only to avoid quiet hours, the
07:00–21:00 local window, or less than three hours between deliveries. Candidate promotion
and legacy queue admission use database-enforced per-user/day locking and idempotency.

Account/security, explicitly requested reminders, approved ritual windows, and reviewed
observances remain outside this engagement budget. Immediate social and operator sends keep
their separate delivery contracts, so this policy is not a cap on every OS push.

## Why

An independent allowance of five for every feature would multiply total interruptions as
new reminder types are added. A shared daily ceiling keeps the aggregate predictable while
canonical aliases prevent one feature from getting a second allowance under a legacy name.
The three-hour spacing and local daytime window reduce bursts without imposing one
universally “best” time or overriding a user's preferred reminder hour.

An application-level read is not a reservation: overlapping resolver runs or legacy queue
writers could otherwise each observe the same remaining capacity. PostgreSQL therefore
serializes admission per user and local date and recounts current history in the transaction
that writes the schedule row.

## Constraints this creates

- Flexible producers must use `notification_schedule` or the candidate resolver; direct
  budgeted push sends would bypass quota and spacing.
- Idempotency keys must be recipient-scoped and stable across retries.
- Candidate resolution may not move a message beyond its valid local date or expiry.
- Exempt reminders preserve their authored delivery time but still block nearby flexible
  notifications.
- Immediate Mandali, admin, ritual, and observance routes remain outside the shared cap until
  a separate urgency-aware policy is explicitly designed.
- Production candidate flags stay separate from the database guard and require an internal
  canary with delivery, receipt, opt-out, and suppression evidence.

## What we explicitly rejected

- Five independent slots per feature with no total ceiling: it would grow without bound as
  features are added.
- A single fixed delivery hour for every user: it would ignore timezones and saved reminder
  preferences.
- Delaying all immediate social/transactional events by several hours: cadence should not
  break the expected real-time behavior of replies or security notices.

## Production status

Migration version `20261002181447` was applied to production on 2026-10-02 after preflight;
the version is aligned in local and remote migration history. Catalog checks confirmed the
trigger/RPCs, recipient-scoped unique index, and service-role-only audit table. The full
Supabase shadow suite remains outstanding. The queue-backed producer/resolver code is
verified locally and is the remaining deployment step.

---
