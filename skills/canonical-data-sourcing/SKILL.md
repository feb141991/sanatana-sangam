---
name: canonical-data-sourcing
description: >-
  Standardized protocol and automated runbook for sourcing, importing, verifying, and indexing
  canonical scriptural and spiritual knowledge base data in batches. Enforces strict zero-hallucination
  checks, zero-placeholder verification, verbatim source cross-referencing, and sparse-dense embedding parity.
---

# Canonical Data Sourcing & Batch Verification Runbook

This skill establishes the mandatory end-to-end protocol for importing canonical texts (e.g. Valmiki Ramayana, Mahabharata, Puranas, Classical Darshanas) into Shoonaya's Pramana knowledge base.

It enforces **Shoonaya Rule 3 (Spiritual Content Integrity)** and **Shoonaya Rule 14 (Grounding Determinism)** at every stage.

---

## 1. Core Principles (Non-Negotiable)

1. **Zero Hallucination / Zero Synthetic Scriptural Text:**
   - Never generate or paraphrase Sanskrit shlokas, sutras, or mantras using LLMs.
   - Every original language text must be sourced from established, authoritative historical editions (e.g., Nirnaya Sagar Press, Baroda Critical Edition, Chaukhamba).
2. **Public-Domain Rights Clearance (Rule 3):**
   - Live English translations must be legally cleared (public domain via Project Gutenberg, Internet Archive, or explicit rights clearance).
   - Modern copyrighted translations (e.g., Gita Press English, Bhaktivedanta Book Trust, Motilal Banarsidass active copyrights) are strictly prohibited.
3. **Zero Placeholders:**
   - Manifests must contain zero `TODO`, `TBD`, `placeholder`, `lorem ipsum`, `xxx`, `...` or empty fields.
4. **Verbatim Cross-Checking:**
   - Ingested English text must be cross-checked against the raw source text to guarantee word-for-word fidelity.

---

## 2. The 5-Stage Batch Sourcing Workflow

```
[Raw Public Domain Text] 
          │
          ▼
   1. Batch Parsing (Python script extracts Sargas/Chapters)
          │
          ▼
   2. Automated Verification (`verify_sourcing.py`)
      ├── Check: Zero placeholders
      ├── Check: Zero missing fields (ref, skt, translit, translation)
      ├── Check: Verbatim cross-check against raw source
      └── Check: Zero duplicate verses
          │
          ▼
   3. Dual-Index Synchronization
      ├── Sparse BM25 Inverted Index (`python/ai_pipeline/.../build_*_index.py`)
      └── Dense Neural Embeddings (`scripts/build-dense-embeddings.mts`, 384-d MiniLM)
          │
          ▼
   4. RAG Pipeline Wiring & Grounding Cache
      ├── Register in `PramanaRetrieverSelector` (dense + sparse)
      └── Bump `GROUNDING_CORPUS_VERSION` (Rule 14)
          │
          ▼
   5. Test Suite & Verification Denominators
      ├── `validate_indexes.py` (all indexes valid)
      ├── `npx vitest run src/lib/ai/` (100% tests passing)
      └── Real semantic query proof
```

---

## 3. Step-by-Step Execution Guide

### Step 1: Source Acquisition & Raw Text Preparation
1. Identify the public-domain translation source (e.g. Ralph T. H. Griffith 1870–1874, Project Gutenberg eBook #51540).
2. Save raw text to temporary scratch directory:
   `<appDataDir>/brain/<conversation-id>/scratch/raw_source_<book>.txt`

### Step 2: Batch Manifest Parsing
Extract cantos or chapters in controlled batches (e.g. 10 to 50 cantos per batch) using a dedicated extraction script:
```python
# python/ai_pipeline/src/ai_pipeline/sourcing/parse_batch.py
```
Each entry in the target manifest must strictly follow the schema:
```json
{
  "ref": "1.1.1",
  "kanda": 1,
  "sarga": 1,
  "shloka": 1,
  "sanskrit": "तपःस्वाध्यायनिरतं तपस्वी वाग्विदां वरम् ।...",
  "transliteration": "tapaḥsvādhyāyanirataṃ tapasvī vāgvidāṃ varam |...",
  "translation": "Conscious of holy duty, Narad, great in penance, met...",
  "text": "Conscious of holy duty, Narad, great in penance, met...",
  "source_class": "translation",
  "rights_status": "public_domain",
  "review_status": "source_audit_approved",
  "is_pramana_grade": true,
  "provenance": "Griffith (1870-1874), Book I, Canto I. Project Gutenberg #51540."
}
```

### Step 3: Mandatory Automated Verification
Always execute the automated verification tool before proceeding to indexing:
```bash
python3 python/ai_pipeline/src/ai_pipeline/sourcing/verify_sourcing.py \
  python/ai_pipeline/corpus/manifests/<manifest_file>.json \
  --raw-source /path/to/raw_source.txt
```
**Stop Immediately** if any error or unexpected warning is raised:
- If a placeholder is detected $\rightarrow$ locate the authentic text and replace it.
- If a phrase fails the verbatim cross-check $\rightarrow$ inspect for hallucination or corrupted OCR.

### Step 4: Index Synchronization & Cache Bump
Rebuild both sparse and dense indexes in lockstep:
```bash
# 1. Update sparse BM25 index
python3 python/ai_pipeline/src/ai_pipeline/embeddings/build_<corpus>_index.py

# 2. Update dense neural embeddings
npx tsx scripts/build-dense-embeddings.mts

# 3. Bump grounding corpus version in src/lib/ai/chat-answer-cache.ts (Rule 14)
# export const GROUNDING_CORPUS_VERSION = '<YYYY-MM-DDx>';
```

### Step 5: Regression & Parity Verification
Execute all validation checks and record test denominators:
1. `PYTHONPATH=python/ai_pipeline/src python3 python/ai_pipeline/src/ai_pipeline/embeddings/validate_indexes.py`
2. `npx vitest run src/lib/ai/`
3. `PYTHONPATH=python/ai_pipeline/src python3 -m unittest discover -s python/ai_pipeline/tests`
4. `npm run check:assets`

---

## 4. Failure Modes & Mitigations

| Failure Mode | Cause | Mandatory Fix |
| :--- | :--- | :--- |
| **PGRST203 / Function overload** | Function signature mismatch in Postgres | Keep RAG manifest updates file-backed and versioned; avoid ad-hoc DB mutations. |
| **Cross-lingual retrieval drop** | MiniLM query mismatch on Sanskrit verses | Embed combined string: `${title} ${ref}. ${translit}. ${text}` so transliterated Sanskrit queries find their matches. |
| **Stale Chat Answers (Rule 14)** | Old answers cached for 14 days in `ai_chat_answer_cache` | Always bump `GROUNDING_CORPUS_VERSION` whenever any corpus is touched. |
| **Missing Sparse / Dense Pairing** | Registering only dense without sparse | Always register both `<corpus>_dense` and `<corpus>_sparse` in `PramanaRetrieverSelector`. |
