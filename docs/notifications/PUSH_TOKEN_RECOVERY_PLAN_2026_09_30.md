# Native push registration recovery and delivery evidence

Status: implementation is in the local worktrees. It has not been committed, migrated in
production, pushed, or deployed. No production data was changed and no notification was
sent. Scope is Native plus its shared backend; no PWA product features are in scope.

## Implementation checkpoint — 2026-09-30

The local Native client now reconciles on authenticated cold start, stale foreground
return, explicit Notification Settings checks, permission changes, and actual token
rotation. One shared coordinator serializes requests and identity changes; only successful
server acknowledgement advances a 24-hour lease. Retries are bounded and foreground
only. Permission is never prompted by recovery. An encrypted cleanup record supports
logout across process restarts but is never used to skip cold-start reconciliation.
Sanitized offline diagnostics are queued with a ten-entry/30-day bound, uploaded in one
batched request, and scoped to the account that produced them. Notification Settings show
device registration and permission state in English, Hindi, and Punjabi.

The backend changes are present locally: registration returns a binding generation;
logout and provider-error pruning compare owner/token/generation atomically; receipt
outcomes are retained for 30 days after checking and raw token values are erased at
completion. Expo receipt lookup failures remain pending for retry. Admin totals use
window-scoped database counts, empty windows show no attempts, and ticket acceptance,
receipt status, tracking gaps, and physical display are labelled separately. A registration
POST acknowledgement is not proof a provider displayed a notification.

The actual Native registration module was exercised in a local VM harness earlier in this
turn (16 targeted scenarios passed), before the final 24-hour cadence and batched diagnostic
refinements. Final Native and backend TypeScript checks are clean; targeted backend ESLint
and both repositories' diff checks are clean. The earlier test result does not validate
those last edits, and no post-refinement test result is claimed. A disposable-database
migration check, production migration, backend push, app OTA/build, provider send, and
opted-in physical Android/iOS proof remain outstanding. The local SQL migration has not
been applied.

## Verified baseline

Audit captured on 2026-09-30, approximately 09:50 UTC. Source baselines:

- Backend: `6b4139f53a2a9da8ed9dbcd26f477057ebb14c04`.
- Native: `4d34eee4bed5678093606c81e4164c26f283c04a`.
- Linked Supabase project: `mnbwodcswxoojndytngu`.

Read-only findings for the reported Android user, Abhijeet:

| Observation | Verified evidence | Limit |
| --- | --- | --- |
| No registered token now | `push_tokens`: zero rows for this user | Does not identify the original device-side invalidation cause |
| Last registration | 2026-09-23 11:31:11 UTC | Registration is not delivery proof |
| Provider invalidation/prune audit | Two events at 2026-09-26 10:20:47 UTC, both for one token hash | Two audit rows do not mean two devices or two successful deletes |
| Subsequent push attempts | Nine `notification_deliveries` rows: `skipped`, `metadata.reason = no_push_token`; through 2026-09-30 03:00 UTC | These pushes were not submitted to Expo |
| Subsequent app activity | Android telemetry received 2026-09-27 17:35 UTC and 2026-09-30 08:40 UTC | Does not prove process lifetime, current OS permission, installed build, or installed OTA |
| Inbox activity | 21 inbox records since pruning | Inbox creation and remote push transport are different stages |

Fleet snapshot: 17 profiles, six users with tokens, eight token rows, one previously
pruned user still missing a token. The other users without tokens are not automatically
broken: permission, opt-in, installation, and activity evidence must be checked first.

Existing registration RPCs are service-role-only in production. `upsert_push_token`
updates `updated_at` and `last_seen_at` even when the same token is registered again.
Reuse that endpoint and identity model rather than introducing a new registry.

## Confirmed source gaps

1. Native `lib/notifications.ts` compares only token equality and suppresses subsequent
   registration indefinitely. No acknowledgement expiry or owner is included.
2. Root has foreground handling for auth refresh and telemetry, but no push-registration
   recovery on return. Both auth routing implementations return early for the same user,
   so their comments about registering on every auth-state event overstate actual behavior.
3. Notification Settings calls registration when enabling a reminder, but does not force
   it; it encounters the same token-equality short circuit. Opening Settings is not a
   registration check today.
4. No Native push-token rotation listener is wired. The Expo SDK provides one.
5. Registration POST and failure diagnostics do not bind `expectedUserId`. There is no
   registration single-flight or identity-generation guard around its acknowledgement.
   A direct A-to-B transition can skip rebinding an unchanged device token.
6. Immediate send errors and delayed receipt errors both delete by token alone. Neither
   checks whether that binding was refreshed/reassigned after the failed send began.
   Prune audit rows are recorded even when the delete failed or deleted nothing.
7. Sign-out relies on an access token cached at the last push registration, potentially
   hours/days earlier. It clears local state before a best-effort DELETE; an expired JWT
   can leave the server binding behind. Offline sign-out needs an explicit limitation.
8. Successful receipts are consumed and deleted without a durable receipt outcome. The
   admin monitoring endpoint derives recent counts from capped queries, labels ticket
   acceptance as sent, and reports 100% success when there were no attempts.

The current `lib/notifications.ts` was also executed in a Node VM after TypeScript
transpilation, with simulated Expo, session and API dependencies. Initial registration
made one POST and created a binding. Removing that simulated server binding and calling
registration again made no further POST; changing the signed-in test owner likewise
made no further POST. Both recovery/rebinding assertions failed against the current
implementation. No real device, provider request or production write was involved.

This makes the client lifecycle gap reproducible, not merely inferred from comments.
It is a strong explanation for the reported incident, but we have not captured the
affected phone's permission state or proved its JS process remained alive since
September 23.

## What to borrow from the proposed review

Adopt bounded acknowledgement freshness, owner-scoped state, token-change handling,
explicit Settings recovery, and server evidence. Do not treat local persistence as
server truth. Moving `cachedToken` from RAM to AsyncStorage without invalidation would
persist the same bug through cold starts.

No primary evidence establishes that Instagram, Slack, or WhatsApp use the stated
24-hour policy. Firebase's published token-refresh guidance discusses weekly/monthly
provider-token freshness; this incident concerns synchronizing our own database binding.
Do not describe a Shoonaya recovery interval as a universal industry requirement.

A simple user-level `hasPushToken` boolean is insufficient for multiple devices. One
healthy phone can mask a broken second phone. Device-specific health, if added, must
identify the current installation/binding without exposing raw tokens in URLs or logs.

## Stage 1 — Fix the client deadlock independently

Owners: Native `lib/notifications.ts`, a small registration coordinator/policy module,
root push lifecycle effect, and Notification Settings in `app/settings/detail-screen.tsx`.
Canonical backend contract remains `POST/DELETE /api/notifications/register-token`.

- Replace token-only suppression with an acknowledged binding containing owner,
  project, token/fingerprint, and last successful server acknowledgement time.
- Always reconcile on authenticated cold start and owner/project/token change.
  A same-user auth refresh may retain its fast routing path: push recovery has its own
  lifecycle, not a dependency on navigation/profile bootstrap finishing.
- Add root-owned `background -> active` recovery. Avoid unconditional requests on
  Control Center/notification-banner `inactive -> active` changes. Returning from OS
  notification Settings must also detect permission changes and reconcile when granted.
- Use a 24-hour lease since the last successful server acknowledgement. This is a
  recovery budget, not a provider token expiry interval. Reconcile on an eligible
  background return and skip the server write while the lease is fresh. Cold start, actual
  token rotation, and explicit Settings checks bypass it.
- A continuously active app uses a 24-hour foreground-only heartbeat. It does not run
  while backgrounded or terminated.
- Force a coalesced check on Notification Settings focus and after permission grant.
  Permission checks never prompt automatically or enable content preferences.
- Listen for native token rotation. Pass the listener's `DevicePushToken` to
  `getExpoPushTokenAsync({ projectId, devicePushToken })`; calling native token acquisition
  from that listener can recursively trigger itself. Never send an APNs/FCM token to an
  endpoint that expects an Expo token. Queue a later rotation if it occurs during sync.
- Single-flight work by identity generation, coalesce repeated triggers, and allow a
  later forced/rotated token to run after the current flight. Use the existing
  `captureAppIdentity()`/`isCurrent()` and `expectedUserId` mechanisms before send and
  before committing acknowledgement/failure diagnostics.
- Only a verified successful registration acknowledgement advances the lease. Permission
  denial, token acquisition failure, transport failure, and HTTP failure do not.
- Retry transient failures with bounded backoff and jitter only while foregrounded and
  under the same identity. Recheck on later foreground/reconnect; do not create infinite
  background timers or hammer the diagnostic endpoint for persistent permission denial.

Persistence decision: acknowledgement is process-local and each authenticated cold start
reconciles with the server. Encrypted SecureStore retains the most recent binding only as
logout cleanup evidence across process restarts; it does not suppress cold-start checks
and never stores JWTs. A separate bounded encrypted queue retains up to ten sanitized
registration-failure records for 30 days, scoped by user and uploaded after registration
recovers. Current Expo/OS state remains the token source. Clock rollback invalidates the
acknowledgement lease.

Gate: behavioral tests run the actual coordinator/registration path with fake clock,
provider, storage, and API. Cover unchanged-token re-registration after simulated server
pruning; frequent resumes; foreground expiry; Settings override; denied-to-granted
permission; token rotation during sync; A-to-B and A-to-B-to-A; sign-out during awaits;
503/offline/invalid acknowledgement; and failure retry coalescing. Verify mutation tests
fail against the old equality-only condition. Root wiring tests supplement, not replace,
these behavioral tests. Run Native typecheck/full suite. The client lifecycle stage needs no DB migration.

## Stage 2 — Make server invalidation safe

Owners: `src/lib/push-server.ts`, `src/lib/push-receipts.ts`, registration route/RPC,
one additive migration and its rollback.

- Capture a UUID binding generation before each provider send. The update trigger renews
  it on every upsert; a disposable database check is still required before production use.
- Return that binding version additively in the registration acknowledgement. New Native
  cleanup requests carry the version they actually acknowledged, so a delayed logout
  cannot delete a later A-to-B-to-A registration of the same token. Review compatibility
  for older clients that omit the version; do not claim their cleanup is race-safe.
- Add a nullable binding-version snapshot to `push_receipts_pending` and carry it from
  token lookup, through send, to receipt processing. Receipt insertion time is not a
  safe substitute: re-registration can happen while the provider call is in flight.
- Delete invalid tokens atomically only when token, owner, and captured binding version
  still match. Apply the same guard to immediate ticket errors and delayed receipts.
- A stale receipt must not delete a freshly acknowledged registration or another
  account's reassigned token. Missing-version legacy pending rows must not perform an
  unguarded delete; record the limitation and let a new provider outcome resolve it.
- Retain DeviceNotRegistered pruning. Never reinsert a token from the audit log: only
  the app can acquire/register its current token.
- Record pruning only for rows actually removed. Retain pending receipts if a necessary
  DB mutation fails so the cron can retry; distinguish refreshed binding preserved,
  already absent, actual prune, and DB failure.
- Validate registration input/acknowledgement, retain shared auth classification, bind
  identity server-side, preserve service-role-only RPC execution, sanitize API errors.
- Unbind with current credentials before explicit logout, coordinate it with in-flight
  registration, and protect a newly signed-in binding from delayed old-owner cleanup.
  Keep emergency session-loss cleanup best-effort. Do not persist an old access token
  as a durable logout credential. Offline logout cannot promise immediate server removal.

Gate: SQL/route tests prove normal prune, concurrent registration preservation, A-to-B
ownership protection, duplicate receipts, old pending rows, and DB retry paths. A real
disposable Postgres check exercises atomic concurrency/version comparisons. Apply an
additive migration only with explicit production authorization, following repository
migration-version checks; backend must tolerate old Native clients during rollout.

## Stage 3 — Device health and durable observability

Reuse `push_token_events`, `notification_deliveries`, existing auth diagnostics, and
admin monitoring. Do not add a second notification queue or a parallel telemetry system.

- Capture structured registration attempt/outcome/trigger/permission state, owner-safe
  installation identifier, app build/runtime/OTA identity, latency, and request ID. Tokens
  are hashed in audit records. Do not log access tokens, email addresses, or notification
  text. Locally queue bounded failed-upload evidence when the backend is unreachable.
- Persist each ticket's outcome and final receipt before deleting the pending row;
  attach notification ID/key and token binding fingerprint/version at send time.
  Store failed, missing/expired, and successful receipts with a reviewed retention policy.
- Separate inbox created, Expo ticket accepted, APNs/FCM handoff acknowledged, and actual
  device display/user interaction. Receipt success alone does not prove lock-screen display.
- Replace capped admin-derived totals with actual window-scoped counts, use the same
  denominator/time window, and show no-data instead of 100% when nothing was attempted.
- If adding passive health, design installation-specific authenticated health and a
  bounded invalidation/check policy. Do not block Home rendering or add a registry query
  to every content request. An exact-device signal can bypass the normal registration
  lease; a user-level false signal may aid recovery but a true signal proves little.
- Show accurate OS-permission/registration status in Notification Settings, with an
  explicit Check/Repair action; permission-off is different from registration failure.
  A test push is user-initiated and rate-limited. It must respect account ownership and
  notification controls and must not be broadcast during verification.

Local implementation status: the Native Settings status, encrypted bounded diagnostic
outbox, receipt-outcome columns/retention, exact admin counts, and stage labels are in the
worktree. Still missing before this stage is complete: build/runtime/request correlation on
registration diagnostics, install-specific server health, and release evidence from a real
device. Do not claim those are delivered by the current source changes.

Gate: telemetry survives a transient offline interval, deduplicates by attempt/ticket, and
stays isolated across accounts. Support can trace a skipped attempt to missing registration
and a registration repair to a provider receipt without guessing.

## Stage 4 — Release, canary, and comparison

1. Freeze exact source commits, migration versions, backend deployment ID, signed build,
   runtime, OTA group/platform IDs, Android device/OS, permission and channel state, and
   reminder preference. Version `1.0.0` alone cannot identify the installed artifact.
2. Ship client lifecycle recovery independently after checks. Deploy compatible server
   changes when their migration/checks are approved; do not bundle unrelated feature work.
3. Use an explicitly opted-in test device for a controlled missing-registration
   scenario. Manipulate test bindings only, with approval. Test genuine foreground return,
   cold start, explicit Settings check, token change, offline-to-online recovery, and
   account switch. Do not sign the reported user out or alter their preferences by SQL.
4. Confirm registration audit/upsert first, then one provider ticket, then its receipt,
   then physical lock-screen presentation and tap destination. Record every failure;
   do not call the release complete on unit tests or ticket acceptance alone.
5. Watch the first 24-48 hours, then compare matched build/OS/scenario windows.

| Metric | Definition / comparison |
| --- | --- |
| Registration recovery | p50/p75/p95 from eligible foreground/Settings trigger to successful server acknowledgement, with sample counts, failures and timeouts |
| Missing-binding exposure | Active installations with granted permission and missing registration, using device-specific evidence; report unknown permission separately |
| Suppression correctness | Owner/project/token unchanged plus valid lease; bypass reasons and single-flight duplicates |
| Delivery outcome | Window counts for no-token skips, ticket errors, receipt errors/missing receipts, handoff successes; no conflation with physical display |
| Pruning correctness | Actual deletes vs stale outcomes preserved vs DB errors, per exact binding version |
| Cost/regression | Registration/provider calls per active installation/day, retry counts, endpoint latency, and startup/render work added |

Use DB-persisted attempt/receipt records and the existing admin pipeline. Do not pool
different installed artifacts or OS cohorts. Preserve raw anonymized observations and
scenario traces. Report confidence intervals only with an appropriate, stated method
and sufficient data; 17 accounts do not justify fleet-scale percentile claims.

Rollback: each code stage is a separate reversible commit. Keep additive schema fields
through code rollback; never roll back by deleting healthy token rows or reopening broad
RPC grants. Device repair must not replay an accumulated backlog of obsolete reminders.
Future reminders use the existing resolver/dispatcher/preferences/quiet-hours/dedupe rules.

## Immediate support guidance

A force-close and reopen can bypass the current RAM cache, but recovery still depends on
permission, a usable signed-in session, Expo token acquisition, and a successful POST.
Reinstallation is not a requirement and should not be the first recommendation. Confirm
OS/channel notification settings with the user; battery restrictions can affect delivery
but are not established as the reason for this particular token invalidation. Opening or
toggling in-app Settings is not a reliable repair in the currently installed build. The
local client adds a forced Settings reconciliation, but it cannot help until that code is
installed. No backend-only fix can recover an invalid device token without a later client
sync.

## Primary references

- [Expo SDK 57 notification API](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/):
  token rotation listener, native-versus-Expo tokens, permission/channel requirements,
  network-dependent token acquisition and offline retry.
- [Expo push sending and receipts](https://docs.expo.dev/push-notifications/sending-notifications/):
  DeviceNotRegistered handling, re-registration, 15-minute receipt checking, 24-hour
  receipt expiry, and provider acknowledgement limitations.
- [Firebase token management](https://firebase.google.com/docs/cloud-messaging/manage-tokens):
  registration timestamps, invalidation, freshness, and the distinction between inactive
  tokens and current installation activity.

Older OneSignal ADR/audit documents in this repository are historical and do not
describe the live Expo send path. Keep this recovery plan aligned with the current
central notification resolver runbook rather than reviving that superseded architecture.
