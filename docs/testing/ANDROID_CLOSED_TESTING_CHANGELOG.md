# Android Closed Testing (14-Day) — Engineering Changelog & Audit Log

This document records all production backend, mobile, database, and infrastructure changes made during the 14-day Google Play closed testing window (commencing **November 1, 2026**). Every change is tracked here with its timestamp, cause, files changed, and user/testing impact.

---

## Change Log

### [Change #3] — 2026-11-02 13:20 IST
* **Type:** Backend Bug Fix / Database Integrity
* **Scope:** `src/app/api/cron/notification-dispatch/route.ts`
* **Trigger / Error:** PostgreSQL Error `23503` (Foreign Key Violation) during scheduled notification delivery:
  ```
  insert or update on table "notification_deliveries" violates foreign key constraint "notification_deliveries_notification_id_fkey"
  ```
* **Impacted User:** `Princess sharma` (`princesssharma0603@gmail.com` / User ID `5068a3e7-8639-4b01-99bf-e7d1b1cedfab`) during the 13:00 IST Midday Check-in dispatch.
* **Root Cause:**
  When dispatching queue rows from `notification_schedule`, `/api/cron/notification-dispatch` assigned `notificationIdsByUserId[row.user_id] = row.id`. Because `row.id` is the primary key of `notification_schedule` rather than `notifications`, inserting it into `notification_deliveries.notification_id` violated the foreign key constraint pointing to `public.notifications(id)`.
* **Fix Applied:**
  1. After idempotently inserting into `notifications`, the dispatcher now queries and maps the actual `notifications.id` using `(user_id, notification_key)`.
  2. Sets `notificationIdsByUserId[row.user_id]` strictly to the resolved `notifications.id` (or leaves it undefined/null if unmapped), guaranteeing valid foreign keys in `notification_deliveries`.
* **Verification:**
  - `npx tsc --noEmit` passed.
  - Notification test suite passed (49/49 passed).
  - Production build clean.

---

### [Change #2] — 2026-11-02 12:15 IST
* **Type:** Build / Social Marketing Fix
* **Commit:** `fcebfe1` (`fix(social): handle nullable display_name in morning card publication`)
* **Scope:** `src/lib/marketing/social/morning/service.ts`
* **Trigger / Error:** Vercel deployment build failed:
  ```
  Type error: Type 'string | null' is not assignable to type 'string'.
  507 | accountName: account.display_name
  ```
* **Root Cause:** `SocialPlatformAccount.display_name` is typed as `string | null`. Directly assigning it to `accountName: string` in `PublishMorningCardResult` broke strict TypeScript compilation on Vercel.
* **Fix Applied:**
  1. Guarded with fallbacks: `accountName: account.display_name || account.external_account_id || account.id`.
  2. Guarded line 433 with optional chaining: `a.display_name?.toLowerCase().includes("shoonaya") ?? false`.
  3. Added fallbacks for error reporting strings.
* **Verification:**
  - `npm run build` compiled successfully locally (367 static pages generated).
  - Vitest morning service suite passed (39/39 passed).

---

### [Change #1] — 2026-11-01 20:00 IST
* **Type:** Database & RLS Performance Optimization
* **Migrations:**
  - `20261101190000_optimize_notification_indexes_and_cleanup.sql`
  - `20261101200000_optimize_rls_initplans_and_security_search_path.sql`
* **Scope:** Database indexes, RLS policies, and routine notification cleanup.
* **Root Cause:** Supabase database advisor reported table bloat on notification logs and inefficient RLS InitPlans evaluating `auth.uid()` on row-by-row scans.
* **Fix Applied:**
  1. Added partial indexes for notification purging.
  2. Hardened Postgres function `search_path` and wrapped `auth.uid()` in scalar InitPlans for sub-millisecond query evaluation.
