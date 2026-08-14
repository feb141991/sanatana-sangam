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
