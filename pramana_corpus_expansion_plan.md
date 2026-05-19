# Pramana Corpus Expansion Plan

This document outlines the concrete expansion strategy for transitioning currently scaffolded or sample-only corpuses into fully scalable, production-ready runtime lanes. 

## 1. Target Expansion Lanes

### 1.1 Upanishads (Larger Ingestion)
- **Corpus ID**: `pathshala_upanishads` (Existing)
- **Status**: Currently sample-only (1 chapter active).
- **Manifest Expectations**: Full ingestion of the 11 Principal Upanishads (Isha, Kena, Katha, Prashna, Munda, Mandukya, Taittiriya, Aitareya, Chandogya, Brihadaranyaka, Shvetashvatara). Each Upanishad requires its own JSON manifest.
- **Chunking/Index Strategy**: Chunk by *Mantra/Sloka* or logical philosophical paragraph. Keep references hierarchical (e.g., `Mundaka.1.2.3`). Update `build_upanishads_index` to iterate through all 11 manifests.
- **Response Mode**: `scripture_passage_explain`
- **Eval Requirement**: Requires an expanded `pathshala_upanishads` dataset (at least 15-20 cases) covering complex philosophical concepts (Atman, Brahman, Maya) across multiple Upanishads before live activation.
- **Blockers**: Missing full source text compilation for the 10 remaining Upanishads; lack of live prompt builder in `run_evals.py`.

### 1.2 Sikh / Gurbani (Larger Ingestion)
- **Corpus ID**: `sikh_gurbani` (Existing), `sikh_dasam_granth` (Planned)
- **Status**: Currently sample-only (Japji Sahib Mool Mantar + Pauri 1). Dasam Granth is scaffolded only.
- **Manifest Expectations**: Full `sikh_gurbani_japji.json`, expansion to Rehras Sahib, Kirtan Sohila, and Anand Sahib (Nitnem).
- **Chunking/Index Strategy**: Chunk by *Pauri* or *Shabad*. Keep Gurmukhi text and English transliteration tightly coupled to ensure retrieval precision.
- **Response Mode**: `gurbani_shabad_explain`
- **Eval Requirement**: Expanded dataset covering distinct Banis with a focus on Gurmat philosophy before broad activation.
- **Blockers**: Missing full Nitnem source JSONs; lack of live prompt builder in `run_evals.py`.

### 1.3 Buddhist Study Lane
- **Corpus ID**: `mahayana_bodhicharyavatara` (Planned), `theravada_dhammapada` (Future)
- **Status**: Scaffolded (`mahayana_bodhicharyavatara.json` exists).
- **Manifest Expectations**: Full verses of the Bodhicharyavatara with Sanskrit, transliteration, and English meaning.
- **Chunking/Index Strategy**: Chunk by Chapter + Verse.
- **Response Mode**: `scripture_verse_explain` (or a dedicated `buddhist_sutra_explain` mode).
- **Eval Requirement**: Needs a new `buddhist_study` eval suite covering Bodhisattva vows and emptiness (Shunyata) concepts.
- **Blockers**: Requires adding a Buddhist context builder to `context-builder.ts` and `SimpleCorpusSelector` routing heuristics.

### 1.4 Jain Study Lane
- **Corpus ID**: `jain_tattvartha_sutra` (Planned), `jain_kalpa_sutra` (Planned)
- **Status**: Scaffolded (single verses exist).
- **Manifest Expectations**: Full chapters of Tattvartha Sutra.
- **Chunking/Index Strategy**: Chunk by *Sutra*. 
- **Response Mode**: `scripture_verse_explain` (or a dedicated `jain_sutra_explain` mode).
- **Eval Requirement**: Needs a new `jain_study` eval suite covering Anekantavada (non-absolutism) and Ahimsa (non-violence) nuances.
- **Blockers**: Requires adding a Jain context builder to `context-builder.ts` and `SimpleCorpusSelector` routing heuristics.

---

## 2. Recommended Build Order

To move fastest without degrading runtime quality, implement expansions in this order:

1. **Upanishads Full Ingestion**: Easiest path. The routing, response modes, and eval suite structure already exist. Just requires data entry (manifests) and updating the index script.
2. **Gurbani Full Ingestion**: Same as above. Routing and types exist. Needs data entry for Nitnem.
3. **Buddhist Study Lane**: Requires a new `ContextBuilder` (`buildBuddhistSutraExplainPrompt`), new prompts, new system instructions, and a new eval suite.
4. **Jain Study Lane**: Same architectural requirement as the Buddhist lane.

---

## 3. Definitions

- **Sample-only**: The corpus exists in the code and types, and is actively selected by the router, but only contains 1-2 chapters of data (e.g., Upanishads, Gurbani).
- **Scaffolded**: A `manifest.json` exists with a single verse, but it is NOT yet added to the app's `SimpleCorpusSelector` routing fallback logic. (e.g., `tamil_tirukkural`, `mahayana_bodhicharyavatara`).
- **Production-scalable**: Full text is ingested, `build_embeddings.py` processes the whole text, a dedicated live prompt builder exists, and an eval suite with 10+ cases passes. (e.g., `pathshala_gita`).
