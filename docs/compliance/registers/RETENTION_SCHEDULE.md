# Data Retention & Disposal Schedule

**Version:** 2026-08-25.v1  
**Status:** `DECISION_REQUIRED` (Proposed by Engineering; Pending Formal Founder/Counsel Approval)  
**Safety Invariant:** `destructiveJobsEnabled: false` — No automated destructive deletion cron is enabled in production until explicit sign-off.

---

## 1. Founder & Counsel Decision Table

The following table summarizes the proposed retention periods and decision options for leadership review:

| Category ID | Data Category | Active Retention | Proposed Post-Account Period | Statutory Exception | Recommended Decision | Status |
|---|---|---|---|---|---|---|
| `RET-01-AUTH` | Account & Auth Records | Active Account | 30 Days (Cancellation Window) | None | Approve 30-day grace before hard purge | `PENDING_DECISION` |
| `RET-02-REL` | Religious / Spiritual Profile | Active Consent | Immediate on clear; 30d on delete | None | Approve user-directed clearing | `PENDING_DECISION` |
| `RET-03-BIRTH` | Astrological Kundali Data | User-managed | Immediate on clear; 30d on delete | None | Approve user-directed deletion | `PENDING_DECISION` |
| `RET-04-LOC` | Location Data | User-managed | Immediate on clear; 30d on delete | None | Approve foreground-only retention | `PENDING_DECISION` |
| `RET-05-MOOD` | Mood, Reflections, Sankalpa | User-managed | Immediate on clear; 30d on delete | None | Approve user-directed deletion | `PENDING_DECISION` |
| `RET-06-PRAC` | Sadhana & Progress History | Active Account | 30 Days (Account delete cascade) | None | Approve active-account duration | `PENDING_DECISION` |
| `RET-07-UGC` | Mandali Posts & Comments | Active Post | Content: immediate; Reports: 2 years | Trust & Safety Audit | Retain safety reports 2 years | `PENDING_DECISION` |
| `RET-08-AI` | Ask Pramana Queries & TTS | 0 Days | 0 Days (In-flight memory only) | None | Approve zero-logging policy | `PENDING_DECISION` |
| `RET-09-NOTIF` | Push Tokens & Delivery Logs | Active Token | Stale tokens: 0 days; Logs: 30 days | None | Approve 30-day delivery log TTL | `PENDING_DECISION` |
| `RET-10-ANALYTICS` | Cookies & Web Telemetry | Consented (12mo) | Cookie: 12 months; GA4: 14 months | None | Approve 12mo cookie expiration | `PENDING_DECISION` |
| `RET-11-MEDIA` | Uploaded Images & Avatars | Active Image | Replaced: immediate; Delete: 30d | None | Approve S3 bucket object purge | `PENDING_DECISION` |
| `RET-12-PAY` | Financial Invoices & Seva | 7 Years | 7 Years from transaction date | HMRC / Income Tax Act | Approve statutory 7-year hold | `PENDING_DECISION` |
| `RET-13-GUEST` | Ephemeral Guest Charts | 30 Days | 30 Days automated TTL | None | Approve 30-day guest cleanup | `PENDING_DECISION` |
| `RET-14-LOGS` | System Logs & Backups | Rolling 30 Days | Overwrite on 30-day rotation | Disaster Recovery | Approve provider rolling schedule | `PENDING_DECISION` |

---

## 2. Retention Governance Rules

1. **Account Deletion Protocol**: When a user triggers `DELETE /api/user/delete`, their account is marked `is_deleting: true` and placed in `public.deleted_accounts` with a 30-day cancellation cooling-off window. If not cancelled within 30 days, `purgeDueDeletedAccounts()` executes a hard database cascade and purges owned storage bucket assets.
2. **Statutory Legal Holds**: Financial and tax records (`public.payment_orders`, `public.transactions`) are exempt from immediate erasure and are retained for 7 years under statutory tax compliance obligations.
3. **Backup Overwrite**: Backup snapshots hosted by cloud providers (Supabase managed Postgres backups) expire and overwrite automatically on a rolling 30-day schedule.
