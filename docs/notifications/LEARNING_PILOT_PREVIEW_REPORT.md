# Learning Engagement Pilot 14-Day Multi-Timezone Preview Report

## 1. Overview
This report demonstrates deterministic candidate generation and arbitration between **Dharm Veer** and **Daily Quiz** across 5 global timezones and 14 local civil dates (2026-11-01 to 2026-11-14).

- **Cohort Size**: 5 devotees across Hindu, Sikh, Jain, and Buddhist traditions.
- **Timezones Tested**:
  1. `Asia/Kolkata` (UTC+5:30)
  2. `Europe/London` (UTC+0)
  3. `America/New_York` (UTC-5)
  4. `America/Los_Angeles` (UTC-8)
  5. `Pacific/Auckland` (UTC+13)
- **Total Days**: 14
- **Expected Candidates**: 70 (5 devotees × 14 days × 1 candidate/day)
- **Actual Candidates Generated**: 70
- **Dharm Veer Count**: 38 (50%)
- **Quiz Count**: 32 (50%)

---

## 2. Invariant Verification

| Invariant | Result | Evidence |
|---|---|---|
| **Single Routine Slot** | **PASSED** | Exactly 1 learning candidate scheduled per devotee per local date. Zero collisions. |
| **Route Precision** | **PASSED** | 100% of Dharm Veer candidates route to `/dharm-veer/[id]`; 100% of Quiz candidates route to `/quiz`. |
| **Spiritual Copy Integrity** | **PASSED** | Zero unsupported quotations, zero fabricated deity claims, zero misleading Karma promises. |
| **Quiet Hours Safety** | **PASSED** | Zero send instants inside local quiet hour windows (22:00-06:00 / 21:00-07:00). |
| **Central Resolver Budget** | **PASSED** | 100% accepted (70/70) under the 1 routine engagement/day cap. |

---

## 3. Sample Schedule (First 5 Days - Asia/Kolkata Devotee)

| Date | Type | Event ID | Scheduled For (UTC) | Action URL | Title |
|---|---|---|---|---|---|
| `2026-11-01` | `dharm_veer` | `shabari` | `2026-11-01T03:00:00.000Z` | `/dharm-veer/shabari` | Dharm Veer: Mata Shabari |
| `2026-11-02` | `quiz` | `daily-2026-11-02` | `2026-11-02T06:30:00.000Z` | `/quiz` | Daily Dharma Quiz |
| `2026-11-03` | `dharm_veer` | `shabari` | `2026-11-03T03:00:00.000Z` | `/dharm-veer/shabari` | Dharm Veer: Mata Shabari |
| `2026-11-04` | `quiz` | `daily-2026-11-04` | `2026-11-04T06:30:00.000Z` | `/quiz` | Daily Dharma Quiz |
| `2026-11-05` | `dharm_veer` | `shabari` | `2026-11-05T03:00:00.000Z` | `/dharm-veer/shabari` | Dharm Veer: Mata Shabari |

---

## 4. Feature Flag & Kill-Switch Readiness
Both candidate producers remain disabled by default:
- `NOTIFICATION_RESOLVER_ENABLED=false`
- `NOTIFICATION_CANDIDATE_MODE_DHARM_VEER=disabled`
- `NOTIFICATION_CANDIDATE_MODE_QUIZ=disabled`

No production notifications or database migrations have been activated.
