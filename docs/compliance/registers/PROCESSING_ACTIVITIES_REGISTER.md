# Record of Processing Activities (ROPA)

**Organization:** Shoonaya (Sanatan Sangam)
**Version:** 2026-08-25.v1
**Legal Governance Status:** `PROPOSED_COUNSEL_REVIEW` (All lawful bases and Article 9 conditions are proposed by engineering and subject to final counsel ratification).

> This register fulfills Article 30 of the UK GDPR and provides a complete, factual accounting of all data processing operations across Web and Native platforms.

## Processing Activities Summary

| Activity ID | Name | Category | Special Cat? | Proposed Art. 6 Basis | Proposed Art. 9 Condition | Deletion Path | Confidence |
|---|---|---|---|---|---|---|---|
| `ROPA-01-AUTH` | Account Registration, Authentication & Identity Management | Account & Authentication | No | Art. 6(1)(b) Contract Performance | N/A | RET-01-AUTH | **FACT_VERIFIED** |
| `ROPA-02-RELIGIOUS` | Spiritual Personalization & Religious Practice Profiling | Religious & Spiritual Data | Yes | Art. 6(1)(b) Contract Performance / Art. 6(1)(a) Consent | Art. 9(2)(a) Explicit Consent | RET-02-REL | **FACT_VERIFIED** |
| `ROPA-03-BIRTH-JYOTISH` | Astrological Birth Chart (Kundali) & Kul Family Lineage Processing | DOB, Birth & Family Data | No | Art. 6(1)(b) Contract Performance | N/A | RET-03-BIRTH | **FACT_VERIFIED** |
| `ROPA-04-LOCATION` | Location-Aware Astronomical & Civil Time Calculations | Location Data | No | Art. 6(1)(b) Contract Performance / Art. 6(1)(a) Consent | N/A | RET-04-LOC | **FACT_VERIFIED** |
| `ROPA-05-MOOD-SANKALPA` | Spiritual Growth, Mood Journaling & Intention (Sankalpa) Tracking | Journal & Mood Data | No | Art. 6(1)(b) Contract Performance | N/A | RET-05-MOOD | **FACT_VERIFIED** |
| `ROPA-06-PRACTICE-PROGRESS` | Sadhana, Japa Counter, Pathshala Learning & Quiz History | Practice & Learning Progress | No | Art. 6(1)(b) Contract Performance | N/A | RET-06-PRAC | **FACT_VERIFIED** |
| `ROPA-07-COMMUNITY-MANDALI` | Mandali Community Feed, Interaction & Trust & Safety Moderation | UGC & Community Safety | No | Art. 6(1)(b) Contract Performance & Art. 6(1)(f) Legitimate Interests | N/A | RET-07-UGC | **FACT_VERIFIED** |
| `ROPA-08-AI-PRAMANA` | Pramana AI Dharma Guidance, Scripture QA & Speech Synthesis (TTS) | AI Prompts & Generated Content | No | Art. 6(1)(b) Contract Performance | N/A | RET-08-AI | **FACT_VERIFIED** |
| `ROPA-09-NOTIFICATIONS` | Ritual Reminders, Daily Panchang Push & Quiet Hours Delivery | Notifications & Device Tokens | No | Art. 6(1)(a) Consent | N/A | RET-09-NOTIF | **FACT_VERIFIED** |
| `ROPA-10-ANALYTICS-ADS` | Product Diagnostics, Performance Telemetry & Consented Web Advertising | Analytics, Diagnostics & Ads | No | Art. 6(1)(a) Consent | N/A | RET-10-ANALYTICS | **FACT_VERIFIED** |
| `ROPA-11-MEDIA-UPLOADS` | User Media Uploads, Profile Avatars & Shareable Festival Cards | User Uploads & Media | No | Art. 6(1)(b) Contract Performance | N/A | RET-11-MEDIA | **FACT_VERIFIED** |
| `ROPA-12-PAYMENTS` | Premium Subscriptions, Temple Seva Donations & Financial Invoicing | Payments & Subscriptions | No | Art. 6(1)(b) Contract Performance & Art. 6(1)(c) Legal Obligation | N/A | RET-12-PAY | **FACT_VERIFIED** |
| `ROPA-13-GUEST-DATA` | Guest Panchang Exploration & Ephemeral Chart Calculation | Guest Mode Records | No | Art. 6(1)(b) Contract / Art. 6(1)(f) Legitimate Interests | N/A | RET-13-GUEST | **FACT_VERIFIED** |
| `ROPA-14-LOGS-ADMIN` | System Audit Logs, Infrastructure Backups & Administrative Access | Logs & Infrastructure | No | Art. 6(1)(f) Legitimate Interests | N/A | RET-14-LOGS | **FACT_VERIFIED** |

## Detailed Processing Records

### ROPA-01-AUTH: Account Registration, Authentication & Identity Management

- **Category**: Account & Authentication
- **Data Subjects**: Registered Users, Subscribers
- **Data Fields**: User ID, Email, Hashed Password / OAuth Token, Phone Number (OTP), Username, Profile Name, Avatar URL
- **Special Category (Art. 9)**: No
- **Purpose**: Creating and authenticating user accounts, maintaining secure login sessions, and managing access rights across Web and Native platforms.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance (delivering authentication service requested by user)`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Direct user input via Signup / Login forms, Google OAuth, Apple Sign-In, Twilio WhatsApp OTP
- **Mandatory / Optional**: Mandatory for service
- **Processors & Vendors**: Supabase Inc. (Auth & DB), Google LLC (OAuth), Apple Inc. (Apple Sign-in), Twilio Inc. (WhatsApp OTP)
- **Storage Target**: `Supabase PostgreSQL (`auth.users`, `public.profiles`)`
- **Deletion & Export Path**: Initiated via `DELETE /api/user/delete` -> 30-day cancellation window in `deleted_accounts` -> Automated hard delete via `purgeDueDeletedAccounts()`
- **Security Controls**: Bcrypt/Argon2 password hashing, JWT Bearer tokens, HTTPS/TLS 1.3, Supabase RLS, Row-Level isolation
- **Linked DPIA Risk**: `RISK-01-PROF`
- **Code Evidence**: `src/app/api/auth/*, src/types/database.ts:profiles, app/(auth)/*`

### ROPA-02-RELIGIOUS: Spiritual Personalization & Religious Practice Profiling

- **Category**: Religious & Spiritual Data
- **Data Subjects**: Registered Users
- **Data Fields**: Tradition (Sampradaya), Gotra, Ishta Devata, Rashi, Nakshatra, Deity Preferences, Spiritual Goals, Karma/Seva Points
- **Special Category (Art. 9)**: YES - Religious Data
- **Purpose**: Personalizing the Panchang calendar, custom ritual reminders, sadhana suggestions, and tradition-specific observances (e.g. Vaishnava vs Smartha tithis).
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance / Art. 6(1)(a) Consent`
- **Proposed Article 9 Condition**: `Art. 9(2)(a) Explicit Consent (special category religious data under UK/EU GDPR)`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Direct user input during Onboarding questionnaire or Settings / Personal Details screens
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc. (PostgreSQL Storage)
- **Storage Target**: `Supabase PostgreSQL (`public.profiles`, `public.user_settings`)`
- **Deletion & Export Path**: Directly editable/clearable in UI by user (setting fields to null) or cascading purge on Account Deletion
- **Security Controls**: Supabase RLS locking base table from anonymous access; authenticated self-access only; column-level isolation
- **Linked DPIA Risk**: `RISK-02-REL`
- **Code Evidence**: `src/lib/onboarding-contract.ts, app/settings.tsx, src/app/api/profile/route.ts`

### ROPA-03-BIRTH-JYOTISH: Astrological Birth Chart (Kundali) & Kul Family Lineage Processing

- **Category**: DOB, Birth & Family Data
- **Data Subjects**: Registered Users, Guests, Family Members (entered by user)
- **Data Fields**: Date of Birth, Time of Birth, Place of Birth (City/Country), Birthplace Latitude & Longitude, Family Lineage (Kul Vansh)
- **Special Category (Art. 9)**: No
- **Purpose**: Calculating astrological chart positions (Kundali, Dasha, Bhavas), identifying Vedic day boundaries, and tracking ancestral lineage.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance (user-requested chart calculation)`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Direct user entry via Kundali generator, Kul Vansh form, or Guest Chart calculator
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc. (Storage), In-process Astronomy Engine (Astronomia / Astronomy-Engine)
- **Storage Target**: `Supabase PostgreSQL (`public.birth_profiles`, `public.profiles`), Client LocalStorage for ephemeral guest sessions`
- **Deletion & Export Path**: User deletion of saved birth profile row, profile field reset, or full account deletion cascade
- **Security Controls**: Server-side coordinate truncation, Age Guidance Notice display, RLS isolation
- **Linked DPIA Risk**: `RISK-03-AGE`
- **Code Evidence**: `src/app/api/jyotish/chart/route.ts, src/lib/compliance/age-guidance.ts, src/app/(main)/kul/*`

### ROPA-04-LOCATION: Location-Aware Astronomical & Civil Time Calculations

- **Category**: Location Data
- **Data Subjects**: Registered Users, Guests
- **Data Fields**: Foreground Device Coordinates (Latitude, Longitude), Saved Home Coordinates, Timezone Identifier, City / State / Country
- **Special Category (Art. 9)**: No
- **Purpose**: Computing local solar sunrise, sunset, moonrise, and local civil tithi transitions necessary for ritual timing.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance / Art. 6(1)(a) Consent (OS Permission)`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Browser Geolocation API / Native Expo Location (`requestForegroundPermissionsAsync`), or manual city search
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc. (Home Coords), OpenStreetMap / Nominatim (Geocoding lookup)
- **Storage Target**: `Transient device memory, client storage (`AsyncStorage`/`localStorage`), `public.profiles` (`home_latitude`, `home_longitude`)`
- **Deletion & Export Path**: Revoke location permission in device settings, clear home location in profile, or account deletion
- **Security Controls**: Foreground-only permission prompt (zero background location tracking), TLS 1.3 in transit
- **Linked DPIA Risk**: `RISK-05-LOC`
- **Code Evidence**: `src/lib/geo.ts, src/app/api/geocode/route.ts, shoonaya-mobile/lib/location.ts`

### ROPA-05-MOOD-SANKALPA: Spiritual Growth, Mood Journaling & Intention (Sankalpa) Tracking

- **Category**: Journal & Mood Data
- **Data Subjects**: Registered Users
- **Data Fields**: Mood Ratings, Energy Levels, Sankalpa Intention Text, Target Fulfillment Date, Daily Spiritual Reflection Notes
- **Special Category (Art. 9)**: No
- **Purpose**: Enabling users to record personal reflections, commit to spiritual intentions (sankalpas), and monitor emotional/spiritual wellbeing over time.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Direct user input in Mood, Sankalpa, and Reflection screens
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc.
- **Storage Target**: `Supabase PostgreSQL (`public.mood_logs`, `public.sankalpas`, `public.daily_reflections`)`
- **Deletion & Export Path**: Direct item deletion via UI, or cascading account deletion purge
- **Security Controls**: Strict RLS self-access policies (`auth.uid() = user_id`)
- **Linked DPIA Risk**: `RISK-06-MOOD`
- **Code Evidence**: `src/app/(main)/mood/*, src/app/(main)/sankalpa/*, components/home/SankalpaCard.tsx`

### ROPA-06-PRACTICE-PROGRESS: Sadhana, Japa Counter, Pathshala Learning & Quiz History

- **Category**: Practice & Learning Progress
- **Data Subjects**: Registered Users
- **Data Fields**: Japa Beads Chanted, Mantra Identifiers, Chanting Duration, Pathshala Lesson Completion, Quiz Scores, Vrat Observances, Streaks
- **Special Category (Art. 9)**: No
- **Purpose**: Maintaining digital japa bead counting records, tracking curriculum progress in Pathshala, recording completed vrats, and maintaining spiritual practice streaks.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Direct user interaction with Japa bead counter, Pathshala modules, and Vrat observation buttons
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc.
- **Storage Target**: `Supabase PostgreSQL (`public.japa_sessions`, `public.pathshala_progress`, `public.quiz_attempts`, `public.vrat_observations`, `public.user_streaks`)`
- **Deletion & Export Path**: Account deletion cascade
- **Security Controls**: Authenticated route verification, RLS user-scoping
- **Linked DPIA Risk**: `RISK-09-CACHE`
- **Code Evidence**: `src/app/(main)/japa/*, src/app/(main)/pathshala/*, app/vrat.tsx`

### ROPA-07-COMMUNITY-MANDALI: Mandali Community Feed, Interaction & Trust & Safety Moderation

- **Category**: UGC & Community Safety
- **Data Subjects**: Community Participants, Reported Users
- **Data Fields**: Post Text, Comment Text, Attached Image URLs, Content Reports, Block List Records, Mute List Records, Moderator Action Logs
- **Special Category (Art. 9)**: No
- **Purpose**: Providing a moderated spiritual community forum for discussions, satsang, questions, and safety enforcement (blocking, reporting, filtering toxic content).
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance & Art. 6(1)(f) Legitimate Interests (protecting platform safety and preventing abuse)`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: User submitted posts, comments, reactions, and report/block actions
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc.
- **Storage Target**: `Supabase PostgreSQL (`public.posts`, `public.post_comments`, `public.content_reports`, `public.user_blocked_profiles`, `public.user_muted_profiles`, `public.moderation_logs`)`
- **Deletion & Export Path**: Author delete of post/comment; safety reports and moderation audit records preserved per safety retention policy
- **Security Controls**: Server-side rate limiting by IP/auth, input length constraints, symmetric blocking filter, privileged moderation RPCs
- **Linked DPIA Risk**: `RISK-08-UGC`
- **Code Evidence**: `src/app/api/mandali/*, src/lib/user-safety.ts, components/safety/ContentSafetyMenu.tsx`

### ROPA-08-AI-PRAMANA: Pramana AI Dharma Guidance, Scripture QA & Speech Synthesis (TTS)

- **Category**: AI Prompts & Generated Content
- **Data Subjects**: Users querying Pramana AI
- **Data Fields**: User Query Text, Scriptural Context Snippets, Generated Text Answers, Synthesized Audio Buffer, Model Parameters
- **Special Category (Art. 9)**: No
- **Purpose**: Answering theological and ritual questions using verified canonical scripture retrieval (RAG) and generating authentic Indic language audio recitation.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Direct user input in Ask Pramana search bar / Audio player
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Sarvam AI (Inference & TTS), Supabase Inc. (Vector Embeddings)
- **Storage Target**: `Ephemeral serverless memory, streaming response; vector embeddings in PostgreSQL pgvector. Zero persistent user prompt logging in DB.`
- **Deletion & Export Path**: Transient stream discarded after delivery; cache TTL rotation
- **Security Controls**: Prompt sanitization, strict RAG grounding in verified scripture, rate limiting, no training on user prompts under API agreement
- **Linked DPIA Risk**: `RISK-07-AI`
- **Code Evidence**: `src/app/api/pramana/*, packages/pramana-serve/*, python/ai_pipeline/*`

### ROPA-09-NOTIFICATIONS: Ritual Reminders, Daily Panchang Push & Quiet Hours Delivery

- **Category**: Notifications & Device Tokens
- **Data Subjects**: Registered & Guest App Users
- **Data Fields**: Expo Push Token, FCM Device Token, APNs Token, OneSignal Player ID, Per-Category Notification Preferences, Quiet Hours Times
- **Special Category (Art. 9)**: No
- **Purpose**: Dispatching timely reminder notifications for upcoming vrats, daily sunrise tithis, and auspicious muhurtas while respecting user quiet hours.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(a) Consent (OS Notification Permission) & Art. 6(1)(b) Contract`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: OS Push Permission dialog, Notification Preferences screen
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Expo Push Service (650 Industries), Google LLC (Firebase Cloud Messaging), Apple Inc. (APNs), OneSignal Inc.
- **Storage Target**: `Supabase PostgreSQL (`public.push_tokens`, `public.notification_preferences`, `public.notification_deliveries`)`
- **Deletion & Export Path**: Invalid token deletion on `DeviceNotRegistered` error, sign-out token wipe, or user preference toggle off
- **Security Controls**: Token isolation per user ID, quiet-hours suppression engine, no sensitive spiritual text in lock-screen payload summaries
- **Linked DPIA Risk**: `RISK-12-PUSH`
- **Code Evidence**: `src/app/api/notifications/*, shoonaya-mobile/app/settings.tsx, package.json:expo-notifications`

### ROPA-10-ANALYTICS-ADS: Product Diagnostics, Performance Telemetry & Consented Web Advertising

- **Category**: Analytics, Diagnostics & Ads
- **Data Subjects**: Website Visitors, App Users
- **Data Fields**: Consent Preferences Cookie, Page Views, App Load Errors, Client Platform / OS, AdSense Impression Identifiers (Web Consented Only)
- **Special Category (Art. 9)**: No
- **Purpose**: Monitoring platform performance, identifying rendering crashes, and serving non-personalized / personalized web advertisements only upon explicit consent.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(a) Consent (PECR / ePrivacy for Web Analytics & Ads) & Art. 6(1)(f) Legitimate Interests (essential crash diagnostics)`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Web Consent Manager banner, browser navigation events, Vercel edge telemetry
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Google LLC (GA4, AdSense), Vercel Inc. (Speed Insights, Analytics)
- **Storage Target**: `Client cookie (`shoonaya_consent_v1`), Google Cloud / Vercel cloud analytics dashboards. Native Firebase Analytics is removed.`
- **Deletion & Export Path**: Cookie preference reset in footer; provider-configured data retention periods (e.g. 14 months in GA4)
- **Security Controls**: Prior-consent gating via `WebConsentManager.tsx`, zero ad SDKs in Native mobile build, IP anonymization enabled
- **Linked DPIA Risk**: `RISK-11-VENDOR`
- **Code Evidence**: `src/components/privacy/WebConsentManager.tsx, src/lib/web-consent.ts, app.json:ios.privacyManifests`

### ROPA-11-MEDIA-UPLOADS: User Media Uploads, Profile Avatars & Shareable Festival Cards

- **Category**: User Uploads & Media
- **Data Subjects**: Registered Users
- **Data Fields**: Avatar Images, Mandali Post Attachments, Generated Festival Share Graphics
- **Special Category (Art. 9)**: No
- **Purpose**: Allowing users to customize their profile picture, share photographic community posts, and generate personalized spiritual greeting cards.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Direct file selection via device image picker
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc. (Storage Buckets)
- **Storage Target**: `Supabase Storage S3 buckets (`avatars`, `mandali-uploads`, `share-cards`)`
- **Deletion & Export Path**: Replaced avatars immediately deleted from bucket; account deletion purges all owned storage assets
- **Security Controls**: MIME-type validation, file size limits (5MB), randomized file naming to prevent enumeration
- **Linked DPIA Risk**: `RISK-08-UGC`
- **Code Evidence**: `src/app/api/profile/upload/route.ts, package.json:sharp, shoonaya-mobile/package.json:expo-image-picker`

### ROPA-12-PAYMENTS: Premium Subscriptions, Temple Seva Donations & Financial Invoicing

- **Category**: Payments & Subscriptions
- **Data Subjects**: Paying Customers, Donors
- **Data Fields**: Payment Order ID, Transaction ID, Amount, Currency, Subscription Tier, Payment Signature, Billing Name/Email
- **Special Category (Art. 9)**: No
- **Purpose**: Processing premium membership subscriptions, facilitating voluntary temple seva donations, and generating statutory tax receipts.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract Performance & Art. 6(1)(c) Legal Obligation (statutory tax and accounting laws)`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Razorpay checkout modal / Store In-App Purchases
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Razorpay Software Pvt. Ltd., Apple Inc. (IAP if enabled), Google LLC (Play Billing if enabled)
- **Storage Target**: `Supabase PostgreSQL (`public.subscriptions`, `public.payment_orders`, `public.transactions`). Card numbers handled solely by Razorpay (PCI-DSS compliant).`
- **Deletion & Export Path**: Statutory legal retention hold (exempt from immediate user erasure under UK/India financial record laws; retained 7 years)
- **Security Controls**: HMAC signature verification on webhooks, PCI-DSS tokenization, TLS 1.3
- **Linked DPIA Risk**: `RISK-10-RET`
- **Code Evidence**: `src/app/api/payment/*, src/lib/razorpay.ts, package.json:razorpay`

### ROPA-13-GUEST-DATA: Guest Panchang Exploration & Ephemeral Chart Calculation

- **Category**: Guest Mode Records
- **Data Subjects**: Unauthenticated Visitors
- **Data Fields**: Session Token, Guest Birth Coordinates, Guest Date/Time of Birth, Ephemeral Preferences
- **Special Category (Art. 9)**: No
- **Purpose**: Permitting first-time users to view current panchang and calculate sample astrological charts without requiring prior account creation.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(b) Contract / Art. 6(1)(f) Legitimate Interests`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Guest calculation form inputs
- **Mandatory / Optional**: Optional user feature
- **Processors & Vendors**: Supabase Inc. (Ephemeral DB rows if saved)
- **Storage Target**: `Client `localStorage` / `AsyncStorage`, temporary rows in `public.birth_profiles` with `session_token``
- **Deletion & Export Path**: Cleared on browser storage clear; server-side guest records subject to TTL cleanup job
- **Security Controls**: No linkage to identity, token expiration
- **Linked DPIA Risk**: `RISK-03-AGE`
- **Code Evidence**: `src/app/api/jyotish/chart/route.ts, src/lib/session.ts`

### ROPA-14-LOGS-ADMIN: System Audit Logs, Infrastructure Backups & Administrative Access

- **Category**: Logs & Infrastructure
- **Data Subjects**: All Users, System Administrators
- **Data Fields**: Admin User ID, Action Timestamp, API Endpoint, HTTP Status Code, Hashed IP Address, Cron Job Execution Status
- **Special Category (Art. 9)**: No
- **Purpose**: Ensuring server resilience, automated calendar precomputation, disaster recovery, unauthorized intrusion detection, and system maintenance.
- **Proposed Article 6 Lawful Basis**: `Art. 6(1)(f) Legitimate Interests (securing IT infrastructure) & Art. 6(1)(c) Legal Obligation`
- **Proposed Article 9 Condition**: `N/A`
- **Decision Status**: `PROPOSED_COUNSEL_REVIEW`
- **Source**: Serverless execution logs, PostgreSQL WAL logs, Cron job runners
- **Mandatory / Optional**: Mandatory for service
- **Processors & Vendors**: Vercel Inc. (Hosting & Edge Logs), Supabase Inc. (Database Logs & Backups), GitHub Inc. (CI/CD)
- **Storage Target**: `Vercel Log Streams, Supabase automated backup snapshots, GitHub repository`
- **Deletion & Export Path**: Automatic rolling expiration (7-30 days by provider plan)
- **Security Controls**: CRON_SECRET bearer authorization, MFA for administrative dashboards, immutable write-once audit logs
- **Linked DPIA Risk**: `RISK-11-VENDOR`
- **Code Evidence**: `src/app/api/admin/*, src/lib/admin.ts, scripts/shadow/*`
