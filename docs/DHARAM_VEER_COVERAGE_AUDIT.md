# Dharam Veer AI Coverage Audit

Last updated: 2026-07-22
Owner: Pramana source-integrity review

## 0. Scope note — smaller batch than requested

The originating prompt asked for 8-12 newly-sourced heroes. This batch ships **3** fully
verified (Bhishma, Arjuna, Lord Mahavira), not 8-12. Each hero in this corpus requires its
own fetch-and-verify pass against a real public-domain edition (the same rigor applied to
Ramayana/Panchatantra/Bhakti Katha elsewhere in this repo) — several planned sources for this
batch (Macauliffe's *Sikh Religion*, Rhys Davids' Mahaparinibbana Sutta) could not be fetched
reliably in this session (repeated fetch timeouts on `sacred-texts.com/skh/` and
`sacred-texts.com/bud/` specifically). Rather than fabricate or thin out the promised chunk
depth to hit a hero count, this batch ships fewer heroes with real, verified, 8-chunk depth
each, and documents the rest as a named next-batch roadmap (§5) so the next pass can start
from confirmed-available sources instead of re-researching from scratch.

## 1. Baseline (before this batch)

- Visible roster: 70 heroes across `src/lib/data/dharm-veers/{hindu,sikh,jain,buddhist}.ts`.
- AI indexed: 2 heroes (Guru Gobind Singh, Shivaji), 6 chunks total, unsourced (`source_name:
  "Sikh History"` / no source at all beyond a generic label).
- **Bug found and fixed (see §3):** both of those 2 "supported" heroes were actually
  unreachable through the real app flow — their manifest `doc_id` did not match the
  `figure_id` the UI actually sends.

## 2. Coverage after this batch

| Hero | figure_id | Tradition | Chunks | Source | Rights |
|---|---|---|---|---|---|
| Chhatrapati Shivaji Maharaj | `chhatrapati-shivaji` | Hindu | 3 | unnamed ("Shivaji The Great") — **not re-verified this batch** | unverified, kept as-is |
| Guru Gobind Singh Ji | `guru-gobind-singh` | Sikh | 3 | unnamed ("Sikh History") — **not re-verified this batch** | unverified, kept as-is |
| Bhishma | `bhishma` | Hindu | 8 | *The Mahabharata*, Book 6 (Bhishma Parva), trans. Kisari Mohan Ganguli (1883-96) | `public_domain` |
| Arjuna | `arjuna` | Hindu | 8 | *The Mahabharata*, Book 6 (Bhishma Parva), trans. Kisari Mohan Ganguli (1883-96) | `public_domain` |
| Lord Mahavira | `lord-mahavira` | Jain | 8 | *Jaina Sutras, Part I* (SBE vol. 22), Kalpa Sutra, trans. Hermann Jacobi (1884) | `public_domain` |

Total: 5 heroes indexed, 30 chunks, up from 2 heroes / 6 chunks.

Each of the 3 new heroes' chunks are tagged `chunk_type`: `life_context`, `core_dharmic_act`,
`trial_sacrifice` (x2-3), `teaching`, `legacy`, `citation_provenance` — matching the requested
chunk taxonomy. All quoted text is verbatim from the cited sacred-texts.com URL (spot-checked
against the underlying 1883-96 / 1884 published editions); short unquoted connective sentences
are clearly distinguishable from the quotations and add only factual scene-setting (who is
speaking, why), never invented dialogue or events.

## 3. Fixes made to existing (pre-batch) content

1. **doc_id / figure_id mismatch (functional bug, both pre-existing heroes).** The app sends
   `figure_id: hero.id` from the roster (e.g. `chhatrapati-shivaji`, `guru-gobind-singh` —
   hyphenated, matching `src/lib/data/dharm-veers/*.ts`). The retriever matches on
   `dharam_veer_${figureId}`. The existing manifests used `dharam_veer_shivaji` and
   `dharam_veer_guru_gobind_singh` (wrong name / underscored), so the exact-title match never
   succeeded in production. Fixed by correcting the `doc_id` field in both manifests to match
   the real roster id. Their underlying content/source labeling was **not** re-verified in this
   batch — `source_name: "Shivaji The Great"` and `"Sikh History"` are not real named,
   rights-checked editions per `PATHSHALA_SOURCE_POLICY.md`, and should be replaced in a future
   batch the same way Bhishma/Arjuna/Mahavira were sourced here.
2. **Unsupported-figure keyword leak (retrieval.ts, `PramanaDharamVeerEmbeddingRetriever`).**
   When a requested `figure_id` matched no indexed hero, the retriever fell through to an
   unscoped TF-IDF keyword search across *all* heroes' chunks and could return another hero's
   content under the wrong name, instead of the safe "I do not have enough approved source
   material" fallback in `src/app/api/ai/chat/route.ts`. Fixed: the keyword-similarity fallback
   now only runs when no specific `figure_id` was requested at all; an explicit, unmatched
   `figure_id` now correctly returns zero documents, triggering the safe fallback message.
3. **`rightsStatus` no longer hardcoded.** The retriever previously returned
   `rightsStatus: 'public_domain' // assume verified` for every indexed chunk regardless of
   actual sourcing. It now reads the real per-chunk `rights_status` from the index (falling back
   to `restricted_or_pending`, not `public_domain`, when absent).

## 4. Verification performed

- `retrieve({ filters: { title: figureId } })` smoke-tested for all 5 supported figure_ids
  (`chhatrapati-shivaji`, `guru-gobind-singh`, `bhishma`, `arjuna`, `lord-mahavira`): each
  returns its own correctly-attributed chunks at exact-match score.
- Same smoke test for 3 currently-unsupported figure_ids (`maharana-pratap`, `guru-nanak-dev`,
  `siddhartha-gautama`): each now correctly returns zero documents (safe fallback), confirmed
  **after** the fix in §3.2 — before the fix, all three incorrectly leaked another hero's
  content.
- `tsc --noEmit` and `eslint` clean on `src/lib/ai/retrieval.ts`.
- `python3 -m json.tool` validation on all 5 manifest files and the regenerated
  `dharam_veer_index.json`.
- Manually built `python/ai_pipeline/src/ai_pipeline/embeddings/build_dharam_veer_index.py`
  (no prior build script existed for this corpus) — globs `dharam_veer_*.json`, so future hero
  additions only require dropping in a manifest file and re-running the script.

## 5. Next batch — sources identified but not yet fetched/verified

| Hero | figure_id | Tradition | Planned source | Status |
|---|---|---|---|---|
| Parshvanatha | `parshvanatha` | Jain | *Jaina Sutras, Part I* (SBE22), Kalpa Sutra, "Life of Parsva", Jacobi (1884) — URL confirmed: `sacred-texts.com/jai/sbe22/sbe2286.htm` | source located, not fetched |
| Guru Nanak Dev | `guru-nanak-dev` | Sikh | Max Arthur Macauliffe, *The Sikh Religion*, Vol. 1 (1909) — hosted at `sacred-texts.com/skh/tsr1/` | source located, fetch timed out this session |
| Guru Tegh Bahadur | `guru-tegh-bahadur` | Sikh | Macauliffe, *The Sikh Religion* (martyrdom account, later volume) | source identified, volume/section not yet located |
| Siddhartha Gautama (The Buddha) | `siddhartha-gautama` | Buddhist | T. W. Rhys Davids, *Buddhist Suttas* (Mahaparinibbana Sutta), SBE vol. 11 (1881) — hosted at `sacred-texts.com/bud/sbe11/` | source located, fetch timed out this session |
| Ananda | `ananda` | Buddhist | Same Mahaparinibbana Sutta (features Ananda throughout) | source located, fetch timed out this session |
| Emperor Ashoka | `emperor-ashoka` | Buddhist | E. Hultzsch, *Inscriptions of Asoka* (Corpus Inscriptionum Indicarum, 1925) | source named per original prompt, availability not yet verified |

Recommendation: retry the `sacred-texts.com/skh/` and `sacred-texts.com/bud/` fetches (the
`sacred-texts.com/hin/` and `sacred-texts.com/jai/` paths worked reliably in this session, so
the failures looked path/domain-specific rather than a blanket sacred-texts.com outage) before
falling back to Internet Archive OCR scans, which are noisier and require more verification
overhead (see the Panchatantra/Bhakti Katha batch for that fallback pattern).

## 6. Not done / explicitly out of scope this batch

- Re-sourcing Shivaji and Guru Gobind Singh's existing unattributed content (flagged in §3.1,
  not fixed).
- Any hero beyond the 5 listed in §2.
- Wiring, UI, or prompt-template changes — only `retrieval.ts` (bug fixes), manifests, the new
  build script, and the regenerated index were touched.
