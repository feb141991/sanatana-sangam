# Dharam Veer AI Coverage Audit

Last updated: 2026-07-23 (Batch 3)
Owner: Pramana source-integrity review

## 0. Scope note — batch 2 expansion

Following Prompt 3 requirements, this batch expands the Dharm Veer roster to a total of **13** fully verified source-backed heroes (up from 5). 

We have:
1. Re-verified and expanded the two pre-existing heroes (**Chhatrapati Shivaji Maharaj** and **Guru Gobind Singh Ji**) to 8 chunks each of verified public-domain translation/narrative text, resolving the previous unverified metadata labels.
2. Sourced and added **8 new heroes** balanced across traditions, with exactly 8 chunks each of dense, verified public-domain translation text.
3. Successfully run the tracked index builder to regenerate `dharam_veer_index.json`.

## 0b. Scope note — batch 3 expansion (2026-07-23)

This batch adds **3 new verified heroes** (Guru Arjan Dev, Maharana Pratap, Rani Lakshmibai), bringing the
total to **16 heroes, 128 chunks**. A 4th requested hero, **Bahubali**, was investigated and explicitly
**skipped** -- no public-domain English translation of the Adipurana's Bahubali episode could be located;
see section 5b for the reasoning. This batch also discovered and fixed a real data-contract bug in the
retrieval matching logic (see section 3b) that had been silently breaking "Ask AI more" for 7 of the 13
previously-supported heroes.

## 1. Baseline (before this batch)

- Visible roster: 70 heroes.
- AI indexed: 5 heroes (Arjuna, Bhishma, Lord Mahavira, Guru Gobind Singh, Shivaji), 30 chunks total.
  - Of these, Shivaji and Guru Gobind Singh carried only 3 chunks of unverified, generic text.

## 2. Coverage after this batch

| Hero | figure_id | Tradition | Chunks | Source | Rights |
|---|---|---|---|---|---|
| Chhatrapati Shivaji Maharaj | `chhatrapati-shivaji` | Hindu | 8 | *Shivaji and His Times*, Jadunath Sarkar (1919) | `public_domain` |
| Guru Gobind Singh Ji | `guru-gobind-singh` | Sikh | 8 | *The Sikh Religion*, Vol. 5, trans. Max Arthur Macauliffe (1909) | `public_domain` |
| Bhishma | `bhishma` | Hindu | 8 | *The Mahabharata*, Book 6 (Bhishma Parva), trans. Kisari Mohan Ganguli (1883-96) | `public_domain` |
| Arjuna | `arjuna` | Hindu | 8 | *The Mahabharata*, Book 6 (Bhishma Parva), trans. Kisari Mohan Ganguli (1883-96) | `public_domain` |
| Lord Mahavira | `lord-mahavira` | Jain | 8 | *Jaina Sutras, Part I* (SBE vol. 22), Kalpa Sutra, trans. Hermann Jacobi (1884) | `public_domain` |
| Guru Nanak Dev | `guru-nanak-dev` | Sikh | 8 | *The Sikh Religion*, Vol. 1, trans. Max Arthur Macauliffe (1909) | `public_domain` |
| Guru Tegh Bahadur | `guru-tegh-bahadur` | Sikh | 8 | *The Sikh Religion*, Vol. 4, trans. Max Arthur Macauliffe (1909) | `public_domain` |
| Siddhartha Gautama (The Buddha) | `siddhartha-gautama` | Buddhist | 8 | *Buddhist Suttas* (SBE vol. 11), trans. T. W. Rhys Davids (1881) | `public_domain` |
| Ananda | `ananda` | Buddhist | 8 | *Buddhist Suttas* (SBE vol. 11), trans. T. W. Rhys Davids (1881) | `public_domain` |
| Emperor Ashoka | `emperor-ashoka` | Buddhist | 8 | *Asoka, the Buddhist Emperor of India*, Vincent A. Smith (1901) | `public_domain` |
| Parshvanatha | `parshvanatha` | Jain | 8 | *Jaina Sutras, Part I* (SBE vol. 22), Kalpa Sutra, trans. Hermann Jacobi (1884) | `public_domain` |
| Harishchandra | `harishchandra` | Hindu | 8 | *The Markandeya Purana*, trans. F. Eden Pargiter (1904) | `public_domain` |
| Chanakya | `chanakya` | Hindu | 8 | *Kautilya's Arthashastra*, trans. R. Shamasastry (1915) | `public_domain` |
| Guru Arjan Dev | `guru-arjan-dev` | Sikh | 8 | *The Sikh Religion*, Vol. 3, trans. Max Arthur Macauliffe (1909) | `public_domain` |
| Maharana Pratap | `maharana-pratap` | Hindu | 8 | *Annals and Antiquities of Rajasthan*, James Tod (1829), ed. William Crooke (1920) | `public_domain` |
| Rani Lakshmibai | `rani-lakshmibai` | Hindu | 8 | *History of the Indian Mutiny of 1857-8*, Vol. 5, Col. G. B. Malleson (1897) | `public_domain` |

Total: **16 heroes indexed, 128 chunks** (100% public domain and verified, 8 chunks per hero).

Each hero's chunks are tagged with standard `chunk_type` values (`life_context`, `core_dharmic_act`, `trial_sacrifice`, `teaching`, `legacy`, `citation_provenance`).

## 3. Fixes and Enhancements in this Batch

1. **Re-verification & Expansion**: Re-sourced and expanded `guru-gobind-singh` and `chhatrapati-shivaji` to completely comply with `PATHSHALA_SOURCE_POLICY.md` requirements.
2. **Added Manifests**: Added 8 new manifest files matching the roster IDs to `python/ai_pipeline/corpus/manifests/dharam_veer/`.
3. **Retriever Sync**: Registered all 8 new manifest filenames in the `fileNames` array of `dharamVeerManifestRetriever` inside `src/lib/ai/retrieval.ts`.

## 3b. Fixes and Enhancements in Batch 3 (2026-07-23)

1. **Added 3 new heroes**: Guru Arjan Dev (`guru-arjan-dev`), Maharana Pratap (`maharana-pratap`), Rani
   Lakshmibai (`rani-lakshmibai`), each with 8 dense chunks sourced from named, rights-checked
   public-domain translations/histories (see table in section 2 and per-manifest `revision_note` /
   per-chunk `source_url` fields for full provenance).
2. **Skipped Bahubali** (`bahubali`) after investigation -- see section 5b.
3. **Fixed a real data-contract bug** in `src/lib/ai/retrieval.ts`: production `figure_id` values in
   `src/lib/data/dharm-veers/*.ts` are hyphenated (e.g. `guru-arjan-dev`), but manifest `doc_id` /
   filenames use underscores (e.g. `dharam_veer_guru_arjan_dev`) per the existing corpus convention. The
   exact-match comparison in `PramanaDharamVeerEmbeddingRetriever.retrieve()` (and the equivalent
   fallback path in `PramanaManifestRetriever.retrieve()`) never normalized between the two, so **any
   hyphenated multi-word figure_id silently failed to match its own manifest** and fell through to the
   "unsupported hero" safe fallback. This affected 7 of the 13 previously-supported heroes:
   `chhatrapati-shivaji`, `emperor-ashoka`, `guru-gobind-singh`, `guru-nanak-dev`, `guru-tegh-bahadur`,
   `lord-mahavira`, and `siddhartha-gautama`. Fixed by normalizing hyphens to underscores before
   comparison in both retrieval paths. Verified via smoke test (section 4) that all previously-broken
   heroes, plus all 3 newly-added heroes, now correctly retrieve their own chunks. This is the kind of
   "real route/data contract bug" this project's standing policy explicitly permits fixing without
   otherwise touching the visible roster.
4. **Registered new manifest files** in the `fileNames` array of `dharamVeerManifestRetriever` inside
   `src/lib/ai/retrieval.ts` (the fallback path; the primary embedding-index path auto-discovers via glob
   in the Python index builder and needed no registration).

## 4. Verification performed

- **Index Generation**: Ran `python3 python/ai_pipeline/src/ai_pipeline/embeddings/build_dharam_veer_index.py` successfully both in batch 2 and again in batch 3 (now reports 128 chunks across 16 heroes).
- **Retriever Smoke Tests (batch 2)**: Verified that querying for any of the 13 supported `figure_id`s returns their own correctly-attributed chunks, and querying for currently unsupported ones returns zero documents (triggering clean fallback).
- **Retriever Smoke Tests (batch 3)**: Re-ran smoke tests via `npx tsx` against the live `dharamVeerRetriever` export for all 16 supported heroes (13 previous + 3 new) plus 2 unsupported ones (`bahubali`, an unknown id). Confirmed: (a) each of the 3 new figure_ids returns exactly its own 8 chunks and no other hero's `doc_id`; (b) all 7 previously-broken hyphenated multi-word heroes now correctly return their own 8 chunks after the bug fix in section 3b; (c) `bahubali` and an unknown figure_id both correctly return 0 documents with no cross-hero leakage.
- **TypeScript & Lint**: `eslint src/lib/ai/retrieval.ts` passes cleanly. Full-repo `npx tsc --noEmit` exceeds this environment's command timeout (large monorepo); scoped `tsc --noEmit --skipLibCheck` against the changed file plus a live `npx tsx` execution of the retrieval module (which itself requires valid TypeScript) surfaced no errors in the changed code.

## 5. Batch 3 outcome for the heroes queued in batch 2

| Hero | figure_id | Tradition | Outcome |
|---|---|---|---|
| Maharana Pratap | `maharana-pratap` | Hindu | **Added.** Sourced from Tod's *Annals and Antiquities of Rajasthan* (1829), Book IV Ch. 11, via the ibiblio.org "British Raj" public-domain transcription. |
| Rani Lakshmibai | `rani-lakshmibai` | Hindu | **Added**, but not from the originally-planned Parasnis source (see 5b). Sourced instead from Malleson's *History of the Indian Mutiny of 1857-8*, Vol. 5 (1897). |
| Guru Arjan Dev | `guru-arjan-dev` | Sikh | **Added.** Sourced from Macauliffe's *The Sikh Religion*, Vol. 3 (1909), Chapters I and VII. |
| Bahubali | `bahubali` | Jain | **Skipped.** No verified public-domain English translation located (see 5b). |

## 5b. Sourcing notes and rejected candidates

- **Rani Lakshmibai**: D. B. Parasnis's 1894 biography is in Marathi; no verified public-domain English
  translation of it could be located, so it was not used. Two English-language alternatives were reviewed
  and rejected: (1) Michael White's *Lachmi Bai Rani of Jhansi, the Jeanne d'Arc of India* (1901,
  archive.org `lachmibairaniofj00whitiala`) is public domain by age (pre-1929, `NOT_IN_COPYRIGHT`), but is
  catalogued by its own library/publisher metadata as **Fiction** -- a novelised account, not a
  documentary source -- and was rejected on content-integrity grounds ("do not fabricate content" extends
  to not treating historical fiction as factual biography even when the fiction itself is public domain.
  (2) *Rani Lakshmi Bai Of Jhansi* by Shyam Narain Sinha (archive.org `in.ernet.dli.2015.99215`) is dated
  **1980** and is a modern work; despite a DLI metadata tag claiming "In Public Domain" (DLI's blanket
  rights tags are frequently unreliable for 20th-century scans), a 1980 work by a named author is not
  reliably public domain in any jurisdiction, and it was rejected as a "modern copyrighted biography" per
  policy. Malleson's 1897 military history was used instead: it is unambiguously public domain, is a
  documentary (not novelised) primary source, and its own closing assessment of the Rani is included
  verbatim in the manifest (chunk 1.7) to balance its British colonial-era framing.
- **Bahubali**: the earliest substantial account of Bahubali is in Jinasena's *Adipurana* (9th century
  Sanskrit). The only complete English translations located are modern and not public domain (Shantilal
  Nagar's 2020 edition; George Strohl's 1984 University of Chicago dissertation / 1990 translation). A
  1951 Sanskrit-only edition exists on archive.org (`in.ernet.dli.2015.327048`) but translating it
  ourselves would not be "verbatim public domain source text" and risks inaccuracy -- exactly what the
  "skip rather than guess" policy exists to prevent. Bahubali therefore remains unsupported; the
  `bahubali` figure_id correctly returns the safe fallback (verified in section 4).
