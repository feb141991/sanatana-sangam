# Mandali UGC Safety Engineering Evidence

## Verified surfaces

- Posts/comments are stored separately and feeds apply server-side block,
  mute and hidden-content filtering through `src/lib/user-safety.ts`.
- Report storage and admin report routes exist.
- Block/mute controls and a public `/contact` support route exist.
- Moderator routes are server-authorized and use privileged database access.

## Still requiring adversarial verification

- Post/comment/report request size, URL/media validation and rate-limit parity.
- Symmetric block behavior across discovery, comments, reactions, invitations,
  nearby seekers, cached feeds and pagination.
- Immutable moderation action/appeal audit semantics.
- Published operational response targets and staffed queue ownership.
- Multilingual abuse and image/link moderation behavior.

This file is evidence inventory only. It does not claim App Review approval.

