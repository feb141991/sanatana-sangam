# Machine-Generated Privacy and Security Engineering Baseline

**Schema version:** 2
**Source fingerprint:** `37ed11cdb6dbab3a41708613ec11f2bc42d68d9576dd0b362826660f22978e97`

> This is an engineering evidence inventory, not legal advice. UNKNOWN and
> ERROR states are never equivalent to a secure or compliant result.

## Summary

- Inventory checks: 12
- Scanned files: backend 3101, Native 960
- Literal storage keys: backend 57, Native 22
- Providers/SDKs discovered: 11
- VERIFIED: 9
- NOT_FOUND: 0
- DRIFT: 2
- NEEDS_POLICY_DECISION: 1
- UNKNOWN: 0
- ERROR: 0

## Database Access Probe

- Profiles state: **EXPOSED**
- Anonymous row count: 16
- Administrative row count: 16
- Explanation: An unauthenticated query could count rows while selecting sensitive columns.
- Limitation: The Data API probes verify effective anonymous access and aggregate counts. Exact live PostgreSQL grants, policy expressions, view security and RPC privileges require a separate metadata query through an approved database connection or Supabase MCP.

## Inventory Checks

| ID | Status | Category | Check | Evidence |
|---|---|---|---|---:|
| INV-PROF-01 | DRIFT | Sensitive profile access | Anonymous profiles access probe | 20 |
| INV-PROF-02 | VERIFIED | Sensitive profile access | Profile read and write paths | 30 |
| INV-SDK-01 | DRIFT | Third-party SDKs and trackers | Web tracker initialization | 30 |
| INV-SDK-02 | VERIFIED | Third-party SDKs and trackers | Native analytics consent control | 17 |
| INV-CACHE-01 | VERIFIED | Client storage and identity | Discovered browser and native storage keys | 30 |
| INV-AGE-01 | VERIFIED | DOB, birth and location | Centralized age-policy enforcement | 30 |
| INV-TERMS-01 | VERIFIED | Terms and consent | Versioned Terms acceptance receipts | 5 |
| INV-CONSENT-01 | NEEDS_POLICY_DECISION | Terms and consent | Religious-profile consent | 30 |
| INV-UGC-01 | VERIFIED | UGC safety | Mandali safety paths | 30 |
| INV-UGC-02 | VERIFIED | UGC safety | Published support path | 30 |
| INV-LIFE-01 | VERIFIED | Data lifecycle | Account deletion and export paths | 30 |
| INV-LIFE-02 | VERIFIED | Data lifecycle | Guest birth-profile retention | 7 |

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
- Google Analytics 4: 8 evidence locations
- Google AdSense: 6 evidence locations
- OneSignal: 100 evidence locations
- Firebase Analytics: 6 evidence locations
- Expo Notifications: 54 evidence locations
- Razorpay: 95 evidence locations
- Twilio: 32 evidence locations
- Sarvam AI: 100 evidence locations
- Vercel Analytics: 7 evidence locations
- Vercel Speed Insights: 7 evidence locations

## Decision Gates

- INV-CONSENT-01: Approve covered fields, decline behavior, withdrawal behavior and consent version before implementation.

## Reproduction

```bash
npm run baseline:privacy
npm run test:baseline:privacy
```
