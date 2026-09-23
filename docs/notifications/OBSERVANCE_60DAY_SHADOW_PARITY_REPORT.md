# 60-Day Observance Fixture Simulation Report

**Evaluation Window**: 2026-10-01 to 2026-11-30 (60 days)
**Representative Devotee Profiles**: 14
**Canonical Observances in Horizon**: 14

> Evidence scope: deterministic fixture simulation using hard-coded representative profiles and canonical occurrence fixtures. This is not a live database shadow run, not a production cohort, and not cutover approval. The percentages below describe only these fixtures.

## 1. Executive Summary & Verification Metrics

| Metric | Legacy Direct Cron | Scheduled Dispatcher | Delta / Explanation |
| :--- | :--- | :--- | :--- |
| **Total Deliveries / Candidates** | 16 | 160 | +144 (Expanded local timezone & lead day coverage) |
| **Exact Semantic Matches** | - | 8 | Shared D1/D7 notifications identical to legacy |
| **Timezone & D0 Coverage Additions** | - | 152 | Devotees in Americas/Europe + D0 same-day sadhana alerts |
| **Key Collisions** | - | 0 | **0** (All keys use `observance-v1:` namespace) |
| **Budget Exemption Rate** | - | 100% | **100%** (`explicit_observance` bypasses daily cap) |
| **Quiet Hours Violations** | 0 | 0 | **0** (Scheduled instant avoids user quiet window) |
| **Incomplete Series Leaks** | 0 | 0 | **0** (Disputed/under-review series strictly blocked) |
| **Account Deletion Leaks** | 0 | 0 | **0** (Deleting accounts strictly excluded) |

## 2. Devotee Profile Parity Matrix

| Profile ID | Tradition | Location / Timezone | Preferences | Legacy Sent | Scheduled Candidates | Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `devotee-in-surya-all` | hindu | Asia/Kolkata | F:Y, V:Y | 0 | 27 | Includes D0 same-day sadhana alert (legacy only supported D1 and D7). |
| `devotee-in-smartha-female` | hindu | Asia/Kolkata | F:Y, V:Y | 0 | 20 | Parity verified. |
| `devotee-uk-gaudiya-male` | hindu | Europe/London | F:Y, V:Y | 16 | 18 | Includes D0 same-day sadhana alert (legacy only supported D1 and D7). |
| `devotee-us-ny-female` | hindu | America/New_York | F:Y, V:Y | 0 | 20 | Legacy missed 100% (ran at 07:00 UTC / 02:00 local). Scheduled restores 100% local morning coverage. |
| `devotee-us-la-male` | hindu | America/Los_Angeles | F:Y, V:Y | 0 | 27 | Legacy missed 100% (ran at 07:00 UTC / 02:00 local). Scheduled restores 100% local morning coverage. |
| `devotee-au-sydney-general` | hindu | Australia/Sydney | F:Y, V:Y | 0 | 18 | Parity verified. |
| `devotee-festivals-only` | hindu | Asia/Kolkata | F:Y, V:N | 0 | 10 | Granular Stage O2 preference: vrats suppressed while festivals delivered. |
| `devotee-vrats-only` | hindu | Asia/Kolkata | F:N, V:Y | 0 | 4 | Granular Stage O2 preference: festivals suppressed while vrats delivered. |
| `devotee-quiet-hours-conflict` | hindu | Asia/Kolkata | F:Y, V:Y | 0 | 0 | Suppressed 100% because chosen reminder time falls in quiet hours. |
| `devotee-account-deleting` | hindu | Asia/Kolkata | F:Y, V:Y | 0 | 0 | Suppressed 100% due to pending deletion. |
| `devotee-sikh-punjab` | sikh | Asia/Kolkata | F:Y, V:N | 0 | 2 | Granular Stage O2 preference: vrats suppressed while festivals delivered. |
| `devotee-jain-gujarat` | jain | Asia/Kolkata | F:Y, V:Y | 0 | 2 | Parity verified. |
| `devotee-buddhist-ladakh` | buddhist | Asia/Kolkata | F:Y, V:N | 0 | 2 | Granular Stage O2 preference: vrats suppressed while festivals delivered. |
| `devotee-legacy-unset` | hindu | Asia/Kolkata | F:Y, V:Y | 0 | 10 | Parity verified. |

## 3. Canonical Observances in Evaluation Window

| Observance | Slug | Date | Category | Audience | Legacy Sent | Scheduled Candidates | Series Eligibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🌙 Karva Chauth | `karva-chauth` | 2026-10-28 | vrat | female | 0 | 6 | ✅ Reviewed & Complete |
| 🪔 Ahoi Ashtami | `ahoi-ashtami` | 2026-11-01 | vrat | female | 0 | 16 | ✅ Reviewed & Complete |
| 🌾 Rama Ekadashi | `ekadashi` | 2026-11-05 | vrat | general | 4 | 28 | ✅ Reviewed & Complete |
| 🪙 Dhanteras | `dhanteras` | 2026-11-06 | major | general | 2 | 18 | ✅ Reviewed & Complete |
| 🪔 Diwali | `diwali` | 2026-11-08 | major | general | 2 | 18 | ✅ Reviewed & Complete |
| ⛰️ Govardhan Puja | `govardhan-puja` | 2026-11-09 | major | general | 2 | 18 | ✅ Reviewed & Complete |
| 🌸 Bhai Dooj | `bhai-dooj` | 2026-11-10 | major | general | 2 | 18 | ✅ Reviewed & Complete |
| 🌅 Chhath Puja | `chhath-puja` | 2026-11-15 | regional | general | 2 | 18 | ✅ Reviewed & Complete |
| 🌾 Devaprabodhini Ekadashi | `ekadashi` | 2026-11-20 | vrat | general | 4 | 28 | ✅ Reviewed & Complete |
| ☬ Guru Nanak Jayanti | `guru-nanak-jayanti` | 2026-11-24 | major | general | 0 | 2 | ✅ Reviewed & Complete |
| 🌕 Kartik Purnima | `purnima-vrat` | 2026-11-24 | vrat | general | 2 | 14 | ✅ Reviewed & Complete |
| 🪔 Mahavira Nirvana | `mahavira-nirvana` | 2026-11-08 | major | general | 0 | 2 | ✅ Reviewed & Complete |
| ☸️ Kathina Celebration | `kathina` | 2026-11-24 | major | general | 0 | 2 | ✅ Reviewed & Complete |
| 🔱 Navratri Incomplete Day | `navratri-day-incomplete` | 2026-10-15 | major | general | 0 | 0 | ⚠️ Incomplete (Suppressed) |

## 4. Structured Exclusions & Suppressions

| Structured Suppression Code | Count | Architectural Rationale |
| :--- | :--- | :--- |
| `audience_not_applicable` | 10 | Women-focused vrat audience qualification (male devotees excluded) |
| `tradition_not_applicable` | 100 | Observance tradition does not match devotee preference (e.g. Jain vs Sikh) |
| `incomplete_series` | 13 | Multi-day series has missing or unreviewed siblings (Rule 2 & 6) |
| `preference_disabled_vrat` | 8 | Devotee explicitly opted out of this specific observance category |
| `preference_disabled_tithi` | 18 | Devotee explicitly opted out of this specific observance category |
| `preference_disabled_festival` | 8 | Devotee explicitly opted out of this specific observance category |
| `quiet_hours_conflict` | 26 | Devotee reminder time intersects configured quiet window |
| `account_deletion_pending` | 1 | Devotee account deletion is pending |

## 5. Cutover Readiness (Not Established by Fixture Simulation)

- [ ] Compare both pipelines against the same representative, privacy-safe database snapshot.
- [ ] Run a time-bounded live shadow cohort and retain raw candidate/legacy outcomes, including failures and duplicate keys.
- [ ] Verify cron deployment, Vault secret resolution, dispatch preferences, and rollback on the deployed environment.
- [ ] Obtain product/calendar review of scope matching and opt-in defaults before enabling categories.
