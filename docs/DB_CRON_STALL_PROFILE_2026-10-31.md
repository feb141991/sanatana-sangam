# Database stalls and cron failures: profile of 2026-10-31

Read-only investigation of the live Supabase project (`mnbwodcswxoojndytngu`, Postgres 17, 18 profiles). Nothing was changed.
Every figure below came from the queries listed at the end and can be reproduced.

## Summary

The database is tiny (largest table 22 MB; most under 6 MB) and **bloat is not the problem**. The real problem is a nightly
**I/O stall** that makes scheduled jobs fail with `job startup timeout`. The evidence points at disk throughput, not slow SQL.
Confirming it needs one thing only the Supabase dashboard can show: the **disk I/O budget and compute size** (see "What I could
not see").

| Finding | Evidence | Confidence |
|---|---|---|
| A nightly stall at about 03:00 to 04:30 UTC fails up to 17 scheduled runs an hour | 10 stall hours in 7 days; every stall failure is `job startup timeout` (the only other failures are the three `nightly-personalise` config errors below) | High |
| It is a storage stall, not slow queries | At 03:00:46 UTC a checkpoint wrote **38 buffers (0.1%) but took 53.6 s (write = 45.7 s)**. At 02:50 and 02:55 the same checkpoint wrote 5 buffers in about 0.5 s. Statements start being cancelled by the statement timeout within a minute | High that I/O stalls; medium that it is budget depletion |
| Four unrelated jobs finish within 3 seconds of each other after about 12 minutes | Runs that started at 04:00:09 ended 04:12:49 to 04:12:52 | High: one blocker released, not four slow jobs |
| `nightly-personalise` can never succeed as written | Its command reads `app.supabase_url` and `app.service_role_key` settings that are not set. 3 runs failed with `unrecognized configuration parameter "app.supabase_url"` (10-25 to 10-27); all 7 runs in 7 days failed. The edge function `ai-personalise` is active | High |
| pg_net's own cleanup is 51.7% of all database time | `DELETE FROM net._http_response ...`: 17,084 calls, 21,069 s total, mean 1.2 s, worst 1,876 s | High; it is a victim of the stall as much as a cause |
| `pg_timezone_names` scans on a user path | `complete_japa_session`, `get_japa_context` and `notification_cadence_safe_timezone` run `exists (select 1 from pg_timezone_names where name = ...)`; 495 calls, mean 1.07 s, max 7.1 s, 1.3% of database time | High |

## What is not the problem: bloat

Largest relations: `net._http_response` 22 MB, `cron.job_run_details` 12 MB, `spatial_ref_sys` 7 MB (PostGIS reference data),
`observance_occurrences` 5.5 MB, `scripture_chunks` 5.2 MB, `monitoring_events` 4.6 MB. Everything else is under 2 MB. Dead tuples are
negligible (largest: 299 on `notification_deliveries`). The only real bloat is `net._http_response`: 22 MB for about 100 live rows. It
costs disk, not time, and a `VACUUM FULL` (a one-off, exclusive lock, cannot run in a migration) or a lower `pg_net.ttl` would shrink it.
`cron.job_run_details` is 3,689 rows after the one-off backlog delete; the daily purge job meant to keep it small has itself been failing
with `job startup timeout` (its only run in the window, 10-31 03:15, failed after 952 s), so retention is not yet effective.

## The nightly stall

Slow (over 60 s) cron runs, all of which failed, by hour (UTC): 10-28 03:00 (3), 04:00 (4); 10-29 03:00 (12), 04:00 (7); 10-30 01:00 (5),
02:00 (7), 03:00 (12, worst 3,320 s), 04:00 (1); 10-31 03:00 (17), 04:00 (8). The same window is crowded on the application side
(`vercel.json`, UTC): 02:00 `materialize-occurrences`; 03:00 `brahma-muhurta`, `observance-series-candidates`, `pitru-paksha-reminder`;
03:05 `learning-engagement-candidates`; 03:30 `mood-reminder`; 04:00 `nitya-reminder`; 04:30 `vrat-reminder`. Alongside them, eight
pg_cron purge jobs run 03:15 to 03:55, and `nightly-personalise` at 04:00. Nothing here is heavy individually; together they land in the
minutes when storage is slow.

Pg_cron's own bookkeeping shows the same stall: `insert into cron.job_run_details` averages 147 ms with a 226 s worst case, and its
status `update` averages 199 ms with a 232 s worst case. Those are single-row writes on a 3,689-row table.

`cron.max_running_jobs` is 32 and `max_connections` is 60 with 17 sessions in use, so job slots and connections were not exhausted.
No lock waits or idle-in-transaction sessions were present when I looked, but that was outside the stall window, so it does not rule a lock out. The cleaner evidence against a lock is the checkpoint: it needs no lock and still took 53 s.

## Other findings

- **Realtime** appears to account for 8.6% of database time (360,854 calls of a `wal->>type ...` poll, which is the shape of Supabase Realtime's change polling). Only two tables are published
  (`notifications`, `thread_messages`), so this is the cost of active subscriptions, not a publication problem.
- **`nightly-personalise`** posts to `ai-personalise` once per user active in 30 days, from a single `SELECT`. Fixing it resumes AI
  calls that have not run for at least a week, so it is a spending decision, not just a bug fix. The working job (`daily-kul-nudge`)
  uses a literal project URL and the vault secret `service_role_key`; the broken one should follow that pattern.
- **`purge-net-http-response-daily`** is redundant with pg_net's own cleanup (`pg_net.ttl` = 6 hours). The migration that removes it
  (`20261031090000`) is prepared and not applied.

## What I could not see

The Supabase compute size and the **disk I/O budget** are not exposed to the tools used here. A storage stall of this shape on a small
instance is the typical symptom of an exhausted I/O budget, but that is an inference. **Check Reports > Database > Disk I/O in the
Supabase dashboard** for the 03:00 to 04:30 UTC window on 10-28 to 10-31, and the compute size.

## Options, in the order I would take them

1. **Check the dashboard** (above). If the I/O budget is depleted at 03:00, the fix is capacity (a larger compute size or more disk
   throughput), which is a paid decision.
2. **Spread the 02:00 to 04:30 UTC load.** Move the eight pg_cron purge jobs to a quiet hour, and stagger the application crons that
   share 03:00. This is cheap and reversible, and lowers the peak whatever the cause.
3. **Decide about `nightly-personalise`**: retire it, or rewrite it like `daily-kul-nudge`.
4. **Replace the timezone scans** in the Japa functions with `public.safe_timezone()`. These are the atomic Japa completion functions,
   so this needs their existing tests run against a branch first.
5. Apply `20261031090000` (remove the redundant purge) and consider a one-off `VACUUM FULL net._http_response` in a quiet minute.

## Reproducing this

Size and dead tuples: `pg_stat_all_tables` joined to `pg_total_relation_size`. Job failures and durations:
`cron.job_run_details` joined to `cron.job`, grouped by job and by hour. Statement cost: `pg_stat_statements` ordered by
`total_exec_time`. Checkpoint and cancellation evidence: the project's `postgres_logs`, 2026-10-31 02:50 to 04:20 UTC, messages
containing `checkpoint`, `timeout` or `canceling`.
