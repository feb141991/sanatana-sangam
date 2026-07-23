# Dharam Veer AI Coverage Audit

Last updated: 2026-07-23
Owner: Pramana source-integrity review

## 0. Scope note — batch 2 expansion

Following Prompt 3 requirements, this batch expands the Dharm Veer roster to a total of **13** fully verified source-backed heroes (up from 5). 

We have:
1. Re-verified and expanded the two pre-existing heroes (**Chhatrapati Shivaji Maharaj** and **Guru Gobind Singh Ji**) to 8 chunks each of verified public-domain translation/narrative text, resolving the previous unverified metadata labels.
2. Sourced and added **8 new heroes** balanced across traditions, with exactly 8 chunks each of dense, verified public-domain translation text.
3. Successfully run the tracked index builder to regenerate `dharam_veer_index.json`.

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

Total: **13 heroes indexed, 104 chunks** (100% public domain and verified, 8 chunks per hero).

Each hero's chunks are tagged with standard `chunk_type` values (`life_context`, `core_dharmic_act`, `trial_sacrifice`, `teaching`, `legacy`, `citation_provenance`).

## 3. Fixes and Enhancements in this Batch

1. **Re-verification & Expansion**: Re-sourced and expanded `guru-gobind-singh` and `chhatrapati-shivaji` to completely comply with `PATHSHALA_SOURCE_POLICY.md` requirements.
2. **Added Manifests**: Added 8 new manifest files matching the roster IDs to `python/ai_pipeline/corpus/manifests/dharam_veer/`.
3. **Retriever Sync**: Registered all 8 new manifest filenames in the `fileNames` array of `dharamVeerManifestRetriever` inside `src/lib/ai/retrieval.ts`.

## 4. Verification performed

- **Index Generation**: Ran `python3 python/ai_pipeline/src/ai_pipeline/embeddings/build_dharam_veer_index.py` successfully.
- **Retriever Smoke Tests**: Verified that querying for any of the 13 supported `figure_id`s returns their own correctly-attributed chunks, and querying for currently unsupported ones returns zero documents (triggering clean fallback).
- **TypeScript & Lint**: Checked `npx tsc --noEmit` and `eslint` cleanly.

## 5. Next batch — sources identified for future expansion

| Hero | figure_id | Tradition | Planned source | Status |
|---|---|---|---|---|
| Maharana Pratap | `maharana-pratap` | Hindu | Tod's *Annals and Antiquities of Rajasthan* (1829) | Source identified |
| Rani Lakshmibai | `rani-lakshmibai` | Hindu | D. B. Parasnis' *Biography of Jhansi Rani* (trans. 1900s) | Sourcing check needed |
| Guru Arjan Dev | `guru-arjan-dev` | Sikh | Macauliffe, *The Sikh Religion*, Vol. 3 (1909) | Source located |
| Bahubali | `bahubali` | Jain | *Adipurana* translations (Jinasena, public domain editions) | Sourcing check needed |
