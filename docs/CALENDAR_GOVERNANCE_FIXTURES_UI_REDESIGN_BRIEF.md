# Calendar Governance — Fixtures Review UI Redesign Brief

Handoff prompt for fixing the golden-fixture review card UI's state
legibility. Grounded in the actual component (file/line numbers below);
paste the "Prompt" section into a session with edit access to this repo.

## Problem

`FixtureCard` (`src/app/admin/calendar-governance/page.tsx:1059`) gives
almost no visual signal that a fixture has been reviewed. The only
indicator is a small pill next to the title:

```tsx
{fixture.approved && <span className="px-2 py-0.5 rounded-full
  bg-emerald-500/10 text-emerald-600 text-[10px] font-bold
  uppercase">Approved</span>}
```

Meanwhile the Approve button (line 1100) is only ever disabled by
`busy || !real` — never by `fixture.approved` — so after a fixture is
approved, the Approve/Reject buttons stay exactly as bright, clickable,
and visually "unactioned" as before. A reviewer glancing at the page
cannot tell approved cards from pending ones without reading the small
badge text on every card. This was flagged directly by a reviewer looking
at real data on 2026-08-19: three cards for the same
festival/year/location (differing only by month-system profile) with two
approved and one pending were initially mistaken for a rendering bug,
because nothing but the small badge distinguished them.

## Prompt

```
Redesign the golden-fixture review card UI in the Calendar Governance admin
page for at-a-glance state legibility. File:
src/app/admin/calendar-governance/page.tsx

Root problem: FixtureCard (line 1059) gives almost no visual signal that a
fixture has been reviewed. The only indicator is a small pill next to the
title:
  {fixture.approved && <span className="px-2 py-0.5 rounded-full
    bg-emerald-500/10 text-emerald-600 text-[10px] font-bold
    uppercase">Approved</span>}
Meanwhile the Approve button (line 1100) is only ever disabled by
`busy || !real` -- never by `fixture.approved` -- so after a fixture is
approved, the Approve/Reject buttons stay exactly as bright, clickable, and
visually "unactioned" as before. A reviewer glancing at the page cannot tell
approved cards from pending ones without reading the small badge text on
every card.

Fix, in priority order:

1. Card-level state, not badge-level state. The entire card container
   (currently `glass-panel rounded-[1.75rem] border p-5 space-y-3`, with
   `border-black/5 bg-white/40` for real / `border-amber-500/20
   bg-amber-500/[0.03]` for stub) should visually shift on approval --
   e.g. a solid emerald left border/accent bar, dimmed/receded background,
   or a translucent checkmark watermark -- something visible in peripheral
   vision while scrolling, not just readable on close inspection.

2. Disable + relabel the action buttons once approved. When
   fixture.approved is true:
   - Approve button becomes disabled, relabels to "Approved" with a solid
     (not outline) checkmark, and stops using the same hover-to-solid
     transition styling as the actionable state (currently
     `bg-emerald-500/10 text-emerald-600 ... hover:bg-emerald-500
     hover:text-white` -- that hover affordance implies it's still
     clickable/awaiting action).
   - Reject stays enabled (an approved fixture can still be un-approved)
     but should be visually secondary once approved -- e.g. shrink to an
     icon-only "undo/reject" control instead of a full labeled button,
     so it doesn't compete with the "this is done" read of the card.

3. Scannable list/grid density. Currently every card (line 1059) renders
   full VerifyPanel detail (ENGINE COMPUTES / CITATION STATES side-by-side
   block, line 1153) even when already approved and long since verified.
   Collapse approved cards to a single compact row by default (title,
   badge/accent, reviewer + date, expand affordance) and reserve the full
   engine/citation comparison panel for pending cards, where a reviewer
   actually needs to look closely to make a decision. This directly serves
   the review workload: 214 of 297 sourced fixture rows are currently
   unapproved, spread across 23 partially-approved rules and 8 fully
   unapproved rules -- reviewers need pending cards to dominate visual
   weight, not be buried among already-cleared ones.

4. Tab counts should reflect the true remaining work at a glance. The
   existing FilterPill tabs (line 828, sourceFilter state 'real' | 'stub' |
   'approved' | 'all', counts computed at line 668-673) are good but
   "Sourced (31)" doesn't tell a reviewer how many of those 31 still need
   action. Add a "Needs review" count/tab (sourced AND NOT approved) as
   the default landing tab, since that's the actual queue, not "all
   sourced regardless of status."

5. Same-rule variant grouping. Multiple fixture rows for the same
   festival_id/year/location often differ only by profile (e.g.
   gujarati_amanta vs north_indian_purnimanta) and can end up in a mixed
   approved/pending state that's easy to misread as a duplicate or a bug
   (this happened in practice -- a reviewer saw three cards for the same
   festival/date and asked whether the UI was broken). Group these
   visually under one collapsible header per (festival_id, year,
   location) so a reviewer sees "2 of 3 profile variants approved" as one
   glance instead of three separately-scannable cards.

Keep the existing color vocabulary (emerald = approved/positive, rose =
reject/negative, amber = unsourced stub) -- don't introduce a new palette,
just make the existing states actually visually distinct at rest, not
only on hover or close reading. Don't touch the underlying data model
(GoldenFixtureRow.approved/.reviewed_by/.reviewed_at/.review_notes/
.expected/.engineHint/.source) or the API route
(src/app/api/admin/calendar-governance/fixtures/route.ts) -- this is a
presentation-layer fix only.
```

## Related code (for context, not part of the prompt)

- Page/section: `src/app/admin/calendar-governance/page.tsx` (1531 lines)
  - `FixturesSection` — line 575 (filter/tab state, counts, fetch, approve/reject/save handlers)
  - `CategoryRail` — line 494 (left rail, built from `buildCategoryStats`, line 463)
  - `FixtureCard` — line 1059
  - `VerifyPanel` — line 1153 (ENGINE COMPUTES / CITATION STATES comparison)
  - `FilterPill` — line 1508
- API: `src/app/api/admin/calendar-governance/fixtures/route.ts`
- Domain logic: `src/lib/calendar/approved-fixture-governance.ts`, `src/lib/calendar/fixture-engine-hint.ts`

## Note

As of 2026-08-19, `src/app/admin/calendar-governance/page.tsx` has an
unrelated, large uncommitted diff (300+/-82) already in progress locally.
Whoever picks up this brief should check `git status`/`git diff` on that
file first and coordinate rather than blindly overwriting it.
