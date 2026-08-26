# App Store & Google Play Store Declaration Matrix

**Version:** 2026-08-25.v1  
**Status:** `SUBMITTED` — Play Console Data Safety and App Store Connect App Privacy both
filed per founder confirmation `APPR-20260825-03` (2026-08-25). This matrix
was the drafted answer key prior to submission; engineering has not
independently confirmed the live console forms match every row below
character-for-character — treat this file as the intended declaration, and
the actual console state as authoritative if the two ever diverge.  
**Binary Reference:** Native iOS / Android Expo SDK 56 (`shoonaya-mobile`)  
**Linked Manifests:** `ios/Shoonaya/PrivacyInfo.xcprivacy`, `app.json`

---

## 1. Apple App Store Privacy Nutrition Labels

| Data Type Category | Collected? | Linked to User Identity? | Used for Tracking (ATT)? | Declared Purpose in Codebase | Privacy Manifest Key (`NSPrivacyCollectedDataType`) | Public Policy Paragraph |
|---|---|---|---|---|---|---|
| **Name** | YES | YES | NO | App Functionality (Account Profile) | `NSPrivacyCollectedDataTypeName` | Privacy Policy §2.1 |
| **Email Address** | YES | YES | NO | App Functionality (Account Auth) | `NSPrivacyCollectedDataTypeEmailAddress` | Privacy Policy §2.1 |
| **Phone Number** | YES (Web/Optional) | YES | NO | Optional WhatsApp OTP login | Not collected directly by native SDK; handled via API | Privacy Policy §2.1 |
| **Precise Location** | YES (Foreground) | YES | NO | App Functionality (Local Sunrise/Panchang & Nearby Seekers) | `NSPrivacyCollectedDataTypePreciseLocation` | Privacy Policy §2.3 |
| **Sensitive Info (Religious Beliefs)**| YES | YES | NO | App Functionality (Personalized Sadhana & Panchang) | `NSPrivacyCollectedDataTypeSensitiveInfo` | Privacy Policy §2.2 |
| **Photos or Videos** | YES (Optional) | YES | NO | App Functionality (Profile Avatar & Mandali Post Attachments) | `NSPrivacyCollectedDataTypePhotosorVideos` | Privacy Policy §2.5 |
| **Other User Content** | YES | YES | NO | App Functionality (Mandali Posts, Comments, Reflections) | `NSPrivacyCollectedDataTypeOtherUserContent` | Privacy Policy §2.5 |
| **User ID** | YES | YES | NO | App Functionality (Authentication & Authorization) | `NSPrivacyCollectedDataTypeUserID` | Privacy Policy §2.1 |
| **Device ID / Push Token** | YES | YES | NO | App Functionality (Push Notification Reminders) | `NSPrivacyCollectedDataTypeDeviceID` | Privacy Policy §2.4 |
| **Product Interaction** | YES | YES | NO | App Functionality (Japa Counters, Quiz Scores, Saved Vrats) | `NSPrivacyCollectedDataTypeProductInteraction` | Privacy Policy §2.4 |

> **Apple ATT (App Tracking Transparency)**: `NSPrivacyTracking: false`. Native mobile code contains **zero advertising or cross-app tracking SDKs**. Firebase Analytics is absent; Firebase Core remains solely for push notification routing.

---

## 2. Google Play Store Data Safety Declaration

| Data Category | Data Subtype | Collected? | Shared? | Processed Ephemerally? | Required or Optional? | Purposes |
|---|---|---|---|---|---|---|
| **Personal Info** | Name | YES | NO | NO | Required for Account | App Functionality, Account Management |
| **Personal Info** | Email Address | YES | NO | NO | Required for Account | App Functionality, Account Management |
| **Personal Info** | Religious Beliefs | YES | NO | NO | Optional (Personalization) | App Functionality, Personalization |
| **Location** | Precise Location | YES | NO | NO | Optional (Panchang / Temples) | App Functionality, Personalization |
| **Photos & Videos** | Photos | YES | NO | NO | Optional (Uploads) | App Functionality, User Content |
| **Messages & Content** | User Posts & Comments | YES | NO | NO | Optional (Mandali) | App Functionality, Community |
| **App Activity** | In-app Interactions | YES | NO | NO | Required for Features | App Functionality, Progress Tracking |
| **App Info & Perf** | Diagnostics / Crash Data | YES | NO | NO | Required for Stability | Analytics, App Performance |
| **Device or other IDs** | Device / Push Identifiers| YES | YES (Expo/FCM) | NO | Required for Notifications| App Functionality, Push Delivery |

### Google Play Security Practices Declarations
1. **Data Encrypted in Transit**: YES (All API routes and storage buckets enforce HTTPS / TLS 1.3).
2. **Data Deletion Mechanism Provided**: YES (Direct in-app account deletion under Settings and dedicated web URL `/api/user/delete`).
