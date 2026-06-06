# Shoonaya Antigravity Workflow

Antigravity should use this file as its project operating guide.

Before making changes, read:

1. `SHOONAYA_WORKFLOW.md`
2. `SHOONAYA_RULES.md`
3. Relevant `.claude/agents/*.md` role files
4. The files being changed

## Working Rule

Make small, scoped edits. Treat every change as a regression risk until checked.

Before editing, state:

- What will change
- What must remain untouched
- Which Shoonaya invariants apply

After editing, state:

- Files changed
- Checks run
- Checks blocked
- Remaining risk

## Role Checklists

If Antigravity cannot invoke Claude agents directly, manually apply the matching role checklist from `.claude/agents/`.

Use:

- `shoonaya-qa-test-engineer.md` for regression review
- `shoonaya-ui-ux-design-reviewer.md` for UI review
- `shoonaya-supabase-backend-engineer.md` for API, cron, auth, RLS, and migrations
- `shoonaya-ritual-practice-reviewer.md` for practice sequence
- `shoonaya-pramana-content-reviewer.md` for scripture/source correctness

## Verification

Run focused checks first. Do not rely on visual inspection alone for logic changes.

After modifying code files, run:

```bash
graphify update .
```
