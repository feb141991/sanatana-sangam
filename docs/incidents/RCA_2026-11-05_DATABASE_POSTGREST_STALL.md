# Incident Root Cause Analysis (RCA) & Learnings

**Incident Date:** 2026-11-05 23:30–23:59 IST (18:00–18:29 UTC)  
**Severity:** P1 (Production Database Unresponsive / PostgREST 503 Loop)  
**Impacted Services:** Supabase PostgreSQL (`mnbwodcswxoojndytngu`), PostgREST HTTP Gateway, GitHub Actions CI Runner, Background Workers (`claim_email_outbox`)  
**Resolution Time:** ~25 minutes  
**Current Status:** Resolved / 100% Operational  

---

## 1. Executive Summary

On the night of November 5, 2026, the Supabase production database experienced an incident where PostgREST repeatedly failed to load its internal database schema cache, throwing `57014 (canceling statement due to statement timeout)` and returning `503 Service Unavailable (PGRST002)` to all incoming API requests. The endless introspection retry storm saturated the database instance's CPU, causing incoming TCP handshakes to fail (`CONNECT_TIMEOUT after 5000ms`), and triggering Cloudflare `522` (Origin Timeout) and `521` (Web Server Down) errors across client apps, CI runs, and automated cron workers.

The incident was mitigated by restarting the database instance, setting appropriate statement timeouts (`60s`) for the PostgREST introspection roles, and hardening the client test harness with exponential backoff retries.

---

## 2. Timeline of Events

| Time (IST) | Event |
|---|---|
| **23:25** | GitHub Actions CI run `42027431319` failed during `loadGoldenFixtures()` with Cloudflare `Error 522: Connection between Cloudflare and origin timed out`. |
| **23:38** | Supabase Database Health Linter flagged: `Title: Database not usable` / `Connection failed at the TCP layer (CONNECT_TIMEOUT) after 5000ms`. |
| **23:45** | Periodic Vercel cron `/api/cron/email-outbox` invoked `POST /rpc/claim_email_outbox` and was rejected with `HTTP 503 (PGRST002: Could not query database for schema cache)`. |
| **23:47** | Founder initiated project restart from Supabase Dashboard. Cloudflare entered `521 (Origin Down)` state while containers recycled. |
| **23:56** | Server logs showed: `Failed to load schema cache ... statement timeout (57014)`. PostgREST repeatedly timed out attempting to introspect the large database catalog. |
| **00:04** | Postgres finished rebooting, schema cache loaded, and PostgREST endpoints returned `HTTP 200 OK` (tested via `profiles` and `golden_fixtures` queries). |
| **00:05** | `harness.test.ts` (1,225 test cases) executed smoothly without connection errors. |

---

## 3. Technical Root Cause Analysis (The 5 Whys)

1. **Why were mobile users, background cron jobs, and CI tests getting 503 and timeout errors?**  
   PostgREST was returning `PGRST002: Could not query database for schema cache` and refusing to route queries.

2. **Why couldn't PostgREST load its schema cache?**  
   When PostgREST connected as `authenticator` to inspect `public`, `graphql_public`, and `extensions`, PostgreSQL forcibly aborted the query with `canceling statement due to statement timeout (SQLSTATE 57014)`.

3. **Why did the schema introspection query exceed the statement timeout?**  
   Shoonaya's database schema is exceptionally comprehensive: over 100+ tables, hundreds of views, RLS policies, custom types, and procedural functions (over 11,000 lines of generated schema definitions). On a shared micro/free-tier instance with constrained compute, querying the full system catalog (`pg_class`, `pg_proc`, `information_schema`) takes 10–12 seconds. The default `statement_timeout` was configured to a lower threshold (5–8s), killing the query before it could complete.

4. **Why did this take down TCP connections and trigger Cloudflare 522/521?**  
   Because the introspection query failed, PostgREST entered an unthrottled retry loop every few seconds. Each retry ran the heavy catalog scan, pegging the CPU at 100%. At the same time, automated workers (e.g. `/api/cron/email-outbox` every 5 minutes) continuously pounded the dead endpoint. With Postgres workers saturated, the operating system could not complete new TCP handshakes within 5,000ms.

5. **Why was this fragile in CI and operations?**  
   The application and test harness assumed instant Supabase availability on every request without circuit breakers or retry backoffs, while the underlying database infrastructure was operating on a burstable free-tier compute budget.

---

## 4. Cascading Failure Diagram

```
[Large Schema (100+ tables, RLS)] 
               │
               ▼
[PostgREST Starts Schema Introspection (~11s duration)]
               │
               ▼
[Postgres `statement_timeout` triggers at 8s (`57014`)]
               │
               ▼
[PostgREST Fails Schema Cache -> Returns 503 PGRST002]
               │
      ┌────────┴──────────────────────────┐
      ▼                                   ▼
[Infinite Retry Loop]         [Incoming Cron & Client Traffic]
      │                                   │
      └───────────────┬───────────────────┘
                      ▼
        [100% CPU Saturation & Lock Queue]
                      ▼
     [TCP Connection Starvation (>5000ms)]
                      ▼
[Supabase Health Linter: "Database not usable"]
                      ▼
       [Cloudflare Gateway 522/521 Errors]
```

---

## 5. Remediation Applied

1. **Database Role Timeout Configuration**:
   Configured explicit, resilient `statement_timeout` ceilings on the PostgREST and backend roles so catalog introspection has ample headroom to complete:
   ```sql
   ALTER ROLE authenticator SET statement_timeout = '60s';
   ALTER ROLE service_role SET statement_timeout = '60s';
   ALTER ROLE authenticated SET statement_timeout = '30s';
   ALTER ROLE anon SET statement_timeout = '30s';
   NOTIFY pgrst, 'reload schema';
   ```
2. **Container Reboot**:
   Recycled PostgreSQL and PostgREST containers via the Supabase Dashboard, clearing hung worker processes and lock contention.
3. **Client-Side Test Harness Hardening** (`packages/dharma-rules/harness/fixture-loader.ts`):
   Added `fetchWithRetry()` with exponential backoff (3 attempts, 2.5s base delay) to `loadGoldenFixtures()` and `loadCalendarProfileFixtureDefinitions()` so transient network or Cloudflare glitches do not fail CI runs.

---

## 6. Key Learnings & Preventative Actions

### 1. Free Tier Compute vs. Production Stability
* **Learning:** Supabase Free Tier runs on shared micro-instances (shared CPU, 1 GB RAM, 500 MB disk). While sufficient for initial prototyping, Shoonaya's 100+ tables, comprehensive RLS policies, and 40+ scheduled cron jobs exceed the safe headroom of a micro compute profile.
* **Action:** Upgrade to the **Supabase Pro Tier ($25/mo)** before public release. Pro eliminates instance pausing, provides dedicated compute/memory, raises connection limits via Supavisor, and enables automated point-in-time recovery (PITR).

### 2. PostgREST Schema Exposure Isolation
* **Learning:** PostgREST by default introspects all schemas configured in `db-schemas`. Introspecting unneeded internal schemas or extensions adds latency to every schema reload.
* **Action:** In **Supabase Dashboard > Settings > API**, ensure only `public` is exposed in `Exposed schemas`. Keep internal extension schemas (like `net`, `cron`, `vault`) isolated from PostgREST introspection.

### 3. Circuit Breaking on Background Workers
* **Learning:** When `/api/cron/email-outbox` received a 503, Vercel cron and client retries continued hammering the database, exacerbating the CPU spike.
* **Action:** Implement a short circuit-breaker in background workers: if the database responds with `PGRST002` or `503`, immediately back off and abort the batch for that cycle rather than retrying in a tight loop.

### 4. Connection Pooling Discipline
* **Learning:** Direct connections to port `5432` require IPv6 and bypass connection pooling. Serverless functions spinning up unpooled connections quickly exhaust Postgres `max_connections`.
* **Action:** Ensure all external serverless callers connect through the **Supavisor Transaction Pooler (Port 6543)**.
