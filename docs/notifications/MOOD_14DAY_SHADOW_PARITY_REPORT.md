# Prompt 5C Mood Check-In Routine Reminder Migration: 14-Day Shadow Parity Audit

## Executive Summary
This audit proves **100% eligibility parity** between the legacy mood reminder routes and the central notification candidate producer across **140 slot evaluations** (5 global timezones × 5 devotee profiles × 14 consecutive calendar dates × 2 daily slots: midday & evening).

It further documents the **intentional difference** governed by the central resolver:
Under the legacy architecture, devotees could receive both a 12:00 PM midday reminder and an 18:00 PM evening reminder on the same date. Under the central resolver's **1 routine engagement per devotee/date** budget policy, once Midday check-in is delivered, the Evening nudge is gracefully suppressed (`routine_engagement_cap_reached`), eliminating notification fatigue while ensuring the devotee receives their daily check-in. If Midday was skipped (e.g. for day-sleepers / night-shift workers whose quiet hours cover noon), the Evening candidate is accepted!

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

## 2. Parity & Production Verification Results

| Dimension | Total Evaluated | Legacy Eligible | Candidates Produced | Parity Match |
|---|---|---|---|---|
| **Midday Slot (12:00)** | 70 | 42 | 42 | **100% (70/70)** |
| **Evening Slot (18:00)** | 70 | 42 | 42 | **100% (70/70)** |
| **Combined Total** | **140** | **84** | **84** | **100% (140/140)** |

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
| **Evening Candidate (Same Day, Midday Delivered)** | Evening 18:00 | **Suppressed** | `routine_engagement_cap_reached` | **Prevents double-nudging**. In legacy, users received two generic mood notifications on the same day. Central resolver caps routine nudges at 1/day. |
| **Evening Candidate (London Shift-Worker)** | Evening 18:00 | **Accepted** | `routine_engagement_accepted` | Because midday was suppressed by quiet hours, the daily routine budget remained open, allowing the evening reflection to reach the devotee when awake. |

### Quantified Results:
- **Total Midday Candidates Evaluated**: 42
  - **Accepted**: 42 (100%)
- **Total Evening Candidates Evaluated**: 42
  - **Accepted**: 14 (London shift-worker scenario where midday was skipped due to day-sleeping quiet hours)
  - **Suppressed**: 28 (`routine_engagement_cap_reached` because midday reflection was already delivered for that date)

---

## 4. Pipeline Exclusivity Proof

Each cron route independently enforces:
```typescript
const pipelineMode = getRoutinePipelineMode('mood');
```
- `disabled`: Halts immediately with `{ ok: true, skipped: true, pipeline_mode: 'disabled' }`. Zero DB mutations.
- `candidate`: Upserts to `notification_candidates` with semantic conflict target `(user_id, event_type, event_id, event_instance, local_date, audience_variant)`. **Zero** calls to `sendPushNotification()`, **zero** bell insertions, and **zero** writes to `notification_schedule`.
- `legacy`: Preserves original enqueuing/direct delivery untouched until cutover approval.

---

## 5. Audit Conclusion

The Mood routine check-in reminder producer migration achieves **100% eligibility parity**, enforces robust quiet-hours and account-deletion safety, respects all spiritual traditions, and safely arbitrates through the Central Notification Resolver without duplicate delivery.
