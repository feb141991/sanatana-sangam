# Shoonaya Agent Operating Model

**Date:** 2026-06-06  
**Session context:** Creating role-oriented Claude/Codex agents and discussing whether Shoonaya can run like an agentic operating system  
**Category:** decision

## What we decided
Shoonaya should use specialized agents as a working operating layer, not as a replacement for human judgment.

The core roles are:

- Product manager
- Frontend engineer
- Supabase backend engineer
- QA test engineer
- UI/UX design reviewer
- Pramana content reviewer
- Ritual practice reviewer
- Knowledge curator

Codex and Claude should call the relevant `.md` role files per prompt.

## Why
Shoonaya spans software engineering, product psychology, sacred practice design, scripture accuracy, and user trust. A single generic assistant will miss important context. Role-specific agents preserve decision quality and make reviews repeatable.

The Armstrong-style "agency future" playbook is useful as an operating model: maintain a world model, use a skills layer, and schedule intelligence. But Shoonaya still needs human and religious judgment gates because mistakes in ritual or scripture guidance are higher-trust failures than normal SaaS bugs.

## Constraints this creates
- Engineering prompts should use frontend/backend/QA agents as relevant.
- Ritual and scripture changes require ritual/pramana reviewer passes.
- Product decisions should be captured into `.claude/knowledge/`, not only implemented in code.
- Review status should distinguish implementation complete from release-ready.

## What we explicitly rejected
- Fully autonomous shipping without human review.
- A large fake AI org chart that slows down execution.
- Treating sacred correctness as a normal copywriting task.

---
