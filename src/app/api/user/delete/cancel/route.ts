import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cancels a pending account deletion within the 30-day cool-off window.
 * Called from ProfileClient.tsx's "Cancel Deletion Request" button and
 * native's Settings screen equivalent. Same auth story as
 * /api/user/delete/request -- getApiUser(req), RLS-scoped, own row only.
 */
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_deleting: false, deletion_requested_at: null })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, isDeleting: false });
}
