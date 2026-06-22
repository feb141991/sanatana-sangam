# Ramayana Canonical Source Plan — P1 Starter

Last updated: 2026-06-23
Owner: Pramana source-integrity review
Status: **Source-audit pending. Not ingested into live retrieval.**

Governing policy: `PATHSHALA_SOURCE_POLICY.md` (source/rights rules).
Status source of truth: `PRAMANA_CORPUS_ROADMAP.md` (Ramayana = P3).

---

## 0. Blocking finding — current local Ramayana is NOT canonical

The existing local content must **not** be treated, materialized, or shipped as canonical Valmiki Ramayana:

- `src/lib/data/ramayana-complete.ts` and the generated
  `python/ai_pipeline/corpus/manifests/ramayana_*.json` contain **fabricated, template-generated pseudo-Sanskrit**. Beyond the genuine opening `mā niṣāda` verse, entries repeat one broken template — `धर्मात्मा रामो उवाच {noun}` with a swapped word (vacanam / vanam / rākṣasam / laṅkām) — none of which are real Valmiki shlokas. The "meanings" are AI-padded, not translations of real verses.
- `ref` values are bare sequential integers (`"1"`, `"2"` …), **not** canonical `Kanda.Sarga.Shloka` references.
- The manifest nonetheless asserts `"rights_status": "public_domain"`, `"translation_basis": "Shoonaya Curated / Public Domain"`, and `"is_live_in_app": true`. These claims are **false** and violate `PATHSHALA_SOURCE_POLICY.md` (no fake excerpts; every text needs a verified named source + rights).

**Action:** keep these generated manifests/index/eval as **non-canonical scratch only** (do not route, do not mark `is_live_in_app: true`). Replace with verified sources per this plan before any ingestion.

## 0.1 Current correction state

- `valmiki_ramayana_*` manifests are metadata-only pending source audit.
- `valmiki_ramayana_index.json` is intentionally empty and marked not live.
- `src/lib/ai/retrieval.ts` rejects explicit `valmiki_ramayana` retrieval until a verified batch exists.
- The validation script now treats Ramayana as a source-audit gate, not as proof of live canonical coverage.

---

## 1. Chosen source stack (P1 starter)

| Layer | Source | Role |
|---|---|---|
| **English translation (live layer)** | **Ralph T. H. Griffith, _The Rámáyan of Válmíki_ (1870–1874)** via **Project Gutenberg** | Primary, copyable |
| English page-backed fallback | **Wikisource** (Griffith, scan-backed) | Verification / provenance |
| **Sanskrit (original-text layer)** | **sanskritdocuments.org** (primary) + **GRETIL** (scholarly cross-reference) | Copy **only after per-source license verification**; until then `original_text_status: companion` (link out) |
| Reference only — never copy | **valmikiramayan.net** (Desiraju H. Rao et al.) | Cross-check verse numbering/accuracy |
| Reference only — never copy | **Gita Press** editions | Cross-check only |

Rationale: this mirrors the proven Gita (Annie Besant PD) and Upanishad (Hume 1921 PD) pattern — ship a **public-domain translation as the live layer** first, keep the **original Sanskrit layer partial/companion** and clearly labeled until its digital source's rights are confirmed.

---

## 2. Rights status

| Source | Rights status | Basis |
|---|---|---|
| Griffith translation (Gutenberg / Wikisource) | `public_domain` | Published 1870–74; author d. 1906; pre-1928 → public domain. Confirmed, low-risk. |
| Valmiki Sanskrit **verse text itself** | `public_domain` (ancient) | The śloka text is ancient. **But the specific digital edition/typesetting may carry edition or transcription terms.** |
| sanskritdocuments.org digitization | `restricted_or_pending` until verified | Volunteer transcriptions; confirm their stated usage terms + required attribution before copying. |
| GRETIL text | `restricted_or_pending` until verified | Often based on a critical edition (e.g. Baroda) carrying **edition copyright**; "scholarly use" terms vary per file. Verify per text before any copy. |
| valmikiramayan.net translation/commentary | `restricted_or_pending` (copyrighted) | Maintainers' original translation + commentary. Reference only. |
| Gita Press editions | `restricted_or_pending` (copyrighted) | Reference only unless explicit license/permission. |

> Note: the prior draft marked the Sanskrit source `live_public_domain` outright. Corrected — the *verse text* is ancient PD, but a specific digital **edition's** reuse terms must be verified before copying; until then the Sanskrit layer stays companion-first.

---

## 3. Allowed usage

- **Copy (with attribution):** Griffith English translation from Project Gutenberg / Wikisource, as the live `translation` layer (`source_class: translation`, `rights_status: public_domain`).
- **Copy the raw Sanskrit verse text** *only* once the specific digital source's reuse terms are verified and recorded; attribute the digital edition. Until then, surface Sanskrit as **companion** (link to GRETIL / sanskritdocuments.org).
- **Generated transliteration** is allowed **only** from a rights-safe Sanskrit source text, labeled "generated."
- **Reference / cross-check** (read, do not copy): valmikiramayan.net, Gita Press, GRETIL critical editions — for verse numbering and accuracy verification.

## 4. Prohibited usage

- Shipping or routing the **current fabricated** Sanskrit/meanings as canonical (or at all).
- Marking unverified or fabricated content `public_domain` / `is_live_in_app: true`.
- Copying **valmikiramayan.net** or **Gita Press** translations/commentary.
- Copying GRETIL/critical-edition Sanskrit before per-text license verification.
- Generated transliteration of any non-rights-safe or fabricated text.
- Presenting Shoonaya explanations/paraphrases as the canonical verse or a named translator's work.

## 5. Must be Shoonaya-original (labeled, visually distinct)

All of the following are `source_class: curated lesson` or `AI reflection`, never `canonical`/`translation`:
- verse explanations, context, and study notes
- chapter/Kanda summaries and lesson framing
- modern paraphrases (distinct from Griffith's wording)
- quiz, prompt, and reflection content

---

## 6. Citation format

Per verse:

```
Valmiki Ramayana, {Kanda} Kanda {sarga}.{shloka}
  Sanskrit: <digital source name + rights>   (e.g. sanskritdocuments.org, ed. <x>)
  English:  Griffith (1870–74), Project Gutenberg — public domain
```

- Canonical reference is **Kanda.Sarga.Shloka** (e.g. `Bala Kanda 1.2.15`) — never bare sequence numbers.
- Carry the policy's required per-text metadata: `source_name`, `source_url`, `source_owner`, `source_class`, `rights_status`, `language`, `script`, `original_text_status`, `translation_status`, `audio_status`, `revision_note`.

---

## 7. Review checklist (before ingesting any Ramayana batch)

- [ ] Verse is a **real Valmiki shloka** (not fabricated/templated), cross-checked against a second source (valmikiramayan.net numbering).
- [ ] Exact **Kanda.Sarga.Shloka** reference present and correct.
- [ ] English text is **genuine Griffith** (verbatim from Gutenberg/Wikisource), not an AI paraphrase.
- [ ] Sanskrit source edition **identified**, and its **reuse rights verified + recorded** (or marked companion).
- [ ] `source_class`, `rights_status`, and the live/companion/unavailable states set **per the policy**, not assumed.
- [ ] Transliteration, if generated, labeled as generated from a rights-safe source.
- [ ] No `public_domain` / `is_live_in_app: true` claim on anything unverified.
- [ ] User-facing provenance + trust copy added before the track goes live.
- [ ] Eval cases reference **real verses**, not synthetic sequence ids.

---

## 8. Recommendation summary

Next ship **Griffith (Gutenberg) English as the live `public_domain` translation layer** only after a real Kanda-structured starter is rebuilt from the source and reviewed. Keep the **Sanskrit original-text layer companion-only** (GRETIL / sanskritdocuments.org link) until that source's rights are verified; treat **valmikiramayan.net and Gita Press as reference only**; make all explanation **Shoonaya-original and labeled**. Do **not** ingest until the §7 checklist passes per batch.
