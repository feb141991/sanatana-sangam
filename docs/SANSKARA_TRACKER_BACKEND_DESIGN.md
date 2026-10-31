# Sanskara tracker backend design (step 3) — pre-migration

Status: **v0.5. M1 to M4 are written, with rollbacks and tests, and verified on a scratch Postgres. CORRECTION, observed
2026-10-30: all four ARE applied in the live Supabase project (`supabase_migrations.schema_migrations` lists
`20261029160000` to `20261029160300`), although the commit messages say "unapplied". Who applied them, and when, is not
recorded; they were not applied by the session that wrote this section. See the addendum at the end for what was checked
on the live objects. M5, M6, the routes, the reminder producer, the dispatcher changes and the screens are not written.**
Implements the approved contract (`SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md`, v0.2: decisions D1 to D5 approved as
recommended on 2026-10-29). Written 2026-10-29; live state recorded 2026-10-30.

This document turns the contract into tables, one authorization function, a function surface, a reminder lifecycle on
the existing notification pipeline, scheduled jobs, a migration sequence and a retirement plan for the old
implementation. For M1 to M4 the migrations are the source of truth for the DDL; section 11 lists every place they
differ from the first version of this design, and why.

## 1. The shape in one paragraph

Every person who uses the tracker has a **subject**: an *account subject* (themselves) or a *dependent subject* (a minor
they manage). A subject has **records** (one per rite, plus any number of custom milestones). Sensitive fields live in a
separate table. Access is decided by one function, `sanskara_can`, called by every read and write function and by the
reminder pipeline; clients never touch the tables. Sharing is a **grant** (view only) between members of one Kul.
Reminders are **subscriptions** that feed the existing candidate pipeline with a rolling horizon, so an edit or a
completion can cancel or replace what is pending in the same transaction.

## 2. Tables (the DDL is in the migrations)

M1 is `20261029160000_sanskara_reminder_preferences.sql`; M2 is `20261029160100_sanskara_tracker_core.sql`. Each has a
rollback in `supabase/rollbacks/` and a test in `supabase/tests/`.

| Table | Purpose | Constraints that carry the rules |
|---|---|---|
| `profiles` (+2 columns, M1) | `wants_sanskara_reminders` (default **false**), `sanskara_opt_in_generation` | Separate from `wants_family_notifications` (D4). The counter is server-owned: a trigger raises it by one whenever the opt-in, consent, timezone, language, quiet hours or the deletion cool-off changes, and ignores any client write to it (the remembrance trigger leaves a client-supplied value in place on one path; this one does not). |
| `sanskara_rites` | Reference: the data class of each rite | Created with ONE technical row, `custom`. The server, never the client, decides how sensitive a record is, and nothing here asserts a ritual rule, a timing or a tradition. A `prenatal` rite must be Class A; `custom` is Class A. Step 2 adds reviewed rows. |
| `sanskara_subjects` | The person a timeline is about | Shape check: an account subject has an account and nothing else; a dependent has a name (1 to 40 characters, no control characters) and a birth date and no account. One account subject per account. No link to the family tree (section 11). |
| `sanskara_subject_managers` | Who manages a dependent | A trigger refuses a manager on an account subject. Another deletes a dependent that loses its last manager (deletion over disclosure, E9/E10); the functions refuse to remove the last manager, the trigger catches the cascade from a deleted account. |
| `sanskara_records` | One record per rite per subject | `UNIQUE (subject_id, rite_key)` for catalogue rites, any number of `custom` ones; `rite_key` references `sanskara_rites`. A trigger refuses a prenatal rite on a dependent. The data class is read from `sanskara_rites`, not stored on the record, so it can never drift. `version` for optimistic concurrency. |
| `sanskara_record_private` | Class A fields: notes, place, performer, expected due date | Its own table so no viewer projection can join it by accident. A trigger allows a due date only on a prenatal record of an account holder. Own `version`. An empty block cannot exist. |
| `sanskara_grants` (table in M2, functions in M3) | View access between Kul members | `view` only; `record` or `timeline` scope; `kul_id` stored so the audience boundary is re-checked at every read; one live grant per grantee per record or timeline; cannot grant to yourself. Created in M2 so `sanskara_can` is written once, in full, and tested in full. |
| `sanskara_audit` | Metadata-only trail (contract section 7) | Closed set of actions (including `dependent_deleted` and `subject_deleted`); `detail` is a small object and never record content; rows about an account go with the account. |
| `sanskara_request_log` | Idempotency for every write function | Primary key `(account_id, request_id)`; stores the first response, which a retry returns; pruned after 7 days (M5). |
| `sanskara_claims` (M3) | The hand-over at 18 | Only the SHA-256 of the token is stored; one pending claim per dependent; `expires_at` after `created_at`; forced RLS, no client grants. |
| `sanskara_subscriptions` (M4) | One account's reminder for one record at one lead time (0, 1, 3, 7, 14 or 30 days) | `unique (record_id, account_id, lead_days)`; `generation` moves on every change; forced RLS, no client grants. |

Every M2 table has row-level security **enabled and forced**, no policies, and no grants to `anon`, `authenticated` or
`PUBLIC` (the pattern of `kul_family_link_invitations`). Forced RLS is safe for the definer functions because Supabase's
`postgres` role is not a superuser but has `BYPASSRLS`, and 20+ existing tables already force RLS (checked against
production, read-only, 2026-10-29). Clients reach data only through the functions in section 4.

Changes to existing tables in M4: one partial unique index on `notification_candidates` (at most one pending or resolving
reminder per subscription and lead time), and triggers on `notification_candidates`, `profiles` and `kul_members`
(section 5).

## 3. Authorization: `sanskara_can(action, subject, account, record)`

`SECURITY DEFINER`, `STABLE`, empty `search_path` with every name schema-qualified, `execute` revoked from `PUBLIC`,
`anon` and `authenticated`; granted to `service_role` so server code (the reminder producer, the send-time check) calls
the same function. Called from other definer functions, never from a client. Returns a boolean; on **any** error,
missing row or disagreement it returns false (contract P7). Nothing else decides access.

Evaluation, in this order:

1. **The acting account is active**: a profile exists and the account is not in its deletion cool-off (applies to every
   action, including export and delete).
2. **The subject exists**, and a record named with it **belongs to that subject** (a mismatched record is false, so a
   grant on one subject can never be used on another).
3. **Role**, from relationships the system verifies:
   - *account subject*: owner if `subject.account_id = account`.
   - *dependent*: manager if the account is in `sanskara_subject_managers` and the UTC date is before the 18th
     birthday; former manager from the 18th birthday for 12 months; otherwise none. Derived from the dates themselves,
     so correctness never depends on the majority job having run. The boundary effect is at most one calendar day.
4. **Viewer**, only when a record is named and the role is none: a live grant for this account (`revoked_at is null`,
   level `view`) that covers the record (a `record` grant for that record, or a `timeline` grant and a Class B record),
   **and** both the grantee and the person who granted it are *now* in `kul_members` for the grant's `kul_id` and
   `profiles.kul_id` agrees for both (any disagreement denies), **and the granter still holds authority over the
   subject** (the owner, or a current manager of a minor). The last condition is new (section 11): shares made by a
   parent stop when the child turns 18, and shares made by a removed manager stop with the removal. A `timeline` grant
   never covers a Class A record; a Class A record is reachable only by an explicit `record` grant, and then only by
   `read_meta`.
5. **Consent**, for every action except `export`, `delete_record` and `delete_subject` (so a person who withdrew consent
   can still take their data or erase it): the **acting** account's `consent_religious_data` must be true, and so must
   the subject's side (the account holder's, not in the cool-off; for a dependent, at least one current manager's; for
   a former manager, their own, already checked).
6. **The action** must be allowed for the role:

| Role | Allowed actions |
|---|---|
| owner | `read_meta`, `read_record`, `read_private`, `write_record`, `delete_record`, `set_completion`, `manage_grants`, `subscribe`, `receive_reminder`, `export`, `delete_subject` |
| manager | the owner's, plus `manage_managers` |
| former manager | `read_meta`, `read_record`, `read_private`, `export`, `start_claim` |
| viewer, Class B record | `read_meta`, `read_record`, `subscribe`, `receive_reminder` |
| viewer, Class A record (record grant) | `read_meta` only |
| everyone else | nothing |

`read_meta` is "this record exists, its name or title, and whether it is complete"; `read_record` adds its dates;
`read_private` is the Class A fields. A viewer with no record named gets nothing.

Nothing in this function reads `kul_family_members`, `kul_members.role` or any tree relationship for authority.

## 4. Function surface

All are `SECURITY DEFINER` with an empty `search_path`; they take the account from `auth.uid()` (never an argument), and
`authenticated` alone may execute them. Writes take a `p_request_id uuid`: the id is claimed in the same transaction (a
failure rolls the claim back, so a retry is fresh), and a retry returns the stored first response marked `replayed`; a
concurrent identical request waits and gets the same response; the same id for a different operation is refused.
Each write calls `sanskara_can` first and validates its own input, so a database constraint message never reaches a
client. Errors are fixed short strings with custom SQLSTATEs: `SK401` signed out, `SK403` consent required, `SK404` not
found **or** not allowed (deliberately one code, so existence is never revealed), `SK400` invalid input, `SK409`
conflict (version, duplicate, request reuse), `SK422` a rule refuses it (limit, last manager, prenatal on a dependent).

| Function | Milestone | Effect |
|---|---|---|
| `sanskara_my_timeline()` | M2 | The caller's account subject (created on first use) and its records, with private fields. |
| `sanskara_dependents()` | M2 | Dependents the caller manages, and those they may still read for 12 months, with `can_edit` / `can_manage` and records. |
| `sanskara_export_mine()` | M2 | Everything the caller owns or may read as a manager; works without consent; names no one else (grants are counted by scope). |
| `sanskara_create_dependent(request, name, birth_date)` | M2 | A minor only (by the same arithmetic as `sanskara_can`); the caller becomes the first manager; at most 10 per account. |
| `sanskara_create_record(request, subject, rite_key, custom_title, planned_date)` | M2 | Rite must exist in `sanskara_rites`; a title only on `custom`; a prenatal rite only on the account holder's own timeline; at most 100 records per subject. |
| `sanskara_update_record(request, record, custom_title, planned_date, expected_version)` | M2 | Optimistic concurrency; M4 adds superseding pending reminders when the date changes. (The first design had one `save_record`; create and update are separate so a stale client can never overwrite by accident.) |
| `sanskara_save_private(request, record, notes, location, performed_by, expected_due_date, expected_version)` | M2 | Class A fields with their own version; every field empty removes the block. |
| `sanskara_set_completion(request, record, completed_date or null, expected_version)` | M2 | Complete or reopen; M4 adds cancelling every subscriber's pending reminders. |
| `sanskara_delete_record(request, record)` | M2 | Never needs consent; M4 adds cancelling its reminders. |
| `sanskara_add_manager` / `sanskara_remove_manager(request, subject, account)` | M2 | The target must share the caller's Kul (both in `kul_members` and `profiles.kul_id`) and not be in the cool-off; at most 4 managers; the last manager cannot be removed; the subject row is locked so two managers cannot remove each other. |
| `sanskara_delete_dependent(request, subject)` | M2 | Any current manager may erase a dependent and everything about them; a former manager may not. (Not in the first design; section 11.) |
| `sanskara_delete_mine(request)` | M2 | Erases the caller's own timeline; dependents are untouched; works without consent. |
| `sanskara_grant_view(request, subject, record or null, grantee)` | M3 | View-only share of one record, or of the whole timeline (null record). The grantee must be in the caller's Kul (both tables), not in the cool-off, and must not already have full access; at most 50 live shares per subject; `kul_id` is recorded. Audit detail is the scope only. |
| `sanskara_revoke_grant(request, grant)` | M3 | Anyone who may manage grants for the subject (a revoke by any manager stands), or the grantee leaving a share. Idempotent. M4 adds cancelling the grantee's reminders in the same transaction. |
| `sanskara_list_access(subject)` | M3 | Owner or manager: live shares with the person's username and name, the scope and whether the caller made it. A share whose audience has lapsed is still listed until revoked; it grants nothing meanwhile. |
| `sanskara_shared_with_me()` | M3 | What others share with the caller, each row re-checked by `sanskara_can`: a Class B record gives name, dates and status; a Class A record shared by an explicit grant gives name or title and whether it is complete, never dates; private fields never; who shared it; the child's label for a dependent. |
| `sanskara_start_claim(request, subject)` | M3 | Former manager, inside the 12 months. Returns a one-time 64-hex token **once**; only its hash is stored and the stored (retry) response omits it. Valid 7 days or until the window ends; starting another cancels the first. |
| `sanskara_cancel_claim(request, subject)` | M3 | Withdraws the pending claim. |
| `sanskara_accept_claim(request, token)` | M3 | The new adult, signed in, from the 18th birthday: records **move** to their own timeline (created if needed); a record they already have for a rite wins and the other is dropped, never merged; every share on the dependent ends; the dependent, its managers and the claim are deleted. All-or-nothing (a claimant who would exceed 100 records gets nothing). Every token failure is the same `SK404`. The claimant must not be a manager of that dependent. |
| `sanskara_set_reminder(request, record, lead_days, enabled)` | M4 | Switches the caller's reminder for one record and lead time on or off. Needs the opt-in to switch on, a dated and incomplete record, and the right to `subscribe` (a viewer for a Class B record only); at most 50 subscriptions per account; every change moves `generation`. |
| `sanskara_my_reminders()` | M4 | The caller's own reminders, those they still have the right to. |
| `sanskara_reminders_due(now, horizon, late)` | M4, server | What the producer should create: reminders whose moment (planned date minus lead, 09:00 in the recipient's timezone) lies inside the horizon, not already created, and passing `sanskara_can('receive_reminder')`. Returns the versions to carry, the audience, the local date, timezone, language and quiet hours. |
| `sanskara_reminder_still_valid(subscription, generation, record_version, profile_generation)` | M4, server | The dispatcher's send-time check. |

Internal helpers (definer functions only): `sanskara_actor`, `sanskara_claim_request`, `sanskara_finish_request`,
`sanskara_records_json_unchecked` (its name is a warning: the caller must already have called `sanskara_can`).

Route handlers under `/api/native/sanskara/*` are thin: Bearer and cookie auth through `getApiUser`, rate limits, input
shape, then the function. Errors are mapped to short codes; Native shows its own sentences (no database text).

## 5. Reminders on the existing pipeline (M4)

The pipeline is candidate producer, then `notification_candidates`, then the resolver, then `notification_schedule`,
then the dispatcher. Sanskara reminders use it as-is, with `event_type = 'sanskar_milestone'`. That type is already in
the resolver's *explicit user requested* class, which is right for an opt-in subscription, and the class comes from the
server-owned event type, so producer metadata cannot widen it. Quiet hours, budgets, dedupe, dispatch and receipts are the
pipeline's, unchanged.

**Selecting what to create.** `sanskara_reminders_due()` does the selection in SQL so that access is decided by the one
`sanskara_can` and not re-implemented in TypeScript. The TypeScript producer (not yet written) calls it, then inserts one
candidate per row: `event_id` = the subscription id, `event_instance` = `L<lead_days>`, `audience_variant` = `self`,
`manager` or `viewer`, localised generic text, and `metadata` with exactly `subscription_id`, `subscription_generation`,
`record_version`, `profile_generation` (and optionally `local_date`, `timezone`).

**Insert-time validation.** A `BEFORE INSERT` trigger on `notification_candidates` (the pattern the family-remembrance
producer already uses) refuses a Sanskara candidate unless, at that instant: the subscription exists, is on and has the
generation named; the record has the version named; the recipient's opt-in generation matches; `sanskara_can` still
allows it; the audience is the right one; the user is the subscriber; the lead time matches; the schedule is within 48
hours; the payload carries nothing but the allowed keys; the link is generic (no query, no id); and the text does not
repeat the child's name, the milestone's title or the rite. This closes the producer's read-then-insert gap. A violation is
an error code `23514` with a fixed message.

**At most one live reminder per (subscription, lead time):** a partial unique index over `pending` and `resolving`
candidates. An earlier accepted one does not block the next occurrence. A reminder already created for a local date, even
a cancelled one, is not offered again for that date (a small known loss: switching a reminder off and on within the same
morning does not re-create that morning's reminder).

**Cancellation is done by triggers, so no path can forget it.** `sanskara_cancel_reminder_rows` cancels the `pending` and
`resolving` candidates and the `pending` and `sending` schedule rows of the given subscriptions (the statuses the
remembrance feature cancels too; a resolver batch holding a cancelled candidate is rolled back by
`persist_notification_candidate_resolution` and re-claimed after its lease, so nothing is sent). It runs from:

| Event (contract) | Mechanism |
|---|---|
| Subscription deleted, which every cascade does: record deleted (E5), person erased, account deleted (E9, E10, E14) | `BEFORE DELETE` trigger on `sanskara_subscriptions` |
| Subscription switched off or changed | `AFTER UPDATE OF enabled, generation` trigger |
| Planned date changed, record completed (E4) or moved to another timeline (E7a) | `AFTER UPDATE` trigger on `sanskara_records` |
| Share revoked (E1), manager removed (E6), records handed over (E7a) | `sanskara_on_access_lost` hook, called by `sanskara_revoke_grant`, `sanskara_remove_manager` and `sanskara_accept_claim`: **deletes** the affected person's subscriptions that no longer have the right to receive (the delete trigger does the cancelling) |
| Record completed (E4) | `sanskara_on_record_completed` hook: switches every subscriber's reminder off; reopening does not switch it back on |
| Consent withdrawn, reminders turned off, deletion cool-off (E8, E9) | `AFTER UPDATE` trigger on `profiles`: cancels the person's own pending reminders; if consent goes or the account is deleting, also everyone's reminders for what they own or manage, and marks their timeline `suspended_at` with an audit row (cleared when consent returns) |
| Kul membership ends (E2, E3) | `AFTER DELETE` trigger on `kul_members`: cancels the person's own pending reminders and those on what they own or manage; the subscriptions are **kept**, so they resume if the membership returns |

The rule behind the two treatments: an explicit, deliberate ending of access deletes the subscription; an environmental
lapse (consent, Kul membership) only suspends it. Over-deleting is the safe error: the person re-subscribes.

**Send-time check.** `sanskara_reminder_still_valid(subscription, generation, record_version, profile_generation)` is true
only if the subscription is on and unchanged, the record is unchanged, dated and incomplete, the recipient is opted in with
the same generation and not in the cool-off, and `sanskara_can('receive_reminder')` still holds. Any doubt is false.

**Not yet done, and required before the producer is switched on** (files another session has uncommitted edits in; they
must wait for that work to land and follow its per-feature preference map rather than add a parallel mechanism):
- the dispatcher calls `sanskara_reminder_still_valid` for a `sanskar_milestone` row before sending (without it, a
  reminder cancelled in the instant between the resolver claiming it and the dispatcher sending it could still be sent);
- gate `sanskar_milestone` on `wants_sanskara_reminders` instead of `wants_family_notifications`, with the same
  missing-column fallback the other new flags use;
- stop sending `sanskara_id` and `kul_member_id` in the push data and send a neutral `type`, so the payload carries only
  the opaque id and the route;
- remove the one-by-one send path that existed only for those per-event ids.

In-app notification creation and OS push delivery stay separate; nothing here claims delivery from a token or ticket.

## 6. Scheduled jobs

| Job | Does | Cadence |
|---|---|---|
| Reminder producer | Section 5 | With the other producers |
| Majority sweep | Moves dependents reaching 18 to `frozen`, stops their managers' reminders, deletes frozen subjects 12 months after their 18th birthday unless claimed | Daily |
| Consent purge | Deletes a subject's data 30 days after `suspended_at` if consent is still false | Daily |
| Audit and request-log retention | Deletes audit rows older than 12 months and request-log rows older than 7 days | Daily |

## 7. Retiring the old implementation

Production holds zero rows in `user_sanskaras` and `user_sanskars` and no scheduled `sanskar_milestone` notifications
(checked 2026-10-29). The final migration **asserts both tables are still empty at apply time and aborts if not**, then
drops `user_sanskaras`, `user_sanskars` and the unused `sanskars` catalogue. `POST /api/sanskar/schedule` and
`POST /api/sanskar/suggest` are removed (the suggestion route sends ritual questions to an LLM, which the contract
forbids), and the web Sanskara page that calls them goes with them. Nothing in Native calls any of it.

## 8. Migration sequence

Each migration carries a rollback in `supabase/rollbacks/` and a test in `supabase/tests/`, is tested on a shadow
branch before production, regenerates `database.generated.ts`, and is reported as applied or unapplied. None is applied
without the founder's approval, and `supabase db push` is never used.

| # | Contents |
|---|---|
| M1 *(written, tested; APPLIED live, observed 2026-10-30)* | The two `profiles` columns and the server-owned counter |
| M2 *(written, tested; APPLIED live)* | `sanskara_rites`, subjects, managers, records, private fields, grants (table only), request log, audit; `sanskara_can`; the read and write functions for owners and managers |
| M3 *(written, tested; APPLIED live)* | `sanskara_claims`; grant, revoke, list-access and shared-with-me functions; start, cancel and accept claim |
| M4 *(written, tested; APPLIED live)* | `sanskara_subscriptions`; the live-reminder index; the cancellation triggers and the two hooks; the send-time check; insert-time validation of candidates; the due-reminders selector; `sanskara_set_reminder` and `sanskara_my_reminders`. (The admin account-delete list gained the Sanskara tables in the same commit.) |
| M4a *(tested on scratch Postgres; APPLIED to production 2026-10-31)* | The optional display-only Kul pointer: `sanskara_subjects.kul_family_member_id`; `sanskara_create_dependent` gains an optional fourth argument; `sanskara_set_kul_link`; `sanskara_dependents` returns the pointer re-validated for the viewer; two internal helpers; two new audit actions. See "The Kul pointer" below. |
| M5 | The scheduled jobs |
| M6 | Retirement of the old tables (empty-assertion first) |

## 9. What has and has not been verified

**Verified (scratch Postgres 18, 2026-10-29, running as a non-superuser `BYPASSRLS` owner and exercising clients with
`SET ROLE authenticated` plus the JWT subject claim, so privileges, forced RLS and the SK error codes are all in play):**
M1 and M2 apply cleanly; their rollbacks leave nothing behind and the migrations then re-apply and pass. The M1 test has 20 assertions. The M2 test has 117 checks that a statement is refused with an exact error code, 64 permission matrices that each assert all 13 actions for one person on one subject or record (832 allow-or-deny decisions: every role, the 12-month window, the audience boundary, the granter rule, consent, the deletion cool-off), and 107 value assertions (structure and privileges of 8 tables and 22 functions, idempotency, versions, limits, validation, erasure, and account-deletion cascades). **43 of 43 mutations of the migration are caught** by the M2 suite (re-run after the M3 amendment below), 3 of 3 of M1's, and 32 of 36 of M3's, the other four surviving as redundant defences (`sanskara_can` is the final arbiter, so removing an earlier filter changes no output: the self-share check, the `revoked_at` filter and the Class A filter in the shared-records query, and the explicit grant delete at hand-over, which the subject's cascade repeats) (each breaks one rule: a missing
audience check, a missing granter check, timeline covering Class A, consent, the 12-month window, the version checks, the
last-manager rule, retry handling, privileges, forced RLS, and others).

The M3 test has 50 refusal checks, 3 permission matrices and 86 value assertions (validation of every share, what a viewer sees for Class B, Class A and custom records, timeline and record grants overlapping, revocation by an owner, another manager and the grantee, audiences lapsing and returning, the 50-share limit, the claim token lifecycle: hash-only storage, the token absent from the request log and audit, cancellation, expiry capped at the window, every refusal; and the hand-over itself: the conflict rule, the move, atomic failure, the ex-manager and former viewer left with nothing). The full M1 to M3 chain applies, all three suites pass, the three rollbacks in reverse order leave nothing behind, and the migrations then re-apply and pass.

The M4 test has 46 refusal checks, 30 checks that a subscription's reminders were cancelled or left alone, and 98 value assertions: every path in the table in section 5 driven through the real M2 and M3 functions and through raw writes; reminders already in flight (a resolving candidate, a sending row); rows that must not be touched (accepted, sent, other event types); the send-time check against every way a reminder can go stale; 25 refusals of a candidate at insert (plus the live-index refusals); the selector with controlled time, timezones (including an unknown one), the horizon, the lateness limit and each exclusion. The suite runs on the real notification-pipeline migrations (schedule table, candidates table, claim and lease), not stand-ins. M4's mutation sweep catches 61 of 62 (the survivor is the explicit `not is_deleting` clause of the send-time check, redundant with `sanskara_can`), and the four hook call sites in M2 and M3 are each caught. A guard test (`src/lib/sanskara-account-deletion-contract.test.ts`, 3 tests, shown red without an entry) fails if an account-linked Sanskara table is missing from the admin account-delete list. The tests are pinned to UTC: they were found to fail between midnight and 05:30 IST because they built dates with the session's local date while the functions correctly use UTC. The full M1 to M4 chain applies, all four suites pass, the four rollbacks in reverse order leave nothing behind on any table, trigger or index (a first attempt at M4's rollback failed this check and was fixed), and the migrations then re-apply and pass.

The earlier run of this design (47 constraint checks) executed as a superuser, which bypasses RLS and every privilege,
so it could not have shown a privilege mistake. It is superseded by the run above.

Checked read-only against production: the `postgres` role has `BYPASSRLS`; default privileges grant new objects to
`anon`, `authenticated` and `service_role` (so the explicit revokes are what matter); no `sanskara_*` name exists; the
real `auth.uid()` reads the same claim as the test stub; no existing trigger on `profiles` conflicts with M1's.
Postgres does not write bound parameters (a child's name, private notes) to its error log today:
`log_parameter_max_length_on_error` is 0, `log_statement` is `ddl`, duration logging is off.

**Not verified:**
- (Superseded 2026-10-30: the migrations are applied in the live project, never to a shadow branch first. The objects
  were then checked read-only; see the addendum. The functional tests have still only been run on a scratch Postgres,
  not against the live database.)
- Behaviour under truly concurrent requests (the design relies on a row lock and the request-log primary key; both are
  exercised sequentially only).
- M3 to M6, the reminder pipeline integration, the dispatcher and producer changes, the leave and remove hooks.
- Performance of `sanskara_can` at scale (each call runs a handful of indexed lookups; the list functions call it once
  per subject, not once per record).
- Any route, screen, device or production behaviour. `src/types/database.generated.ts` was extended by hand to match the
  migrations and must be regenerated after the shadow-branch apply.

## 10. Open questions

1. **Coordination.** The dispatcher and delivery-policy files have another session's uncommitted edits; the changes listed
   at the end of section 5 wait for them. **Do not schedule the producer until they are in**: until the dispatcher calls
   the send-time check, a reminder cancelled while claimed could still be sent.
2. **Lead-time set** (0, 1, 3, 7, 14, 30 days) and **09:00** default are proposals; the catalogue step may refine them.
3. **Claim token lifetime** (7 days is proposed, matching family link invitations) and how the token reaches the new
   adult.
4. **Hooks into Kul leave and removal.** Confirm whether to call `sanskara_cancel_reminders` from those functions or rely
   on the send-time check alone (the check is sufficient for correctness; the hook is for tidiness).
5. **Legal review** before launch (contract section 13).
6. **The hand-over token reaches the new adult out of band.** The manager copies or shares a link containing the token;
   the system cannot prove the person who redeems it is the child (the one place identity is taken on trust). The token
   is single-use, 7 days at most, hashed at rest, cancellable, refused to any manager of that dependent, and every start
   and accept is audited. Whether the Native screen shows a share sheet or a QR code is a step 4 decision. A "claim
   pending" indicator is not yet part of `sanskara_dependents`.
7. **`suspended_at`.** M4's trigger on consent withdrawal sets and clears it for the person's own timeline (not for a
   dependent whose managers withdraw; the consent purge job will decide that); M5 purges 30 days after it.
   `sanskara_can` ignores it and reads consent live, so a missed trigger fails closed (data stays inert), never open.
8. **The majority boundary and pending reminders.** When a child turns 18 the managers become former managers and
   `sanskara_can('receive_reminder')` turns false from that date by itself, so insert-time validation and the send-time
   check stop new and pending reminders. The daily sweep (M5) cancels the pending ones explicitly and tidies the
   subscriptions.
9. **Log hygiene is a setting, not a test.** The no-parameters-in-error-logs result above holds only while those settings
   stay as they are, and no migration test can guard a project setting. Add it to the launch checklist and re-check
   before launch; also confirm that API and edge logs do not record request bodies for `/api/native/sanskara/*` routes
   (to be checked when the routes exist).
10. **Shadow branch.** M1 to M4 should be applied to a Supabase branch and all four suites re-run there before production.
   That is a paid branch; it needs the founder's approval.

## 11. Decisions taken while writing M1 to M4 (for review)

Each is a difference from the first version of this design, or a rule the first version left open. All err towards
denying; none widens access.

1. **The reference table.** `sensitivity` was to be "set by the server from the catalogue", but the catalogue is step 2.
   Hard-coding the sixteen Hindu samskaras here would have pre-empted the reviewed, per-tradition catalogue (D3) and
   asserted which rites are prenatal. So `sanskara_rites` exists with one technical `custom` row, and until step 2 adds
   reviewed rows only custom milestones can be created. Consequence for the product: until the catalogue lands, the
   tracker is chosen-date milestones only, which matches D3.
2. **Custom milestones are Class A.** A custom title is free text, and the contract says a field not yet classified is
   Class A. So a timeline grant never covers a custom milestone (otherwise a milestone added later is shared the moment
   it is created); it can be shared only by an explicit record grant, and a viewer then sees its title and status only.
   Relaxing this to Class B is one row in `sanskara_rites`.
3. **A share lasts only while its granter holds authority.** The first design checked the audience (Kul membership) but
   not the granter's authority. Without it, a share made by a parent would keep a child's records visible after the
   child turns 18, and a share by a removed manager would survive the removal. Now both end at once.
4. **Consent is checked on both sides.** The acting account must have consented to religious data processing (this also
   matches contract section 8.2 for reminder recipients), and so must the subject's side. Export and erasure ignore
   consent.
5. **Any current manager may erase a dependent** (`sanskara_delete_dependent`). The contract had no way to remove a
   dependent's name and birth date short of deleting every record and leaving the subject behind; that is a data
   minimisation gap. Needs the founder's confirmation that any manager (not only the creator) may do it.
6. **No pointer to the family tree.** `tree_node_id` was optional and display-only; nothing needs it yet, and a link
   from a private subject to a Kul-visible tree node is exposure with no benefit. Add it later only if a screen needs it.
7. **Create and update are separate functions**, and private fields have their own version, so a stale client cannot
   overwrite another manager's edit.
8. **Limits**: 10 dependents per account, 100 records per subject, 4 managers per dependent. Proposals; they bound abuse
   and the size of the export.
9. **Replays return the stored response**, not a fresh read, so a retry after access was lost reveals nothing new.
10. **Definer functions use an empty `search_path`** and qualified names, so a temporary table created by a caller can
    never shadow a Sanskara table.

11. **Only a former manager starts the hand-over (M3; the founder asked for recommendations on 2026-10-29).** A claim can be
    accepted only from the 18th birthday, so a token issued earlier would only be a long-lived bearer secret. The manager
    of a minor therefore waits for the birthday; `start_claim` moved from the manager list to the former-manager list in
    `sanskara_can` (M2 was amended before it was applied anywhere).
12. **A grantee may end a share made to them** (`sanskara_revoke_grant`). It removes access and widens nothing.
13. **On accept, the claimant's own record wins and the other is dropped**, and the response says how many were dropped,
    so nothing merges silently. A claimant who would exceed the 100-record limit gets nothing and the claim stays
    pending, rather than receiving some of the records.
14. **A starting-claim retry cannot recover the token** (the stored response omits it); starting again cancels the first.

15. **Cancellation lives in triggers, with two small hooks for what a trigger cannot see (M4).** A forgotten call in a
    function would leave a person receiving a reminder for something they can no longer see, so the cascades (record,
    person, account) and the state changes (date, completion, consent, membership) are covered where the data changes. The
    hooks cover explicit endings of access, which need `sanskara_can` to decide.
16. **Explicit ending deletes a subscription; a lapse suspends it.** See section 5.
17. **Insert-time validation is stricter than the first design said**: an allow-list of payload keys, a generic link, text
    that may not repeat a name, title or rite, a 48-hour horizon, and a check that the audience is the right one.
18. **The selector is SQL** (`sanskara_reminders_due`), so the producer is thin and cannot disagree with `sanskara_can`.
19. **A viewer can follow a Class B record; nobody but the owner or a manager can follow a Class A one**, as the contract
    says. A viewer's reminder is addressed to audience `viewer`.

## Appendix A. Schema

There is no remaining sketch: the DDL for M1 to M4 is in the migrations. M5 (the scheduled jobs) and M6 (retiring the old
tables) add no new tables.

## Addendum: live state and security review (2026-10-30)

Read-only checks against the live Supabase project (`mnbwodcswxoojndytngu`, 18 profiles). Nothing was changed.

**State.** `supabase_migrations.schema_migrations` lists M1 to M4 (`20261029160000` to `20261029160300`), applied outside
the process this design describes (no shadow branch, applier not recorded). All ten `sanskara_*` tables exist and are
empty (0 subjects, 0 records, 0 subscriptions); `sanskara_rites` holds only `custom`; no profile has opted in to
`wants_sanskara_reminders`. The legacy tables `user_sanskaras` and `user_sanskars` are empty; the old `sanskars`
catalogue still holds its 16 rows (archive before M6). No `notifications` row and no `notification_schedule` row has type
`sanskar_milestone`: reminders are inert. The old PWA producer, `POST /api/sanskar/schedule`, still exists and writes
`notification_schedule` rows of that type, so it must be disabled before any new producer is scheduled.

**Checked and acceptable.**
- Row-level security is enabled and forced on all ten tables; `anon` and `authenticated` hold no table grants.
- All 43 `sanskara_*` functions are `SECURITY DEFINER` and every one pins `search_path`. None is executable by `anon` or
  `PUBLIC`; 22 are executable by `authenticated` (the intended client surface: create, update, delete, grant, revoke,
  claim, timeline, export, reminders).
- All eleven Sanskara triggers are enabled, on the intended tables (`kul_members` membership end, `notification_candidates`
  validation, `profiles` opt-in guard and reminder guard, record and private-field rules, manager rules and orphan
  deletion, subscription change and removal). `guard_sanskara_opt_in_generation` is `SECURITY INVOKER`; the rest are definers.
- Supabase's security advisor reports no Sanskara-specific warning beyond (a) `rls_enabled_no_policy` (INFO) on the ten
  tables, which is the deliberate deny-all-then-functions design, and (b) the 22 client-executable definer functions in the
  next point.

**Open: the RPC boundary.** Any signed-in user can call the 22 client functions directly through PostgREST
(`/rest/v1/rpc/sanskara_*`) today, with no route, rate limit or telemetry in front of them. Plan agreed to start on
2026-10-30: build `/api/native/sanskara/*` first, then revoke `EXECUTE` from `authenticated` on the functions the routes
wrap, before any launch. Until then the surface is live but unused.

**Not Sanskara, noticed on the same scan (report only, not changed).** Six functions with a mutable `search_path`
(`bump_social_variant_content_version`, `rollup_social_post_status`, `count_distinct_native_telemetry_users`,
`handle_social_updated_at`, `protect_published_social_variant`, `safe_timezone`); `spatial_ref_sys` without RLS and
`st_estimatedextent` executable by `anon` (both PostGIS); four extensions in `public`; leaked-password protection off. Also
worth checking separately: `mark_panchang_viewed(p_user_id uuid, p_date date)` is client-executable and takes a user id as
a parameter; whether it verifies the id against `auth.uid()` was not examined.

**Plan order (agreed to start 2026-10-30).** Record state (this addendum); advisor and trigger checks (done above);
routes first, then revoke direct RPC; display-only Kul pointer set and returned only through the subject functions, with
the viewer's Kul membership re-checked on every read and a regression test for a manager who leaves the Kul;
deletion, export and leave/remove hooks (M4 already has the cancellation hooks on `kul_members` and subscriptions);
disable the old PWA Sanskara APIs; archive the 16-row catalogue and run M6; the Native API and screen; any new migration
only after shadow verification. Reminder production stays off until the old producer is disabled and the dispatcher
integration is finished.

## The Kul pointer (M4a, 2026-10-30)

Implements contract section 4 rule 2: a dependent may point at a Kul tree person **for display only**. Migration
`20261030100000_sanskara_kul_pointer.sql`, rollback `supabase/rollbacks/20261030100000_sanskara_kul_pointer_rollback.sql`, test
`supabase/tests/sanskara_kul_pointer.test.sql`. **Applied to production on 2026-10-31** (version `20261030100000` recorded with its name, by `supabase db push --linked` at the founder's instruction). Read-only check afterwards: the column, the dependent-only check and `ON DELETE SET NULL` foreign key exist; `sanskara_create_dependent`, `sanskara_dependents` and `sanskara_set_kul_link` are executable by `authenticated` only; `sanskara_resolve_tree_person` and `sanskara_viewer_kul` by `postgres` only; `anon` has nothing; RLS is on and no table grant reaches `anon` or `authenticated`; `sanskara_subjects` held 0 rows. The full chain M1 to M4a and all five SQL tests pass on a scratch Postgres 18 (re-run 2026-10-31). Generated types were patched to match; confirm with `supabase gen types`.

M2 left the column out; this adds it as a nullable column on dependents only, `ON DELETE SET NULL`, set only by
`sanskara_create_dependent(..., p_kul_family_member)` and `sanskara_set_kul_link`, and returned only by `sanskara_dependents()`
(a manager's view).

**Non-disclosure rules, each proved by the test:**
1. *No authority.* Only `create_dependent`, `dependents` and `set_kul_link` read or write the stored column (the helper
   `resolve_tree_person` reads only the tree table); asserted by scanning every function body for both the table and the column
   name. Corrected 2026-10-31: the first version of this test scanned for the bare text `kul_family_member`, which also matches
   unrelated Kul functions on the real schema (`leave_kul` and others) and so passed only on the stand-in database; checked
   on the live schema that the corrected scan returns exactly those three. `sanskara_can` and the grant, claim and list
   functions are independent of it.
2. *No tree-to-subject lookup.* No client function takes a tree person and returns subject data, and clients hold no table
   grant on `sanskara_subjects`, so a Kul member viewing the tree cannot tell whether anyone has linked a person.
3. *No uniqueness.* A unique index would tell a second manager "someone already tracks this person". Two dependents may point
   at one tree person; each stays private to its own managers.
4. *Identical refusals.* A missing, foreign-Kul, deceased or already-accounted tree person, a stranger's subject, a former
   manager and an account subject all return the same `SK404 sanskara_not_found`. A bad name is reported before a bad pointer.
5. *Valid for this viewer, now.* The pointer shows only while the tree person is in the Kul the viewer is in at that moment
   (`kul_members` and `profiles.kul_id` agreeing), alive, and without an account. A manager who leaves the Kul stops seeing it; a
   co-manager who stays keeps it; rejoining restores it (it was hidden, never lost); a tree person who changes underneath it is
   hidden, and deleting them clears the stored pointer without touching anyone's access.

**Checked:** the full chain M1 to M4a applies cleanly to a scratch Postgres 18 and the rollback restores the M2 behaviour (the M2
to M4 tests pass after it); all five Sanskara test files pass on the new head; seven deliberate breakages (dropping the Kul
check, returning the raw pointer, a different error code, a unique index, `sanskara_can` reading the pointer, a client-callable
helper, ignoring deceased and accounted people) are each caught by the test. The scratch database uses stand-ins for the Supabase
tables, built from production's column list on 2026-10-30; it is not a Supabase branch.
**Changed in passing:** the three-argument `sanskara_create_dependent` is dropped and replaced by a four-argument form with a
default (nothing calls it yet); one signature in the M2 test was updated to match. `sanskara_export_mine` does not export the pointer.
**Not checked:** a Supabase branch, concurrency, and any route or screen.
