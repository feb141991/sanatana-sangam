# Shoonaya Change Safety Protocol

This protocol exists to prevent the common failure mode where one issue is fixed and another working flow breaks.

All coding agents should follow this before changing Shoonaya.

## 1. Read First

Read these before edits:

1. `SHOONAYA_RULES.md`
2. Tool-specific workflow file, if present:
   - Claude: `.claude/WORKFLOW.md`
   - Codex or agentic coding tools: `AGENTS.md`
   - Antigravity: `ANTIGRAVITY.md`
3. Relevant role agent in `.claude/agents/`
4. Existing code around the requested change
5. `graphify-out/GRAPH_REPORT.md` for architecture or codebase questions

## 2. Define The Blast Radius

Before editing, identify:

- Requested outcome
- Files expected to change
- Logic that must not change
- Existing working flows that must be protected
- Verification needed after the edit

Keep the diff narrow. Do not combine a feature, refactor, visual redesign, and cleanup in one pass unless the user explicitly asks.

## 3. Non-Negotiable Shoonaya Invariants

- Nitya Karma morning completion, karma, streaks, and 7-step progress must not depend on midday, evening, or night sections.
- Ritual sequence and sacred content changes require ritual/pramana review.
- Do not rename step IDs, database columns, API routes, or tracking keys unless explicitly requested.
- Do not add `any` casts to bypass Supabase or TypeScript issues.
- Do not silently alter auth, RLS, cron, notification, or completion behavior.
- Preserve existing design language and CSS variables.

## 4. Role Review

Use role agents as reviewers, not only implementers:

- QA/regression: `.claude/agents/shoonaya-qa-test-engineer.md`
- UI/UX: `.claude/agents/shoonaya-ui-ux-design-reviewer.md`
- Frontend implementation: `.claude/agents/shoonaya-frontend-engineer.md`
- Supabase/backend: `.claude/agents/shoonaya-supabase-backend-engineer.md`
- Ritual practice: `.claude/agents/shoonaya-ritual-practice-reviewer.md`
- Scripture/pramana: `.claude/agents/shoonaya-pramana-content-reviewer.md`
- Product scope: `.claude/agents/shoonaya-product-manager.md`
- Knowledge capture: `.claude/agents/shoonaya-knowledge-curator.md`

## 5. Verification Standard

After code edits, run the smallest checks that prove the changed behavior:

- Targeted ESLint for touched TS/TSX files.
- Targeted `rg` checks for changed IDs, hardcoded ordered strings, route names, and completion keys.
- `npx tsc --noEmit --pretty false` when feasible.
- Browser smoke test for meaningful UI changes when a dev server is available.
- API route validation for auth, invalid input, permission, success, and database error paths.
- Migration review for backwards compatibility and safe defaults.

Known current blocker: full TypeScript can fail in `src/app/(main)/profile/ProfileClient.tsx`. Report that blocker instead of claiming a clean full typecheck.

After modifying code files, run:

```bash
graphify update .
```

## 6. Completion Report

Every agent should report:

- What changed
- Files changed
- Verification run
- Verification blocked or skipped
- Remaining risks

Do not call a task complete if the main flow has not been checked.

## 7. Knowledge Capture

If the work creates a durable decision about architecture, product behavior, ritual sequence, schema, rollout, or agent workflow, run the knowledge curator and update `.claude/knowledge/INDEX.md`.

Skip knowledge capture for routine mechanical fixes.
