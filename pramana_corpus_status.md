# Pramana Corpus Status Report

This document records the current integration, routing, and evaluation status for each Pramana corpus in the repository.

> **Status source of truth:** For current corpus maturity and prioritization, see `PRAMANA_CORPUS_ROADMAP.md`. This document is retained for its per-corpus integration/eval detail.
>
> **Cleanup review 2026-07-23:** Bhakti Katha and Panchatantra are not mock-only. Their current chapter manifests contain real source-backed or explicitly curated lesson content with per-item metadata. Retrieval must fail closed when approved corpus files are missing; do not use synthetic fallback text as product content.

## 1. Corpus Registry & Status Matrix

| Corpus ID | Ingested | Explicitly Targetable | Auto-Routed | Eval-Covered | Manifest / Source Files |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`pathshala_gita`** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | `python/ai_pipeline/corpus/manifests/gita_chapter_*.json` |
| **`bhakti_katha`** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | `python/ai_pipeline/corpus/manifests/katha_chapter_*.json` |
| **`bhakti_panchatantra`** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes | `python/ai_pipeline/corpus/manifests/panchatantra_chapter_1.json` |
| **`pathshala_upanishads`** | ✅ Yes | ✅ Yes | ✅ Explicit terms | ✅ Yes | `python/ai_pipeline/corpus/manifests/upanishad_*.json` |
| **`sikh_gurbani`** | ✅ Yes | ✅ Yes | ✅ Terms/tradition | ✅ Yes | `python/ai_pipeline/corpus/manifests/sikh_gurbani_*.json` |
| **`tamil_tirukkural`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/tamil_tirukkural.json` |
| **`tamil_prabandham`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/tamil_prabandham.json` |
| **`tamil_tiruvachakam`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/tamil_tiruvachakam.json` |
| **`mahabharata_shanti`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/mahabharata_shanti.json` |
| **`sant_kabir`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/sant_kabir.json` |
| **`sikh_dasam_granth`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/sikh_dasam_granth.json` |
| **`mahayana_bodhicharyavatara`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/mahayana_bodhicharyavatara.json` |
| **`jain_tattvartha_sutra`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/jain_tattvartha_sutra.json` |
| **`shaiva_kashmir`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/shaiva_kashmir.json` |
| **`jain_kalpa_sutra`** | 🟡 Scaffolded | ❌ No | ❌ No | ❌ No | `python/ai_pipeline/corpus/manifests/jain_kalpa_sutra.json` |
| **`buddhist_dhamma`** | ✅ Yes | ✅ Yes | ✅ Terms/tradition | ✅ Yes | `python/ai_pipeline/corpus/manifests/buddhist_dhamma.json` |
| **`jain_dharma`** | ✅ Yes | ✅ Yes | ✅ Terms/tradition | ✅ Yes | `python/ai_pipeline/corpus/manifests/jain_dharma.json` |
| **`valmiki_ramayana`** | 🟡 Audit-pending | 🟡 Recognized/withheld | ❌ No | ✅ Policy-covered | `python/ai_pipeline/corpus/manifests/valmiki_ramayana_*.json` |

### Column Definitions:
* **Ingested**: Manifest JSON files containing source-cleared text, transliterations, and translations exist in the `manifests/` directory. `Metadata only` means a file exists but must not be treated as live-approved content.
* **Explicitly Targetable**: Supported by the selector routing logic when requested explicitly via filters or response modes.
* **Auto-Routed**: Automatically matched by the query text analyzer fallback in the absence of explicit corpus filters.
* **Eval-Covered**: Part of the evaluation dataset (`jsonl`) and scoring test harness.

---

## 2. Ingested Manifest Details

1. **Bhagavad Gita (`pathshala_gita`)**
   - Active chapters: 18 (`gita_chapter_1.json` to `gita_chapter_18.json`)
   - Text source: Sanskrit verses with English translation.

2. **Bhakti Katha (`bhakti_katha`)**
   - Active chapters: 2 (`katha_chapter_1.json`, `katha_chapter_2.json`), 16 entries total.
   - Themes: Four foundational Bhakti narratives plus 12 Vrat Kathas.
   - Source status: mixed approved content. Public-domain translation excerpts remain source-labelled; Shoonaya stories are presented to the model as `curated_lesson` devotional retellings, never as verbatim scripture translations.

3. **Panchatantra (`bhakti_panchatantra`)**
   - Active chapters: 1 (`panchatantra_chapter_1.json`)
   - Themes: Moral fables (Monkey and Crocodile, Talkative Tortoise, Lion and Rabbit, Blue Jackal).
   - Source status: source-backed from Arthur W. Ryder's public-domain Panchatantra translation layer where present. Keep Sanskrit companion-only unless a separate digital-rights pass clears the Sanskrit source.

4. **Upanishads (`pathshala_upanishads`)**
   - Active texts: 11 (`upanishad_*.json`)
   - Scale: **297 indexed passages across 11 Principal Upanishad names; production-scale translated study layer**
   - Themes: 11 Principal Upanishads (Isha, Kena, Katha, Mundaka, Mandukya, Prashna, Taittiriya, Aitareya, Chandogya, Brihadaranyaka, Shvetashvatara).
   - Translation Basis: Robert Ernest Hume (1921), public domain.
   - Note: The original Sanskrit/transliteration layer remains partial and must not be described as complete.

5. **Gurbani (`sikh_gurbani`)**
   - Active chapters: 1 (`sikh_gurbani_japji.json`)
   - Themes: Gurbani scriptures (Japji Sahib Mool Mantar and Pauri 1). Included for Sikh tradition path schema compatibility.

6. **Buddhist Dhamma (`buddhist_dhamma`)**
   - Active chapters: 8 (`buddhist_dhamma.json` containing Dhammapada Chapters 1 to 8)
   - Scale: **Production-scale** (109 passages indexed).
   - Themes: Foundational Buddhist Dhamma verses (Yamakavagga, Appamadavagga, Cittavagga, Pupphavagga, Balavagga, Panditavagga, Arahantavagga, Sahassavagga).

7. **Jain Dharma (`jain_dharma`)**
   - Active chapters: 3 (`jain_dharma.json` containing Tattvartha Sutra chapters and Saman Suttam)
   - Scale: **Production-scale** (107 passages indexed).
   - Themes: Foundational Jain Dharma Agamas and ethical verses (Three Jewels, Ahimsa, Anekantavada, Mahavratas, Samata, Navkar Mantra).

8. **Valmiki Ramayana (`valmiki_ramayana`)**
   - Audit-pending files: 6 (`valmiki_ramayana_*.json`)
   - Scale: **Source-audit pending / not live-approved** (26 sample passages; not full-canon coverage).
   - Translation Basis: no live-approved local translation layer yet. Future live English should be rebuilt from Ralph T. H. Griffith via Project Gutenberg/Wikisource per `docs/RAMAYANA_CANONICAL_SOURCE_PLAN.md`.
   - Note: Reviewed GitHub datasets are reference/QA only per `docs/VALMIKI_RAMAYANA_GITHUB_SOURCE_AUDIT.md`; do not treat them as ingestion-cleared sources.
   - Runtime behavior: explicit Ramayana questions are recognized, but the pending passages are withheld. Dharma Mitra receives a fail-closed policy note instead of unapproved chunks.
   - Next steps: approve a verified Griffith/Gutenberg starter batch through human source review, keep Sanskrit companion-only until digital-source rights clear, then rebuild and activate the index.
