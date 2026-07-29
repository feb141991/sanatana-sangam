import { createServiceRoleSupabaseClient } from '@/lib/admin';

// Single source of truth for the account-deletion cool-off window, shared by
// the request/cancel/status API routes (src/app/api/user/delete/*), the
// account-deletion workflow, and the purge cron fallback so the window
// promised to the user in copy always matches what the backend enforces.
export const ACCOUNT_DELETION_COOL_OFF_DAYS = 30;

export function purgeAfterFromRequestedAt(deletionRequestedAt: string): string {
  return new Date(
    new Date(deletionRequestedAt).getTime() + ACCOUNT_DELETION_COOL_OFF_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}

type PendingDeletionRow = { id: string; deletion_requested_at: string };

export async function purgeDeletedAccountById(userId: string, expectedDeletionRequestedAt?: string) {
  const admin = createServiceRoleSupabaseClient();

  let query = admin
    .from('profiles')
    .select('id, deletion_requested_at')
    .eq('id', userId)
    .eq('is_deleting', true);

  if (expectedDeletionRequestedAt) query = query.eq('deletion_requested_at', expectedDeletionRequestedAt);

  const { data: row, error: queryError } = await query.maybeSingle();
  if (queryError) throw new Error(`Could not read pending deletion: ${queryError.message}`);
  if (!row) return { id: userId, success: false, skipped: true, reason: 'not_pending' };

  const purgeAfter = purgeAfterFromRequestedAt((row as PendingDeletionRow).deletion_requested_at);
  if (Date.now() < new Date(purgeAfter).getTime()) {
    return { id: userId, success: false, skipped: true, reason: 'cool_off_active', purgeAfter };
  }

  return await hardDeleteAccount(userId);
}

export async function purgeDueDeletedAccounts({ dryRun = false } = {}) {
  const admin = createServiceRoleSupabaseClient();
  const cutoff = new Date(Date.now() - ACCOUNT_DELETION_COOL_OFF_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: pending, error: queryError } = await admin
    .from('profiles')
    .select('id, deletion_requested_at')
    .eq('is_deleting', true)
    .lt('deletion_requested_at', cutoff);

  if (queryError) throw new Error(queryError.message);

  const targets = (pending ?? []) as PendingDeletionRow[];

  if (dryRun) {
    return {
      dryRun: true,
      cutoff,
      targetCount: targets.length,
      targetIds: targets.map((row) => row.id),
    };
  }

  const results: { id: string; success: boolean; error?: string }[] = [];
  for (const row of targets) {
    results.push(await hardDeleteAccount(row.id));
  }

  const purged = results.filter((result) => result.success).length;
  const failed = results.filter((result) => !result.success);

  return {
    dryRun: false,
    cutoff,
    targetCount: targets.length,
    purged,
    failed,
  };
}

async function hardDeleteAccount(userId: string): Promise<{ id: string; success: boolean; error?: string }> {
  const admin = createServiceRoleSupabaseClient();

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    const alreadyGone = /user not found/i.test(authDeleteError.message);
    if (!alreadyGone) {
      console.error(`account-deletion: auth delete failed for ${userId}:`, authDeleteError);
      return { id: userId, success: false, error: authDeleteError.message };
    }
  }

  const { error: profileDeleteError } = await admin.from('profiles').delete().eq('id', userId);
  if (profileDeleteError) {
    console.error(`account-deletion: profile delete failed for ${userId}:`, profileDeleteError);
    return { id: userId, success: false, error: profileDeleteError.message };
  }

  return { id: userId, success: true };
}
