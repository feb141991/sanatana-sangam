# Prompt 7 & 8: Time-Sensitive Ritual & Series Candidates & Admin Release Gate Report

**Date**: 2026-09-23  
**Repositories**:
- Backend / PWA: `Sanatan Sangam/Shoonaya`
- Native Mobile: `shoonaya-mobile` (Clean, untouched)  
**Database**: Supabase Linked Project `mnbwodcswxoojndytngu` (AWS pooler)  
**Status (reviewed 2026-09-23)**: Producer logic and admin monitoring are implemented locally. Only observance-series generation has a scheduled route, and it is gated off unless both global resolver and per-type candidate mode are enabled. Parana, Pradosha, and Sankranti have no scheduled producer integration. Migration history is **not synchronized** (duplicate local version and remote-only versions remain).

---

## 1. Executive Summary

This milestone delivers **Prompt 7 (Time-Sensitive Ritual & Series Candidates)** and **Prompt 8 (Admin Dashboard & Release Gate)** under strict adherence to Shoonaya's Two-Repository Contract Ownership, Spiritual Content Integrity, Calendar Governance, and Database Safety standards:

1. **Prompt 7 Candidate Producer Logic (not end-to-end delivery)**:
   - **Observance Series**: Multi-day series (Navratri, Deepavali) consuming verified `@sangam/dharma-rules` series definitions and editorial content, requiring published and reviewed child occurrences and authentic scripture citations.
   - A cron route now generates and persists observance-series candidates. It is explicit-opt-in only (`wants_festival_reminders === true`), reads profiles and reviewed occurrences in bounded pages, and is restricted to the default calendar profile because the existing series-completeness gate only validates that profile.
   - Parana, Pradosha, and Sankranti producer modules still have no scheduled call sites and do not generate production candidates.
   - Each producer now returns the database `notification_candidates` insert shape and requires explicit candidate mode; `legacy` does not emit candidates.
   - Parana requires Hari Vasara end and source references. Pradosha requires explicit reviewed twilight boundaries and source references; it no longer invents a 90-minute window. Sankranti requires explicit reviewed Punya Kala boundaries and source references; it no longer derives a generic 6.4-hour interval from transit time.
   - Series delivery time is converted from 07:00 in the user's IANA timezone to a UTC instant. It requires resolved, published, reviewed, verified, completed, non-fallback occurrences with source references.
   - Parana/Pradosha/Sankranti additionally require valid latitude and reviewed boundaries/source references, and reject latitudes above 60° absolute. These guards do not establish ritual correctness; an authoritative reviewed timing feed and scheduled producer integration are still required before enabling those types.
   - All four types default to `'disabled'` via `getCandidateTypePipelineMode()`.

2. **Prompt 8 Admin Monitoring & Release Gates**:
   - **Operational Stats Endpoint**: `/api/admin/notification-resolver-stats` returning live queue counts, retained candidate-state counts, 24h & 7d audit throughput, top suppression reasons, stale leases, and pipeline mode snapshots. Audit rows are keyset-paginated; failed reads return an error instead of partial-looking metrics.
   - **Preview Simulation Endpoint**: `/api/admin/notification-resolver/preview` providing read-only dry-run simulation across active candidates without mutating database records or dispatching push tickets.
   - **Admin UI Component**: `NotificationResolverSection.tsx` integrated as a first-class tab in the Admin Monitoring Hub (`/admin/monitoring?tab=resolver`).
   - **Static CI Architectural Gate**: `scripts/ci/check-no-direct-push-in-producers.ts` (`npm run check:producer-isolation`) verifying that candidate producers never directly import push dispatch libraries.

3. **Migration State**:
   - The earlier claim that 174/174 files are synchronized is withdrawn. The linked CLI audit found two local files with version `20260914140000`, which cannot be represented as two distinct remote versions, plus remote-only migration versions.
   - No migration-history repair or production database write was performed as part of this code fix.

---

## 2. Prompt 7 Candidate Producers Architecture

| Candidate Producer | Event Type | Priority Class | Score | Canonical Key Format | Scripture / Source Authority |
|---|---|---|---|---|---|
| **Series Producer** | `observance_series` | `reviewed_observance` | 20 | `observance_series:${childSlug}:${seriesKey}:${date}:general` | Source-backed series content plus reviewed occurrence references |
| **Parana Producer** | `ekadashi_parana` | `approved_ritual_window` | 30 | `ekadashi_parana:${slug}:parana:${date}:general` | Padma Purana, Hari-bhakti-vilasa (Dwadashi Parana) |
| **Pradosha Kala** | `pradosha_kala` | `approved_ritual_window` | 30 | `pradosha_kala:${slug}:twilight:${date}:general` | Explicit reviewed twilight-window references supplied by the caller |
| **Sankranti Producer** | `sankranti` | `approved_ritual_window` | 30 | `sankranti:${slug}:punyakala:${date}:general` | Explicit reviewed Punya Kala references supplied by the caller |

### Fail-Closed Governance Invariants:
1. **Location and ritual windows**: Parana, Pradosha, and Sankranti candidate functions require a valid latitude, reject `|lat| > 60`, and reject missing, invalid, or inverted reviewed boundaries. They do not calculate these boundaries themselves.
2. **Series publication**: Series children must be resolved, reviewed, verified, published, audit-complete, not fallback-dated, and carry source references. Every generated series notification is also limited to profiles explicitly opting in to festival reminders.
3. **Completeness gate**: A database error while checking the full series siblings now fails the cron run; it cannot be interpreted as “complete” and produce a candidate.
4. **Global/per-type gates**: The cron exits before reading user data or writing candidates unless the resolver global flag is on and `observance_series` is set to `candidate`.

---

## 3. Prompt 8 Admin Dashboard & Operational API

### 1. Stats Route (`/api/admin/notification-resolver-stats`)
- **Authentication**: `verifyAdminCookieAuth(request)` and `requireAdminAccess()`.
- **Response Structure**:
  - `governance`: Global kill switch status, snapshot of all pipeline modes.
  - `queue`: Current pending/resolving counts, stale leases (`claimed_at < NOW() - 10m`), and retained candidate-state counts (subject to row retention; these are not lifetime totals).
  - `last24h`: Total evaluated, accepted, suppressed, deferred, expired, cancelled, rates (%), top suppression reasons sorted by count, type distribution.
  - `last7d`: 7-day throughput and rates.

### 2. Preview Dry-Run Route (`/api/admin/notification-resolver/preview`)
- **Parameters**: `?eventType=<type>&limit=<1..500>`
- **Behavior**: Executes `executeCandidateResolverPipeline({ dryRun: true, forceIgnoreKillSwitch: true })`.
- **Safety**: Purely read-only; evaluates candidate priority, history, and budgets without database writes or push delivery.

### 3. Monitoring UI (`NotificationResolverSection.tsx`)
- Located at `/admin/monitoring?tab=resolver`.
- Features:
  - Global Kill Switch status banner with live pulse.
  - Stale lease warning badge.
  - 4 Key Operational Cards: Pending/Resolving Queue, 24h Acceptance Rate, 24h Suppressions, retained accepted/suppressed counts.
  - Per-Candidate-Type Pipeline Mode Matrix with visual status badges.
  - 24-Hour Policy Suppression Analysis bar charts.
  - Interactive Preview & Dry-Run simulation controls and candidates queue table.

---

## 4. Architectural CI Release Gate

The script `scripts/ci/check-no-direct-push-in-producers.ts` is invoked via `npm run check:producer-isolation`.

```bash
$ npm run check:producer-isolation

=== CI Architectural Gate: Check No Direct Push in Candidate Producers ===
Scanned 11 candidate producer files:
  - src/lib/dharm-veer-candidate-producer.ts
  - src/lib/japa-candidate-producer.ts
  - src/lib/mood-candidate-producer.ts
  - src/lib/nitya-candidate-producer.ts
  - src/lib/parana-candidate-producer.ts
  - src/lib/pradosha-candidate-producer.ts
  - src/lib/quiz-candidate-producer.ts
  - src/lib/sankranti-candidate-producer.ts
  - src/lib/sattvic-candidate-producer.ts
  - src/lib/series-candidate-producer.ts
  - src/lib/shloka-candidate-producer.ts

[PASSED] Zero direct push imports found in all candidate producers.
All candidate producers adhere strictly to the central resolver architectural boundary.
```

---

## 5. Zero-Downtime Rollout & Rollback Runbook

### Global Kill Switch
- **Activate Promotions**: `NOTIFICATION_RESOLVER_ENABLED=true`
- **Pause All Promotions (Safe Standby)**: `NOTIFICATION_RESOLVER_ENABLED=false` (or unset)

### Per-Type Pipeline Cutover (Prompt 7 Types)
Each candidate type supports three discrete operational modes:
- `candidate`: Route through the Central Resolver and candidate producer.
- `legacy`: Route through existing legacy crons/direct push.
- `disabled`: Completely disabled.

| Environment Variable | Allowed Values | Default | Purpose |
|---|---|---|---|
| `NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES` | `candidate` \| `legacy` \| `disabled` | `disabled` | Multi-day series candidates |
| `NOTIFICATION_CANDIDATE_MODE_EKADASHI_PARANA` | `candidate` \| `legacy` \| `disabled` | `disabled` | Ekadashi Parana sunrise window |
| `NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA` | `candidate` \| `legacy` \| `disabled` | `disabled` | Pradosha Kala twilight window |
| `NOTIFICATION_CANDIDATE_MODE_SANKRANTI` | `candidate` \| `legacy` \| `disabled` | `disabled` | Solar Sankranti Punya Kala |

### Candidate Mode Guard
The pure producer functions emit a row only when that type is explicitly in `candidate` mode. `legacy` and `disabled` return no candidate. This is a function-level guard, not a live rollout control until a scheduled producer calls these functions.

### Rollback Procedure (after scheduler integration)
If an integrated candidate producer generates unexpected volume or high suppression rates:
1. Set the specific type variable to `disabled` (e.g. `NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA=disabled`).
2. Candidate producers will immediately exit with `status: 'suppressed'`, generating 0 candidates.
3. If necessary, trigger global kill switch `NOTIFICATION_RESOLVER_ENABLED=false` to pause all promotions.
4. No database schema changes or rollbacks required.

---

## 6. Migration Status & Reconciliation (Open)

- **Local Migrations**: 174 files in `supabase/migrations`.
- **Database Migrations Table**: 186 entries were reported in the earlier audit.
- Those counts do not prove synchronization. Two local files share `20260914140000`, and the linked migration list has remote-only versions. A truthful `0 pending` claim is not available until migration history is reconciled. Do not blindly rename or reapply production migrations.

---

## 7. Automated Test Suite Results

All tests across candidate producers, central resolver, pipelines, and admin APIs were executed via Vitest:

| Test Suite | Tests Passed | Tests Failed | Tests Skipped | Duration |
|---|---|---|---|---|
| `src/lib/series-candidate-producer.test.ts` | 5 | 0 | 0 | 3ms |
| `src/lib/parana-candidate-producer.test.ts` | 6 | 0 | 0 | 19ms |
| `src/lib/pradosha-candidate-producer.test.ts` | 6 | 0 | 0 | 15ms |
| `src/lib/sankranti-candidate-producer.test.ts` | 6 | 0 | 0 | 16ms |
| `src/lib/notification-candidate-pipeline-mode.test.ts` | 7 | 0 | 0 | 2ms |
| `src/lib/notification-resolver.test.ts` | 11 | 0 | 0 | 5ms |
| `src/lib/notification-resolver-pipeline.test.ts` | 6 | 0 | 0 | 10ms |
| `src/app/api/admin/notification-resolver/__tests__/preview-route.test.ts` | 2 | 0 | 0 | 5ms |
| `src/app/api/admin/notification-resolver-stats/__tests__/route.test.ts` | 2 | 0 | 0 | 6ms |
| **Total at original Prompt 7/8 implementation** | **51** | **0** | **0** | **264ms** |

Follow-up verification covers 115 focused notification tests across 20 files, a full TypeScript check, and the producer-isolation gate. These checks validate producer logic, default-off cron gating, and admin endpoint behavior; they do not prove production scheduling, push delivery, ritual correctness, or migration synchronization.

**TypeScript Compiler (`npx tsc --noEmit -p tsconfig.json`)**: **0 errors** across all project files.
