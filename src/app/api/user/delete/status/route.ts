import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { purgeAfterFromRequestedAt } from '@/lib/account-deletion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Reports whether the caller's account currently has a pending deletion, and
 * if so, when it was requested and when the purge cron will complete it.
 * Used by native's Settings screen to render the "scheduled for deletion on
 * <date>, cancel?" state without having to read profiles columns directly.
 */
export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_deleting, deletion_requested_at')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Profile not found' },
      { status: 404 }
    );
  }

  const isDeleting = Boolean(data.is_deleting);
  const deletionRequestedAt = (data.deletion_requested_at as string | null) ?? null;
  const purgeAfter = deletionRequestedAt ? purgeAfterFromRequestedAt(deletionRequestedAt) : null;
  const daysRemaining = purgeAfter
    ? Math.max(0, Math.ceil((new Date(purgeAfter).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return NextResponse.json({
    success: true,
    isDeleting,
    deletionRequestedAt,
    purgeAfter,
    daysRemaining,
  });
}
