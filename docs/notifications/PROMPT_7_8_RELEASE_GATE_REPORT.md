# Prompt 7 & 8: Time-Sensitive Ritual & Series Candidates & Admin Release Gate Report

**Date**: 2026-09-23  
**Repositories**:
- Backend / PWA: `Sanatan Sangam/Shoonaya`
- Native Mobile: `shoonaya-mobile` (Clean, untouched)  
**Database**: Supabase Linked Project `mnbwodcswxoojndytngu` (AWS pooler)  
**Status**: All Migrations Applied (174/174), Candidates & Producers Implemented, Admin Dashboard & Release Gates Verified.

---

## 1. Executive Summary

This milestone delivers **Prompt 7 (Time-Sensitive Ritual & Series Candidates)** and **Prompt 8 (Admin Dashboard & Release Gate)** under strict adherence to Shoonaya's Two-Repository Contract Ownership, Spiritual Content Integrity, Calendar Governance, and Database Safety standards:

1. **Prompt 7 Candidate Producers**:
   - **Observance Series**: Multi-day series (Navratri, Deepavali) consuming verified `@sangam/dharma-rules` series definitions and editorial content, requiring published and reviewed child occurrences and authentic scripture citations.
   - **Ekadashi Parana**: Fast-breaking morning window on Dwadashi qualified by local astronomical sunrise and Hari Vasara end time, failing closed on polar latitudes (`|lat| > 60`) or inverted windows.
   - **Pradosha Kala**: Twilight worship window (canonical 90 minutes: `sunset - 45m` to `sunset + 45m`) based on Skanda Purana and Shiva Purana, failing closed on polar/high latitudes.
   - **Solar Sankranti**: Solar transit ingress and Punya Kala snana/dana ritual windows based on Surya Siddhanta and Dharma Sindhu.
   - **Default-Off Safety**: All 4 candidate types default to `'disabled'` via `getCandidateTypePipelineMode()`.

2. **Prompt 8 Admin Monitoring & Release Gates**:
   - **Operational Stats Endpoint**: `/api/admin/notification-resolver-stats` returning live queue metrics, 24h & 7d throughput, top suppression reasons, duplicate prevention counts, stale leases, and pipeline mode snapshots.
   - **Preview Simulation Endpoint**: `/api/admin/notification-resolver/preview` providing read-only dry-run simulation across active candidates without mutating database records or dispatching push tickets.
   - **Admin UI Component**: `NotificationResolverSection.tsx` integrated as a first-class tab in the Admin Monitoring Hub (`/admin/monitoring?tab=resolver`).
   - **Static CI Architectural Gate**: `scripts/ci/check-no-direct-push-in-producers.ts` (`npm run check:producer-isolation`) verifying that candidate producers never directly import push dispatch libraries.

3. **Database Migrations Reconciled**:
   - 174/174 local migration files in `supabase/migrations` applied, registered, and verified in `supabase_migrations.schema_migrations`.
   - Zero pending or unapplied migrations remain.

---

## 2. Prompt 7 Candidate Producers Architecture

| Candidate Producer | Event Type | Priority Class | Score | Canonical Key Format | Scripture / Source Authority |
|---|---|---|---|---|---|
| **Series Producer** | `observance_series` | `reviewed_observance` | 20 | `observance_series:${childSlug}:${seriesKey}:${date}:general` | `@sangam/dharma-rules` series-content.json, Rashtriya Panchang |
| **Parana Producer** | `ekadashi_parana` | `approved_ritual_window` | 30 | `ekadashi_parana:${slug}:parana:${date}:general` | Padma Purana, Hari-bhakti-vilasa (Dwadashi Parana) |
| **Pradosha Kala** | `pradosha_kala` | `approved_ritual_window` | 30 | `pradosha_kala:${slug}:twilight:${date}:general` | Skanda Purana (Pradosha Mahatmya), Shiva Purana |
| **Sankranti Producer** | `sankranti` | `approved_ritual_window` | 30 | `sankranti:${slug}:punyakala:${date}:general` | Surya Siddhanta, Dharma Sindhu (Punya Kala snana/dana) |

### Fail-Closed Governance Invariants:
1. **Polar & High-Latitude Safety**: Any latitude where `|lat| > 60` or where sunrise/sunset calculations are undefined or ambiguous immediately fails closed with zero candidates generated and diagnostics logged.
2. **Inverted Window Protection**: Any window where `start_time >= end_time` or Hari Vasara end time is invalid is immediately rejected (`status: 'needs_review'`).
3. **Publication Status**: Series child occurrences must be `status === 'resolved'` and carry authentic source references (zero unsourced claims).
4. **Devotee Opt-Out**: Explicit preference flags (`wantsVratReminders === false`, `wantsPradoshaReminders === false`, `wantsSankrantiReminders === false`, `wantsFestivalReminders === false`) immediately suppress candidates.

---

## 3. Prompt 8 Admin Dashboard & Operational API

### 1. Stats Route (`/api/admin/notification-resolver-stats`)
- **Authentication**: `verifyAdminCookieAuth(request)` and `requireAdminAccess()`.
- **Response Structure**:
  - `governance`: Global kill switch status, snapshot of all pipeline modes.
  - `queue`: Current pending, resolving, stale leases count (`claimed_at < NOW() - 10m`), and lifetime resolution totals.
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
  - 4 Key Operational Cards: Pending/Resolving Queue, 24h Acceptance Rate, 24h Suppressions, Lifetime Volume.
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

### Instant Rollback Procedure
If any candidate producer generates unexpected volume or high suppression rates:
1. Set the specific type variable to `disabled` (e.g. `NOTIFICATION_CANDIDATE_MODE_PRADOSHA_KALA=disabled`).
2. Candidate producers will immediately exit with `status: 'suppressed'`, generating 0 candidates.
3. If necessary, trigger global kill switch `NOTIFICATION_RESOLVER_ENABLED=false` to pause all promotions.
4. No database schema changes or rollbacks required.

---

## 6. Migration Status & Reconciliation

- **Local Migrations**: 174 files in `supabase/migrations`.
- **Database Migrations Table**: 186 entries in `supabase_migrations.schema_migrations` (174 matching local migrations + 12 historical remote aliases).
- **Unapplied Migrations**: **0** (All DDL/DML applied and verified).

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
| **Total** | **51** | **0** | **0** | **264ms** |

**TypeScript Compiler (`npx tsc --noEmit -p tsconfig.json`)**: **0 errors** across all project files.
