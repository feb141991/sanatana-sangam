# Prompt 5B: Shloka / Streak Rescue Routine Reminder 14-Day Shadow Parity Report

## 1. Executive Summary
This audit validates the migration of the Shloka / streak rescue reminder from the legacy direct-send cron to the central notification candidate architecture.
Evaluated across **5 global timezones** over a **14-day evaluation window** (2026-11-01 to 2026-11-14, 70 devotee-days).

- **Cohort Evaluated**: 5 representative devotees across varying traditions, habits, and preferences:
  1. `devotee-kolkata-incomplete` (`Asia/Kolkata`, UTC+5:30) — Incomplete shloka read, 2-day streak.
  2. `devotee-london-active` (`Europe/London`, UTC+0) — Diligent Sikh devotee, reads verses early every morning.
  3. `devotee-newyork-alternating` (`America/New_York`, UTC-5) — Alternating practice (even days completed, odd days missed).
  4. `devotee-losangeles-optout` (`America/Los_Angeles`, UTC-8) — Explicitly opted out (`wants_shloka_reminders: false`).
  5. `devotee-auckland-streak` (`Pacific/Auckland`, UTC+13) — High streak devotee (25 days), evening quiet hours conflict (18:00 - 06:00).

---

## 2. Parity & Invariant Matrix

| Evaluation Dimension | Legacy Pipeline | Candidate Pipeline | Parity Status | Evidence & Notes |
|---|---|---|---|---|
| **Eligibility Decision** | 35 eligible / 35 skipped | 35 eligible / 35 skipped | **100% IDENTICAL** | Exact decision match on all 70 devotee-days. |
| **Activity Suppression** | Skipped when `last_shloka_date=today` | Skipped when `last_shloka_date=today` | **100% IDENTICAL** | Zero reminders sent or generated for devotees who already read today. |
| **Preference Respect** | Suppressed if `wants_shloka_reminders=false` | Suppressed if `wants_shloka_reminders=false` | **100% IDENTICAL** | 14/14 days suppressed for opted-out Los Angeles user. |
| **Canonical Route** | `/home?focus=shloka` | `/home?focus=shloka` | **100% IDENTICAL** | 100% of links route to `/home?focus=shloka`. |
| **Spiritual Copy Integrity** | Loss-pressure ("Don't break streak! 🔥") | Devotional serene ("Continue sadhana 🙏") | **IMPROVED** | Guilt and panic phrasing eliminated; dignified devotion copy only. |
| **Pipeline Exclusivity** | Direct push + Bell write | Candidate row insertion only | **INTENTIONAL** | Mode check guarantees legacy and candidate never execute simultaneously. |
| **Quiet Hours Protection** | Blind send at cron runtime | Defers past quiet hours | **IMPROVED** | Auckland 19:00 reminder safely shifted to 07:00 local time. |
| **Central Resolver Cap** | Uncapped / ad-hoc | 1 routine notification/day | **ENFORCED** | All 35 candidates accepted under 1 routine/day cap. |

---

## 3. Cohort Breakdown by Devotee

| Devotee ID | Timezone | Activity Profile | Total Days | Legacy Eligible | Candidate Produced | Resolver Accepted |
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

**Status**: 14-day shadow parity audit passed with zero regressions. Ready for founder review.
