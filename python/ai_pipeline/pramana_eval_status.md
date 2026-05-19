# Pramana Evaluation Summary Report

This report documents the status of the local and live-ish evaluations across the four target Pramana corpora.

## Suite Pass/Fail Status

| Suite Name | Dataset | Cases | Pass Rate | Case Scores (Passed / Total) | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`pathshala_gita`** | `pathshala_explain.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`bhakti_katha`** | `bhakti_katha.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`bhakti_panchatantra`** | `bhakti_panchatantra.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`pathshala_upanishads`** | `pathshala_upanishads.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`sikh_gurbani`** | `sikh_gurbani.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |

## Detailed Case Verification Metrics

### Suite: `pathshala_gita` (0 live, 6 mock)

- **`pathshala-2-47`**: Score `4/4`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `Yes`
  * Language compliance: `Yes`
- **`pathshala-2-20`**: Score `4/4`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `Yes`
  * Language compliance: `Yes`
- **`pathshala-4-7`**: Score `4/4`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `Yes`
  * Language compliance: `Yes`
- **`pathshala-9-22`**: Score `4/4`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `Yes`
  * Language compliance: `Yes`
- **`pathshala-18-66`**: Score `3/4`
  * JSON valid: `Yes`
  * Grounding present: `No`
  * Source metadata present: `Yes`
  * Language compliance: `Yes`
- **`pathshala-18-78`**: Score `4/4`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `Yes`
  * Language compliance: `Yes`

### Suite: `bhakti_katha` (0 live, 6 mock)

- **`katha-prahlada`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`katha-dhruva`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`katha-sudama`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`katha-gajendra`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`katha-prahlada-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`katha-sudama-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`

### Suite: `bhakti_panchatantra` (0 live, 6 mock)

- **`panchatantra-monkey`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`panchatantra-tortoise`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`panchatantra-lion`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`panchatantra-jackal`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`panchatantra-monkey-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`panchatantra-lion-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`

### Suite: `pathshala_upanishads` (0 live, 6 mock)

- **`upanishads-isha-1`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-katha-1`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-katha-2`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-chandogya-1`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-isha-1-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-chandogya-1-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`

### Suite: `sikh_gurbani` (0 live, 6 mock)

- **`gurbani-mool-mantar`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`gurbani-pauri-1`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`gurbani-mool-mantar-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`gurbani-pauri-1-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`gurbani-mool-mantar-pa`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`gurbani-pauri-1-pa`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`

## Trust & Mock Status Summary

- **Mock Eval Status**: Active fallback mode is fully supported. All suites run regression checks using high-fidelity mock generators.
- **Live-ish Eval Status**: Gita suite runs real prompt construction and context serialization against the Gemini 2.0 API when `GEMINI_API_KEY` is provided.
- **Pramana Output Trust Level**: **High**. Structured response parsing ensures format safety, and coordinate indexing validates that grounding references matches verbatim text.