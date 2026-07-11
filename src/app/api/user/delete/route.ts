import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// NOT the user-facing deletion flow. Kept only for internal/admin/testing
// use -- e.g. manually finishing off a test account without waiting out the
// cool-off window. As of this pass, Shoonaya has exactly ONE user-facing
// account-deletion behavior: POST /api/user/delete/request starts a 30-day
// cancellable cool-off (profiles.is_deleting / deletion_requested_at),
// POST /api/user/delete/cancel reverses it, and the daily
// /api/cron/purge-deleted-accounts cron performs the actual hard delete
// once the window elapses -- reusing the exact same
// auth.admin.deleteUser() + profiles delete sequence this route runs below.
// Nothing in the Profile page, the Settings delete-account wizard, or
// native's app/settings.tsx calls this route anymore. If you're adding a
// new "delete my account" entry point, it should call
// /api/user/delete/request, not this route.
export async function POST(req: NextRequest) {
  const { user, error: authError } = await getApiUser(req);
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { error: profileLookupError } = await admin
    .from('profiles')
    .select('id, is_banned')
    .eq('id', user.id)
    .single();

  if (profileLookupError) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  const { error: profileDeleteError } = await admin
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileDeleteError) {
    return NextResponse.json({ success: false, error: profileDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
