# Sanskara tracker backend design (step 3) — pre-migration

Status: **v0.1, design only. No migration, route or screen has been written or applied.** Implements the approved
contract (`SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md`, v0.2: decisions D1 to D5 approved as recommended on 2026-10-29).
Written 2026-10-29.

This document turns the contract into tables, one authorization function, a function surface, a reminder lifecycle on
the existing notification pipeline, scheduled jobs, a migration sequence and a retirement plan for the old
implementation. The schema in Appendix A was **applied and constraint-tested on a scratch Postgres** (47 checks,
including a deliberately broken copy that fails 3 of them); it is a sketch to review, not a migration.

## 1. The shape in one paragraph

Every person who uses the tracker has a **subject**: an *account subject* (themselves) or a *dependent subject* (a minor
they manage). A subject has **records** (one per rite, plus any number of custom milestones). Sensitive fields live in a
separate table. Access is decided by one function, `sanskara_can`, called by every read and write function and by the
reminder pipeline; clients never touch the tables. Sharing is a **grant** (view only) between members of one Kul.
Reminders are **subscriptions** that feed the existing candidate pipeline with a rolling horizon, so an edit or a
completion can cancel or replace what is pending in the same transaction.

## 2. Tables (full DDL in Appendix A)

| Table | Purpose | Constraints that carry the rules |
|---|---|---|
| `profiles` (+2 columns) | `wants_sanskara_reminders` (default **false**), `sanskara_opt_in_generation` | Separate from `wants_family_notifications` (D4). The generation counter invalidates in-flight reminders on every opt-in change, as family remembrance does. |
| `sanskara_subjects` | The person a timeline is about | Shape check: an account subject has an account and nothing else; a dependent has a name and a birth date and no account. One account subject per account. `tree_node_id` is display only and `on delete set null`, so the tree can never change access (E11). |
| `sanskara_subject_managers` | Who manages a dependent | Trigger deletes a dependent that loses its last manager (deletion over disclosure, E9/E10). The functions refuse to remove the last manager; the trigger catches the cascade from a deleted account. |
| `sanskara_records` | One record per rite per subject | `UNIQUE (subject_id, rite_key)` for catalogue rites, any number of `custom` ones. Replaces the old `UNIQUE (user_id, sanskara_id)`, which forbade the same rite for two people. `sensitivity` is set by the server from the catalogue, never the client. `version` for optimistic concurrency. |
| `sanskara_record_private` | Class A fields: notes, location, performer, expected due date | Separate table so no viewer projection can join it by accident. |
| `sanskara_grants` | View access between Kul members | `view` only; `record` or `timeline` scope; `kul_id` stored so the audience boundary can be re-checked at every read; one live grant per grantee per record or timeline; cannot grant to yourself. |
| `sanskara_subscriptions` | One account's reminder for one record at one lead time | Lead times limited to 0, 1, 3, 7, 14, 30 days (proposal); `generation` bumped on every change. |
| `sanskara_claims` | The hand-over at 18 | One pending claim per subject; only a SHA-256 of the token is stored; expiry after creation. |
| `sanskara_audit` | Metadata-only trail (contract section 7) | Closed set of actions; `detail` is a small object and never record content; rows about an account go with the account. |
| `sanskara_request_log` | Idempotency for every write function | Primary key `(account_id, request_id)`; pruned after 7 days. |

All nine tables have row-level security **enabled and forced**, no policies, and no grants to `anon`, `authenticated`
or `PUBLIC` (the pattern of `kul_family_link_invitations`). Clients reach data only through the functions in section 4.

One change to an existing table, an index: at most one **pending** reminder per (subscription, lead time), on
`notification_candidates` (section 5).

## 3. Authorization: `sanskara_can(action, subject, account, record)`

`SECURITY DEFINER`, `STABLE`, `set search_path = public`, `execute` revoked from `PUBLIC`, `anon` and `authenticated`.
Called from other definer functions and from the service role, never from a client. Returns a boolean; on **any**
error, missing row or disagreement it returns false (contract P7).

Evaluation, in this order:

1. **The acting account is active**: a profile exists and the account is not being deleted.
2. **The subject exists** and is not suspended for the purpose of the action (a suspended subject allows only `export`
   and `delete`, so a person who withdrew consent can still take their data or erase it).
3. **Role** from the subject kind:
   - *account subject*: owner if `subject.account_id = account`.
   - *dependent*: manager if the account is in `sanskara_subject_managers` and the UTC date is before the 18th birthday;
     former manager from the 18th birthday for 12 months; otherwise none. The boundary effect is at most one calendar
     day and is accepted.
4. **Viewer** if there is a live grant for this account (`revoked_at is null`) whose scope covers the record, **and**
   both the grantee and the person who granted it are *currently* in `kul_members` for the grant's `kul_id`, **and**
   `profiles.kul_id` agrees for both. `kul_members` is the membership of record: leaving or removal deletes that row and
   clears `profiles.kul_id` in the same function (checked in `20261026010000`), so any disagreement means something is
   wrong and the answer is deny. A `timeline` grant never covers a Class A record.
5. **Consent**: the owner's `consent_religious_data` must be true (for a dependent, at least one current manager's).
6. **The action** is allowed for the role by the contract's matrix (section 6 of the contract). The actions are
   `read_meta`, `read_record`, `read_private`, `write_record`, `delete_record`, `set_completion`, `manage_grants`,
   `manage_managers`, `start_claim`, `subscribe`, `receive_reminder`, `export`. Viewer: `read_meta` and `read_record`
   (Class B fields only), `subscribe`, `receive_reminder` (never for a Class A record). Former manager: `read_meta`,
   `read_record`, `read_private`, `export`.

Nothing in this function reads `kul_family_members`, `kul_members.role` or any tree relationship for authority.

## 4. Function surface

All are `SECURITY DEFINER`, derive the account from `auth.uid()`, take a `p_request_id uuid` where they write (checked
against `sanskara_request_log` in the same transaction, so a retry returns the first result), validate input with the
existing server date helpers, and call `sanskara_can` first. Execute is granted to `authenticated` only.

| Function | Effect |
|---|---|
| `sanskara_my_timeline()` | The caller's account subject (created on first use) and its records, with private fields. |
| `sanskara_dependents()` | Dependents the caller manages, with record summaries. |
| `sanskara_shared_with_me()` | Projection for a viewer: granted records, Class B fields only, with who shared them. |
| `sanskara_create_dependent(name, birth_date)` | Minor only (under 18 today, not in the future); caller becomes the first manager. |
| `sanskara_save_record(subject, rite_key, custom_title, planned_date, version)` | Create or update; sets `sensitivity` from the catalogue; a changed date supersedes pending reminders. |
| `sanskara_save_private(record, notes, location, performed_by, expected_due_date, version)` | Class A fields; due date only on a prenatal record of an account subject. |
| `sanskara_set_completion(record, completed_date or null)` | Complete or reopen; completion cancels every subscriber's pending reminders. |
| `sanskara_delete_record(record)` | Deletes the record and cancels its reminders. |
| `sanskara_add_manager(subject, account)` / `sanskara_remove_manager(subject, account)` | The target must share the caller's Kul; the last manager cannot be removed. |
| `sanskara_grant_view(subject, record or null, grantee)` / `sanskara_revoke_grant(grant)` | Records `kul_id`; revoke cancels the grantee's reminders in the same transaction. |
| `sanskara_list_access(subject)` | Who can see what (owner and managers only). |
| `sanskara_set_reminder(record, lead_days, enabled)` | Creates or updates the caller's subscription; bumps `generation`; refuses unless `wants_sanskara_reminders` and consent are true. |
| `sanskara_start_claim(subject)` / `sanskara_accept_claim(token)` | Hand-over at 18. Accepting moves records to the claimant's account subject; **a record the claimant already has wins every conflict**; nothing merges silently. |
| `sanskara_export_mine()` / `sanskara_delete_mine()` | Work even when the tracker is suspended for consent. |

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
| M1 | The two `profiles` columns |
| M2 | Subjects, managers, records, private fields, request log, audit; `sanskara_can`; the read and write functions |
| M3 | Grants, claims and their functions |
| M4 | Subscriptions, the candidate index, `sanskara_cancel_reminders`, `sanskara_reminder_still_valid`, the account-delete additions |
| M5 | The scheduled jobs |
| M6 | Retirement of the old tables (empty-assertion first) |

## 9. What has and has not been verified

Verified (scratch Postgres, 2026-10-29): the Appendix A schema applies on top of the real `notification_candidates`
migration; 47 constraint, cascade, privilege and reminder-index checks pass; the same checks fail 3 of 3 against a
copy with one rule removed; the helper counts a test as passing only on a genuine integrity-constraint error.

**Not verified:** `sanskara_can` and every function (not written); behaviour under concurrent requests; the dispatcher
and producer changes; the leave and remove hooks; performance; any device or production behaviour. The 36-hour horizon,
the lead-time set, the 09:00 default and the UTC majority boundary are proposals.

## 10. Open questions

1. **Coordination.** The dispatcher and delivery-policy files have another session's uncommitted edits; the changes in
   section 5 wait for them.
2. **Lead-time set** (0, 1, 3, 7, 14, 30 days) and **09:00** default are proposals; the catalogue step may refine them.
3. **Claim token lifetime** (7 days is proposed, matching family link invitations) and how the token reaches the new
   adult.
4. **Hooks into Kul leave and removal.** Confirm whether to call `sanskara_cancel_reminders` from those functions or rely
   on the send-time check alone (the check is sufficient for correctness; the hook is for tidiness).
5. **Legal review** before launch (contract section 13).

## Appendix A. Schema (applied and tested on a scratch Postgres; not a migration)

```sql
-- Sanskara tracker: schema sketch (design verification only; not a migration)

alter table public.profiles
  add column wants_sanskara_reminders boolean not null default false,
  add column sanskara_opt_in_generation integer not null default 0 check (sanskara_opt_in_generation >= 0);

create table public.sanskara_subjects (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('account', 'dependent')),
  account_id uuid references auth.users(id) on delete cascade,
  display_name text check (display_name is null or length(btrim(display_name)) between 1 and 40),
  birth_date date check (birth_date is null or birth_date >= date '2000-01-01'),
  tree_node_id uuid references public.kul_family_members(id) on delete set null,
  state text not null default 'active' check (state in ('active', 'frozen')),
  frozen_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sanskara_subjects_kind_shape check (
    (kind = 'account' and account_id is not null and display_name is null and birth_date is null and tree_node_id is null)
    or (kind = 'dependent' and account_id is null and display_name is not null and birth_date is not null)
  ),
  constraint sanskara_subjects_frozen_shape check ((state = 'frozen') = (frozen_at is not null))
);
create unique index sanskara_subjects_one_per_account on public.sanskara_subjects (account_id) where kind = 'account';

create table public.sanskara_subject_managers (
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  account_id uuid not null references auth.users(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (subject_id, account_id)
);
create index sanskara_subject_managers_account on public.sanskara_subject_managers (account_id);

-- A dependent with no manager left is deleted, never exposed (deletion over disclosure). The RPCs refuse to remove the
-- last manager; this catches the cascade from a deleted manager account.
create function public.sanskara_delete_orphan_dependent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.sanskara_subject_managers where subject_id = old.subject_id) then
    delete from public.sanskara_subjects where id = old.subject_id and kind = 'dependent';
  end if;
  return old;
end $$;
create trigger sanskara_orphan_dependent after delete on public.sanskara_subject_managers
  for each row execute function public.sanskara_delete_orphan_dependent();

create table public.sanskara_records (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  rite_key text not null check (rite_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  custom_title text check (custom_title is null or length(btrim(custom_title)) between 1 and 60),
  sensitivity text not null check (sensitivity in ('A', 'B')),
  planned_date date check (planned_date is null or planned_date between date '1900-01-01' and date '2200-01-01'),
  completed_date date check (completed_date is null or completed_date between date '1900-01-01' and date '2200-01-01'),
  version integer not null default 1 check (version >= 1),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sanskara_records_custom_shape check ((rite_key = 'custom') = (custom_title is not null))
);
create unique index sanskara_records_one_per_rite on public.sanskara_records (subject_id, rite_key) where rite_key <> 'custom';
create index sanskara_records_subject on public.sanskara_records (subject_id);

-- Class A fields live in their own table so no projection for a viewer can join them by accident.
create table public.sanskara_record_private (
  record_id uuid primary key references public.sanskara_records(id) on delete cascade,
  notes text check (notes is null or length(notes) <= 2000),
  location text check (location is null or length(location) <= 120),
  performed_by text check (performed_by is null or length(performed_by) <= 120),
  expected_due_date date check (expected_due_date is null or expected_due_date between date '1900-01-01' and date '2200-01-01'),
  updated_at timestamptz not null default now()
);

create table public.sanskara_grants (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  grantee_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid not null references auth.users(id) on delete cascade,
  kul_id uuid not null references public.kuls(id) on delete cascade,
  scope text not null check (scope in ('record', 'timeline')),
  record_id uuid references public.sanskara_records(id) on delete cascade,
  level text not null default 'view' check (level = 'view'),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  constraint sanskara_grants_scope_shape check ((scope = 'record') = (record_id is not null)),
  constraint sanskara_grants_not_self check (grantee_id <> granted_by)
);
create unique index sanskara_grants_live_record on public.sanskara_grants (grantee_id, record_id) where revoked_at is null and scope = 'record';
create unique index sanskara_grants_live_timeline on public.sanskara_grants (subject_id, grantee_id) where revoked_at is null and scope = 'timeline';
create index sanskara_grants_grantee on public.sanskara_grants (grantee_id) where revoked_at is null;

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

-- The hand-over at 18: a manager starts a claim; the new adult accepts with the token. Only the token's hash is stored.
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

create table public.sanskara_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete cascade,
  action text not null check (action in (
    'dependent_created', 'record_created', 'record_deleted', 'grant_created', 'grant_revoked', 'manager_added',
    'manager_removed', 'claim_started', 'claim_accepted', 'consent_suspended', 'purged')),
  subject_id uuid,
  target_id uuid references auth.users(id) on delete cascade,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object' and pg_column_size(detail) < 1024)
);
create index sanskara_audit_at on public.sanskara_audit (at);

create table public.sanskara_request_log (
  account_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  operation text not null,
  result_id uuid,
  created_at timestamptz not null default now(),
  primary key (account_id, request_id)
);

-- At most one live reminder per (subscription, lead time): a changed date supersedes the pending one atomically.
create unique index notification_candidates_one_pending_sanskar
  on public.notification_candidates (user_id, event_id, event_instance)
  where event_type = 'sanskar_milestone' and status = 'pending';

-- Service-role / SECURITY DEFINER only, like kul_family_link_invitations: forced RLS, no policies, no client grants.
do $$
declare t text;
begin
  foreach t in array array['sanskara_subjects', 'sanskara_subject_managers', 'sanskara_records', 'sanskara_record_private',
                           'sanskara_grants', 'sanskara_subscriptions', 'sanskara_claims', 'sanskara_audit', 'sanskara_request_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;
```
