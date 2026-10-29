# Sanskara tracker backend design (step 3) — pre-migration

Status: **v0.2. M1 and M2 are written, with rollbacks and tests, and verified on a scratch Postgres; they are NOT applied
to any database. M3 to M6, the routes, the producer and the screens are not written.** Implements the approved contract
(`SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md`, v0.2: decisions D1 to D5 approved as recommended on 2026-10-29). Written
and updated 2026-10-29.

This document turns the contract into tables, one authorization function, a function surface, a reminder lifecycle on
the existing notification pipeline, scheduled jobs, a migration sequence and a retirement plan for the old
implementation. For M1 and M2 the migrations are the source of truth for the DDL; section 11 lists every place they
differ from the first version of this design, and why. Appendix A keeps the remaining sketches (subscriptions, claims and
the pending-reminder index) for M3 and M4.

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
| `sanskara_subscriptions` (M4), `sanskara_claims` (M3) | Reminders; the hand-over at 18 | Still sketches: Appendix A. |

Every M2 table has row-level security **enabled and forced**, no policies, and no grants to `anon`, `authenticated` or
`PUBLIC` (the pattern of `kul_family_link_invitations`). Forced RLS is safe for the definer functions because Supabase's
`postgres` role is not a superuser but has `BYPASSRLS`, and 20+ existing tables already force RLS (checked against
production, read-only, 2026-10-29). Clients reach data only through the functions in section 4.

One change to an existing table, an index in M4: at most one **pending** reminder per (subscription, lead time), on
`notification_candidates` (section 5).

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
| manager | the owner's, plus `manage_managers` and `start_claim` |
| former manager | `read_meta`, `read_record`, `read_private`, `export` |
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
| `sanskara_shared_with_me()` | M3 | Projection for a viewer: Class B fields, or name and status for a Class A record, with who shared it. |
| `sanskara_grant_view(subject, record or null, grantee)` / `sanskara_revoke_grant(grant)` / `sanskara_list_access(subject)` | M3 | Records `kul_id`; revoke cancels the grantee's reminders in the same transaction (M4). |
| `sanskara_start_claim(subject)` / `sanskara_accept_claim(token)` | M3 | Hand-over at 18. Accepting moves records to the claimant's account subject; **a record the claimant already has wins every conflict**; nothing merges silently. |
| `sanskara_set_reminder(record, lead_days, enabled)` | M4 | Creates or updates the caller's subscription; bumps `generation`; refuses unless `wants_sanskara_reminders` and consent are true. |

Internal helpers (definer functions only): `sanskara_actor`, `sanskara_claim_request`, `sanskara_finish_request`,
`sanskara_records_json_unchecked` (its name is a warning: the caller must already have called `sanskara_can`).

Route handlers under `/api/native/sanskara/*` are thin: Bearer and cookie auth through `getApiUser`, rate limits, input
shape, then the function. Errors are mapped to short codes; Native shows its own sentences (no database text).

## 5. Reminders on the existing pipeline

The pipeline is candidate producer, then `notification_candidates`, then the resolver, then `notification_schedule`,
then the dispatcher. Sanskara reminders use it as-is, with `event_type = 'sanskar_milestone'`. That type is already in
the resolver's *explicit user requested* class, which is right for an opt-in subscription, and the class comes from the
server-owned event type, so producer metadata cannot widen it.

**Producer** (`sanskara-candidate-producer.ts` plus a cron route, on the cadence of the other producers): for each
enabled subscription whose reminder moment falls inside a rolling horizon of the next 36 hours, it re-checks
`sanskara_can('receive_reminder')`, the subscriber's opt-in flag and consent, and writes one candidate:

- `event_id` = the subscription id, `event_instance` = `L<lead_days>`, `audience_variant` = `self` or `manager`.
- Reminder moment = planned date minus the lead time, at 09:00 in the **recipient's** timezone, outside their quiet hours.
- `title` and `body` are generic and localised (en, hi, pa; hi and pa need native review): no rite, name, date,
  relationship or pregnancy wording. `action_url` is the tracker route with no ids; the screen re-authorizes on open.
- `metadata` carries only `subscription_id`, `subscription_generation` and `record_version`.

The rolling horizon means almost nothing is scheduled far ahead, so most edits have nothing to cancel; the cancellation
below handles the rest.

**At most one live reminder per (subscription, lead time)** is enforced by a partial unique index on pending
candidates (Appendix A; tested: a second pending one fails, a new one is allowed once the old is cancelled, and an
earlier *accepted* one does not block a later occurrence). A changed date therefore runs *cancel old, insert new* in one
transaction, holding a row lock on the subscription.

**Cancellation** is one internal function, `sanskara_cancel_reminders(scope)`, that sets matching pending candidates and
pending schedule rows (found by `subscription_id` in the metadata the pipeline copies onto the schedule row, with a
`candidate_id` link) to `cancelled`. It is called from the same transaction as each of these events:

| Event (contract) | Called from |
|---|---|
| E1 revoke, E14 grantee deleted | `sanskara_revoke_grant`; the cascade removes subscriptions |
| E2, E3 Kul leave or removal | The existing leave and remove functions call a hook; the send-time check is the backstop |
| E4 completion, E5 edit, delete | `sanskara_set_completion`, `sanskara_save_record`, `sanskara_delete_record` |
| E6 manager removed | `sanskara_remove_manager` |
| E7 majority | The daily job (section 6) |
| E8 consent withdrawn | A trigger on `profiles.consent_religious_data` and `wants_sanskara_reminders` |
| E9, E10 account deletion | `ON DELETE CASCADE`; candidates and schedule rows already cascade from `auth.users` |

**Send-time check** (the backstop for any path above that is missed): the dispatcher, before sending a
`sanskar_milestone` row, calls `sanskara_reminder_still_valid(subscription_id, generation, record_version)`, which
confirms the subscription is enabled with the same generation, the record still exists, is not completed and has the
same version, `sanskara_can('receive_reminder')` still holds, and the opt-in flag and consent are still true. Any doubt
skips the row. Skipped rows use the dispatcher's existing skip reasons and audit trail.

**Dispatcher and policy changes** (small, in files another session currently has uncommitted edits in; they must wait
for that work to land and follow its per-feature preference map rather than add a parallel mechanism):
- gate `sanskar_milestone` on `wants_sanskara_reminders` instead of `wants_family_notifications`, with the same
  missing-column fallback the other new flags use;
- stop sending `sanskara_id` and `kul_member_id` in the push data, and send a neutral `type`, so the payload carries only
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
| M1 *(written, tested, not applied)* | The two `profiles` columns and the server-owned counter |
| M2 *(written, tested, not applied)* | `sanskara_rites`, subjects, managers, records, private fields, grants (table only), request log, audit; `sanskara_can`; the read and write functions for owners and managers |
| M3 | Grant, revoke and list-access functions, the shared-with-me projection, claims and their functions |
| M4 | Subscriptions, the candidate index, `sanskara_cancel_reminders`, `sanskara_reminder_still_valid`, the account-delete additions |
| M5 | The scheduled jobs |
| M6 | Retirement of the old tables (empty-assertion first) |

## 9. What has and has not been verified

**Verified (scratch Postgres 18, 2026-10-29, running as a non-superuser `BYPASSRLS` owner and exercising clients with
`SET ROLE authenticated` plus the JWT subject claim, so privileges, forced RLS and the SK error codes are all in play):**
M1 and M2 apply cleanly; their rollbacks leave nothing behind and the migrations then re-apply and pass. The M1 test has 20 assertions. The M2 test has 117 checks that a statement is refused with an exact error code, 64 permission matrices that each assert all 13 actions for one person on one subject or record (832 allow-or-deny decisions: every role, the 12-month window, the audience boundary, the granter rule, consent, the deletion cool-off), and 107 value assertions (structure and privileges of 8 tables and 22 functions, idempotency, versions, limits, validation, erasure, and account-deletion cascades). **43 of 43 mutations of the migration are caught** by the M2 suite, and 3 of 3 of M1's (each breaks one rule: a missing
audience check, a missing granter check, timeline covering Class A, consent, the 12-month window, the version checks, the
last-manager rule, retry handling, privileges, forced RLS, and others).

The earlier run of this design (47 constraint checks) executed as a superuser, which bypasses RLS and every privilege,
so it could not have shown a privilege mistake. It is superseded by the run above.

Checked read-only against production: the `postgres` role has `BYPASSRLS`; default privileges grant new objects to
`anon`, `authenticated` and `service_role` (so the explicit revokes are what matter); no `sanskara_*` name exists; the
real `auth.uid()` reads the same claim as the test stub; no existing trigger on `profiles` conflicts with M1's.
Postgres does not write bound parameters (a child's name, private notes) to its error log today:
`log_parameter_max_length_on_error` is 0, `log_statement` is `ddl`, duration logging is off.

**Not verified:**
- Anything on a real Supabase database. The migrations have not been applied to a Supabase branch (a branch is paid
  infrastructure and needs the founder's approval) or to production.
- Behaviour under truly concurrent requests (the design relies on a row lock and the request-log primary key; both are
  exercised sequentially only).
- M3 to M6, the reminder pipeline integration, the dispatcher and producer changes, the leave and remove hooks.
- Performance of `sanskara_can` at scale (each call runs a handful of indexed lookups; the list functions call it once
  per subject, not once per record).
- Any route, screen, device or production behaviour. `src/types/database.generated.ts` was extended by hand to match the
  migrations and must be regenerated after the shadow-branch apply.

## 10. Open questions

1. **Coordination.** The dispatcher and delivery-policy files have another session's uncommitted edits; the changes in
   section 5 wait for them.
2. **Lead-time set** (0, 1, 3, 7, 14, 30 days) and **09:00** default are proposals; the catalogue step may refine them.
3. **Claim token lifetime** (7 days is proposed, matching family link invitations) and how the token reaches the new
   adult.
4. **Hooks into Kul leave and removal.** Confirm whether to call `sanskara_cancel_reminders` from those functions or rely
   on the send-time check alone (the check is sufficient for correctness; the hook is for tidiness).
5. **Legal review** before launch (contract section 13).
6. **Who starts the hand-over at 18?** The contract makes a former manager read-only "and nothing else", but the claim
   exists for the moment the child turns 18. As written, `start_claim` is allowed only for a manager of a minor, so a
   claim must be started before the birthday. Proposal for M3: also allow a former manager to start a claim inside the
   12 months. Needs a decision before M3.
7. **`suspended_at`.** The column is created in M2 but nothing sets it yet. M4 (a trigger on consent withdrawal) sets and
   clears it; M5 purges 30 days after it. `sanskara_can` ignores it and reads consent live, so a missed trigger fails
   closed (data stays inert), never open.
8. **Log hygiene is a setting, not a test.** The no-parameters-in-error-logs result above holds only while those settings
   stay as they are, and no migration test can guard a project setting. Add it to the launch checklist and re-check
   before launch; also confirm that API and edge logs do not record request bodies for `/api/native/sanskara/*` routes
   (to be checked when the routes exist).
9. **Shadow branch.** M1 and M2 should be applied to a Supabase branch and both suites re-run there before production.
   That is a paid branch; it needs the founder's approval.

## 11. Decisions taken while writing M1 and M2 (for review)

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

## Appendix A. Remaining schema sketches (M3 and M4; applied and constraint-tested earlier on a scratch Postgres as a
superuser, so not privilege-tested; not migrations)

The M1 and M2 DDL now lives in the migrations. What follows is the part of the first sketch that has no migration yet.

```sql
-- M4: one account's reminder for one record at one lead time.
create table public.sanskara_subscriptions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.sanskara_records(id) on delete cascade,
  account_id uuid not null references auth.users(id) on delete cascade,
  lead_days integer not null check (lead_days in (0, 1, 3, 7, 14, 30)),
  enabled boolean not null default true,
  generation integer not null default 0 check (generation >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_id, account_id, lead_days)
);
create index sanskara_subscriptions_account on public.sanskara_subscriptions (account_id) where enabled;

-- M3: the hand-over at 18. A manager starts a claim; the new adult accepts with the token. Only the token's hash is stored.
create table public.sanskara_claims (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint sanskara_claims_window check (expires_at > created_at)
);
create unique index sanskara_claims_one_pending on public.sanskara_claims (subject_id) where status = 'pending';

-- M4: at most one live reminder per (subscription, lead time): a changed date supersedes the pending one atomically.
create unique index notification_candidates_one_pending_sanskar
  on public.notification_candidates (user_id, event_id, event_instance)
  where event_type = 'sanskar_milestone' and status = 'pending';

-- (Each new table gets the same lock-down as the M2 tables: row level security enabled and forced, no policies,
-- no grants to anon, authenticated or PUBLIC.)
```
