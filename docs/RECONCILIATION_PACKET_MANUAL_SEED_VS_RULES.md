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

Status of every item below: `draft` (nothing yet reviewed).

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
