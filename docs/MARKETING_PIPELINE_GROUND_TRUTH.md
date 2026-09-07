# Marketing Pipeline Ground Truth Audit

**Audit Date:** 2026-09-07  
**Auditor:** Principal Backend, Product-Safety, Privacy, and Communications-Platform Engineer  
**Repositories:**
- Primary Backend/PWA: `Sanatan Sangam/Shoonaya` (`/Users/Business(C)/Sanatan Sangam/Shoonaya`)
- Native Mobile Companion: `shoonaya-mobile` (`/Users/Business(C)/shoonaya-mobile`)

---

## 1. Executive Summary & Objective

This document establishes the verified baseline, security/privacy boundaries, and architectural contracts for building a lean, human-approved, consent-aware marketing campaign pipeline for Shoonaya.

The marketing pipeline is an **irreversible communications system**:
* A duplicate email, unapproved festival date, fabricated scripture quotation, or consent violation constitutes an immediate production incident.
* System policy: **Default to dry-run and fail closed.**

---

## 2. Verified Infrastructure & Reusability Matrix

| Subsystem | Existing Path | Verified Behavior | Reuse Strategy |
| :--- | :--- | :--- | :--- |
| **Email Delivery** | `src/lib/email.ts` | Resend API wrapper with `buildPremiumHtml`. Returns `{ success: boolean, error?: unknown }`. | Reused directly. **Critical Fix Identified:** Callers must explicitly check `result.success !== true` rather than assuming a resolved Promise implies successful delivery. |
| **WhatsApp Delivery** | `src/lib/whatsapp/provider.ts` | Meta WhatsApp Cloud API / Twilio / mock provider abstraction via `createWhatsAppProvider()`. | Reused directly. In production, mock provider fails closed and throws rather than reporting fake success. |
| **Festival Reminders** | `src/app/api/cron/festival-email/route.ts` | Gated by `publication_status = "published"`, `filterWithheldJoinedRows()`, and `RULED_SLUGS`. | Shared eligibility extracted into `src/lib/marketing/sources/published-observance.ts`. No direct Panchang date computation by AI. |
| **Central Notification Dispatcher** | `src/app/api/cron/notification-dispatch/route.ts` | Atomic lease claiming via `claim_due_scheduled_notifications` / PostgreSQL RPC, quiet hours checking, Expo push delivery. | Preserved as operational dispatcher. Marketing push is explicitly deferred. |
| **Admin Broadcast Route** | `src/app/api/admin/broadcast/route.ts` | Operational in-app + push broadcast to users. | Isolated as an operational tool. Removed fake `setTimeout` simulation in `src/app/admin/broadcast/page.tsx`. |

---

## 3. Communication Classification: Operational vs. Marketing

| Category | Examples | Consent & Delivery Contract | Storage & Dispatch Mechanism |
| :--- | :--- | :--- | :--- |
| **Operational** | Auth verification, password reset, account deletion receipts, daily sadhana / Brahma Muhurta alarms, Sanskar milestones, critical system alerts. | Exempt from marketing consent. Governed by account status and feature-specific settings (e.g. `wants_family_notifications`). | `notifications`, `notification_schedule`, transactional email. |
| **Marketing** | Weekly newsletter digests, festival reminders, promotional community announcements, WhatsApp broadcasts. | **Strictly opt-in.** Requires active `marketing_consent = true` and channel-specific opt-ins (`email_newsletter = true` / `email_festivals = true` / `whatsapp_opt_in = true`). | `marketing_campaigns`, `marketing_campaign_variants`, `marketing_dispatches`. |

---

## 4. Consent & Audience Eligibility Policy

All marketing deliveries must evaluate live consent at the exact instant of dispatch:

1. **Newsletter Email**:
   * `profiles.marketing_consent = true`
   * `profiles.email_newsletter = true`
   * `profiles.email` is NOT null and NOT matching `@whatsapp.shoonaya.app` placeholder.
   * User is NOT banned (`is_banned = false`).

2. **Festival Reminder Email**:
   * `profiles.email_festivals = true`
   * `profiles.email` is NOT null and NOT placeholder.
   * User is NOT banned (`is_banned = false`).

3. **WhatsApp Community Broadcast**:
   * `profiles.marketing_consent = true`
   * `profiles.whatsapp_opt_in = true`
   * `profiles.whatsapp_number` is present and valid E.164 syntax (e.g. `+1...`, `+91...`).
   * User is NOT banned.

4. **Suppression Rules (Fail Closed)**:
   * Any missing profile, deleted account, banned account, or uncertain consent state evaluates to `{ eligible: false, reasonCode: "..." }`.

---

## 5. Spiritual & Astronomical Content Integrity

* **Pramana Rule**: Festival content must originate strictly from `observance_occurrences` where `publication_status = "published"` and the associated slug exists in `CANONICAL_RULES` (`RULED_SLUGS`).
* **Withheld Gate**: `filterWithheldJoinedRows()` must be applied. Disputed, deferred, fallback, or unverified occurrences are strictly blocked from marketing ingestion.
* **AI Boundaries**: AI may format surrounding prose, headings, and subject lines, but must **never** generate or modify scripture text, mantra syllables, ritual injunctions, or festival calendar dates.

---

## 6. Campaign State Machine & Idempotency

* **Idempotency Key**: Unique constraint on `(campaign_id, variant_id, recipient_user_id, channel)`.
* **Atomic Claiming**: Rows are claimed using status `claimed` with worker lease timestamps, preventing concurrent double-send.
* **Re-dispatch Safe**: Retrying an already-sent dispatch returns the stored success response with zero provider calls.
