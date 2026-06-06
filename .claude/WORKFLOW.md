# Shoonaya Claude Workflow

This file is the operating protocol for Claude sessions in Shoonaya. Use it before making code, product, ritual, database, or UI changes.

Also follow the shared protocol in `SHOONAYA_WORKFLOW.md`.

## 1. Mandatory Read Order

Before changing files, read:

1. `SHOONAYA_RULES.md`
2. `CLAUDE.md`
3. The relevant role agent in `.claude/agents/`
4. The nearest files that will be changed
5. `graphify-out/GRAPH_REPORT.md` for architecture or codebase questions

Do not rely only on the prompt when the repo already contains local rules, agents, or knowledge docs.

## 2. Agent Routing

Use the smallest set of agents needed for the task.

- Frontend or component work: `shoonaya-frontend-engineer.md`
- UI, layout, visual quality, or UX review: `shoonaya-ui-ux-design-reviewer.md`
- Testing, regression review, or worked-status review: `shoonaya-qa-test-engineer.md`
- Supabase schema, API routes, cron jobs, RLS, auth, or queries: `shoonaya-supabase-backend-engineer.md`
- Ritual sequence, Nitya Karma, Dinacharya, Panchang, scripture placement: `shoonaya-ritual-practice-reviewer.md`
- Scriptural/source correctness: `shoonaya-pramana-content-reviewer.md`
- Product behavior, scope, rollout, mode decisions: `shoonaya-product-manager.md`
- Durable decisions or knowledge capture: `shoonaya-knowledge-curator.md`

If a task spans multiple areas, read all relevant agents first, then implement once.

## 3. Scope Lock

Before editing, identify:

- The exact user request
- Files expected to change
- Behavior that must not change
- Database columns, route names, step IDs, completion logic, or tracking logic that must remain stable

Do not touch unrelated files. Do not refactor while fixing content unless the refactor is required to complete the request.

## 4. Regression Guardrails

For Nitya Karma and Dinacharya work:

- Morning completion remains independent from midday, evening, and night.
- Existing 7-step morning streak, karma, and completion bar cannot be degraded by extended sections.
- Step IDs and database columns must not change unless the prompt explicitly asks.
- Ritual ordering changes require ritual/pramana review.

For Supabase/API work:

- Add every needed profile field to the `.select()` string instead of casting.
- Validate auth, input, permission, and database error paths.
- Migrations must be safe for existing users and use `IF NOT EXISTS` when appropriate.

For UI work:

- Preserve existing design language and CSS variables.
- Check mobile and desktop behavior when layout changes.
- Do not add explanatory marketing text inside app workflows unless requested.

## 5. Verification

Run the narrowest meaningful checks after edits:

- Targeted ESLint for touched TS/TSX files when possible.
- Targeted `rg` checks for renamed IDs, route names, or ordered ritual strings.
- `npx tsc --noEmit --pretty false` when feasible.
- Browser smoke test for meaningful UI changes when a dev server is available.
- API smoke or route review for server endpoints.

Known blocker: full TypeScript currently fails in `src/app/(main)/profile/ProfileClient.tsx`. Do not claim a clean full typecheck until that file is fixed.

After modifying code files, run:

```bash
graphify update .
```

## 6. Reviewer Gate

Before reporting completion:

- Use `shoonaya-qa-test-engineer.md` for regression risk and test coverage.
- Use `shoonaya-ui-ux-design-reviewer.md` for visible UI changes.
- Use `shoonaya-ritual-practice-reviewer.md` or `shoonaya-pramana-content-reviewer.md` for sacred practice/content changes.

If a reviewer finds an issue, fix it or report it clearly as unresolved.

## 7. Final Report

Every completion report should include:

- What changed
- Files changed
- Checks run
- Checks not run and why
- Remaining risk or known blocker

Do not say the work is fully safe if verification was blocked.

## 8. Knowledge Capture

Run `shoonaya-knowledge-curator.md` when the session creates durable decisions about:

- Product architecture
- Ritual sequence or sacred content policy
- Database schema
- Agent workflow
- Naming conventions
- Rollout strategy

Update `.claude/knowledge/INDEX.md` after adding knowledge files. Do not curate routine mechanical fixes.
