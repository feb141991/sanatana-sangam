> **SUPERSEDED — 2026-09-05.** This document is no longer active policy.
> It is retained as a historical record of the framework this project
> originally specified, and of which pieces were actually built (see
> `docs/audits/phase0-ground-truth/PHASE0_REPORT.md` §1 for a verified,
> file-by-file account of what here is real/load-bearing code versus
> unbuilt design intent — notably: the `source_references` table and the
> literal 7-state `draft→...→published` workflow below were never
> operationalized; `golden_fixtures`, the source-tier types, and
> `ratification_note`/`disputed_years` on rules ARE real and still in use).
>
> Current active policy: [`docs/CALENDAR_RULES_AND_VERIFICATION.md`](../CALENDAR_RULES_AND_VERIFICATION.md).
>
> Nothing below this notice has been edited — it is kept verbatim for
> factual/historical accuracy. Do not treat it as current guidance.

# Source & Governance Policy

**Status:** Draft v1.0.0 · Phase 1 specification
**Applies to:** every rule variant, golden fixture, and published occurrence.

Astronomy can be computed. **Observance cannot be computed into existence** — it is
inherited. This document fixes where authority comes from, how disagreement is
handled, and what may lawfully be used.

---

## 1. Principles

1. **Astronomy is calculated; observance is sourced.** Every rule variant cites at
   least one source. A rule with no source cannot reach `approved`.
2. **Disagreement is surfaced, never resolved by fiat.** Where recognised
   traditions differ, publish all recognised variants.
3. **Shoonaya does not adjudicate religious authority.** It computes transparently
   and reports which convention produced which result.
4. **Provenance travels with the data.** Every published occurrence can name the
   rule, the version, the reasoning, and the source behind it.

---

## 2. Source tiers `[C]`

| Tier | Class | Examples | Use |
|---|---|---|---|
| **1** | Official astronomical/calendrical authority | *Rashtriya Panchang*; *Indian Astronomical Ephemeris* (Positional Astronomy Centre); IMD ephemeris publications | Astronomical validation; the default arbiter for Layer A/B |
| **2** | Established traditional texts on observance | *Nirṇaya Sindhu*, *Dharma Sindhu*, *Hemādri*, recognised sampradāya nirṇaya works | Layer C rule authority |
| **3** | Regional printed panchāṅgas | Regionally authoritative annual panchāṅgas | Regional profile rules and cross-checks |
| **4** | Institutional / temple calendars | Recognised temple trusts, sampradāya bodies (e.g. ISKCON Vaiṣṇava calendar) | Sampradāya variants; temple overlays |
| **5** | Digital panchāṅga services | Commercial calendar sites | **Spot cross-check only** — see §3 |
| **6** | LLM / model output | Any AI verifier | **Never a source.** Triage signal only — see §6 |

**Rule `[C]`:** a Layer C rule variant must cite **≥ 1 source of Tier 1–4**.
Tier 5 may be attached as corroboration but never as the sole authority.

---

## 3. Legal and licensing constraints `[C]`

**Shoonaya operates commercially from the UK. This section is binding.**

| Constraint | Requirement |
|---|---|
| **Database rights** | The UK/EU *sui generis* database right protects substantial extraction from a compiled database even where individual facts are not copyrightable. **Do not bulk-copy, scrape, or mirror another service's computed calendar.** |
| **Individual facts** | A single verified date used for spot-checking and cited as provenance is acceptable practice. Systematic harvesting is not. |
| **Terms of service** | Automated retrieval from a commercial panchāṅga site is typically prohibited by its ToS regardless of copyright. **No scrapers.** |
| **Text and prose** | Never reproduce descriptive/interpretive prose from a source into content rows. Content must be original or licensed. |
| **Swiss Ephemeris** | AGPL **or** paid commercial licence. AGPL is incompatible with a closed commercial app. **A licence decision must be recorded before any use.** The existing guard at `packages/panchang-engine/src/index.ts:913` that refuses to run with `licenseMode: 'undecided'` must be preserved. |
| **Ephemeris data** | JPL DE-series data is public domain; prefer it for validation. |
| **Attribution** | Where a source's tier and identity are recorded, cite it in `source_references`. Where a licence requires visible attribution, surface it in-app. |

**Preferred validation route:** compare against Tier 1 official publications
(licensed/purchased copies, manually transcribed into fixtures with citation)
rather than automated comparison against Tier 5 services.

---

## 4. Source reference record `[C]`

New table `source_references`:

```jsonc
{
  "id": "src_rashtriya_panchang_2027",
  "sourceName": "Rashtriya Panchang",
  "textName": null,
  "publisher": "Positional Astronomy Centre, India Meteorological Department",
  "edition": "2027",
  "pageOrSection": "p. 42, Māgha table",
  "tier": 1,
  "tradition": null,
  "region": null,
  "scholarNotes": "Used for tithi-boundary validation, not observance rules.",
  "copyrightStatus": "purchased_print_reference",
  "usagePermitted": "internal_validation_and_citation",
  "addedBy": "…",
  "addedOn": "2026-11-02"
}
```

`copyrightStatus` and `usagePermitted` are **mandatory**. A source without them
cannot be attached to an approved rule.

---

## 5. Calendar Advisory Council `[S]`

### Composition

- Panchāṅga scholars / traditional Jyotiṣa practitioners
- Sanskrit / śāstra researchers
- Representatives of the regional traditions shipped as profiles
- Temple priests / sampradāya representatives
- Software and astronomical specialists (non-voting on `[S]` items)

**A `[S]` decision cannot be made by engineering.** Engineering may implement,
document, and flag — never ratify.

### Editorial workflow

```
draft ──▶ technical_ok ──▶ in_review ──▶ regional_review ──▶ approved ──▶ published
   ▲            │                │              │
   └── rejected ┴────────────────┴──────────────┘
                                                 └─▶ disputed (multi-variant publish)
```

| State | Gate |
|---|---|
| `draft` | Rule authored; schema-valid |
| `technical_ok` | Engine evaluates it; golden fixtures written; no CI failures |
| `in_review` | Traditional review of the *rule logic* against cited sources |
| `regional_review` | Regional representative confirms applicability to the named profiles |
| `approved` | Council sign-off recorded with `reviewedBy` + `effectiveFrom` |
| `disputed` | Recognised traditions genuinely differ → **publish all variants** |
| `published` | Materialised into `observance_occurrences` |

`effectiveFrom` allows a corrected rule to apply from a future year without
retroactively rewriting already-published history.

---

## 6. Disagreement policy `[S]` — binding product wording

### Never say

- ❌ "Other calendars are incorrect."
- ❌ "The correct date is …"
- ❌ "The one universal Hindu calendar."
- ❌ Any phrasing implying a tradition is mistaken.

### Always say

> **Two recognised observances are available.**
> **Smārta Janmāṣṭamī — 3 September.** Selected where Aṣṭamī and Rohiṇī satisfy the Smārta rule.
> **Vaiṣṇava Janmāṣṭamī — 4 September.** Selected according to the Vaiṣṇava sunrise and fasting convention.
> Your selected profile: **Vaiṣṇava**.
>
> *The difference arises from the selected observance tradition and the tithi
> period used for assigning the festival.*

### Standing disclaimer (must appear in Panchāṅga and festival surfaces)

> Shoonaya does not replace the guidance of one's guru, ācārya, family tradition or
> temple. It provides transparent astronomical calculations and recognised calendar
> interpretations.

### AI verification — proper scope `[C]`

The existing `verifyFestivalDatesWithAI` (`src/lib/festival-verify.ts`) asks a
language model to judge stored dates from its trained knowledge.

**This is a triage signal, not a source.** It may:
- ✅ flag rows for human attention,
- ✅ prioritise a review queue.

It must **never**:
- ❌ set `review_status: approved`,
- ❌ write or overwrite a published date,
- ❌ be recorded in `sources[]`,
- ❌ be described to users as verification.

Any surface implying AI-verified correctness must be corrected.

---

## 7. Change control `[C]`

Every rule/convention change carries:

```jsonc
{ "ruleVersion": "1.3.0", "engineVersions": { … },
  "tradition": "North Indian Smārta",
  "reviewedBy": "council_2027_q1", "effectiveFrom": "2027-01-01",
  "sources": ["src_nirnaya_sindhu", "src_rashtriya_panchang_2027"],
  "lastReviewed": "2026-11-02",
  "changeReason": "…", "datesChanged": 4, "diffReviewedBy": "…" }
```

**Release gate — all must hold:**

1. Every affected golden case re-run; **every** diff explained and signed off.
2. No rule at `approved` lacking a golden case or a Tier 1–4 source.
3. `locked_for_regeneration` rows untouched unless explicitly unlocked by the council.
4. Changed published dates carry a user-visible "this date was updated, and why" note.
5. An ADR exists for any `[C]` convention change.

**Silent date changes are prohibited.** A user who planned a fast around a
published date must be told when and why it moved.

---

## 8. Integrity monitoring `[C]`

The existing `calendar-health` cron (`src/app/api/cron/calendar-health/route.ts`)
recomputes rules and compares against stored rows. Its scope must be stated
honestly:

> It detects **rule drift** — stored data disagreeing with today's engine. It
> **cannot** detect a wrong rule, because it compares the engine against itself.

Required additions:

| Check | Detects |
|---|---|
| Golden-case regression | A rule that is wrong against a **cited source** |
| Source-coverage audit | Approved rules missing Tier 1–4 citation |
| Fixture-freshness audit | Golden cases not re-verified within N years |
| Ambiguity queue | `multiple_candidates` awaiting council resolution |

Findings must be **persisted** (a report table or artefact), not only emitted into
a push notification body — today the "166 engine mismatch" figure exists solely in
a transient cron response and cannot be tracked over time.

---

## 9. Public transparency `[C]`

For any published occurrence, a user may see:

```
Why today?
  Aṣṭamī Tithi prevails during the selected observance period.
Calculated for:      Bedford, United Kingdom
Calendar profile:    North Indian Pūrṇimānta
Tradition:           General Smārta
Alternative:         Vaiṣṇava profile observes this tomorrow.
Rule version:        1.3.0        Engine: Shoonaya Panchāṅga 1.2
Source:              Rashtriya Panchang 2027 · Nirṇaya Sindhu
```

This is a **product differentiator, not a debug view.** Most calendar apps present
a date; Shoonaya can present the reason.
