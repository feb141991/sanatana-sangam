import { NextResponse } from 'next/server';

import { purgeDueDeletedAccounts } from '@/lib/account-deletion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Deliberately untyped createClient() (no `<Database>` generic) -- matching
// reset-leaderboard/route.ts and the documented reason in
// src/lib/api-auth.ts: passing the generated Database type to an admin
// client currently resolves several `.from(...)` calls to `never` under
// this repo's installed supabase-js version. Sidestepped here rather than
// touching src/types/database.ts, which other already-working typed admin
// callers depend on.

/**
 * Daily purge of accounts whose 30-day cancellable deletion cool-off has
 * elapsed. Counterpart to the request/cancel flow in
 * src/app/api/user/delete/request/route.ts and
 * src/app/api/user/delete/cancel/route.ts, which set/clear
 * profiles.is_deleting + profiles.deletion_requested_at. That flow only
 * ever schedules a deletion -- this cron is what actually completes it,
 * mirroring the same hard-delete /api/user/delete/route.ts performs:
 * auth.admin.deleteUser() followed by a profiles row delete.
 *
 * Auth is mandatory, not best-effort: this route requires CRON_SECRET to be
 * configured at all (missing config -> 500, never silently open) and every
 * request -- including ?dryRun=true -- must present it as
 * `Authorization: Bearer <CRON_SECRET>` (mismatch or missing -> 401).
 * dryRun still returns the target user IDs, but only after that same auth
 * check passes, so target IDs are never exposed to an unauthenticated
 * caller.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('purge-deleted-accounts: CRON_SECRET is not configured');
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  try {
    return NextResponse.json(await purgeDueDeletedAccounts({ dryRun }));
  } catch (error) {
    console.error('purge-deleted-accounts: purge failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Account deletion purge failed' },
      { status: 500 }
    );
  }
}
