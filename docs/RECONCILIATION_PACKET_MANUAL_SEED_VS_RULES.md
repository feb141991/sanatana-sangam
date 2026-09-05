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
an **External evidence (2026-09-05)** subsection — independent research
against sources outside this project. Per `source-governance.md` §6's
binding product wording (never "the correct date is …" or language implying
a tradition/source is mistaken), this evidence is reported as **candidate
dates and their sourcing**, not as resolutions. None of it has been
ratified. A 2026-09-05 correction is recorded inline where an earlier
version of this section used disqualified language ("confirmed,"
"answered," "correct," "wrong") — flagged rather than quietly rewritten,
since the same review that caught it also found a factual gap in the
Sangha Day item (§5) that changes its substance, not just its wording.

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

**External evidence (2026-09-05):** a source record already committed to
this repo, not new external research — `docs/sources/rashtriya-panchang-saka-1948.manifest.md:190`,
citing *Rashtriya Panchang, Saka 1948* (Positional Astronomy Centre / IMD,
Govt. of India) — **Tier 1** per `source-governance.md` §2. Entry #90
"Chaitra Sukladi (Gudi Padava, Ugadi)" lists **2027-04-07**, matching this
project's own independently-computed engine value. This is a Tier 1
candidate for question (a), with all three currently-stored rows already in
agreement — a stronger evidentiary position than any other item in this
packet, but still a candidate pending the reviewer's ratification, not a
resolution. Questions (b) and (c) remain entirely structural/governance
calls, untouched by this evidence.

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

**External evidence (2026-09-05):** one source found —
[AnydayGuide](https://anydayguide.com/calendar/18-07-2027), a general
holiday-calendar aggregator, **Tier 5**, no Tier 1-4 source located —
lists Asalha Puja (the full-moon day traditionally preceding Vassa) at
**2027-07-18**. Combined with the traditional "Vassa begins the day after"
convention, this is a Tier 5-sourced candidate of **2027-07-19**, matching
both currently-stored rows. Per §2's own rule, Tier 5 "may be attached as
corroboration but never as the sole authority" — this does not establish
2027-07-19 as correct, only as a candidate consistent with one commercial
aggregator. A national Theravada Buddhist authority's own published
calendar (Thailand's or Sri Lanka's) would be needed to reach Tier 1-4 and
should still be sought.

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

**External evidence (2026-09-05, corrected 2026-09-05):** the original
version of this note cited [TheSkyLive](https://theskylive.com/full-moon-october-2027)
for the October 2027 full-moon instant. That URL returns HTTP 403 to
automated fetches and is **not independently reproducible from the link
alone** — flagged on review. Replaced with a reproducible calculation using
this project's own elongation-based bisection (the same engine that
produces every other date in this codebase, not a third-party source under
the Tier 1-5 rubric): `scripts/verify-pavarana-full-moon.ts` (re-run with
`npx tsx scripts/verify-pavarana-full-moon.ts`) independently computes the
October 2027 full moon at **2027-10-15, 13:47 UTC** — within an hour of
TheSkyLive's original figure and the same civil date, but now verifiable
without depending on that site being reachable.

Per this packet's own earlier caution, a raw UTC instant does not by itself
establish which Gregorian date a Theravada tradition observes locally —
timezone, local moonrise/moonset convention, and monastic-sighting practice
can all shift the observed day from the raw astronomical moment. **This is
evidence worth weighing, matching the rules-engine sibling's stored date
(`pavarana-end-of-vassa`, 2027-10-15) and diverging from the manual-seed
slug's 2027-10-17 — it is not a finding that either row is correct or
incorrect.** A Buddhist-authority source (a national Theravada calendar) is
still needed to actually resolve which Gregorian date the tradition
observes.

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

**External evidence (2026-09-05):** `docs/sources/rashtriya-panchang-saka-1948.manifest.md:230`
already contains a **Tier 1** record for 2026 specifically — Rashtriya
Panchang entry #42 lists **2026-09-15**, matching the rules-engine sibling
(`samvatsari-paryushana-ends`, 2026-09-15) and diverging from the
manual-seed slug's 2026-09-06 (9 days off). The manifest itself flags a
separate, still-open ambiguity in the source's own paksha-variant listing —
that caveat is not resolved by this finding and is carried forward, not
dismissed. This is a Tier 1 candidate for 2026, the strongest evidence tier
in this packet after item 1 — still pending reviewer ratification, not a
finding that the manual-seed date is wrong. 2027 (1-day gap, 09-04 vs
09-05) was not independently checked here; the same manifest source should
be consulted for a 2027 entry before drawing any inference from the 2026
result.

---

## 5. Sangha Day — naming/content question, not primarily a date discrepancy

| | |
|---|---|
| Manual-seed slug | `sangha-day` — 2027-11-11 (published, `legacy_sync`, cites timeanddate.com) |
| Rules-engine sibling | `sangha-day-loy-krathong` — 2027-11-13 (published, `calculated_by: cron_job`) |
| Existing, separate definition | `magha-puja` (`rules.json`) — `launch_status: deferred`, no stored occurrence row |
| Discrepancy | 2 days between the two November rows, but see below — the more load-bearing question is whether "Sangha Day" belongs in November at all. |

**Question for reviewer:** Should `sangha-day`/`sangha-day-loy-krathong` be
reconciled against the existing `magha-puja` definition, and separately,
should the Loy Krathong content be repaired (correct name, correct date) or
retired? See the correction and evidence below for why this replaces the
original "which of the two November dates is correct" framing.

**Correction to an earlier version of this section (2026-09-05):** it stated
"does this project have a real Magha Puja/Sangha Day definition at all (it
does not appear to, under any slug checked here)." **That is factually
wrong and is retracted.** `rules.json:1347` already contains a `magha-puja`
entry — `display_name: "Magha Puja"`, description *"Full moon day
commemorating the spontaneous gathering of 1,250 enlightened disciples
before the Buddha — Fourfold Assembly Day,"* `tradition: buddhist`,
`launch_status: deferred`. This is the exact event the sources below
describe, already correctly modeled, already in this project's own rule
set — it was simply never checked against `sangha-day`/
`sangha-day-loy-krathong` before the earlier version of this section was
written. The real reconciliation question is against this existing
definition, not "does one exist."

**External evidence (2026-09-05):** several general reference sources —
[religionfacts.com](https://religionfacts.com/sangha-day),
[learnreligions.com](https://www.learnreligions.com/magha-puja-449909),
[Tricycle](https://tricycle.org/article/magha-puja/),
[RE:ONLINE](https://www.reonline.org.uk/festival_event/magha-puja/) — none
above Tier 5 on this project's rubric — describe "Sangha Day" as a common
alternate name for Māgha Pūjā, observed on the full moon of the third lunar
month (February or March), commemorating the gathering of 1,250 disciples —
the same event `magha-puja` already describes. Separately, Loy Krathong
(the Thai twelfth-lunar-month lantern festival) is reported by several
Tier 5 tourism/calendar sources (e.g.
[UME Travel](https://www.umetravel.com/loy-krathong-festival/dates.html))
at **2027-11-14**.

The two currently-stored rows (`sangha-day` 2027-11-11,
`sangha-day-loy-krathong` 2027-11-13) both sit in November, near but not
matching the Loy Krathong date reported above, and nowhere near the
February/March window the sources above associate with Sangha Day/Magha
Puja. **Candidate reading, pending reviewer judgment, not a determination:**
this looks less like a 2-day accuracy gap between two sources for one event,
and more like the "Sangha Day" name having been attached to Loy Krathong-
adjacent content rather than to the Magha Puja event `magha-puja` already
models. **Reconciliation question for the reviewer:** should `sangha-day`
and `sangha-day-loy-krathong` be retired/merged into the existing
`magha-puja` definition (once its own `deferred` status and dates are
separately reviewed), should the Loy Krathong content be kept but renamed
and correctly dated, or is there a reading of the source material this
packet has missed that reconciles the current naming? This packet does not
resolve source-tier or licensing questions for Loy Krathong content either —
that would need its own citation work if kept.

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
