# Shoonaya Agent Instructions

This file is for Codex and other coding agents.

Before changing files, follow `SHOONAYA_WORKFLOW.md` and `SHOONAYA_RULES.md`.

## Required Behavior

- Read the relevant `.claude/agents/*.md` role file before implementing specialized work.
- Keep edits scoped to the user request.
- Preserve existing working flows and completion logic.
- Do not revert unrelated user or Claude changes.
- Use existing local patterns before introducing abstractions.
- For reviews, lead with findings, risks, and file references.

## Verification

Run targeted checks for touched files. For code edits, also run `graphify update .` after the change.

If full TypeScript is blocked by the known `ProfileClient.tsx` issue, say that directly and still run useful narrower checks.

## Reporting

Final responses must include what changed, checks run, and remaining risk. Do not claim a clean build unless it was actually verified.
