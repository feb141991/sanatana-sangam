# Ekadashi rule coverage audit

Verdict: gaps found; this is not a date-correctness or religious-approval certificate. No production rule, date or publication status changed.

## Reproduce

Run `npx tsx scripts/audit-ekadashi-coverage.ts` for the default finite annual sweep. Then run `npx tsx scripts/audit-ekadashi-coverage.ts --summarize`. Add `--database-only --out=docs/audits/ekadashi-coverage/database.json` for SELECT-only stored-row evidence and `--spot-check` for the TTD convention comparison. A default coverage.json takes precedence; otherwise saved sweep shards are combined. Archive old evidence before starting a different sweep.

## Coverage

Completed 11/11 requested year/location cases. Input files changed during runs: none detected among fingerprinted inputs. Local current checkout, including recorded parallel edits, was audited; this does not identify the deployed server commit.

Catalogue: 24 named slugs / 25 named rule rows. Additional standalone slugs absent: padmini-ekadashi, parama-ekadashi, mokshada-ekadashi. Mokshada is currently an alias of Vaikunta; it must not simply be counted as an absent regular fortnight.

| Year | Location | Generic handler baseline | Generic final output | Generic review items | Named/variant instances silently absent |
|---|---|---:|---:|---:|---:|
| 2025 | ujjain | 25 | 25 | 0 | 2 |
| 2026 | ujjain | 24 | 23 | 1 | 0 |
| 2027 | ujjain | 25 | 24 | 1 | 2 |
| 2028 | ujjain | 25 | 25 | 0 | 2 |
| 2029 | ujjain | 25 | 24 | 1 | 1 |
| 2030 | ujjain | 24 | 24 | 0 | 1 |
| 2031 | ujjain | 25 | 25 | 0 | 1 |
| 2032 | ujjain | 25 | 25 | 0 | 2 |
| 2033 | ujjain | 24 | 23 | 1 | 1 |
| 2034 | ujjain | 25 | 25 | 0 | 1 |
| 2035 | ujjain | 25 | 23 | 2 | 2 |

## Findings

### Parallel uncommitted cache changes tithi across identical requests

At 2026-11-20T01:59:00.000Z, warm-cache tithi=10 versus cold-cache tithi=11; disagreement=true. Reproduce with `--cache-check`; cache-check.json records source fingerprints. The optional precomputed-grid.ts rounds instants into time buckets, allowing reuse across a tithi transition. This was observed in the uncommitted working tree, not asserted to be deployed. No parallel file was changed. Audited dates are current-code observations, not certified dates.

### Named occurrences collapse inside a civil year

The annual engine selects one first/last candidate for non-recurring lunar_tithi rules. A named Ekadashi can occur in separate lunar cycles near both ends of the same Gregorian year. Consecutive daily hits are grouped as one instance by this audit, so a two-sunrise tithi is not falsely counted twice. Missing instances with an explicit review item for that exact variant are reported separately in namedReviewHeldInstances; the missing-instance list below counts only those without that review item. Counts are per rule/variant, not unique civil dates. Preserve distinct lunar-cycle instances; do not fix by selecting a different single date.

### Smarta Yogini disappears at evaluator dispatch

materialize.ts removes baseline occurrences by slug if any evaluator exists for that slug. Yogini's evaluator defines only vaishnava_vidhava; its existing Smarta baseline variant is therefore removed too. Disputed-year withholding is intentional and reported separately, not treated as a silent loss.

### Intercalary names are absent

Padmini and Parama have no dedicated rules, definitions or dedicated app content found. The generic rule declares adhika_policy=both, so this is partly a naming/content gap, not evidence that every extra-month date disappears. Some generic occurrences are independently held for review. Review and add the sourced rules and their content; do not remove the nija guard on regular names.

- 2026 / ujjain: 2026-05-26, 2026-06-11 (generic baseline dates, not newly approved Padmini/Parama dates).
- 2029 / ujjain: 2029-03-26, 2029-04-09 (generic baseline dates, not newly approved Padmini/Parama dates).
- 2031 / ujjain: 2031-08-29, 2031-09-12 (generic baseline dates, not newly approved Padmini/Parama dates).
- 2034 / ujjain: 2034-06-27, 2034-07-12 (generic baseline dates, not newly approved Padmini/Parama dates).

### Named and generic results diverge

The generic sunrise evaluator can withhold a repeated sunrise tithi or lose an instance absent from its baseline. Named skipped-tithi policies differ (Devutthana has an explicit Smarta previous-day policy). These are not automatically erroneous dates: distinguish a legitimate documented variant, deliberate review hold, and an unhandled candidate.

- 2026 / ujjain / devutthana-ekadashi: named output 2026-11-20 absent from generic published output.
- 2027 / ujjain / vijaya-ekadashi: named output 2027-03-04 absent from generic published output.
- 2029 / ujjain / papankusha-ekadashi: named output 2029-10-17 absent from generic published output.
- 2033 / ujjain / mohini-ekadashi: named output 2033-05-09 absent from generic published output.
- 2035 / ujjain / devshayani-ekadashi: named output 2035-07-15 absent from generic published output.
- 2035 / ujjain / shattila-ekadashi: named output 2035-02-03 absent from generic published output.

### Vaikunta / Mokshada regional distinction is not represented

The only Vaikunta rule is Margashirsha Shukla in amanta and the content aliases Mokshada to it. TTD's primary announcement uses Shukla Ekadashi in Dhanurmasa. The separate ttd-spot-check.json records a source day and the declared-month mismatch at Tirumala. The single-day sunrise tithi predicate does not test all skipped-tithi policies and is not a full-year/date-accuracy verdict. A reviewed regional/solar-month variant is required; do not replace one universal date with another.

### All tradition exceptions and Parana are not implemented

Most named rules share a sunrise model and do not have independent Smarta/Vaishnava variants. Stored tradition_profiles has ekadashi_method and paran_rule, but the inspected calendar evaluator path has no complete Mahadvadashi classifier or computed Parana/Hari Vasara policy implementation. Storing a policy name and displaying general fasting advice does not establish these capabilities.

## Full missing named-instance evidence

- 2025 / ujjain / yogini-ekadashi::smarta: handler instances 2025-06-21 absent from output; retained output none.
- 2025 / ujjain / pausha-putrada-ekadashi: handler instances 2025-12-31 absent from output; retained output 2025-01-10.
- 2027 / ujjain / saphala-ekadashi: handler instances 2027-12-23 absent from output; retained output 2027-01-03.
- 2027 / ujjain / yogini-ekadashi::smarta: handler instances 2027-06-30 absent from output; retained output none.
- 2028 / ujjain / yogini-ekadashi::smarta: handler instances 2028-06-18 absent from output; retained output none.
- 2028 / ujjain / pausha-putrada-ekadashi: handler instances 2028-12-27 absent from output; retained output 2028-01-08.
- 2029 / ujjain / yogini-ekadashi::smarta: handler instances 2029-07-07 absent from output; retained output none.
- 2030 / ujjain / yogini-ekadashi::smarta: handler instances 2030-06-26 absent from output; retained output none.
- 2031 / ujjain / yogini-ekadashi::smarta: handler instances 2031-06-15 absent from output; retained output none.
- 2032 / ujjain / saphala-ekadashi: handler instances 2032-12-28 absent from output; retained output 2032-01-09.
- 2032 / ujjain / yogini-ekadashi::smarta: handler instances 2032-07-03 absent from output; retained output none.
- 2033 / ujjain / yogini-ekadashi::smarta: handler instances 2033-06-23 absent from output; retained output none.
- 2034 / ujjain / yogini-ekadashi::smarta: handler instances 2034-06-12 absent from output; retained output none.
- 2035 / ujjain / saphala-ekadashi: handler instances 2035-12-25 absent from output; retained output 2035-01-05.
- 2035 / ujjain / yogini-ekadashi::smarta: handler instances 2035-07-02 absent from output; retained output none.

## Stored rows and independent fixtures

Read database.json: its summary records exact years, distinct slugs and absent named rows; raw rows retain profile, variant, location and publication status. Future-year absence alone is not a user-visible failure because resolve-occurrences.ts materializes missing year/profile/location buckets lazily. Stored rows and approved fixtures are independent of this local calculation and can be stale or incomplete. Credential/project discovery through the connector returned no projects; SELECT-only checks used the repo's existing local credentials without printing them. No calendar API was called because a read can lazily write rows.

## Sources (manual convention checks, no bulk calendar import)

- Padmini/Parama names: https://www.iskconportland.com/ekadashi_calendar (named entries only; dates were not copied into rules).
- TTD convention and source event: https://news.tirumala.org/govinda-govinda-chant-rocks-tirumala/ (location/date/coordinates in ttd-spot-check.json).
- Mahadvadashi and Parana examples: https://www.iskconbangalore.org/vaishnava-calendar/ and https://www.iskconbangalore.org/wp-content/uploads/2025/03/Vaishnava-Calendar_BLR_2025_26.xlsx.pdf .

## REVIEW_CHECKLIST sign-off

- Cardinality: FINDING — distinct named instances collapse.
- Detection capability: audit unit tests distinguish two annual instances, consecutive scans and legacy-default rule identities; internal path comparison cannot validate shared astronomy errors.
- Both directions: matching/nonmatching variant identities, retained/dropped instances and empty candidates covered by audit tests.
- Detection versus behaviour: FINDING — adhika detection does not provide Padmini/Parama rules; profile fields do not supply complete fasting exceptions.
- Boundaries: annual year-end instances checked. Leap and extra-month years are included where present in the saved matrix. Full polar, international-date-line and diaspora/DST matrices were not run.
- Units/frames: existing engine adapters used; location and IANA timezone kept paired. No new astronomy, frame conversions or tithi solver. Absolute astronomy accuracy not independently validated here.
- Compensation: regular-name adhika exclusions, deliberate publication withholding and first/last selection were preserved, not silently relaxed.
- Reproducibility: commands and JSON evidence retained; runtime stdout and generated tables derive from computed results.
- Scope honesty: audit script/tests and this evidence directory only. Parallel app/panchang edits were preserved. No calendar dates, policies, fixtures or publication statuses changed. No new branch or deployment.
- Cross-engine consistency: FINDING — generic/named production paths compared; independent TTD convention spot-check retained; full external date validation across every year remains unverified.

## Limits

This finite reference-location sweep cannot certify every year, tradition or city. No date is approved by this audit. Deliberate review items are not asserted to be silent omissions; all raw candidate and output arrays are retained in sweep JSON. Third-party content or LLM output did not set a source tier, reviewed status or published date.
