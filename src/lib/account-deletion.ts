import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { revokeAppleAuthorizationForUser } from '@/lib/apple-auth-service';

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

// Deletes the user's own files from the `avatars` bucket -- the only bucket
// that currently holds user-owned content addressed by userId (confirmed
// live: `{userId}/avatar.*` from profile photo uploads and
// `profiles/{userId}/home_cover_*` from home-cover uploads). Does NOT touch
// `kuls/{kulId}/...` -- that's shared family content owned by the Kul, not
// any single member, and must survive one member's account deletion.
// Best-effort: a Storage failure is logged but never blocks the account
// deletion itself, so a transient Storage outage can't leave a user stuck
// mid-deletion.
async function deleteUserStorageObjects(admin: ReturnType<typeof createServiceRoleSupabaseClient>, userId: string) {
  const prefixes = [userId, `profiles/${userId}`];

  for (const prefix of prefixes) {
    try {
      const { data: files, error: listError } = await admin.storage.from('avatars').list(prefix);
      if (listError) {
        console.warn(`account-deletion: storage list failed for ${prefix}:`, listError.message);
        continue;
      }
      if (!files || files.length === 0) continue;

      const paths = files.map((file) => `${prefix}/${file.name}`);
      const { error: removeError } = await admin.storage.from('avatars').remove(paths);
      if (removeError) {
        console.warn(`account-deletion: storage remove failed for ${prefix}:`, removeError.message);
      }
    } catch (err) {
      console.warn(
        `account-deletion: storage cleanup exception for ${prefix}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}

async function hardDeleteAccount(userId: string): Promise<{ id: string; success: boolean; error?: string }> {
  const admin = createServiceRoleSupabaseClient();

  // ── Apple TN3194 revocation (best-effort, never blocks deletion) ─────────
  // Must be called BEFORE auth.admin.deleteUser so the auth.identities record
  // is still present for identity-binding validation. Any non-'revoked' outcome
  // is logged but does not abort deletion. Apple requires deletion succeeds even
  // when Apple credentials are unavailable. ON DELETE CASCADE is the final net.
  const revokeResult = await revokeAppleAuthorizationForUser(userId);
  if (revokeResult !== 'revoked' && revokeResult !== 'not_found') {
    console.warn(`account-deletion: Apple revocation outcome for ${userId}: ${revokeResult}`);
  }

  await deleteUserStorageObjects(admin, userId);

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
