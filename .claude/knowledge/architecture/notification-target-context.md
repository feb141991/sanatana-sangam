# Notification targets preserve context and recheck access

**Date:** 2026-10-30  
**Session context:** Complete the Native notification tap review across backend and app  
**Category:** architecture

## What we decided
Weekly reflections open Progress. Pitru Paksha notifications carry the event's civil date, not the date of a later tap. Mandali notifications identify a post/comment or connection request; Native resolves that locator through an authenticated, private/no-store API before showing it.

## Why
A valid route can still be the wrong destination. Home ignores weekly-summary focus parameters, and an undated Panchang discards event context. A notification can outlive membership, a post, or a block decision, so the ID alone cannot authorize reading content. Reuse the feed's public-identity hydration and safety semantics without relying on the first feed page containing the item.

## Constraints this creates
- Candidate Pitru dates come from the existing reviewed/published occurrence. The legacy producer preserves its current calculation context; this work does not approve legacy dates or alter eligibility.
- Safety lookup errors are retryable failures, not empty exclusion lists.
- Block/report receipts open the sender's own notification record, avoiding disclosure of hidden content or moderation data.
- New notification routing migration is prepared and locally tested, not applied to production. No table columns, RLS policies, or public RPC grants change; the new function is a non-callable trigger.
- `notify_mandali_comment` exists only in production (not in `supabase/migrations`); its format was read from production on 2026-10-30: type `mandali_comment`, key `mandali_comment:<comment_id>`, written AFTER INSERT on `post_comments`. There is no `mandali_mention` type. Key formats that are still not understood use a specific notification receipt. Do not fabricate a format.
- A connection-request view describes the other person (`counterparty`), never the requester: for an accepted or declined request the requester is the viewer.

## What we explicitly rejected
Routing every event to a section hub; guessing a post from an undocumented mention key; reusing stale notification content as current access authorization.
