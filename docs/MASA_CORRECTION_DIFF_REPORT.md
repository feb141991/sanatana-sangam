# Masa Correction Diff Report

This report quantifies and segregates the date shifts resulting from month name corrections (D1) and Adhika month observations (D2) over the years 2026–2028.

## Adhika Month Verification (2026)

Authoritative lunar month determination for May/June 2026 using the corrected engine path:

- **Month Name**: `Adhika Jyeshtha`
- **Month Start (UTC)**: `2026-05-16T20:01:11.581Z`
- **Month End (UTC)**: `2026-06-15T02:54:15.863Z`
- **Sankranti Count in Interval**: `0`
- **Is Adhika**: `true`

*Evidence*: Since the astronomical boundaries of the Amanta month contain exactly `0` solar sankrantis, it is classified as an intercalary (**Adhika**) month, taking the name of the following normal month (`Jyeshtha`).

---

## Year 2026

### Summary Metrics
- **Total Legacy Observances**: 103
- **Total Corrected Observances**: 113
- **Unchanged Dates**: 66
- **Shifted Dates**: 33
- **Inserted Dates**: 14
- **Removed Dates**: 4
- **Average Absolute Shift**: 26.9 days
- **Maximum Absolute Shift**: 30 days
- **First Changed Date**: 2026-02-13
- **Last Changed Date**: 2026-12-24

### Movement Classification Summary
| Classification | Count (Moved Rows) | Rationale |
| :--- | :--- | :--- |
| **D1_CORRECTION** | 11 | Date moved purely due to month-name correction shifting the calendar window. |
| **ADHIKA_POLICY** | 0 | Date moved purely due to the Adhika month selection policy. |
| **BOTH** | 2 | Date moved due to a combination of month-name correction and Adhika selection policy. |
| **UNEXPLAINED** | 6 | Movements not matching D1 shift or Adhika policy bounds (shipped findings). |
| **NEEDS_MUHURTA_EVAL** | 32 | Muhurta/moonrise-dependent rules. Masa correction shifts these rows but the final date must be set by the condition evaluator (see ENGINE_RECONCILIATION_REPORT.md). |

### Detailed Shifts

| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `vijaya-ekadashi` | — | 2026-02-13 | — | **INSERTED** | `UNEXPLAINED` |
| `amalaki-ekadashi` | — | 2026-02-27 | — | **INSERTED** | `UNEXPLAINED` |
| `ram-navami` | 2026-03-27 | 2026-03-26 | -1 | **SHIFTED** | `D1_CORRECTION` |
| `kamada-ekadashi` | — | 2026-03-29 | — | **INSERTED** | `UNEXPLAINED` |
| `papmochani-ekadashi` | — | 2026-04-13 | — | **INSERTED** | `UNEXPLAINED` |
| `apara-ekadashi` | — | 2026-05-13 | — | **INSERTED** | `BOTH` |
| `nirjala-ekadashi` | — | 2026-06-25 | — | **INSERTED** | `BOTH` |
| `pradosh-vrat` | 2026-05-29 | 2026-06-27 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-05-31 | 2026-06-29 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-06-13 | 2026-07-12 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-06-15 | 2026-07-14 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `devshayani-ekadashi` | — | 2026-07-25 | — | **INSERTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-06-27 | 2026-07-27 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-06-29 | 2026-07-29 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `kamika-ekadashi` | — | 2026-08-09 | — | **INSERTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-07-12 | 2026-08-11 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-07-14 | 2026-08-12 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `shravana-putrada-ekadashi` | — | 2026-08-23 | — | **INSERTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-07-27 | 2026-08-26 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `raksha-bandhan` | 2026-07-29 | 2026-08-28 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `purnima-vrat` | 2026-07-29 | 2026-08-28 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `krishna-janmashtami` | 2026-08-06 | 2026-09-04 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `krishna-janmashtami` | 2026-08-06 | 2026-09-04 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `aja-ekadashi` | — | 2026-09-07 | — | **INSERTED** | `D1_CORRECTION` |
| `paryushana-parva-begins` | 2026-08-10 | 2026-09-08 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-08-11 | 2026-09-09 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-08-12 | 2026-09-11 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `ganesh-chaturthi` | 2026-09-15 | 2026-09-14 | -1 | **SHIFTED** | `UNEXPLAINED` |
| `samvatsari-paryushana-ends` | 2026-09-16 | 2026-09-15 | -1 | **SHIFTED** | `UNEXPLAINED` |
| `parivartini-ekadashi` | — | 2026-09-22 | — | **INSERTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-08-25 | 2026-09-24 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-08-28 | 2026-09-26 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-09-09 | 2026-10-08 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-09-11 | 2026-10-10 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-09-24 | 2026-10-24 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-09-26 | 2026-10-26 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `rama-ekadashi` | — | 2026-11-05 | — | **INSERTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-10-08 | 2026-11-07 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-10-10 | 2026-11-09 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `devutthana-ekadashi` | — | 2026-11-21 | — | **INSERTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-10-24 | 2026-11-22 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-10-26 | 2026-11-24 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `utpanna-ekadashi` | — | 2026-12-04 | — | **INSERTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-11-07 | 2026-12-06 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-12-06 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-11-09 | 2026-12-08 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-12-08 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-11-22 | 2026-12-22 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-12-22 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-11-24 | 2026-12-24 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-12-24 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |

---

## Year 2027

### Summary Metrics
- **Total Legacy Observances**: 98
- **Total Corrected Observances**: 115
- **Unchanged Dates**: 95
- **Shifted Dates**: 3
- **Inserted Dates**: 17
- **Removed Dates**: 0
- **Average Absolute Shift**: 29.7 days
- **Maximum Absolute Shift**: 30 days
- **First Changed Date**: 2027-01-03
- **Last Changed Date**: 2027-11-24

### Movement Classification Summary
| Classification | Count (Moved Rows) | Rationale |
| :--- | :--- | :--- |
| **D1_CORRECTION** | 20 | Date moved purely due to month-name correction shifting the calendar window. |
| **ADHIKA_POLICY** | 0 | Date moved purely due to the Adhika month selection policy. |
| **BOTH** | 0 | Date moved due to a combination of month-name correction and Adhika selection policy. |
| **UNEXPLAINED** | 0 | Movements not matching D1 shift or Adhika policy bounds (shipped findings). |
| **NEEDS_MUHURTA_EVAL** | 0 | Muhurta/moonrise-dependent rules. Masa correction shifts these rows but the final date must be set by the condition evaluator (see ENGINE_RECONCILIATION_REPORT.md). |

### Detailed Shifts

| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `saphala-ekadashi` | — | 2027-01-03 | — | **INSERTED** | `D1_CORRECTION` |
| `vijaya-ekadashi` | — | 2027-03-04 | — | **INSERTED** | `D1_CORRECTION` |
| `amalaki-ekadashi` | — | 2027-03-18 | — | **INSERTED** | `D1_CORRECTION` |
| `holi` | — | 2027-03-22 | — | **INSERTED** | `D1_CORRECTION` |
| `holla-mohalla` | — | 2027-03-23 | — | **INSERTED** | `D1_CORRECTION` |
| `ram-navami` | 2027-03-17 | 2027-04-15 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `kamada-ekadashi` | — | 2027-04-17 | — | **INSERTED** | `D1_CORRECTION` |
| `mahavir-jayanti` | 2027-03-20 | 2027-04-19 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `papmochani-ekadashi` | — | 2027-05-02 | — | **INSERTED** | `D1_CORRECTION` |
| `apara-ekadashi` | — | 2027-06-01 | — | **INSERTED** | `D1_CORRECTION` |
| `nirjala-ekadashi` | — | 2027-06-14 | — | **INSERTED** | `D1_CORRECTION` |
| `devshayani-ekadashi` | — | 2027-07-14 | — | **INSERTED** | `D1_CORRECTION` |
| `kamika-ekadashi` | — | 2027-07-30 | — | **INSERTED** | `D1_CORRECTION` |
| `shravana-putrada-ekadashi` | — | 2027-08-12 | — | **INSERTED** | `D1_CORRECTION` |
| `raksha-bandhan` | 2027-07-18 | 2027-08-17 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `aja-ekadashi` | — | 2027-08-28 | — | **INSERTED** | `D1_CORRECTION` |
| `parivartini-ekadashi` | — | 2027-09-11 | — | **INSERTED** | `D1_CORRECTION` |
| `rama-ekadashi` | — | 2027-10-25 | — | **INSERTED** | `D1_CORRECTION` |
| `devutthana-ekadashi` | — | 2027-11-10 | — | **INSERTED** | `D1_CORRECTION` |
| `utpanna-ekadashi` | — | 2027-11-24 | — | **INSERTED** | `D1_CORRECTION` |

---

## Year 2028

### Summary Metrics
- **Total Legacy Observances**: 102
- **Total Corrected Observances**: 117
- **Unchanged Dates**: 92
- **Shifted Dates**: 10
- **Inserted Dates**: 15
- **Removed Dates**: 0
- **Average Absolute Shift**: 20.7 days
- **Maximum Absolute Shift**: 30 days
- **First Changed Date**: 2028-02-08
- **Last Changed Date**: 2028-12-12

### Movement Classification Summary
| Classification | Count (Moved Rows) | Rationale |
| :--- | :--- | :--- |
| **D1_CORRECTION** | 17 | Date moved purely due to month-name correction shifting the calendar window. |
| **ADHIKA_POLICY** | 0 | Date moved purely due to the Adhika month selection policy. |
| **BOTH** | 0 | Date moved due to a combination of month-name correction and Adhika selection policy. |
| **UNEXPLAINED** | 0 | Movements not matching D1 shift or Adhika policy bounds (shipped findings). |
| **NEEDS_MUHURTA_EVAL** | 8 | Muhurta/moonrise-dependent rules. Masa correction shifts these rows but the final date must be set by the condition evaluator (see ENGINE_RECONCILIATION_REPORT.md). |

### Detailed Shifts

| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pradosh-vrat` | 2028-02-09 | 2028-02-08 | -1 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vijaya-ekadashi` | — | 2028-02-20 | — | **INSERTED** | `D1_CORRECTION` |
| `amalaki-ekadashi` | — | 2028-03-07 | — | **INSERTED** | `D1_CORRECTION` |
| `ram-navami` | 2028-04-04 | 2028-04-03 | -1 | **SHIFTED** | `D1_CORRECTION` |
| `kamada-ekadashi` | — | 2028-04-06 | — | **INSERTED** | `D1_CORRECTION` |
| `papmochani-ekadashi` | — | 2028-04-20 | — | **INSERTED** | `D1_CORRECTION` |
| `apara-ekadashi` | — | 2028-05-20 | — | **INSERTED** | `D1_CORRECTION` |
| `nirjala-ekadashi` | — | 2028-06-03 | — | **INSERTED** | `D1_CORRECTION` |
| `devshayani-ekadashi` | — | 2028-07-02 | — | **INSERTED** | `D1_CORRECTION` |
| `guru-purnima` | 2028-08-05 | 2028-07-06 | -30 | **SHIFTED** | `D1_CORRECTION` |
| `kamika-ekadashi` | — | 2028-07-18 | — | **INSERTED** | `D1_CORRECTION` |
| `shravana-putrada-ekadashi` | — | 2028-08-01 | — | **INSERTED** | `D1_CORRECTION` |
| `aja-ekadashi` | — | 2028-08-16 | — | **INSERTED** | `D1_CORRECTION` |
| `parivartini-ekadashi` | — | 2028-08-30 | — | **INSERTED** | `D1_CORRECTION` |
| `rama-ekadashi` | — | 2028-10-14 | — | **INSERTED** | `D1_CORRECTION` |
| `dhanteras` | 2028-11-13 | 2028-10-15 | -29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `diwali` | 2028-11-15 | 2028-10-17 | -29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `bandhi-chhor-divas` | 2028-11-15 | 2028-10-17 | -29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `govardhan-puja` | 2028-11-16 | 2028-10-18 | -29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `bhai-dooj` | 2028-11-17 | 2028-10-19 | -29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `devutthana-ekadashi` | — | 2028-10-28 | — | **INSERTED** | `D1_CORRECTION` |
| `guru-nanak-gurpurab` | 2028-12-01 | 2028-11-02 | -29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `utpanna-ekadashi` | — | 2028-11-13 | — | **INSERTED** | `D1_CORRECTION` |
| `purnima-vrat` | 2028-12-02 | 2028-12-01 | -1 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `saphala-ekadashi` | — | 2028-12-12 | — | **INSERTED** | `D1_CORRECTION` |

---

## Critical Human Review: BOTH Shifts (2026)

> [!IMPORTANT]
> The following rules are Jyeshtha-based in 2026. Their dates changed due to a combined impact of correcting their month name (D1) and selecting the Nija Jyeshtha month over the Adhika month (D2 Adhika Policy). These MUST be individually approved by council review:

| Rule Slug | Legacy Date | Corrected Date | Shift (Days) | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `nirjala-ekadashi` | — | 2026-06-25 | — | Rule maps to Amanta `Jyeshtha`. Shifts by null days due to combination of month name correction and Adhika month selection policy (`nija`). |
| `apara-ekadashi` | — | 2026-05-13 | — | Rule maps to Amanta `Jyeshtha`. Shifts by null days due to combination of month name correction and Adhika month selection policy (`nija`). |

---

## Programmatic Findings: UNEXPLAINED Shifts

> [!CAUTION]
> **UNEXPLAINED SHIFTS DETECTED**: The following date movements do not fit standard month or Adhika boundary shifts. This represents structural regressions:

| Year | Rule Slug | Legacy Date | Corrected Date | Shift (Days) |
| :--- | :--- | :--- | :--- | :--- |
| 2026 | `ganesh-chaturthi` | 2026-09-15 | 2026-09-14 | -1 |
| 2026 | `samvatsari-paryushana-ends` | 2026-09-16 | 2026-09-15 | -1 |
| 2026 | `kamada-ekadashi` | — | 2026-03-29 | — |
| 2026 | `amalaki-ekadashi` | — | 2026-02-27 | — |
| 2026 | `papmochani-ekadashi` | — | 2026-04-13 | — |
| 2026 | `vijaya-ekadashi` | — | 2026-02-13 | — |

---

## Rules Actually Depending on Unratified [S] Policy in 2026

Out of all lunar rules, only the following rules have calculated dates in 2026 that actually vary when their `adhika_policy` is modified. This is the precise minimal list needing council ratification:

| Rule Slug | Actual Policy | Alternative Policy Tested | Alternate Date(s) | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `vasant-panchami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-01-23` to `None` |
| `maha-shivaratri` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-02-15` to `None` |
| `holi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-03` to `None` |
| `gudi-padwa` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-20` to `None` |
| `chaitra-navratri-begins` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-20` to `None` |
| `ugadi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-20` to `None` |
| `ram-navami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-27` to `None` |
| `hanuman-jayanti` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-04-02` to `None` |
| `akshaya-tritiya` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-04-20` to `None` |
| `narasimha-jayanti` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-04-30` to `None` |
| `shani-jayanti` | `nija` | `adhika` | `2026-06-15` | Changing policy to `adhika` shifts the date from `2026-07-14` to `2026-06-15` |
| `shani-jayanti` | `nija` | `both` | `2026-06-15, 2026-07-14` | Changing policy to `both` shifts the date from `2026-07-14` to `2026-06-15, 2026-07-14` |
| `vat-savitri-amavasya` | `nija` | `adhika` | `2026-06-15` | Changing policy to `adhika` shifts the date from `2026-07-14` to `2026-06-15` |
| `vat-savitri-amavasya` | `nija` | `both` | `2026-06-15, 2026-07-14` | Changing policy to `both` shifts the date from `2026-07-14` to `2026-06-15, 2026-07-14` |
| `vat-savitri-purnima` | `nija` | `adhika` | `2026-05-31` | Changing policy to `adhika` shifts the date from `2026-06-29` to `2026-05-31` |
| `vat-savitri-purnima` | `nija` | `both` | `2026-05-31, 2026-06-29` | Changing policy to `both` shifts the date from `2026-06-29` to `2026-05-31, 2026-06-29` |
| `jagannath-rath-yatra` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-07-16` to `None` |
| `gupt-navratri-ashadha-begins` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-07-15` to `None` |
| `guru-purnima` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-07-29` to `None` |
| `nag-panchami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-17` to `None` |
| `raksha-bandhan` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-28` to `None` |
| `krishna-janmashtami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-04` to `None` |
| `ganesh-chaturthi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-15` to `None` |
| `onam` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-26` to `None` |
| `hartalika-teej` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-14` to `None` |
| `navratri-begins` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-10-11` to `None` |
| `karva-chauth` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-11-28` to `None` |
| `diwali` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-07` to `None` |
| `chhath-puja` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-11-15` to `None` |
| `vivah-panchami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-14` to `None` |
| `gita-jayanti` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-20` to `None` |
| `vaikunta-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-20` to `None` |
| `kamada-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-29` to `None` |
| `nirjala-ekadashi` | `nija` | `adhika` | `2026-05-26, 2026-05-27` | Changing policy to `adhika` shifts the date from `2026-06-25` to `2026-05-26, 2026-05-27` |
| `nirjala-ekadashi` | `nija` | `both` | `2026-05-26, 2026-05-27, 2026-06-25` | Changing policy to `both` shifts the date from `2026-06-25` to `2026-05-26, 2026-05-27, 2026-06-25` |
| `devshayani-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-07-25` to `None` |
| `shravana-putrada-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-23` to `None` |
| `parivartini-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-22` to `None` |
| `devutthana-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-11-21` to `None` |
| `amalaki-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-02-27` to `None` |
| `papmochani-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-04-13` to `None` |
| `apara-ekadashi` | `nija` | `adhika` | `2026-06-11` | Changing policy to `adhika` shifts the date from `2026-07-11` to `2026-06-11` |
| `apara-ekadashi` | `nija` | `both` | `2026-06-11, 2026-07-11` | Changing policy to `both` shifts the date from `2026-07-11` to `2026-06-11, 2026-07-11` |
| `kamika-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-07` to `None` |
| `aja-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-10-06` to `None` |
| `rama-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-04` to `None` |
| `saphala-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-01-14` to `None` |
| `vijaya-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-15` to `None` |
| `gupt-navratri-magha-begins` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-01-19` to `None` |
| `guru-ravidas-jayanti` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-02-01` to `None` |
| `losar-tibetan-new-year` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-02-18` to `None` |
| `magha-puja` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-02-01` to `None` |
| `vesak-buddha-purnima` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-05-01` to `None` |
| `asalha-puja` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-07-29` to `None` |
| `vassa-begins-rains-retreat` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-07-30` to `None` |
| `ullambana-ancestor-day` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-28` to `None` |
| `pavarana-end-of-vassa` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-10-26` to `None` |
| `kathina` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-10-27` to `None` |
| `mahavir-jayanti` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-03-31` to `None` |
| `akshaya-tritiya-jain` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-04-20` to `None` |
| `paryushana-parva-begins` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-08` to `None` |
| `samvatsari-paryushana-ends` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-16` to `None` |
| `das-lakshana-dharma-begins` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-16` to `None` |
| `ekadashi` | `both` | `nija` | `2026-01-14, 2026-01-29, 2026-02-13, 2026-02-27, 2026-03-15, 2026-03-29, 2026-04-13, 2026-04-27, 2026-05-13, 2026-06-25, 2026-07-11, 2026-07-25, 2026-08-09, 2026-08-23, 2026-09-07, 2026-09-22, 2026-10-06, 2026-10-22, 2026-11-05, 2026-11-21, 2026-12-04, 2026-12-20` | Changing policy to `nija` shifts the date from `2026-01-14, 2026-01-29, 2026-02-13, 2026-02-27, 2026-03-15, 2026-03-29, 2026-04-13, 2026-04-27, 2026-05-13, 2026-05-26, 2026-06-11, 2026-06-25, 2026-07-11, 2026-07-25, 2026-08-09, 2026-08-23, 2026-09-07, 2026-09-22, 2026-10-06, 2026-10-22, 2026-11-05, 2026-11-21, 2026-12-04, 2026-12-20` to `2026-01-14, 2026-01-29, 2026-02-13, 2026-02-27, 2026-03-15, 2026-03-29, 2026-04-13, 2026-04-27, 2026-05-13, 2026-06-25, 2026-07-11, 2026-07-25, 2026-08-09, 2026-08-23, 2026-09-07, 2026-09-22, 2026-10-06, 2026-10-22, 2026-11-05, 2026-11-21, 2026-12-04, 2026-12-20` |
| `ekadashi` | `both` | `adhika` | `2026-05-26, 2026-06-11` | Changing policy to `adhika` shifts the date from `2026-01-14, 2026-01-29, 2026-02-13, 2026-02-27, 2026-03-15, 2026-03-29, 2026-04-13, 2026-04-27, 2026-05-13, 2026-05-26, 2026-06-11, 2026-06-25, 2026-07-11, 2026-07-25, 2026-08-09, 2026-08-23, 2026-09-07, 2026-09-22, 2026-10-06, 2026-10-22, 2026-11-05, 2026-11-21, 2026-12-04, 2026-12-20` to `2026-05-26, 2026-06-11` |
| `sankashti-chaturthi` | `both` | `nija` | `2026-01-07, 2026-02-05, 2026-03-07, 2026-04-06, 2026-05-05, 2026-07-04, 2026-08-02, 2026-09-01, 2026-09-30, 2026-10-29, 2026-11-28, 2026-12-27` | Changing policy to `nija` shifts the date from `2026-01-07, 2026-02-05, 2026-03-07, 2026-04-06, 2026-05-05, 2026-06-04, 2026-07-04, 2026-08-02, 2026-09-01, 2026-09-30, 2026-10-29, 2026-11-28, 2026-12-27` to `2026-01-07, 2026-02-05, 2026-03-07, 2026-04-06, 2026-05-05, 2026-07-04, 2026-08-02, 2026-09-01, 2026-09-30, 2026-10-29, 2026-11-28, 2026-12-27` |
| `sankashti-chaturthi` | `both` | `adhika` | `2026-06-04` | Changing policy to `adhika` shifts the date from `2026-01-07, 2026-02-05, 2026-03-07, 2026-04-06, 2026-05-05, 2026-06-04, 2026-07-04, 2026-08-02, 2026-09-01, 2026-09-30, 2026-10-29, 2026-11-28, 2026-12-27` to `2026-06-04` |
| `shravan-somvar` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-17, 2026-08-24, 2026-08-31, 2026-09-07` to `None` |
| `mangala-gauri-vrat` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-18, 2026-08-25, 2026-09-01, 2026-09-08` to `None` |
| `yogini-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-09` to `None` |

### Relative Rules Affected by the Above Base Policies

The following rules do not declare their own policy but inherit the date shift because they are relative to the rules above:

- Base `holi` determines relative rules: `holla-mohalla`
- Base `chaitra-navratri-begins` determines relative rules: `chintpurni-mata-chaitra-navratri`
- Base `navratri-begins` determines relative rules: `mahalaya-amavasya`, `chintpurni-mata-sharad-navratri`, `dussehra`
- Base `diwali` determines relative rules: `dhanteras`, `govardhan-puja`, `bhai-dooj`, `kartik-purnima`, `bandhi-chhor-divas`, `guru-nanak-gurpurab`, `sangha-day-loy-krathong`, `jain-new-year-pratipada`, `jain-diwali-nirvana-ladnun`, `kartik-purnima-jain`

