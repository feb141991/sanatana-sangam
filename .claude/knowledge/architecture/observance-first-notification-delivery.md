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

## What we explicitly rejected

- A second generic candidates/delivery queue as the first implementation. It would duplicate scheduling and delivery responsibilities before the resolver's value is proven.
- Applying a shared devotional daily cap to explicit observance reminders.
- Treating a missing audience/profile field as permission to send targeted observance content.
- Migrating existing `NULL` preference rows by silently interpreting them as new consent.

---
