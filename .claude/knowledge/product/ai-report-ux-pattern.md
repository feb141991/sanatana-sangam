# AI Report Button — UX Pattern and Threading

**Date:** 2026-06-06
**Session context:** Adding "Report AI response" feature to Dharma Mitra AI chat
**Category:** product

## What we decided

The report affordance is an inline dropdown attached to the AI message row — not a modal, not a
portal. After a successful submission the button disappears permanently (local state only). The
preceding user message is retrieved at render time by walking backwards through the `messages`
array — no additional state.

## Why

### Inline dropdown over modal

A modal for a low-stakes moderation action introduces unnecessary friction and visual weight.
The report action is secondary — it should be available but not prominent. An inline dropdown
keeps the user in context and dismisses naturally on outside-click, matching the pattern users
expect from social content flagging (Twitter, Reddit, etc.).

A portal was considered to avoid z-index/overflow clipping issues but rejected: the extra
complexity is not justified given the app's layout. The message row's stacking context is
controllable.

### Permanent hide after success (local state only)

Reading the DB after submit to check report status would cost a round-trip per message render
and complicate the component contract. Since a user reporting the same AI message twice is not
a meaningful scenario, local hide-after-submit is sufficient. The state does not survive a page
refresh — that is acceptable.

Double-submit is prevented by disabling the submit button on first click, not by a DB uniqueness
constraint (which would surface as an error rather than a graceful no-op).

### Success copy

"Thanks — this helps us improve Dharma Mitra." — frames the report as a contribution to product
quality, not as a complaint. Reduces the punitive feel of a report action.

## prevUserText threading

Both the FAB (floating assistant button) and the full AI chat page find the preceding user
message by walking backwards through the `messages` array at render time. No additional state
slice, no ref, no effect. The pattern is: for each AI message at index `i`, scan `messages[i-1]`
downward until a `role === 'user'` message is found.

This is intentionally stateless. If the message array grows large enough that this scan is
measurable, the right fix is memoization at the list level — not a new state field.

## Constraints this creates

- The report button lives in `src/components/ai/AiReportButton.tsx` and owns its own open/
  submitted state. Do not hoist this state to the parent chat client.
- `prevUserText` must be passed as a prop by the parent — the button itself has no access to
  the full message array.
- The success state is UI-only. If moderation tooling ever needs deduplication, add a DB
  unique constraint at that point rather than preemptively.

## What we explicitly rejected

- **Modal for report reasons** — too heavy for a secondary moderation action.
- **Portal rendering** — unnecessary complexity; inline dropdown is sufficient.
- **DB read to restore submitted state on remount** — over-engineering for a low-frequency action.
- **Additional state for prevUserText** — array walk at render time is simpler and correct.

---
