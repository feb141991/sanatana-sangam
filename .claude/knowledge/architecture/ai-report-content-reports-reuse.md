# AI Reports — content_reports Table Reuse and Schema Extension

**Date:** 2026-06-06
**Session context:** Adding "Report AI response" feature to Dharma Mitra AI chat
**Category:** architecture

## What we decided

AI chat reports reuse the existing `content_reports` table with `content_type='ai_chat_response'`
rather than creating a separate table. The AI "author" is represented by `content_author_id=''`
(empty string sentinel). A new `metadata jsonb` column stores AI-specific context per report.

## Why

Creating a separate table would duplicate moderation infrastructure (RLS, admin views, report
review tooling) for a structurally identical pattern. The `content_reports` table already handles
multi-type content via the `content_type` discriminator field — extending it is the lowest-friction
path that keeps all reportable content in one place for the moderation pipeline.

Making `content_author_id` nullable was rejected to avoid a breaking migration on a column that
existing RLS policies and queries assume is always present. An empty string sentinel is an
intentional signal: "the author is the AI, not a user UUID."

## The metadata column

Migration: `ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL`

Schema for AI reports:
```json
{ "ai_text": "<capped at 2000 chars>", "user_prompt": "<capped at 500 chars>" }
```

NULL for all non-AI report rows. RLS policies are unchanged — existing policies cover the new
column automatically. No index added (low-cardinality moderation queries don't need it yet).

## AI-specific report reasons

Five reasons exported as `AI_REPORT_REASON_OPTIONS` from `src/lib/user-safety.ts`:
- `incorrect` — factually wrong
- `harmful` — dangerous guidance
- `religiously_inaccurate` — wrong dharmic/scriptural information
- `offensive` — inappropriate tone or content
- `other`

These are kept strictly separate from the social-content `ReportReason` set (`abusive`,
`intolerant`, `misleading`, `spam`, `privacy`). Cross-contamination would make moderation
dashboards ambiguous — an "abusive" report means something different for user-posted content
than for an AI response.

## SafetyContentType extension point

`'ai_chat_response'` was added to `SAFETY_CONTENT_LABELS` and the `SafetyContentType` union in
`src/lib/user-safety.ts`. This is the canonical extension point for any future reportable content
type. Adding a new type here propagates to all type-checked consumers automatically.

## Constraints this creates

- `content_author_id=''` is now a reserved sentinel meaning "AI author." No user should ever have
  an empty-string UUID — enforce this assumption if ever querying by author.
- AI report reasons and user-content report reasons must remain in separate exported constants.
  Do not merge them into a single enum.
- Any new reportable content type must go through `SAFETY_CONTENT_LABELS` / `SafetyContentType`,
  not ad-hoc string literals.
- The `metadata` column is AI-only for now. If other content types need metadata, agree on a
  shared schema before repurposing it.

## What we explicitly rejected

- **Separate `ai_reports` table** — duplicates moderation infrastructure for no gain.
- **Nullable `content_author_id`** — breaking migration, existing queries assume non-null.
- **Merging AI and social report reasons into one enum** — creates moderation dashboard ambiguity.

---
