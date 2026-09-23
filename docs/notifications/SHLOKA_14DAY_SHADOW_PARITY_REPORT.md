# Prompt 5B: Shloka / Streak Rescue Routine Reminder 14-Day Fixture Simulation

> Evidence scope: deterministic simulation over synthetic profiles, dates, and hard-coded legacy expectations. The legacy route is not executed and no live database rows, deployed cron runs, or production candidate outcomes are compared. Matching fixture expectations does not establish production parity or cutover readiness.

## 1. Executive Summary
The candidate producer matched the fixture's explicitly coded eligibility expectations across **70 profile-days** (5 synthetic profiles × 14 dates). This is a bounded fixture result, not a comparison against the running legacy route.

- **Cohort Evaluated**: 5 representative devotees across varying traditions, habits, and preferences:
  1. `devotee-kolkata-incomplete` (`Asia/Kolkata`, UTC+5:30) — Incomplete shloka read, 2-day streak.
  2. `devotee-london-active` (`Europe/London`, UTC+0) — Diligent Sikh devotee, reads verses early every morning.
  3. `devotee-newyork-alternating` (`America/New_York`, UTC-5) — Alternating practice (even days completed, odd days missed).
  4. `devotee-losangeles-optout` (`America/Los_Angeles`, UTC-8) — Explicitly opted out (`wants_shloka_reminders: false`).
  5. `devotee-auckland-streak` (`Pacific/Auckland`, UTC+13) — High streak devotee (25 days), evening quiet hours conflict (18:00 - 06:00).

---

## 2. Fixture Scenario & Invariant Matrix (Not Production Verification)

| Evaluation Dimension | Legacy Pipeline | Candidate Pipeline | Parity Status | Evidence & Notes |
|---|---|---|---|---|
| **Eligibility Decision** | 35 fixture-expected eligible / 35 fixture-expected skipped | 35 produced / 35 not produced | **Fixture match** | Matches the hard-coded expectations for these 70 synthetic profile-days only. |
| **Activity Suppression** | Fixture expects skip when `last_shloka_date=today` | Candidate function skips that fixture | **Fixture behavior** | No production sends are measured here. |
| **Preference Respect** | Fixture expects suppression if `wants_shloka_reminders=false` | Candidate function suppresses that fixture | **Fixture behavior** | Synthetic opted-out case only. |
| **Canonical Route** | Expected `/home?focus=shloka` | Candidate route `/home?focus=shloka` | **Fixture behavior** | The candidate URL is checked; app tap routing is not exercised. |
| **Spiritual Copy Integrity** | Loss-pressure ("Don't break streak! 🔥") | Devotional serene ("Continue sadhana 🙏") | **IMPROVED** | Guilt and panic phrasing eliminated; dignified devotion copy only. |
| **Pipeline Exclusivity** | Not executed here | Candidate generation function only | **Not assessed** | Deployment configuration and simultaneous cron execution were not tested. |
| **Quiet Hours Protection** | Blind send at cron runtime | Defers past quiet hours | **IMPROVED** | Auckland 19:00 reminder safely shifted to 07:00 local time. |
| **Central Resolver Cap** | Uncapped / ad-hoc | 1 routine notification/day | **ENFORCED** | All 35 candidates accepted under 1 routine/day cap. |

---

## 3. Cohort Breakdown by Devotee

| Devotee ID | Timezone | Activity Profile | Total Days | Fixture Expected Eligible | Candidate Produced | Resolver Accepted |
|---|---|---|---|---|---|---|
| `devotee-kolkata-incomplete` | `Asia/Kolkata` | Incomplete (0/14) | 14 | 14 | 14 | 14 |
| `devotee-london-active` | `Europe/London` | Completed (14/14) | 14 | 0 | 0 | 0 |
| `devotee-newyork-alternating` | `America/New_York` | Alternating (7/14) | 14 | 7 | 7 | 7 |
| `devotee-losangeles-optout` | `America/Los_Angeles` | Opted Out | 14 | 0 | 0 | 0 |
| `devotee-auckland-streak` | `Pacific/Auckland` | Incomplete (0/14) | 14 | 14 | 14 | 14 |
| **TOTAL** | — | — | **70** | **35** | **35** | **35** |

*(London = 0, LA = 0, NY = 7 odd days, Kolkata = 14 days, Auckland = 14 days; Total = 35 eligible/accepted)*

---

## 4. Sample Schedule & Quiet Hour Handling (Auckland Devotee)

Devotee requested reminder in evening (19:00). Configured quiet hours are 18:00 to 06:00.

| Date | Requested Time | Adjusted Local Instant | Scheduled UTC Instant | Status |
|---|---|---|---|---|
| `2026-11-01` | 19:00 (Quiet window 18-06) | 07:00 (Post-quiet safe) | `2026-10-31T18:00:00.000Z` | Scheduled Safe |
| `2026-11-02` | 19:00 (Quiet window 18-06) | 07:00 (Post-quiet safe) | `2026-11-01T18:00:00.000Z` | Scheduled Safe |
| `2026-11-03` | 19:00 (Quiet window 18-06) | 07:00 (Post-quiet safe) | `2026-11-02T18:00:00.000Z` | Scheduled Safe |

---

## 5. Pipeline Mode Controls & Readiness
Pipeline mode configuration in `src/lib/notification-candidate-pipeline-mode.ts`:
- `NOTIFICATION_ROUTINE_MODE_SHLOKA`
  - Default: `'legacy'` (Preserves existing cron delivery until explicit cutover).
  - Test/Preview: `'candidate'` (Enqueues to `notification_candidates`, suppresses push & bell).
  - Kill Switch: `'disabled'` (Halts all Shloka reminder execution).

**Status**: Fixture scenario comparison completed. Runtime legacy parity, database persistence, deployed cron exclusivity, push delivery, receipts, and cutover readiness remain unverified.
