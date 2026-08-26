# Data Retention & Disposal Schedule

**Version:** 2026-08-26.v2
**Status:** `PERIODS_APPROVED_AUTOMATION_PENDING` — Founder approved 13 of 14
categories 2026-08-26 (`APPR-20260826-01`). `RET-12-PAY` is deliberately
deferred, not approved: no premium/payment gate is live yet.
**Safety Invariant:** `destructiveJobsEnabled: false` — approving a retention
period is a policy decision, not the same as building and enabling an
automated destructive job for it. No category-aware destructive cron exists
today beyond the already-live 30-day account-deletion cool-off purge
(`src/lib/account-deletion.ts`), which is unaffected by this flag.

---

## 1. Founder & Counsel Decision Table

| Category ID | Data Category | Active Retention | Proposed Post-Account Period | Statutory Exception | Status |
|---|---|---|---|---|---|
| `RET-01-AUTH` | Account & Auth Records | Active Account | 30 Days (Cancellation Window) | None | `APPROVED` |
| `RET-02-REL` | Religious / Spiritual Profile | Active Consent | Immediate on clear; 30d on delete | None | `APPROVED` |
| `RET-03-BIRTH` | Astrological Kundali Data | User-managed | Immediate on clear; 30d on delete | None | `APPROVED` |
| `RET-04-LOC` | Location Data | User-managed | Immediate on clear; 30d on delete | None | `APPROVED` |
| `RET-05-MOOD` | Mood, Reflections, Sankalpa | User-managed | Immediate on clear; 30d on delete | None | `APPROVED` |
| `RET-06-PRAC` | Sadhana & Progress History | Active Account | 30 Days (Account delete cascade) | None | `APPROVED` |
| `RET-07-UGC` | Mandali Posts & Comments | Active Post | Content: immediate; Reports: 2 years | Trust & Safety Audit | `APPROVED` |
| `RET-08-AI` | Ask Pramana Queries & TTS | 0 Days | 0 Days (In-flight memory only) | None | `APPROVED` |
| `RET-09-NOTIF` | Push Tokens & Delivery Logs | Active Token | Stale tokens: 0 days; Logs: 30 days | None | `APPROVED` |
| `RET-10-ANALYTICS` | Cookies & Web Telemetry | Consented (12mo) | Cookie: 12 months; GA4: 14 months | None | `APPROVED` |
| `RET-11-MEDIA` | Uploaded Avatars (`avatars` bucket) | Active Image | Replaced: immediate; Delete: 30d | None | `APPROVED` |
| `RET-12-PAY` | Subscription/entitlement fields on `profiles` | 7 Years (proposed) | 7 Years from transaction date | HMRC / Income Tax Act | `DEFERRED` — no live payment gate; revisit before shipping one |
| `RET-13-GUEST` | Ephemeral Guest Charts | 30 Days | 30 Days automated TTL | None | `APPROVED` |
| `RET-14-LOGS` | System Logs & Backups | Rolling 30 Days | Overwrite on 30-day rotation | Disaster Recovery | `APPROVED` |

---

## 2. Retention Governance Rules

1. **Account Deletion Protocol**: When a user triggers `DELETE /api/user/delete`
   (or the canonical `POST /api/user/delete/request`), their profile is marked
   `is_deleting: true` with `deletion_requested_at` set — there is no separate
   `deleted_accounts` table in the live schema; the flag lives directly on
   `profiles`. After the 30-day cancellation window, `purgeDueDeletedAccounts()`
   deletes the user's `avatars` Storage objects, then hard-deletes `auth.users`
   and the `profiles` row.
2. **Financial/Statutory Records — open finding, not yet resolved**: `RET-12-PAY`
   assumed dedicated `public.payment_orders`/`public.transactions` tables that
   do not exist in the live schema. The real subscription/entitlement data is
   a handful of columns directly on `profiles`
   (`subscription_status`, `subscription_id`, `entitlement_source`, etc.),
   which today is deleted immediately along with the rest of the profile —
   the opposite of a 7-year hold. This is deliberately left unresolved because
   there is no active payment/premium gate yet; it must be resolved (snapshot
   before delete, or confirm the payment processor's own records satisfy the
   hold) before any payment feature ships.
3. **Backup Overwrite**: Backup snapshots hosted by cloud providers (Supabase
   managed Postgres backups) expire and overwrite automatically on a rolling
   30-day schedule.
