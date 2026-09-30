# Pitru Paksha — Scoped Human Approval and Complete-Series Eligibility

**Date:** 2026-09-30  
**Session context:** Publishing the source-approved 2026 civil remembrance journey and correcting shared readers and reminder eligibility  
**Category:** decision

## What we decided

The founder's explicit source approval covers the 13 withheld 2026 `legacy-ujjain` journey rows, together with the already approved Mahalaya Amavasya as Day 14, for September 27–October 10. Day numbers describe civil remembrance-journey positions; this approval does not establish 14 Shraddha tithis, Ujjain ritual timings, or universal dates for other locations. Backend owns the canonical occurrence and editorial contracts; Native consumes generated snapshots, and this work introduces no new PWA frontend development.

## Why

Human approval must identify its actual authority and scope. `reviewed_editorial` with `reviewRef: founder:pitru-paksha-2026-20260930` truthfully records founder approval without implying the council review represented by `council_reviewed_editorial`. The London regional source corroborates the civil range only; neither that corroboration nor engineering tests ratifies a broader ritual timetable.

A day or forward-window query cannot prove a series complete: an earlier withheld or missing sibling still invalidates eligibility. Competing legacy and candidate senders can duplicate reminders, while unchecked consent or mismatched calculation coordinates/timezone can make an otherwise reviewed reminder inappropriate.

## Constraints this creates

- Limit publication to the exact 2026 `legacy-ujjain`, `legacy-default`, null spiritual-tradition context at Ujjain coordinates 23.1765/75.7885 and `Asia/Kolkata`. Preserve Mahalaya's existing date, approvals, lock and audit notes; no other year, profile, location or disputed row inherits this approval.
- Keep founder-reviewed editorial distinct from council-reviewed editorial. Both require a durable human review reference; unsupported sacred text, ritual claims and translations retain their existing withholding/fallback rules.
- Every reader that decides series completeness must fetch the full sibling family before evaluating eligibility, including Home/upcoming readers and reminder producers. A current-day or date-window slice is insufficient.
- At candidate cutover, exactly one owner delivers Pitru notifications. Both modes respect festival consent and deleting-account state; calculation uses a coherent GPS plus IANA-timezone context or a coherent reference fallback, separately from the user's delivery timezone.
- Publication migration `20260930013837` is file-backed, guards exact row count, dates, context and prior states, and captures the before-state for scoped rollback. Historical applied files align with verified remote statements under `20260930013151` and `20260930013332`; preserve those statements rather than replaying or rewriting them over reviewed data.

## What we explicitly rejected

- Calling founder approval council ratification or treating civil journey labels as Shraddha tithi names.
- Extending London range corroboration into universal location dates or ritual-time authority.
- Proving completeness from only visible children, allowing two delivery owners, or combining reference coordinates with an unrelated calculation timezone.

## Release checkpoint

At capture, tests and release are pending. Source changes, historical migration-version alignment and human approval do not prove application of the new publication migration, deployment, installed Native updates or physical-device push delivery. Record that evidence separately in [the publication review](../../../docs/reviews/PITRU_PAKSHA_2026_PUBLICATION.md).

---
