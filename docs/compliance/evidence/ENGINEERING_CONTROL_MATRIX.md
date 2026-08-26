# Engineering Control Matrix

This matrix maps every legal, regulatory, and policy commitment to concrete, auditable engineering controls, database constraints, middleware routes, and test suites across both repositories.

## Control Mapping

| Control ID | Policy / Regulatory Requirement | Implementing Code / Constraint | Automated Test Suite | Verification Status |
|---|---|---|---|---|
| `CTRL-SEC-01` | RLS Base Table Protection (Profiles Lockdown) | `supabase/migrations/20260824162430_lock_down_profiles_reads.sql`, `FORCE ROW LEVEL SECURITY`, `DROP POLICY "Public profiles are viewable by everyone"` | `scripts/generate-privacy-security-baseline.test.ts` (Classify probe) | **PASS** |
| `CTRL-SEC-02` | Public Profile View Column Narrowing | `public_profiles` view exposing only `id, username, full_name, avatar_url, bio, created_at` (excluding DOB, lat/lng, tradition, onesignal) | `npm run verify:profiles-containment-shadow` | **PASS** |
| `CTRL-PRIV-01` | Prior-Consent Web Tracker Loading | `src/components/privacy/WebConsentManager.tsx`, `src/lib/web-consent.ts` (Scripts loaded only after user opt-in) | `src/lib/web-consent.test.ts` | **PASS** |
| `CTRL-PRIV-02` | Removal of Native Firebase Analytics | `shoonaya-mobile/package.json` (Firebase Analytics removed; Core & FCM retained for push) | `npm run verify:compliance-engineering` | **PASS** |
| `CTRL-PRIV-03` | Non-Default Religious Consent | `shoonaya-mobile/app/settings.tsx` (`consent_religious_data: false`) | `npm run verify:compliance-engineering` | **PASS** |
| `CTRL-AGE-01` | Non-Blocking Age Guidance Notice | `src/lib/compliance/age-guidance.ts`, `AgeGuidanceNotice` on Onboarding, Profile, Kundali, and Kul Vansh | `npm run verify:compliance-engineering` | **PASS** |
| `CTRL-UGC-01` | Authenticated Rate-Limited Mandali Writes | `src/app/api/mandali/posts/route.ts`, `src/app/api/mandali/comments/route.ts`, `src/app/api/mandali/report/route.ts` (`getApiUser`, `rateLimitByIp`) | `src/lib/mandali-write-contract.test.ts` | **PASS** |
| `CTRL-UGC-02` | Symmetric Blocking & Muting Filters | `src/lib/user-safety.ts`, `public.user_blocked_profiles` | `npm run verify:compliance-engineering` | **PASS** |
| `CTRL-LIFE-01` | Account Deletion Cascade & Grace Period | `DELETE /api/user/delete`, `public.deleted_accounts`, `purgeDueDeletedAccounts()` | `scripts/generate-privacy-security-baseline.test.ts` | **PASS** |
| `CTRL-LIFE-02` | Destructive Retention Jobs Disabled | `docs/DATA_LIFECYCLE_REGISTRY.json` (`destructiveJobsEnabled: false`, periods `null`) | `npm run verify:compliance-engineering` | **PASS** |
| `CTRL-IP-01` | Public Sourcing & Copyright Disclosures | `src/app/api/public/sources/route.ts`, `src/lib/public-source-disclosures.ts` | `src/lib/public-source-disclosures.test.ts` | **PASS** |
| `CTRL-STORE-01` | Zero iOS Tracking Manifest | `shoonaya-mobile/app.json` (`ios.privacyManifests.NSPrivacyTracking: false`) | `npm run verify:compliance-engineering` | **PASS** |
