# Calendar Window Measurement — Batches 1–4

> Computed, read-only output. No rule, source, date, database, publication, or production data was changed.

This run used the isolated HEAD worktree at d39edb9: **127 rules** and **5 reference-time fields**. The dirty working tree’s claimed 125/16 state was not imported because the phase explicitly requires measurement from a separate HEAD worktree.

| Window measurement / provenance result | Rule count |
|---|---:|
| window-insensitive | 46 |
| sensitive-ratified-convention | 9 |
| needs-authority-decision | 23 |
| not-applicable | 15 |

| Window sensitivity only | Rule count |
|---|---:|
| insensitive | 46 |
| sensitive | 32 |
| not-applicable | 15 |

The JSONL contains **1395** incremental rows: one per selected rule/year/location. Candidate periods were sunrise, madhyahna, aparahna, pradosha (engine default 72 minutes), nishita, moonrise, and arunodaya.

## Batch scope

- Batch 1: 24 named Ekadashi slugs / 25 rows, with generic `ekadashi` treated as the evaluator control.
- Batch 2: Raksha Bandhan, Guru Purnima, Chhath Puja, Chaitra/Navratri spans, Nag Panchami, Hartalika Teej, and Narasimha Jayanti.
- Batch 3: remaining included lunar/nakshatra/weekday rules without evaluator or reference-time declarations.
- Batch 4: deferred rules in the same scope, measured without publication.

## Interpretation

The report keeps two independent dimensions. `windowSensitivity` answers whether the applicable candidates disagree, while `provenanceStatuses` answers whether the rule has a source/review record. A rule can be window-insensitive and still unsourced; it must not be treated as approved. A sensitive rule with a ratified convention in its notes is ready for a separate `window_source` object, not automatically ready for a date change. Unsupported regional, relation, solar, and weekday bases are marked `not-applicable` for tithi-window measurement and retain their separate provenance status.

Raksha Bandhan includes computed Vishti/Bhadra spans and overlap minutes by candidate period. No Bhadra policy or fallback was selected.

For each rule, `all-batches.json` reports the number of disagreeing years and locations, applicable candidate periods, candidate pairs, and maximum civil-day difference. Those fields separate within-location window differences from location-driven differences.

## Not verified

- No external page was opened in this session; Tier-1 candidates remain names only.
- No window was written into `rules.json`; no source reference was attached to a rule.
- No production reads or writes occurred.
- Dashami-viddha, parana, sampradaya-specific Ekadashi selection, and institutional/regional conventions remain unresolved unless explicitly represented in the computed metadata.

Detailed rows: `all-batches.jsonl` and `all-batches.json`. Batch 1’s prior detailed artifacts remain alongside these files.
