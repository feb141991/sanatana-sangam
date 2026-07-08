# P0-3 Remediation Plan — daily_sadhana Completion Flag Spoofing

Last updated: 2026-07-08
Status: Superseded by implementation. Column-grant closure shipped in
`supabase/migrations/20260708163000_harden_daily_sadhana_completion_writes.sql`,
and the dharmveer Open Question below shipped separately in
`supabase/migrations/20260708170000_dharm_veer_responses.sql` +
`POST /api/dharm-veer/submit`. See "Resolution Update — 2026-07-08" at the
end of this file for what actually shipped versus what this plan originally
proposed. The body of this doc is left as-authored (a planning artifact) —
do not treat its "not yet implemented" language as current.

## Objective

`docs/NATIVE_DAILY_COMPLETION_MATRIX.md`'s P0-3 finding: `daily_sadhana` (and `profiles`) have blanket `GRANT ALL` to `authenticated`/`anon` with ownership-only RLS, so any user can directly `.update()` their own `daily_sadhana` row and set `japa_done`, `quiz_done`, `nitya_done`, `pathshala_done`, `dharmveer_done` to `true`, then call `POST /api/sadhana/perfect-day` to claim 30 karma + 15 seva + a streak freeze without doing any of the five practices. This doc designs the remediation without implementing it broadly, per this task's own scope limit.

## 1. Write-Path Matrix

| Column | Web writer | Native writer | Server-verifies the underlying action? | Directly spoofable today? | Proposed canonical path |
|---|---|---|---|---|---|
| `japa_done` (+ `streak_count`, same upsert) | `src/app/(main)/japa/JapaClient.tsx` `saveSession()` — **direct client `.upsert()`** on `daily_sadhana` (lines ~2707-2709) | `POST /api/japa/complete` (server-side, `getApiUser`, RLS-scoped) | Partial — the route validates `count`/`rounds` are non-negative numbers but trusts the client-reported values as-is; no independent proof a mala was actually completed | Web: yes, trivially (no route involved at all). Native: only by lying in the POST body (bounded to what the route writes) — not a raw-table bypass, since `japa.tsx` has no direct write | Migrate `JapaClient.tsx` to call `POST /api/japa/complete` instead of writing directly, so both platforms share one write path (see Slice 2 below) |
| `quiz_done` | `POST /api/quiz/save` (server) | Same route, confirmed via `apiFetch('/api/quiz/save', ...)` in `app/quiz.tsx` | Partial — route computes streak/karma server-side but trusts client-supplied `is_correct`/`correct_index` rather than checking against the day's actual quiz answer key | Only via a raw `daily_sadhana` table write bypassing the route entirely (the P0-3 general issue) — the route itself is already centralized on both platforms | Already centralized — no write-path change needed. `is_correct` server-validation is a separate, smaller P1 (not part of this plan). |
| `nitya_done` | `src/app/(main)/nitya-karma/NityaKarmaClient.tsx` `markStep()` — **direct client `.upsert()`**, fired unconditionally on **every single step mark** (not gated on all steps done) | `POST /api/native/nitya-karma` (server-side) — correctly gated: only sets `nitya_done: true` when `allDone` (all `NATIVE_NITYA_STEP_ORDER` steps present in `nitya_karma_log` for today) | Native: yes, recomputes `allDone` server-side from `nitya_karma_log` rows before writing. Web: no — writes `nitya_done: true` on the first step tapped, regardless of remaining steps | Web: yes, trivially, **and this is a real correctness bug independent of security** — completing 1 of ~7 steps marks the whole day's Nitya Karma "done" on web, which is inconsistent with native's (correct) all-steps semantics | **Web/native semantics currently diverge — see Stop-Rule Note below.** Canonical fix: `NityaKarmaClient.tsx`'s `markStep()` must recompute `allDone` from the day's logged steps (same logic `/api/native/nitya-karma` already has) before writing `nitya_done`, instead of writing it unconditionally. |
| `pathshala_done` | `src/app/(main)/pathshala/[pathId]/lesson/LessonClient.tsx` `markComplete()` — **direct client `.upsert()`**, fired on **any single lesson completion** | `POST /api/pathshala/progress` (server-side) — also fires on any single lesson completion (line 256-259) | Neither verifies more than "a lesson index was submitted and is in range" — but the trigger condition (any lesson) is at least **consistent** between web and native, so this is a centralization gap, not a semantics divergence | Web: yes, trivially (direct write, and it doesn't even go through its own already-built `/api/pathshala/progress` route). Native: only via the route's own (lightly validated) payload | Migrate `LessonClient.tsx` to call `POST /api/pathshala/progress` instead of its two direct writes (`guided_path_progress` update + `daily_sadhana` upsert) — the target route already exists and native already proves it works (see Slice 2 below) |
| `dharmveer_done` | `src/app/(main)/dharm-veer/[id]/DharmVeerClient.tsx` — **direct client `.upsert()`**, gated only by a client-side `setTimeout(30_000)` (no interaction proof at all — a user can call the same upsert from devtools with zero reading) | `app/dharm-veer.tsx` `persistCompletion()` — **direct client `.upsert()`**, gated by `nextSeen.length >= MAX_DAILY_CARDS` (3 swipes, any decision including "skip" counts) | No — neither platform verifies real engagement server-side. Native additionally calls `POST /api/dharm-veer/submit` per swipe intending to log the decision/mood/intention, but **that route does not exist in the web repo** (`src/app/api/dharm-veer/` only contains `roster/route.ts`) — the call 404s and is silently swallowed by native's `.catch(() => null)`. No table exists to back a per-swipe ledger either (`dharm_veer_daily` is AI-generated *content*, not a per-user response log) — building one would require inventing a new table, which this task's stop rules block without separate sign-off. | **Both platforms: yes, trivially** (direct write, weakest engagement proof of the five, and native has this session's only confirmed direct-native-write case) | **This is the field this plan treats as highest priority to move behind a route (see Slice 1), but real behavioral verification is out of scope for this slice — see Open Question below.** |
| `perfect_day_bonus_given` | `POST /api/sadhana/perfect-day` only (server, atomic claim-once via conditional update) | Same route | Yes for its own logic (real `auth.getUser()`, atomic claim) — but it trusts the five flags above, which are not all trustworthy today | Not directly (well-guarded) — the exposure is entirely upstream, via the five flags above | No change to this route's own logic needed; only its inputs need hardening (Slice 1) |
| `streak_count` | Written only inside the same `daily_sadhana` upsert as `japa_done`, both platforms (`JapaClient.tsx` web-direct, `/api/japa/complete` native) | Same | Inherits `japa_done`'s verification level (see that row) | Inherits `japa_done`'s spoofability | No separate write path — fixed by whatever fixes `japa_done` |

### Stop-Rule Note — web/native completion semantics diverge for `nitya_done`

Per this task's stop rules ("Stop if web and native would diverge in completion semantics"): they currently **do** diverge for Nitya Karma specifically — web marks the whole day done on the first step, native requires all steps. This is disclosed here rather than silently proceeding. It does not block this plan (the fix is a small, well-scoped correction to `NityaKarmaClient.tsx`'s existing logic, not a redesign), but it should be scheduled explicitly, not folded silently into a larger change. See Slice 3.

No other column showed a semantics divergence — `pathshala_done`'s "any lesson" trigger and `japa_done`/`quiz_done`'s logic already match between platforms.

## 2. Direct Native Writes That Should Move To API

Confirmed via `rg -n "daily_sadhana|japa_done|quiz_done|nitya_done|pathshala_done|dharmveer_done|perfect_day_bonus_given|streak_count" app lib` in the native repo (36 matches across 4 files: `app/(tabs)/japa.tsx`, `app/(tabs)/profile.tsx`, `app/dharm-veer.tsx`, `app/kosh.tsx`):

- `app/(tabs)/japa.tsx` — no direct write; only a read of `profiles` (unrelated columns) and calls `/api/japa/complete`. Clean.
- `app/(tabs)/profile.tsx` — read-only (`streak_count`, `*_done` flags for the relic-unlock display). Clean.
- `app/kosh.tsx` — read-only (`streak_count` for unlock gating). Clean.
- **`app/dharm-veer.tsx` — `persistCompletion()` (lines 203-217) writes `daily_sadhana.dharmveer_done: true` directly via `supabase.from('daily_sadhana').upsert(...)`. This is the one confirmed direct native write in scope and should move to an API route.**

`quiz.tsx` and `nitya-karma.tsx` were re-verified clean (API-only) per the required-reading list; no drift since the prior audit.

## 3. RPCs/Functions Needing Ownership Checks

None found beyond what's already tracked. `increment_period_seva`, `increment_karma`, and `increment_streak_freeze` were already hardened in prior tasks (`docs/NATIVE_DAILY_COMPLETION_MATRIX.md` P0-1/P0-2). No new RPC call sites were found in this pass's required reading that lack an ownership check. The remaining exposure is entirely at the table-GRANT level (P0-3), not in any RPC.

## 4. Minimum Safe First Slice

Per this task's explicit preference — secure `perfect-day` eligibility via server-issued records first, **do not revoke column grants yet** (legitimate routes still depend on RLS-scoped direct updates for several of these columns) — the slices below are ordered so each one is independently shippable and none of them touches a `REVOKE`.

### Slice 1 — Make `/api/sadhana/perfect-day` re-derive completion instead of trusting the stored flags

Change `src/app/api/sadhana/perfect-day/route.ts` to recompute each of the five flags from its own source table for today's spiritual date, rather than trusting `daily_sadhana.{japa_done,quiz_done,nitya_done,pathshala_done,dharmveer_done}` directly:

- `japaDone`: `EXISTS (SELECT 1 FROM mala_sessions WHERE user_id = v_user_id AND spiritual_date = today AND completed_rounds > 0)` (columns confirmed present via `src/app/api/japa/complete/route.ts`'s `buildMalaSessionInsert` fallback-column list).
- `quizDone`: `EXISTS (SELECT 1 FROM quiz_responses WHERE user_id = v_user_id AND date = today)` (`quiz_responses.date` confirmed `date DEFAULT CURRENT_DATE NOT NULL`).
- `nityaDone`: reuse `/api/native/nitya-karma`'s own `countCompletedNativeNityaSteps` logic against `nitya_karma_log` rows for today — already proven correct there.
- `pathshalaDone`: `EXISTS (SELECT 1 FROM guided_path_progress WHERE user_id = v_user_id AND last_interacted_at >= <today start> AND last_interacted_at < <today end>)` — **assumption to verify before implementing**: confirm `last_interacted_at` is actually refreshed on every lesson upsert (either by a DB trigger or by adding it explicitly to `/api/pathshala/progress`'s upsert payload, which today does not set it). If it is not currently refreshed, this sub-check is not yet reliable and `pathshala_done` should keep trusting the stored flag until that's fixed, with the gap disclosed rather than silently assumed solid.
- `dharmveerDone`: **no independent source exists** (see matrix row above and Open Question below) — must keep trusting `daily_sadhana.dharmveer_done` for this one flag in Slice 1. Disclosed explicitly, not silently accepted as solved.

This closes the cheapest version of the exploit (flip 5 booleans with one `.update()` call) for 3 of 5 flags immediately, and for a 4th (`pathshala_done`) once the `last_interacted_at` assumption is confirmed. It does **not** achieve full closure — a determined attacker could still insert fabricated rows into `mala_sessions`/`quiz_responses`/`nitya_karma_log` directly, since those tables have the same blanket-grant pattern (full P0-3 closure is Slice 4, below). This slice is explicitly a bar-raise, not a full fix, and the doc should say so rather than overclaim.

**Acceptance test:** with `daily_sadhana` manually spoofed (`.update({ japa_done: true, quiz_done: true, nitya_done: true, pathshala_done: true, dharmveer_done: true })`) but no rows in `mala_sessions`/`quiz_responses`/`nitya_karma_log` for today, `POST /api/sadhana/perfect-day` must return `{ awarded: false, reason: 'incomplete' }` for at least japa/quiz/nitya (and pathshala once the `last_interacted_at` assumption is confirmed).

### Slice 2 — Consolidate the remaining direct writes onto existing/new thin routes

No new tables. In priority order:

1. **`app/dharm-veer.tsx` (native)** — replace `persistCompletion()`'s direct `daily_sadhana` upsert with a call to a new `POST /api/dharm-veer/complete` route (mirrors the shape of `/api/native/nitya-karma`'s POST). This is the one confirmed direct native write (§2) and should move first.
2. **`src/app/(main)/dharm-veer/[id]/DharmVeerClient.tsx` (web)** — same new route, replacing its own direct upsert, so both platforms share one write path for this field.
3. **`src/app/(main)/japa/JapaClient.tsx` (web)** — replace its direct `daily_sadhana`/`mala_sessions`/RPC sequence with a call to the already-existing `POST /api/japa/complete` (built for native, proven correct, currently unused by web).
4. **`src/app/(main)/pathshala/[pathId]/lesson/LessonClient.tsx` (web)** — replace its direct `guided_path_progress` + `daily_sadhana` writes with a call to the already-existing `POST /api/pathshala/progress` (same route native already uses).

Each of these is a call-site swap, not a new data model — lowest risk items first (steps 3 and 4 reuse routes already proven correct by native; steps 1-2 need one new route, but that route's logic is a straightforward port of the existing direct-write logic into a server context, matching the precedent set by `/api/japa/complete`'s own header comment).

**Acceptance test:** after the swap, `rg -n "daily_sadhana" src/app/(main)/dharm-veer src/app/(main)/japa src/app/(main)/pathshala` in the web repo returns no direct `.upsert()`/`.update()` calls on `daily_sadhana` outside the new/existing API routes.

### Slice 3 — Fix the web/native Nitya Karma semantics divergence

Change `NityaKarmaClient.tsx`'s `markStep()` to recompute `allDone` from the day's logged steps (same check `/api/native/nitya-karma` already performs) before writing `nitya_done: true`, instead of writing it unconditionally on every step tap. This is a correctness fix (Stop-Rule Note above), not primarily a security one, but it also closes a cheap way to reach `nitya_done = true` with 1/7th of the actual practice.

**Acceptance test:** completing exactly 1 of 7 Nitya Karma steps on web must leave `daily_sadhana.nitya_done = false`; only completing all 7 sets it `true`, matching native's existing behavior.

### Slice 4 — Full P0-3 column-grant closure (not in this plan's scope — sequencing only)

Only after Slices 1-3 land (so no legitimate caller still depends on a direct RLS-scoped write to these columns): design and apply `REVOKE UPDATE (japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done, perfect_day_bonus_given, streak_count) ON public.daily_sadhana FROM authenticated, anon;` plus equivalent RPC-mediated writers for anything still needing a legitimate direct path. This is deliberately sequenced last and is not designed in detail here — it is the existing P0-3 item in `docs/NATIVE_DAILY_COMPLETION_MATRIX.md`'s Exact Implementation Order, unchanged by this plan.

## Columns Not Safe To Revoke Yet

All seven columns in §1 currently have at least one legitimate direct-write caller (either a web client component or, historically, native's `dharm-veer.tsx`) that has not yet been migrated to a route. Per the stop rule, **no REVOKE is proposed in this plan** — Slice 4 is explicitly deferred until Slices 1-3 remove every legitimate direct writer.

## Blockers / Open Questions

- **`dharmveer_done` has no server-verifiable signal of real engagement on either platform**, and the one mechanism that looks like it was designed to provide one (`POST /api/dharm-veer/submit`, called by native on every swipe) does not exist as a route and has no backing table. Building a real per-swipe ledger requires a new table, which this task's stop rules block without explicit sign-off — flagged as an Open Question rather than designed further here. Until decided, Slice 1 must keep trusting `daily_sadhana.dharmveer_done` directly for perfect-day purposes (disclosed above, not silently accepted).
- **`guided_path_progress.last_interacted_at` refresh behavior is unconfirmed** — Slice 1's `pathshalaDone` re-derivation depends on it being updated on every lesson upsert. Needs a quick check (either a DB trigger definition or adding it explicitly to `/api/pathshala/progress`'s upsert payload) before Slice 1 can safely include pathshala in the re-derived set.
- Web's `is_correct` trust in `/api/quiz/save` (client-supplied, not re-validated against the day's actual answer key) is a related but distinct gap, out of scope for this plan — noted for a future pass.

## Files Read This Task

Web repo: `docs/NATIVE_DAILY_COMPLETION_MATRIX.md`, `src/app/api/sadhana/perfect-day/route.ts`, `src/app/api/japa/complete/route.ts`, `src/app/api/quiz/save/route.ts`, `src/app/api/pathshala/progress/route.ts`, `src/app/api/native/nitya-karma/route.ts`, `src/app/(main)/dharm-veer/[id]/DharmVeerClient.tsx`, `src/app/(main)/japa/JapaClient.tsx`, `src/app/(main)/nitya-karma/NityaKarmaClient.tsx`, `src/app/(main)/pathshala/[pathId]/lesson/LessonClient.tsx`. Plus targeted greps: `dharmveer_done`/`streak_count`/`perfect_day_bonus_given` writers across `src`; `dharm_veer_daily`, `sadhana_events`, `mala_sessions`, `quiz_responses`, `guided_path_progress` schema in `supabase/step1_tables.sql`; confirmed `/api/dharm-veer/submit` does not exist (`src/app/api/dharm-veer/` contains only `roster/route.ts`).

Native repo: `app/(tabs)/japa.tsx`, `app/quiz.tsx`, `app/pathshala/[pathId]/[lessonId].tsx`, `app/nitya-karma.tsx`, `app/dharm-veer.tsx`, `app/dharm-veer/[id].tsx`. Plus targeted greps confirming `app/(tabs)/profile.tsx` and `app/kosh.tsx` are read-only.

## Verification Commands Run

```
$ cd "/Users/Business(C)/Sanatan Sangam/Shoonaya" && rg -n "daily_sadhana|japa_done|quiz_done|nitya_done|pathshala_done|dharmveer_done|perfect_day_bonus_given|streak_count" src
233 matches across 29 files (api routes, page.tsx server components, and client components — full list in §1/§2 above; every write call site individually cited)

$ cd "/Users/Business(C)/shoonaya-mobile" && rg -n "daily_sadhana|japa_done|quiz_done|nitya_done|pathshala_done|dharmveer_done|perfect_day_bonus_given|streak_count" app lib
36 matches across 4 files: app/(tabs)/japa.tsx, app/(tabs)/profile.tsx, app/dharm-veer.tsx, app/kosh.tsx — only app/dharm-veer.tsx contains a write
```

Confirmed: **one** native direct write remains (`app/dharm-veer.tsx`), addressed as Slice 2 item 1.


---

## Resolution Update — 2026-07-08

Everything this plan deferred has since shipped, across two migrations:

**Column-grant closure** (`supabase/migrations/20260708163000_harden_daily_sadhana_completion_writes.sql`) —
went further than this plan's original 5-column matrix. A re-audit while
implementing found the real write surface was 8 columns across 11 call
sites (this plan's matrix missed `stotram_done`, `katha_done`,
`panchang_viewed`, and two additional direct browser-side writers of
`nitya_done`/`pathshala_done` — `NityaKarmaClient.tsx` and
`LessonClient.tsx` — that were writing directly alongside their
corresponding API routes). Eight new `SECURITY DEFINER` RPCs
(`sync_quiz_completion`, `sync_pathshala_completion`, `sync_nitya_completion`,
`complete_dharmveer`, `complete_stotram`, `complete_katha`,
`mark_panchang_viewed`, `claim_perfect_day_bonus`) now own every write, and
`daily_sadhana` had its table-wide `UPDATE`/`INSERT`/`DELETE` grant revoked
from `authenticated`/`anon`, with only `(user_id, date, japa_done,
streak_count)` explicitly re-granted — the one column pair this plan's
"stop rule" also would have deferred (the carried-streak algorithm in
`/api/japa/complete` was judged too complex to safely port into SQL). A
second, previously-undocumented bug was found and fixed in the same pass:
`/api/sadhana/perfect-day`'s atomic claim was a direct conditional
`UPDATE`, replayable by resetting `perfect_day_bonus_given` to `false`
directly — closed via the new `claim_perfect_day_bonus` RPC, a one-shot
atomic claim.

**Dharmveer's Open Question** (`supabase/migrations/20260708170000_dharm_veer_responses.sql`,
`src/app/api/dharm-veer/submit/route.ts`) — dharmveer now has the
independent evidence table this plan said didn't exist yet:
`dharm_veer_responses`, owner-only RLS (`SELECT`/`INSERT` policies,
deliberately no `UPDATE`/`DELETE` — an immutable log, same convention as
`nitya_karma_log`/`mala_sessions`), written exclusively by
`POST /api/dharm-veer/submit`. That route validates the submitted hero id
against the canonical roster (`getDharmVeerBySlug` — DB `dharm_veers` table
with the same static `DHARM_VEERS` fallback every other Dharm Veer surface
already uses) and computes the spiritual date server-side from the user's
own `profiles.timezone`, never from the request body. `/api/sadhana/perfect-day`
now derives `dharmveerDone` from this table instead of trusting
`daily_sadhana.dharmveer_done` — the last of the five perfect-day flags to
move off a bare trusted boolean. `daily_sadhana.dharmveer_done` itself is
unchanged and still populated (via the existing `complete_dharmveer` RPC,
now called server-side from the submit route) purely because it's read for
display in several unrelated places (Home, my-progress, Kul hub, native
home/progress-summary, weekly-summary cron, streak-freeze eligibility) —
none of those reads are reward-bearing, so leaving them on the display
cache was the minimal-blast-radius choice.

**What is still open, disclosed, not silently dropped:**

- `japa_done`/`streak_count` remain directly writable by `authenticated` —
  same stop-rule reasoning as this plan's own Slice 4 note.
- Dharmveer's evidence is now *proof of a swipe/read event*, not proof of
  genuine reflection — a user can still swipe fast/skip/share without
  absorbing the story. This is a real ceiling on what's verifiable
  server-side for a reading-based practice; the fix closes "spoofed with
  zero engagement," not "engaged shallowly."
- `dharm_veer_responses` has no `FK` to `dharm_veers.slug` (by design, see
  the migration's own comment on the static-fallback roster) — validation
  is application-layer only, in the submit route. A direct-DB attacker who
  found another way to reach `INSERT` (there is none via current grants)
  could still write junk `hero_id` values; this is judged an acceptable
  residual risk given RLS/grants already gate the only real entry point.
- The schema-wide P0-3 exposure on the *source* tables themselves
  (`mala_sessions`, `quiz_responses`, `nitya_karma_log`,
  `guided_path_progress`) — noted in the column-grant closure migration's
  own header — remains out of scope for both migrations.
