# Valmiki Ramayana GitHub Source Audit

Date: 2026-07-20

Scope:

- `imradhe/ramayanam`
- `Ashutosh-Vijay/Valmiki_Ramayan_Dataset`

Governing rules:

- `PATHSHALA_SOURCE_POLICY.md`
- `docs/RAMAYANA_CANONICAL_SOURCE_PLAN.md`
- `PRAMANA_CORPUS_ROADMAP.md`

This audit is source-integrity review only. It does not approve ingestion into live Pathshala, Pramana retrieval, or native app payloads.

## Executive Decision

Neither GitHub repository should be ingested directly as Shoonaya's live canonical Valmiki Ramayana source today.

Use them only as audit/reference inputs until licensing, field-level provenance, and text-quality checks are closed:

| Repository | Decision | Reason |
|---|---|---|
| `imradhe/ramayanam` | Reference-only / companion candidate | Clean `Kanda.Sarga.Shloka` ids and IITK source URLs are useful, but the repo appears derived from IIT Kanpur/Valmiki portal content. The repo's MIT license does not by itself prove reusable rights over that upstream text, translation, meaning, or commentary. It also covers only Kandas 1-6 in the complete-looking dataset. |
| `Ashutosh-Vijay/Valmiki_Ramayan_Dataset` | Staging candidate after rights clarification + QA | Broader 1-7 Kanda coverage and standard MIT license text are useful, but README wording conflicts with MIT by saying "non-commercial," field provenance is mixed, and the repo self-reports 1,312 merged groups affecting 3,076 entries. |

The existing canonical plan still stands: for a live starter, prefer Ralph T. H. Griffith's public-domain translation from Project Gutenberg/Wikisource, with Sanskrit companion-only until the exact digital Sanskrit source rights are verified.

## Audit Method

Local clones were inspected under `/tmp/shoonaya-source-audit-20260720135337`.

Checks performed:

- Read each repo's README and license file.
- Counted entries, unique references, Kanda/Sarga coverage, missing fields, duplicates, and gaps.
- Read dataset structure and preprocessing notes.
- Sampled known merged/gap areas and visibly awkward text.
- Compared findings against Shoonaya's source policy and Ramayana canonical source plan.

## Repository 1: `imradhe/ramayanam`

### What It Contains

Relevant files:

- `LICENSE`
- `Readme.md`
- `slokas/*.json`
- `test/*.json`
- `stats.md`

Schema sample:

- `id`: `1.1.1`
- `script`: `devanagari`
- `kanda`, `sarga`, `sloka`
- `text`
- `meaning`
- `translation`
- `source`

The source URL points to `https://www.valmiki.iitk.ac.in/content?...`.

### Coverage Findings

`slokas/` is not the full dataset:

- Total rows: 263
- Kanda coverage: Kanda 1 only
- Sarga coverage: Bala Kanda 1-6

`test/` is the complete-looking dataset:

- Total rows: 19,728
- Unique ids: 19,728
- Duplicate ids: 0
- Kandas: 1-6
- Sargas:
  - Bala: 77
  - Ayodhya: 119
  - Aranya: 75
  - Kishkindha: 67
  - Sundara: 68
  - Yuddha: 131
- Uttara Kanda: absent
- Missing `meaning`: 1 row

### Rights Finding

The repository license is standard MIT. That covers the repository as published by the maintainer, but it does not automatically prove that upstream IIT Kanpur portal text, translation, meaning, and commentary are sublicensable under MIT.

Under `PATHSHALA_SOURCE_POLICY.md`, this means:

- Do not ingest the copied Sanskrit/translation/meaning/commentary live.
- Treat IITK-derived content as `restricted_or_pending` until upstream terms are verified.
- The URLs are useful as reference/cross-check links.

### Text Quality Samples

The dataset includes useful structured content, but also product-quality issues:

- `1.1.60`: "Hearing everything that story from Rama..."
- `1.17.19`: "Some monkeys with acknowledged, valour..."
- `6.131.112`: Sanskrit appears space-collapsed: `श्रुत्वारामायणमिदंदीर्घमायुश्चविन्दति`

These examples are not enough to reject the whole repo as a reference source, but they are enough to block direct user-facing ingestion without cleanup and source review.

### Verdict

Recommended status: `companion_only` / reference-only.

Acceptable uses:

- Cross-check `Kanda.Sarga.Shloka` ids.
- Link to source pages where companion/reference behavior is appropriate.
- Compare verse ordering against another source.

Not acceptable yet:

- Live canonical Sanskrit.
- Live translation.
- Live commentary/meaning.
- Claims of `public_domain` or `is_live_in_app: true`.

## Repository 2: `Ashutosh-Vijay/Valmiki_Ramayan_Dataset`

### What It Contains

Relevant files:

- `LICENSE.txt`
- `README.md`
- `RESOURCES.md`
- `data/Valmiki_Ramayan_Shlokas.json`
- `docs/dataset_structure.md`
- `docs/preprocessing_notes.md`
- `merged_shlokas_report.txt`

Schema:

- `kanda`
- `sarga`
- `shloka`
- `shloka_text`
- `transliteration`
- `translation`
- `explanation`
- `comments`

### Coverage Findings

Dataset file: `data/Valmiki_Ramayan_Shlokas.json`

- Total rows: 23,291
- Unique references: 23,291
- Duplicate references: 0
- Kandas: 1-7
- Sargas:
  - Bala: 77
  - Ayodhya: 119
  - Aranya: 75
  - Kishkindha: 67
  - Sundara: 68
  - Yuddha: 131
  - Uttara: 111
- Missing core fields:
  - `shloka_text`: 0
  - `transliteration`: 0
  - `translation`: 0
  - `explanation`: 0
- Missing `comments`: 22,575
- Detected missing ids:
  - `2.35.21`
  - `3.66.5`

### Self-Reported Quality Issues

The repo's own `merged_shlokas_report.txt` reports:

- Unique merged groups: 1,312
- Entries affected: 3,076

The preprocessing notes explicitly say the dataset was compiled from multiple online sources, merged shlokas were caused by OCR/source formatting issues, and manual verification remains future work.

Concrete examples:

- `Bala Kanda 17.20`, `17.21`, and `17.22` repeat the same merged Sanskrit and English content across adjacent verse rows.
- `Ayodhya Kanda 35.18` and `35.19` contain the same merged text block. The sequence then skips `35.21`.
- `Aranya Kanda 66.2` contains text for both `3.66.1` and `3.66.2`, while `3.66.5` is absent.
- `Bala Kanda 50.5`: "nottoocrowded", "watersource".
- `Bala Kanda 18.54`: "I feel I haved acquired..."

### Rights Finding

`LICENSE.txt` is standard MIT. However, the README says the dataset is free for "research, learning, and non-commercial projects," which conflicts with MIT's normal commercial-use grant.

This creates a rights ambiguity. Before using it as a Shoonaya source:

- Record the actual license text.
- Resolve the README/license contradiction.
- Prefer opening a maintainer issue or obtaining written clarification.

The dataset also lists multiple sources:

- M. N. Dutt's English translation via Archive.org
- IIT Kanpur / Gita Supersite references
- Gyaandweep
- other reference editions in `RESOURCES.md`

Because the JSON does not label field-level source provenance, Shoonaya cannot assume every field is public-domain Dutt-derived. Field-level provenance must be established before any live use.

### Verdict

Recommended status: staging candidate only, not live.

Potentially acceptable after follow-up:

- Use as a non-live import candidate for QA tooling.
- Use to locate coverage gaps and merged-verse defects.
- Use M. N. Dutt-derived English only if field-level provenance and rights are confirmed.

Not acceptable yet:

- Direct live import of all fields.
- Treating `translation`/`explanation` as a public-domain layer without proof.
- Copying Sanskrit/transliteration as live text without source-rights verification.
- Shipping Uttara Kanda without a product decision that it belongs in public coverage.

## Shoonaya Policy Mapping

| Policy Requirement | `imradhe/ramayanam` | `Ashutosh-Vijay/Valmiki_Ramayan_Dataset` |
|---|---|---|
| Named source | Yes, source URLs point to IITK portal | Repo-level sources listed, but per-field source is not recorded |
| Rights status | Unclear for upstream copied content | Ambiguous because MIT license conflicts with README wording and fields are mixed-source |
| Canonical reference | Good numeric `Kanda.Sarga.Shloka` ids | Good Kanda/Sarga/Shloka fields, but two detected gaps |
| Complete Valmiki coverage | Kandas 1-6 only | Kandas 1-7 |
| Text quality | Usable reference, but awkward grammar and formatting samples found | Known merged/OCR issues affect 3,076 entries |
| Live ingestion readiness | No | No |

## Recommended Workflow

1. Keep both repos out of live app content.
2. Add them, if needed, to a non-live source-audit workspace only.
3. Preserve Shoonaya's existing canonical direction:
   - live English: Griffith via Project Gutenberg/Wikisource
   - Sanskrit: companion-only until exact digital source rights are verified
   - explanation: Shoonaya-original and labeled
4. If evaluating `Ashutosh-Vijay` further, resolve the MIT/non-commercial contradiction first.
5. Build a normalizer that imports into a quarantine table or JSON artifact with `is_live_in_app=false`.
6. Add automated checks before any promotion:
   - duplicate id check
   - missing id check
   - merged-verse marker check
   - HTML cleanup check
   - source URL presence
   - field-level rights metadata
7. Manually review a starter batch before product use.

## Proposed Starter Acceptance Gate

For each candidate verse:

- Reference is exact `Kanda.Sarga.Shloka`.
- Verse exists in at least two independent references.
- English live layer is confirmed public-domain or rights-cleared.
- Sanskrit source rights are verified, or Sanskrit is companion-only.
- No merged verse markers inside a single row unless explicitly modeled as a multi-verse passage.
- Translation and explanation are separated.
- Shoonaya explanation is labeled as Shoonaya-original.
- Required metadata from `PATHSHALA_SOURCE_POLICY.md` is complete.

## Final Recommendation

Do not switch the Ramayana source plan to either GitHub repo.

Use `imradhe/ramayanam` as a reference/checking source only. Use `Ashutosh-Vijay/Valmiki_Ramayan_Dataset` as a stronger non-live QA candidate only after license clarification and merged-verse remediation.

For production, continue toward a Griffith/Gutenberg public-domain English layer and a separately verified Sanskrit companion/live layer, exactly as `docs/RAMAYANA_CANONICAL_SOURCE_PLAN.md` already requires.
