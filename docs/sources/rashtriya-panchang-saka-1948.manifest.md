# Provenance manifest — Rashtriya Panchang, Saka 1948 (2026–27 A.D.)

**Status: official-source-backed, pending council ratification — not fully settled.**
Eight `corrected_month_system` values were set to `purnimanta` on the strength
of this source (six directly; `yogini-ekadashi` and `vijaya-ekadashi` after an
engine defect blocking both was found and fixed — see "Two divergences" below,
now resolved). That is a strong Tier 1 citation, not a scholarly ruling; per
`source-governance.md` §2, only Tier 2 (traditional texts) or a council decision
settles a rule variant's authority. Treat as provisional until ratified.

## Edition

| Field | Value |
|---|---|
| Title | Rashtriya Panchang (English), Saka Era 1948, Kali Era 5126–27 (2026–27 A.D.) |
| Publisher | The Director General of Meteorology, Positional Astronomy Centre, India Meteorological Department (Ministry of Earth Sciences), Govt. of India |
| Place | Lodi Road, New Delhi |
| Year printed | 2025 |
| Source tier | **1** — official astronomical/calendrical authority (`source-governance.md` §2) |
| Pages | 193 |
| SHA-256 | `a8816abe4fae7fc0f0e4349a3d91eef00cfc0044a5f050b1b3bfe826847f9eaa` |
| Obtained | Provided directly by the user, 2026-08-10, filename `RP 1948 SE Final.pdf` |
| Official distribution pages | [mausam.imd.gov.in — Rashtriya Panchang](https://mausam.imd.gov.in/imd_latest/contents/rashtriy_panchang.php), [packolkata.gov.in — English edition](https://www.packolkata.gov.in/rashtriya-panchang-english.php) |

The PDF itself is **not** committed to this repository — a 16.3 MB copyrighted
government publication with no LFS setup, and `source-governance.md` itself
prefers citing individual verified facts over mirroring a whole publication.
The checksum above lets anyone holding the same file confirm it is the edition
these citations were read from.

## Stated convention (relevant to scope — see "What this does NOT establish")

Page 14 (preface), on its own labelling convention:

> "The tithis have been shown along with the names of the lunar month in which
> they fall... As such amanta or sukladi system (mukhya mana) of month
> reckoning has been followed."

The document's own day-by-day tithi labels use **amānta** as primary. That does
not affect the citations below — each was read as a real Gregorian calendar
date a named festival falls on, independent of which naming convention the
document's internal labels use for that date.

## Extraction method

```bash
pdftotext -layout "RP 1948 SE Final.pdf" rp1948.txt
node scripts/sources/extract-panchang-dates.mjs rp1948.txt
```

`scripts/sources/extract-panchang-dates.mjs` is committed. It parses every
day-header line (`<Weekday>, <tithi-day> <Hindu-month>, (ni) ..., <Gregorian
day> <Gregorian-month>, ...`), assigns a Gregorian year by rolling forward on
each December→January transition, and requires **zero gaps** in the resulting
daily sequence before reporting any match — i.e. every consecutive calendar
day from the first header to the last must be present, or the script refuses
to report results. This caught a real parsing bug during development: the
document mixes full month names (`August`) and abbreviations (`Aug.`), and an
early version of the parser only recognised abbreviated forms, which silently
dropped every full-word month and misattributed later festival names to the
last day it had parsed. Fixed by normalising on the month's first three
letters. Verified date range covered: 395 consecutive days, 2026-03-22 through
2027-04-20, zero gaps.

## Citations

| Rule | Festival name in source | PDF pages | Sourced date | `corrected_month_system` |
|---|---|---|---|---|
| `aja-ekadashi` | Aja Ekadasi | 65 (daily) | 2026-09-07 | amanta → **purnimanta** |
| `apara-ekadashi` | Apara Ekadasi | 34 (daily) | 2026-05-13 | amanta → **purnimanta** |
| `kamika-ekadashi` | Kamika Ekadasi | 57 (daily) | 2026-08-09 | amanta → **purnimanta** |
| `rama-ekadashi` | Rama Ekadasi | 80 (daily) | 2026-11-05 | amanta → **purnimanta** |
| `saphala-ekadashi` | Saphala Ekadasi | 96 (daily) | 2027-01-03 | amanta → **purnimanta** |
| `utpanna-ekadashi` | Utpanna Ekadasi | 88 (daily) | 2026-12-04 | amanta → **purnimanta** |
| `karva-chauth` | Karaka Chaturthi | 7 (index #54), 79 (daily) | 2026-10-29 | **purnimanta** — already correct, confirmed |
| `diwali` | Dipavali | 7 (index #55), 81 (daily) | 2026-11-08 | **purnimanta** — already correct, confirmed |
| `maha-shivaratri` | Maha Shivaratri | 8 (index #81), 112–113 (daily) | 2027-03-06 (mainstream/S.India) | **amanta** — already correct, confirmed; independently matches the council ruling recorded 2026-08-09 |
| `yogini-ekadashi` (`smarta`) | Yogini Ekadasi (Smarta) | printed 29 (PDF file page 49) | 2026-07-10 | amanta → **purnimanta**, previous-day skipped-tithi policy |
| `yogini-ekadashi` (`vaishnava_vidhava`) | Yogini Ekadasi (Vaishnava & Vidhava) | printed 30 (PDF file page 50) | 2026-07-11 | amanta → **purnimanta**, following-day skipped-tithi policy |
| `vijaya-ekadashi` | Vijaya Ekadasi | printed 92 (PDF file page 112) | 2027-03-04 | amanta → **purnimanta** + `corrected_prefer_last_match: true` |

Note on `maha-shivaratri`: the daily entries (pages 112–113) split by region —
"Maha Shivaratri (Kashmir)" falls on the *preceding* day, **2027-03-05**, while
"Maha Shivaratri, Shivaratri(S.India)" falls on **2027-03-06**. This is a
genuine regional variant in the source, not a parsing artifact (confirmed by
reading both daily blocks directly). The citation above is for the mainstream
reading (06 Mar), which is what the rule's confirmed date matches; the Kashmir
variant is not currently modelled by any rule and is noted here for the
record, not acted on.

Index page references (7, 8) point to the "principal festivals and
anniversaries" summary table the preface describes; daily-entry pages are the
day-by-day tithi tables. Both were checked and agree for every row above.

## What this does NOT establish

1. **Not proof for every future year.** One matching 2026/2027 date confirms
   the *system* (amānta vs pūrṇimānta) a rule should declare, which is a fixed
   convention rather than per-year data — but adhika-māsa insertions,
   vṛddhi/kṣaya tithi boundaries, and observance-ownership rules can still
   shift an individual year's date even with the system correctly declared.
   See the two open cases below.

2. **Not proven universal across calendar profiles.** `corrected_month_system`
   is a single value per rule, applied identically regardless of
   `calendar_profile` — the engine does not currently branch month-system
   selection by profile at all (`grep -rn "\.month_system" src/lib/calendar/`
   returns nothing). Checked against the `calendar_profiles` table:

   | Profile | Declared `month_system` |
   |---|---|
   | `north_indian_purnimanta`, `nepali_bikram` | `purnimanta` — **aligned** with these six fixes |
   | `global_sanatan`, `gujarati_amanta`, `kannada_amanta`, `kannada_telugu_amanta`, `marathi_amanta`, `odia`, `telugu_amanta` | `amanta` — **in tension**; these regions traditionally read the same festival under amānta, which may be a genuinely different date |
   | `bengali_solar`, `malayalam_solar`, `tamil_solar` | `solar` — different axis, not directly comparable |
   | `legacy-ujjain` | `null` (sentinel) |

   These six fixes are validated against the canonical/default reference
   materialisation (what actually ships today, and what the Rashtriya
   Panchang's popularly-cited festival names track) — **not** against each of
   the 7 amānta-declaring regional profiles individually. Per-profile
   month-system branching does not exist in the engine yet; this is the same
   architectural gap already recorded at tracker item D32.

3. **Two divergences investigated, diagnosed, and now resolved (2026-08-11):**

   - **`vijaya-ekadashi`** — sourced 2027-03-04, one day after the naive
     purnimanta prediction (2027-03-03). Direct engine inspection showed tithi
     26 (Ekadashi) touches sunrise on **both** 2027-03-03 and 2027-03-04 — a
     genuine vṛddhi (extended) tithi, matching the source's own "Ekadasi
     ahoratra" notation for the 3rd. Not a system problem — added
     `corrected_prefer_last_match: true`, which selects the later of the two
     candidate days. Verified a no-op in 2026 and 2028 (no vṛddhi tithi at
     this position either year), so nothing else moves.

   - **`yogini-ekadashi`** — sourced 2026-07-10 (Smarta) / 07-11
     (Vaishnava), matching neither the naive amānta (2026-08-09) nor
     purnimanta (2026-06-11) prediction. Root cause: **2026 carries an
     intercalary "Adhika Jyeshtha" (2026-05-17 → 06-16)**, and the engine's
     purnimanta krishna-paksha naming had a genuine defect — an
     `isAdhika ? x : x` stub, both branches identical, present since the
     module's first commit — that let the adhika month's own krishna paksha
     and the following nija month's krishna paksha compute the **identical**
     purnimanta name ("Ashadha" for both). Fixed at the root in
     `packages/panchang-engine/src/lunar-month/index.ts`; see
     `docs/calendar-profiles.md` §1.3 for the full ADR. Verified against the
     real `LunarTithiHandler`: resolves to **2026-07-11**, matching the
     source exactly.

   Both rules are now declared `purnimanta`, sourced and verified. The engine
   fix was swept against all four launch years (2025-2028) for other affected
   rules before landing — none found; see the 2026-08-11 assessment entry.

## Guards run after applying

`validate:rules` 96/96, `verify:calendar` 596/0, `verify:harness` 574/666
(unchanged — no golden fixture references these slugs), `tsc --noEmit` clean.

---

## Batch 2 (2026-08-17): "Principal Festivals and Anniversaries" summary page

Started in response to the tracker's 2.6 row ("🟡 pending sourced golden
validation only, everything") — this is the answer to "how do we cite it":
same PDF (SHA-256 re-verified above), a different section. Page ii–v carries
a 96-entry numbered table, "PRINCIPAL FESTIVALS AND ANNIVERSARIES, 1948 SAKA
ERA... (2026-2027 A.D.)", giving festival name → Gregorian civil date
directly (not a daily tithi grid), covering 2026-03-22 through 2027-04-20 —
the same source, extracted from `/private/tmp/shoonaya-rp1948/all.txt`
(already committed to this session's history, checksum-verified against the
same PDF as batch 1). This section is government-holiday-list style
(mixes Hindu, Sikh, Jain, Islamic, Christian, and civil observances in one
numbered sequence) rather than a day-by-day tithi table, so citation is a
direct name→date lookup, not a tithi/masa conversion.

**Method:** for each remaining unsourced `lunar_tithi`/`nakshatra_based`
rule, searched the 96 entries for a matching festival name, then ran the
corrected engine (`calculateObservanceCandidateDiagnosticsForYear(year,
undefined, 'corrected')`) for the same civil year and compared its
`selectedDate` against the source's printed date. Only entries where the two
agreed exactly were written back to `golden_fixtures`/`rules.json`; anything
that disagreed was left uncited and is logged below instead of forced to
match either value — the whole point of this exercise is to let citations
catch engine bugs, not paper over them.

### Citations — resolved (10 of 14 checked)

| Rule | Entry # / name in source | Sourced date | Engine (corrected) date | `golden_fixtures` rows updated |
|---|---|---|---|---|
| `vasant-panchami` | #76 Sri Panchami, Vasanta Panchami, Saraswati Puja | 2027-02-11 | 2027-02-11 ✓ | 4 (2 locations × 2 profiles) |
| `gudi-padwa` | #90 Chaitra Sukladi (Gudi Padava, Ugadi) | 2027-04-07 | 2027-04-07 ✓ | 4 |
| `chaitra-navratri-begins` | #90 Vasanta Navaratrambha | 2027-04-07 | 2027-04-07 ✓ | 4 |
| `ram-navami` (2027 only) | #95 Ram Navami | 2027-04-15 | 2027-04-15 ✓ | 4 |
| `akshaya-tritiya` | #13 Akshaya Tritiya | 2026-04-20 | 2026-04-20 ✓ | 4 |
| `raksha-bandhan` | #35 Raksha Bandhan, Amarnath Yatra | 2026-08-28 | 2026-08-28 ✓ | 4 |
| `chhath-puja` | #59 Pratihara Shashthi / Surya Shashthi (Chhat Bihar) | 2026-11-15 | 2026-11-15 ✓ | 4 |
| `mahavir-jayanti` (2026) | #4 Mahavira Jayanti | 2026-03-31 | 2026-03-31 ✓ | 2 (unspecified-profile rows) |
| `mahavir-jayanti` (2027) | #96 Mahabira Jayanti | 2027-04-19 | 2027-04-19 ✓ | 2 |
| `holi` (2027) | #85 "...Holikadahana..." | 2027-03-22 | 2027-03-22 ✓ | 4 |

**Caveat on `holi`:** the rule's `lunar_tithi_index: 15` targets Phalguna
Purnima — the bonfire night (Holika Dahan), which the source labels
"Holikadahana" at 2027-03-22, separately from "Holi" (the color-throwing day,
entry #86, 2027-03-23, the day after). The engine's tithi-15 output matches
the *Holikadahana* date exactly, not the printed "Holi" entry — cited as
correct for what the rule's own tithi definition computes, but whether
`holi`'s `display_name`/user-facing date should represent Holika Dahan
(Purnima) or Rangwali Holi (Pratipada, the next day) is a content/product
question outside this citation's scope, not something this manifest decides.

`akshaya-tritiya-jain`, `jagannath-rath-yatra`, `nag-panchami`, and `ugadi`
had matching source entries and matching engine dates too (`nag-panchami`:
#31, 2026-08-17, engine 2026-08-17 ✓; `jagannath-rath-yatra`: #26, 2026-07-16,
engine 2026-07-16 ✓; `ugadi`: same #90 entry as `gudi-padwa`, 2027-04-07 ✓;
`akshaya-tritiya-jain`: same #13 entry as `akshaya-tritiya`, shared tithi,
2026-04-20 ✓) but **no `golden_fixtures` rows exist yet for these four
slugs/years** — confirmed via direct query, not assumed. Not written anywhere
yet; needs fixture rows seeded first (same shape as the Sikh/Jain stub batch)
before a citation has anywhere to attach.

### Flagged — real divergences found, deliberately NOT cited

The whole reason to source against a primary document instead of trusting
engine output is that divergences like these are exactly what should surface,
not get smoothed over:

| Rule (year) | Source says | Engine (corrected) says | Gap | Status |
|---|---|---|---|---|
| `ram-navami` (2026) | #3, 2026-03-26 (Thu) | ~~2026-03-27~~ **2026-03-26** | 0 (fixed) | **Fixed 2026-08-17 (D34).** Not a vṛddhi tithi — `calculatePanchang` at sub-hourly resolution shows Navami begins ~11:30-12:00 IST on 2026-03-26 (right at solar noon), fully absent at that day's sunrise. Added `corrected_tithi_reference_time: 'madhyahna'` — engine now independently computes 2026-03-26, matching the source exactly. Cited to `golden_fixtures` (`approved: false`). |
| `ganesh-chaturthi` (2026) | #41, 2026-09-14 (Mon) | ~~2026-09-15~~ **2026-09-14** | 0 (fixed) | **Fixed 2026-08-17 (D34).** Chaturthi begins ~07:00-07:30 IST on 2026-09-14, well before noon, absent at sunrise. Same `madhyahna` fix as `ram-navami`. Cited to `golden_fixtures` (`approved: false`). |
| `samvatsari-paryushana-ends` (2026) | #42, 2026-09-15 (Tue) — but the source itself lists two paksha variants (Chaturthi-paksha, Panchami-paksha) at the same single printed date, which is itself suspicious (these usually differ by a day in real Jain practice) | ~~2026-09-16~~ **2026-09-15** | 0 (fixed), source-internal ambiguity still open | **Fixed 2026-08-17 (D34).** Pañcamī begins ~07:30-08:00 IST on 2026-09-15, before noon. Same `madhyahna` fix. Cited to `golden_fixtures` (`approved: false`) — the source's own paksha ambiguity (noted at left) is a separate, still-open question, not resolved by this engine fix. |
| `onam` (2026 & 2027) | #33, 2026-08-26 (Wed) | 2026-09-23 | ~28 days — a full lunar month | **Fixed 2026-08-17 (D33).** `corrected_lunar_masa_name` was `"Bhadrapada"`; corrected to `"Shravana"` (matching `nag-panchami`, same year/system, sourced above to 2026-08-17 — Onam's real date is only 9 days later, in the same lunar month). Verified: corrected engine now computes 2026-08-26, matching the source exactly. Cited to `golden_fixtures` (`approved: false`). |

## Guards run after batch 2

`validate:rules` 96/96, `verify:calendar` unchanged (no rule logic touched,
only `ratification_note` strings and `golden_fixtures.expected`/`source`/
`reasoning` for already-`approved: false` rows), `tsc --noEmit` clean.

---

## Batch 3 (2026-08-17): four rules re-checked after a founder question ("why doesn't RP have diwali/dussehra/guru-purnima/janmashtami?")

Prompted by the founder asking why several rules had no citation. On
inspection: they were never actually missing from the source — `diwali`
had already been cited in batch 1's daily-entry table (2026-11-08) but that
citation was never written to `golden_fixtures` (still carried
`TODO_diwali_2026`); `dussehra` and `krishna-janmashtami` were simply never
checked in batch 2's sweep; and `guru-purnima` isn't in the 96-entry
"Principal Festivals" summary index at all (which is why batch 2's
summary-only search missed it) but **is** in the daily tithi grid.

| Rule | Where in source | Sourced date | Engine (corrected) date | `golden_fixtures` |
|---|---|---|---|---|
| `diwali` | Index #55 (Naraka Chaturdasi (Purvarunodaya), Dipavali (S.India), Kali Puja, Dipavali) | 2026-11-08 | 2026-11-08 ✓ | 4 rows, **approved** 2026-08-17 |
| `dussehra` | Index #50 (Durga Puja (Mahanavami, Bengal), Vijaya Dasami (Dussehara or Dasahara)) | 2026-10-20 | 2026-10-20 ✓ | 4 rows, **approved** 2026-08-17. **Superseded 2026-08-18 — see Batch 4 below**: after the Multi-Day/Cluster Festival Engine (D41) landed, the engine's tithi-at-sunrise computation for tithi 10 moved to 2026-10-21, and the citation was reassigned to Index #51 instead. |
| `guru-purnima` | **Daily entry**, Wed 29 July 2026 (7 Sravana): "Guru Purnima, Vyasa Puja, Asadhi Purnima" — not in the summary index | 2026-07-29 | 2026-07-29 ✓ (also matches the existing 2026-08-10 council ratification) | SQL sent to founder 2026-08-17, **not yet landed** — the other three rows in this batch confirmed written and approved; this one still shows `TODO_guru-purnima_2026` as of this writing. Re-send pending. |
| `krishna-janmashtami` (Smarta, 2026 only) | Index #37 (Janmashtami(Smarta), Janmashtami (vaishnava), Sri Jayanti (Ramanuja)) | 2026-09-04 | 2026-09-04 ✓ (also matches the existing council ratification) | 4 rows, **approved** 2026-08-17 |

**Also checked and confirmed genuinely absent, not missed** — `gudi-padwa`,
`holi`, `maha-shivaratri`, `vasant-panchami` all have their **2026**
occurrence before this edition's daily coverage starts (2026-03-22); only
their 2027 dates are in-window, which is exactly what batch 2 already
cited. Not a sourcing gap, a real document-coverage boundary.

## Guards run after batch 3

`validate:rules` 97/97, `tsc --noEmit` clean. No rule logic touched, only
`golden_fixtures.expected`/`source`/`reasoning` for four already-existing
`TODO` stub rows.

## Batch 4 (2026-08-18): `dussehra` 2026 reassigned from Index #50 to Index #51 (D41, founder-ratified)

The Multi-Day/Cluster Festival Engine (D41, see `CALENDAR_ENGINE_ASSESSMENT.md`)
replaced `dussehra`'s naive-approximation rule with a real 10-day Navratri
tithi span. Verified two independent ways (`LunarTithiSpanHandler`'s span
resolution, and a raw elongation-based sunrise scan bypassing all handler
code) that the plain tithi-10-at-sunrise date for 2026 is **2026-10-21**,
not the 2026-10-20 batch-3 cited. Re-checked against this source directly:
RP has **two** relevant entries, not one —

- **Index #50**: "Durga Puja (Mahanavami, Bengal), Vijaya Dasami (Dussehara
  or Dasahara)" — 20 Oct. 2026, the mainstream reading, bundled with
  Mahanavami's own day. This is what batch 3 cited.
- **Index #51**: "Vijaya Dasami (Bengal & Kerala)" — 21 Oct. 2026, matching
  the engine's plain tithi-at-sunrise computation exactly.

Batch 3 cited #50 without checking #51 existed. Founder ratified in chat
("I, Prince Sharma, as council approve it, go ahead") reassigning the
`dussehra` 2026 citation to #51: `golden_fixtures.expected.civilDate`
updated 2026-10-20 → 2026-10-21 on all 4 approved 2026 rows, `source`/
`reasoning`/`review_notes` updated to record the supersession,
`reviewed_by`/`reviewed_at` re-stamped.

**Not resolved by this ratification**: #50's mainstream reading has no
rule or variant in this codebase at all — it was never built, only ever
present as a citation string. If the mainstream civil day is wanted
alongside the Bengal/Kerala one, it needs its own sourced rule (a real
muhurta/dashami-vyapini-style condition, analogous to Diwali's pradosh
condition — not simple tithi-at-sunrise).

## Guards run after batch 4

`validate:rules` 96/96 (one fewer rule than batch 3's 97 — the redundant
standalone `dussehra` rule was removed as dead code during D41, see
`CALENDAR_ENGINE_ASSESSMENT.md`). `tsc --noEmit` clean. `golden_fixtures`
DB write confirmed via `returning`: all 4 case_ids now show
`expected.civilDate = "2026-10-21"`.

---

## Batch 5 (2026-08-23): Naraka Chaturdashi — identity separation from Diwali, same Index #55

Prompted by `docs/ANTIGRAVITY_MULTIDAY_OBSERVANCE_SERIES_PROMPTS.md` Prompt 1,
which requires a canonical `naraka-chaturdashi` observance rule to be created
as a distinct identity — not a duplicate of the `diwali` fixture.

The source for both `diwali` and `naraka-chaturdashi` is the same PDF entry:
**Index #55, p.7 (English edition)**, batch 3 above already cited for `diwali`.
This batch extracts the *distinct* named festival from that same entry.

### Source extraction

Index #55 entry, verbatim (as read from `/private/tmp/shoonaya-rp1948/all.txt`,
checksum-verified against SHA-256 `a8816abe4fae7fc0f0e4349a3d91eef00cfc0044a5f050b1b3bfe826847f9eaa`):

> **Naraka Chaturdasi (Purvarunodaya), Dipavali (S.India), Kali Puja, Dipavali**
> → 2026-11-08

The parenthetical `(Purvarunodaya)` is the liturgical criterion stated by the
source itself: Naraka Chaturdasi is associated with the Purvarunodaya (pre-dawn /
arunodaya window before sunrise).

### Epistemic Classification

- **Sourced Fact:** RP Saka 1948 Index #55 lists "Naraka Chaturdasi (Purvarunodaya)" at 2026-11-08 on its Indian reference basis.
- **Implemented Convention:** The evaluator defines `arunodaya` as (local sunrise − 96 minutes) through local sunrise.
- **Council Decision (2026-08-23):** Chaturdashi (tithi 14) is evaluated under the mode `prevails` (holding throughout the full arunodaya window).
- **Computed Consequence:** Under the ratified rule and Bedford coordinates, the engine returns 2026-11-07.

| Item | Value |
|---|---|
| Rule slug | `naraka-chaturdashi` |
| Source entry | Index #55, p.7, RP Saka 1948 |
| Verbatim source name | `"Naraka Chaturdasi (Purvarunodaya)"` |
| Source-stated civil date | 2026-11-08 |
| Distinct from `diwali` | Yes — two distinct identities, must not deduplicate |
| Liturgical criterion (source) | `Purvarunodaya` qualifier |
| Condition modelled | `tithi_presence { tithi: 14, period: 'arunodaya', mode: 'prevails' }` (council-ratified 2026-08-23) |
| Month system | Kartika purnimanta (rule) / Ashwin amanta (evaluator) via documented conversion law |
| Engine date (Ujjain) | 2026-11-08 (matches RP source) |
| Engine date (Bedford, UK) | 2026-11-07 (location-qualified result under the ratified rule) |
| `launch_status` | `included` |

### Council Decision — 2026-08-23

Prince Sharma, acting as founder/product owner, approved the conservative
full-window interpretation: Krishna Chaturdashi must prevail throughout the
entire 96-minute Arunodaya window. The calculation uses the user's location
and timezone; Ujjain is reference-only and must never replace local coordinates
silently.

### What this does NOT establish

1. **The source independently verifies Ujjain 2026, not Bedford.** Bedford 2026-11-07 is the location-qualified engine consequence of the ratified rule.
2. **Not proven for adhika or kshaya years.** 2026 has no adhika Kartika; kshaya and adhika cases are not proven generally by the 2026 single-year fixture.
3. **Regional aliases (e.g. Kali Chaudas, Choti Diwali) are not attested in this source citation** and are excluded from the rule definition until typed sources are provided.

## Guards run after batch 5

`validate:rules` 97/97. `tsc --noEmit` clean. Shadow harness `src/conditions/__tests__/naraka-chaturdashi.test.ts` passing. Production DB untouched.
