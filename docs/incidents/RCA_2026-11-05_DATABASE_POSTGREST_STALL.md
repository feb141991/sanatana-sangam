# Incident Report: Supabase Database Stall, 2026-11-04 to 2026-11-05

**Status:** Service restored. **Root cause not established.** Treat a recurrence as likely until the Dashboard metrics below are read.
**Severity:** P1. API, scheduled jobs and CI were affected for most of a day.
**Corrected:** 2026-11-06. The first version of this report (`49ed4d3`) blamed schema size and a retry loop, and said role timeouts had been raised. The database contradicts all three; see section 5.

All times are IST. Evidence is from `cron.job_run_details`, `pg_stat_statements`, `pg_roles`, and the Supabase Postgres, PostgREST and edge logs.

## 1. Summary

The database instance stalled repeatedly over about 22 hours. While it was stalled, even trivial statements took more than 8 seconds and were cancelled. PostgREST could not load its schema cache, so it returned `503 PGRST002`. Scheduled jobs failed with `job startup timeout`, and for long periods the gateway returned Cloudflare `522`.

The failed schema loads were one symptom of the stall, not its cause. Why the instance stalled is unknown.

## 2. Timeline

| Time (IST) | What the records show |
|---|---|
| 5 Nov 01:52 | First `job startup timeout` in the 24-hour window checked. |
| About 04:30 to 09:55 | No scheduled job succeeded, with `522` responses in the logs. Recovered with no restart: the Postgres process had been up since 6 Oct. |
| 13:34 to 16:06 | Intermittent statement timeouts. Includes a 30-second `PGRST002` burst at 14:22, with 208 `503` responses in that UTC hour. |
| About 17:00 to 23:30 | Mostly down. Nearly all edge requests got `522`, and there are no Postgres logs from about 18:30 to 23:30. |
| 23:48 | Postgres restarted from the Dashboard. |
| 23:49 to 23:58 | Statement timeouts and failed schema loads continued for about 10 minutes after the restart. |
| 23:57 and 23:58 | Schema cache loaded in 528.5 ms and 776.0 ms. Last statement timeout in this episode at 23:58. |
| 6 Nov 12:45 | Since the restart: 295 scheduled jobs succeeded, 0 failed. |

The start time is limited by the data checked, so the stall may have begun earlier.

## 3. What is established

- **The whole instance was stalled.** Statements cancelled at the 8-second limit include `SET client_encoding = 'UTF8'` and PostgREST's `set_config` call, which normally take almost no time.
- **Schema size was not the cause.** The cache loads in under a second, with the same 8-second limit, on 208 relations, 197 relationships and 455 functions.
- **Connections were not exhausted.** The logs show no connection-limit errors.
- **It recovered once without a restart,** which points away from a fault that needs a restart to clear.
- **It has been building.** Failed scheduled jobs per day: 29 Oct 24, 30 Oct 29, 31 Oct 30, 1 Nov 7, 2 Nov 14, 3 Nov 50, 4 Nov 72, 5 Nov 75. Earlier history has been purged. A shorter stall on 30 Oct is the same pattern.
- **Load was small.** Outside the 14:22 burst, the gateway saw roughly 100 to 360 requests an hour. The database is 83 MB.

## 4. What is not established

- **The cause.** Exhausted disk IO budget, memory pressure or swapping, CPU limits on shared compute, and a problem on Supabase's side all remain possible. The organisation is on the Free plan, which Supabase documents as Nano compute (shared CPU, up to 0.5 GB, 250 IOPS baseline), so resource limits are plausible but unproven.
- **CPU, memory and disk IO during the windows above.** These are only in the Dashboard and have not been read.

**Next step:** open Supabase Dashboard > Reports > Database and read CPU, memory, swap and disk IO for the times in section 2. Send those windows to Supabase support as well.

## 5. Corrections to the first report

| First report said | Correct position |
|---|---|
| Incident lasted about 25 minutes | Repeated stalls over about 22 hours. |
| Schema introspection takes 10 to 12 s and timed out because of schema size | It takes under 1 s. It timed out because the instance was stalled. |
| "Hundreds of views" | 14 views in `public`, with 194 tables. |
| Role timeouts were set to 60 s and 30 s | Never in effect. Checked 6 Nov 12:45: `anon` 3 s, `authenticated` 8 s, `authenticator` 8 s, `service_role` none. |
| Raising the timeout resolved it | Service recovered with the 8-second limit unchanged. |
| Unthrottled retry loop at 100% CPU | Failed loads were 1 to 2.5 minutes apart. CPU was not measured. |
| TCP starvation from saturated workers | Not shown. No connection-limit errors. |
| `email-outbox` kept hammering the database | It makes one claim call every 5 minutes and stops on error. |
| Pro gives dedicated compute | Pro's base Micro is still shared CPU, with 1 GB and 500 IOPS baseline. |

## 6. Actions

**Do not apply the `ALTER ROLE` statements from the first report.** They would not address the stall, and raising `anon` from 3 s to 30 s lets anonymous requests hold database connections ten times longer.

| Action | Status |
|---|---|
| Read Dashboard metrics and contact Supabase support | **Open.** This is what can establish the cause. |
| Decide on Pro or a larger instance from those metrics | **Open.** May well help; nothing yet proves it would be enough. |
| Outage alerting | `8a69b7c` added Slack alerts. Not verified end to end. An alert from outside Supabase and Vercel is still worth adding. |
| CI retries on fixture reads | Done, with 2 attempts and increasing delay. |
| CI must not pass on saved fixtures during an outage | Done in `f55faf3`. |
| Limit exposed schemas | Nothing to do. Only `public` and `graphql_public` are exposed. |
| Use the transaction pooler for serverless callers | Does not apply to the app, which reaches the database through the HTTP API. Only tools in `scripts/` connect directly. |

## 7. Learnings

1. Name a cause only when a measurement supports it. A failed schema load during a stall does not show that the schema is the problem.
2. Check a remediation against the live system before recording it as applied.
3. Scope an incident from the job and gateway records, not from when someone noticed. The first report covered about 40 minutes of a 22-hour event.
4. A build fix must run the build. The retry helper added in `f4c23ac` passed its tests but failed type checking, which blocked production deploys until `faa3969`.
