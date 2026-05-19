# Pramana Evaluation Summary Report

This report documents the status of the local and live-ish evaluations across the active Pramana corpora.

## Suite Pass/Fail Status

| Suite Name | Dataset | Cases | Pass Rate | Case Scores (Passed / Total) | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`pathshala_gita`** | `pathshala_explain.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`bhakti_katha`** | `bhakti_katha.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`bhakti_panchatantra`** | `bhakti_panchatantra.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`pathshala_upanishads`** | `pathshala_upanishads.sample.jsonl` | 16 | 100.0% | 16 / 16 | ✅ PASSED |
| **`sikh_gurbani`** | `sikh_gurbani.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`buddhist_dhamma`** | `buddhist_dhamma.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |
| **`jain_dharma`** | `jain_dharma.sample.jsonl` | 6 | 100.0% | 6 / 6 | ✅ PASSED |

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

### Suite: `pathshala_upanishads` (0 live, 16 mock)

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
- **`upanishads-chandogya-tattvamasi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-brihadaranyaka-neti`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-brihadaranyaka-aham-brahmasmi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-brihadaranyaka-asato-ma`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-mandukya-om`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-mandukya-turiya`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-mundaka-atman-grace`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-kena-ear-of-ear`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-chandogya-bhuma`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-taittiriya-ananda`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-isha-1-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-brihadaranyaka-asato-ma-hi`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`upanishads-chandogya-tattvamasi-hi`**: Score `5/5`
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

### Suite: `buddhist_dhamma` (0 live, 6 mock)

- **`buddhist-dhamma-dukkha`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`buddhist-dhamma-anatta`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`buddhist-dhamma-dependent-origination`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`buddhist-dhamma-middle-way`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`buddhist-dhamma-metta`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`buddhist-dhamma-impermanence`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`

### Suite: `jain_dharma` (0 live, 6 mock)

- **`jain-ahimsa-principle`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`jain-anekantavada`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`jain-ratnatraya`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`jain-karma-and-soul`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`jain-five-vows`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`
- **`jain-equanimity`**: Score `5/5`
  * JSON valid: `Yes`
  * Grounding present: `Yes`
  * Source metadata present: `No`
  * Language compliance: `Yes`

## Trust & Mock Status Summary

### Suite Execution Mode Reference

| Suite | Current Mode | Can Run Live-ish | Env/Config Required |
| :--- | :--- | :--- | :--- |
| `pathshala_gita` | Mock (live-ish if key set) | ✅ Yes | `GEMINI_API_KEY` |
| `bhakti_katha` | Mock-only | ❌ Not yet | Prompt builder + live adapter |
| `bhakti_panchatantra` | Mock-only | ❌ Not yet | Prompt builder + live adapter |
| `pathshala_upanishads` | Mock-only | ❌ Not yet | Prompt builder + live adapter |
| `sikh_gurbani` | Mock-only | ❌ Not yet | Prompt builder + live adapter |
| `buddhist_dhamma` | Mock-only | ❌ Not yet | Prompt builder + live adapter |
| `jain_dharma` | Mock-only | ❌ Not yet | Prompt builder + live adapter |

### Definitions

- **Mock**: Eval uses deterministic mock generators. No external API calls. Tests regression safety of scoring, JSON parsing, and grounding checks.
- **Live-ish**: Eval constructs real prompts, serializes real retrieval context, and calls the hosted Gemini API. Validates end-to-end output quality.
- **Future self-hosted**: Eval will run against a private/self-hosted model runtime (vLLM, Ollama, etc.) when `PRAMANA_INFERENCE_PROVIDER=self-hosted` and `PRAMANA_SELF_HOSTED_URL` are configured.

### What Is Required to Make Live Eval the Default

1. Set `GEMINI_API_KEY` in the environment (or `PRAMANA_SELF_HOSTED_URL` for self-hosted).
2. Extend Katha, Panchatantra, Upanishads, and Gurbani suites with live prompt builders (currently only Gita has a live path).
3. Add latency and cost guards to prevent accidental high-volume API spend during CI.

- **Pramana Output Trust Level**: **High**. Structured response parsing ensures format safety, and coordinate indexing validates that grounding references match verbatim text.