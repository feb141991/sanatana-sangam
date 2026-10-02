import type { SupabaseClient } from '@supabase/supabase-js';

const LOOKUP_BATCH_SIZE = 500;

export type DeletingRecipientsResult = {
  deletingUserIds: Set<string>;
  error: { message: string } | null;
};

/**
 * Which of these users are in their account-deletion cool-off. Every push goes
 * through one sender, so checking here keeps the "notifications stop
 * immediately" promise regardless of which producer built the message.
 *
 * Callers must treat `error` as "unknown", not as "nobody is deleting": a
 * failed lookup has to stop the send rather than push to a deleting account.
 */
export async function findDeletingUserIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<DeletingRecipientsResult> {
  const deletingUserIds = new Set<string>();
  const unique = Array.from(new Set(userIds.filter(Boolean)));

  for (let start = 0; start < unique.length; start += LOOKUP_BATCH_SIZE) {
    const batch = unique.slice(start, start + LOOKUP_BATCH_SIZE);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .in('id', batch)
      .eq('is_deleting', true);

    if (error) return { deletingUserIds: new Set(), error: { message: error.message } };
    for (const row of (data ?? []) as Array<{ id: string }>) deletingUserIds.add(row.id);
  }

  return { deletingUserIds, error: null };
}
