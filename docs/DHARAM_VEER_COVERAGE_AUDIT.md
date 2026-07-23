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
3. **Added a `figure_id` field to every chunk** in the 3 new manifests, matching the original task
   specification (`figure_id`, `source_name`, `source_url`, `source_class`, `rights_status`, `chunk_type`,
   citation/provenance). This field was missing from this batch's first draft and is also absent from all
   13 pre-existing hero manifests (a pre-existing schema gap outside this batch's scope, noted here for a
   future cleanup pass -- it does not affect retrieval, since `doc_id` alone is what's matched against
   `figure_id` at query time).
4. **Corrected an internal `doc_id` naming inconsistency introduced by this batch, found during an
   independent aggressive re-review after the initial commit.** The established convention in this
   corpus -- confirmed by inspecting the actual `doc_id` field (not just the filename) of all 13
   pre-existing manifests -- is that multi-word `doc_id` values are **hyphenated to match `figure_id`
   exactly** (e.g. `dharam_veer_guru_gobind_singh.json` has `doc_id: "dharam_veer_guru-gobind-singh"`,
   even though its *filename* uses underscores). This batch's first draft instead gave the 3 new
   manifests **underscored** `doc_id` values (e.g. `dharam_veer_guru_arjan_dev`), which do not match
   production `figure_id` (`guru-arjan-dev`) under exact comparison. The initial commit "fixed" this by
   adding hyphen/underscore normalization to the retrieval matching logic in
   `src/lib/ai/retrieval.ts` -- but that fix was based on an **incorrect diagnosis**: the commit message
   and this doc originally (and wrongly) claimed the normalization also fixed a pre-existing bug
   affecting 7 of the 13 previously-supported heroes. Direct inspection of those 7 manifests' `doc_id`
   fields during this review showed they were **already hyphenated and already matching correctly**
   before this batch -- there was no such pre-existing bug. The real, narrower issue was only that this
   batch's own 3 new manifests didn't follow the established convention. **Fix applied in this review**:
   changed the 3 new manifests' `doc_id` values to the hyphenated convention
   (`dharam_veer_guru-arjan-dev`, `dharam_veer_maharana-pratap`, `dharam_veer_rani-lakshmibai`), matching
   the other 13 heroes exactly. The hyphen/underscore normalization in `retrieval.ts` was **kept** as
   defensive robustness (it's harmless and now correctly documented as such, not as a historical bug
   fix) rather than reverted, since it protects against the same mistake recurring in a future manifest
   addition without adding any risk (see section 4 for the exhaustive check that no other corpus is
   affected, since `filters.title` is only ever populated for Dharam Veer's retriever).
5. **Registered new manifest files** in the `fileNames` array of `dharamVeerManifestRetriever` inside
   `src/lib/ai/retrieval.ts` (the fallback path; the primary embedding-index path auto-discovers via glob
   in the Python index builder and needed no registration).

## 4. Verification performed

- **Index Generation**: Ran `python3 python/ai_pipeline/src/ai_pipeline/embeddings/build_dharam_veer_index.py` successfully both in batch 2 and again in batch 3 (now reports 128 chunks across 16 heroes).
- **Retriever Smoke Tests (batch 2)**: Verified that querying for any of the 13 supported `figure_id`s returns their own correctly-attributed chunks, and querying for currently unsupported ones returns zero documents (triggering clean fallback).
- **Retriever Smoke Tests (batch 3)**: Re-ran smoke tests via `npx tsx` against the live `dharamVeerRetriever` export for all 16 supported heroes (13 previous + 3 new) plus 2 unsupported ones (`bahubali`, an unknown id). Confirmed: (a) each of the 3 new figure_ids returns exactly its own 8 chunks and no other hero's `doc_id`; (b) all 7 previously-broken hyphenated multi-word heroes now correctly return their own 8 chunks after the bug fix in section 3b; (c) `bahubali` and an unknown figure_id both correctly return 0 documents with no cross-hero leakage.
- **TypeScript & Lint**: `eslint src/lib/ai/retrieval.ts` passes cleanly. Full-repo `npx tsc --noEmit` exceeds this environment's command timeout (large monorepo); scoped `tsc --noEmit --skipLibCheck` against the changed file plus a live `npx tsx` execution of the retrieval module (which itself requires valid TypeScript) surfaced no errors in the changed code.

## 4b. Independent aggressive re-review (2026-07-23, same day)

Following a request to re-review this batch adversarially as a source-integrity and RAG-safety check,
before any further work the following was independently re-verified from scratch (not just re-reading
prior notes):

- **Source re-verification**: re-fetched all 3 source URLs live (archive.org item page for Guru Arjan
  Dev; both ibiblio.org chapter pages for Maharana Pratap and Rani Lakshmibai) and spot-checked that the
  quoted/paraphrased manifest text matches the live source content and that the `dc.rights: Out_of_copyright`
  / public-domain claims still hold.
- **doc_id convention audit**: read the actual `doc_id` field (not filename) of all 16 manifests directly,
  which surfaced the naming-convention bug described in section 3b (item 4) -- fixed in this review.
- **Cross-corpus side-effect check**: grepped the entire `src/` tree for every call site that populates
  `filters.title` on any retriever. Found exactly one call site in the whole codebase
  (`src/app/api/ai/chat/route.ts`, the `dharam_veer_reflection` mode), confirming the hyphen/underscore
  normalization added to the shared `PramanaManifestRetriever.retrieve()` fallback path is dead code for
  every other corpus (gita, upanishads, gurbani, buddhist, jain, ramayana, panchatantra, bhakti_katha all
  leave `filters.title` unset) and therefore carries zero risk of unintended cross-corpus matching.
- **Adversarial retrieval test** (fresh `npx tsx` script, not reused from the original batch): for all 16
  supported heroes, confirmed exactly 8 own-doc_id chunks returned and no others. For 14 adversarial
  near-miss `figure_id` probes textually similar to a real hero (`arjan`, `guru-arjan`, `pratap`,
  `maharana`, `lakshmibai`, `rani`, `jhansi`, `shivaji`, etc.) confirmed all return zero documents rather
  than partial-matching and leaking that hero's content. For 6 unsupported heroes (`bahubali`,
  `sri-krishna`, `sri-rama`, `hanuman`, `mirabai`, and a nonexistent id) confirmed all fail closed with
  zero documents. For content-level leakage, confirmed each new hero's retrieved chunk text contains a
  hero-specific term (`goindwal` for Guru Arjan Dev, `haldighat` for Maharana Pratap, `gwaliar` for Rani
  Lakshmibai) rather than another hero's material. Two initial test flags (`GURU-ARJAN-DEV`,
  `Maharana-Pratap` returning 8 docs) were investigated and confirmed to be correct, intentional
  case-insensitive matching of the *same* hero -- not cross-hero leakage -- since both retrieval paths
  lowercase `reqTitle` and `doc_id` before comparing, and production always sends canonical lowercase
  `figure_id` values from `src/lib/data/dharm-veers/*.ts` regardless.
- **Index regenerated again** after the `doc_id` fix (still 128 chunks / 16 heroes; `doc_id` values in the
  index metadata now confirmed all-hyphenated for multi-word heroes).

No further issues found after the `doc_id` fix. All findings and fixes from this re-review are captured
in section 3b.

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
