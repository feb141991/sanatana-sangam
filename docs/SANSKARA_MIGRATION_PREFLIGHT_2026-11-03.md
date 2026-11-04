# Root-cause risk assessment (ROC pre-flight): three unapplied Sanskara migrations (2026-11-03)

Per AGENTS.md section 4. **Nothing here has been applied. This is the request for approval, not the approval.** Production project
`mnbwodcswxoojndytngu`. Never `supabase db push`: apply each file on its own, in this order, and record each.

| # | Version | File | Commit | What it is |
|---|---|---|---|---|
| 1 | `20261103090000` | `sanskara_lifecycle_voids_grants` | `6424887` | A share is voided when the Kul membership it rested on ends |
| 2 | `20261103100000` | `sanskara_scheduled_jobs` | `bc697a1` | Majority sweep, consent purge, retention; three daily pg_cron entries |
| 3 | `20261103110000` | `sanskara_handover_notices` | `9d28232` | Hand-over notices: selector, validator, cancellation triggers |

## Live state read on 2026-11-03 (read-only queries)
- None of the three is applied. Latest applied November migration: `20261102160000`. `verify:migrations:linked` reports exactly these three as local-only
  and nothing remote-only; `test:migration-drift` passes (3/3). No other drift.
- Every Sanskara table is empty: 0 dependents, 0 account subjects, 0 records, 0 subscriptions, 0 suspended, 0 audit rows, 0 request-log rows; 0 `sanskar_milestone` candidates.
- Profiles: 26. `wants_sanskara_reminders`: true 0, false 26, NULL 0. No Sanskara cron job exists yet.

## The five checks
1. **Function overload trap (`PGRST203`): pass.** 1 and 3 create only new function names. 1 redefines `sanskara_kul_membership_end()` with the **same signature
   (no arguments)**, so no overload can form. 2 creates three new functions. No existing function has an argument type, name, default or order changed, so no `DROP FUNCTION` is needed.
   3 drops and recreates one **trigger** (`sanskara_validate_candidate`), with a narrower `WHEN`; its function is untouched.
2. **Caller contract and installed clients: pass.** No installed Native build calls any object these migrations add or change (searched `lib/`, `app/`, `components/` in the Native repo; the
   only backend callers are the new cron route and its tests, and the generated types). The Native hand-over banner (`c326805`) reads no new object. Old app builds keep working unchanged.
   The only behaviour change visible to anyone is in 1: a share ends when its Kul membership ends instead of lying dormant.
3. **User data and opt-out safety: pass.** No migration updates a row or changes a column default. Opt-in counts above: nothing is overwritten because nothing is written. 2 *can* delete
   data once it runs (see "What happens at first run"), but only rows that satisfy the retention rules, and there are none today.
4. **Lock contention: low risk.** No `ADD COLUMN`, no index build, no table rewrite. `CREATE TRIGGER` takes a short `SHARE ROW EXCLUSIVE` lock on `profiles` (26 rows) and
   `sanskara_claims`/`sanskara_subject_managers` (empty); migration 3's `DROP TRIGGER`/`CREATE TRIGGER` on `notification_candidates` takes a brief exclusive lock inside one transaction.
   Producers insert into that table from crons, so **apply 3 away from the minute a cron fires** (the Sanskara cron runs at :17 once enabled; others are daily). Expected wait: milliseconds.
5. **Rollback and reversibility: pass, with one honest limit.** A rollback file exists for each (`supabase/rollbacks/<version>_*_rollback.sql`). Re-tested on scratch Postgres this session:
   3 (rollback then re-apply, all suites green) and 2 (earlier this session). 1's rollback exists and its suite passes; I did not re-run its rollback in this session. **Limit:** rows a job
   or the void hook has already deleted or revoked cannot be restored; that is their purpose.

## What happens at first run (migration 2 schedules jobs at apply time)
`sanskara-majority-sweep-daily` 03:41 UTC, `sanskara-consent-purge-daily` 03:43, `sanskara-retention-daily` 03:47. With the tables empty every job returns zero. **Before the
first dated run**, dry-run each (read-only):
```sql
select public.sanskara_job_majority_sweep(now(), true);
select public.sanskara_job_consent_purge(now(), true);
select public.sanskara_job_retention(now(), true);
```
Expect all counts 0 today. Once real data exists, any non-zero dry-run count is read before the job is allowed to delete.

## Environments
| Environment | 1 | 2 | 3 |
|---|---|---|---|
| Production (`mnbwodcswxoojndytngu`) | **not applied** | **not applied** | **not applied** |
| Scratch Postgres (this machine, stubs for `auth`/`cron`) | applied, suite green | applied, suite green | applied, suite green |
| Real Supabase branch / shadow | **not run** | **not run** | **not run** |

The scratch database stubs Supabase's `auth` and `cron`; it is not a Supabase branch. None of these touches calendar data, so section 2's branch rule does not strictly bind, but a branch
run is still the better proof and has not been done.

## Ship order with the application code
- Migrations 1 and 2 can go any time. Migration 3 and the producer/dispatcher code may ship in **either order** (a missing `sanskara_handover_due` skips only that phase).
- The dispatcher gate (`44ee99e`) must be deployed **before** the producer flag is turned on. Flags stay off until then.
- Nothing is user-visible until you set `NOTIFICATION_RESOLVER_ENABLED=true` and `NOTIFICATION_CANDIDATE_MODE_SANSKAR_MILESTONE=candidate`, and a person opts in to `wants_sanskara_reminders` (0 of 26 have).

## Apply and record (founder, one at a time)
For each file in order: run it through the SQL editor or `psql`, then
```bash
supabase migration repair --status applied <version>
npm run verify:migrations:linked   # after the third, expect no drift
```
Then update the migration status here and in `SANSKARA_TRACKER_BACKEND_DESIGN.md`.

---

## Addendum 2026-11-04: a fourth migration, `20261104100000_sanskara_early_handover` (early hand-over; OFF by default)
- **Not applied anywhere.** Apply last, after the three above. File, rollback and test: `supabase/migrations/`, `supabase/rollbacks/`, `supabase/tests/sanskara_early_handover.test.sql`.
- **1 `PGRST203`: pass.** Only new function names; no existing function touched. **2 Callers: pass.** Nothing calls these yet, in Native or the backend; generated types updated.
  **3 User data: pass.** No row updated, no default changed, no opt-out touched. Creates tables only; with no settings row the feature does nothing.
- **4 Locks: low.** One `ALTER TABLE ... ADD CONSTRAINT` on `sanskara_audit` (0 rows on 2026-11-03; brief `ACCESS EXCLUSIVE` plus a scan of an empty table) and one trigger on `sanskara_subject_managers` (0 rows).
- **5 Rollback: pass.** Tested (removes all objects, restores the 15 audit values, deletes the five new audit values first); re-apply passes.
- **A near miss to read:** restating `sanskara_audit_action_check` replaces it. Production's current list (read 2026-11-04) includes `kul_link_set` and `kul_link_cleared`; the first draft left them out
  and the existing pointer suite failed. Fixed, and the new test inserts all 20 values. **Any later migration that restates this constraint must start from production's list, not from a file.**
- The same reminder about the live database as before: Sanskara tables are empty and 0 of 26 profiles are opted in, so nothing here can affect a user until the founder sets the age floor.

