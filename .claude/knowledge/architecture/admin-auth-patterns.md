# Admin Monitoring — Auth and Type Safety Patterns

**Date:** 2026-06-07
**Session context:** Hardening admin monitoring page auth and fixing Supabase type errors
**Category:** architecture

## What we decided

### 1. Server actions re-verify HMAC independently of middleware

`actions.ts` always calls `verifyAdminToken()` (HMAC cookie check) at the top of every server action, regardless of what middleware does. Middleware guards page-level navigation; server actions are a separate HTTP surface that middleware does not cover.

This is a hard rule: any server action under `/admin` must independently verify the admin token. Relying on middleware alone is a security gap.

### 2. Status literal correction — 'resolved' is not a valid DB value

The `content_reports` status column union is `'pending' | 'reviewed' | 'actioned' | 'dismissed'`. The literal `'resolved'` was used in the monitoring UI and is invalid. Corrected to `'reviewed'`. This distinction matters: the DB rejects out-of-union values silently or with a constraint error.

When adding new status values, update `src/types/database.ts` first, then the UI — never the reverse.

### 3. Supabase postgrest-js v2 `.update()` returns `never` — cast workaround

postgrest-js v2 has a known deferred conditional-types bug where `.update()` on certain tables (confirmed on `content_reports`) resolves to type `never`, making the chain uncallable without a cast.

Idiomatic fix: wrap the update in a function that casts through `unknown` with an explicit `ChainableEq` type:

```ts
function updateContentReport(id: string, status: ContentReportStatus) {
  return (supabase
    .from('content_reports')
    .update({ status })
    .eq('id', id) as unknown) as ChainableEq<...>
}
```

This cast is documented inline in `actions.ts`. Do not remove without first verifying the postgrest-js version has fixed the underlying conditional-types resolution.

### 4. Next.js 15 App Router — searchParams must be awaited

`searchParams` in page components is typed as `Promise<{ [key: string]: string | string[] | undefined }>` in Next.js 15 and must be `await`-ed before use. Accessing it synchronously produces a type error and a runtime warning.

```ts
// Correct
export default async function Page({ searchParams }: { searchParams: Promise<{...}> }) {
  const { tab } = await searchParams
```

Apply this to every admin page that reads query params.

## Why

Server actions bypass Next.js middleware — this is documented behavior, not a bug. Any auth check in middleware does not apply to `POST /api/...` or server action invocations. An admin action that mutates data (update status, dismiss report) must not trust that the caller has already been verified.

The postgrest-js `never` issue surfaces intermittently depending on table schema complexity and how the generated types are structured. The cast-through-unknown pattern is the lowest-risk fix: it preserves runtime behavior while satisfying TypeScript without restructuring the query.

## Constraints this creates

- Every new server action under `/admin` must begin with `verifyAdminToken()` — this is non-negotiable.
- Any status enum change in the DB must be reflected in `src/types/database.ts` before any UI code references it.
- If postgrest-js is upgraded, re-test `.update()` chains on `content_reports` to check if the `never` issue is resolved and the cast can be removed.

## What we explicitly rejected

- Relying solely on middleware for admin server action auth — too easy to miss new actions added later.
- Inline `as any` casts for the postgrest-js `never` issue — too broad; the typed `ChainableEq` cast is scoped and self-documenting.

---
