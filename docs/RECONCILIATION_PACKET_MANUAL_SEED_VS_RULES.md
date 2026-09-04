# Reconciliation packet — manual-seed vs. rules-engine dates

**What this is.** Seven observances (`das-lakshana-dharma`, `gudi-padwa-ugadi`,
`paryushana-parva`, `pavarana`, `samvatsari`, `sangha-day`, `vassa-begins`) have
no `rules.json` computation rule at all. They are live today only because of an
older, separate manual-seed mechanism (`calculated_by: 'legacy_sync'`) that
wrote dates directly into `observance_occurrences`, citing external sites.
Five of the seven collide — either exactly or by a few days — with an
already-`rules.json`-backed sibling slug that describes the same underlying
festival moment under a different name. **We are not asking you to check our
astronomy.** We are asking, per item below, one question:

> **Which date is correct, and should these become one properly-ruled
> observance instead of two independent, disagreeing sources?**

**Nothing has been changed.** No row has been deleted, no rule has been
written, no publication status has changed. This packet exists so that
decision is made by a named reviewer, not inferred by engineering — consistent
with `docs/source-governance.md` §5: *"A `[S]` decision cannot be made by
engineering. Engineering may implement, document, and flag — never ratify."*

**A source-tier problem applies to all five items below, independent of which
date is correct.** `docs/source-governance.md` §2 classifies myfest.in,
drikpanchang.com, and timeanddate.com — the only citations behind any of these
seven manual-seed rows — as **Tier 5: "Digital panchāṅga services / commercial
calendar sites,"** with the explicit rule: *"Tier 5 may be attached as
corroboration but never as the sole authority."* None of these seven rows cite
a Tier 1-4 source at all. Even the item that turns out to have the "right"
date on the calendar still needs a Tier 1-4 source found and cited before it
can be treated as `approved` under this project's own policy — it cannot
simply be promoted as-is.

**Provenance/legality note, not yet checked:** §3 of the same document
prohibits scraping/bulk-mirroring a commercial panchāṅga site's ToS-protected
output. This packet does not determine how the original `legacy_sync` dates
were obtained (manual entry vs. automated retrieval) — flagged as an open
question for whoever owns that history, not resolved here.

Status of every item below: `draft` (nothing yet reviewed). Each now carries
an **External verification (2026-09-05)** subsection — independent research
against sources outside this project, done to answer *which date is
factually correct*, not to make the *which-slug-survives* decision above.
That decision remains the reviewer's per `source-governance.md` §5; this
research only narrows what they're deciding between.

---

## 1. Gudi Padwa / Ugadi — triple duplicate + governance contradiction

| | |
|---|---|
| Manual-seed slug | `gudi-padwa-ugadi` — 2027-04-07 (published, `legacy_sync`, cites drikpanchang.com) |
| Rules-engine sibling 1 | `gudi-padwa` — 2027-04-07 (published, `calculated_by: manual_engine_run_v2`) |
| Rules-engine sibling 2 | `ugadi` — 2027-04-07 (published, `calculated_by: manual_engine_run_v2`) |
| Discrepancy | **None — all three agree exactly on the date.** The problem is three separate, live rows for what a user will read as the same festival day. |

**Separate, more serious contradiction found alongside this:** `gudi-padwa`
and `ugadi` are both `launch_status: 'deferred'` in `rules.json` — this
project's own governance rule states a deferred rule "is knowable, but ...
not ready to stand behind" and `isPublishable()` (`engine.ts:183`) enforces
exactly that by withholding deferred rules from new computation. **But both
already have their own independently-`published` 2027-04-07 row**, written
before (or outside of) whatever set them to deferred. A rule being deferred
must have an explicit, enforced relationship to any pre-existing published
data for it — right now the system has two conflicting publication
authorities for the same slug (the deferred flag says "not ready"; the stored
row says "published"), and nothing reconciles them.

**Question for reviewer:** (a) Is 2027-04-07 actually correct for Gudi
Padwa/Ugadi? (b) Should `gudi-padwa-ugadi` be retired in favor of the two
separately-named slugs (matching how the rest of the catalogue treats
regionally-different names for one civil event), or is a combined slug
intentional for some UI/regional context this packet doesn't know about? (c)
Separately: why are `gudi-padwa`/`ugadi` deferred at all if a published date
already exists — should they be un-deferred, or should their existing
published rows be withheld until the deferral is lifted?

**External verification (2026-09-05):** already resolved by a Tier 1 source
already committed to this repo, not new external research —
`docs/sources/rashtriya-panchang-saka-1948.manifest.md:190`, Rashtriya
Panchang (Positional Astronomy Centre / IMD, Govt. of India), entry #90
"Chaitra Sukladi (Gudi Padava, Ugadi)" → **2027-04-07**, matching this
project's own independently-computed engine value exactly. **Question (a) is
answered: 2027-04-07 is correct**, and a real Tier 1-4 citation now exists
for it (it just needs to actually be attached to whichever row(s) survive).
Questions (b) and (c) are structural/governance, not accuracy questions —
still the reviewer's call.

---

## 2. Vassa Begins — exact duplicate

| | |
|---|---|
| Manual-seed slug | `vassa-begins` — 2027-07-19 (published, `legacy_sync`, cites timeanddate.com) |
| Rules-engine sibling | `vassa-begins-rains-retreat` — 2027-07-19 (published, `calculated_by: cron_job`) |
| Discrepancy | **None — exact match.** Same live-duplicate-display shape as item 1, without the deferred-flag contradiction (`vassa-begins-rains-retreat` is not deferred). |

**Question for reviewer:** Is 2027-07-19 correct? Should `vassa-begins` (the
manual-seed slug) be retired once `vassa-begins-rains-retreat` is confirmed
correct, or does the product intentionally want a separate "begins" moment
distinct from the "rains retreat" framing?

**External verification (2026-09-05):** Asalha Puja 2027 (the full-moon day
that precedes Vassa) is independently reported at **2027-07-18** (multiple
Buddhist/travel calendar sources, cross-checked; still Tier 5-equivalent
sourcing, no government/monastic authority found for the exact Gregorian
date). Vassa traditionally begins the day after that full moon —
**2027-07-19**, matching both stored rows exactly. **Question is answered:
2027-07-19 is correct**, though a stronger (Tier 1-4) citation than what
this search found still doesn't exist and should be sought (a national
Theravada Buddhist authority's own published calendar, e.g. Thailand's or
Sri Lanka's, would qualify) before treating it as `approved`.

---

## 3. Pavarana — 2-day discrepancy

| | |
|---|---|
| Manual-seed slug | `pavarana` — 2027-10-17 (published, `legacy_sync`, cites timeanddate.com) |
| Rules-engine sibling | `pavarana-end-of-vassa` — 2027-10-15 (published, `calculated_by: manual_engine_run_v2`) |
| Discrepancy | **2 days.** These are two independent, live, disagreeing answers for what should be the same Buddhist observance (end of the Rains Retreat). |

**Question for reviewer:** Which of 2027-10-15 or 2027-10-17 is correct
(neither currently cites a Tier 1-4 source), and should these two slugs merge
into one properly-`rules.json`-backed definition?

**External verification (2026-09-05):** the astronomical full moon of
October 2027 falls on **2027-10-15** (14:47 UTC) — confirmed via TheSkyLive,
an independent astronomy reference, not a religious-calendar service.
Pavarana is defined as the full-moon day marking the end of Vassa, so this
is a direct, non-panchang-vendor confirmation. **Matches the rules-engine
sibling (`pavarana-end-of-vassa`, 2027-10-15) exactly; the manual-seed
slug's 2027-10-17 does not match and appears to be the wrong one of the
two** — though the reviewer's call on which slug/row structure to keep
remains open, and a Buddhist-authority (not pure-astronomy) source should
still be sought to confirm no traditional local-sighting/timezone
convention shifts the observed date by a day from the raw astronomical
moment.

---

## 4. Samvatsari — 9-day (2026) and 1-day (2027) discrepancies

| | |
|---|---|
| Manual-seed slug | `samvatsari` — 2026-09-06, 2027-09-04 (published, `legacy_sync`, cites myfest.in / drikpanchang.com) |
| Rules-engine sibling | `samvatsari-paryushana-ends` — 2026-09-15, 2027-09-05 (published, `calculated_by: lazy_materialize_on_read` / `manual_engine_run_v2`) |
| Discrepancy | **9 days in 2026, 1 day in 2027.** The 2026 gap is large enough that this is very unlikely to be a rounding/boundary artifact — worth checking whether the two sources are even describing the same day-defining convention (Samvatsari is the culmination of Paryushana; if one source counts an 8-day Paryushana and the other a longer regional variant, the "ends" date would genuinely differ by more than a day). |

**Question for reviewer:** Are these two slugs actually describing the same
moment under different regional/sectarian conventions (in which case both may
be legitimately correct for different audiences and should be labeled as
such, not merged), or is one of them simply wrong?

**External verification (2026-09-05):** `docs/sources/rashtriya-panchang-saka-1948.manifest.md:230`
already contains a Tier 1 finding for the 2026 date specifically —
Rashtriya Panchang entry #42 → **2026-09-15**, matching the rules-engine
sibling (`samvatsari-paryushana-ends`, 2026-09-15) exactly, **not** the
manual-seed slug's 2026-09-06 (9 days off). The manifest itself flags an
open, separate ambiguity in the source's own paksha-variant listing — noted
there as unresolved, not contradicted by this finding. **For 2026, the
question is answered: 2026-09-15 is correct, sourced to a real Tier 1-4
citation already in this repo.** 2027 (1-day gap, 09-04 vs 09-05) was not
independently re-checked here — the same manifest source should be
consulted for a 2027 entry before assuming the pattern holds.

---

## 5. Sangha Day — 2-day discrepancy

| | |
|---|---|
| Manual-seed slug | `sangha-day` — 2027-11-11 (published, `legacy_sync`, cites timeanddate.com) |
| Rules-engine sibling | `sangha-day-loy-krathong` — 2027-11-13 (published, `calculated_by: cron_job`) |
| Discrepancy | **2 days.** |

**Question for reviewer:** Which date is correct, and is "Sangha Day" the
same observance as "Sangha Day / Loy Krathong," or two distinct Buddhist/Thai
observances that happen to share a name fragment?

**External verification (2026-09-05) — this changes the question, not just
the answer.** "Sangha Day" is independently, consistently documented
(multiple sources: religionfacts.com, learnreligions.com, Tricycle, RE:ONLINE,
buddhism.net) as an **alternate name for Māgha Pūjā / Fourfold Assembly Day**
— observed on the full moon of the **third** lunar month, which falls in
**February or March**, not November. It commemorates an unrelated event (the
spontaneous gathering of 1,250 arhats at Veḷuvana) with no connection to Loy
Krathong at all. Loy Krathong itself is independently confirmed at
**2027-11-14** (multiple Thai-tourism/calendar sources, cross-checked) — the
Thai lunar new-year lantern festival, observed on the full moon of the
*twelfth* lunar month.

Both stored rows (`sangha-day` 2027-11-11, `sangha-day-loy-krathong`
2027-11-13) sit in November, near but not matching the independently-confirmed
Loy Krathong date (2027-11-14) — and neither is anywhere near the real Sangha
Day/Magha Puja window (Feb/Mar 2027). **This is not a 2-day accuracy
discrepancy to resolve between two sources — it reads as a content-modeling
error:** the "Sangha Day" name appears to have been attached to what is
actually a Loy Krathong-adjacent date, an entirely different festival. The
reviewer question is no longer just "which date" but: **does this project
have a real Magha Puja/Sangha Day definition at all (it does not appear to,
under any slug checked here), and should `sangha-day`/`sangha-day-loy-krathong`
be corrected, split into two genuinely separate definitions (a real Sangha
Day in Feb/Mar, and a Loy Krathong in Nov), or retired if out of scope?**

---

## Checked, no collision found (informational only, not included above)

- `paryushana-parva` (manual-seed) vs. `paryushana-parva-begins` (ruled):
  different dates in both 2026 and 2027, and the 2027 ruled-sibling row is
  itself `publication_status: 'withheld_disputed'` — no live collision today.
- `das-lakshana-dharma` (manual-seed) vs. `das-lakshana-dharma-begins`
  (ruled): only one overlapping definition has a 2026 row at all; no shared
  year to compare yet.

These two are lower priority for this packet but should be revisited once
either source materializes a shared year.
