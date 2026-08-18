# Calendar Profiles (Layer B)

**Status:** Draft v1.0.0 · Phase 1 specification
**Applies to:** `packages/panchanga-core/lunar-month`, `.../solar-month`, `packages/dharma-rules/profiles`
**Markers:** `[A]` astronomical · `[C]` convention · `[S]` scholar review

A **calendar profile** converts astronomical facts into calendar labels. It never
decides when a festival is observed — that is Layer C.

---

## 1. Lunar month determination `[C]`

### 1.1 The naming rule

> **An amānta lunar month takes the name of the sidereal rāśi the Sun occupies at
> the amāvāsyā that *begins* that month.**

| Sun's rāśi at the beginning amāvāsyā | Lunar month |
|---|---|
| Mīna (Pisces) | Chaitra |
| Meṣa (Aries) | Vaiśākha |
| Vṛṣabha (Taurus) | Jyeṣṭha |
| Mithuna (Gemini) | Āṣāḍha |
| Karka (Cancer) | Śrāvaṇa |
| Siṁha (Leo) | Bhādrapada |
| Kanyā (Virgo) | Āśvina |
| Tulā (Libra) | Kārtika |
| Vṛścika (Scorpio) | Mārgaśīrṣa |
| Dhanu (Sagittarius) | Pauṣa |
| Makara (Capricorn) | Māgha |
| Kumbha (Aquarius) | Phālguna |

Equivalently and identically: *the lunar month containing Meṣa Sankranti is
Chaitra*, and so on. Both formulations must give the same answer; use the
Sankranti-containment form as the implementation, because it is what makes adhika
and kṣaya months fall out naturally (§1.3).

**A lunar month name is constant for the whole month.** It changes at the month
boundary (amāvāsyā or pūrṇimā, per system) — **never** mid-month on a Sankranti day.

### 1.2 Amānta ↔ Pūrṇimānta `[C]`

| System | Month runs | Regions |
|---|---|---|
| **Amānta** | end of one amāvāsyā → end of next | Gujarat, Maharashtra, Karnataka, Andhra, Telangana, Tamil Nadu, Kerala, Goa |
| **Pūrṇimānta** | end of one pūrṇimā → end of next | Uttar Pradesh, Bihar, Madhya Pradesh, Rajasthan, Punjab, Haryana, Uttarakhand, Himachal, Nepal (largely) |

**Conversion law:**

```
Śukla paksha  :  purnimantaMonth = amantaMonth          (identical)
Kṛṣṇa paksha  :  purnimantaMonth = amantaMonth + 1      (next month name)
```

The underlying astronomy is identical. Only the label differs. Worked example:

```
One astronomical day — Kṛṣṇa Chaturdaśī before Māgha's amāvāsyā
  Amānta      → Māgha Kṛṣṇa Chaturdaśī       (Maha Shivaratri)
  Pūrṇimānta  → Phālguna Kṛṣṇa Chaturdaśī    (Maha Shivaratri)
```

Both labels are correct. Neither app is "wrong". This is the canonical example the
product must be able to explain — see `calculation-examples.md` §1.

### 1.3 Adhika Māsa (intercalary) `[C]`

> A lunar month in which **no Sankranti occurs** is *adhika* (extra).

- It takes the **name of the following month**, prefixed *Adhika*
  (e.g. *Adhika Śrāvaṇa* followed by *Nija Śrāvaṇa*).
- Occurs roughly every 32.5 months.
- **Festival policy `[S]`:** most lunar festivals are observed in the *nija* (true)
  month, not the adhika month. Purushottama Maas observances are the exception.
  Each rule variant must declare `adhika_policy: 'nija' | 'adhika' | 'both'`.

**ADR 2026-08-11 — the "Adhika X" prefix was not propagated through the §1.2
pūrṇimānta kṛṣṇa-pakṣa conversion.**
`packages/panchang-engine/src/lunar-month/index.ts`'s krishna-paksha branch
computed `purnimantaMonth = amantaMonth + 1` correctly, but the code that was
meant to apply the "Adhika " prefix here as well was an unfinished stub written
on the module's first commit — both branches of an `isAdhika ? x : x` ternary
returned the identical value, so the check did nothing.

Consequence: an adhika month is assigned the **same amantaIndex** as the nija
month that follows it (§1.3's own rule — the adhika month "takes the name of
the following month"). Feeding that shared index into "+1" produced the
**identical pūrṇimānta string** for two different real kṛṣṇa-pakṣa fortnights
weeks apart: the adhika month's own kṛṣṇa paksha, and the nija month's kṛṣṇa
paksha right after it. A rule searching for the plain name could silently
match whichever window a naive scan reached first.

Found via a real Tier 1 source (Rashtriya Panchang, Saka 1948): Yogini
Ekādaśī 2026 is sourced at 2026-07-11 (inside the genuine, nija window), while
the naive search found 2026-06-11 (inside Adhika Jyeṣṭha's own kṛṣṇa paksha) —
a month early. `apara-ekadashi`, `shani-jayanti` and `vat-savitri-amavasya`
share the *other* affected masa pair (Jyeṣṭha) in the same 2026 window and
were unaffected only because their genuine occurrence happened to be the
*first* one that year, not the second — the defect was present for all four,
it simply didn't bite three of them.

**Fix:** the krishna-paksha branch now applies the same "Adhika " prefix
§1.3 already specifies for the amānta case, keyed on whether the *source*
month (the one whose kṛṣṇa paksha is being named) is itself adhika. Not a new
policy decision — this makes the code match what §1.3 already documents.
`vijaya-ekadashi` additionally needed `corrected_prefer_last_match: true` for
a genuine vṛddhi tithi at the same 2027 boundary (unrelated to this defect;
tithi 26 legitimately touches sunrise on two consecutive days that year).
Regression tests: `packages/panchang-engine/src/lunar-month/__tests__/lunar-month.test.ts`,
*"Purnimanta krishna-paksha naming across an adhika month"* — verified to
fail without the fix, using the real 2026 Adhika Jyeṣṭha window rather than
synthetic input, so a future change to the boundary solver or ephemeris that
shifted the adhika window would also be caught here.
`@sangam/panchang-engine` 0.2.0 → **0.2.1**.

### 1.4 Kṣaya Māsa (decayed) `[C]`

> A lunar month in which **two Sankrantis occur** is *kṣaya*; that month name is
> skipped.

- Possible only when the Sun moves fastest (near perihelion), so in practice only
  Kārtika, Mārgaśīrṣa, Pauṣa or Māgha can be kṣaya.
- Rare (multi-decade intervals). A kṣaya year always also contains two adhika months.
- **Required behaviour:** the engine must not crash or silently drop festivals of a
  kṣaya month. It must surface a `kshaya_masa` diagnostic and route affected
  festivals per the variant's `kshaya_policy` `[S]`.

### 1.5 ⚠ Current implementation is not this

`packages/panchang-engine/src/index.ts:427-428` computes:

```ts
const masaIndex = (Math.floor(astro.sunSidereal / 30) + 11) % 12;
```

This derives the month name **directly from the Sun's current rāśi**, not from
lunar-month boundaries. Two consequences:

1. **The name is ~2 months behind** the traditional pūrṇimānta name. (Verified:
   Sun in Mīna → engine says "Māgha"; the correct amānta name is "Chaitra".)
2. **Worse, the offset is not constant.** Because the Sun crosses a rāśi boundary
   *inside* every lunar month, the engine's label **changes on Sankranti days
   rather than on amāvāsyā/pūrṇimā days**. There is no fixed correction factor.

The 118 rules in `src/lib/calendar/rules.ts` were calibrated against this moving
target (see the file's own `IMPORTANT — lunar_masa_name calibration` note at
`rules.ts:47-58`). **Fixing §1.1 without simultaneously migrating every rule's
`lunar_masa_name` will break every lunar festival.** These must ship as one
atomic change with full golden-case coverage.

---

## 2. Solar month determination `[C]` `[S]`

Solar calendars begin each month at a Sankranti. Regions differ on **which civil
day the Sankranti belongs to**. These rules are `[S]` — presented here in their
widely documented form, pending council ratification.

| Rule id | Assignment | Used by |
|---|---|---|
| `sunset_rule` | Sankranti **before sunset** → same civil day is day 1; else next day | Tamil Nadu |
| `aparahna_rule` | Sankranti **before the start of aparāhna** (4th day-fifth) → same day; else next day | Kerala (Malayalam) |
| `midnight_rule` | Sankranti **before midnight** → next day is day 1 | Bengal, Assam |
| `same_day_rule` | Sankranti day is always day 1 | Odisha |

**PARKED 2026-08-18 (founder decision, second sourcing pass): `tamil_solar`,
`malayalam_solar`, `bengali_solar` join Jain/Buddhist as deprioritized
sourcing work, picked up together later.** Two sourcing passes found real,
named candidate authorities (see below) but nothing citable with a page/URL
the way Rashtriya Panchang or the USNO fixtures are cited elsewhere in this
project -- closing the gap needs a human with archival/library access to one
of the three leads, not another search pass. `[S]`/`ratified: false` stays
on all four assignment rules in `packages/panchang-engine/src/solar-month/
index.ts` and none of the three profiles are council-ratified, so no
festival rule in `rules.json` uses them and nothing currently ships on them
-- **also confirmed they must not be user-selectable** in any calendar
profile picker (onboarding, settings) until ratified; if a picker enumerates
`calendar_profiles` without filtering on ratification/approval status, that
is a bug to fix, not a UI decision to make per-profile. See
`docs/CALENDAR_ENGINE_ASSESSMENT.md`'s 2026-08-18 changelog entry.

**Sourcing attempt 2026-08-18 (not ratification-grade -- flagging, not resolving):**
searched for real citations to back these three unratified profiles
(`tamil_solar`, `malayalam_solar`, `bengali_solar` -- `odia`'s `same_day_rule`
was not part of this pass). Every hit was a Tier 5 commercial panchang
aggregator (prokerala, drikpanchang, myzodiaq, etc.) -- per
`source-governance.md` these are QA signal only, never a citation, so **none
of the three profiles can be ratified from this research**. One concrete,
checkable discrepancy did surface and is worth recording rather than
silently discarding: a Malayalam-calendar description (myzodiaq.in, still
Tier 5) states the aparāhna threshold as **3/5 of the day**, matching this
codebase's own `3 * dayFifth` (§2 table's "4th day-fifth" phrasing is the
same boundary, just named from the other side), **but describes a two-tier
outcome — Sankranti before aparāhna → next day; after aparāhna → two days
later** — not this codebase's current two-way split (before → same day;
after → next day only, see `assignSankrantiToCivilDay`'s `aparahna_rule`
branch in `packages/panchang-engine/src/solar-month/index.ts`). No Tamil or
Bengali source was found that specifically corroborated or contradicted
`sunset_rule`/`midnight_rule` as coded. **Still needed before ratification**:
a real Tier 1-4 source per region -- a state/regional almanac board (parallel
to how Rashtriya Panchang anchors the amānta batch), a recognized Jyotiṣa
text, or a Council member with direct access to a primary regional
panchangam -- not further web search, which has now been tried and tops out
at Tier 5.

**Second pass, same day:** searched specifically for named institutional/
scholarly authorities rather than general terms, and found three real
candidates -- upgraded from "nothing but Tier 5" to "real leads, still not
a checkable citation":

- **Bengal**: the **Calendar Reform Committee**, a government-appointed body
  chaired by physicist Meghnad Saha, reported in 1955 and led to the Śaka-
  based Rashtriya Panchāṅga for civil use nationally. Real, named, Tier 1
  in category -- but its scope is the *national* civil calendar unifying
  ~30 regional calendars, not a ruling on the Bengali *panjika* tradition's
  own internal Sankranti day-assignment convention specifically. Does not
  confirm or deny `midnight_rule` as coded.
- **Tamil**: confirmed a real, named methodological fork -- **Vākya**
  (traditional, Sūrya Siddhānta-based) vs. **Dṛk/Tirukaṇita** (modern
  astronomical) Panchangam traditions, both still actively published. No
  specific source located (in this pass) that states the day-assignment
  rule itself with a page/section citable the way the Rashtriya Panchang
  batches were.
- **Kerala**: **Gaṇeśa Daivajña's Grahalāghava** (c. 1520, Wikipedia:
  "the most popular [karaṇa text] among pañcāṅga makers in most parts of
  India") is a real, named, historically central Tier 2 candidate text --
  but nothing found confirms it specifically documents the aparāhna
  day-assignment rule (vs. being a general planetary-computation manual
  popular with panchang-makers for other reasons). Would need someone with
  direct access to the text to check.

None of these three closes the gap -- each is a genuine, named, chaseable
lead rather than a Tier 5 aggregator, which is real progress over the first
pass, but still not something with a page number or URL to cite the way
Rashtriya Panchang or the USNO fixtures are cited elsewhere in this project.
Locating the exact passage in any of the three (a 1955 government committee
report, a specific Vākya/Dṛk Tamil Panchangam publication, or a 500-year-old
Sanskrit karaṇa text) is archival/library work, not something further web
search will resolve -- the next step is a human with access to one of these
three, not another search pass.

This is why Makar Sankranti / Pongal / Maghi / Magh Bihu / Uttarayan can fall on
different civil dates from the same astronomical ingress. The engine must model
this, not average it away.

**Solar month names by profile**

| Profile | Month names |
|---|---|
| Tamil | Chithirai, Vaikasi, Aani, Aadi, Aavani, Purattasi, Aippasi, Karthigai, Margazhi, Thai, Maasi, Panguni |
| Malayalam | Chingam, Kanni, Thulam, Vrischikam, Dhanu, Makaram, Kumbham, Meenam, Medam, Edavam, Mithunam, Karkidakam |
| Bengali | Boishakh, Jyoishtho, Asharh, Shrabon, Bhadro, Ashwin, Kartik, Ogrohayon, Poush, Magh, Falgun, Choitro |
| Odia | Baisakha, Jyestha, Asadha, Sravana, Bhadraba, Aswina, Kartika, Margasira, Pausa, Magha, Phalguna, Chaitra |

---

## 3. Era systems `[C]`

| Era | Year formula | New year | Notes |
|---|---|---|---|
| **Vikram Samvat (North)** | CE + 57 after new year | Chaitra Śukla Pratipadā | Pūrṇimānta regions |
| **Vikram Samvat (Gujarat)** | CE + 57 after new year | Kārtika Śukla Pratipadā (day after Diwali) | Same era, **different roll-over point** |
| **Śaka Samvat** | CE − 78 | Chaitra 1 (22 Mar; 21 Mar in Gregorian leap years) | India's national civil calendar (1957) |
| **Kollam Era** | CE − 825 | Chingam 1 (~17 Aug) | Kerala |
| **Bengali San** | CE − 593 | Poila Boishakh (~14/15 Apr) | Bengal |
| **Bikram Sambat (Nepal)** | CE + 56/57 | Baisakh 1 (~13/14 Apr) | Solar-based, distinct from Indian VS |
| **Nanakshahi** | CE − 1468 | Chet 1 (14 Mar) | `[S]` — see §3.1 |

### 3.1 ⚠ Nanakshahi `[S]`

The engine currently hardcodes the **2003 Nanakshahi** fixed-solar month starts
(`packages/panchang-engine/src/index.ts:70-83`). A 2010 revision returned several
Gurpurab dates to Bikrami reckoning, and the two systems remain in parallel use by
different Sikh institutions. **The council must decide** whether Shoonaya defaults
to 2003 Nanakshahi, Bikrami, or offers both as selectable profiles. Until then,
Sikh observances must be labelled with which system produced them.

### 3.2 ⚠ Current Samvat implementation

`packages/panchang-engine/src/index.ts:431-434` rolls the Vikram Samvat year on a
hardcoded **1 April**, with the code's own comment admitting "±14 days". Replace
with the profile's true new-year rule (Chaitra Śukla Pratipadā or Kārtika Śukla
Pratipadā), which becomes available once §1 is implemented.

---

## 4. Profile registry `[C]`

Profiles are **data**, not code. Schema:

```ts
interface CalendarProfile {
  id: string;                    // 'north_indian_purnimanta'
  displayName: string;
  region: string;
  monthSystem: 'amanta' | 'purnimanta' | 'solar';
  solarMonthRule?: 'sunset_rule' | 'aparahna_rule' | 'midnight_rule' | 'same_day_rule';
  era: 'vikram_north' | 'vikram_gujarat' | 'shaka' | 'kollam' | 'bengali_san'
     | 'bikram_sambat' | 'nanakshahi';
  ayanamsha: 'lahiri' | 'raman' | 'krishnamurti';   // default 'lahiri'
  sunriseRule: 'upper_limb_refracted';               // see astronomy-conventions §3
  monthNameLocale: string;                           // 'hi' | 'gu' | 'mr' | 'ta' | …
  version: string;
}
```

### Launch profiles

| id | Month system | Era | Solar rule | Locale |
|---|---|---|---|---|
| `north_indian_purnimanta` | purnimanta | vikram_north | — | hi |
| `gujarati_amanta` | amanta | vikram_gujarat | — | gu |
| `marathi_amanta` | amanta | shaka | — | mr |
| `kannada_telugu_amanta` | amanta | shaka | — | kn / te |
| `tamil_solar` | solar | — | sunset_rule | ta |
| `malayalam_solar` | solar | kollam | aparahna_rule | ml |
| `bengali_solar` | solar | bengali_san | midnight_rule | bn |
| `odia` | amanta | shaka | same_day_rule | or |
| `nepali_bikram` | purnimanta | bikram_sambat | — | ne |
| `global_sanatan` | amanta | vikram_north | — | en |

`global_sanatan` `[C]`: the safe default for "I'm not sure". Amānta months,
neutral English naming, major observances only, **all timings computed at the
user's actual location**. It must never be presented as "the correct" calendar —
only as a neutral starting point the user can change.

---

## 5. Tradition profiles (input to Layer C)

Separate from calendar profiles. A user has **one of each**.

```ts
interface TraditionProfile {
  id: string;                    // 'smarta' | 'gaudiya' | 'sri_vaishnava' | …
  displayName: string;
  ekadashiMethod: 'smarta' | 'vaishnava_suddha';     // [S]
  janmashtamiMethod: 'smarta_nishita' | 'vaishnava_rohini';  // [S]
  shivaratriMethod: 'nishita';                        // [S]
  paranRule: 'standard' | 'vaishnava_strict';         // [S]
  version: string;
}
```

Launch set `[S]`: `smarta` (default), `gaudiya_iskcon`, `sri_vaishnava`,
`swaminarayan`, `shaiva`, `shakta`, `unspecified`.

`unspecified` must behave exactly as `smarta` **but be labelled differently** in
the UI, so a user who never chose is never told they follow a sampradāya.

---

## 6. Home tradition vs calculation location `[C]`

These are **two independent fields** and conflating them is the most common
diaspora failure.

```
observanceLocation   — WHERE the user physically observes.
                       Drives ALL sunrise/sunset/moonrise/muhurta maths.
                       Drives the primary reminder.  ← always the user's real place

calendarProfile      — WHICH tradition's calendar labels and festival rules apply.
                       Derived from family/regional origin, NOT from current GPS.

referenceLocations[] — optional comparison rows (home town, family temple, Ujjain).
                       Display-only. Clearly labelled. Never drives reminders.
```

Worked case:

```
User: Punjabi family, living in Bedford, UK
  observanceLocation : Bedford, UK          (52.135 N, −0.467 E, Europe/London)
  calendarProfile    : north_indian_purnimanta
  traditionProfile   : smarta
  referenceLocations : [Amritsar, Ujjain]
→ North Indian festival rules, evaluated against Bedford sunrise.
```

**Prohibited:** auto-switching a user's `calendarProfile` because their GPS moved,
or because a local organisation publishes a different calendar. Location changes
`observanceLocation` only.

---

## 7. Onboarding → profile resolution `[C]`

Recommend, never impose. Show the recommendation and let the user change it.

| Signal | Weight |
|---|---|
| Explicit region answer (onboarding Q2) | Decisive |
| Family-origin state, if given | High |
| App language | Medium |
| Country of residence | **Low** — a UK address does not imply a UK-organisation calendar |
| GPS | **Never** used for profile, only for `observanceLocation` |

Fallback for "I'm not sure" → `global_sanatan` + `unspecified`.
`unspecified` uses the Smārta calculation method until the user chooses a
sampradāya, but the product must never label that user as Smārta. These are
neutral launch defaults and can be changed at any time.

---

## 8. Open items requiring council ratification `[S]`

| # | Item | Blocking |
|---|---|---|
| P1 | Solar-month day-assignment rules for Tamil / Malayalam / Bengali / Odia | Tamil + Malayalam profiles |
| P2 | Nanakshahi 2003 vs Bikrami default | All Sikh observances |
| P3 | Adhika-māsa festival policy (nija vs adhika) per festival | Any adhika year |
| P4 | Kṣaya-māsa festival routing | Rare, but must not crash |
| P5 | Whether Gujarati profile should default to Śaka or Vikram year *numbering* | Gujarati profile display |
