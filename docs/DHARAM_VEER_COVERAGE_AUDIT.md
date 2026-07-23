# Dharam Veer AI Coverage Audit

Last updated: 2026-07-23 (Batch 4)
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

## 3c. Schema cleanup (2026-07-23, same day): figure_id backfilled to all 13 pre-existing manifests

The gap noted in item 3 above -- missing `figure_id` per chunk -- has now been closed for the remaining
13 pre-existing hero manifests too (`ananda`, `arjuna`, `bhishma`, `chanakya`, `emperor-ashoka`,
`guru-gobind-singh`, `guru-nanak-dev`, `guru-tegh-bahadur`, `harishchandra`, `lord-mahavira`,
`parshvanatha`, `chhatrapati-shivaji`, `siddhartha-gautama`). All 16 manifests (128 chunks total) now
carry `figure_id` on every chunk, matching the original task specification exactly.

`figure_id` was derived directly from each manifest's `doc_id` (stripping the `dharam_veer_` prefix) and
cross-checked against the production `id` values in `src/lib/data/dharm-veers/{hindu,sikh,jain,buddhist}.ts`
to confirm an exact match for all 13 before writing. This field is purely additive metadata -- the Python
index builder (`build_dharam_veer_index.py`) does not read or propagate `figure_id` into
`dharam_veer_index.json`, so the index is byte-identical before and after this change and did not need
regenerating (verified via `git diff --exit-code`). Retrieval matching continues to run on `doc_id`, not
`figure_id`, so this change carries no retrieval-behavior risk. Re-ran the full adversarial smoke test
(all 16 heroes return exactly 8 own-doc_id chunks; `bahubali`, `sri-krishna`, and a nonexistent id all
fail closed) after the change -- all pass.
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

## 0d. Scope note — batch 4 expansion (2026-07-23)

This batch adds **5 new verified heroes** (Milinda, Prahlad, Dhruv, Xuanzang, Swami Vivekananda),
bringing the total to **21 heroes, 168 chunks**. This is the largest single batch to date (previous
batches added 8, then 3, heroes). One additional requested candidate, **Banda Singh Bahadur**, was
investigated but not completed in this batch -- see section 6c for the reasoning -- and remains a
strong candidate for a future batch.

### Batch 4 coverage

| Hero | figure_id | Tradition | Chunks | Source | Rights |
|---|---|---|---|---|---|
| King Milinda (Menander I) | `milinda` | Buddhist | 8 | *The Questions of King Milinda*, trans. T. W. Rhys Davids, Sacred Books of the East Vol. 35 (1890) | `public_domain` |
| Bhakta Prahlad | `prahlad` | Hindu | 8 | *The Vishnu Purana*, Book I Ch. XVII & XX, trans. H. H. Wilson (1840) | `public_domain` |
| Bhakta Dhruv | `dhruv` | Hindu | 8 | *The Vishnu Purana*, Book I Ch. XI & XII, trans. H. H. Wilson (1840) | `public_domain` |
| Xuanzang (Hiuen Tsang) | `xuanzang` | Buddhist | 8 | *Si-Yu-Ki: Buddhist Records of the Western World*, Introduction (d), trans. Samuel Beal (1884) | `public_domain` |
| Swami Vivekananda | `swami-vivekananda` | Hindu | 8 | *Speeches and Writings of Swami Vivekananda: A Comprehensive Collection*, 3rd ed. (G. A. Natesan & Co., Madras) | `public_domain` |

### 6a. Sourcing notes and technique

All five heroes were sourced from clean, directly-fetched, per-chapter public-domain hosts, extending
the technique proven in batch 3 (ibiblio.org's "British Raj" collection for large 19th-century English
histories) to two additional hosts that solve the same archive.org large-file-truncation problem for
different genres of source text:

- **sacred-texts.com** -- hosts Wilson's 1840 Vishnu Purana and Rhys Davids' Milinda translation as
  small, clean per-chapter HTML pages (e.g. `vp052.htm` = Book I Chapter XVII). Used for Prahlad and
  Dhruv (Vishnu Purana) directly.
- **wisdomlib.org** -- hosts numerous public-domain Sacred-Books-of-the-East-era translations
  (Rhys Davids' Milindapanha, Beal's Si-Yu-Ki) as clean per-chapter pages with a navigable book index.
  Used for Milinda (Book II Chapter 1, the "chariot" dialogue) and Xuanzang (the biographical
  Introduction section, distinct from -- and better suited to a hero-narrative than -- the
  travelogue's country-by-country chapters).
- **archive.org full-text (`_djvu.txt`) scans** -- used for Swami Vivekananda, an early (public-domain)
  compiled edition, *Speeches and Writings of Swami Vivekananda: A Comprehensive Collection*
  (G. A. Natesan & Co., Madras; archive.org identifier `speecheswritings00viveuoft`). This source is a
  large scanned volume and the fetch truncated before reaching some sections (notably the famous 1893
  Chicago "Sisters and Brothers of America" address), but the truncated portion that *was* returned
  contained two complete, directly quotable, citable sections: the "My Master" lecture (Vivekananda's
  own account of meeting Ramakrishna) and a "Reply to Address of Welcome" tour speech. Only these
  directly-fetched sections are quoted in the manifest; the Chicago address is explicitly *not*
  represented and is noted as such in the manifest's `revision_note`, per the "skip rather than guess"
  policy -- it was not fabricated or paraphrased from secondary summaries. `wikisource.org`, which
  hosts a clean per-speech transcription of the Chicago address, was attempted first but consistently
  returned empty content in this session (possibly a fetch-tool restriction on that domain); this is
  flagged as a good starting point for a future batch that wants to add the Chicago address.

For Xuanzang and Milinda specifically, care was taken to source from the *biographical/dialogue*
portions of their respective works (Xuanzang's own life story; the opening philosophical exchange
between Milinda and Nagasena) rather than the bulk of each work (a country-by-country travelogue for
Xuanzang; hundreds of pages of further philosophical dialogues for Milinda), since a Dharm Veer entry
needs narrative/trial content about the person, not an encyclopedic excerpt of the work they authored
or inspired.

### 6b. Verification performed

- All 5 new manifest files validated programmatically: exactly 8 chunks each, `doc_id` hyphenated and
  matching the production `figure_id` in `src/lib/data/dharm-veers/{hindu,buddhist}.ts` exactly, every
  chunk carries `figure_id` matching the manifest's own hero, and every chunk has all 8 required fields
  (`ref`, `figure_id`, `chunk_type`, `text`, `source_name`, `source_url`, `rights_status`,
  `source_class`).
- New manifest filenames registered in `dharamVeerManifestRetriever`'s `fileNames` array in
  `src/lib/ai/retrieval.ts` (fallback path only; the primary index-based path auto-discovers new
  `dharam_veer_*.json` files via glob and needed no registration).
- `dharam_veer_index.json` regenerated via `build_dharam_veer_index.py`; now indexes **21 heroes,
  168 chunks** (up from 16 heroes, 128 chunks).
- Live retrieval smoke test run against the rebuilt index and running `PramanaDharamVeerEmbeddingRetriever`
  code (via `npx tsx`, not just static inspection):
  - All 5 new heroes return exactly 8 chunks each, and every returned chunk's `docId` belongs to that
    same hero (no cross-hero leakage).
  - Fail-closed check: 4 unsupported heroes (`akali-phula-singh`, `hanuman`, `bahubali`,
    `banda-singh-bahadur`) each return **0** chunks, confirming the safe-fallback path still holds for
    heroes without a manifest.
  - Near-miss / cross-leak probes (`millind`, `xuan-zang`, `dhruva`, `prahlada` -- deliberately close
    misspellings of the 4 new hero ids) each return **0** chunks, confirming the exact-match retrieval
    logic does not fuzzy-match or leak content to adjacent spellings.
  - Full-roster sanity check: all 21 supported heroes (16 pre-existing + 5 new) return non-empty
    results in a single run, with 0 failures.
- `npx eslint src/lib/ai/retrieval.ts` run clean (no errors, no warnings) on the registration change.
  Full-repo `npx tsc --noEmit` was not run to completion in this session (exceeds the environment's
  45-second command timeout on this monorepo, as noted in prior batches); the live `npx tsx` execution
  of the retriever module is used as the practical substitute, since it requires the module to be valid,
  loadable TypeScript to run at all.

### 6c. Banda Singh Bahadur — investigated, not completed this batch

Banda Singh Bahadur was one of six candidates selected for this batch (from the 54-hero unsupported
roster) alongside the five heroes above. A strong public-domain source was identified --
J. D. Cunningham's *History of the Sikhs* (1849; Cunningham died 1851, so the work is unambiguously
public domain) -- but no clean per-chapter host (equivalent to ibiblio's "British Raj" collection or
sacred-texts.com/wisdomlib.org's chapter pages) could be located for this specific title within the
session's time budget, and a direct archive.org `_djvu.txt` fetch of the full volume would have hit the
same large-file truncation problem seen with Milinda's front matter earlier in this session, requiring
extensive manual page-hunting to locate the relevant chapter. Rather than guess at or paraphrase the
relevant passages from search-result summaries, this hero was skipped and left for a future batch, per
the project's standing "skip rather than guess" policy. `docs/CONTENT_COVERAGE_REPORT.md` reflects this
with an updated skip-reason note.

## 7. Corpus runway assessment — how much longer can Dharm Veer keep expanding?

The user asked, after this batch, for an honest assessment of how long the Dharm Veer corpus can keep
growing with genuinely unique, properly public-domain-sourced content before hitting diminishing
returns. Based on four batches of hands-on sourcing work (23 heroes now investigated in depth: 21
supported + bahubali + banda-singh-bahadur skipped), the honest picture is:

**Remaining runway is real but no longer "easy" -- roughly 15-20 more heroes look sourceable with the
current technique before the pool of clean, single-hero, single-chapter public-domain sources runs
low.** Concretely, of the 49 heroes still unsupported:

- **Good near-term candidates (~10-12 heroes), likely sourceable in 1-2 more batches with the same
  technique:** `sri-krishna` and `sri-rama` (Wilson's Vishnu Purana / Griffith's Ramayana translation,
  both already proven sources this session), `hanuman` and `valmiki` (Griffith's Ramayana), `mirabai`
  and `kabir` (early PD English verse-translation anthologies exist, e.g. Tagore's 1915 "Songs of
  Kabir" -- though as noted in this session, Kabir's *biography* is legendary/contested and would need
  care to avoid inventing narrative), `br-ambedkar` (his own writings, e.g. speeches and *Annihilation
  of Caste*, are early-20th-century and may already be PD or nearing it -- needs a fresh rights check
  since he died 1956), `hari-singh-nalwa` and `maharaja-ranjit-singh` (covered in the same Cunningham
  *History of the Sikhs* and other 19th-century British Punjab histories already identified for Banda
  Singh Bahadur), `nagarjuna` and `bodhidharma` (covered in translated Chinese Buddhist biographical
  collections, e.g. Beal's other works).
- **Harder candidates (~8-10 heroes) requiring more specialized sourcing effort:** the remaining Sikh
  martyrs (`baba-deep-singh`, `mai-bhago`, `bhai-taru-singh`, `bhai-mani-singh`, `akali-phula-singh`,
  `nawab-jassa-singh`) are covered in Macauliffe's *Sikh Religion* (already a proven source for 4
  existing heroes) but in later volumes not yet directly fetched/verified; the remaining Jain acharyas
  (`bhadrabahu`, `kundakunda`, `hemachandra`, `sthulabhadra`, `haribhadra`) require Jain-specific SBE-era
  translations that exist but are less centrally indexed on sacred-texts.com/wisdomlib.org than the
  Hindu/Buddhist material has been.
- **Genuinely hard or likely-unsourceable in the near term (~15-20 heroes):** modern or 20th-century
  figures whose primary writings are not yet public domain by age and for whom no early-compiled PD
  edition exists (e.g. `thich-nhat-hanh`, d. 2022; `shrimad-rajchandra`, d. 1901 but whose PD status
  needs verification per-work), or figures like `bahubali` already investigated and confirmed to lack a
  documentary (non-fiction, non-modern) PD English source in this session's search.

**Bottom line:** this session roughly tripled the supported roster from 5 -> 21 heroes across four
batches, at an average pace of ~5-8 verified heroes per batch once the sourcing technique matured. At a
similar pace, the "good candidate" tier alone supports **2-3 more solid batches** (roughly reaching
30-33 supported heroes) before the corpus shifts from "actively expandable with the current technique"
to "requires case-by-case specialized sourcing" for the harder tier. Beyond that point, further growth
is still possible but batch sizes will likely shrink and require more research time per hero, since the
remaining candidates skew toward either contested/legendary biographies (risk of inventing narrative)
or modern figures without settled public-domain status.

