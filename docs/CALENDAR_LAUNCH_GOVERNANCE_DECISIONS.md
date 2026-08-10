# Calendar launch governance decisions

**Decision date:** 2026-08-10  
**Decision owner:** Shoonaya product owner  
**Scope:** Launch policy only. This record does not ratify any `[S]` rule,
calendar-profile assignment, or religious interpretation.

## Approved launch policy

1. The neutral launch calendar profile is `global_sanatan`.
2. A user without a selected sampradāya is `unspecified`. It may use the Smārta
   calculation method as a fallback, but the UI must not label the user Smārta.
3. An unresolved result publishes no date. It goes to
   `observance_review_queue`; the product never silently chooses a candidate.
4. When recognised traditions genuinely disagree, all cited variants remain
   available. Exactly one is primary at read time, selected from the user's
   profile rather than baked into the occurrence row.
5. Kathina and Pāvāraṇā are excluded from the launch calendar. Pāvāraṇā
   requires a supported Theravāda calendar profile; Kathina requires an
   externally curated monastery/community date.
6. Unratified regional calendar profiles may be collected as user preference,
   but they do not control calculation or publication at launch.
7. `USE_CORRECTED_MASA` and `USE_CONDITION_EVALUATOR` remain disabled until the
   launch-visible date changes and `[S]` methods have completed review.

## What this decision does not approve

- Amānta/pūrṇimānta assignment for any pending regional or festival rule.
- Smārta/Vaiṣṇava Ekādaśī, paran, or Janmāṣṭamī methods.
- Pradosha, adhika-māsa, kṣaya-māsa, solar-month, Nanakshahi, or era policy.
- Any changed Gregorian observance date.

Those remain `[S]` decisions under `docs/source-governance.md` and require a
named reviewer, applicable profile, source citation, effective version, and an
approve/reject/disputed/unsure outcome.

## Enforcement already present

- `launch_status` separates launch inclusion from derivability.
- `isPublishable()` suppresses deferred and non-derivable rules before an
  occurrence can reach calendar APIs, materialisation, or notifications.
- `observance_review_queue` stores unresolved candidates and reasoning.
- `formatOccurrencesToResults()` selects a primary variant at read time.

The council packet must contain only launch-included, computable rules. It must
not present a deferred or non-derivable item as a candidate publication date.
