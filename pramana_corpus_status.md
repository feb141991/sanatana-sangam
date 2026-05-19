# Pramana Corpus Status Report

This document records the current integration, routing, and evaluation status for each Pramana corpus in the repository.

## 1. Corpus Registry & Status Matrix

| Corpus ID | Ingested | Explicitly Targetable | Auto-Routed | Eval-Covered | Manifest / Source Files |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`pathshala_gita`** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | `python/ai_pipeline/corpus/manifests/gita_chapter_*.json` |
| **`bhakti_katha`** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | `python/ai_pipeline/corpus/manifests/katha_chapter_1.json` |
| **`bhakti_panchatantra`** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | `python/ai_pipeline/corpus/manifests/panchatantra_chapter_1.json` |
| **`pathshala_upanishads`** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | `python/ai_pipeline/corpus/manifests/upanishad_chapter_1.json` |

### Column Definitions:
* **Ingested**: Manifest JSON files containing Sanskrit text, transliterations, and translations exist in the `manifests/` directory.
* **Explicitly Targetable**: Supported by the selector routing logic when requested explicitly via filters or response modes.
* **Auto-Routed**: Automatically matched by the query text analyzer fallback in the absence of explicit corpus filters.
* **Eval-Covered**: Part of the evaluation dataset (`jsonl`) and scoring test harness.

---

## 2. Ingested Manifest Details

1. **Bhagavad Gita (`pathshala_gita`)**
   - Active chapters: 18 (`gita_chapter_1.json` to `gita_chapter_18.json`)
   - Text source: Sanskrit verses with English translation.

2. **Bhakti Katha (`bhakti_katha`)**
   - Active chapters: 1 (`katha_chapter_1.json`)
   - Themes: Narrative accounts (Bhakta Prahlada, Bhakta Dhruva, Sudama Vipra, Gajendra Moksha).

3. **Panchatantra (`bhakti_panchatantra`)**
   - Active chapters: 1 (`panchatantra_chapter_1.json`)
   - Themes: Moral fables (Monkey and Crocodile, Talkative Tortoise, Lion and Rabbit, Blue Jackal).

4. **Upanishads (`pathshala_upanishads`)**
   - Active chapters: 1 (`upanishad_chapter_1.json`)
   - Themes: Principal Upanishads (*Isha*, *Katha*, *Chandogya*).
