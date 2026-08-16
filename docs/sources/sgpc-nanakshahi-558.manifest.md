# Provenance manifest — SGPC Nanakshahi Calendar, Samvat 558 (2026–27)

**Status: official-source-backed, pending council ratification — not fully
settled.** Same caveat as the *Rashtriya Panchang* manifest: this is a
strong Tier 1 citation, not a scholarly ruling; `docs/source-governance.md`
§2 and the unresolved 2003-Nanakshahi-vs-Bikrami fork (`calendar-profiles.md`
§3.1, council item P2) mean this is provisional until the council explicitly
adopts SGPC's 2003-Nanakshahi system as the app's Sikh default.

## Edition

| Field | Value |
|---|---|
| Title | Nanakshahi Calendar, Samvat 558 (Year 2026–27) — "ਕੈਲੰਡਰ: ਨਾਨਕਸ਼ਾਹੀ ਸੰਮਤ ੫੫੮ (ਸੰਨ 2026-27)" |
| Publisher | Secretary, Dharam Parchar Committee, Shiromani Gurdwara Parbandhak Committee (SGPC), Sri Amritsar |
| Source tier | **1** — official calendrical authority for the Nanakshahi calendar (`source-governance.md` §2) |
| Pages | 3 (poster-format, one quarter-year per page) |
| SHA-256 | `ad9ff9ad7f558a585003095aa6ee383b8cf03374b53e2abde5cea7be7d7929d5` |
| Obtained | Downloaded directly from SGPC's own download menu, 2026-08-16 — `https://sgpc.net/storage/2026/03/Calender_2026-1.pdf`, linked from `https://sgpc.net/nanakshahi-calendar/`'s "Download" dropdown, titled "Nanakshahi Calendar (2026-27)" |

**Correction on the record**: an earlier fetch of `sgpc.net/wp-content/uploads/2025/03/Calender-Nanakshahi-557.pdf`
(surfaced by a web search summary claiming it was the "2026-27/558"
edition) was checked against its own cover page and found to actually be
**Samvat 557 (2025–26)** — the previous cycle. Not used for anything.
Always verify a source's own stated edition directly rather than trusting
a search engine's synthesis of it.

## Extraction method

Neither official PDF (the poster-format "Calendar" or the tabular "Jantri")
has plain, reliably linear text. `pdftotext -layout`'s row-reconstruction
heuristic **demonstrably misorders cells** in the main grid — spot-checked
Vaisakh's day 31 against it and got paired with the wrong Gregorian month
entirely (a full month off), caught before it could produce a wrong
citation.

Used `pymupdf` to read real per-word (x, y) bounding boxes instead of
trusting linearized text flow. Two distinct extractions:

1. **Sidebar Gurpurab list** (festival name → Nanakshahi "DD month" date):
   fully reliable — every entry's name and date words share one exact
   y-coordinate; grouping words by shared y reproduces the list correctly
   every time. `pdftotext -bbox` (not `-layout`) gives real per-word
   coordinates without needing a separate PDF library. Script:
   `scripts/sources/extract-nanakshahi-dates.mjs`
   ```
   pdftotext -bbox Calender_2026.pdf calender.bbox.xml
   node scripts/sources/extract-nanakshahi-dates.mjs calender.bbox.xml
   ```
   (reproduces the exact table below; verified against the committed PDF's
   checksum. An initial pass used a Python/pymupdf prototype to explore the
   technique — ported to this `-bbox`+Node form since the repo's own
   `.gitignore` deliberately excludes `*.py`, and the existing
   `extract-panchang-dates.mjs` precedent already establishes
   pdftotext-CLI-plus-Node as this repo's actual convention.)

2. **Nanakshahi month-start Gregorian dates**: extracted by locating each
   month's "day 1" grid cell directly (paired with its Gregorian date
   immediately below it) via the same word-coordinate technique, for all
   12 months. Done as targeted lookups, not a generalized script, since a
   first attempt at a fully automatic grid-parser had a real bug (returned
   no matches) and the 12-value table is small enough to verify by direct
   inspection instead of debugging a generalized parser further.

   | Nanakshahi month | Gregorian start | Length (days) |
   |---|---|---|
   | Chet | 2026-03-14 | 31 |
   | Vaisakh | 2026-04-14 | 31 |
   | Jeth | 2026-05-15 | 31 |
   | Harh | 2026-06-15 | 31 |
   | Sawan | 2026-07-16 | **32** |
   | Bhadon | 2026-08-17 | **31** |
   | Assu | 2026-09-17 | 30 |
   | Katak | 2026-10-17 | 30 |
   | Maghar | 2026-11-16 | 30 |
   | Poh | 2026-12-16 | 29 |
   | Magh | 2027-01-14 | 30 |
   | Phagun | 2027-02-13 | — (cycle ends 2027-03-13) |

   **Correction to a widely-repeated secondary-source claim**: several
   sites (Golden Temple Amritsar, SikhNet, etc.) describe Nanakshahi as
   simply "first 5 months = 31 days, remaining 7 = 30 days." That is
   **not what this cycle's own document shows** — Sawan has 32 days and
   Bhadon 31, not 31/30. Read directly from the primary source instead of
   repeating the secondary claim.

   **Independent cross-validation**: two computed dates were checked
   against widely-known public information for 2026 and matched exactly —
   Bandi Chhor Divas (23 Katak → **8 November 2026**, coincides with
   Diwali as the rule itself states) and Guru Nanak Gurpurab (9 Maghar →
   **24 November 2026**). Both are independently and commonly cited public
   dates for 2026, giving real confidence in the month-start table's
   Oct–Dec segment specifically; the rest of the table was read the same
   direct way but has not been independently cross-checked beyond that.

## Citations — resolved (7 of 10 targeted Sikh rules)

| Rule | Gurmukhi entry (as printed) | Nanakshahi date | Gregorian date |
|---|---|---|---|
| `baisakhi` | ਖ਼ਾਲਸਾ ਸਾਜਣਾ ਦਿਵਸ (ਵੈਸਾਖੀ) | 01 Vaisakh | **2026-04-14** |
| `guru-arjan-dev-martyrdom` | ਸ਼ਹੀਦੀ ਦਿਵਸ ਸ੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਸਾਹਿਬ ਜੀ | 04 Harh | **2026-06-18** |
| `bandhi-chhor-divas` | ਬੰਦੀ ਛੋੜ ਦਿਵਸ (ਦੀਵਾਲੀ) | 23 Katak | **2026-11-08** |
| `guru-nanak-gurpurab` | ਪ੍ਰਕਾਸ਼ ਗੁਰਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ | 09 Maghar | **2026-11-24** |
| `guru-tegh-bahadur-martyrdom` | ਸ਼ਹੀਦੀ ਦਿਵਸ ਸ੍ਰੀ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਸਾਹਿਬ ਜੀ | 29 Maghar | **2026-12-14** |
| `guru-gobind-singh-gurpurab` | ਪ੍ਰਕਾਸ਼ ਗੁਰਪੁਰਬ ਸ੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਸਾਹਿਬ ਜੀ | 02 Magh | **2027-01-15** |
| `guru-ravidas-jayanti` | ਜਨਮ ਦਿਹਾੜਾ ਭਗਤ ਰਵਿਦਾਸ ਜੀ (650 ਸਾਲਾ) | 08 Phagun | **2027-02-20** |

Each rule's `description` field in `rules.json` was checked against the
matching Gurmukhi entry before assigning a date — several rules share the
same Guru name with a different event (e.g. Guru Tegh Bahadur has three
separate SGPC entries: installation 19 Chet, birth 25 Chet, martyrdom 29
Maghar; the rule's own "Shaheedi Diwas ... martyrdom" description
disambiguates which one applies).

## Not resolved — genuinely absent or ambiguous, not guessed

- **`lohri`**: not present anywhere in SGPC's Gurpurab list across all 3
  pages (confirmed, not just missed). It's a separate Punjabi harvest
  festival, not a Sikh religious Gurpurab. The rule's own description
  ("night before Makar Sankranti") independently fixes it to **13
  January** every Gregorian year by long-standing convention — but that
  is not an SGPC citation and hasn't been entered as one here.
- **`holla-mohalla`**: also absent from SGPC's list (a Nihang cultural
  gathering at Anandpur Sahib, not one of the listed Gurpurabs). No
  citation available from this source.
- **`sahibzade-shaheedi-diwas`**: genuinely ambiguous. The rule's own
  description says "the four Sahibzade," but SGPC's list carries **two**
  separate martyrdom dates — elder Sahibzadas + other Chamkaur martyrs (08
  Poh) and younger Sahibzadas + Mata Gujri Ji (13 Poh). Neither was
  entered; this needs a human decision on which date (or whether both)
  the rule is meant to represent before sourcing it.

## What this does NOT establish

Same category of caveat as the Rashtriya Panchang manifest: confirms these
7 dates for the 2026–27 cycle specifically. The Nanakshahi calendar is a
fixed civil calendar (not lunar/tithi-dependent), so unlike Hindu festival
dates these should repeat on the same Gregorian date shift pattern in
future cycles — but each future year still needs its own SGPC edition
checked directly, not assumed, especially given the Sawan/Bhadon
month-length surprise found this cycle. Also does not resolve the
2003-Nanakshahi-vs-Bikrami council question (P2) — these dates are only
valid if the council adopts the 2003-Nanakshahi system as the app default.

## Guards

`golden_fixtures` rows updated: 7 festivals × 1 year each (2026 or 2027,
whichever the computed date falls in) × 2 locations (Ujjain, Bedford UK) =
14 rows total, `approved` left `false` on every one for human review via
`/admin/calendar-governance`. 2027/2028 rows for these same festivals
remain unsourced `TODO` stubs — this cycle's SGPC edition only covers
2026–27; next year's rows need next year's edition, not assumed from this
one.
