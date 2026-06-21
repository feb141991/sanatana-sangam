# Ramayana Canonical Source Plan

## Objective
Establish a reliable, rights-cleared source stack for the Valmiki Ramayana Pramana starter corpus.

## Status of Current Local Content
**Status**: **NOT CANONICAL-GRADE**
- The current entries in `src/lib/data/ramayana-complete.ts` and generated manifests appear to be mock or sample-scale scaffold data (repeating lines, generic references).
- They lack required exact references (Kanda, Sarga, Shloka) and explicit rights metadata (`source_url`, `rights_status`).
- These files must NOT be treated as canonical texts.

## Source Stack Evaluation & Recommendation

### Chosen Sanskrit Source
- **Source**: **Sanskrit Documents / GRETIL**
- **Rights Status**: `live_public_domain` (for the raw ancient Sanskrit text).
- **Reasoning**: The original Sanskrit text is ancient and in the public domain. Academic repositories like GRETIL or Sanskrit Documents provide verified standard editions of the text without imposing copyright on the verses themselves.

### Chosen English Translation Source
- **Source**: **Ralph T. H. Griffith Translation (Project Gutenberg / Wikisource)**
- **Rights Status**: `live_public_domain`
- **Reasoning**: The Griffith translation is historically recognized, complete, and definitively in the public domain. It allows for full local ingestion and embedding without legal restrictions.

### Other Evaluated Candidates (Prohibited for direct ingestion)
- **valmikiramayan.net**: Prohibited for local text extraction unless explicit permission is granted. To be used as `companion_only` for deeper study links.
- **Gita Press**: Translations, layout, and specific commentaries are copyrighted. Can be referenced externally (`companion_only`), but cannot be ingested into the local RAG corpus without explicit licensing.

## Permitted vs. Prohibited Usage

### Allowed Usage (`live_public_domain`)
- Complete local storage and indexing of the Sanskrit verses (GRETIL/Sanskrit Documents).
- Complete local storage and indexing of the Griffith English translation.
- Generated transliteration of the public-domain Sanskrit text.
- Full in-app reading flows, RAG retrieval, and AI reflections grounded *only* in these public-domain passages.

### Prohibited Usage
- **No scraping or ingesting** of modern translations, commentary, or specific structural adaptations from valmikiramayan.net or Gita Press.
- **No claiming** of authoritative audio/recitation until a specific audio source is evaluated and rights-cleared.

## Citation Format
All ingested entries must follow exact metadata requirements per `PATHSHALA_SOURCE_POLICY.md`.
- **Sanskrit Citation**: `Valmiki Ramayana (Sanskrit Documents)`
- **English Citation**: `Valmiki Ramayana, translated by Ralph T. H. Griffith`
- **Reference Pattern**: `[Kanda Name] Kanda, Sarga [X], Shloka [Y]` (e.g., `Bala Kanda, Sarga 1, Shloka 1`)

## Review Checklist for Ingestion
Before any manifest generation or `ramayana_index.json` build:
- [ ] Confirm the source text is strictly from the approved public-domain sources.
- [ ] Ensure no commentary from restricted sources has been mixed into the translation field.
- [ ] Verify `rights_status` is explicitly set to `public_domain`.
- [ ] Verify `source_class` is explicitly set to `canonical` or `translation`.
- [ ] Ensure Kanda, Sarga, and verse numbers are accurately mapped and preserved.
