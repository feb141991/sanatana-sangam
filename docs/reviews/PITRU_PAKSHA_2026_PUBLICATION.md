# Pitru Paksha 2026 publication review

Date: 2026-09-30. Review reference: `founder:pitru-paksha-2026-20260930`.

The human owner explicitly approved source review and publication in this chat: “i have verified the sources and approved it and make it available right away”. This is a founder approval, not a claimed scholarly council meeting. The new `reviewed_editorial` status records that distinction and requires a review reference in Backend and Native.

Approved scope: the 13 existing, withheld `pitru-paksha-day-1` through `pitru-paksha-day-13` occurrences for 2026, `legacy-ujjain`, `legacy-default`, null spiritual-tradition variant, Ujjain coordinates 23.1765/75.7885 and Asia/Kolkata. The existing approved Mahalaya Amavasya is the concluding child; retain its date, approval, lock and audit notes. No other year, location, profile or disputed occurrence is approved by this migration.

Day numbers denote civil remembrance-journey positions, not Shraddha tithis. The range calculated by the existing `getPitruPakshaDay` engine is September 27–October 10, 2026. The [Thanjavur Panchangam London edition](https://cdn.umath.in/panchanga-2026-2027/pdf/london_2026_2027.pdf), PDF page 7 / printed page 40, independently corroborates that range. It is a London regional publication; it is not being represented as authority for Ujjain ritual timings or universal dates. The owner's source approval and the existing engine are recorded separately from this corroboration. No astronomical engine or profile-aware calculation rule was changed.

Editorial remains brief, curated remembrance copy. It includes no prescribed ritual, mantra, reward or comparative auspiciousness claim. Unsupported “most auspicious” wording and specific water/sesame instructions were replaced with family/tradition-sensitive language. English is approved; Hindi/Punjabi use the existing English fallback rather than claiming unreviewed translations.

Confirmed defects corrected: a forward-only Home/upcoming slice cannot prove complete active series; notification eligibility queried only candidate slugs rather than all sibling slugs; legacy Pitru delivery could coexist with candidate delivery and ignored festival consent/deleting accounts; missing GPS combined reference coordinates with a foreign timezone; candidate editorial gating disagreed with calendar/Native human-review gating. Both read contracts and the same canonical series definitions are reused.

Migration history: the two previous Pitru migrations were applied by another session under remote versions 20260930013151 and 20260930013332. Their local files now match the stored remote statements exactly, preserving the original applied SQL (including its historical DISTINCT ON defect), rather than rewriting history with a later fix. Do not replay these historical migrations over reviewed data. New publication is append-only, version 20260930013837, captures pre-publication state, refuses unexpected dates/contexts/states, and is idempotent.

Reproduce the engine dates, publication counts, active Day 4, sibling completeness, candidate generation and rollback in a disposable local database with `bash scripts/shadow/verify-pitru-publication-shadow.sh`. This test reads no production credentials.

## Review coverage sign-off

- Cardinality: exactly 13 newly published rows, 14 complete series children, one current child, one candidate per target day; assert those counts in the shadow runner.
- Both directions: outside-profile/year neighbors stay unchanged; a withheld sibling blocks completeness; rollback restores all touched fields and dates remain unchanged.
- Falsifiability: the focused sibling query regression fails with candidate-only slug filtering; publication rejects a changed date or partial marker.
- Boundaries: day before/start/current/end/day after, foreign delivery timezone with no GPS, explicit opt-out, deleting account, and candidate/legacy cutover are covered.
- Cross-engine evidence: regional primary publication corroborates civil range only; no new engine or claim of independent verification of every ritual tithi.
- Scope honesty: no physical-device push receipt or installed OTA is claimed by unit/shadow tests. Deployment and publication evidence must be recorded separately below.

## Verification checkpoint

Shadow runner passed: 14 independently recomputed engine dates; exactly 13 new publications plus existing Mahalaya; active Day 4 with one occurrence identity and one candidate; incorrect-date rejection, withheld-sibling blocking, other-location protection, replay idempotency and exact rollback. Backend calendar/Home suite: 304 tests across 39 files; final focused approval/eligibility/reminder tests: 45 passing. Backend and Native typechecks clean; Native full suite: 924 passing. Canonical DTO byte parity and content/zero-fabrication validators passed. Translation audit now reports actual 47/61 Hindi/Punjabi coverage rather than falsely labeling it 100%.

The DB CLI dry run uses a private temporary deployment directory containing the actual fetched remote migration history plus exactly the committed publication migration. It lists only 20260930013837 for application, avoiding unrelated pending migrations and avoiding mutation of remote history. The two Pitru historical local files match their stored remote statements. Production version assertion remains required after application. This does not claim unrelated historical migration drift has been reconciled.

Current production resolver is enabled, but the observance-series candidate flag is unset/empty. No global candidate-mode flag is changed by this publication. Existing Pitru legacy reminders retain their local-window schedule and now require explicit festival consent. Calendar publication does not opt anyone into notifications.

## Production publication

20260930013837 was applied through the linked CLI from the isolated history snapshot. Live read-only postcheck confirms 13 newly published dates plus existing Mahalaya, all reviewed/verified/published. The digest of 3,467 unrelated occurrence rows is unchanged: `82b443681db7360d3d333ed81e1a5e1e`. The migration version assertion passes exactly once locally/remotely. Backend implementation d9d40a7 and Native 4d34eee were pushed; backend deploy and production OTA verification follow.

The final reader check requires the selected manual override field to be explicitly null, not silently absent, for the exact concluding approval. This prevents a projection omission from passing the read gate.
