# Shoonaya Notification Architecture Audit

This audit was conducted to evaluate the current state of Shoonaya's notification system. The goal is to identify discrepancies between expected architecture (OneSignal) and legacy implementations (Web Push/VAPID), assess data safety, and define a clear action plan before writing new product code.

## Current Architecture

```mermaid
flowchart TD
    sublayer_client[Client]
    sublayer_db[(Supabase)]
    sublayer_onesignal[OneSignal API]
    
    sublayer_client -- "1. Init OneSignal SDK" --> sublayer_onesignal
    sublayer_client -- "2. loginToOneSignal(userId)" --> sublayer_onesignal
    sublayer_client -- "3. requestNotificationPermission()" --> sublayer_onesignal
    
    sublayer_onesignal -- "Push Token/Player ID" --> sublayer_db: profiles.onesignal_player_id
    
    Cron[Cron Routes] -- "1. Insert into notifications" --> sublayer_db
    Cron -- "2. sendOneSignalPush()" --> sublayer_onesignal
    Cron -- "3. Record delivery status" --> sublayer_db
```

## Notification Audit Findings

### 1. Where is OneSignal initialized?
OneSignal is initialized inside `src/app/layout.tsx` using a `<Script>` tag (`OneSignalSDK.page.js`) and `OneSignal.init()`. 
*(Note: `initOneSignal()` exists in `src/lib/onesignal.ts` but is not actively called by the React lifecycle; initialization relies on the global script in layout).*

### 2. Where is `loginToOneSignal(userId)` called?
It is called within a `useEffect` hook in `src/components/layout/TopBar.tsx` (and `src/components/layout/FloatingPill.tsx`), firing once `pushConfigured` and `userId` are truthy.

### 3. Can a user become push-reachable without opening the notification bell/topbar?
**Yes.** We have implemented Contextual Push Onboarding. When users toggle notification preferences in their Profile settings, they are prompted natively for browser push permissions. Additionally, `OneSignalIdentityProvider` automatically binds the logged-in user's `external_id` without requiring UI interaction.

### 4. Which routes insert DB notifications?
Almost all scheduled cron routes and event routes insert directly into the `notifications` table:
- `/api/cron/brahma-muhurta`
- `/api/cron/calendar-health`
- `/api/cron/festival-reminder`
- `/api/cron/guided-plan-reminder`
- `/api/cron/journal-anniversary`
- `/api/cron/mood-reminder` (and evening)
- `/api/cron/nitya-reminder` (and madhyahn, sandhya)
- `/api/cron/pitru-paksha-reminder`
- `/api/cron/sanskar-milestone`
- `/api/cron/sattvic-reminder`
- `/api/cron/shloka-reminder`
- `/api/cron/tithi-reminder`
- `/api/cron/vrat-reminder`
- `/api/notifications/milestone`
- `/api/notifications/test`
- `/api/notifications/diagnostics`
- `/api/kul/invite`

### 5. Which routes send OneSignal push?
Routes utilizing `sendOneSignalPush` from `src/lib/onesignal-server.ts`:
- `/api/cron/nitya-reminder` (and madhyahn, sandhya, midday, evening)
- `/api/cron/shloka-reminder`
- `/api/cron/guided-plan-reminder`
- `/api/cron/sankalpa-checkin`
- `/api/cron/brahma-muhurta`
- `/api/cron/calendar-health`
- `/api/cron/journal-anniversary`
- `/api/cron/pitru-paksha-reminder`
- `/api/cron/festival-reminder`
- `/api/cron/vrat-reminder`
- `/api/cron/tithi-reminder`
- `/api/cron/aarti-notify`
- `/api/cron/weekly-summary`
- `/api/cron/sattvic-reminder`
- `/api/cron/mood-reminder` (and evening)
- `/api/cron/sanskar-milestone`
- `/api/admin/broadcast`
- `/api/seva-tier/check`
- `/api/notifications/milestone`
- `/api/notifications/test`

### 6. Which routes still use raw Web Push/VAPID?
**None.** Legacy Web Push has been completely retired. `japa-reminder` and `digest/generate` have been successfully migrated to the unified OneSignal path, and all legacy `web-push` dependencies, files, and DB tables have been removed.

### 7. Which notification types have dedupe keys?
The system utilizes conflict resolution `ON CONFLICT (user_id, notification_key)` broadly. Identified dedupe keys include:
- `brahma_muhurta:{localDate}`
- `nitya:morning:{localDate}`, `nitya:madhyahn:{localDate}`, `nitya:sandhya:{localDate}`
- `streak:{localDate}`
- `guided-plan:{path_id}:day:{dayReached}:{localDate}`
- `kul_invite:{kulId}:{toUserId}:{user.id}`
- `mood-checkin:{localDate}`, `mood-evening:{localDate}`
- `sattvic:evening:{localDate}`
- `sanskar_milestone:{row.id}`
- `journal-anniversary:{target.years}:{localDateStr}`
- `tithi:{tithiIndex}:{localDate}`
- `pitru-paksha:{localDate}`
- `festival:{festival.id}:{daysAway}:{localDate}`
- `vrat-female:{vrat.name}:{daysAway}:{localDate}`

### 8. Which notification types respect user preferences?
Cron routes strictly query `profiles` to filter users based on boolean preference fields:
- `festival-reminder` → `wants_festival_reminders`
- `tithi-reminder` → `wants_festival_reminders`
- `nitya-reminder` → `wants_nitya_reminders`
- `sattvic-reminder` → `wants_nitya_reminders`
- `shloka-reminder` → `wants_shloka_reminders`
- `nitya-reminder-madhyahn` → `wants_madhyahn_reminder`
- `nitya-reminder-sandhya` → `wants_evening_reminder`
- `japa-reminder` → `japa_reminder_enabled`

### 9. Which notification types are source-sensitive devotional content?
**High Risk:** `festival-reminder`, `vrat-reminder`, `tithi-reminder`, `pitru-paksha-reminder`. Incorrect timezone calculations or unvetted Panchang data pushed here can severely impact Dharmic practices (fasting on the wrong day).
`festival-reminder` and `vrat-reminder` now use reviewed-source gating. Remote verification on 2026-06-24 showed eligible reviewed rows for major/regional festival pushes, but the women-focused vrat rows still need editorial review before they will be sent.
**Medium Risk:** `nitya-reminder`, `brahma-muhurta`, `japa-reminder`, `aarti-notify`. Nudging for practices at incorrect times or missing them entirely.
**Low Risk:** `shloka-reminder` (streak nudges), `journal-anniversary`, `mood-reminder`, `kul/invite`, `calendar-health`.

### 10. Which notification routes are safe to run in dry-run mode?
Core high-risk scheduled routes now support `?dryRun=true` and the `NOTIFICATIONS_DRY_RUN=true` environment flag through `src/lib/notification-safety.ts`. Dry-run paths return target counts without calling OneSignal. Japa and Digest also support dry-run after migration to the unified OneSignal path.

### 11. Which notification routes need kill switches?
All **High Risk** (Panchang/Calendar based) and **Medium Risk** routes should remain behind centralized kill switches. Current controls are `NOTIFICATIONS_DISABLED=true`, `NOTIFICATIONS_DRY_RUN=true`, and `NOTIFICATIONS_DISABLE_TYPES=festival,vrat,tithi,japa,digest`.

### 12. Which docs currently overstate or understate notification readiness?
The main Next.js notification routes now use the unified OneSignal path. Legacy VAPID/Web Push files, dependencies, and tables have been successfully removed, bringing the architecture to a single, unified, and auditable delivery pipeline via OneSignal.

---

## Executive Summary & Implementation Order

### What is production-safe today
- In-app notification UI (`TopBar`, `FloatingPill`) correctly reads from the DB and handles OneSignal ID mapping.
- DB deduping utilizing `notification_key` prevents duplicated records for Nitya and Festival schedules.
- Preference respect: Cron queries are correctly restricted by `wants_*` flags before processing.
- Delivery safety: `src/lib/notification-safety.ts` centralizes dry-run and kill-switch behavior.
- Delivery observability: `public.notification_deliveries` records OneSignal send attempts and integrates with diagnostic routes.

- **Push Permissibility**: A contextual push-permission onboarding flow exists. Users are prompted automatically when they enable notification preferences in their profile settings.
- **Legacy cleanup is complete**: VAPID/Web Push dependencies, `/api/push/subscribe`, `push_subscriptions` table, and Supabase Edge Function have been safely dropped and removed.
- **Sacred source gating in progress**: Festival and women-focused vrat pushes now require reviewed, verified, audited observance rows and refuse static fallback data. Current remote data has launch-eligible major/regional festival rows, while women-focused vrat rows remain mostly unreviewed and will be skipped until corrected/reviewed. Tithi and Pitru Paksha remain source-sensitive and should keep the same dry-run/kill-switch discipline.

### Exact Implementation Checklist
- [x] **P0:** Migrate `japa-reminder` and `digest/generate` from raw `web-push` to `sendOneSignalPush` and DB insertions.
- [x] **P0:** Implement centralized environment kill-switches across cron endpoints: `NOTIFICATIONS_DISABLED`, `NOTIFICATIONS_DRY_RUN`, and `NOTIFICATIONS_DISABLE_TYPES`.
- [x] **P0:** Add `notification_deliveries` audit migration and non-blocking OneSignal delivery logging.
- [x] **P1:** Implement contextual push-permission onboarding (e.g., prompting users when they enable a reminder in settings, rather than waiting for them to click the bell).
- [x] **P1:** Add a standard `dryRun=true` query parameter to high-risk cron routes to safely preview execution targets without pushing.
- [x] **P1:** Gate festival and women-focused vrat push reminders to reviewed/verified/audited observance rows only; do not fall back to static calendar data for push.
- [x] **P2:** Safely drop the `push_subscriptions` table and remove `web-push` dependency once all legacy traffic is ported.
