# Masa Correction Diff Report

This report quantifies and segregates the date shifts resulting from month name corrections (D1) and Adhika month observations (D2) over the years 2026–2028.

## Adhika Month Verification (2026)

Authoritative lunar month determination for May/June 2026 using the corrected engine path:

- **Month Name**: `Adhika Jyeshtha`
- **Month Start (UTC)**: `2026-05-16T20:01:57.563Z`
- **Month End (UTC)**: `2026-06-15T02:54:49.951Z`
- **Sankranti Count in Interval**: `0`
- **Is Adhika**: `true`

*Evidence*: Since the astronomical boundaries of the Amanta month contain exactly `0` solar sankrantis, it is classified as an intercalary (**Adhika**) month, taking the name of the following normal month (`Jyeshtha`).

---

## Year 2026

### Summary Metrics
- **Total Legacy Observances**: 180
- **Total Corrected Observances**: 174
- **Unchanged Dates**: 105
- **Shifted Dates**: 69
- **Inserted Dates**: 0
- **Removed Dates**: 6
- **Average Absolute Shift**: 29.7 days
- **Maximum Absolute Shift**: 59 days
- **First Changed Date**: 2026-02-16
- **Last Changed Date**: 2026-12-24

### Movement Classification Summary
| Classification | Count (Moved Rows) | Rationale |
| :--- | :--- | :--- |
| **D1_CORRECTION** | 19 | Date moved purely due to month-name correction shifting the calendar window. |
| **ADHIKA_POLICY** | 0 | Date moved purely due to the Adhika month selection policy. |
| **BOTH** | 3 | Date moved due to a combination of month-name correction and Adhika selection policy. |
| **UNEXPLAINED** | 0 | Movements not matching D1 shift or Adhika policy bounds (shipped findings). |
| **NEEDS_MUHURTA_EVAL** | 53 | Muhurta/moonrise-dependent rules. Masa correction shifts these rows but the final date must be set by the condition evaluator (see ENGINE_RECONCILIATION_REPORT.md). |

### Detailed Shifts

| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `maha-shivaratri` | 2026-02-15 | 2026-02-16 | +1 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vinayaka-chaturthi` | 2026-05-20 | 2026-06-18 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-05-29 | 2026-06-27 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vat-savitri-purnima` | 2026-05-31 | 2026-06-29 | +29 | **SHIFTED** | `BOTH` |
| `purnima-vrat` | 2026-05-31 | 2026-06-29 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-06-13 | 2026-07-12 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `shani-jayanti` | 2026-05-16 | 2026-07-14 | +59 | **SHIFTED** | `BOTH` |
| `vat-savitri-amavasya` | 2026-05-16 | 2026-07-14 | +59 | **SHIFTED** | `BOTH` |
| `amavasya-vrat` | 2026-06-15 | 2026-07-14 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `jagannath-rath-yatra` | 2026-06-16 | 2026-07-16 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `vinayaka-chaturthi` | 2026-06-18 | 2026-07-17 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-06-27 | 2026-07-27 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-06-29 | 2026-07-29 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-07-12 | 2026-08-11 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-07-14 | 2026-08-12 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vinayaka-chaturthi` | 2026-07-17 | 2026-08-16 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `shravan-somvar` | 2026-07-20 | 2026-08-17 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2026-08-17 | — | — | **REMOVED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2026-07-21 | 2026-08-18 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2026-07-27 | 2026-08-24 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-07-27 | 2026-08-25 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `mangala-gauri-vrat` | 2026-07-28 | 2026-08-25 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `guru-purnima` | 2026-07-29 | 2026-08-28 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `raksha-bandhan` | 2026-07-29 | 2026-08-28 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `ullambana-ancestor-day` | 2026-07-29 | 2026-08-28 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `purnima-vrat` | 2026-07-29 | 2026-08-28 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `shravan-somvar` | 2026-08-03 | 2026-08-31 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2026-08-04 | 2026-09-01 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `krishna-janmashtami` | 2026-08-06 | 2026-09-04 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `krishna-janmashtami` | 2026-08-06 | 2026-09-04 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `shravan-somvar` | 2026-08-10 | 2026-09-07 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `paryushana-parva-begins` | 2026-08-10 | 2026-09-08 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2026-08-11 | 2026-09-08 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-08-11 | 2026-09-09 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-08-12 | 2026-09-11 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vinayaka-chaturthi` | 2026-08-16 | 2026-09-15 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `onam` | 2026-08-26 | 2026-09-23 | +28 | **SHIFTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-08-25 | 2026-09-24 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-08-28 | 2026-09-26 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-09-09 | 2026-10-08 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-09-11 | 2026-10-10 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vinayaka-chaturthi` | 2026-09-15 | 2026-10-14 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-09-24 | 2026-10-24 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pavarana-end-of-vassa` | 2026-09-26 | 2026-10-26 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `purnima-vrat` | 2026-09-26 | 2026-10-26 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `kathina` | 2026-09-27 | 2026-10-27 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-10-08 | 2026-11-07 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-10-10 | 2026-11-09 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vinayaka-chaturthi` | 2026-10-14 | 2026-11-13 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-10-24 | 2026-11-22 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-10-26 | 2026-11-24 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `karva-chauth` | 2026-10-29 | 2026-11-28 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `dhanteras` | 2026-11-06 | 2026-12-05 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-11-07 | 2026-12-06 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-12-06 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |
| `diwali` | 2026-11-08 | 2026-12-07 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `bandhi-chhor-divas` | 2026-11-08 | 2026-12-07 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `jain-diwali-nirvana-ladnun` | 2026-11-08 | 2026-12-07 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `govardhan-puja` | 2026-11-09 | 2026-12-08 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `jain-new-year-pratipada` | 2026-11-09 | 2026-12-08 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-11-09 | 2026-12-08 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `amavasya-vrat` | 2026-12-08 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |
| `bhai-dooj` | 2026-11-10 | 2026-12-09 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vinayaka-chaturthi` | 2026-11-13 | 2026-12-13 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `vinayaka-chaturthi` | 2026-12-13 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |
| `gita-jayanti` | 2026-11-21 | 2026-12-20 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `vaikunta-ekadashi` | 2026-11-21 | 2026-12-20 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `pradosh-vrat` | 2026-11-22 | 2026-12-22 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `pradosh-vrat` | 2026-12-22 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |
| `kartik-purnima` | 2026-11-24 | 2026-12-23 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `guru-nanak-gurpurab` | 2026-11-24 | 2026-12-23 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `sangha-day-loy-krathong` | 2026-11-24 | 2026-12-23 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `kartik-purnima-jain` | 2026-11-24 | 2026-12-23 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-11-24 | 2026-12-24 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `purnima-vrat` | 2026-12-24 | — | — | **REMOVED** | `NEEDS_MUHURTA_EVAL` |

---

## Year 2027

### Summary Metrics
- **Total Legacy Observances**: 179
- **Total Corrected Observances**: 180
- **Unchanged Dates**: 140
- **Shifted Dates**: 38
- **Inserted Dates**: 2
- **Removed Dates**: 1
- **Average Absolute Shift**: 26.0 days
- **Maximum Absolute Shift**: 30 days
- **First Changed Date**: 2027-02-21
- **Last Changed Date**: 2027-12-13

### Movement Classification Summary
| Classification | Count (Moved Rows) | Rationale |
| :--- | :--- | :--- |
| **D1_CORRECTION** | 26 | Date moved purely due to month-name correction shifting the calendar window. |
| **ADHIKA_POLICY** | 0 | Date moved purely due to the Adhika month selection policy. |
| **BOTH** | 0 | Date moved due to a combination of month-name correction and Adhika selection policy. |
| **UNEXPLAINED** | 0 | Movements not matching D1 shift or Adhika policy bounds (shipped findings). |
| **NEEDS_MUHURTA_EVAL** | 15 | Muhurta/moonrise-dependent rules. Masa correction shifts these rows but the final date must be set by the condition evaluator (see ENGINE_RECONCILIATION_REPORT.md). |

### Detailed Shifts

| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `guru-ravidas-jayanti` | 2027-01-22 | 2027-02-21 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `magha-puja` | 2027-01-22 | 2027-02-21 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `maha-shivaratri` | 2027-03-06 | 2027-03-07 | +1 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `holi` | — | 2027-03-22 | — | **INSERTED** | `D1_CORRECTION` |
| `holla-mohalla` | — | 2027-03-23 | — | **INSERTED** | `D1_CORRECTION` |
| `ram-navami` | 2027-03-17 | 2027-04-15 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `mahavir-jayanti` | 2027-03-20 | 2027-04-19 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `hanuman-jayanti` | 2027-03-22 | 2027-04-20 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `narasimha-jayanti` | 2027-04-19 | 2027-05-19 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `vesak-buddha-purnima` | 2027-04-20 | 2027-05-20 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `vat-savitri-purnima` | 2027-05-20 | 2027-06-18 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `shani-jayanti` | 2027-06-04 | 2027-07-04 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `vat-savitri-amavasya` | 2027-06-04 | 2027-07-04 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2027-07-20 | 2027-08-03 | +14 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2027-07-19 | 2027-08-09 | +21 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2027-07-27 | 2027-08-10 | +14 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2027-07-26 | 2027-08-16 | +21 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2027-08-16 | — | — | **REMOVED** | `D1_CORRECTION` |
| `guru-purnima` | 2027-07-18 | 2027-08-17 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `raksha-bandhan` | 2027-07-18 | 2027-08-17 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `ullambana-ancestor-day` | 2027-07-18 | 2027-08-17 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2027-08-03 | 2027-08-17 | +14 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2027-08-02 | 2027-08-23 | +21 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2027-08-10 | 2027-08-24 | +14 | **SHIFTED** | `D1_CORRECTION` |
| `krishna-janmashtami` | 2027-07-27 | 2027-08-25 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `krishna-janmashtami` | 2027-07-27 | 2027-08-25 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `paryushana-parva-begins` | 2027-07-30 | 2027-08-29 | +30 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2027-08-09 | 2027-08-30 | +21 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2027-08-17 | 2027-08-31 | +14 | **SHIFTED** | `D1_CORRECTION` |
| `karva-chauth` | 2027-10-19 | 2027-11-17 | +29 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `dhanteras` | 2027-10-26 | 2027-11-25 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `diwali` | 2027-10-28 | 2027-11-27 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `bandhi-chhor-divas` | 2027-10-28 | 2027-11-27 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `jain-diwali-nirvana-ladnun` | 2027-10-28 | 2027-11-27 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `govardhan-puja` | 2027-10-29 | 2027-11-28 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `jain-new-year-pratipada` | 2027-10-29 | 2027-11-28 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `bhai-dooj` | 2027-10-30 | 2027-11-29 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `kartik-purnima` | 2027-11-13 | 2027-12-13 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `guru-nanak-gurpurab` | 2027-11-13 | 2027-12-13 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `sangha-day-loy-krathong` | 2027-11-13 | 2027-12-13 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `kartik-purnima-jain` | 2027-11-13 | 2027-12-13 | +30 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |

---

## Year 2028

### Summary Metrics
- **Total Legacy Observances**: 181
- **Total Corrected Observances**: 179
- **Unchanged Dates**: 165
- **Shifted Dates**: 14
- **Inserted Dates**: 0
- **Removed Dates**: 2
- **Average Absolute Shift**: 14.6 days
- **Maximum Absolute Shift**: 30 days
- **First Changed Date**: 2028-02-24
- **Last Changed Date**: 2028-08-17

### Movement Classification Summary
| Classification | Count (Moved Rows) | Rationale |
| :--- | :--- | :--- |
| **D1_CORRECTION** | 15 | Date moved purely due to month-name correction shifting the calendar window. |
| **ADHIKA_POLICY** | 0 | Date moved purely due to the Adhika month selection policy. |
| **BOTH** | 0 | Date moved due to a combination of month-name correction and Adhika selection policy. |
| **UNEXPLAINED** | 0 | Movements not matching D1 shift or Adhika policy bounds (shipped findings). |
| **NEEDS_MUHURTA_EVAL** | 1 | Muhurta/moonrise-dependent rules. Masa correction shifts these rows but the final date must be set by the condition evaluator (see ENGINE_RECONCILIATION_REPORT.md). |

### Detailed Shifts

| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `maha-shivaratri` | 2028-02-23 | 2028-02-24 | +1 | **SHIFTED** | `NEEDS_MUHURTA_EVAL` |
| `shani-jayanti` | 2028-05-24 | 2028-06-22 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `vat-savitri-amavasya` | 2028-05-24 | 2028-06-22 | +29 | **SHIFTED** | `D1_CORRECTION` |
| `asalha-puja` | 2028-08-05 | 2028-07-06 | -30 | **SHIFTED** | `D1_CORRECTION` |
| `vassa-begins-rains-retreat` | 2028-08-06 | 2028-07-07 | -30 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2028-07-17 | 2028-07-24 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2028-07-18 | 2028-07-25 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2028-07-24 | 2028-07-31 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2028-07-25 | 2028-08-01 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2028-07-31 | 2028-08-07 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2028-08-01 | 2028-08-08 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2028-08-07 | 2028-08-14 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `shravan-somvar` | 2028-08-14 | — | — | **REMOVED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2028-08-08 | 2028-08-15 | +7 | **SHIFTED** | `D1_CORRECTION` |
| `mangala-gauri-vrat` | 2028-08-15 | — | — | **REMOVED** | `D1_CORRECTION` |
| `paryushana-parva-begins` | 2028-07-19 | 2028-08-17 | +29 | **SHIFTED** | `D1_CORRECTION` |

---

## Critical Human Review: BOTH Shifts (2026)

> [!IMPORTANT]
> The following rules are Jyeshtha-based in 2026. Their dates changed due to a combined impact of correcting their month name (D1) and selecting the Nija Jyeshtha month over the Adhika month (D2 Adhika Policy). These MUST be individually approved by council review:

| Rule Slug | Legacy Date | Corrected Date | Shift (Days) | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `shani-jayanti` | 2026-05-16 | 2026-07-14 | +59 | Rule maps to Amanta `Jyeshtha`. Shifts by 59 days due to combination of month name correction and Adhika month selection policy (`nija`). |
| `vat-savitri-amavasya` | 2026-05-16 | 2026-07-14 | +59 | Rule maps to Amanta `Jyeshtha`. Shifts by 59 days due to combination of month name correction and Adhika month selection policy (`nija`). |
| `vat-savitri-purnima` | 2026-05-31 | 2026-06-29 | +29 | Rule maps to Amanta `Jyeshtha`. Shifts by 29 days due to combination of month name correction and Adhika month selection policy (`nija`). |

---

## Programmatic Findings: UNEXPLAINED Shifts

**Zero unexplained shifts detected.** All date movements align with month corrections or the 2026 Adhika Jyeshtha window.

---

## Rules Actually Depending on Unratified [S] Policy in 2026

Out of all lunar rules, only the following rules have calculated dates in 2026 that actually vary when their `adhika_policy` is modified. This is the precise minimal list needing council ratification:

| Rule Slug | Actual Policy | Alternative Policy Tested | Alternate Date(s) | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `vasant-panchami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-01-23` to `None` |
| `maha-shivaratri` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-02-16` to `None` |
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
| `guru-purnima` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-28` to `None` |
| `nag-panchami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-17` to `None` |
| `raksha-bandhan` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-08-28` to `None` |
| `krishna-janmashtami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-04` to `None` |
| `ganesh-chaturthi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-15` to `None` |
| `onam` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-23` to `None` |
| `hartalika-teej` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-09-14` to `None` |
| `navratri-begins` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-10-11` to `None` |
| `karva-chauth` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-11-28` to `None` |
| `diwali` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-07` to `None` |
| `chhath-puja` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-11-15` to `None` |
| `vivah-panchami` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-14` to `None` |
| `gita-jayanti` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-20` to `None` |
| `vaikunta-ekadashi` | `nija` | `adhika` | `None` | Changing policy to `adhika` shifts the date from `2026-12-20` to `None` |
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

### Relative Rules Affected by the Above Base Policies

The following rules do not declare their own policy but inherit the date shift because they are relative to the rules above:

- Base `holi` determines relative rules: `holla-mohalla`
- Base `chaitra-navratri-begins` determines relative rules: `chintpurni-mata-chaitra-navratri`
- Base `navratri-begins` determines relative rules: `mahalaya-amavasya`, `chintpurni-mata-sharad-navratri`, `dussehra`
- Base `diwali` determines relative rules: `dhanteras`, `govardhan-puja`, `bhai-dooj`, `kartik-purnima`, `bandhi-chhor-divas`, `guru-nanak-gurpurab`, `sangha-day-loy-krathong`, `jain-new-year-pratipada`, `jain-diwali-nirvana-ladnun`, `kartik-purnima-jain`

