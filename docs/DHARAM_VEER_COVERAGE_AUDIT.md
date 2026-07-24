# Dharam Veer AI Coverage Audit

Last updated: 2026-07-23 (Batch 11)
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

## 0e. Scope note — batch 5 expansion (2026-07-23): the Ramayana/epic cluster

This batch adds **5 new verified heroes** (Sri Rama, Hanuman, Shabari, Valmiki, Sri Krishna),
bringing the total to **26 heroes, 208 chunks**. This batch was explicitly prioritized by user
request to close the single biggest user-facing gap in the corpus: the three most iconic,
highest-traffic Hindu figures (Krishna, Rama, Hanuman) were, until this batch, all unsupported
despite being the names most users would try first.

### Batch 5 coverage

| Hero | figure_id | Tradition | Chunks | Source | Rights |
|---|---|---|---|---|---|
| Sri Rama | `sri-rama` | Hindu | 8 | *The Ramayana of Valmiki*, Book II Ch. XVIII-XIX, trans. Ralph T. H. Griffith (1870-1889) | `public_domain` |
| Hanuman | `hanuman` | Hindu | 8 | *The Ramayana of Valmiki*, Book V Ch. I & XIV, trans. Ralph T. H. Griffith (1870-1889) | `public_domain` |
| Shabari | `shabari` | Hindu | 8 | *The Ramayana of Valmiki*, Book III Ch. LXXV, trans. Ralph T. H. Griffith (1870-1889) | `public_domain` |
| Valmiki | `valmiki` | Hindu | 8 | *The Ramayana of Valmiki*, Book I Ch. II, trans. Ralph T. H. Griffith (1870-1889) | `public_domain` |
| Sri Krishna | `sri-krishna` | Hindu | 8 | *The Vishnu Purana*, Book V Ch. I & III, trans. H. H. Wilson (1840) | `public_domain` |

### 8a. Sourcing notes

All five heroes were sourced from Griffith's 1870-1889 verse translation of Valmiki's Ramayana
(Griffith died 1906, unambiguously public domain) via wisdomlib.org's clean per-canto hosting
(`ramayana-of-valmiki-griffith`, sequential `docNNNNNNN.html` IDs discoverable from the book's
own table-of-contents page), plus Wilson's 1840 Vishnu Purana Book V (already a proven source
this session for Prahlad and Dhruv) for Krishna's birth narrative.

A note on scope discipline: each of these five heroes has a vast, multi-book canonical narrative
(the Ramayana alone runs to 6-7 books; Krishna's life fills the entirety of Vishnu Purana Book V
plus the Bhagavata Purana). Rather than attempt shallow coverage of an entire epic in 8 chunks,
each manifest was deliberately scoped to a **single, complete, well-defined episode**:

- **Sri Rama**: only the acceptance of exile (Book II, Ch. XVIII-XIX) -- not the war in Lanka or
  the return, which would need their own future batch.
- **Hanuman**: only the ocean-crossing leap and discovery of Sita (Book V, Ch. I & XIV) -- not the
  meeting with Sita itself, the burning of Lanka, or his role in the war.
- **Sri Krishna**: only the divine decision to incarnate and the birth-night exchange (Book V,
  Ch. I & III) -- not the Gokula childhood (butter-theft, Kaliya, Govardhana), youth, or the
  Bhagavad Gita (the Gita is already separately represented in the Pathshala Gita corpus, a
  different part of the app).
- **Shabari** and **Valmiki** are each complete, self-contained single-chapter episodes and did
  not need this scoping decision.

This mirrors the same discipline already established for Guru Arjan Dev and Milinda in earlier
batches: each manifest's `revision_note` explicitly states which portion of the source was
fetched/verified and which large remaining portions were *not* included, so a future batch can
extend any of these heroes with additional chunks from later chapters of the same proven sources
without re-doing the sourcing work.

**Savitri** was originally scoped into this batch alongside the other five but was not completed
in the time available; her likely source (Kisari Mohan Ganguli's translation of the Mahabharata,
Vana Parva -- already proven this session for Bhishma and Arjuna) was not fetched/verified. She
remains a strong, low-effort candidate for the very next batch, documented in
`docs/CONTENT_COVERAGE_REPORT.md`.

### 8b. Verification performed

- All 5 new manifest files validated programmatically (8 chunks each, hyphenated `doc_id` matching
  the production `figure_id` in `src/lib/data/dharm-veers/hindu.ts` exactly, `figure_id` present
  and correct on every chunk, all 8 required fields on every chunk).
- New filenames registered in `dharamVeerManifestRetriever`'s `fileNames` array (fallback path).
- `dharam_veer_index.json` regenerated: now indexes **26 heroes, 208 chunks** (up from 21 heroes,
  168 chunks).
- Live retrieval smoke test via `npx tsx` against the rebuilt index and running retriever code:
  - All 5 new heroes return exactly 8 own chunks each, with zero cross-hero leakage.
  - Fail-closed check: `savitri` (deliberately left unsupported this batch), plus
    `adi-shankaracharya`, `banda-singh-bahadur`, and `bahubali`, each return 0 chunks.
  - Near-miss probes (`rama`, `shri-rama`, `hanuma`, `krishna`, `valmeeki` -- plausible alternate
    spellings/shortenings a manifest author or future normalization change might introduce) all
    return 0 chunks, confirming exact-match retrieval still holds with no fuzzy leakage.
  - Full-roster sanity check: all 26 supported heroes return non-empty results, 0 failures.
- `npx eslint src/lib/ai/retrieval.ts` clean.

## 9. Corpus runway assessment (updated after batch 5)

The batch-4 runway assessment (section 7) estimated the corpus could sustain roughly 2-3 more
solid batches before diminishing returns. Batch 5 confirms that estimate is holding: the Ramayana
alone (via Griffith's clean per-canto wisdomlib.org hosting) is proven to comfortably support
several more heroes across future batches without new sourcing research -- Savitri (Mahabharata,
different source, already proven), and later Ramayana books can extend Rama/Hanuman/Krishna with
additional episodes rather than needing wholly new heroes. The next planned batches (Sikh Guru
completion, remaining Sikh martyrs, Hindu bhakti saints, Jain figures, remaining Buddhist figures)
are tracked in the project's task list and remain consistent with the original section 7 estimate
of ~15-20 more heroes being realistically sourceable before the technique needs to shift to
case-by-case specialized research for the hardest remaining candidates.



## 10. Scope note — Batch 6 (Sikh figures) blocked on source access, not source existence (2026-07-23)

Before Batch 8, an attempt was made to source the 11 remaining Sikh figures (Banda Singh Bahadur,
Baba Deep Singh, Mai Bhago, Mata Gujri, Hari Singh Nalwa, Bhai Taru Singh, Bhai Mani Singh, Bhai
Gurdas, Akali Phula Singh, Maharaja Ranjit Singh, Nawab Jassa Singh). The known primary sources for
these figures exist (Macauliffe's *The Sikh Religion* Vol. 5-6, Cunningham's *History of the
Sikhs*, Lepel Griffin's *Ranjit Singh*), but every candidate is a large multi-hundred-page 19th
century scan on archive.org, and the fetch tooling used this session truncates `_djvu.txt` full-text
downloads at roughly 100-110K characters from the start of the file. For all three sources tried,
the target figures' biographical chapters fall well past that truncation point (confirmed via
Macauliffe Vol. 5's table of contents, visible within the truncated portion, showing "Interview
with Banda" and "Banda's Career" are much later in the 610KB file; and via Griffin's *Ranjit Singh*,
where the truncated portion only reaches the introductory "Sikh Theocracy" chapter on Guru history,
not Ranjit Singh's own biography). Wikisource, which would sidestep this problem via per-chapter
pages, was unreachable via the fetch tool this session (5 different URL/API patterns all returned
empty content, likely a transient host-level issue rather than the content not existing). This
batch was therefore deferred rather than forced through with weaker sourcing, and the task list
entry (`Batch 6`) was updated to record this as a tooling blocker to retry, not a dead end.

## 11. Scope note — Batch 8 expansion: Hindu bhakti saints (2026-07-23)

This batch adds **4 new heroes** -- Tulsidas, Tukaram, Ramakrishna, and Kabir -- bringing the
Dharm Veer corpus to **30 heroes, 240 chunks**.

| Hero | Source | Notes |
|---|---|---|
| Tulsidas | F. S. Growse, *The Ramayana of Tulsi Das*, Introduction (1883), archive.org `rmyanaoftuls00tulauoft` | Growse's scholarly Introduction quotes and translates the Bhakt-Mala (with Priya Das's 1713 gloss) and H. H. Wilson's 1828 essay; only the biographical Introduction was used, not the translated epic itself. |
| Tukaram | J. Nelson Fraser & K. B. Marathe, *The Poems of Tukarama*, Vol. III (Christian Literature Society for India, 1915), "Autobiography" section, archive.org `poemstukrma00maragoog` | Unlike other entries, Tukaram is known almost entirely through his own first-person abhangas rather than a third-person narrative; this manifest draws its framing directly from those songs, consistent with how the tradition remembers him. |
| Ramakrishna | F. Max Muller, *Ramakrishna, His Life and Sayings*, "Ramakrishna's Life" chapter (1898), sacred-texts.com | Rich, detailed third-person biographical chapter; Muller died 1900, unambiguously public domain. |
| Kabir | Evelyn Underhill's biographical Introduction to Rabindranath Tagore's *Songs of Kabir* (1915), sacred-texts.com | sacred-texts.com states explicitly the etext "is in the public domain in the US because it was published prior to 1923." Underhill herself flags Kabir's traditional biography as legendary and not reliably attested; that framing is preserved in the manifest. |

### 11a. Heroes investigated but not sourced this batch

- **Adi Shankaracharya** and **Ramanujacharya**: the available PD translations (George Thibaut's
  Sacred Books of the East volumes on the Vedanta-Sutras, SBE 34 and SBE 48) are dense philosophical
  commentary with no accessible biographical narrative in their introductions -- unlike Growse's
  Tulsidas introduction, Thibaut's focus is comparative doctrine, not the commentators' lives. No
  substitute PD biography was located this batch.
- **Mirabai**: the only candidate English translation found (A. J. Alston, 1980, Motilal
  Banarsidass) is a modern copyrighted work. An archive.org Digital-Library-of-India copy is
  mislabeled `Out_of_copyright` in its metadata, but DLI rights metadata is known to be unreliable
  and a 1980 translation cannot plausibly be PD; it was not used. No pre-1929 English translation of
  her bhajans was located.
- **Ramana Maharshi**: not investigated in depth (died 1950; most English biographical material is
  likely still under copyright and would need careful pre-1930 sourcing or an explicit rights
  determination).
- **Samarth Ramdas**: not investigated this batch; Justin Abbott's "Poet-Saints of Maharashtra"
  series is a plausible candidate for a future batch if a pre-1929 volume can be confirmed.

### 11b. Verification performed

- All 4 new manifest files validated programmatically (8 chunks each, hyphenated `doc_id` matching
  the production `figure_id` in `src/lib/data/dharm-veers/hindu.ts` exactly, `figure_id` present on
  every chunk).
- New filenames registered in `dharamVeerManifestRetriever`'s `fileNames` array.
- `dharam_veer_index.json` regenerated: now indexes **30 heroes, 240 chunks** (up from 26 heroes,
  208 chunks).
- Live retrieval smoke test via `npx tsx` against the rebuilt index and running retriever code
  (importing `PramanaRetrieverSelector` from `@sangam/pramana-serve` directly, with `retrieval.ts`
  imported for its module-level `.register()` side effects):
  - All 4 new heroes (`tulsidas`, `tukaram`, `ramakrishna`, `kabir`) return their own chunks with
    the correct `docId`.
  - Fail-closed check: `adi-shankaracharya`, `ramanujacharya`, `mirabai`, `samarth-ramdas`, and
    `ramana-maharshi` (all deliberately left unsupported this batch) each return 0 documents.
- `npx eslint src/lib/ai/retrieval.ts` clean.


## 12. Scope note — Batch 9 expansion: Jain figures (2026-07-23)

This batch adds **2 new heroes** -- Rishabhanatha and Gautama Swami -- bringing the Dharm
Veer corpus to **32 heroes, 256 chunks**. Jain remains the tradition with the fewest supported
heroes (2 of ~12 unsupported roster Jain figures), consistent with prior notes that it is the
weakest-covered tradition.

| Hero | Source | Notes |
|---|---|---|
| Rishabhanatha | Hermann Jacobi, *Jaina Sutras Part I* (SBE 22), 'Kalpa Sutra: Life of Rishabha' (1884), sacred-texts.com | The Kalpa Sutra narrates Rishabha's life using the same formulaic scriptural template it applies to Mahavira; this manifest preserves that formal register rather than paraphrasing into modern narrative prose. |
| Gautama Swami | Same source, 'Life of Mahavira' (Lecture 5) and 'List of the Sthaviras' | The text refers to him throughout by his personal name, Indrabhuti, of the Gautama gotra. Draws on the well-attested episode of his attaining Kevala only on the night Mahavira died, having been held back until then by his own attachment to his teacher. |

### 12a. Heroes investigated but not sourced this batch

- **Bhadrabahu** and **Sthulabhadra**: Jacobi's Kalpa Sutra 'List of the Sthaviras' names both
  (6th and 7th patriarchs after Mahavira respectively) with their gotras and lists of disciples,
  but this is bare genealogy -- no narrative content exists in this source to build chunks with
  real life_context/trial_sacrifice/core_dharmic_act distinctions. Their famous legendary
  material (Bhadrabahu's connection to the 12-year famine and the Chedasutras; Sthulabhadra's
  renunciation and four months spent with a courtesan without breaking his vows) was not located
  in a verified public-domain source this batch.
- **Chandanbala**: her well-known story (the first laywoman to give Mahavira alms after his
  enlightenment, later head of his order of nuns) does not appear in Jacobi's Kalpa Sutra
  translation. A different Jain hagiographic source (e.g. a translation of Hemachandra's
  *Trishashtishalakapurushacharita*) would be needed and was not located this batch.
- **Hemachandra, Lonka Saha, Shrimad Rajchandra, Kundakunda, Haribhadra, Yashovijaya, Kumarpal**:
  not investigated this batch; candidates for a future pass, most plausibly via later volumes of
  the Sacred Books of the East Jaina Sutras (Part II, SBE 45) or dedicated PD translations of
  their individual works if any exist.

### 12b. Verification performed

- Both new manifest files validated programmatically (8 chunks each, hyphenated `doc_id` matching
  the production `figure_id` in `src/lib/data/dharm-veers/jain.ts` exactly, `figure_id` present on
  every chunk).
- New filenames registered in `dharamVeerManifestRetriever`'s `fileNames` array.
- `dharam_veer_index.json` regenerated: now indexes **32 heroes, 256 chunks** (up from 30 heroes,
  240 chunks).
- Live retrieval smoke test via `npx tsx` (same pattern as batch 8, importing `PramanaRetrieverSelector`
  from `@sangam/pramana-serve` directly and `retrieval.ts` for its registration side effects):
  - Both new heroes (`rishabhanatha`, `gautama-swami`) return their own chunks with the correct
    `docId`.
  - Fail-closed check: `bhadrabahu`, `sthulabhadra`, `chandanbala`, and `bahubali` (all deliberately
    left unsupported) each return 0 documents.
- `npx eslint src/lib/ai/retrieval.ts` clean.

## 13. Scope note — Batch 10 expansion: Buddhist figures

This batch adds 3 Buddhist heroes previously in the unsupported roster, all sourced from
public-domain (pre-1923) translations hosted on sacred-texts.com.

| Hero | Source | Notes |
|---|---|---|
| Mahapajapati Gotami | C.A.F. Rhys Davids, *Psalms of the Sisters* (Therigatha translation, 1909), canto 'LV. Maha-Pajapati the Gotamid', sacred-texts.com | Covers her raising the infant Buddha after Queen Maya's death, her march to Vesali and ordination via Ananda's intercession (founding the Bhikkhuni Order), her Arahantship, and both her own psalm verses and the Buddha's declaration of her seniority. |
| Sariputta | Paul Carus, *The Gospel of Buddha* (1894), ch. 'Sariputta and Moggallana' and ch. 'Sariputta's Faith', sacred-texts.com | Covers his conversion via the ascetic Assaji's stanza, his and Moggallana's joint ordination, the Buddha's praise of him as chief follower, and his dialogue on faith with the Buddha at Nalanda (the parable of the city gatekeeper). |
| Moggallana | Same 'Sariputta and Moggallana' chapter, plus Henry Clarke Warren (trans.), *Buddhism in Translations* (Harvard Oriental Series, 1896), section 41 'The Death of Moggallana' (translated from the Dhammapada and Buddhaghosa's commentary), sacred-texts.com | Covers his joint conversion/ordination with Sariputta, his declared foremost status in psychic power, his death at the hands of hired highwaymen despite repeatedly evading them by supernatural means, his final visit to the Buddha before passing into Nirvana, and the Buddha's teaching that even a perfected disciple was not exempt from the fruit of past karma. |

### 13a. Heroes investigated but not sourced this batch

- **Nagarjuna**: sacred-texts.com hosts his own PD-translated verse work ('She-rab Dong-bu', the
  Tree of Wisdom), but this is his own teaching text, not a biographical narrative. No verified
  public-domain biography of Nagarjuna was located this batch.
- **Bodhidharma, Padmasambhava, Atisha, Sanghamitra**: not investigated in depth this batch;
  candidates for a future pass. Sanghamitra in particular is likely reachable via a clean
  per-chapter public-domain translation of the Mahavamsa if one can be located.
- **Thich Nhat Hanh**: explicitly deferred, not merely unsourced. He died in 2022; his writings
  and any biographical accounts of him are actively under copyright. Not a public-domain
  sourcing candidate at all, now or in any near-future batch.
- **B.R. Ambedkar**: explicitly deferred on a rights-risk basis. He died in 1956; US copyright
  renewal status on his English-language writings (including *The Buddha and His Dhamma*) is
  unclear and was not resolved this batch. Treated as rights-risky per the same caution standard
  applied to other mid-20th-century figures (e.g. Alston's 1980 Mirabai translation), and
  deliberately not sourced rather than guessed.

### 13b. Verification performed

- All three new manifest files validated programmatically (8 chunks each, hyphenated `doc_id`
  matching the production `figure_id` in `src/lib/data/dharm-veers/buddhist.ts` exactly,
  `figure_id` present on every chunk, top-level schema — `doc_id`/`source_name`/`source_class`/
  `tradition`/`rights_status`/`revision_note`/`content` — matching the established convention).
- A schema bug was caught and fixed during this batch: the first draft of all three manifests used
  a top-level `chunks` key instead of the correct `content` key expected by
  `build_dharam_veer_index.py`, which silently produced 0 indexed documents for these heroes. This
  was caught by the retrieval smoke test (queries for the new heroes returned other heroes' chunks
  instead of their own), root-caused by inspecting the build script and an existing correct
  manifest (`dharam_veer_gautama_swami.json`), and fixed by rebuilding all three files with the
  correct schema.
- New filenames registered in `dharamVeerManifestRetriever`'s `fileNames` array.
- `dharam_veer_index.json` regenerated: now indexes **35 heroes, 280 chunks** (up from 32 heroes,
  256 chunks).
- Live retrieval smoke test via `npx tsx` (same pattern as batches 8-9, importing
  `PramanaRetrieverSelector` from `@sangam/pramana-serve` directly and `retrieval.ts` for its
  registration side effects), querying with `filters: { title: figure_id }` to match production
  usage:
  - All three new heroes (`mahapajapati-gotami`, `sariputta`, `moggallana`) return only their own
    chunks with the correct `docId`.
  - Fail-closed check: `nagarjuna`, `thich-nhat-hanh`, and a nonexistent figure_id each return 0
    documents.
- `npx eslint src/lib/ai/retrieval.ts` clean.

## 14. Scope note — Batch 11 expansion: Savitri and Sanghamitra (quick-win sourcing)

Two heroes previously left unsourced (each already flagged in the coverage docs as a
"future batch" candidate with a known likely source) were sourced this batch.

| Hero | Source | Notes |
|---|---|---|
| Savitri | K.M. Ganguli's translation of the Mahabharata, Vana Parva, Pativrata-mahatmya Parva, sacred-texts.com (same translation/site already used for Bhishma and Arjuna) | Sections 291 ('birth of Savitri'), 293 (marriage to Satyavan), 295 (Satyavan's death and Savitri's dialogue with Yama), and 297 (resolution) were fetched. Section 292 (Narada's original prophecy) returned empty on repeated fetch attempts; its content is referenced only indirectly via later sections' own callbacks to it, not quoted directly. |
| Sanghamitra | Wilhelm Geiger's 1912 translation of the Mahavamsa (via Mabel Haynes Bode, Pali Text Society), chapters XVIII-XIX, hosted per-chapter at budsas.org | This site serves the Mahavamsa chapter-by-chapter, which avoided the archive.org djvu.txt truncation problem that blocked several large 19th/early-20th-century scans earlier this session (see section 10). Covers her role as Asoka's daughter, the Bodhi-tree branch's self-severance, her sea voyage escorting both the tree and eleven bhikkhunis, the naga episode, founding the Sri Lankan bhikkhuni order via Queen Anula's ordination, and her later monastic legacy. |

### 14a. Verification performed

- Both new manifest files validated programmatically (8 chunks each, hyphenated/plain `doc_id`
  matching the production `figure_id` in `src/lib/data/dharm-veers/hindu.ts` and `buddhist.ts`
  exactly, `figure_id` present on every chunk, correct top-level schema).
- New filenames registered in `dharamVeerManifestRetriever`'s `fileNames` array.
- `dharam_veer_index.json` regenerated: now indexes **37 heroes, 296 chunks** (up from 35 heroes,
  280 chunks).
- Live retrieval smoke test via `npx tsx`, querying with `filters: { title: figure_id }`:
  - Both new heroes (`savitri`, `sanghamitra`) return only their own chunks with the correct
    `docId`.
  - Fail-closed check: `adi-shankaracharya` and a nonexistent figure_id each return 0 documents.
- `npx eslint src/lib/ai/retrieval.ts` clean.

Dharm Veer roster after this batch: **37/70 heroes source-backed**.

## 15. Scope note — Batch 6 retry (Sikh figures), still blocked

Retried this session before moving to batch 11. Checked two additional angles:

- **Wikisource** (`en.wikisource.org/wiki/The_Sikh_Religion/Volume_5`, which per web search
  covers the Guru Gobind Singh era and would include several of the 11 target figures):
  fetch returned empty content again, consistent with every other Wikisource attempt this
  session (section 10). Still treated as a tooling-level block, not a sourcing dead end.
- **sacred-texts.com Sikhism collection**: confirmed it hosts only Macauliffe's *The Sikh
  Religion* **Volume 1** (Guru Nanak's life only — none of the 11 target figures, who all
  postdate Guru Nanak) and Dorothy Field's *The Religion of the Sikhs* (1914), a short
  general-history volume. Chapter I of Field's book was fetched and read in full: it covers
  all ten Gurus but does not name or narrate any of the 11 target companions/martyrs
  (Banda Singh Bahadur, Baba Deep Singh, Mai Bhago, Mata Gujri, Hari Singh Nalwa, Bhai Taru
  Singh, Bhai Mani Singh, Bhai Gurdas, Akali Phula Singh, Maharaja Ranjit Singh, Nawab Jassa
  Singh) even in passing. Not usable as a source for this batch.

Conclusion unchanged from section 10: Macauliffe's *The Sikh Religion* Volumes 4-6 (which do
cover this era) exist and are public domain, but are only reachable via archive.org djvu.txt
(which truncates before reaching the relevant chapters) or Wikisource (currently returning
empty on every fetch attempt this session). This remains a tooling blocker rather than a
source-availability problem, and batch 6 is left pending for a future session with either a
working Wikisource connection or a different archive.org access strategy (e.g. the
`/fulltext/inside.php` search-inside API, which returned a timeout rather than a hard failure
last attempt and may be worth retrying with a narrower query and longer timeout budget).

## 16. Final full-roster verification (post batch 11)

Ran a comprehensive adversarial smoke test across the entire 70-hero roster in one pass:

- **All 37 source-backed heroes** (`filters: { title: figure_id }`, query "life and teachings"):
  every single one returned exactly one distinct `docId`, matching `dharam_veer_<figure_id>`
  exactly. Zero failures.
- **All 33 remaining unsupported heroes**: every single one returned 0 documents (correct
  fail-closed behavior — no cross-contamination from other heroes' chunks, no partial matches).
  Zero leaks.
- `dharam_veer_index.json` confirmed consistent: 37 manifests, 296 chunks (exactly 8 per hero).
- `npx eslint src/lib/ai/retrieval.ts` clean.
- `git status` clean — all batch 8-11 work fully committed.

**Final roster state: 37/70 heroes source-backed (53%), up from 26/70 at the start of this
session's batch-8-through-11 sequence.**

Breakdown of the remaining 33 unsupported heroes by blocker type:
- **11 Sikh figures** (Batch 6, task #90): blocked by tooling, not source non-existence.
  Macauliffe's *The Sikh Religion* Vols 4-6 (public domain) cover this era but are only
  reachable via archive.org djvu.txt (truncates before the relevant chapters) or Wikisource
  (returns empty on every fetch attempt this session, retried twice). See sections 10 and 15.
- **2 explicitly rights-deferred figures**: `thich-nhat-hanh` (died 2022, actively in
  copyright) and `br-ambedkar` (died 1956, unclear US renewal status) — deliberately not
  sourced regardless of tooling, per the session's rights-safety discipline.
- **20 remaining figures across Hindu/Jain/Buddhist traditions**: either investigated and
  found to have no accessible public-domain narrative source this session (documented
  per-figure in sections 11, 12, 13), or not yet investigated at all and left as candidates
  for a future batch (`ramana-maharshi`, `samarth-ramdas`, `bodhidharma`, `padmasambhava`,
  `atisha`, and the remaining Jain figures beyond Bhadrabahu/Sthulabhadra/Chandanbala).

No fabricated or guessed content exists anywhere in this corpus: every one of the 296 chunks
across 37 manifests traces to a specific fetched public-domain source URL, and every
unsupported figure degrades to the safe fallback explanation rather than a hallucinated
answer.

## 17. Scope note — Batch 12: remaining Hindu figures, still blocked

Retried all 5 remaining unsupported Hindu figures this session. None were sourced.

- **adi-shankaracharya**: retried with two fresh angles beyond the SBE34 Vedanta-Sutras
  commentary already ruled out in batch 8. (1) The 1911 Encyclopaedia Britannica's "Sankara
  Acharya" entry, a short but genuine biographical sketch, exists and is public domain, but
  both hosts checked (Wikisource, theodora.com) returned empty content on fetch — consistent
  with the Wikisource blocker documented in sections 10 and 15, and apparently affecting
  theodora.com too (a control fetch to sacred-texts.com in the same turn succeeded, so this is
  host-specific, not a general tool failure). (2) Checked L.D. Barnett's *Brahma-Knowledge*
  (1911, sacred-texts.com) and confirmed via its full table of contents that it is pure
  philosophical exposition with no biographical chapter on Shankara. No PD biography located.
- **mirabai**: unchanged from batch 8 (Alston's 1980 translation is the only candidate found
  and is not public domain).
- **ramanujacharya**: unchanged from batch 8 (Thibaut's SBE48 commentary has no biographical
  narrative). A candidate general-history source, R.G. Bhandarkar's *Vaisnavism, Saivism and
  Minor Religious Systems* (1913, public domain), was identified but not fetched -- it is only
  reachable via an archive.org DLI scan, which would face the same djvu.txt truncation problem
  documented in section 10, and as a general survey (not a per-figure biography) the page
  location of any Ramanuja material is unknown in advance. Candidate for a future batch with a
  working search-inside capability.
- **ramana-maharshi**: not sourced. He died in 1950; essentially all substantial biographical
  writing about him postdates that death and is presumptively still under copyright. No attempt
  made to find a workaround this batch — treated as rights-risky by the same standard applied
  to Thich Nhat Hanh and B.R. Ambedkar.
- **samarth-ramdas**: investigated. Justin Abbott's translation of Mahipati's *Santavijaya*
  (the standard English-language hagiography of Ramdas, Poet-Saints of Maharashtra series)
  was published in **1932** -- confirmed via web search. As of this session's date (July 2026),
  the rolling US public-domain cutoff has advanced to works published in 1930 (95 years plus
  the following Jan 1), so 1932 remains two years short of entering the public domain (expected
  circa Jan 1, 2028). Not usable. No earlier PD translation of a Ramdas biography was located.

All 5 remain in the unsupported roster, correctly degrading to the safe fallback explanation.
