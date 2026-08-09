# Named Ekādaśī rules — prompts

Binding: `docs/REVIEW_CHECKLIST.md`, `AGENTS.md` rules 1–15.

**Evidence rule (§2).** Every number you report must be printed by a committed
script runnable with one command. Do not type a date you did not compute. Do not
label your own output as a source. **Do not author a month/pakṣa from your own
knowledge** — LLM output is Tier 6 (source-governance §2). Every value must trace
to `src/lib/vrat-data.ts`, which is content the team wrote, or to a date the user
states in this thread.

**Do not touch `src/lib/panchang.ts`** (§7 X8, on the `verify:harness` import path).

**Guards, before and after every commit:**
- `npm run verify:harness` → **988 passed / 216 skipped**
- `npx vitest run --root packages/panchang-engine` → **104 passed**
- `npm run validate:rules` → passes
- `npx tsc --noEmit` → clean

Movement in any of these is a **STOP**.

---

## Background you need

`src/lib/vrat-data.ts` already holds **24 named ekādaśīs** with complete bilingual
content — significance, practice, mantra, fasting type, pāraṇa window, dos/don'ts,
pūjā items. **None of it needs writing or importing.**

`rules.json` has scheduling for only **one** of them (`vaikunta-ekadashi`), plus
the generic fortnightly `ekadashi`. So 23 named ekādaśīs are content that can
never appear on a date.

**Tithi index scheme:** śukla ekādaśī = **11**, kṛṣṇa ekādaśī = **26**. The generic
rule uses `recurring_tithi_indices: [11, 26]`; a *named* rule is `lunar_tithi` with
a single `lunar_tithi_index`.

**Linkage convention** (from the generic rule): `kind: 'vrat'`,
`verification_type: 'lunar_tithi'`, `route_kind: 'vrat'`, and
`route_slug` = the `vrat-data.ts` key, e.g. `'nirjala-ekadashi'`.

**Why the split below matters.** Amānta ends the month at the new moon,
pūrṇimānta at the full moon, so they label the same **dark** fortnight differently
(pūrṇimānta = amānta + 1). Bright fortnights agree. So a śukla rule's month name
is unambiguous; a kṛṣṇa rule's is not. That is D32, and it is why Shani Jayanti
shipped a month late. `validate:rules` now hard-fails a kṛṣṇa rule that does not
declare `corrected_month_system`.

---

## Task 1 — the 7 śukla ekādaśīs (no ambiguity, do this first)

Each of these states its month in its own `significance` text in `vrat-data.ts`,
and śukla names agree in both systems, so there is nothing to decide.

| route_slug / rule slug | `corrected_lunar_masa_name` | tithi |
|---|---|---|
| `kamada-ekadashi` | Chaitra | 11 |
| `nirjala-ekadashi` | Jyeshtha | 11 |
| `devshayani-ekadashi` | Ashadha | 11 |
| `shravana-putrada-ekadashi` | Shravana | 11 |
| `parivartini-ekadashi` | Bhadrapada | 11 |
| `devutthana-ekadashi` | Kartika | 11 |
| `amalaki-ekadashi` | Phalguna | 11 |

Author one `rule_family: 'lunar_tithi'` rule each. Set
`corrected_month_system: 'amanta'` **explicitly** — not because amānta is
"default", but because for śukla the two are identical and an explicit value is
required by the new guard. Say so in a comment on the PR, not in the JSON.

Also set `lunar_masa_name` (the legacy field). **Do not invent a legacy value.**
The legacy naming is D1-shifted; if you cannot derive it, set it equal to the
corrected name and note in your report that the legacy path will not resolve these
until `USE_CORRECTED_MASA` flips. That is honest and expected — these are new
observances that never existed on the legacy path.

**Verify:** print each rule's 2026/2027/2028 dates from
`calculateObservancesForYearCorrected`. Then check the **interval invariant**:
consecutive ekādaśīs must be ~14–16 days apart, and no two named ekādaśīs may
share a date. Print the sorted 2026 list with gaps. Any gap outside 13–17 days is
a finding, not a rounding detail.

---

## Task 2 — the 9 kṛṣṇa ekādaśīs (needs calibration, do NOT guess)

These state a month but not a system:

`papmochani` Chaitra · `apara` Jyeshtha · `yogini` Ashadha · `kamika` Shravana ·
`aja` Bhadrapada · `rama` Kartika · `utpanna` Margashirsha · `saphala` Pausha ·
`vijaya` Phalguna — all tithi **26**.

**Do not pick a system by pattern-matching to legacy, and do not use your own
knowledge of ekādaśī dates.**

There is a derivable anchor instead. **Kṛṣṇa Janmāṣṭamī 2026 is 4 September**
(confirmed by the user, and the rule is `Shravana` + `amanta`). Janmāṣṭamī is
Śrāvaṇa Kṛṣṇa **Aṣṭamī** (tithi 23); Kāmikā is Śrāvaṇa Kṛṣṇa **Ekādaśī**
(tithi 26) — the *same fortnight*, three tithis later. So:

1. Compute `kamika-ekadashi` under **both** systems for 2026.
2. The correct one must fall **~3 days after 2026-09-04**.
3. Whichever system satisfies that is the convention `vrat-data.ts` was written
   in — because all nine entries came from one content pass.
4. Apply that system to all nine, then **verify each independently** with the
   interval invariant from Task 1. Do not assume step 3 generalises; prove it.

Print the calibration explicitly: both candidate dates for Kāmikā, the Janmāṣṭamī
anchor, the gap in days, and which system won. If **neither** candidate lands 2–4
days after the anchor, **stop and report** — that means the content's convention
is not what this method assumes, and guessing would reintroduce D32.

---

## Task 3 — Kathina is modelled wrong

`kathina` is `rule_family: 'lunar_tithi'`, `Ashwin` tithi 16. The user states the
real 2026 date is **25 October**. Amānta gives 27 Oct, pūrṇimānta 27 Sep —
**neither**, so this is not a month-system problem and must not be "fixed" by
flipping its system.

The user's note says Kathina "traditionally begins immediately following the end
of Vassa". Vassa is already a rule (`vassa-begins-rains-retreat`, confirmed
correct at 2026-07-30, amānta).

Investigate whether Kathina should be `relative_to_other_observance` anchored to
the **end** of Vassa rather than an absolute masa+tithi. Note there is currently
no `vassa-ends` rule — if one is needed, say so rather than hard-coding an offset
from `vassa-begins` that happens to produce 25 Oct in 2026 and nothing else.
**Fitting an offset to a single year is curve-fitting, not modelling.** If you
cannot derive it structurally, leave the rule untouched and report why.

---

## Out of scope

Do not answer these — they need the user:

- The **8 ekādaśīs with no month in their content**: `pausha-putrada`, `shattila`,
  `jaya`, `varuthini`, `mohini`, `indira`, `papankusha`, `vaikunta`. They map onto
  the 8 unfilled slots in the 24-slot cycle, but which goes where is a sourcing
  question.
- **`vaikunta-ekadashi` currently collides with `gita-jayanti`** on Mārgaśīrṣa
  Śukla Ekādaśī (`validate:rules` warns). Gita Jayanti belongs there — it is
  Mokṣadā. Vaikuṇṭha is a Dhanurmāsa observance and probably does not. Leave both
  alone.
- Flipping `USE_CORRECTED_MASA` or `USE_CONDITION_EVALUATOR`.

---

## Report

Per task: what changed, the command that proves it, its output. Then the four
guards. Then REVIEW_CHECKLIST §5 — for each §3 heading, clear / finding /
not-applicable-because. **Silence is not an answer.**

Call out explicitly:
- the Kāmikā calibration and its arithmetic,
- the full 2026 ekādaśī list with day-gaps,
- any rule where the corrected path resolves but the legacy path does not, and
  why that is expected.
