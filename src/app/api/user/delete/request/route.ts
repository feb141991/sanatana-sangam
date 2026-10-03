import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { purgeAfterFromRequestedAt } from '@/lib/account-deletion';
import { describeDeletionFeedback } from '@/lib/account-deletion-reasons';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { shouldUseVercelWorkflowRuntime } from '@/lib/workflow-runtime';
import { accountDeletionCooloffWorkflow } from '@/workflows/account-deletion';

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
    return getApiAuthFailureResponse(authError);
  }

  // Optional feedback from the Settings delete-account wizard
  // (DeleteAccountClient.tsx) -- folded into the admin-review breadcrumb
  // below when present. Never used for anything auth/identity-related; the
  // row being updated is always determined by getApiUser's user.id, never
  // by anything in the request body.
  // `reason` is a DELETION_REASONS id (account-deletion-reasons.ts); older
  // clients that send label text are kept but marked [unlisted].
  const body = await req.json().catch(() => null) as { reason?: unknown; otherReason?: unknown } | null;
  const feedback = describeDeletionFeedback(body?.reason, body?.otherReason);

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

  const adminSupabase = createServiceRoleSupabaseClient();

  // 1. Immediately revoke push tokens for this user so device push notifications
  // cease today across all background crons and queues.
  try {
    await adminSupabase.from('push_tokens').delete().eq('user_id', user.id);
  } catch (tokenErr) {
    console.error('[delete/request] push_tokens revocation failed:', tokenErr);
  }

  // 2. Persist exit feedback using service-role client so RLS does not silently discard it.
  const reasonSummary = feedback
    ? `User requested account deletion. Cool-off period started. Reason: ${feedback}`
    : 'User requested account deletion. Cool-off period started.';

  try {
    await adminSupabase.from('content_reports').insert({
      reported_by: user.id,
      content_author_id: user.id,
      content_type: 'account_deletion',
      content_id: user.id,
      reason: reasonSummary,
      status: 'pending',
    });
  } catch (feedbackErr) {
    console.error('[delete/request] content_reports feedback write failed:', feedbackErr);
  }

  const deletionRequestedAt = data.deletion_requested_at as string;
  let workflowRunId: string | null = null;
  if (shouldUseVercelWorkflowRuntime()) {
    try {
      const run = await start(accountDeletionCooloffWorkflow, [{
        userId: user.id,
        deletionRequestedAt,
      }]);
      workflowRunId = run.runId;
    } catch (workflowError) {
      // Do not block the user-facing deletion request: the existing
      // purge-deleted-accounts cron remains as a safety net for this release.
      console.error('account deletion workflow start failed:', workflowError);
    }
  }

  return NextResponse.json({
    success: true,
    isDeleting: true,
    deletionRequestedAt,
    purgeAfter: purgeAfterFromRequestedAt(deletionRequestedAt),
    workflowRunId,
  });
}
