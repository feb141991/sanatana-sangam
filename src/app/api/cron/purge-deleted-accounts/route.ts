import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOL_OFF_DAYS = 30;

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  const cutoff = new Date(Date.now() - COOL_OFF_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: pending, error: queryError } = await admin
    .from('profiles')
    .select('id, deletion_requested_at')
    .eq('is_deleting', true)
    .lt('deletion_requested_at', cutoff);

  if (queryError) {
    console.error('purge-deleted-accounts: query failed:', queryError);
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const targets = (pending ?? []) as { id: string; deletion_requested_at: string }[];

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      cutoff,
      targetCount: targets.length,
      targetIds: targets.map((row) => row.id),
    });
  }

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const row of targets) {
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(row.id);
    if (authDeleteError) {
      // Row already gone from auth (e.g. a retry after a partial prior
      // failure) shouldn't block cleaning up the leftover profile row.
      const alreadyGone = /user not found/i.test(authDeleteError.message);
      if (!alreadyGone) {
        console.error(`purge-deleted-accounts: auth delete failed for ${row.id}:`, authDeleteError);
        results.push({ id: row.id, success: false, error: authDeleteError.message });
        continue;
      }
    }

    const { error: profileDeleteError } = await admin.from('profiles').delete().eq('id', row.id);
    if (profileDeleteError) {
      console.error(`purge-deleted-accounts: profile delete failed for ${row.id}:`, profileDeleteError);
      results.push({ id: row.id, success: false, error: profileDeleteError.message });
      continue;
    }

    results.push({ id: row.id, success: true });
  }

  const purged = results.filter((result) => result.success).length;
  const failed = results.filter((result) => !result.success);

  return NextResponse.json({
    dryRun: false,
    cutoff,
    targetCount: targets.length,
    purged,
    failed,
  });
}
