# 🔎 Pramana Rollout Readiness Dashboard

This dashboard provides a weekly status snapshot of all Pramana study lanes, corpus sizes, retrieval integration levels, evaluation coverage, and provider connectivity to guide rollout decisions.

**Generated at**: `2026-05-20T09:58:00Z` (UTC)  
**Status**: 🟢 STAGING-READY (Hosted: awaiting GEMINI_API_KEY | Self-Hosted: confirmed live)

---

## 📊 Executive Rollout Summary

| Metric | Status / Count | Description |
| :--- | :---: | :--- |
| **Total Registered Lanes** | **17** | Registered in core schemas |
| **Prompt Builders Wired** | **7 / 17** | Active in runtime router |
| **Retrieval Indexes Built** | **5 / 17** | TF-IDF token vectors compiled |
| **Eval Coverage** | **7 / 17** | Covered by sample datasets |
| **Production-Scale Lanes** | **3** | Full-scale verse ingestion ready |
| **Total Indexed Documents** | **994** | Total verses / paragraphs indexed |
| **Total Eval Test Cases** | **52** | System-wide validation checks |

---

## 📚 Study Lane Registry & Rollout Matrix

The matrix below shows the status of each tradition's study lane.

| Corpus ID | Tradition | Index Status | Docs | Eval Cases | Wired | Exec Mode | Routing Policy | Response Mode |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **`pathshala_gita`** | Sanatana Dharma | ✅ Built (🟢 Production) | 701 | 6 | ✅ | `live-ish` | active (default fallback) | `scripture_verse_explain` |
| **`pathshala_upanishads`** | Sanatana Dharma | ✅ Built (🟡 Sample) | 43 | 16 | ✅ | `mock-only` | explicit-target-only | `scripture_passage_explain` |
| **`bhakti_katha`** | Bhakti | ❌ Missing (⚪ Not-indexed) | 0 | 6 | ✅ | `mock-only` | active (source-key match) | `devotional_story_explain` |
| **`bhakti_panchatantra`** | Niti Shastra | ❌ Missing (⚪ Not-indexed) | 0 | 6 | ✅ | `mock-only` | explicit-target-only | `moral_story_explain` |
| **`sikh_gurbani`** | Sikhi | ✅ Built (🟡 Sample) | 34 | 6 | ✅ | `mock-only` | explicit-target-only | `gurbani_shabad_explain` |
| **`buddhist_dhamma`** | Buddhism | ✅ Built (🟢 Production) | 109 | 6 | ✅ | `mock-only` | explicit-target-only | `buddhist_sutra_explain` |
| **`jain_dharma`** | Jainism | ✅ Built (🟢 Production) | 107 | 6 | ✅ | `mock-only` | explicit-target-only | `jain_sutra_explain` |
| **`tamil_tirukkural`** | Tamil Sangam | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`tamil_prabandham`** | Sri Vaishnavism | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`tamil_tiruvachakam`** | Shaiva Siddhanta | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`mahabharata_shanti`** | Itihasa | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`sant_kabir`** | Sant Mat | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`sikh_dasam_granth`** | Sikhism | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`mahayana_bodhicharyavatara`** | Mahayana | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`jain_tattvartha_sutra`** | Jainism | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`shaiva_kashmir`** | Kashmir Shaivism | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |
| **`jain_kalpa_sutra`** | Jainism | ❌ Missing (⚪ Not-indexed) | 0 | 0 | ❌ | `not-integrated` | not-routed | `—` |

---

## ⚡ Provider Connectivity & Readiness

Status of inference backends for hosted cloud models and local self-hosted deployments.

| Provider | Status | Environment Checks | Configured Role / Detail |
| :--- | :--- | :--- | :--- |
| **`gemini-hosted`** | 🔴 UNAVAILABLE | `Inactive` | `GEMINI_API_KEY` not set — mock fallback only |
| **`self-hosted`** | 🟢 LIVE (Staging) | `Active` | Ollama `qwen2.5:0.5b` running at `localhost:11434` — confirmed reachable |

---

## 🚦 Staging Go / No-Go Decision Matrix

This section summarizes the state of every prerequisite needed before routing live user traffic through a provider.

### Self-Hosted Inference Staging (Ollama + `qwen2.5:0.5b`)

| Prerequisite | Status | Notes |
| :--- | :---: | :--- |
| Self-hosted endpoint reachable | ✅ **YES** | `http://localhost:11434/v1/chat/completions` responds with valid JSON |
| OpenAI-compatible contract | ✅ **YES** | Ollama exposes `/v1/chat/completions`, validated |
| Live evaluation run executed | ✅ **YES** | 4 of 5 suites completed live runs |
| Parity proof artifact exists | ✅ **YES** | `pramana_self_hosted_provider_comparison.md` — 🟢 REAL SELF-HOSTED EXECUTION |
| Build passes | ✅ **YES** | `npm run build` exit 0 |
| Lint passes | ✅ **YES** | `npm run lint` exit 0 |
| Provider seam env-switch only | ✅ **YES** | Set `PRAMANA_INFERENCE_PROVIDER=self-hosted` — no code change needed |
| Default provider unchanged | ✅ **YES** | Gemini remains default when `PRAMANA_INFERENCE_PROVIDER` is unset |
| Model quality adequate for production | ⚠️ **PARTIAL** | `qwen2.5:0.5b` yields 38–83% parity. Use 7B+ model for production quality |

**Self-hosted staging verdict: ✅ GO for development/staging traffic. ⚠️ UPGRADE MODEL before production.**

### Hosted Gemini Inference Staging

| Prerequisite | Status | Notes |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` configured | 🔴 **NO** | Not set. All hosted runs fall back to mock. |
| Live eval run executed | 🔴 **NO** | Blocked by missing API key |
| Parity proof exists | 🔴 **NO** | `pramana_hosted_provider_comparison.md` shows 🔴 SKIPPED |

**Hosted staging verdict: 🔴 BLOCKED — set `GEMINI_API_KEY` in `.env.local` to unblock.**

---

## 📡 Self-Hosted Live Parity Proof (2026-05-20)

Run against **Ollama `qwen2.5:0.5b`** at `http://localhost:11434`.

| Suite | Mock Baseline | Self-Hosted Live | Live Runs | Result |
| :--- | :---: | :---: | :---: | :--- |
| `pathshala_gita` | 100% (6/6) | 50% (3/6) | 6 | 🟡 Partial parity — model too small |
| `bhakti_katha` | 100% (6/6) | 67% (4/6) | 6 | 🟡 Partial parity — model too small |
| `bhakti_panchatantra` | 100% (6/6) | 83% (5/6) | 6 | 🟢 Good parity |
| `pathshala_upanishads` | 100% (6/6) | 38% (6/16) | 6 | 🔴 Low parity — model too small for Vedanta JSON |
| `sikh_gurbani` | 100% (6/6) | 🛑 Fallback | 0 | 🔴 Model timeout — Gurmukhi prompt too complex |

> [!NOTE]
> Pass rates below 80% on a 0.5B model are expected. Upgrade to `mistral:7b`, `llama3:8b`, or `qwen2.5:7b` for production-grade parity. The endpoint contract and harness are fully validated.

---

## 🚨 Active Rollout Blockers & Action Items

### 1. Self-Hosted Model Quality
* Current staging model (`qwen2.5:0.5b`) yields 38–83% parity vs. mock baseline.
* **Action**: Pull and test `qwen2.5:7b` or `llama3:8b` for production-grade self-hosted parity.
  ```bash
  ollama pull qwen2.5:7b
  PRAMANA_SELF_HOSTED_MODEL=qwen2.5:7b npm run eval:compare -- --modes self-hosted
  ```

### 2. Hosted API Key Missing
* `GEMINI_API_KEY` is not configured. All hosted eval runs are mocked.
* **Action**: Set `GEMINI_API_KEY` in `.env.local` and re-run `npm run eval:compare -- --modes hosted`.

### 3. Corpus Scale Limitations
* **`pathshala_upanishads`** (43 docs) and **`sikh_gurbani`** (34 docs) are sample-scale.
* **Action**: Expand manifests to 100+ documents to reach Production-scale auto-routing threshold.

### 4. Missing Retrieval Indexes
* **`bhakti_katha`** and **`bhakti_panchatantra`** have no TF-IDF indexes — retrieval falls back to manifest scanning.
* **Action**: Ingest source texts and run `npm run corpus:build-indexes`.

### 5. Eval Gaps (10 lanes)
* The following registered lanes completely lack eval case coverage:
  - `tamil_tirukkural`, `tamil_prabandham`, `tamil_tiruvachakam`
  - `mahabharata_shanti`, `sant_kabir`, `sikh_dasam_granth`
  - `mahayana_bodhicharyavatara`, `jain_tattvartha_sutra`, `shaiva_kashmir`, `jain_kalpa_sutra`
