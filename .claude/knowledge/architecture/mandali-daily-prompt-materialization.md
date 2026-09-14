# Mandali Daily Prompt Materialization

**Date:** 2026-09-14  
**Session context:** Hardening Mandali conversation starters after the first production prompt was materialized  
**Category:** architecture

## What we decided
Daily conversation starters are ordinary Mandali posts with explicit `mandali_prompt_id`
and UTC `mandali_prompt_date` provenance. Postgres enforces one starter per Mandali and
UTC date, while the service-role feed loader creates it idempotently from the active,
globally applicable prompt pool.

The API derives the official-author flag and localizes prompt content for the viewer.
Clients display that trusted flag and do not infer official status from a username.

## Why
An application-level read-before-insert check can race when two first feed loads arrive
together. An explicit daily identity and database unique constraint make duplicate
prevention atomic and also provide a stable key for measuring reactions and replies by
source prompt.

Keeping the starter as a normal post preserves the existing feed, comments, reactions,
moderation, and pagination contracts. Separating prompt provenance from author identity
also prevents a renamed or impersonated username from changing the UI trust signal.

## Constraints this creates
- Rotation dates are UTC dates and must not silently switch to device or server-local time.
- Only the service role may populate or retain prompt identity columns; member RLS policies
  require both columns to remain null.
- The prompt pool is deterministic: sort by prompt ID before selecting by UTC epoch day.
- Viewer language uses `text_hi` or `text_pa` when present and falls back to `text_en`.
- Published prompt wording is immutable so old discussions keep their original meaning;
  deactivate the prompt and add a new row to revise it.
- Used prompt rows cannot be deleted because post history and analytics reference them.
- Prompt posts are excluded from feed blending so an official starter is not copied into
  unrelated Mandalis.

## What we explicitly rejected
- Relying on `created_at` plus the system username to identify a daily prompt.
- Accepting rare duplicates and cleaning them up later.
- Letting clients decide whether an author is official.
- Editing or deleting a prompt after it has been published.

---
