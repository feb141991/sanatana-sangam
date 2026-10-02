import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { revokeAppleAuthorizationForUser } from '@/lib/apple-auth-service';

export const DELETION_REASONS = [
  { id: 'taking_break', label: 'Taking a temporary spiritual break' },
  { id: 'too_many_notifications', label: 'Too many notifications or reminders' },
  { id: 'privacy_concerns', label: 'Privacy or data concerns' },
  { id: 'not_useful', label: 'Not finding the practice features helpful' },
  { id: 'technical_issues', label: 'App performance or technical bugs' },
  { id: 'other', label: 'Other reason', requireDetails: true },
] as const;

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

type StorageAdmin = ReturnType<typeof createServiceRoleSupabaseClient>;

const STORAGE_LIST_PAGE_SIZE = 100;
const STORAGE_REMOVE_BATCH_SIZE = 100;
const STORAGE_MAX_FOLDER_DEPTH = 5;

// Buckets whose objects are addressed by user id, and the prefixes to clear.
// `avatars` holds `{userId}/avatar.*` and `profiles/{userId}/home_cover_*`.
// `pathshala-recordings` is assumed to use the same `{userId}/` prefix; no
// upload code exists yet, so confirm the layout when recordings ship. NOT
// `kuls/{kulId}/...` in avatars: that is shared family content owned by the
// Kul, and must survive one member's account deletion. `shoonaya-tts-cache`
// is shared content keyed by text, not by user.
function userStorageTargets(userId: string) {
  return [
    { bucket: 'avatars', prefixes: [userId, `profiles/${userId}`] },
    { bucket: 'pathshala-recordings', prefixes: [userId] },
  ];
}

// Lists every object under a prefix. Storage `list` returns one folder level
// and at most one page per call, so a single call silently misses files once
// a user has more than a page of them or any nested folder. Folders come back
// as entries with a null id.
async function collectObjectPaths(
  admin: StorageAdmin,
  bucket: string,
  prefix: string,
  depth = 0,
): Promise<string[]> {
  const paths: string[] = [];

  for (let offset = 0; ; offset += STORAGE_LIST_PAGE_SIZE) {
    const { data: entries, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: STORAGE_LIST_PAGE_SIZE, offset });
    if (error) throw new Error(error.message);
    if (!entries || entries.length === 0) break;

    for (const entry of entries) {
      const fullPath = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        if (depth < STORAGE_MAX_FOLDER_DEPTH) paths.push(...await collectObjectPaths(admin, bucket, fullPath, depth + 1));
      } else {
        paths.push(fullPath);
      }
    }

    if (entries.length < STORAGE_LIST_PAGE_SIZE) break;
  }

  return paths;
}

// Deletes the user's own storage objects. Best-effort per prefix: a Storage
// failure is logged but never blocks the account deletion itself, so a
// transient Storage outage can't leave a user stuck mid-deletion.
async function deleteUserStorageObjects(admin: StorageAdmin, userId: string) {
  for (const { bucket, prefixes } of userStorageTargets(userId)) {
    for (const prefix of prefixes) {
      try {
        const paths = await collectObjectPaths(admin, bucket, prefix);
        for (let index = 0; index < paths.length; index += STORAGE_REMOVE_BATCH_SIZE) {
          const { error: removeError } = await admin.storage
            .from(bucket)
            .remove(paths.slice(index, index + STORAGE_REMOVE_BATCH_SIZE));
          if (removeError) {
            console.warn(`account-deletion: storage remove failed for ${bucket}/${prefix}:`, removeError.message);
          }
        }
      } catch (err) {
        console.warn(
          `account-deletion: storage cleanup exception for ${bucket}/${prefix}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
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

  // Clean up non-cascading child references before auth delete
  await admin.from("recommendations").delete().eq("user_id", userId);
  await admin.from("calendar_subscriptions").delete().eq("user_id", userId);
  await admin.from("apple_auth_tokens").delete().eq("user_id", userId);

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
