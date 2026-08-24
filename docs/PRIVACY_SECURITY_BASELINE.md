# Machine-Generated Privacy and Security Baseline

**Generated**: 2026-08-24T15:04:55.792Z  
**Authoritative Generator**: `scripts/generate-privacy-security-baseline.ts`  
**Target Repositories**: `Sanatan Sangam/Shoonaya` (PWA/Backend) & `shoonaya-mobile` (Native)  
**Live Project**: `mnbwodcswxoojndytngu.supabase.co`

---

## 1. Executive Summary & Verification Counts

All counts below are derived directly from the automated inventory generator.

| Metric | Count |
|---|---|
| **Total Inventory Items** | **23** |
| **VERIFIED (Confirmed in Code / Live DB)** | **21** |
| **NEEDS POLICY DECISION** | **2** |
| **DRIFT** | **0** |
| **NOT FOUND** | **0** |

### Contract Ownership
- **Backend (Canonical)**: 16
- **Native**: 5
- **Shared Contract**: 2

---

## 2. Live Database & Schema Exposure Audit

| Security Boundary | Live Status | Impact |
|---|---|---|
| **Profiles `anon` SELECT Exposure** | `CRITICAL EXPOSURE (TRUE)` | Public profiles are viewable by everyone (SELECT USING (true)) |
| **Total Profile Columns** | **30 columns** | 26 sensitive / special-category columns |

### Live Table Record Counts (Aggregate Schema Only — No PII)
- `profiles`: `15 rows`
- `birth_profiles`: `15 rows`
- `posts`: `4 rows`
- `post_comments`: `3 rows`
- `content_reports`: `0 rows`
- `user_blocked_profiles`: `0 rows`
- `user_muted_profiles`: `0 rows`
- `user_hidden_content`: `1 rows`
- `deleted_accounts`: `NOT FOUND / UNMIGRATED`
- `golden_fixtures`: `298 rows`
- `calendar_governance_diagnostics_cache`: `7 rows`
- `user_settings`: `NOT FOUND / UNMIGRATED`
- `consent_records`: `NOT FOUND / UNMIGRATED`
- `terms_acceptances`: `NOT FOUND / UNMIGRATED`

---

## 3. Sensitive Profile Columns Classification

| Column Name | Data Type | Sensitivity Classification |
|---|---|---|
| `id` | `uuid` | Identifier (Auth UID) |
| `full_name` | `text` | PII (Direct) |
| `username` | `text` | Public Handle |
| `avatar_url` | `text` | Public Media |
| `bio` | `text` | Public Bio |
| `date_of_birth` | `date` | PII / Special Category (Age/DOB) |
| `gender_context` | `text` | Demographic / Sensitive |
| `life_stage` | `text` | Spiritual / Personal Stage |
| `tradition` | `text` | Special Category (Religious belief - GDPR Art 9) |
| `sampradaya` | `text` | Special Category (Religious sect - GDPR Art 9) |
| `ishta_devata` | `text` | Special Category (Religious deity - GDPR Art 9) |
| `gotra` | `text` | Special Category (Lineage / Castemark) |
| `kul_devata` | `text` | Special Category (Religious deity - GDPR Art 9) |
| `rashi` | `text` | Astrological / Religious Data |
| `nakshatra` | `text` | Astrological / Religious Data |
| `latitude` | `double precision` | Precise Geolocation (Device/Home) |
| `longitude` | `double precision` | Precise Geolocation (Device/Home) |
| `city` | `text` | Location / Coarse |
| `country` | `text` | Location / Coarse |
| `home_town` | `text` | Location / Birthplace |
| `neighbourhood` | `text` | Location / Neighborhood |
| `onesignal_player_id` | `text` | Push Identifier / Device Token |
| `is_banned` | `boolean` | Moderation / Internal Status |
| `ban_reason` | `text` | Moderation / Internal Notes |
| `karma_points` | `integer` | Gamification Karma Score |
| `consent_religious_data` | `boolean` | Consent Flag (Special Category) |
| `consent_updated_at` | `timestamptz` | Consent Audit Timestamp |
| `unsubscribe_token` | `text` | Direct Marketing Auth Token |
| `is_deleting` | `boolean` | Lifecycle Deletion Flag |
| `deletion_requested_at` | `timestamptz` | Lifecycle Deletion Timestamp |

---

## 4. Comprehensive Inventory by Category

### [INV-PROF-01] Profiles Table Anonymous SELECT Grant
- **Category**: 1. Sensitive Profile Fields & Paths
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `supabase/public_schema.sql (L11495) / Live DB Policy: "Public profiles are viewable by everyone"`
- **Description**: Direct SELECT on public.profiles is granted to role anon with USING(true), exposing all 80+ columns including DOB, religion, and coordinates.
- **Notes**: *P0 Critical Vulnerability. Unauthenticated callers can harvest all profile records.*

### [INV-PROF-02] PWA Profile Read/Write API Routes
- **Category**: 1. Sensitive Profile Fields & Paths
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/api/profile/route.ts, src/app/api/onboarding/route.ts`
- **Description**: PWA routes /api/profile and /api/onboarding read and update profile fields with Supabase auth.

### [INV-PROF-03] Native Onboarding Contract Profile Payload
- **Category**: 1. Sensitive Profile Fields & Paths
- **Status**: **VERIFIED**
- **Canonical Ownership**: `shared_contract`
- **Location**: `shoonaya-mobile: lib/onboarding-contract.ts (L107-154)`
- **Description**: Native buildOnboardingProfilePayload packages tradition, DOB, gotra, rashi, nakshatra, calendarProfile without explicit consent capture.

### [INV-RLS-01] Public Table RLS State
- **Category**: 2. Database Grants & RLS Policies
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `supabase/step2_constraints_policies.sql`
- **Description**: Audit of Row Level Security across public schema tables.

### [INV-RLS-02] Birth Profiles RLS Policies
- **Category**: 2. Database Grants & RLS Policies
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `supabase/migrations/016_birth_profiles.sql`
- **Description**: birth_profiles stores chart DOB, time, birth lat/lng with owner_id or session_token.

### [INV-SDK-01] Web Google Analytics 4 Unconditional Loading
- **Category**: 3. Third-Party SDKs & Trackers
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/layout.tsx (L139, L210-220)`
- **Description**: GA4 is loaded unconditionally in RootLayout head with hardcoded fallback measurement ID 'G-548KZ0TBHD'.
- **Notes**: *PECR/ePrivacy violation in UK/EU: tracker script executed before consent choice.*

### [INV-SDK-02] Web Google AdSense Script Tag
- **Category**: 3. Third-Party SDKs & Trackers
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/layout.tsx (L222-227)`
- **Description**: Google AdSense script is injected unconditionally in RootLayout.

### [INV-SDK-03] Web OneSignal Web Push SDK
- **Category**: 3. Third-Party SDKs & Trackers
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/layout.tsx (L197-208)`
- **Description**: OneSignal SDK v16 is initialized unconditionally in RootLayout when NEXT_PUBLIC_ONESIGNAL_APP_ID is present.

### [INV-SDK-04] Native Firebase Analytics (Android-Only Guard)
- **Category**: 3. Third-Party SDKs & Trackers
- **Status**: **VERIFIED**
- **Canonical Ownership**: `native`
- **Location**: `shoonaya-mobile: lib/analytics.ts (L24-35)`
- **Description**: Native Firebase Analytics is active strictly on Android, guarded by Platform.OS !== 'android'.

### [INV-SDK-05] AI Provider (Sarvam AI)
- **Category**: 3. Third-Party SDKs & Trackers
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/lib/sarvam.ts`
- **Description**: Sarvam AI is used for speech-to-text / translation API routes.

### [INV-SDK-06] Payment Gateway (Razorpay)
- **Category**: 3. Third-Party SDKs & Trackers
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/api/payment/route.ts`
- **Description**: Razorpay integration for Kul Pro / donations.

### [INV-CACHE-01] Web Browser Cookies
- **Category**: 4. Storage & Identity Cache Keys
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/middleware.ts, src/lib/admin-auth.ts`
- **Description**: Authentication and session cookies managed by PWA and middleware.

### [INV-CACHE-02] Web localStorage Identity Keys
- **Category**: 4. Storage & Identity Cache Keys
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/layout.tsx, src/hooks/useProfile.ts`
- **Description**: PWA localStorage keys used for instant hydration and user settings.

### [INV-CACHE-03] Native AsyncStorage Keys
- **Category**: 4. Storage & Identity Cache Keys
- **Status**: **VERIFIED**
- **Canonical Ownership**: `native`
- **Location**: `shoonaya-mobile: lib/homeCache.ts, app/settings.tsx`
- **Description**: Native storage keys containing profile, preferences, and home cache.

### [INV-ENTRY-01] Guest Jyotish Chart Endpoint (Age Verification Gap)
- **Category**: 5. DOB, Birth & Location Entry Points
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/api/jyotish/chart/route.ts (L67-72)`
- **Description**: POST /api/jyotish/chart accepts date_of_birth, birth_lat, birth_lng, and session_token with zero age gating or parental consent.
- **Notes**: *Children's privacy exposure under DPDP (India) and COPPA/GDPR.*

### [INV-ENTRY-02] Native Device Location Service
- **Category**: 5. DOB, Birth & Location Entry Points
- **Status**: **VERIFIED**
- **Canonical Ownership**: `native`
- **Location**: `shoonaya-mobile: lib/locationService.ts`
- **Description**: Native locationService requests device GPS for panchang sunrise/sunset calculation.

### [INV-TERMS-01] Native Login/Signup Passive Terms Link
- **Category**: 6. Terms & Privacy Acceptance
- **Status**: **VERIFIED**
- **Canonical Ownership**: `native`
- **Location**: `shoonaya-mobile: app/(auth)/login.tsx (L998-1020)`
- **Description**: Mobile login displays passive 'Terms of Service' text without explicit affirmative checkbox and without recording accepted version or timestamp.
- **Notes**: *L-05: Deficient contract formation and lack of auditable acceptance receipts.*

### [INV-TERMS-02] Settings Religious Data Consent Toggle Disconnect
- **Category**: 6. Terms & Privacy Acceptance
- **Status**: **VERIFIED**
- **Canonical Ownership**: `shared_contract`
- **Location**: `shoonaya-mobile: app/settings.tsx (L67)`
- **Description**: Settings screen defaults consent_religious_data to true and toggling off does not clear data or prevent collection.
- **Notes**: *L-03: Default-on special-category consent violates GDPR Art 9 & DPDP.*

### [INV-UGC-01] User Safety State & Content Moderation
- **Category**: 7. Mandali UGC & Safety
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/lib/user-safety.ts, src/app/api/user/report/route.ts`
- **Description**: Mandali feed supports block, mute, hide, and content report via content_reports, user_blocked_profiles, user_muted_profiles.

### [INV-UGC-02] Apple Guideline 1.2 UGC Compliance Gate
- **Category**: 7. Mandali UGC & Safety
- **Status**: **NEEDS POLICY DECISION**
- **Canonical Ownership**: `native`
- **Location**: `shoonaya-mobile: docs/LEGAL_RISK_ASSESSMENT.md (L-08)`
- **Description**: App Store requires published contact info, report mechanism, block user, and timely moderation response for UGC apps.

### [INV-DEL-01] Account Deletion 30-Day Cool-Off Workflow
- **Category**: 8. Data Lifecycle, Deletion & Export
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/lib/account-deletion.ts, src/app/api/cron/purge-deleted-accounts/route.ts`
- **Description**: POST /api/user/delete/request initiates 30-day grace period; purgeDueDeletedAccounts cron executes hard delete.

### [INV-DEL-02] User Data Export Route
- **Category**: 8. Data Lifecycle, Deletion & Export
- **Status**: **VERIFIED**
- **Canonical Ownership**: `backend`
- **Location**: `Sanatan Sangam/Shoonaya: src/app/api/user/export/route.ts`
- **Description**: GET /api/user/export generates JSON archive of user profile, sadhana, mood checkins, recommendations, mala sessions, and karma ledger.

### [INV-DEL-03] Guest Session Data Lifecycle & Retention Policy
- **Category**: 8. Data Lifecycle, Deletion & Export
- **Status**: **NEEDS POLICY DECISION**
- **Canonical Ownership**: `backend`
- **Location**: `supabase/migrations/016_birth_profiles.sql`
- **Description**: Retention schedule and automatic cleanup job for unattached guest birth profiles.


---

## 5. Independent Review Gate for Prompt 1

> [!IMPORTANT]
> **Prompt 0 is complete.** This machine-generated baseline must be independently reviewed before initiating **Prompt 1 (P0 Profiles Exposure Containment)**.
> No production data, secrets, or application behaviors were altered during this step.
