import { createServiceRoleSupabaseClient } from '@/lib/admin';

export type NotificationDeliveryStatus = 'sent' | 'dry_run' | 'disabled' | 'failed' | 'unconfigured' | 'skipped';

export interface AuditRecordPayload {
  userId?: string;
  notificationId?: string;
  notificationKey?: string;
  type: string;
  status: NotificationDeliveryStatus;
  providerMessageId?: string;
  dryRun?: boolean;
  disabled?: boolean;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

function buildAuditRow(payload: AuditRecordPayload) {
  return {
    user_id: payload.userId || null,
    notification_id: payload.notificationId || null,
    notification_key: payload.notificationKey || null,
    channel: 'push',
    provider: 'onesignal',
    provider_message_id: payload.providerMessageId || null,
    type: payload.type,
    status: payload.status,
    dry_run: payload.dryRun ?? false,
    disabled: payload.disabled ?? false,
    error_code: payload.errorCode || null,
    error_message: payload.errorMessage || null,
    metadata: payload.metadata || {},
  };
}

export async function recordNotificationDelivery(payload: AuditRecordPayload): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const row = buildAuditRow(payload);

    const { error } = await supabase.from('notification_deliveries').insert(row);

    if (error) {
      console.warn(`[notification-audit] Failed to insert audit for type=${payload.type}: ${error.message}`);
    }
  } catch (err) {
    console.warn(`[notification-audit] Caught exception inserting audit for type=${payload.type}:`, err instanceof Error ? err.message : String(err));
  }
}

export async function recordNotificationDeliveryBatch(payloads: AuditRecordPayload[]): Promise<void> {
  if (!payloads.length) return;
  
  try {
    const supabase = createServiceRoleSupabaseClient();
    const rows = payloads.map(buildAuditRow);

    const { error } = await supabase.from('notification_deliveries').insert(rows);

    if (error) {
      console.warn(`[notification-audit] Failed to insert ${payloads.length} audit records: ${error.message}`);
    }
  } catch (err) {
    console.warn(`[notification-audit] Caught exception inserting ${payloads.length} audit records:`, err instanceof Error ? err.message : String(err));
  }
}

export async function recordNotificationSkipped(
  payload: Omit<AuditRecordPayload, 'status'> & { status: 'dry_run' | 'disabled' | 'unconfigured' }
): Promise<void> {
  return recordNotificationDelivery(payload);
}
