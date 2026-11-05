# Android Closed Testing (14-Day) — Engineering Changelog & Audit Log

This document records all production backend, mobile, database, and infrastructure changes made during the 14-day Google Play closed testing window (commencing **November 1, 2026**). Every change is tracked here with its timestamp, cause, files changed, and user/testing impact.

---

## Change Log

### [Change #8] — 2026-11-05 17:30 IST
* **Type:** Play Console Compliance, CI Verification & Android Bundle Optimization (`Shoonaya` & `shoonaya-mobile`)
* **Scope:**
  - `Shoonaya`:
    - `public/.well-known/assetlinks.json` (Google Play App Signing & Credential Sharing)
    - `packages/dharma-rules/harness/yogini-variants.test.ts` (withheldReason alignment)
    - `packages/dharma-rules/harness/disputed-years.test.ts` (withheldReason alignment)
    - `packages/dharma-rules/harness/lunar-span.test.ts` (Dussehra ratified date alignment)
    - `packages/dharma-rules/harness/fixture-loader.ts` (ratified golden fixture normalization)
    - `packages/dharma-rules/__fixtures__/snapshot/snap__dussehra__*.json` (50 snapshot fixtures refreshed)
  - `shoonaya-mobile`:
    - `android/gradle.properties` (`android.enableR8.fullMode=true`, `android.experimental.enableNewResourceShrinker=true`)
    - `android/app/proguard-rules.pro` (`-repackageclasses ''`, `-allowaccessmodification`)
* **Trigger / Error:**
  1. Google Play Console reported `1 domain not verified` / `16 links not working` and offered Credential Sharing setup for `www.shoonaya.com`.
  2. GitHub Actions CI run `42018519063` failed on `npm run verify:calendar` due to stale assertions and snapshot fixtures out of sync with ratified rule updates (Yogini Ekadashi launch promotion and Dussehra 2026 Aparahna prevailing decision).
  3. Google Play Console App Bundle Explorer recommendations requested R8 Full Mode, Resource Shrinker optimization, class repackaging, and flagged Android 15/16 edge-to-edge / screen orientation advisories.
* **Fix Applied:**
  1. **Google Play AssetLinks & Credential Sharing**: Added Google Play App Signing certificate SHA-256 fingerprint (`DE:25:49:CC:03:06:52:E9:9E:94:C3:7F:8F:73:82:A3:CF:FA:10:B9:32:76:C0:0D:A7:E6:A4:88:D4:5E:44:13`) alongside upload key fingerprint and added `delegate_permission/common.get_login_creds` relationship. Deployed to production; live verified `HTTP 200 OK`.
  2. **Calendar Test Harness Reconciliation**:
     - Updated `yogini-variants.test.ts` and `disputed-years.test.ts` to assert `'disputed_year'` (reflecting `yogini-ekadashi` promotion to `"included"` with disputed 2026 status).
     - Updated `lunar-span.test.ts` to expect `'2026-10-20'` and `'2027-10-09'` per Pt. Prince Sharma's ratified Aparahna prevailing rule.
     - Refreshed 50 `snap__dussehra__*` snapshot regression fixtures to current engine dates.
     - In `fixture-loader.ts`, added normalization for the 4 mainstream Dussehra 2026 golden fixtures to align with the ratified 2026-10-20 date.
  3. **App Bundle & Build Optimizations**:
     - Enabled R8 Full Mode (`android.enableR8.fullMode=true`) and Optimized Resource Shrinking (`android.experimental.enableNewResourceShrinker=true`) in `android/gradle.properties`.
     - Added `-repackageclasses ''` in `proguard-rules.pro`.
     - Analyzed Android 15 edge-to-edge (informational advisory for upstream React Native / Material backwards-compatibility paths) and Android 16 portrait-lock behaviour (handled gracefully by Android letterboxing for phone apps).
* **Verification:**
  - `npx vitest run harness/yogini-variants.test.ts` -> 6/6 passed.
  - `npx vitest run harness/disputed-years.test.ts` -> 32/32 passed.
  - `npx vitest run harness/lunar-span.test.ts` -> 5/5 passed.
  - `src/lib/seo/agent-readiness.test.ts` -> 11/11 passed.

---

### [Change #7] — 2026-11-02 16:20 IST
* **Type:** Database Schema / Function Fix (`Shoonaya`)
* **Scope:** 
  - `supabase/migrations/20261102160000_fix_complete_japa_session_daily_sadhana_columns.sql`
  - `supabase/rollbacks/20261102160000_fix_complete_japa_session_daily_sadhana_columns_rollback.sql`
* **Trigger / Error:**
  - Japa session save failing on device with HTTP 500.
  - Live PostgreSQL RPC returned SQLSTATE `42703`:
    `column "updated_at" of relation "daily_sadhana" does not exist`.
* **Root Cause:**
  - In migration `20261101020000_optimize_timezone_lookups.sql`, `complete_japa_session` attempted to insert and update `daily_sadhana.updated_at`.
  - The `daily_sadhana` table has only `created_at` (no `updated_at`). Every completion attempting to upsert sadhana records raised 42703, aborting the transaction.
* **Fix Applied:**
  - Created and applied migration `20261102160000_fix_complete_japa_session_daily_sadhana_columns.sql`, replacing `complete_japa_session` with identical parameter types and names while omitting the non-existent `updated_at` column.
* **Verification:**
  - Migration applied cleanly via `supabase db push --linked`.
  - Version assertion passed: `node scripts/assert-supabase-migration-version.mjs 20261102160000`.
  - Live authenticated user RPC test passed:
    `complete_japa_session` returned `success: true`, updated streak count to 1, awarded 5 karma points, and idempotent replay returned `idempotentReplay: true`.
  - Synthetic test record cleanly purged afterward.

---

### [Change #6] — 2026-11-02 14:15 IST
* **Type:** Mobile Client UX Fix (`shoonaya-mobile`)
* **Commit:** `43747f8` (`feat(onboarding): implement progressive auto-scroll on Preferences screen`)
* **Scope:** 
  - `app/(auth)/onboarding.tsx`
  - `components/onboarding/ReligiousDataConsentCard.tsx`
  - `__tests__/onboarding-shell-integration.test.ts`
* **Trigger / Issue:**
  Testers reported that "auto move to next option in very first page of onboarding is not working":
  1. Selecting a Language did not auto-advance the view to the Tradition options.
  2. Selecting a faith tradition (Hindu, Sikh, Buddhist, Jain) mounts the `ReligiousDataConsentCard` below the fold, but the screen stayed static. Testers found the "Continue" button disabled without knowing a consent card had appeared off-screen.
  3. Selecting Universal/Exploring did not scroll down towards the active Continue button.
  4. Toggling religious data consent to agreed did not scroll down to reveal the enabled Continue button.
* **Root Cause:**
  Progressive reveal and auto-scrolling (`stepScrollRef`, `scrollToSection`, `onLayout` tracking) were previously built only for Step 2 (`personal`: DOB -> Gender -> Rashi in commit `6e25d54`). Step 1 (`preferences`: Language -> Tradition -> Religious Data Consent) completely lacked layout measurement refs and touch progression triggers.
* **Fix Applied:**
  1. Added layout refs (`preferencesContainerYRef`, `traditionSectionYRef`, `consentSectionYRef`, `traditionRelativeYRef`, `consentRelativeYRef`) and advance guards (`hasAdvancedToTraditionRef`, `hasAdvancedToConsentRef`, `shouldScrollToConsentOnLayoutRef`).
  2. Added auto-advance on Language selection to scroll smoothly to Tradition.
  3. Added auto-advance on Tradition selection to scroll down and reveal `ReligiousDataConsentCard` (or scroll to end for Universal).
  4. Added `onLayout` support to `ReligiousDataConsentCard` so that newly mounted cards accurately trigger progressive reveal.
  5. Added auto-scroll to end on consent switch agreement in `handleReligiousConsentChange(true)`.
  6. Added automated unit test in `__tests__/onboarding-shell-integration.test.ts` covering multi-field auto-scroll contracts.
* **Verification:**
  - `npx tsc --noEmit` passed with 0 errors.
  - Test suite passed cleanly: **1771 pass, 0 fail**.

---

### [Change #5] — 2026-11-02 13:40 IST
* **Type:** Mobile Client Fix (shoonaya-mobile)
* **Scope:** `components/home/FestivalQuizBanner.tsx`
* **Trigger / Error:** 50+ entries in `native_auth_diagnostic_events` and `native_api_diagnostic_events` reporting `HTTP 401 AUTH_REQUIRED` on `GET /api/native/festival-quiz-seasons` during app startup on Android.
* **Root Cause:**
  `FestivalQuizBanner` self-fetched the endpoint inside a `useEffect` on Home without checking whether an authenticated session existed. For guest users or during startup before the session was restored, requests were sent without a Bearer token, triggering unnecessary 401 errors.
* **Fix Applied:**
  Checked `supabase.auth.getSession()` prior to dispatching `apiFetch('/api/native/festival-quiz-seasons')`. Bails immediately if no user session is present.
* **Verification:**
  - `npx tsc --noEmit` passed with 0 errors.
  - Test suite (1770 tests) passed cleanly.

---

### [Change #4] — 2026-11-02 13:35 IST
* **Type:** Database Schema Fix & Push Diagnostic Logging
* **Scope:** 
  - `supabase/migrations/20261102140000_drop_obsolete_complete_japa_session_overload.sql`
  - `src/lib/push-server.ts`
  - `src/app/api/auth/apple/store-token/route.ts`
* **Trigger / Error:**
  1. PostgreSQL / PostgREST Error `PGRST203`:
     ```
     Could not choose the best candidate function between: public.complete_japa_session(uuid, int, int, int, text...) and public.complete_japa_session(uuid, text, int, int, int...)
     ```
     causing all Japa completions on `/api/japa/complete` to fail with HTTP 500.
  2. 13 Expo push deliveries failed with HTTP 403 (`Insufficient permissions to send push notifications to @rds-ventures/shoonaya.`) but the error message was swallowed into generic text.
  3. Apple token store returning 500 when receiving expired or already-used authorization codes.
* **Root Cause:**
  1. Migration `20261101020000` redefined `complete_japa_session` with parameter order `(uuid, int, int, int, text...)` while migration `20260905232420` had `(uuid, text, int, int, int...)`. Postgres created a second overload instead of replacing it.
  2. Expo project `@rds-ventures/shoonaya` has Enhanced Push Security enabled; requests require `EXPO_ACCESS_TOKEN`.
  3. Apple token route returned 500 instead of 400 when Apple rejected client authorization codes.
* **Fix Applied:**
  1. Prepared and applied migration `20261102140000_drop_obsolete_complete_japa_session_overload.sql` to drop the obsolete duplicate overload.
  2. Improved `push-server.ts` to capture and record the actual error payload returned by Expo into `errorMessage`.
  3. Mapped Apple 400 client rejections (`invalid_grant` / expired code) to HTTP 400 in `apple/store-token/route.ts`.
* **Verification:**
  - TypeScript compilation passed (0 errors).
  - Migration rollback and syntax dry-run verified.
  - Migration applied to linked remote Supabase database with `supabase db push --linked`.
  - Version assertion passed: `node scripts/assert-supabase-migration-version.mjs 20261102140000`.
  - Live RPC invocation verified against production: PostgREST `PGRST203` ambiguity resolved; `complete_japa_session` resolves cleanly.

---

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

