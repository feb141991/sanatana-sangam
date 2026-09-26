# Profile-aware calculation contract — review decision (2026-09-26)

**Status: implementation deferred.** The proposed `profile_differentiated` database
column and API field are intentionally not part of this change. They would claim
that a date was calculated for a calendar profile even though the current engine
entry point does not receive a profile and the materializer currently stamps the
requested profile onto profile-agnostic engine output.

## Verified current contract

- `resolveRequestProfile` resolves a user's profile and the calendar routes query
  occurrence rows using that profile.
- `calculateObservancesForYear(year, location)` accepts no calendar profile.
  `ensureYearMaterialized` calls it and stores the caller's profile on the result.
- Rule-level `corrected_month_system` and tradition variants exist, but the
  engine does not generally select rule content by `calendar_profile`.
- Therefore, a lookup that merely finds a `calendar_profile` value on a rule is
  not proof that the rule drove the computed date. Adding a boolean based on that
  lookup would create a false assurance signal if such a rule were added later.
- No row among the 189 cross-profile-withheld occurrences is approved for
  restoration by this audit. The 185 same-location matches show only that today's
  profile-agnostic engine reproduces those dates; they do not validate the dates
  for the stored profile. All 189 remain withheld.

## Required design before profile-aware date publication

1. Make profile and tradition explicit inputs to a single canonical calculation
   path. Rule selection must be part of the calculation, not a post-calculation
   label or metadata lookup.
2. Define precedence and fallback behavior for profile-specific, tradition-
   specific, and general rules. If a profile-required rule cannot resolve, return
   an unresolved result; do not silently fall back to a general date as verified.
3. Preserve location and IANA timezone as paired calculation inputs. A profile
   must never be inferred from GPS.
4. Persist calculation provenance sufficient to reproduce the result: selected
   rule identity/version, profile, tradition, location/timezone, engine version,
   and source/rule approval metadata. Keep calculated date, source-backed rule
   approval, and human/council ratification as separate concepts.
5. Add sourced golden cases for each profile-sensitive rule and verify both the
   selected and rejected rule paths. Engineering may implement the contract but
   may not invent citations or ratify tradition-specific decisions.
6. Only after those tests pass should an API disclosure field or confidence
   policy be designed. Its semantics must describe what the engine actually did,
   and Native consumers must be audited before changing the shared DTO.

## Current 189-row reconciliation

The committed reproduction script compares each stored occurrence with the
current engine at its stored location. It is useful evidence about reproduction,
not profile correctness or external-source correctness. The earlier proposal to
use a `profile_differentiated` lookup as a restoration gate is rejected. No
restore migration is prepared. A future restoration decision requires a
profile-aware calculation and independent source/rule approval for each row.

The separate provenance-label correction for 47 rows is still reviewable on its
own: it changes only `final_date_source` from `legacy_seed` to
`calculation_engine` for rows whose recorded writer/version show they were
lazily calculated. It also writes a rollback marker and refreshes `updated_at`.
It does not alter their dates or publication state, and it must pass a shadow
test plus a fresh read-only count check before any environment applies it.
