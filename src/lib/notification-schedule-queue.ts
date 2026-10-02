import type { SupabaseClient } from '@supabase/supabase-js';

export interface NotificationScheduleDraft {
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  send_at: string;
  notification_key: string;
  metadata: Record<string, unknown>;
  status?: 'pending';
}

/**
 * Shared queue writer for flexible notification producers.
 *
 * Sorting by recipient and local date gives batched inserts a deterministic
 * lock acquisition order. Database triggers remain the atomic quota/spacing
 * boundary; this helper keeps every producer on the same idempotent contract.
 */
export async function enqueueNotificationSchedule(
  supabase: SupabaseClient<any>,
  drafts: readonly NotificationScheduleDraft[],
): Promise<{ queued: number; ignored: number }> {
  const ordered = [...drafts].sort((left, right) =>
    left.user_id.localeCompare(right.user_id)
      || String(left.metadata.local_date ?? '').localeCompare(String(right.metadata.local_date ?? ''))
      || left.send_at.localeCompare(right.send_at)
      || left.notification_key.localeCompare(right.notification_key),
  );

  let queued = 0;
  let pending = ordered;
  while (pending.length > 0) {
    // Keep at most one row per user/local date in a SQL statement. PostgreSQL
    // row triggers cannot see sibling rows from their own INSERT statement;
    // separate waves let each next row observe the slot reserved by the prior
    // wave, so spacing is applied instead of the statement guard rejecting an
    // otherwise valid multi-reminder day.
    const batch: NotificationScheduleDraft[] = [];
    const batchGroups = new Set<string>();
    const deferred: NotificationScheduleDraft[] = [];
    for (const draft of pending) {
      const group = `${draft.user_id}:${String(draft.metadata.local_date ?? '')}`;
      if (batch.length < 100 && !batchGroups.has(group)) {
        batch.push(draft);
        batchGroups.add(group);
      } else {
        deferred.push(draft);
      }
    }

    const rows = batch.map((draft) => ({ ...draft, status: 'pending' as const }));
    const { data, error } = await supabase
      .from('notification_schedule')
      .upsert(rows, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
      .select('id');

    if (error) {
      throw new Error(`Notification schedule admission failed: ${error.message}`);
    }
    queued += data?.length ?? 0;
    pending = deferred;
  }

  return { queued, ignored: ordered.length - queued };
}
