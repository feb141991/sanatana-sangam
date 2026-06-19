# Pramana Module Map

Last updated: 2026-05-19

## Purpose

`Pramana` is Shoonaya's private AI stack.
This document defines the module split so app integrations stay portable and do not collapse back into route-local AI code.

> **Status source of truth:** For current corpus maturity and prioritization, see `PRAMANA_CORPUS_ROADMAP.md`.

## Modules

### `@sangam/pramana-core`

Responsible for:

- task contracts
- feature input/output types
- policy checks
- prompt/context assembly contracts
- task routing interfaces

Must not contain:

- framework-specific route code
- direct database reads
- provider SDK calls
- retrieval implementation details

### `@sangam/pramana-corpus`

Responsible for:

- canonical document schema
- chunk schema
- source metadata
- rights state
- language/tradition/script tagging
- source-class enums

Must not contain:

- app UI logic
- provider logic
- route logic

### `@sangam/pramana-serve`

Responsible for:

- provider/runtime adapters
- model routing config
- generation result shapes
- retrieval interfaces
- gateway metadata

Must not contain:

- scripture-specific UI prompts
- Next.js route logic

### `@sangam/pramana-eval`

Responsible for:

- eval case definitions
- score/result summaries
- grounding checks
- translation checks
- regression suite contracts

Must not contain:

- production route code
- provider-specific SDK calls

## Current app mapping

Current temporary app seam:

- `src/lib/ai/contracts.ts`
- `src/lib/ai/policies.ts`
- `src/lib/ai/context-builder.ts`
- `src/lib/ai/router.ts`
- `src/lib/ai/providers/gemini.ts`
- `src/lib/ai/retrieval.ts`

Target mapping:

- `src/lib/ai/contracts.ts` -> `@sangam/pramana-core`
- `src/lib/ai/policies.ts` -> `@sangam/pramana-core`
- `src/lib/ai/context-builder.ts` -> `@sangam/pramana-core`
- `src/lib/ai/router.ts` -> thin app wrapper over `@sangam/pramana-core` + `@sangam/pramana-serve`
- `src/lib/ai/providers/gemini.ts` -> `@sangam/pramana-serve`
- `src/lib/ai/retrieval.ts` -> app adapter now, later shared with `@sangam/pramana-corpus` metadata and `@sangam/pramana-serve` retrieval interface

## Integration order

1. scaffold the four packages
2. add TS path aliases for local consumption
3. move shared types/contracts first
4. move provider abstractions second
5. keep app routes as thin wrappers only
6. wire retrieval into one feature
7. migrate `/api/ai/chat`

## Non-negotiable rules

- no route should build raw prompts inline
- no route should call provider SDKs directly
- no user-sensitive context should bypass policy checks
- no scripture explanation should be generated without task metadata
- no future private retrieval work should depend on Next.js internals
