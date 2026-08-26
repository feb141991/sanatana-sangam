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
   `purgeDueDeletedAccounts()` calls `auth.admin.deleteUser(userId)` and then
   explicitly deletes the matching `profiles` row.
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

The current account-deletion helper does **not** itself prove or perform:

- deletion of user-owned Supabase Storage objects;
- GA4 User Deletion API calls;
- CDN or S3 cache invalidation;
- anonymisation or statutory retention of payment records;
- processor-specific deletion notices;
- a durable completion receipt independent of platform logs; or
- complete cascade coverage for every user-owned table.

These items remain implementation and policy work. Before this SOP can be
approved, engineering must produce a machine-generated ownership/cascade
inventory, verify storage ownership conventions, and reconcile financial and
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
