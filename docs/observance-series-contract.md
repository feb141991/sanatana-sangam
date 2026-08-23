# Canonical Observance-Series Read Contract

## Ownership

The backend owns `contracts/observance-series-contract.ts` and the versioned
membership data in `packages/dharma-rules/src/festivals/series.json`. Native
receives a byte-identical generated snapshot. Neither client calculates child
dates or infers membership from names.

## Parent identity decision

No parent table or parent foreign key is added in this phase. A parent series is
derived losslessly from:

- versioned `definitionKey` and definition version;
- civil year of the canonical instance;
- calendar and tradition profiles;
- calculation latitude, longitude and IANA timezone; and
- the individually persisted canonical child occurrence UUIDs.

The parent `seriesKey` hashes those stable dimensions. It is deterministic
across reruns and input ordering, while changing for another year, profile or
calculation location. Child occurrence UUIDs remain the write/observation
identity.

The existing `observance_occurrences.series_instance_key` is deliberately not
reused. That key groups multiple readings of one occurrence instance and
includes a single observance slug plus its baseline anchor. A festival cluster
is a parent over several different slugs, so overloading the column would merge
two separate concepts and make recurring occurrence grouping ambiguous.

## Fail-closed rules

- Required membership is never shortened silently.
- A missing child is represented with `occurrenceId: null`, `status: missing`,
  and an explicit diagnostic; no fake UUID is created.
- Missing, duplicate, unresolved, non-final, profile-mismatched,
  location-mismatched or forbidden cross-year children make the parent
  `under_review`.
- Two children may share one civil date and keep separate UUIDs and routes.
- `currentDay` compares the supplied local spiritual-date string with canonical
  child dates. It never divides milliseconds by 86,400,000.

## Pilot behavior

- Sharad Navratri is a `daily_journey` over its ten canonical tithi children.
- Diwali is a five-child `festival_cluster`.
- Naraka Chaturdashi was council-ratified on 2026-08-23. A Diwali series is
  `complete` only when its canonical Naraka occurrence and the other four
  required child occurrences are all present and final for the same profile
  and calculation location. Missing pre-materialisation data still fails
  closed as `under_review`.
- `season` and `recurring_series` are reserved contract modes. No Jain or
  Buddhist series is activated in this phase.
