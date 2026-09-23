# Prompt 5A: Japa Routine Reminder 14-Day Fixture Simulation

> Evidence scope: deterministic simulation over hard-coded devotee profiles, completion patterns, and dates. No live database rows, device usage, deployed legacy cron, or production candidate outcomes were observed. The match counts below apply only to these fixtures and do not establish production parity or cutover readiness.

## 1. Executive Summary
This audit validates the migration of the daily Japa routine reminder from the legacy direct-send pipeline to the central notification candidate architecture.
Evaluated across **5 global timezones** over a **14-day evaluation window** (2026-11-01 to 2026-11-14, 70 devotee-days).

- **Cohort Evaluated**: 5 representative devotees across varying timezones, habits, and preferences:
  1. `devotee-kolkata-standard` (`Asia/Kolkata`, UTC+5:30) — Incomplete sadhana, standard 07:00 reminder.
  2. `devotee-london-active` (`Europe/London`, UTC+0) — Diligent devotee, daily Japa completed early.
  3. `devotee-newyork-alternating` (`America/New_York`, UTC-5) — Alternating practice (even days completed, odd days incomplete).
  4. `devotee-losangeles-optout` (`America/Los_Angeles`, UTC-8) — Explicitly opted out (`japa_reminder_enabled: false`).
  5. `devotee-auckland-quiet-conflict` (`Pacific/Auckland`, UTC+13) — Late-night reminder setting (23:30) conflicting with quiet hours.

---

## 2. Parity & Invariant Matrix

| Evaluation Dimension | Legacy Pipeline | Candidate Pipeline | Parity Status | Evidence & Notes |
|---|---|---|---|---|
| **Eligibility Decision** | 35 eligible / 35 skipped | 35 eligible / 35 skipped | **Fixture match** | Matches only the hard-coded cases executed by this script. |
| **Completion Suppression** | Skipped when `japa_done=true` | Skipped when `japa_done=true` | **Fixture match** | Fixture scenarios with completed practice produce no candidate. |
| **Preference Respect** | Suppressed if `enabled=false` | Suppressed if `enabled=false` | **Fixture match** | Opt-out behavior tested for the synthetic Los Angeles profile. |
| **Canonical Route** | `/japa` | `/japa` | **Fixture match** | Tested candidate links route to `/japa`. |
| **Pipeline Exclusivity** | Direct push + Bell write | Candidate row insertion only | **Not assessed** | Route/cron exclusivity requires deployed integration verification. |
| **Quiet Hours Protection** | Blind send at cron runtime | Defers past quiet hours | **IMPROVED** | Auckland 23:30 reminder safely shifted to 07:00 local time. |
| **Central Resolver Cap** | Uncapped / ad-hoc | 1 routine notification/day | **ENFORCED** | All 35 candidates accepted under 1 routine/day cap. |

---

## 3. Cohort Breakdown by Devotee

| Devotee ID | Timezone | Completion Profile | Total Days | Legacy Eligible | Candidate Produced | Resolver Accepted |
|---|---|---|---|---|---|---|
| `devotee-kolkata-standard` | `Asia/Kolkata` | Incomplete (0/14) | 14 | 14 | 14 | 14 |
| `devotee-london-active` | `Europe/London` | Completed (14/14) | 14 | 0 | 0 | 0 |
| `devotee-newyork-alternating` | `America/New_York` | Alternating (7/14) | 14 | 7 | 7 | 7 |
| `devotee-losangeles-optout` | `America/Los_Angeles` | Opted Out | 14 | 0 | 0 | 0 |
| `devotee-auckland-quiet-conflict`| `Pacific/Auckland` | Incomplete (0/14) | 14 | 14 | 14 | 14 |
| **TOTAL** | — | — | **70** | **35** | **35** | **35** |

*(London = 0, LA = 0, NY = 7 odd days, Kolkata = 14 days, Auckland = 14 days; Total = 35 eligible/accepted)*

---

## 4. Sample Schedule & Quiet Hour Handling (Auckland Devotee)

Devotee requested reminder at 23:30 local time. Quiet hours are configured from 22:00 to 06:00.

| Date | Requested Time | Adjusted Local Instant | Scheduled UTC Instant | Status |
|---|---|---|---|---|
| `2026-11-01` | 23:30 (Quiet window) | 07:00 (Post-quiet) | `2026-10-31T18:30:00.000Z` | Scheduled Safe |
| `2026-11-02` | 23:30 (Quiet window) | 07:00 (Post-quiet) | `2026-11-01T18:30:00.000Z` | Scheduled Safe |
| `2026-11-03` | 23:30 (Quiet window) | 07:00 (Post-quiet) | `2026-11-02T18:30:00.000Z` | Scheduled Safe |

---

## 5. Pipeline Mode Controls & Readiness
Pipeline mode configuration in `src/lib/notification-candidate-pipeline-mode.ts`:
- `NOTIFICATION_ROUTINE_MODE_JAPA`
  - Default: `'legacy'` (Preserves existing cron delivery until explicit cutover).
  - Test/Preview: `'candidate'` (Enqueues to `notification_candidates`, suppresses push & bell).
  - Kill Switch: `'disabled'` (Halts all Japa reminder execution).

**Status**: Fixture scenario comparison completed. Production parity, deployed cron behavior, and cutover readiness remain unverified.
