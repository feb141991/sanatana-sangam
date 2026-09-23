# Observance-First Notification Delivery

**Date:** 2026-09-23
**Session context:** Updating the central notification resolver plan and beginning its observance pilot
**Category:** architecture

## What we decided

Reviewed observance reminders are the first candidate type in the notification modernization. Eligible reminders enqueue into the existing `notification_schedule` and are delivered by its dispatcher, inbox, Expo, and receipt pipeline. Generic engagement arbitration comes later and cannot suppress opted-in observance or explicit user-created ritual reminders.

Observance eligibility is separate from push permission, local send time, quiet hours, calendar/tradition applicability, and audience qualification. Missing profile context is not inferred for scoped observances; source review/publication gates remain authoritative.

## Why

Observance reminders are a direct user value and may depend on reviewed occurrence, calendar-profile, tradition, and timezone data. A generic daily cap would turn an unrelated engagement message into a reason to drop something the user explicitly asked to receive. Reusing the durable scheduler avoids creating competing send, inbox, retry, and receipt systems.

The current direct-send festival, vrat, and tithi jobs must remain exclusive with any future schedule producer. A pure policy stage and no-write parity preview provide a reversible way to establish behavior before changing delivery.

## Constraints this creates

- No resolver budget may reject enabled observance reminders, explicit user reminders, or approved time-sensitive ritual windows.
- New preference defaults are opt-out until the consent contract and legacy `NULL` behavior are measured and agreed.
- OS notification permission controls push only; it does not erase an opted-in in-app schedule.
- Scoped tradition, calendar profile, sampradaya, and audience variants fail closed when matching user context is absent.
- The existing `notification_schedule` and `notification-dispatch` chain remains the only delivery path for the pilot.
- Legacy direct-send and new scheduled modes must never run concurrently for the same category.

## Implementation checkpoint (2026-09-23)

Source now includes the additive candidate/resolver ledger and atomic schedule-promotion
path as infrastructure for staged notification work. This does not change the observance
delivery decision above: reviewed observances still use `notification_schedule`, remain
budget-exempt, and must be migrated one category at a time behind exclusive modes. The
candidate resolver derives priority from backend-owned event types, fails closed when
delivery history cannot be read, and does not defer time-sensitive candidates. Its
subdaily trigger is defined through Supabase `pg_cron`/`pg_net`; the observance schedule
producer has a separate daily trigger.

These are source-level changes only until migrations and cron configuration are reviewed
and applied to the target environment. Fixture parity reports are deterministic
simulations, not production shadow evidence. Do not treat tests or local SQL shadow checks
as proof of production migration state, live parity, or delivery behavior.

## What we explicitly rejected

- A second generic candidates/delivery queue as the first implementation. It would duplicate scheduling and delivery responsibilities before the resolver's value is proven.
- Applying a shared devotional daily cap to explicit observance reminders.
- Treating a missing audience/profile field as permission to send targeted observance content.
- Migrating existing `NULL` preference rows by silently interpreting them as new consent.

---
