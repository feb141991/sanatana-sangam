# Prompt 5E Nitya Karma Reminder: 14-Day Fixture Simulation

> Evidence scope: deterministic simulation over synthetic profiles, dates, and hard-coded legacy expectations. The legacy routes are not executed and no live database rows, deployed cron runs, or production candidate outcomes are compared. Matching fixture expectations does not establish production parity or cutover readiness.

## Executive Summary
The candidate producers matched the fixture's explicitly coded eligibility expectations across **210 slot evaluations** (5 synthetic profiles × 14 dates × 3 ritual slots). This is a bounded fixture result, not a comparison against running legacy routes.

All produced candidates route precisely to canonical `/nitya-karma`, map to `approved_ritual_window` (Priority 30), and achieve **100% acceptance** as sacred budget-exempt windows under the central resolver.

---

## 1. Audit Scope & Test Cohort

- **Evaluation Window**: 14 days (2026-11-01 to 2026-11-14).
- **Ritual Slots**:
  1. **Morning Brahma Muhurta**: Local 05:00 (dawn sadhana sequence).
  2. **Madhyahn Sandhya**: Local 12:00 (midday Surya namaskar).
  3. **Sandhya Diya**: Local 18:00 (evening lamp and prayer).
- **Canonical Action Route**: `/nitya-karma`.
- **Devotee Cohort**:
  1. **Kolkata Full-Day** (`Asia/Kolkata`, Hindu, `wants_nitya_reminders: true`, `wants_madhyahn_reminder: true`, `wants_evening_reminder: true`, `nitya_rhythm_mode: 'full_day'`).
  2. **London Morning-Only** (`Europe/London`, Sikh, `wants_nitya_reminders: true`, `wants_madhyahn_reminder: false`, `wants_evening_reminder: false`, `nitya_rhythm_mode: 'morning_only'`).
  3. **New York Advanced** (`America/New_York`, Jain, `wants_nitya_reminders: true`, `wants_madhyahn_reminder: true`, `wants_evening_reminder: true`, `nitya_rhythm_mode: 'advanced'`).
  4. **Los Angeles Opted-Out** (`America/Los_Angeles`, Buddhist, `wants_nitya_reminders: false`, `wants_madhyahn_reminder: false`, `wants_evening_reminder: false`).
  5. **Auckland Deletion-Pending** (`Pacific/Auckland`, Hindu, `is_deleting: true`).

---

## 2. Fixture Scenario Results (Not Production Verification)

| Devotee Profile | Slot | Days Evaluated | Fixture Expected Eligible | Candidates Produced | Fixture Match |
|---|---|---|---|---|---|
| **Kolkata Full-Day** | Morning | 14 | 14 | 14 | **100% (14/14)** |
| **Kolkata Full-Day** | Madhyahn | 14 | 14 | 14 | **100% (14/14)** |
| **Kolkata Full-Day** | Sandhya | 14 | 14 | 14 | **100% (14/14)** |
| **London Morning-Only** | Morning | 14 | 14 | 14 | **100% (14/14)** |
| **London Morning-Only** | Madhyahn | 14 | 0 | 0 | **100% (14/14)** |
| **London Morning-Only** | Sandhya | 14 | 0 | 0 | **100% (14/14)** |
| **New York Advanced** | Morning | 14 | 14 | 14 | **100% (14/14)** |
| **New York Advanced** | Madhyahn | 14 | 14 | 14 | **100% (14/14)** |
| **New York Advanced** | Sandhya | 14 | 14 | 14 | **100% (14/14)** |
| **Los Angeles Opted-Out** | Morning | 14 | 0 | 0 | **100% (14/14)** |
| **Los Angeles Opted-Out** | Madhyahn | 14 | 0 | 0 | **100% (14/14)** |
| **Los Angeles Opted-Out** | Sandhya | 14 | 0 | 0 | **100% (14/14)** |
| **Auckland Deleting** | Morning | 14 | 0 | 0 | **100% (14/14)** |
| **Auckland Deleting** | Madhyahn | 14 | 0 | 0 | **100% (14/14)** |
| **Auckland Deleting** | Sandhya | 14 | 0 | 0 | **100% (14/14)** |
| **Total** | **All Slots** | **210** | **98** | **98** | **100% (210/210)** |

### Suppression Analysis:
1. **Rhythm Mode Filtering**: London devotee received Morning reminders (14/14) but zero Madhyahn (0/14) and zero Sandhya (0/14) because `nitya_rhythm_mode` was `morning_only`.
2. **Opt-Out Safety**: Los Angeles devotee received 0 candidates across all 3 slots because preferences were opted out.
3. **Account Deletion Safety**: Auckland devotee received 0 candidates across all 3 slots because `is_deleting: true`.
4. **Canonical Route Precision**: 100% (98/98) route precisely to `/nitya-karma`.
5. **Tradition Reflection Copy**:
   - Morning:
     - Hindu: *"🌅 Brahma Muhurta — Your Sadhana Path Awaits"*
     - Sikh: *"☬ Amrit Vela — Your Nitnem Awaits"*
     - Buddhist: *"☸️ Your Morning Practice Awaits"*
     - Jain: *"🤲 Your Morning Pratikraman Awaits"*
   - Madhyahn:
     - Hindu: *"🌞 Madhyahn Sandhya — 2 minutes"*
     - Sikh: *"🌞 Midday Simran"*
     - Buddhist: *"🌞 Midday Mindfulness"*
     - Jain: *"🌞 Madhyahn Pratikraman"*
   - Sandhya:
     - Hindu: *"🪔 Sandhya Diya — the day closes"*
     - Sikh: *"🪔 Rehras Sahib"*
     - Buddhist: *"🪔 Evening Sitting"*
     - Jain: *"🪔 Sayam Pratikraman"*

---

## 3. Central Resolver Budget Evaluation

- **Candidates Evaluated**: 98
- **Accepted**: 98 (100%)
- **Suppressed**: 0
- **Deferred**: 0

Nitya Karma reminders are classified as **`approved_ritual_window`** (Priority 30) and are 100% exempt from the routine engagement budget cap (max 1) and devotional cap (max 2). A devotee practicing full-day rhythm safely receives morning, noon, and evening prompts without colliding with each other or suppressing daily check-ins.

---

## 4. Pipeline Mode Source Contract (Not Deployment Evidence)

Each Nitya cron route independently enforces:
```typescript
const pipelineMode = getRoutinePipelineMode('nitya');
```
- `disabled`: Halts immediately with `{ ok: true, skipped: true, pipeline_mode: 'disabled' }`. Zero DB mutations.
- `candidate`: Upserts to `notification_candidates` with semantic conflict target `(user_id, event_type, event_id, event_instance, local_date, audience_variant)`. **Zero** direct push calls, **zero** writes to `notifications` inbox, and **zero** writes to `notification_schedule`.
- `legacy`: Preserves original direct push or `notification_schedule` enqueuing untouched until cutover approval.

---

## 5. Audit Conclusion

The synthetic fixture checks matched their coded eligibility expectations and exercised pure candidate/resolver behavior. Runtime legacy parity, database persistence, cron exclusivity in deployment, push delivery, receipts, and cutover readiness remain unverified.
