# Direct Supabase Call Audit

Status: read-only audit, 2026-11-12. No database, migration, or production
change is part of this audit.

## Scope

The repository contains many direct Supabase calls. Most are domain-specific
queries and should remain local: notification queues, calendar materialisation,
account deletion, exports, content reports, and storage operations each have
different authorization and failure contracts. A blanket repository-wide
wrapper would hide those differences and increase regression risk.

The repeated risk is concentrated in authenticated profile/bootstrap paths:

| Call site | Current pattern | Risk | Action |
|---|---|---|---|
| `src/lib/calendar/request-profile.ts` | `getApiUser` plus one profile read | Bearer and cookie auth already share one path; profile errors are represented explicitly | Keep; this is the reference service |
| `src/lib/onboarding-gate.ts` | Shared profile query with explicit error result | Correctly distinguishes missing profile from failed read | Keep; do not duplicate |
| `src/lib/auth-cache.ts` | Request-cached cookie `getUser()` | Correct for server components, including stale-cookie cleanup | Keep; not interchangeable with API auth |
| `src/app/api/home/personalise/route.ts` | Direct cookie `auth.getUser()` and two separate profile reads | Could matter for a PWA auth/profile investigation; no Native caller exists | Deferred; measure the PWA path first |
| `src/app/api/analytics/advanced/route.ts` | Direct cookie `auth.getUser()` then profile read | Same auth inconsistency; best-effort data queries have no shared timeout policy | Candidate after personalisation |
| `src/app/api/user/highlights-consent/route.ts` | Direct cookie `auth.getUser()` then profile update | Same auth inconsistency on a user-facing write | Candidate after read-only paths |
| `src/app/(main)/kul/kul-data.ts` | Direct cookie `auth.getUser()` and profile read | Server-component-only cookie path; no Native API contract | Review separately; do not mechanically migrate |
| `src/app/api/vrat/observe/route.ts` | Shared API auth, direct timezone profile read | Auth is centralized; only the narrow profile read is local | Keep unless timing evidence shows repetition |

## Decision

The audit identifies three API routes that may merit a shared-auth review, but
no route is being rewritten from this audit. In particular, the Native repo has
no caller for `/api/home/personalise`; it is currently a PWA-only endpoint.
Changing its auth contract now would add risk without improving Native startup
or content latency. Defer that migration until a PWA trace shows repeated auth
or profile-read cost and focused tests define the cookie/Bearer, cache, RLS,
and error behavior that must be preserved.

Do not wrap these categories as part of this work:

- admin/service-role queries;
- notification resolver and materialisation transactions;
- account deletion and export fan-out queries;
- content/storage writes;
- independent analytics datasets that intentionally fail soft.

## Safeguards for any future, measured migration

1. Cookie and Bearer authentication retain their current status semantics.
2. Profile-read failure remains distinguishable from a missing profile; no
   default tradition or timezone may be inferred from an error.
3. The existing recommendation cache key and `from_cache` response contract
   stay unchanged.
4. Religious-data consent continues to suppress tradition and spiritual level.
5. The focused route tests run before and after the change, followed by
   TypeScript and the existing API-auth contract tests.

No route was changed by this audit. The audit is documentation only; any future
route migration must be a separate, measured, route-specific change.
