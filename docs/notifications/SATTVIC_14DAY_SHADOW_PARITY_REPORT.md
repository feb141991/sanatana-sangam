# Prompt 5D Sattvic Mode Evening Reminder: 14-Day Fixture Simulation

> Evidence scope: deterministic simulation over synthetic profiles, dates, and hard-coded legacy expectations. The legacy route is not executed and no live database rows, deployed cron runs, or production candidate outcomes are compared. Matching fixture expectations does not establish production parity or cutover readiness.

## Executive Summary
The candidate producer matched the fixture's explicitly coded eligibility expectations across **70 profile-days** (5 synthetic profiles × 14 dates). This is a bounded fixture result, not a comparison against the running legacy route.

All 28 generated candidates successfully route to canonical `/bhakti/zen`, enforce tradition-tailored Sandhyā reflection copy, respect quiet-hours boundaries, and achieve **100% acceptance** under the central resolver's routine engagement budget.

---

## 1. Audit Scope & Test Cohort

- **Evaluation Window**: 14 days (2026-11-01 to 2026-11-14).
- **Target Send Window**: Local 17:00 (5:00 PM evening Sandhyā).
- **Canonical Action Route**: `/bhakti/zen`.
- **Devotee Cohort**:
  1. **Kolkata Opted-In** (`Asia/Kolkata`, Hindu, `wants_nitya_reminders: true`, quiet hours 22:00 - 06:00).
  2. **London Opted-Out** (`Europe/London`, Sikh, `wants_nitya_reminders: false`, quiet hours 22:00 - 07:00).
  3. **New York Early-Rest** (`America/New_York`, Jain, `wants_nitya_reminders: true`, quiet hours 16:00 - 20:00).
  4. **Los Angeles Deleting** (`America/Los_Angeles`, Buddhist, `wants_nitya_reminders: true`, `is_deleting: true`).
  5. **Auckland Opted-In** (`Pacific/Auckland`, Hindu, `wants_nitya_reminders: true`, quiet hours 23:00 - 06:00).

---

## 2. Fixture Scenario Results (Not Production Verification)

| Dimension | Total Evaluated | Fixture Expected Eligible | Candidates Produced | Fixture Match |
|---|---|---|---|---|
| **Kolkata Opted-In** | 14 | 14 | 14 | **100% (14/14)** |
| **London Opted-Out** | 14 | 0 | 0 | **100% (14/14)** |
| **New York Early-Rest** | 14 | 0 | 0 | **100% (14/14)** |
| **Los Angeles Deleting** | 14 | 0 | 0 | **100% (14/14)** |
| **Auckland Opted-In** | 14 | 14 | 14 | **100% (14/14)** |
| **Total** | **70** | **28** | **28** | **100% (70/70)** |

### Suppression Analysis:
1. **Preference Opt-In**: 14/14 days suppressed for London devotee (`wants_nitya_reminders === false`).
2. **Quiet Hours Protection**: 14/14 days suppressed for New York devotee (17:00 in 16:00-20:00 quiet window).
3. **Account Deletion Safety**: 14/14 days suppressed for Los Angeles devotee (`is_deleting: true`).
4. **Canonical Route Precision**: 100% (28/28) route precisely to `/bhakti/zen`.
5. **Tradition Reflection Copy**:
   - Hindu: *"🌅 Evening Sandhyā — Sattvic Mode Awaits"*
   - Sikh: *"☬ Evening Rehras Sahib Time"*
   - Buddhist: *"☸️ Evening Sitting Practice"*
   - Jain: *"🤲 Evening Pratikraman Reminder"*

---

## 3. Central Resolver Budget Evaluation

- **Candidates Evaluated**: 28
- **Accepted**: 28 (100%)
- **Suppressed**: 0
- **Deferred**: 0

All eligible candidates cleanly fit within the routine engagement budget (maximum 1 routine reminder per devotee per local civil date).

---

## 4. Pipeline Mode Source Contract (Not Deployment Evidence)

The cron route independently enforces:
```typescript
const pipelineMode = getRoutinePipelineMode('sattvic');
```
- `disabled`: Halts immediately with `{ ok: true, skipped: true, pipeline_mode: 'disabled' }`. Zero DB mutations.
- `candidate`: Upserts to `notification_candidates` with semantic conflict target `(user_id, event_type, event_id, event_instance, local_date, audience_variant)`. **Zero** writes to `notification_schedule` and zero direct push calls.
- `legacy`: Preserves original enqueuing to `notification_schedule` untouched until cutover approval.

---

## 5. Audit Conclusion

The synthetic fixture checks matched their coded eligibility expectations and exercised the pure resolver behavior. Runtime legacy parity, database persistence, cron exclusivity in deployment, push delivery, receipts, and cutover readiness remain unverified.
