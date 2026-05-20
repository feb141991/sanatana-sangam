# 🔎 Pramana Rollout Readiness Dashboard

This dashboard provides a weekly status snapshot of all Pramana study lanes, corpus sizes, retrieval integration levels, evaluation coverage, and provider connectivity to guide rollout decisions.

**Generated at**: `2026-05-20T07:05:47Z` (UTC)  
**Status**: ⚠️ WARNINGS FOUND

---

## 📊 Executive Rollout Summary

| Metric | Status / Count | Description |
| :--- | :---: | :--- |
| **Total Registered Lanes** | **17** | Registered in core schemas |
| **Prompt Builders Wired** | **7 / 17** | Active in runtime router |
| **Retrieval Indexes Built** | **5 / 17** | TF-IDF token vectors compiled |
| **Eval Coverage** | **7 / 17** | Covered by sample datasets |
| **Production-Scale Lanes** | **1** | Full-scale verse ingestion ready |
| **Total Indexed Documents** | **792** | Total verses / paragraphs indexed |
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
| **`buddhist_dhamma`** | Buddhism | ✅ Built (🟡 Sample) | 6 | 6 | ✅ | `mock-only` | explicit-target-only | `buddhist_sutra_explain` |
| **`jain_dharma`** | Jainism | ✅ Built (🟡 Sample) | 8 | 6 | ✅ | `mock-only` | explicit-target-only | `jain_sutra_explain` |
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
| **`gemini-hosted`** | 🔴 UNAVAILABLE | `Active` | GEMINI_API_KEY not set — mock fallback only |
| **`self-hosted`** | 🔴 UNAVAILABLE | `Inactive` | PRAMANA_SELF_HOSTED_URL not set — scaffold only, not deployed |

---

## 🚨 Active Rollout Blockers & Action Items

### 1. Corpus Scale Limitations
* The following lanes are currently running on **Sample-scale** data (low document counts) and are **blocked** from Production auto-routing:
  - **`pathshala_upanishads`** (Sanatana Dharma): currently has only **43** documents.
  - **`sikh_gurbani`** (Sikhi): currently has only **34** documents.
  - **`buddhist_dhamma`** (Buddhism): currently has only **6** documents.
  - **`jain_dharma`** (Jainism): currently has only **8** documents.

### 2. Missing Indexes
* The following wired lanes do not have a built TF-IDF index file. Retrieval queries will fall back to basic manifest scanning:
  - **`bhakti_katha`** (Bhakti)
  - **`bhakti_panchatantra`** (Niti Shastra)

### 3. Eval Gaps
* The following registered lanes completely lack eval case coverage:
  - **`tamil_tirukkural`** (Tamil Sangam)
  - **`tamil_prabandham`** (Sri Vaishnavism)
  - **`tamil_tiruvachakam`** (Shaiva Siddhanta)
  - **`mahabharata_shanti`** (Itihasa)
  - **`sant_kabir`** (Sant Mat)
  - **`sikh_dasam_granth`** (Sikhism)
  - **`mahayana_bodhicharyavatara`** (Mahayana)
  - **`jain_tattvartha_sutra`** (Jainism)
  - **`shaiva_kashmir`** (Kashmir Shaivism)
  - **`jain_kalpa_sutra`** (Jainism)
