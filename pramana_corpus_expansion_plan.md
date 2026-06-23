# Pramana Corpus Ingestion & Expansion Plan

This backlog outlines the structured roadmap for advancing "present and pending" corpora from scaffolded/sample states into full runtime activation.

> **Status source of truth:** For current corpus maturity and prioritization, see `PRAMANA_CORPUS_ROADMAP.md`. This document is retained for historical and planning detail; where it disagrees with the roadmap on current maturity, the roadmap wins.

## Status Definitions

- **Sample-only**: Scaffolded manifest exists (1-2 verses/chapters). Not actively used in live routing.
- **Ingested-ready**: Full text compiled and present in JSON manifests. Embedding pipeline processes it, but it lacks a live prompt builder or full eval suite.
- **Activation-ready**: Full text ingested, dedicated prompt builder exists, robust eval suite passes. Ready for explicit targeting.
- **Production-scale target**: Active in auto-routing fallback; high-volume traffic expected and heavily cached.

---

## 1. Pathshala Expansions

### 1.1 Larger Upanishads
- **Corpus ID**: `pathshala_upanishads`
- **Tradition**: Sanatana Dharma (Vedanta)
- **Content Type**: Philosophical Scripture
- **Manifest Shape**: Chapter-level JSONs mapping to Mantras (`ref: "Isha.1"`).
- **Retrieval Mode**: Embedding + TF-IDF hybrid.
- **Response Mode**: `scripture_passage_explain`
- **Eval Requirement**: `pathshala_upanishads` suite expanded to 15+ cases covering all 11 Principal Upanishads.
- **Auto-routing target**: No (Explicit only).
- **Current State**: Sample-scale — 45 indexed curated passages (`upanishads_index.json`) across the 11 Principal Upanishad names; coverage is still uneven and not an exhaustive Principal Upanishads corpus. See `PRAMANA_CORPUS_ROADMAP.md`.

### 1.2 Ramayana Study Corpus
- **Corpus ID**: `valmiki_ramayana`
- **Tradition**: Sanatana Dharma (Itihasa)
- **Content Type**: Narrative/Ethical Epic
- **Manifest Shape**: Kanda > Sarga > Shloka mapping.
- **Retrieval Mode**: Embedding.
- **Response Mode**: `scripture_passage_explain` or new `itihasa_story_explain`.
- **Eval Requirement**: New `pathshala_ramayana` suite covering Dharma dilemmas (e.g., Ayodhya Kanda choices).
- **Auto-routing target**: No (Explicit only unless matching Ramayana queries).
- **Current State**: Source-audit pending starter slice (15 passages from Bala Kanda) is built and explicit routing is active. Sanskrit rights remain companion-only until confirmed; do not claim verified/canonical status yet.

### 1.3 Yoga Sutras
- **Corpus ID**: `pathshala_yogasutras`
- **Tradition**: Sanatana Dharma (Yoga Darshana)
- **Content Type**: Philosophical Scripture
- **Manifest Shape**: Pada > Sutra mapping.
- **Retrieval Mode**: Exact Match / Embedding.
- **Response Mode**: `scripture_verse_explain`
- **Eval Requirement**: New `pathshala_yogasutras` suite focusing on Ashtanga Yoga mechanics.
- **Auto-routing target**: No.
- **Current State**: Missing entirely.

### 1.4 Mahabharata Study Passages (Optional)
- **Corpus ID**: `mahabharata_shanti`
- **Tradition**: Sanatana Dharma (Itihasa)
- **Content Type**: Philosophical/Statecraft
- **Manifest Shape**: Parva > Chapter > Shloka.
- **Retrieval Mode**: Embedding.
- **Response Mode**: `scripture_passage_explain`
- **Eval Requirement**: Minimum 5 cases covering Rajadharma.
- **Auto-routing target**: No.
- **Current State**: Sample-only.

---

## 2. Sikh Expansions

### 2.1 Larger Gurbani & Nitnem
- **Corpus ID**: `sikh_gurbani`
- **Tradition**: Sikhi
- **Content Type**: Devotional Scripture
- **Manifest Shape**: Bani > Pauri / Shabad (Gurmukhi + Transliteration).
- **Retrieval Mode**: Embedding.
- **Response Mode**: `gurbani_shabad_explain`
- **Eval Requirement**: Suite expanded to cover Rehras Sahib, Kirtan Sohila.
- **Auto-routing target**: No.
- **Current State**: Sample-scale — 34 indexed docs (`gurbani_index.json`; Japji and partial Nitnem). See `PRAMANA_CORPUS_ROADMAP.md`.

---

## 3. Buddhist Study Lane

### 3.1 Buddhist Dhamma
- **Corpus ID**: `buddhist_dhamma`
- **Tradition**: Buddhism (Theravada/Mahayana)
- **Content Type**: Canonical Suttas / Texts
- **Manifest Shape**: Vagga > Verse (Pali/Sanskrit).
- **Retrieval Mode**: Embedding.
- **Response Mode**: `buddhist_sutra_explain` (Planned)
- **Eval Requirement**: New `buddhist_study` suite.
- **Auto-routing target**: No.
- **Current State**: Production-scale indexed — 109 passages (`buddhist_dhamma_index.json`, Dhammapada Ch. 1–8). Not "sample-only". Runtime activation (tradition-aware routing, dedicated prompt builder, deeper eval) still pending. See `PRAMANA_CORPUS_ROADMAP.md`.

---

## 4. Jain Study Lane

### 4.1 Jain Dharma Agamas
- **Corpus ID**: `jain_dharma`
- **Tradition**: Jainism
- **Content Type**: Agamic Texts / Sutras
- **Manifest Shape**: Chapter > Sutra (Prakrit/Sanskrit).
- **Retrieval Mode**: Embedding.
- **Response Mode**: `jain_sutra_explain` (Planned)
- **Eval Requirement**: New `jain_study` suite covering non-absolutism.
- **Auto-routing target**: No.
- **Current State**: Production-scale indexed — 107 passages (`jain_dharma_index.json`, Tattvartha Sutra + Saman Suttam). Not "sample-only". Runtime activation (tradition-aware routing, dedicated prompt builder, deeper eval) still pending. See `PRAMANA_CORPUS_ROADMAP.md`.

---

## Recommended Build Order & Blockers

1. **Upanishads Full Ingestion**: Easiest path. The routing and response modes already exist. Blocker: Data entry (compiling full manifest texts).
2. **Gurbani & Nitnem**: Routing exists. Blocker: Data entry.
3. **Yoga Sutras**: Highly requested. Blocker: Needs new manifest creation and small eval suite.
4. **Buddhist / Jain Lanes**: Blockers: Requires net-new `context-builder.ts` prompt logic and dedicated eval suites before activation.
