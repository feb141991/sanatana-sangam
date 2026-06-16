# Follow-up: `/home` ↔ `/onboarding` Redirect Loop

**Status:** Diagnosis complete. **No code changed yet** — this doc is the discussion/plan
to approve before implementation.

**Date:** 2026-06-16
**Trigger commit (suspected):** `fbc1799` — *"fix: clear stale Supabase auth sessions"* (today 03:05)
**First observed:** production access logs ~03:20 (≈15 min after `fbc1799`)

---

## 1. Symptom

Production access logs show a tight loop, ~1 request/second:

```
/home        200
/onboarding  200
/home        200
/            307   (middleware: logged-in user at / → /home)
/onboarding  200
/home        200
...
```

Users never land — they bounce between `/home` and `/onboarding` indefinitely.

**Why both show `200`, not `307`:** these are **RSC (client-side) navigations** hitting a
server `redirect()`. App Router returns the redirect to the client as a `200` RSC payload
(not a `307`), and the client router immediately navigates to the target. So a pair of
server components redirecting *at each other* logs as alternating `200`s. This is the
fingerprint of a mutual server redirect, not a client bug.

---

## 2. Root cause

Two **independent** server-side gates redirect in **opposite** directions, each over its
**own** profile read:

| Page | File / lines | Client | Read | Redirect rule |
|------|------|--------|------|---------------|
| Home | [`home/page.tsx:132–149`](src/app/(main)/home/page.tsx) | `getAuthUser` + `getSupabaseClient` (auth-cache) | `.single()` | `if (!profile \|\| onboarding_completed !== true)` → `/onboarding` |
| Onboarding | [`onboarding/page.tsx:6–18`](src/app/(main)/onboarding/page.tsx) | `createServerSupabaseClient` | `.single()` | `if (profile?.onboarding_completed)` → `/home` |

With **consistent** data these gates are complementary and do **not** loop:
- `onboarding_completed === true` → home renders, onboarding bounces to home → land on home.
- `onboarding_completed !== true` → home bounces to onboarding, onboarding renders → land on onboarding.

The loop only occurs when the **two reads disagree** for the same user at the same time:
**home reads `null`/`false`/errored while onboarding reads `true`.** Then home says
"go to onboarding," onboarding says "go to home," forever.

### What makes the reads disagree

1. **`.single()` on both pages.** `.single()` turns "row briefly unreadable" (RLS / session
   timing) into an **error with `data: null`**. The home gate treats that null as
   *needs onboarding*.
2. **Two different Supabase client paths.** Home uses the auth-cache client; onboarding uses
   `createServerSupabaseClient`. If they observe cookies differently, their auth context — and
   therefore RLS visibility of the profile row — can differ within the same instant.
3. **`fbc1799` middleware now rotates cookies mid-flight.** `middleware.ts` now calls
   `supabase.auth.getUser()` on every request and writes refreshed `sb-*` cookies onto the
   response. A request that arrives during rotation can have the home-side client read a
   stale/expired cookie (→ RLS miss → null) while another read sees the refreshed one. This is
   the most plausible **trigger** that flipped a latent design flaw into a live incident.
4. **`e0189cb` ("Fix OAuth onboarding gate") widened the blast radius.** It changed the home
   gate to `!profile || onboarding_completed !== true`, so **any** null/incomplete read — not
   just a deliberate "incomplete onboarding" — now redirects to `/onboarding`.

### Is it `fbc1799`?

`fbc1799` did **not** touch either gate, so it is not the *logical* author of the loop. But it
is the most likely **trigger**: its mid-flight cookie rotation creates the transient
inconsistent-read window that the pre-existing two-gate design cannot tolerate. The durable
bug is the **two opposing gates + `.single()` + divergent client paths**; `fbc1799` (and
`e0189cb` before it) exposed it.

> Note: `auth-cache.ts` is **not** a cross-request stale cache — it uses React `cache()`, which
> only dedupes within a single RSC request. It is not the cause.

---

## 3. Fix plan (proposed — needs approval)

Loop-breakers (B) make the loop *impossible*; hardening (H) reduces the chance of the
inconsistent read that triggered it.

### B1 — Remove the opposite redirect from `/onboarding` (single authoritative gate)
Keep `/home → /onboarding` as the **only** automatic gate. On `/onboarding`, when
`onboarding_completed` is already true, **do not server-redirect to `/home`**. Instead render a
calm *"You're all set"* state with a **`<Link href="/home">`**.

- **Recommended:** static link, no auto-redirect. This *guarantees* loop termination because no
  two gates ever auto-redirect against each other.
- *Acceptable but weaker:* client `router.replace('/home')` after mount. This still risks a
  softer loop if home's read stays inconsistent (onboarding replaces → home redirects back →
  …). Prefer the static link unless product wants zero extra tap.

### B2 — Stop treating `!profile` as "needs onboarding" on home
`fbc1799`'s `(main)/layout.tsx` already redirects **missing-profile** users to
`/auth/sign-out`, so by the time `home/page.tsx` runs, a profile is guaranteed to exist. A
`null` at the home gate therefore means a **transient read failure**, not a missing row.
Change the home gate so it redirects to `/onboarding` **only on a definitive
`onboarding_completed === false`**, and on a null/errored read **does not** bounce to
onboarding (fail safe — render, or retry once). This removes the dominant transient-null → loop
path.

### H1 — One shared gate helper, one client, one query
Both pages call the **same** helper using the **same** Supabase server client and the **same**
select, so the two reads cannot diverge:

```ts
// src/lib/onboarding-gate.ts (proposed)
export async function getOnboardingGateProfile(supabase, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, tradition, onboarding_completed')
    .eq('id', userId)
    .maybeSingle();
  if (error) console.error('[onboarding-gate] profile read failed', { userId, error });
  return { profile: data ?? null, error: error ?? null };
}
```

Standardize on **one** client constructor across home, onboarding, and (ideally) the layout.

### H2 — `.maybeSingle()` in both pages
Replace `.single()` (home:142, onboarding:15) with `.maybeSingle()` so a transient miss is a
clean `null` + (optional) error instead of a thrown error state. (Combine with B2 so `null`
no longer means "needs onboarding".)

### H3 — Remove RSC/data-cache ambiguity
Add `export const dynamic = 'force-dynamic'` (or `noStore()` around the gate read) to both
pages. They already read cookies/auth so should be dynamic; this is cheap belt-and-suspenders.

### H4 — Temporary structured gate logging
Log one line per gate decision: `route, userId, profileFound, onboarding_completed, readError,
willRedirect`. Confirms the fix in prod and tells us whether reads were **erroring** (RLS) vs
**empty**.

- `userId` is logged via `shortUserId()` — an 8-char prefix, **not a true hash**. Lower
  cardinality / weakly de-identified, acceptable for short-term debugging only.
- **CLEANUP (required):** remove all three `[onboarding-gate]` `console.log` sites (home,
  onboarding page) **and** the truncation helper usage once production logs confirm the
  `/home`↔`/onboarding` alternation is gone and sign-out noise (§9) is acceptable. The
  `console.error` in the helper for real DB read failures may stay.

### Explicitly NOT doing
- **No onboarding gate in middleware.** A per-request profile read in middleware is expensive
  and harder to debug, and `fbc1799` already made middleware heavier with `getUser()`. The gate
  stays in the page layer.

---

## 4. Why this is enough

B1 guarantees the two gates can never auto-redirect against each other. B2 + H1/H2 ensure that
even under cookie rotation, a transient unreadable profile is not misclassified as "needs
onboarding." Either fix alone breaks the loop; together they make it robust.

---

## 5. Verification

1. **Repro understanding:** confirm in staging that forcing a `null` profile read on the home
   side (e.g., expired cookie) currently loops, and does not after the change.
2. `npx tsc --noEmit`, `npm run lint`, `npm run build`.
3. **Prod watch:** after deploy, watch logs for `/home`↔`/onboarding` alternation to disappear;
   use H4 logs to confirm gate decisions.
4. **Real user paths:** new signup → onboarding → home (no bounce); returning completed user →
   home (no bounce); user mid-onboarding refresh → stays on onboarding.

## 6. Rollback
All changes are page-layer and additive; revert the gate commit to restore prior behavior. No
schema or auth-config changes.

---

## 7. Decisions (locked 2026-06-16)
1. **B1 style:** **static "You're all set" + `<Link href="/home">`** — no auto-redirect. Safest
   loop breaker; avoids navigation churn / hidden state from `router.replace`.
2. **Shared client:** **`getAuthUser()` + `getSupabaseClient()` (auth-cache) in both pages.** No
   third pattern. (Verified safe — see §8.)
3. **Scope:** **fix the loop only.** Do *not* bundle a broader middleware-rotation audit in this
   patch. Audit middleware separately *only if* intermittent sign-outs persist afterward.

### Approved implementation shape
- New `src/lib/onboarding-gate.ts` helper; reads profile with **`.maybeSingle()`**; logs real DB
  errors; **never converts error/null into "needs onboarding."**
- `/home`: redirect to `/onboarding` **only when `profile?.onboarding_completed === false`.**
  Missing profile → let the layout's `/auth/sign-out?reason=missing_profile` handle it; **never**
  redirect a missing/unread profile to `/onboarding`.
- `/onboarding`: **no** server redirect to `/home` when complete — render "You're all set" + link.
- Both pages use the same helper and the same (auth-cache) client path.

## 8. Verified facts that make this correct
- **`auth-cache` is the same client, request-scoped.** `getSupabaseClient = cache(() =>
  createServerSupabaseClient())`; `getAuthUser` uses verified `auth.getUser()`. Unifying both
  pages on it removes the divergent-client-path risk without adding a new pattern.
- **`onboarding_completed` is `NOT NULL DEFAULT false`** (`supabase/migrations/*onboarding*`,
  generated type `boolean`). A read row is always `true`/`false`; `null`/`undefined` means
  *not read*. This is why `=== false` (not `!== true`) is the correct, loop-safe predicate.

## 9. Residual risk to watch (not fixed by this patch)
`(main)/layout.tsx` redirects `!profile → /auth/sign-out`. It shares the **same transient-null
vulnerability**: under cookie rotation, a momentarily unreadable profile becomes a **spurious
sign-out** instead of a loop. That is strictly better than an infinite loop and is consistent
with deferring the middleware audit — but expect occasional "I got logged out" reports. Those
reports are the trigger to do the deferred middleware-rotation audit. Keep §3-H4 logging on
until we've confirmed both the loop is gone *and* sign-out noise is acceptable.
