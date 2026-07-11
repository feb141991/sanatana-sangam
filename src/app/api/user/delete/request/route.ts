import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { purgeAfterFromRequestedAt } from '@/lib/account-deletion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Starts the 30-day cancellable account-deletion cool-off. This is now the
 * ONE canonical user-facing deletion entry point -- both the Profile page
 * Danger Zone quick action and the Settings delete-account wizard call this
 * (see ProfileClient.tsx / DeleteAccountClient.tsx), and native's
 * app/settings.tsx calls it too. Nothing user-facing calls
 * POST /api/user/delete directly anymore -- see that route's own comment
 * for why it still exists.
 *
 * Uses getApiUser(req) so this works from both web (cookie session) and
 * native (Bearer token via apiFetch) callers, and always writes to the
 * caller's own row under RLS -- user_id is never read from the request body.
 */
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Optional feedback from the Settings delete-account wizard
  // (DeleteAccountClient.tsx) -- folded into the admin-review breadcrumb
  // below when present. Never used for anything auth/identity-related; the
  // row being updated is always determined by getApiUser's user.id, never
  // by anything in the request body.
  const body = await req.json().catch(() => null) as { reason?: string; otherReason?: string } | null;
  const feedbackReason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : null;
  const feedbackDetail = typeof body?.otherReason === 'string' ? body.otherReason.slice(0, 200) : null;

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_deleting: true, deletion_requested_at: now })
    .eq('id', user.id)
    .select('is_deleting, deletion_requested_at')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Could not schedule deletion' },
      { status: 500 }
    );
  }

  // Best-effort admin-review breadcrumb, mirroring what ProfileClient.tsx's
  // old inline requestAccountDeletion() did. content_reports has RLS
  // enabled with zero CREATE POLICY statements anywhere in this repo's
  // schema (confirmed across supabase/step2_constraints_policies.sql,
  // supabase/public_schema.sql, live_schema_dump.sql) -- so this insert
  // will silently no-op under the RLS-scoped client used here. That's a
  // pre-existing gap in a different feature (the "report this post" flows
  // in AiReportButton.tsx / MandaliMembers.tsx hit the exact same wall) and
  // out of scope for this task. Not awaited-and-checked on purpose: a
  // failure here must never block the actual deletion request, which is the
  // part that matters. Flagged in the delivery report rather than silently
  // expanding scope to fix content_reports RLS.
  const reasonSummary = feedbackReason
    ? `User requested account deletion. Cool-off period started. Reason: ${feedbackReason}${feedbackDetail ? ` (${feedbackDetail})` : ''}`
    : 'User requested account deletion. Cool-off period started.';

  void supabase.from('content_reports').insert({
    reported_by: user.id,
    content_author_id: user.id,
    content_type: 'account_deletion',
    content_id: user.id,
    reason: reasonSummary,
    status: 'pending',
  });

  const deletionRequestedAt = data.deletion_requested_at as string;
  return NextResponse.json({
    success: true,
    isDeleting: true,
    deletionRequestedAt,
    purgeAfter: purgeAfterFromRequestedAt(deletionRequestedAt),
  });
}
