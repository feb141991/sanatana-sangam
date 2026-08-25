# Multi-day series expansion readiness (Prompt 5 gap report)

> Superseded by the "Prompt 5 Expansion Catalogue" section in
> `shoonaya-mobile/docs/ANTIGRAVITY_MULTIDAY_OBSERVANCE_SERIES_PROMPTS.md`
> (2026-08-24), which uses the exact table format Prompt 5 specifies. Kept
> here as an earlier-pass reference; the mobile-repo doc is authoritative.

Generated 2026-08-24, read-only — no new dates, prose, or series definitions
were written for this pass. Machine-derived from `packages/dharma-rules/src/
festivals/{rules,series,series-content}.json`.

Only two series definitions exist today: `sharad-navratri`,
`diwali-five-days`. Every festival below is a **candidate**, not yet wired
into `series.json`/`series-content.json`.

| Candidate | Rule entry | Evaluator (`launch_status`) | Source note | Series def | Content (series-content.json) | Notification/UI gate |
|---|---|---|---|---|---|---|
| Chaitra Navratri | `chaitra-navratri-begins` | **deferred** | present, source-referenced | missing | missing | Deferred rule → no occurrence rows → no notification, no card |
| Gupt Navratri | `gupt-navratri-magha-begins`, `gupt-navratri-ashadha-begins` | **deferred** (both) | **missing** (no ratification_note) | missing | missing | Same — plus needs sourcing before any rule work |
| Chhath | `chhath-puja` | **deferred** | present, source-referenced | missing | missing | Deferred → no occurrence rows |
| Ganeshotsav | `ganesh-chaturthi` | included | present, source-referenced | missing | missing | Single-day rule already live and notifiable today; a 10-11 day *Ganeshotsav* series (Chaturthi → Anant Chaturdashi) does not exist as a definition |
| Pitru Paksha | **no rule entry at all** | n/a | n/a | missing | missing | Blocked at the source/rule-authoring stage, before series work is relevant |
| Holi | `holi` | included | present, but **flags an open content question** (Holika Dahan vs Rangwali Holi day — see `ratification_note`) | missing | missing | Single occurrence live; a 2-day Holika Dahan + Rangwali series needs the open dispute resolved first |
| Shravan Somvar | `shravan-somvar` | **deferred** | **missing** | missing | missing | Recurring weekly vrat, not a natural "series" shape — would need product framing, not just sourcing |
| Mangala Gauri | `mangala-gauri-vrat` | **deferred** | **missing** | missing | missing | Same as Shravan Somvar |
| Hola Mohalla | **no rule entry at all** | n/a | n/a | missing | missing | Sikh calendar — needs its own source track (SGPC), flagged as a known gap earlier this session too |
| Vassa | `vassa-begins-rains-retreat` (deferred, sourced), `pavarana-end-of-vassa` (deferred, **unsourced**) | **deferred** (both) | mixed | missing | missing | Both ends of a real 3-month Buddhist observance exist as rule stubs but neither is evaluator-included; end date is unsourced |
| Losar | `losar-tibetan-new-year` | **deferred** | **missing** | missing | missing | Single-day per rule name, not obviously multi-day; needs sourcing regardless |
| Paryushana | `paryushana-parva-begins`, `samvatsari-paryushana-ends` | **included** (both) | present, source-referenced (both) | missing | missing | Best-positioned candidate — both bookends are live, reviewed, and sourced today; only the series *definition* + editorial content is missing |
| Das Lakshana | `das-lakshana-dharma-begins` | **deferred** | **missing** | missing | missing | Digambara Jain 10-day observance; needs both sourcing and an end-date rule (only a "begins" rule exists) |

## Reading this table

- **Best next candidate for a real series definition**: Paryushana — both
  `paryushana-parva-begins` and `samvatsari-paryushana-ends` are already
  `launch_status: included` with source-referenced `ratification_note`s. This
  is the only candidate where the source/evaluator gates are already clear;
  only the `series.json` definition + `series-content.json` editorial rows
  are missing.
- **Second candidate**: Ganeshotsav — the single `ganesh-chaturthi` rule is
  live, but the multi-day festival (through Anant Chaturdashi) has no
  begin/end rule pair at all yet, unlike Paryushana. Needs rule authoring
  before it needs series authoring.
- **Blocked at the rule/source stage, not the series stage**: Chaitra
  Navratri, Chhath, Vassa (partially) — rules exist and are at least partly
  sourced but are `deferred`, meaning no occurrence rows materialize for them
  today regardless of any series work.
- **Blocked at the source stage entirely**: Gupt Navratri, Shravan Somvar,
  Mangala Gauri, Losar, Das Lakshana — no `ratification_note` at all.
- **Blocked before the rule stage**: Pitru Paksha, Hola Mohalla — no rule
  entry exists in `rules.json` yet.
- **Blocked by an open content dispute, not missing data**: Holi — sourced
  and included, but the rule's own note flags that "Holi" may mean either
  Holika Dahan or the following color day, which a 2-day series would need
  resolved first (a human/council call, not something this pass should
  settle).

No series definitions, source citations, or rule changes were written as
part of this report — per Prompt 5's "Expansion report, not implementation"
scope.
