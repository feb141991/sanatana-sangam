# Machine-Generated Privacy and Security Engineering Baseline

**Schema version:** 2
**Source fingerprint:** `b49314e0d7a944b6d17bf8cf2205830a2988859aa2cc40a94240722677d75924`
**Repositories:** Backend `c987493e81` (modified), Native `e5d79e47fd` (clean)

> This is an engineering evidence inventory, not legal advice. UNKNOWN and
> ERROR states are never equivalent to a secure or compliant result.

## Summary

- Audited data categories: 14
- Inventory checks: 12
- Scanned files: backend 2432, Native 937
- Literal storage keys: backend 44, Native 22
- Providers/SDKs discovered: 11
- Check VERIFIED: 11
- Check NOT_FOUND: 0
- Check DRIFT: 0
- Check NEEDS_POLICY_DECISION: 1
- Check UNKNOWN: 0
- Check ERROR: 0
- Category VERIFIED: 10
- Category PARTIAL: 1
- Category NOT_FOUND: 0
- Category DECISION_REQUIRED: 3

## 14-Category Data Inventory

| Category ID | Category Name | Storage / Route | Vendors | Retention Rule | Confidence | Evidence |
|---|---|---|---|---|---|---:|
| `CAT-01-AUTH` | Account and authentication data | `auth.users, public.profiles` | Supabase Auth, Google OAuth, Apple Auth, Twilio | PENDING_DECISION (Active account duration; 30d cool-off before hard delete) | **VERIFIED** | 25 |
| `CAT-02-RELIGIOUS` | Profile and religious/spiritual data | `public.profiles, public.user_settings` | Supabase | PENDING_DECISION (Special-category consent and retention rule pending approval) | **DECISION_REQUIRED** | 25 |
| `CAT-03-BIRTH-JYOTISH` | DOB, birth time/place, Jyotish and family/Kul data | `public.birth_profiles, public.profiles, client localStorage` | Supabase, Astronomia / Astronomy-engine (in-process) | PENDING_DECISION (Guest chart cleanup and family data retention pending decision) | **DECISION_REQUIRED** | 25 |
| `CAT-04-LOCATION` | Current and foreground location | `Client memory / AsyncStorage, public.profiles (home_latitude, home_longitude, city, state, country, timezone)` | Supabase, OpenStreetMap / Nominatim (if enabled) | PENDING_DECISION (Transient in memory; persisted home coordinates tied to account lifecycle) | **VERIFIED** | 20 |
| `CAT-05-MOOD-SANKALPA` | Mood, journal, reflections and sankalpa | `public.mood_logs, public.sankalpas, public.daily_reflections, client AsyncStorage` | Supabase | PENDING_DECISION (User-directed deletion; retention period pending decision) | **VERIFIED** | 25 |
| `CAT-06-PRACTICE-PROGRESS` | Japa, Panchang, practice, quiz and progress history | `public.japa_sessions, public.pathshala_progress, public.quiz_attempts, public.user_streaks, public.vrat_observations` | Supabase | PENDING_DECISION (Retained during active membership; account deletion purge) | **VERIFIED** | 25 |
| `CAT-07-COMMUNITY-MANDALI` | Mandali/community content and safety actions | `public.posts, public.post_comments, public.content_reports, public.user_blocked_profiles, public.user_muted_profiles, public.user_hidden_content, public.moderation_logs` | Supabase | PENDING_DECISION (Content deleted on user request; safety reports retention pending counsel decision) | **PARTIAL** | 25 |
| `CAT-08-AI-PRAMANA` | AI prompts, generated content, RAG retrieval and TTS | `Ephemeral request memory, transient streaming response, serverless execution logs` | Sarvam AI (TTS/Chat), Supabase (embeddings/vectors) | PENDING_DECISION (Zero persistent prompt storage policy; provider log retention pending DPA) | **VERIFIED** | 25 |
| `CAT-09-NOTIFICATIONS` | Notifications, device tokens and delivery receipts | `public.push_tokens, public.notifications, public.notification_deliveries, public.notification_preferences` | Expo Push Service, Firebase Cloud Messaging (FCM), Apple Push Notification service (APNs), OneSignal | PENDING_DECISION (Invalid tokens pruned immediately; delivery history retention pending approval) | **VERIFIED** | 25 |
| `CAT-10-ANALYTICS-ADS` | Analytics, diagnostics, cookies and advertising | `Client cookies (shoonaya_consent_v1), browser localStorage, vendor cloud telemetry` | Google Analytics 4, Google AdSense, Vercel Analytics, Vercel Speed Insights | PENDING_DECISION (Web consent state retained 12 months; vendor data retention configured in consoles) | **VERIFIED** | 11 |
| `CAT-11-MEDIA-UPLOADS` | Uploads, profile images, share cards and media | `Supabase Storage S3 buckets (avatars, mandali-uploads, share-cards)` | Supabase Storage | PENDING_DECISION (Objects deleted on user replacement or account purge; CDN cache TTL) | **VERIFIED** | 25 |
| `CAT-12-PAYMENTS` | Payments, subscriptions and store purchases | `public.subscriptions, public.payment_orders, public.transactions` | Razorpay, Apple In-App Purchases (if active), Google Play Billing (if active) | PENDING_DECISION (Statutory legal hold period e.g. 7 years for financial records) | **VERIFIED** | 25 |
| `CAT-13-GUEST-DATA` | Guest-mode and unauthenticated records | `Browser localStorage / Native AsyncStorage, ephemeral birth_profiles (if session saved)` | Supabase (ephemeral), Local Device Storage | PENDING_DECISION (Guest profile purge schedule pending decision) | **DECISION_REQUIRED** | 25 |
| `CAT-14-LOGS-ADMIN` | Logs, backups, cron/workflow state and administrator access | `Vercel serverless log streams, Supabase daily backup archive, GitHub Actions build artifacts` | Vercel, Supabase, GitHub | PENDING_DECISION (Provider backup rotation 7-30 days; admin audit log retention pending decision) | **VERIFIED** | 25 |

## Database Access Probe

- Profiles state: **SECURED**
- Anonymous row count: unavailable
- Administrative row count: 16
- Explanation: The anonymous role was explicitly denied access.
- Limitation: The Data API probes verify effective anonymous access and aggregate counts. Exact live PostgreSQL grants, policy expressions, view security and RPC privileges require a separate metadata query through an approved database connection or Supabase MCP.

## Inventory Checks

| ID | Status | Category | Check | Evidence |
|---|---|---|---|---:|
| INV-PROF-01 | VERIFIED | Sensitive profile access | Anonymous profiles access probe | 20 |
| INV-PROF-02 | VERIFIED | Sensitive profile access | Profile read and write paths | 30 |
| INV-SDK-01 | VERIFIED | Third-party SDKs and trackers | Web tracker initialization | 21 |
| INV-SDK-02 | VERIFIED | Third-party SDKs and trackers | Native analytics consent control | 8 |
| INV-CACHE-01 | VERIFIED | Client storage and identity | Discovered browser and native storage keys | 30 |
| INV-AGE-01 | VERIFIED | DOB, birth and location | Centralized age-policy enforcement | 30 |
| INV-TERMS-01 | VERIFIED | Terms and consent | Versioned Terms acceptance receipts | 12 |
| INV-CONSENT-01 | NEEDS_POLICY_DECISION | Terms and consent | Religious-profile consent | 26 |
| INV-UGC-01 | VERIFIED | UGC safety | Mandali safety paths | 30 |
| INV-UGC-02 | VERIFIED | UGC safety | Published support path | 15 |
| INV-LIFE-01 | VERIFIED | Data lifecycle | Account deletion and export paths | 30 |
| INV-LIFE-02 | VERIFIED | Data lifecycle | Guest birth-profile retention | 2 |

## Profile Contract

Generated types expose 79 profile columns:

| Column | Type | Engineering classification |
|---|---|---|
| `active_symbol_id` | `string \| null` | unclassified |
| `app_language` | `string` | unclassified |
| `avatar_url` | `string \| null` | public_candidate |
| `ban_reason` | `string \| null` | sensitive_candidate |
| `bio` | `string \| null` | public_candidate |
| `calendar_language` | `string \| null` | unclassified |
| `calendar_profile` | `string \| null` | unclassified |
| `calendar_scope` | `'major_only' \| 'all_observances' \| null` | unclassified |
| `city` | `string \| null` | unclassified |
| `consent_religious_data` | `boolean` | sensitive_candidate |
| `consent_updated_at` | `string \| null` | sensitive_candidate |
| `country` | `string \| null` | unclassified |
| `country_code` | `string \| null` | unclassified |
| `created_at` | `string` | unclassified |
| `custom_greeting` | `string \| null` | unclassified |
| `date_of_birth` | `string \| null` | sensitive_candidate |
| `deletion_requested_at` | `string \| null` | sensitive_candidate |
| `entitlement_source` | `string \| null` | internal_candidate |
| `entitlement_updated_at` | `string \| null` | internal_candidate |
| `full_name` | `string` | unclassified |
| `gender_context` | `string \| null` | sensitive_candidate |
| `gotra` | `string \| null` | sensitive_candidate |
| `home_city` | `string \| null` | sensitive_candidate |
| `home_country` | `string \| null` | sensitive_candidate |
| `home_latitude` | `number \| null` | sensitive_candidate |
| `home_longitude` | `number \| null` | sensitive_candidate |
| `home_timezone` | `string \| null` | sensitive_candidate |
| `home_town` | `string \| null` | sensitive_candidate |
| `id` | `string` | unclassified |
| `is_admin` | `boolean` | internal_candidate |
| `is_banned` | `boolean` | internal_candidate |
| `is_deleting` | `boolean` | internal_candidate |
| `is_pro` | `boolean` | unclassified |
| `ishta_devata` | `string \| null` | sensitive_candidate |
| `japa_reminder_enabled` | `boolean` | internal_candidate |
| `japa_reminder_time` | `string` | internal_candidate |
| `kul_devata` | `string \| null` | sensitive_candidate |
| `languages` | `string[]` | unclassified |
| `last_freeze_used` | `string \| null` | unclassified |
| `last_shloka_date` | `string \| null` | unclassified |
| `latitude` | `number \| null` | sensitive_candidate |
| `legacy_family_name` | `string \| null` | unclassified |
| `life_stage` | `string \| null` | unclassified |
| `life_stage_locked` | `boolean` | unclassified |
| `longitude` | `number \| null` | sensitive_candidate |
| `mandali_id` | `string \| null` | unclassified |
| `meaning_language` | `string` | unclassified |
| `monthly_seva` | `number` | internal_candidate |
| `nitya_reminder_enabled` | `boolean` | internal_candidate |
| `nitya_reminder_time` | `string` | internal_candidate |
| `notification_quiet_hours_end` | `number \| null` | internal_candidate |
| `notification_quiet_hours_start` | `number \| null` | internal_candidate |
| `observance_location_source` | `'manual' \| 'device' \| 'unset' \| null` | unclassified |
| `onboarding_completed` | `boolean` | unclassified |
| `onboarding_goal` | `string \| null` | unclassified |
| `onesignal_player_id` | `string \| null` | sensitive_candidate |
| `quiz_reminder_enabled` | `boolean` | internal_candidate |
| `quiz_reminder_time` | `string` | internal_candidate |
| `sampradaya` | `string \| null` | sensitive_candidate |
| `scripture_script` | `string` | unclassified |
| `seeking` | `string[]` | unclassified |
| `seva_score` | `number` | internal_candidate |
| `shloka_streak` | `number` | internal_candidate |
| `show_transliteration` | `boolean` | unclassified |
| `spiritual_level` | `string \| null` | unclassified |
| `streak_freeze_count` | `number` | internal_candidate |
| `subscription_expires_at` | `string \| null` | internal_candidate |
| `subscription_status` | `'free' \| 'pro' \| 'kul_pro' \| 'grace' \| 'expired'` | internal_candidate |
| `timezone` | `string \| null` | sensitive_candidate |
| `tradition` | `string \| null` | sensitive_candidate |
| `transliteration_language` | `string` | unclassified |
| `updated_at` | `string` | unclassified |
| `username` | `string` | public_candidate |
| `wants_community_notifications` | `boolean` | internal_candidate |
| `wants_family_notifications` | `boolean` | internal_candidate |
| `wants_festival_reminders` | `boolean` | internal_candidate |
| `wants_nitya_reminders` | `boolean` | internal_candidate |
| `wants_shloka_reminders` | `boolean` | internal_candidate |
| `weekly_seva` | `number` | internal_candidate |

## Providers And SDKs

- Supabase: 100 evidence locations
- Google Analytics 4: 1 evidence locations
- Google AdSense: 4 evidence locations
- OneSignal: 100 evidence locations
- Firebase Analytics: 2 evidence locations
- Expo Notifications: 47 evidence locations
- Razorpay: 79 evidence locations
- Twilio: 24 evidence locations
- Sarvam AI: 100 evidence locations
- Vercel Analytics: 2 evidence locations
- Vercel Speed Insights: 2 evidence locations

## Decision Gates

- INV-CONSENT-01: Approve covered fields, decline behavior, withdrawal behavior and consent version before implementation.

## Reproduction

```bash
npm run baseline:privacy
npm run test:baseline:privacy
```
