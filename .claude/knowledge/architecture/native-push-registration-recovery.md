# Native Push Registration Recovery — Local Implementation

**Date:** 2026-09-30
**Session context:** Missing-binding audit followed by local Native and shared-backend recovery changes
**Category:** architecture
**Status:** LOCAL IMPLEMENTATION — uncommitted; migration not applied or shadow-checked; not deployed.
**Source:** [Recovery plan and audit evidence](../../../docs/notifications/PUSH_TOKEN_RECOVERY_PLAN_2026_09_30.md)

## What we decided

Reconcile each installation's push binding using owner/project/token identity and bounded acknowledgement freshness. Native owns cold-start, foreground, Settings, permission-change, and token-rotation recovery; the backend owns the canonical `POST/DELETE /api/notifications/register-token` contract and existing registry.

Use process-local acknowledgement and unconditional authenticated cold-start reconciliation. An encrypted cleanup record supports logout across process restarts; it cannot bypass reconciliation. Reuse the existing notification pipeline for invalidation, diagnostics, and delivery evidence.

## Why

The audit found a pruned binding remained absent despite later app activity. Baseline Native source suppressed unchanged-token registration indefinitely and lacked foreground recovery. This supports a lifecycle gap without proving process lifetime, permissions, installed artifact, or the original invalidation cause.

A successful registration acknowledgement can drift from backend truth. RAM versus disk alone does not establish correctness: persisting equality-only suppression preserves the deadlock across restarts. Freshness, identity isolation, and reconciliation govern correctness.

Delayed provider errors can follow re-registration or reassignment, so pruning needs the exact binding version captured before sending. A user-level `hasPushToken` can hide a broken installation behind another healthy device. Inbox creation, tickets, and receipts describe separate stages; none proves physical display.

## Constraints this creates

- Only successful acknowledgement advances freshness. Guard identity generations, coalesce registration, and bound foreground retries. The 24-hour lease is an adjustable recovery budget; cold start and explicit Settings checks bypass it without automatically prompting or changing preferences.
- Immediate and delayed invalidation must atomically match token, owner, and captured binding version. Legacy receipts without a version cannot delete unconditionally; audit actual deletions and retain retryable failures.
- Return the binding version additively in registration acknowledgements and use it with current credentials for logout cleanup. Delayed A-to-B-to-A cleanup must preserve the new binding; older clients omitting the version are not proven race-safe. Offline logout cannot guarantee immediate removal.
- Any future passive health must identify the current installation/binding and protect tokens. A per-user boolean remains insufficient.
- Keep registration, inbox, ticket, receipt, physical presentation, and interaction evidence distinct. Release confidence requires exact installed-artifact and opted-in physical-device evidence.

## Local implementation checkpoint (2026-09-30)

Local Native code adds the shared recovery coordinator, lifecycle/Settings/rotation wiring, encrypted cleanup, and account-scoped sanitized offline diagnostics (ten entries, 30 days, batched upload). Local backend source and the unapplied additive migration define binding generations, guarded logout/pruning, 30-day terminal receipt evidence, and window-scoped admin counts with no-attempts handling. These are local changes, not live behavior.

Final Native/backend typechecks and targeted backend lint are clean. Earlier targeted Native scenarios passed (16 passed, zero failed), before the final 24-hour cadence and diagnostics batching refinements; those results do not validate final source. Migration shadow validation/application, post-refinement behavioral checks, deployment, and opted-in physical-device delivery evidence remain outstanding. No production data changes or notification sends occurred.

## What we explicitly rejected

- Treating disk acknowledgement or per-user token presence as current-device health.
- Restoring invalidated tokens from audit history, pruning by token alone, or adding a parallel registry/queue.
- Claiming physical delivery from registration, ticket acceptance, or receipt success, or an unsupported incident cause.

---
