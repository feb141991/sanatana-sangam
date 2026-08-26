# Third-Party Vendor & Subprocessor Register

**Version:** 2026-08-25.v1  
**Status:** `ENGINEERING_INVENTORY_PENDING_CONTRACT_REVIEW`  
Active integrations establish vendor usage only. Roles, regions, transfer
mechanisms, deletion capabilities and security attestations remain unverified
until the corresponding contract/TIA vault record exists.

## Vendor Inventory Summary

| Vendor ID | Legal Entity | Services | Proposed Role | Region To Verify | Contract Vault Status | Proposed Transfer Mechanism |
|---|---|---|---|---|---|---|
| `VEND-01-SUPABASE` | Supabase Inc. | Managed PostgreSQL Database, Supabase Auth | Processor | AWS EU (London | `VAULT-DPA-SUPABASE-001:` | Standard Contractual Clauses (SCCs) |
| `VEND-02-VERCEL` | Vercel Inc. | Web Application Hosting, Edge Serverless Functions | Processor | Global Edge Network | `VAULT-DPA-VERCEL-001:` | Standard Contractual Clauses (SCCs) |
| `VEND-03-EXPO` | 650 Industries Inc. (Expo) | EAS Mobile Application Builds, Expo Push Notification Service | Processor | United States | `VAULT-DPA-EXPO-001:` | Standard Contractual Clauses (SCCs) |
| `VEND-04-FIREBASE` | Google LLC (Firebase) | Firebase Cloud Messaging (FCM) for Android Push Delivery, Firebase Core App Registration | Processor | Global | `VAULT-DPA-FIREBASE-001:` | EU/UK Standard Contractual Clauses |
| `VEND-05-GOOGLE` | Google LLC | Google OAuth Authentication, Google Play Services | Independent | Global | `VAULT-DPA-GOOGLE-001:` | EU/UK Standard Contractual Clauses |
| `VEND-06-APPLE` | Apple Inc. | Apple Sign-In (OAuth), Apple Push Notification service (APNs) | Independent | United States | `VAULT-AGR-APPLE-001:` | Apple Global Privacy Policy |
| `VEND-07-RAZORPAY` | Razorpay Software Pvt. Ltd. | Payment Processing Gateway, Subscription Recurring Billing | Independent | India | `VAULT-AGR-RAZORPAY-001:` | Cross-Border Commercial Transfer Agreement (India) |
| `VEND-08-TWILIO` | Twilio Inc. | WhatsApp Business API for One-Time Password (OTP) Authentication | Processor | United States | `VAULT-DPA-TWILIO-001:` | Twilio Binding Corporate Rules (BCRs) |
| `VEND-09-SARVAM` | Sarvam AI | Indic Speech Synthesis (TTS), Indic Language Translation & Chat Completions | Processor | India | `VAULT-DPA-SARVAM-001:` | Standard Data Transfer Agreement (India-UK/EU) |
| `VEND-10-ONESIGNAL` | OneSignal Inc. | Legacy Web Push Notification Delivery | Processor | United States | `VAULT-DPA-ONESIGNAL-001:` | Standard Contractual Clauses |
| `VEND-11-OSM` | OpenStreetMap Foundation (Nominatim API) | Forward & Reverse Geocoding for City/Country search | Independent | United Kingdom | `N/A` | UK Adequacy |

## Detailed Vendor & Processor Records

### VEND-01-SUPABASE: Supabase Inc.

- **Services Provided**: Managed PostgreSQL Database, Supabase Auth, Supabase S3 Storage, pgvector
- **Data Categories Received**: Account identifiers, Hashed credentials, Profile & religious data, Birth details, Sadhana & Japa logs, Mandali UGC, Media uploads
- **GDPR Role**: Processor (Data Processor under UK GDPR)
- **Data Storage & Processing Region**: AWS EU (London / Frankfurt) or US East
- **Public DPA URL**: [https://supabase.com/legal/dpa](https://supabase.com/legal/dpa)
- **Privacy Policy**: [https://supabase.com/privacy](https://supabase.com/privacy)
- **Subprocessor List**: [https://supabase.com/docs/guides/platform/subprocessors](https://supabase.com/docs/guides/platform/subprocessors)
- **Executed Contract Vault ID**: `VAULT-DPA-SUPABASE-001: missing (Action required: execute online DPA)`
- **Cross-Border Transfer Mechanism**: Standard Contractual Clauses (SCCs) / UK IDTA Addendum
- **Data Deletion / Return Capability**: Direct SQL row deletion, automated cascade, bucket object purge API
- **Security Attestations & Standards**: SOC2 Type II, ISO 27001, HIPAA compliant architecture, AES-256 at rest
- **Review Cadence**: Annual
- **Code Evidence**: `package.json:@supabase/supabase-js, src/lib/supabase/*`

### VEND-02-VERCEL: Vercel Inc.

- **Services Provided**: Web Application Hosting, Edge Serverless Functions, Web Analytics, Speed Insights
- **Data Categories Received**: HTTP Request metadata, IP address (anonymized for telemetry), Diagnostic performance traces, Edge execution logs
- **GDPR Role**: Processor
- **Data Storage & Processing Region**: Global Edge Network / US East primary execution
- **Public DPA URL**: [https://vercel.com/legal/dpa](https://vercel.com/legal/dpa)
- **Privacy Policy**: [https://vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)
- **Subprocessor List**: [https://vercel.com/legal/subprocessors](https://vercel.com/legal/subprocessors)
- **Executed Contract Vault ID**: `VAULT-DPA-VERCEL-001: missing (Action required: execute online DPA)`
- **Cross-Border Transfer Mechanism**: Standard Contractual Clauses (SCCs) / US Data Privacy Framework (DPF)
- **Data Deletion / Return Capability**: Automatic log rotation (7-30 days retention based on plan tier)
- **Security Attestations & Standards**: SOC2 Type II, ISO 27001 certified edge infrastructure
- **Review Cadence**: Annual
- **Code Evidence**: `package.json:@vercel/analytics, package.json:@vercel/speed-insights, src/app/layout.tsx`

### VEND-03-EXPO: 650 Industries Inc. (Expo)

- **Services Provided**: EAS Mobile Application Builds, Expo Push Notification Service, Runtime Updates
- **Data Categories Received**: Expo Push Token, Device Model & OS version, App Build Artifacts
- **GDPR Role**: Processor
- **Data Storage & Processing Region**: United States
- **Public DPA URL**: [https://expo.dev/terms](https://expo.dev/terms)
- **Privacy Policy**: [https://expo.dev/privacy](https://expo.dev/privacy)
- **Subprocessor List**: [https://expo.dev/privacy](https://expo.dev/privacy)
- **Executed Contract Vault ID**: `VAULT-DPA-EXPO-001: missing`
- **Cross-Border Transfer Mechanism**: Standard Contractual Clauses (SCCs)
- **Data Deletion / Return Capability**: Automatic invalidation on `DeviceNotRegistered` push receipt; token purge API
- **Security Attestations & Standards**: Cloud infrastructure hosted on AWS US East
- **Review Cadence**: Annual
- **Code Evidence**: `shoonaya-mobile/package.json:expo-notifications, shoonaya-mobile/app.json`

### VEND-04-FIREBASE: Google LLC (Firebase)

- **Services Provided**: Firebase Cloud Messaging (FCM) for Android Push Delivery, Firebase Core App Registration
- **Data Categories Received**: FCM Push Device Registration Token, Android Notification Payloads
- **GDPR Role**: Processor
- **Data Storage & Processing Region**: Global / United States
- **Public DPA URL**: [https://firebase.google.com/terms/data-processing-terms](https://firebase.google.com/terms/data-processing-terms)
- **Privacy Policy**: [https://policies.google.com/privacy](https://policies.google.com/privacy)
- **Subprocessor List**: [https://firebase.google.com/terms/subprocessors](https://firebase.google.com/terms/subprocessors)
- **Executed Contract Vault ID**: `VAULT-DPA-FIREBASE-001: missing`
- **Cross-Border Transfer Mechanism**: EU/UK Standard Contractual Clauses / US Data Privacy Framework
- **Data Deletion / Return Capability**: Device unregister event removes FCM token
- **Security Attestations & Standards**: SOC1, SOC2, SOC3, ISO 27001
- **Review Cadence**: Annual
- **Code Evidence**: `shoonaya-mobile/package.json:@react-native-firebase/app, google-services.json`

### VEND-05-GOOGLE: Google LLC

- **Services Provided**: Google OAuth Authentication, Google Play Services, Google Analytics 4 (Web Consented), Google AdSense (Web Consented)
- **Data Categories Received**: OAuth Email/Profile Name, Web Analytics telemetry (consented), AdSense cookies (consented)
- **GDPR Role**: Independent Controller (OAuth / Ads) & Processor (GA4 under DPA)
- **Data Storage & Processing Region**: Global / United States
- **Public DPA URL**: [https://business.safety.google/adsprocessorterms/](https://business.safety.google/adsprocessorterms/)
- **Privacy Policy**: [https://policies.google.com/privacy](https://policies.google.com/privacy)
- **Subprocessor List**: [https://business.safety.google/adssubprocessors/](https://business.safety.google/adssubprocessors/)
- **Executed Contract Vault ID**: `VAULT-DPA-GOOGLE-001: missing`
- **Cross-Border Transfer Mechanism**: EU/UK Standard Contractual Clauses / US Data Privacy Framework
- **Data Deletion / Return Capability**: GA4 data deletion requests via API; Cookie clearing by user
- **Security Attestations & Standards**: SOC2, SOC3, ISO 27001
- **Review Cadence**: Annual
- **Code Evidence**: `src/components/privacy/WebConsentManager.tsx, package.json:google-auth-library`

### VEND-06-APPLE: Apple Inc.

- **Services Provided**: Apple Sign-In (OAuth), Apple Push Notification service (APNs), App Store Distribution
- **Data Categories Received**: Apple User Identifier / Relay Email, APNs Device Token, iOS Store Transaction Receipts
- **GDPR Role**: Independent Controller / Service Provider
- **Data Storage & Processing Region**: United States / Global
- **Public DPA URL**: [https://www.apple.com/legal/privacy/en-ww/](https://www.apple.com/legal/privacy/en-ww/)
- **Privacy Policy**: [https://www.apple.com/legal/privacy/](https://www.apple.com/legal/privacy/)
- **Subprocessor List**: [https://www.apple.com/legal/privacy/](https://www.apple.com/legal/privacy/)
- **Executed Contract Vault ID**: `VAULT-AGR-APPLE-001: missing (Standard Apple Developer Program License Agreement)`
- **Cross-Border Transfer Mechanism**: Apple Global Privacy Policy / Standard Contractual Clauses
- **Data Deletion / Return Capability**: User revocation via Apple ID settings
- **Security Attestations & Standards**: ISO 27001, ISO 27018
- **Review Cadence**: Annual
- **Code Evidence**: `shoonaya-mobile/package.json:expo-apple-authentication, ios/Shoonaya/PrivacyInfo.xcprivacy`

### VEND-07-RAZORPAY: Razorpay Software Pvt. Ltd.

- **Services Provided**: Payment Processing Gateway, Subscription Recurring Billing, Statutory Invoicing
- **Data Categories Received**: Payment Amount, Currency, Customer Name/Email/Phone, Payment Method Tokens (PCI-DSS)
- **GDPR Role**: Independent Controller / Regulated Payment Fiduciary under RBI guidelines
- **Data Storage & Processing Region**: India
- **Public DPA URL**: [https://razorpay.com/terms/](https://razorpay.com/terms/)
- **Privacy Policy**: [https://razorpay.com/privacy/](https://razorpay.com/privacy/)
- **Subprocessor List**: [https://razorpay.com/privacy/](https://razorpay.com/privacy/)
- **Executed Contract Vault ID**: `VAULT-AGR-RAZORPAY-001: missing (Merchant Service Agreement)`
- **Cross-Border Transfer Mechanism**: Cross-Border Commercial Transfer Agreement (India)
- **Data Deletion / Return Capability**: Statutory 7-year retention exception for financial transaction ledgers
- **Security Attestations & Standards**: PCI-DSS Level 1 Certified, ISO 27001
- **Review Cadence**: Annual
- **Code Evidence**: `package.json:razorpay, src/lib/razorpay.ts, src/app/api/payment/*`

### VEND-08-TWILIO: Twilio Inc.

- **Services Provided**: WhatsApp Business API for One-Time Password (OTP) Authentication
- **Data Categories Received**: Phone Number, Transactional OTP Code
- **GDPR Role**: Processor
- **Data Storage & Processing Region**: United States / Ireland
- **Public DPA URL**: [https://www.twilio.com/en-us/legal/data-protection-addendum](https://www.twilio.com/en-us/legal/data-protection-addendum)
- **Privacy Policy**: [https://www.twilio.com/en-us/legal/privacy](https://www.twilio.com/en-us/legal/privacy)
- **Subprocessor List**: [https://www.twilio.com/en-us/legal/sub-processors](https://www.twilio.com/en-us/legal/sub-processors)
- **Executed Contract Vault ID**: `VAULT-DPA-TWILIO-001: missing`
- **Cross-Border Transfer Mechanism**: Twilio Binding Corporate Rules (BCRs) / Standard Contractual Clauses
- **Data Deletion / Return Capability**: Transactional OTP logs deleted / anonymized within 30 days
- **Security Attestations & Standards**: SOC2 Type II, ISO 27001, BCR-approved
- **Review Cadence**: Annual
- **Code Evidence**: `package.json:twilio, src/app/api/auth/phone/send-otp/route.ts`

### VEND-09-SARVAM: Sarvam AI

- **Services Provided**: Indic Speech Synthesis (TTS), Indic Language Translation & Chat Completions
- **Data Categories Received**: Scripture snippet / text prompt for voice synthesis, Language parameters
- **GDPR Role**: Processor
- **Data Storage & Processing Region**: India
- **Public DPA URL**: [https://www.sarvam.ai/terms](https://www.sarvam.ai/terms)
- **Privacy Policy**: [https://www.sarvam.ai/privacy](https://www.sarvam.ai/privacy)
- **Subprocessor List**: [https://www.sarvam.ai/privacy](https://www.sarvam.ai/privacy)
- **Executed Contract Vault ID**: `VAULT-DPA-SARVAM-001: missing (Action required: confirm commercial enterprise terms)`
- **Cross-Border Transfer Mechanism**: Standard Data Transfer Agreement (India-UK/EU)
- **Data Deletion / Return Capability**: Ephemeral processing; zero retention of audio synthesis stream
- **Security Attestations & Standards**: Cloud infrastructure with encryption in transit (HTTPS/TLS 1.3)
- **Review Cadence**: Annual
- **Code Evidence**: `src/app/api/pramana/tts/route.ts, docs/pramana_sarvam_live_proof.md`

### VEND-10-ONESIGNAL: OneSignal Inc.

- **Services Provided**: Legacy Web Push Notification Delivery
- **Data Categories Received**: OneSignal Player ID, Web Push Subscription Endpoint, Notification Title/Body
- **GDPR Role**: Processor
- **Data Storage & Processing Region**: United States
- **Public DPA URL**: [https://onesignal.com/dpa](https://onesignal.com/dpa)
- **Privacy Policy**: [https://onesignal.com/privacy_policy](https://onesignal.com/privacy_policy)
- **Subprocessor List**: [https://onesignal.com/subprocessors](https://onesignal.com/subprocessors)
- **Executed Contract Vault ID**: `VAULT-DPA-ONESIGNAL-001: missing`
- **Cross-Border Transfer Mechanism**: Standard Contractual Clauses / US Data Privacy Framework
- **Data Deletion / Return Capability**: Player ID deletion via REST API
- **Security Attestations & Standards**: SOC2 Type II certified
- **Review Cadence**: Annual
- **Code Evidence**: `src/components/privacy/WebConsentManager.tsx, docs/PRIVACY_SECURITY_BASELINE.json:OneSignalSDK`

### VEND-11-OSM: OpenStreetMap Foundation (Nominatim API)

- **Services Provided**: Forward & Reverse Geocoding for City/Country search
- **Data Categories Received**: Search query text (City name or coarse Coordinates), HTTP User-Agent
- **GDPR Role**: Independent Service / Public Utility
- **Data Storage & Processing Region**: United Kingdom / Global
- **Public DPA URL**: [https://wiki.osmfoundation.org/wiki/Privacy_Policy](https://wiki.osmfoundation.org/wiki/Privacy_Policy)
- **Privacy Policy**: [https://wiki.osmfoundation.org/wiki/Privacy_Policy](https://wiki.osmfoundation.org/wiki/Privacy_Policy)
- **Subprocessor List**: [N/A](N/A)
- **Executed Contract Vault ID**: `N/A (Public API fair-use policy)`
- **Cross-Border Transfer Mechanism**: UK Adequacy
- **Data Deletion / Return Capability**: Ephemeral query (no user account associated)
- **Security Attestations & Standards**: HTTPS / Open Source community infrastructure
- **Review Cadence**: Annual
- **Code Evidence**: `src/app/api/geocode/route.ts, src/lib/geo.ts`
