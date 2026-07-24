# Bhakti Katha Canonical Source Plan — P1 Starter

Last updated: 2026-07-24
Owner: Pramana source-integrity review
Status: **Source-audit only. Not ingested into live retrieval. No files wired.**

Governing policy: `PATHSHALA_SOURCE_POLICY.md` (source/rights rules).
Status source of truth: `PRAMANA_CORPUS_ROADMAP.md` (`bhakti_katha` = "Passing sample").
Sibling precedent: `docs/RAMAYANA_CANONICAL_SOURCE_PLAN.md` (same method applied here).

---

## 0. Current state finding

`python/ai_pipeline/corpus/manifests/katha_chapter_1.json` (4 stories: Prahlada, Dhruva, Sudama Vipra,
Gajendra Moksha) cites `source_name: "Srimad Bhagavatam"` — a correct, real, well-known named source. All
four stories genuinely appear in the Bhagavata Purana. But, same issue as Panchatantra: the `text` field is
a **Shoonaya-written paraphrase**, not a verbatim excerpt from a specific named public-domain translation
edition, while the manifest asserts `"rights_status": "public_domain"` / `"is_live_in_app": true` as if it
were a direct copy. This should be corrected to `source_class: curated lesson` rather than left implying a
verbatim translation. Not a fabrication-level problem (unlike the deleted Ramayana files) — the stories,
characters, and outcomes are all doctrinally accurate — but the source-class tagging should not be reused
as-is for further chapters without this correction.

**No files have been changed to reflect this finding.** It is recorded here for the next ingestion pass.

---

## 1. Chosen source stack

| Layer | Source | Role |
|---|---|---|
| **English translation (live layer)** | **Manmatha Nath Dutt, _A Prose English Translation of Shrimadbhagabatam_ (Calcutta, 1895–1896)** | Primary, copyable, public domain |
| Cross-reference translation | **H. H. Wilson, _The Vishnu Purana_ (1840, trans.)** | Parallel PD version of Dhruva, Prahlada, and Gajendra Moksha episodes — useful for cross-checking narrative accuracy |
| Scan-backed fallback | **Internet Archive** (`archive.org/details/proseenglishtran12dutt`, and the Vishnu Purana / Garuda Purana Dutt volumes) | Verification / OCR cross-check |
| Reference only — never copy | Motilal Banarsidass / modern Gita Press Bhagavata Purana editions | Cross-check only; both are still under active copyright/imprint control |

Rationale: mirrors the Gita (Besant)/Upanishad (Hume)/Ramayana (Griffith) pattern already used in this repo —
ship a public-domain 19th-century English translation as the live layer first, with a second PD translation
(Wilson) available for cross-checking specific episodes, since Dutt's prose is dense/archaic and benefits from
a second source when verifying a passage.

**Scope note:** this plan currently only covers the four stories already scoped in chapter_1 (Prahlada, Dhruva,
Sudama, Gajendra Moksha), all of which are in the Bhagavata Purana (Cantos 4, 7, 8, 10). It does **not** cover
other possible "Bhakti Katha" material such as saint hagiographies (Mirabai, Tulsidas, Chaitanya), Shiva Purana
or Ganesha/Hanuman-centric stories, or regional bhakti literature — no sources for those have been identified or
verified yet. Any expansion beyond the Bhagavata Purana scope needs its own source-verification pass before any
claim is made about it.

---

## 2. Rights status

| Source | Rights status | Basis |
|---|---|---|
| Dutt's Bhagavatam translation (1895–96) | `public_domain` | Published pre-1929; translator (M. N. Dutt) died 1912. Confirmed, low-risk. |
| Wilson's Vishnu Purana translation (1840) | `public_domain` | Published 1840; translator (H. H. Wilson) died 1860. Confirmed, low-risk. |
| Sanskrit Bhagavata Purana verse text itself | `public_domain` (ancient) | The verse text is ancient. **The specific digital edition/transcription used for a Sanskrit layer would need its own rights check**, same caveat as the Ramayana/Panchatantra plans. |
| Modern Motilal Banarsidass / Gita Press editions | `restricted_or_pending` (copyrighted) | Reference/cross-check only, never copy. |

---

## 3. Allowed usage

- **Copy (with attribution):** Dutt's Bhagavatam translation, verbatim, from Internet Archive, as the live
  `translation` layer (`source_class: translation`, `rights_status: public_domain`).
- **Cross-check against Wilson's Vishnu Purana** when a passage's exact wording or verse numbering needs
  verification — do not silently mix the two translations into one "text" field without labeling which is which.
- **Generated transliteration** allowed only once a rights-safe Sanskrit source is confirmed, labeled "generated."
- **Shoonaya paraphrase / simplified retelling** allowed as a separate, clearly labeled layer
  (`source_class: curated lesson`) alongside — never instead of — a verbatim translation excerpt once ingested.
  Existing chapter_1 paraphrases should be re-tagged this way.
- **Reference / cross-check** (read, do not copy): Motilal Banarsidass and Gita Press editions.

## 4. Prohibited usage

- Marking a Shoonaya paraphrase as `rights_status: public_domain` / implying it is a verbatim translation excerpt.
- Copying Motilal Banarsidass or Gita Press translation/commentary text.
- Claiming coverage of bhakti stories/traditions (saint hagiographies, other Puranas) for which no source has
  been verified under this plan.
- Inventing episodes, dialogue, or verse citations not present in Dutt's or Wilson's translations.

## 5. Must be Shoonaya-original (labeled, visually distinct)

- Modern retellings/paraphrases for younger or casual readers (distinct wording from Dutt's/Wilson's).
- "Lesson"/devotional-reflection framing copy, discussion questions, quiz content.
- Chapter/Skandha (Canto) summaries and lesson framing.

---

## 6. Citation format

Per story:

```
Srimad Bhagavatam, Skandha {canto}, Adhyaya {chapter}, "{Story title}"
  Sanskrit: companion only pending source-edition rights verification
  English:  Manmatha Nath Dutt (1895–96), Internet Archive — public domain
            (cross-check: H. H. Wilson, Vishnu Purana, 1840 — public domain)
```

- Reference should identify **Skandha (Canto).Adhyaya (chapter)**, not a bare sequential id — e.g. Prahlada is
  Skandha 7, Gajendra Moksha is Skandha 8, Sudama Vipra is Skandha 10, Dhruva is Skandha 4.
- Carry the policy's required per-text metadata: `source_name`, `source_url`, `source_owner`, `source_class`,
  `rights_status`, `language`, `script`, `original_text_status`, `translation_status`, `audio_status`, `revision_note`.

---

## 7. Review checklist (before ingesting any Bhakti Katha batch)

- [ ] Story text is **verbatim Dutt (1895–96)** (or Wilson, for Vishnu Purana parallel episodes), sourced from
      Internet Archive, not an AI paraphrase presented as translation.
- [ ] Exact **Skandha.Adhyaya** reference present and correct.
- [ ] Sanskrit source edition identified, and its reuse rights verified + recorded (or marked companion).
- [ ] `source_class`, `rights_status`, and live/companion/unavailable states set **per policy**, not assumed.
- [ ] Any Shoonaya paraphrase is tagged `curated lesson` and visually distinct from the translation excerpt.
- [ ] No `public_domain` claim on paraphrased or unverified text.
- [ ] Any story outside the four already-scoped Bhagavata Purana episodes has its own verified source before
      being added — do not extend into other Puranas or saint hagiographies without a fresh source pass.
- [ ] User-facing provenance/trust copy added before the track goes live.

---

## 8. Recommendation summary

Next ship **Dutt's (1895–96) English translation as the live `public_domain` layer** for the four already-scoped
Bhagavata Purana stories (Prahlada, Dhruva, Sudama, Gajendra Moksha), sourced verbatim from Internet Archive,
cross-checked against Wilson's Vishnu Purana where useful, replacing or supplementing the current unattributed
paraphrase in `katha_chapter_1.json`. Keep the Sanskrit layer companion-only until a specific digital edition's
rights are verified. Any broader "Bhakti Katha" scope (other Puranas, saint lives) needs a **separate**
source-verification pass — none is proposed here. Do **not** ingest until the §7 checklist passes per batch,
and do not wire this into `retrieval.ts` or build an embedding index until content is actually ingested under
this plan.


---

## 9. Sourcing attempt log — 2026-07-24 (content-integrity pass)

Attempted to locate and fetch the specific Skandha 8 (Gajendra Moksha) and Skandha 10 (Sudama Vipra)
passages from Dutt's translation, per the §8 recommendation. Findings:

- The only archive.org item previously referenced by identifier (`proseenglishtran12dutt`) was checked
  directly and turns out to be a **150-page fragment covering only Book I** (Skandha 1, Chapters I-XIX) —
  it does not reach Skandha 8 or 10 at all, despite its "Volume 1, 2" metadata field. **Not usable for
  either target story.**
- A separate, complete scan was located and confirmed: **`in.ernet.dli.2015.272582`, "Shrimad Bhagwatam"
  (Manmatha Nath Dutt, H.C. Dass, Calcutta, 1896), 744 pages** — this is the correct full edition and should
  contain both target episodes. Confirmed public domain (pre-1930, translator died 1912).
- However, this item's plain-text (`djvu.txt`) file is ~1.5 MB, far beyond what a single fetch can return
  (this session's fetch tool caps around 80-95K characters per call, and does not support byte-range/offset
  requests against a remote URL — each fetch of the same URL returns the same leading portion of the file,
  not a new chunk). Reaching Skandha 8/10 content directly would require dozens of sequential fetches with
  no mechanism to skip ahead.
- Attempted archive.org's "search inside the book" API (`fulltext/inside.php` on the item's assigned server,
  and the older `api.archivelab.org/books/{id}/searchinside` endpoint) to pinpoint the exact page number for
  "Sudama" and "Gajendra" before fetching just those pages. **Both endpoints timed out (180s) on every
  attempt** and returned no result.
- Searched archive.org's advancedsearch API for a smaller, single-canto edition (e.g. "Skandha 10" or
  "Book VIII" as a standalone volume, by Dutt or another period translator) that would sidestep the
  large-file problem the way `budsas.org`'s per-chapter Mahavamsa hosting did for the Dharm Veer corpus.
  No matching single-canto item was found.
- Confirmed via targeted search that **sacred-texts.com does not host any Bhagavata Purana content** (its
  Hindu collection covers Vishnu Purana, Markandeya Purana, Mahabharata, etc., but not the Bhagavata
  Purana specifically) — ruling out the site used successfully for Prahlada/Dhruva as a source for these
  two episodes.
- J. M. Sanyal's 1929 English translation (also plausibly PD as of this session's date) was identified as
  a possible alternate translator, but only Volume 1 (371 pages, early Skandhas) was located; the volume(s)
  covering Skandha 8/10 were not found in this pass.

**Conclusion: still blocked, but now for a concrete, well-defined reason** — the correct source is
identified and rights-confirmed, but the specific passages are not reachable with the tools available in
this session (large-file fetch cap + unresponsive "search inside" API). This is a tooling blocker, not a
source-non-existence or rights problem, and should not be treated as license to substitute a lower-quality
or non-PD source. `katha_chapter_1.json`'s Sudama and Gajendra entries remain correctly tagged
`curated_lesson` / `rights_cleared` (not `public_domain`) pending a session with either working
byte-range/paginated fetch access or a working "search inside" capability.
