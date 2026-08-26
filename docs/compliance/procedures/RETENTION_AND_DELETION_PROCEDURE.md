# Data Retention and Deletion Standard Operating Procedure

**SOP Reference:** `REC-PROC-RET`  
**Owner:** Engineering Lead / Infrastructure Lead  
**Intended Approver:** Founder; outside privacy counsel where required  
**Status:** `FOUNDER_APPROVED` (2026-08-25, see `APPR-20260825-01`) — approval covers the
procedure as documented, including the §3 gaps accepted as known/open; it does
not approve retention periods (`RETENTION_SCHEDULE.json`, separately
`DECISION_REQUIRED`) or close the §3 implementation gaps.  
**Implementation evidence:** `src/app/api/user/delete/request/route.ts`, `src/app/api/user/delete/cancel/route.ts`, `src/lib/account-deletion.ts`, `src/app/api/cron/purge-deleted-accounts/route.ts`

## 1. Current Implemented Account-Deletion Workflow

1. `POST /api/user/delete/request` authenticates the caller with `getApiUser()`.
2. The route sets `profiles.is_deleting = true` and records
   `profiles.deletion_requested_at`. There is no `deleted_accounts` table in
   the currently applied schema.
3. When the Vercel Workflow runtime is available, the route starts the
   account-deletion cool-off workflow. The daily
   `/api/cron/purge-deleted-accounts` route remains a safety net.
4. `POST /api/user/delete/cancel` clears both profile fields during the
   30-day cool-off period.
5. Once the cool-off expires, `purgeDeletedAccountById()` or
   `purgeDueDeletedAccounts()` first deletes the user's own files from the
   `avatars` Storage bucket (both the `{userId}/` and `profiles/{userId}/`
   prefixes -- the only two path conventions confirmed live for user-owned
   content; `kuls/{kulId}/...` is shared family content and is deliberately
   left untouched), then calls `auth.admin.deleteUser(userId)` and explicitly
   deletes the matching `profiles` row. Storage cleanup is best-effort: a
   failure there is logged but never blocks the account deletion itself.
6. Related database rows are deleted only where the live foreign-key contract
   supplies the applicable cascade. This procedure does not assume universal
   cascade coverage without a separate schema verification.

`POST /api/user/delete` is retained for internal/admin testing and immediate
test-account cleanup. It is not the canonical user-facing deletion flow.

## 2. Current Safety Controls

- User identity is derived server-side; no request-body user ID controls the
  deletion target.
- The cool-off duration is centralized in
  `ACCOUNT_DELETION_COOL_OFF_DAYS`.
- The purge cron requires `Authorization: Bearer <CRON_SECRET>`, including for
  dry runs.
- A failed Workflow start does not discard the deletion request because the
  cron remains available as a fallback.
- Account deletion is separate from the unapproved category-wide retention
  schedule. `destructiveJobsEnabled` remains `false` for those proposed jobs.

## 3. Gaps That Must Not Be Represented As Implemented

**Closed 2026-08-26:** deletion of user-owned Supabase Storage objects.
`deleteUserStorageObjects()` in `src/lib/account-deletion.ts` now removes the
`avatars` bucket's `{userId}/` and `profiles/{userId}/` paths on account
purge. Verified live: uploaded test files to both prefixes against
production Storage, ran the same list-then-remove sequence the function
uses, confirmed zero files remained after. `kuls/{kulId}/...` (shared family
content) is explicitly out of scope -- one member's deletion must not touch
Kul-owned assets.

**New finding, not yet closed:** `RETENTION_SCHEDULE.json`'s `RET-12-PAY`
entry names `public.subscriptions`, `public.payment_orders`, and
`public.transactions` as the stores holding payment data under a 7-year
statutory hold. None of these tables exist in the live schema (confirmed via
`information_schema.tables`). The actual subscription/entitlement data lives
as columns directly on `profiles`
(`subscription_status`, `subscription_id`, `entitlement_source`, etc.), which
means **today, account deletion erases this data immediately** -- the
opposite of the stated 7-year hold. Resolving this needs a decision, not
just code: either snapshot subscription/entitlement fields to a retained
record before the profile row is purged, or confirm the payment processor's
own records satisfy the statutory hold and Shoonaya never needed a local
copy. Do not represent RET-12-PAY as enforced until one of those is chosen
and implemented.

The current account-deletion helper still does **not** itself prove or
perform:

- GA4 User Deletion API calls;
- CDN cache invalidation;
- anonymisation or statutory retention of payment records (see finding above);
- processor-specific deletion notices;
- a durable completion receipt independent of platform logs; or
- complete cascade coverage for every user-owned table.

These items remain implementation and policy work. Before this SOP can be
fully closed, engineering must produce a machine-generated ownership/cascade
inventory, resolve the payment-retention finding above, and reconcile
provider deletion obligations with the approved retention schedule.

## 4. Approval Gate

This document may move to `FOUNDER_APPROVED` only after the Founder reviews the
current behavior and accepted gaps. It may reference counsel approval only
after a completed approval record is stored in the restricted legal vault and
its vault ID is recorded in `COMPLIANCE_RECORDS_INDEX.md`.

**Gate satisfied 2026-08-25** — see `APPR-20260825-01`
(`docs/compliance/procedures/APPROVAL_RECORD_20260825_FOUNDER_SOPS.md`),
vault reference `VAULT-APPR-FOUNDER-SOPS-2026-08-25`. Founder-only approval;
no counsel review claimed. §3 gaps remain open and unimplemented.
