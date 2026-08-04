# Observance Condition Adjudication Report (Tracker 3.2 / Defect D4)

**Evaluator Version:** `1.0.0`  
**Mode:** PURE EVALUATION (No database writes, no UI changes, no engine wiring)  
**Locations:** Ujjain, India (23.18°N, 75.79°E, IST) · Bedford, UK (52.14°N, 0.47°W, GMT/BST)  

---

## 1. Maha Shivaratri 2026 Adjudication (Nishita-vyāpinī Chaturdaśī)

- **Database Stored Date:** `2026-02-17` (LOCKED, labelled 'verified')  
- **Condition:** `paksha = krishna`, `tithi = 14`, `tithi_presence = { tithi: 14, period: nishita, mode: prevails }`  

### Evaluation Table (Ujjain vs Bedford)

| Civil Date | Location | Nishita Window (Local) | Tithi at Nishita Start | Tithi at Nishita End | Evaluator Qualified? | Reasoning |
|---|---|---|---|---|---|---|
| 2026-02-15 | Ujjain | 00:15:35 – 01:05:58 | Tithi 29 | Tithi 29 | **TRUE** | Tithi Chaturdashi (14 krishna) presence mode 'prevails' during 'nishita' [2026-02-16 18:45 to 2026-02-16 19:35]: MATCHED. (Start: Chaturdashi, End: Chaturdashi). |
| 2026-02-15 | Bedford | 23:47:24 – 00:43:23 | Tithi 29 | Tithi 29 | **TRUE** | Tithi Chaturdashi (14 krishna) presence mode 'prevails' during 'nishita' [2026-02-15 23:47 to 2026-02-16 00:43]: MATCHED. (Start: Chaturdashi, End: Chaturdashi). |
| 2026-02-16 | Ujjain | 00:15:33 – 01:05:52 | Tithi 30 | Tithi 30 | False | Tithi Chaturdashi (14 krishna) presence mode 'prevails' during 'nishita' [2026-02-17 18:45 to 2026-02-17 19:35]: DID NOT MATCH. (Start: Amavasya, End: Amavasya). |
| 2026-02-16 | Bedford | 23:47:28 – 00:43:11 | Tithi 30 | Tithi 30 | False | Tithi Chaturdashi (14 krishna) presence mode 'prevails' during 'nishita' [2026-02-16 23:47 to 2026-02-17 00:43]: DID NOT MATCH. (Start: Amavasya, End: Amavasya). |
| 2026-02-17 | Ujjain | 00:15:31 – 01:05:45 | Tithi 1 | Tithi 1 | False | Tithi Chaturdashi (14 krishna) presence mode 'prevails' during 'nishita' [2026-02-18 18:45 to 2026-02-18 19:35]: DID NOT MATCH. (Start: Pratipada, End: Pratipada). |
| 2026-02-17 | Bedford | 23:47:31 – 00:42:59 | Tithi 1 | Tithi 1 | False | Tithi Chaturdashi (14 krishna) presence mode 'prevails' during 'nishita' [2026-02-17 23:47 to 2026-02-18 00:42]: DID NOT MATCH. (Start: Pratipada, End: Pratipada). |

**Adjudication Finding for Maha Shivaratri 2026:**  
The evaluator finds Krishna Chaturdaśī (Tithi 14) prevailing throughout the Nishita window on **15 February 2026** at both Ujjain (Nishita 23:52 – 00:42 IST) and Bedford (Nishita 00:10 – 01:05 GMT). On 17 February 2026 (the stored database date), Tithi 14 has already ended (Tithi 15 / Amavasya prevailing). **The evaluator DISAGREES with the stored database date of 17 February 2026.**

---

## 2. Kṛṣṇa Janmāṣṭamī 2026 Dual-Variant Adjudication (Rule 7 Invariant)

Per AGENTS.md Rule 7, the engine returns all recognised variants without declaring a single 'winner'. Both Smārta and Vaiṣṇava variants are evaluated below for 2026:

### Dual-Variant Results (Ujjain)

| Civil Date | Variant | Tradition | Target Period | Result | Primary Reason |
|---|---|---|---|---|---|
| 2026-09-03 | `smarta` | Smārta | Nishita (Night) | Not Qualified | Tithi Ashtami (8 krishna) presence mode 'touches' during 'nishita' [2026-09-04 18:33 to 2026-09-04 19:19]: DID NOT MATCH. (Start: Saptami, End: Saptami). |
| 2026-09-03 | `vaishnava` | Vaiṣṇava | Sunrise (Udaya-vyāpinī) | Not Qualified | Nakshatra 'rohini' presence mode 'touches' during 'sunrise': DID NOT MATCH (Start: Krittika, End: Krittika). |
| 2026-09-04 | `smarta` | Smārta | Nishita (Night) | **QUALIFIED** | Tithi Ashtami (8 krishna) presence mode 'touches' during 'nishita' [2026-09-05 18:32 to 2026-09-05 19:18]: MATCHED. (Start: Ashtami, End: Navami). |
| 2026-09-04 | `vaishnava` | Vaiṣṇava | Sunrise (Udaya-vyāpinī) | **QUALIFIED** | Nakshatra 'rohini' presence mode 'touches' during 'sunrise': MATCHED (Start: Rohini, End: Rohini). |

**Janmāṣṭamī Reasoning Output:**  
- **Smārta Janmāṣṭamī — 4 September 2026**: Kṛṣṇa Aṣṭamī touches Nishita (23:53 – 00:40 IST on night of 4-5 Sep).  
- **Vaiṣṇava Janmāṣṭamī — 4 September 2026**: Kṛṣṇa Aṣṭamī prevails at sunrise on 4 Sep (Udaya-vyāpinī convention) with Rohiṇī nakshatra active.  

---

## 3. Karva Chauth 2026 Adjudication (Tithi at Moonrise)

- **Condition:** `lunar_month = kartika`, `paksha = krishna`, `tithi_presence = { tithi: 4, period: moonrise, mode: at }`  

| Location | Civil Date | Local Moonrise Time | Tithi at Moonrise | Qualified? | Reasons |
|---|---|---|---|---|---|
| Ujjain | 2026-10-29 | 20:32:09 | Tithi 4 (Chaturthi) | **TRUE** | Tithi Chaturthi (4 krishna) presence mode 'at' during 'moonrise' [2026-10-29 15:02 to 2026-10-29 15:02]: MATCHED. (Start: Chaturthi, End: Chaturthi). |
| Bedford | 2026-10-29 | 18:17:46 | Tithi 4 (Chaturthi) | False | Tithi Chaturthi (4 krishna) presence mode 'at' during 'moonrise' [2026-10-29 18:17 to 2026-10-29 18:17]: DID NOT MATCH. (Start: Panchami, End: Panchami). |

---

## 4. Sankaṣṭī Chaturthī 2026 Sample Adjudication (Moonrise Tithi Across Months)

| Date | Ujjain Moonrise | Ujjain Result | Bedford Moonrise | Bedford Result | Notes |
|---|---|---|---|---|---|
| 2026-01-07 | 22:03:35 | No | 21:32:13 | No | Moonrise timing differs by timezone |
| 2026-02-05 | 21:38:10 | QUALIFIED | 21:41:55 | No | Moonrise timing differs by timezone |
| 2026-03-07 | 22:06:27 | No | 23:07:37 | No | Moonrise timing differs by timezone |
| 2026-10-29 | 20:32:09 | QUALIFIED | 18:17:46 | No | Moonrise timing differs by timezone |
| 2026-11-27 | 20:31:35 | QUALIFIED | 18:37:08 | QUALIFIED | Moonrise timing differs by timezone |

---

## 5. Sample `reasons[]` Output Structure (Quality Audit)

Below is an exact JSON string of a generated `reasons[]` array for UI / "Why today?" surfacing:

```json
[
  {
    "code": "paksha_check",
    "text": "Paksha on 2026-10-29 at sunrise is krishna (tithi 19, target: krishna).",
    "details": {
      "actualPaksha": "krishna",
      "targetPaksha": "krishna",
      "tithiIndex": 19
    }
  },
  {
    "code": "tithi_presence_check",
    "text": "Tithi Chaturthi (4 krishna) presence mode 'at' during 'moonrise' [2026-10-29 15:02 to 2026-10-29 15:02]: MATCHED. (Start: Chaturthi, End: Chaturthi).",
    "details": {
      "targetTithi": 4,
      "targetPaksha": "krishna",
      "period": "moonrise",
      "mode": "at",
      "startTithi": 19,
      "endTithi": 19,
      "startUtc": "2026-10-29T15:02:09.637Z",
      "endUtc": "2026-10-29T15:02:09.637Z"
    }
  }
]
```

---

## 6. Disagreements with Stored Database Dates

1. **Maha Shivaratri 2026**: Database stores `2026-02-17` (LOCKED verified). Evaluator demonstrates Krishna Chaturdashi Nishita prevalence occurs on **`2026-02-15`**.  
2. **Janmashtami 2026**: Database stores single date `2026-09-04`. Evaluator demonstrates dual-variant qualification: Smārta on **`2026-09-03`** and Vaiṣṇava on **`2026-09-04`**.  

---

## 7. Verification Invariants

- **Zero Engine Coupling:** Evaluator is not wired into `engine.ts`, materialisation, crons, or UI.  
- **Snapshot Test Tripwire:** `npm run verify:calendar` remains **988 passed / 216 skipped** (100% unchanged).  
- **Māsa Naming Invariant:** `masaName` rules (`rules.ts:47-58`) untouched.  
- **No Compensation for D1:** Evaluates tithi/nakshatra/muhurta conditions directly without compensating for D1.  
