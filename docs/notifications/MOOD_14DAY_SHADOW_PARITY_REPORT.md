# Prompt 5C Mood Check-In Routine Reminder: 14-Day Fixture Simulation

> Evidence scope: deterministic simulation over synthetic profiles, dates, and hard-coded legacy expectations. The legacy route is not executed and no live database rows, deployed cron runs, or production candidate outcomes are compared. Matching fixture expectations does not establish production parity or cutover readiness.

## Executive Summary
The candidate producer matched the fixture's explicitly coded eligibility expectations for **140 slot evaluations** (5 synthetic profiles × 14 dates × 2 slots). This is a bounded fixture result, not a comparison against the running legacy routes.

It also exercises resolver budgeting with sequential midday/evening fixtures. The synthetic comparison is evaluated at each candidate's own scheduled instant in its profile timezone; this does not model deployed cron timing or actual user delivery.

---

## 1. Audit Scope & Test Cohort

- **Evaluation Window**: 14 days (2026-11-01 to 2026-11-14).
- **Slots Evaluated**:
  1. `midday` (12:00 local noon, route `/discover/mood`, priority 60)
  2. `evening` (18:00 local evening, route `/discover/mood`, priority 60)
- **Devotee Cohort**:
  1. **Kolkata Standard** (`Asia/Kolkata`, Hindu, quiet hours 22:00 - 06:00).
  2. **London Night-Shift** (`Europe/London`, Sikh, quiet hours 10:00 - 17:00, sleeps through midday).
  3. **New York Evening Worker** (`America/New_York`, Jain, quiet hours 17:00 - 23:00, evening in quiet window).
  4. **Los Angeles Deleting** (`America/Los_Angeles`, Buddhist, account deletion requested).
  5. **Auckland Standard** (`Pacific/Auckland`, Hindu, quiet hours 23:00 - 06:00).

---

## 2. Fixture Scenario Results (Not Production Verification)

| Dimension | Total Evaluated | Fixture Expected Eligible | Candidates Produced | Fixture Match |
|---|---|---|---|---|
| **Midday Slot (12:00)** | 70 | 42 | 42 | **100%** |
| **Evening Slot (18:00)** | 70 | 42 | 42 | **100%** |
| **Combined Total** | **140** | **84** | **84** | **100%** |

### Suppression Analysis:
1. **Account Deletion Safety**: 28/28 evaluations (14 midday + 14 evening) suppressed for Los Angeles devotee (`is_deleting: true`).
2. **Quiet Hours Protection**:
   - 14/14 midday evaluations suppressed for London night-shift worker (12:00 in 10:00-17:00 quiet window).
   - 14/14 evening evaluations suppressed for New York evening worker (18:00 in 17:00-23:00 quiet window).
3. **Route Precision**: 100% of generated candidates route to canonical `/discover/mood`.
4. **Copy & Prompt Faithfulness**: 100% of candidates use tradition-aligned reflection prompts (Hindu, Sikh, Jain, Buddhist).

---

## 3. Central Resolver Budget & Intentional Differences

| Scenario | Candidate Generated | Resolver Decision | Reason | Intentional Architecture Benefit |
|---|---|---|---|---|
| **Midday Candidate (Kolkata/Auckland/NY)** | Midday 12:00 | **Accepted** | `routine_engagement_accepted` | Devotee receives midday scripture & mood reflection. |
| **Evening Candidate (Same Day, Midday Delivered)** | Evening 18:00 local | **Suppressed** | `routine_engagement_cap_reached` | The pure resolver enforces the one-routine-candidate fixture policy. |
| **Evening Candidate (London Shift-Worker)** | Evening 18:00 | **Accepted** | `routine_engagement_accepted` | Because midday was suppressed by quiet hours, the daily routine budget remained open, allowing the evening reflection to reach the devotee when awake. |

### Quantified Results:
- **Total Midday Candidates Evaluated**: 42
  - **Accepted**: 42
- **Total Evening Candidates Evaluated**: 42
  - **Accepted**: 14 (fixture accepts where the midday candidate was skipped)
  - **Suppressed**: 28 (`routine_engagement_cap_reached`)
  - **Expired**: 0
  - **Deferred**: 0

---

## 4. Pipeline Mode Source Contract (Not Deployment Evidence)

Each cron route independently enforces:
```typescript
const pipelineMode = getRoutinePipelineMode('mood');
```
- `disabled`: Halts immediately with `{ ok: true, skipped: true, pipeline_mode: 'disabled' }`. Zero DB mutations.
- `candidate`: Upserts to `notification_candidates` with semantic conflict target `(user_id, event_type, event_id, event_instance, local_date, audience_variant)`. **Zero** calls to `sendPushNotification()`, **zero** bell insertions, and **zero** writes to `notification_schedule`.
- `legacy`: Preserves original enqueuing/direct delivery untouched until cutover approval.

---

## 5. Audit Conclusion

The synthetic fixture checks matched their coded eligibility expectations and exercised the pure resolver budget behavior. Runtime legacy parity, database persistence, cron exclusivity in deployment, push delivery, receipts, and cutover readiness remain unverified.
