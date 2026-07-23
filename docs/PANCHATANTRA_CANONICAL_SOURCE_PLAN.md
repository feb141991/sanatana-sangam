# Panchatantra Canonical Source Plan — P1 Starter

Last updated: 2026-07-22
Owner: Pramana source-integrity review
Status: **Source-audit only. Not ingested into live retrieval. No files wired.**

Governing policy: `PATHSHALA_SOURCE_POLICY.md` (source/rights rules).
Status source of truth: `PRAMANA_CORPUS_ROADMAP.md` (`bhakti_panchatantra` = "Passing sample").
Sibling precedent: `docs/RAMAYANA_CANONICAL_SOURCE_PLAN.md` (same method applied here).

---

## 0. Current state finding

`python/ai_pipeline/corpus/manifests/panchatantra_chapter_1.json` (4 stories: Monkey and Crocodile,
Tortoise and Geese, Lion and the Clever Rabbit, Blue Jackal) is **not fabricated** — all four are real,
correctly-attributed Panchatantra tales. But the `text` field is a **Shoonaya-written paraphrase/retelling**,
not a verbatim excerpt from any named public-domain translation, while the manifest asserts
`"rights_status": "public_domain"` and `"is_live_in_app": true` as if it were a direct copy of a
rights-cleared source. Per `PATHSHALA_SOURCE_POLICY.md` §Core Rules #3, canonical/translation text and
curated/paraphrased text must stay visually and structurally distinct — a paraphrase is not disqualified,
but it should be labeled `source_class: curated lesson`, not treated as equivalent to a verified translation
excerpt. This is a labeling correction, not a content-integrity emergency like the Ramayana case — the
underlying stories are genuine, only the source-class tagging is imprecise.

**No files have been changed to reflect this finding.** It is recorded here for the next ingestion pass.

---

## 1. Chosen source stack

| Layer | Source | Role |
|---|---|---|
| **English translation (live layer)** | **Arthur W. Ryder, _The Panchatantra_ (University of Chicago Press, 1925)** | Primary, copyable, public domain |
| English page-backed fallback | **Wikisource** — "The Panchatantra (Purnabhadra's Recension of 1199 CE)" | Verification / provenance |
| English scan-backed fallback | **Internet Archive** (`archive.org/details/ryder-1925-panchatantra-english`, `archive.org/details/Panchatantra_Arthur_W_Ryder`) | Verification / OCR cross-check |
| **Sanskrit (original-text layer)** | Purnabhadra's recension (1199 CE), as edited by Johannes Hertel | Copy **only after per-edition license verification**; until then `original_text_status: companion` |
| Reference only — never copy | shreevatsa.net (proofread Sanskrit+English study page) | Cross-check verse/story numbering and Ryder's exact wording only |

Rationale: mirrors the Gita/Upanishad/Ramayana pattern already established in this repo — ship a **public-domain
English translation as the live layer** first, keep the **Sanskrit original layer companion/partial** until its
specific digital edition's rights are confirmed.

---

## 2. Rights status

| Source | Rights status | Basis |
|---|---|---|
| Ryder translation (1925, University of Chicago Press) | `public_domain` | Published 1925 in the US, pre-1929 → public domain under the US blanket cutoff. Ryder died 1938; work is also PD in life+70 jurisdictions as of 2026. Confirmed, low-risk. |
| Purnabhadra Sanskrit recension text itself | `public_domain` (ancient, 1199 CE) | The story text is centuries old. **The specific Hertel critical edition's typesetting/apparatus may carry edition-level rights** — not yet verified. |
| Hertel's edited Sanskrit edition (~1908–1912) | `restricted_or_pending` until verified | Hertel died 1955; edition-level rights need per-jurisdiction confirmation before copying his specific critical text. |
| shreevatsa.net compiled Sanskrit+English page | `restricted_or_pending` (reference only) | Third-party compilation/proofreading layered on top of PD sources — treat as a cross-check tool, not a copy source, until its own terms are confirmed. |

---

## 3. Allowed usage

- **Copy (with attribution):** Ryder's English translation, verbatim, from Wikisource or Internet Archive, as the
  live `translation` layer (`source_class: translation`, `rights_status: public_domain`).
- **Copy the raw Sanskrit story text** only once the Hertel edition's (or an alternative PD edition's) reuse terms
  are verified and recorded. Until then, Sanskrit stays **companion** (link to shreevatsa.net or archive.org scan).
- **Generated transliteration** allowed only once a rights-safe Sanskrit source is confirmed, labeled "generated."
- **Shoonaya paraphrase / simplified retelling** is allowed as a *separate*, clearly labeled layer
  (`source_class: curated lesson`) alongside — never instead of — the verbatim Ryder excerpt once that excerpt
  is ingested. Existing chapter_1 paraphrases should be re-tagged this way rather than as `public_domain` translation.
- **Reference / cross-check** (read, do not copy verbatim): shreevatsa.net compiled page.

## 4. Prohibited usage

- Marking a Shoonaya paraphrase as `rights_status: public_domain` / implying it is a verbatim translation excerpt.
- Copying Hertel's specific critical Sanskrit edition before its rights are verified.
- Presenting the shreevatsa.net compiled page as a primary copy source.
- Inventing story text, morals, or Sanskrit verses not present in Ryder's translation or the source recension.

## 5. Must be Shoonaya-original (labeled, visually distinct)

- Modern retellings/paraphrases for younger or casual readers (distinct wording from Ryder's).
- "Moral of the story" framing copy, discussion questions, quiz content.
- Chapter/tantra summaries and lesson framing.

---

## 6. Citation format

Per story:

```
Panchatantra, {Tantra name/number}, "{Story title}" — Purnabhadra recension (1199 CE)
  Sanskrit: companion only pending Hertel-edition rights verification
  English:  Arthur W. Ryder (1925), University of Chicago Press — public domain
```

- Reference should identify the **Tantra (book) number/name** the story belongs to, not just a sequential id.
- Carry the policy's required per-text metadata: `source_name`, `source_url`, `source_owner`, `source_class`,
  `rights_status`, `language`, `script`, `original_text_status`, `translation_status`, `audio_status`, `revision_note`.

---

## 7. Review checklist (before ingesting any Panchatantra batch)

- [ ] Story text is **verbatim Ryder (1925)**, sourced from Wikisource/Internet Archive, not an AI paraphrase
      presented as translation.
- [ ] Story is correctly attributed to its **Tantra (book)** and matches Ryder's story ordering/title.
- [ ] Sanskrit source edition identified, and its **reuse rights verified + recorded** (or marked companion).
- [ ] `source_class`, `rights_status`, and live/companion/unavailable states set **per policy**, not assumed.
- [ ] Any Shoonaya paraphrase is tagged `curated lesson` and visually distinct from the Ryder excerpt.
- [ ] No `public_domain` claim on paraphrased or unverified text.
- [ ] User-facing provenance/trust copy added before the track goes live.

---

## 8. Recommendation summary

Next ship **Ryder (1925) English as the live `public_domain` translation layer**, sourced verbatim from
Wikisource or Internet Archive, replacing the current unattributed paraphrase in `panchatantra_chapter_1.json`
(or keeping the paraphrase as a clearly separate `curated lesson` companion layer). Keep the **Sanskrit layer
companion-only** until the Hertel edition's rights are verified. Do **not** ingest until the §7 checklist
passes per batch, and do not wire this into `retrieval.ts` or build an embedding index until content is
actually ingested under this plan.

---

## 9. Ingestion log

- **Batch 1 (2026-07-22):** `panchatantra_chapter_1.json` — 4 stories (Monkey and the Crocodile, Shell-Neck/Slim/Grim,
  Numskull and the Rabbit, The Blue Jackal). Verbatim Ryder (1925) text sourced from theoceanofstories.blogspot.com
  and mythfolklore.blogspot.com (both explicitly attribute Ryder 1925, public domain).
- **Batch 2 (2026-07-23):** `panchatantra_chapter_2.json` — 10 stories (The Brahman's Goat; How the Crow-Hen Killed
  the Black Snake; The Sensible Enemy and the Foolish Friend; The Bharunda Birds; Forethought, Ready-Wit, and
  Fatalist; The Donkey in the Tiger-Skin; The Mice That Set Elephants Free; Crows and Owls [Book 3 frametale,
  trimmed excerpt]; The Potter Militant; The Cat's Judgement). Each matched against the existing reader story in
  `src/lib/katha-library.ts` at plot level, not title alone, before ingestion. Two candidates were evaluated and
  **skipped** per the "do not invent ordering if uncertain" rule:
  - `panchatantra-dove-king-and-net` ("The Dove King and the Net") — plot (flock of doves lift a net together,
    freed by a mouse ally) does not match Ryder's "The Self-Sacrificing Dove" or any other titled story in the
    captured Ryder table of contents; likely Hitopadesha or another collection. Not ingested.
  - `panchatantra-mongoose-and-child` ("The Loyal Mongoose") — confident title/plot match to Ryder Book 5 "The
    Loyal Mungoose," but no verbatim Ryder Book 5 text could be located at the Batch 1/2 source
    (theoceanofstories.blogspot.com only transcribed Books 1-4). Sourcing Book 5 (sacred-texts.com, archive.org,
    or shreevatsa.net) is deferred to a future batch.
  - Remaining un-ingested reader stories (e.g. `panchatantra-fox-and-grapes`, `panchatantra-king-and-minister`,
    `panchatantra-heron-and-fish`, `panchatantra-crane-and-crab`, `panchatantra-snake-and-frogs`,
    `panchatantra-moon-lake-rabbits` / `panchatantra-clever-hare-and-elephant`, `panchatantra-golden-dropping-bird`,
    `panchatantra-sparrow-and-elephant`, `panchatantra-donkey-and-jackal`, `panchatantra-camel-bell`,
    `panchatantra-greedy-jackal`, `panchatantra-weaver-as-vishnu`, `panchatantra-two-fish-and-frog`) were not
    reviewed in depth this batch and remain candidates for a future batch, not confirmed matches.
