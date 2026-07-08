# Phase 0 RLS Security Test Harness

This document outlines the usage of the Phase 0 Security Verification Script (`scripts/verify-rls.ts`). This script asserts that the live Supabase instance enforces the expected Row Level Security (RLS) policies for the native application.

## Prerequisites

Due to the destructive nature of some tests and the requirement for authentic user JWTs, **this script must only be run against a dedicated testing or staging Supabase project**, or against a local Docker instance. **DO NOT run against production.**

You must provide the following environment variables. The easiest way is to create a `.env.test` file in the root directory.

```env
# Target Supabase instance
NEXT_PUBLIC_SUPABASE_URL=https://<your-test-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# User A credentials (standard user)
TEST_USER_A_EMAIL=user_a@test.com
TEST_USER_A_PASSWORD=securepassword123

# User B credentials (standard user)
TEST_USER_B_EMAIL=user_b@test.com
TEST_USER_B_PASSWORD=securepassword123

# Web/API host for API route tests. Use a deployed preview/staging URL, not production.
WEB_API_BASE=https://your-preview.example.com
```

**Note:** Both User A and User B must already exist in the target testing database.

## Execution

Run the script using `tsx`:

```bash
# To run in live mode against your test project:
npx tsx scripts/verify-rls.ts

# To run in dry-run mode (if live credentials are not available):
DRY_RUN=true npx tsx scripts/verify-rls.ts
```

## Covered Test Cases

1. Standard authenticated user cannot update `profiles.is_pro = true`.
2. Standard authenticated user cannot update `profiles.subscription_status = 'pro'`.
3. Standard authenticated user cannot update another user’s profile.
4. User A cannot insert `post_upvotes` with `user_id` = User B.
5. User A cannot delete User B’s `post_upvotes`.
6. User A cannot insert/update `tirtha_places` directly through Supabase client.
7. User A cannot create `tirtha_saves` for User B.
8. User A cannot create `tirtha_checkins` for User B.
9. `/api/tirtha/place` returns 401 without auth.
10. `/api/tirtha/place` rejects invalid source/id/coordinate payloads.
11. User A cannot insert a Mandali post into User B's Mandali.
12. Spoofed `daily_sadhana` completion booleans (`japa_done`/`quiz_done`/`nitya_done`/`pathshala_done`/`dharmveer_done`) alone cannot claim the `/api/sadhana/perfect-day` bonus — the write itself is expected to *succeed* (P0-3's underlying `daily_sadhana` GRANT/RLS gap is not yet closed; that is a separate, larger remediation slice tracked in `docs/NATIVE_DAILY_COMPLETION_P0_REMEDIATION_PLAN.md`), but the endpoint must still refuse to award karma/seva/streak-freeze from those flags alone.
13. With genuine completion evidence present in `mala_sessions`/`quiz_responses`/`nitya_karma_log`/`guided_path_progress`, the perfect-day bonus is still awarded — proves the Slice 1 fix (re-deriving completion from source tables) did not break a real completion.

## Current Status

**BLOCKED FOR LIVE MODE:** This repository currently lacks safe dummy credentials to execute this test live in CI. Until a disposable test database is provisioned and injected via CI environment variables, run `DRY_RUN=true npx tsx scripts/verify-rls.ts`.

Dry-run mode reflects the expected protections after:

- `20260704112914_native_phase0_security_rls.sql`
- `20260704203733_native_phase0_mandali_security.sql`
- `src/app/api/sadhana/perfect-day/route.ts`'s Slice 1 fix (re-derives completion from source tables instead of trusting `daily_sadhana.*_done` — see `docs/NATIVE_DAILY_COMPLETION_P0_REMEDIATION_PLAN.md`)
