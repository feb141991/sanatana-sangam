import { createServiceRoleSupabaseClient } from '@/lib/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export type DispatchDecision = 'sent' | 'skipped' | 'failed';

export interface NotificationDispatchEventPayload {
  userId?: string | null;
  notificationKey?: string | null;
  notificationType?: string | null;
  decision: DispatchDecision;
  reason?: string | null;
  provider?: string;
}

function buildDispatchEventRow(payload: NotificationDispatchEventPayload) {
  return {
    user_id: payload.userId || null,
    notification_key: payload.notificationKey || null,
    notification_type: payload.notificationType || null,
    decision: payload.decision,
    reason: payload.reason || null,
    provider: payload.provider || 'expo',
  };
}

export async function recordNotificationDispatchBatch(
  payloads: NotificationDispatchEventPayload[],
  client?: SupabaseClient
): Promise<void> {
  if (!payloads.length) return;

  try {
    const supabase = client ?? createServiceRoleSupabaseClient();
    const rows = payloads.map(buildDispatchEventRow);

    // Insert in batches of 100 to avoid payload size constraints
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase.from('notification_dispatch_events').insert(batch);

      if (error) {
        console.warn(`[dispatch-audit] Failed to insert ${batch.length} dispatch events: ${error.message}`);
      }
    }
  } catch (err) {
    console.warn(
      `[dispatch-audit] Caught exception inserting ${payloads.length} dispatch events:`,
      err instanceof Error ? err.message : String(err)
    );
  }
}
