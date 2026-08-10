# Calendar Launch Governance

**Date:** 2026-08-10  
**Session context:** Narrowing the calendar release while scholarly decisions remain open  
**Category:** decision

## What we decided

Shoonaya launches with `global_sanatan` as its neutral calendar profile and
`unspecified` as its neutral tradition profile. Unresolved dates are withheld,
recognised disagreements remain multi-variant, unratified regional profiles do
not control calculation, and the corrected-māsa and condition-evaluator gates
remain disabled. Kathina and Pāvāraṇā remain outside the launch calendar.

## Why

Engineering can establish astronomy and produce candidates, but it cannot
ratify tradition-dependent `[S]` choices. A narrow launch prevents an
unreviewed regional or sampradāya assumption from being presented as a
universal religious date while preserving the data needed to activate richer
profiles later.

## Constraints this creates

- `unspecified` may calculate like Smārta but must never be labelled Smārta.
- An unresolved result has no public date and must reach the review queue.
- A real tradition dispute publishes variants; profile resolution happens at
  read time.
- Regional preference may be stored but cannot affect calculation until its
  scholarly status is ratified and its rollout is explicitly approved.
- Deferred or non-derivable rules cannot appear in council date-change packets.

## What we explicitly rejected

- Treating `legacy-ujjain` as the user's neutral product identity.
- Silently choosing one candidate when the evaluator is ambiguous.
- Enabling all seeded regional profiles merely because their schema exists.
- Publishing India-derived substitutes for Theravāda observances.

---
