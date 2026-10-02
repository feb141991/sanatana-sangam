import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { recordPushTokenEventBatch } from '@/lib/push-token-audit';

export type PushBindingSnapshot = { token: string; user_id: string; binding_version: string };

function isBinding(value: unknown): value is PushBindingSnapshot {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.token === 'string' && typeof row.user_id === 'string' && typeof row.binding_version === 'string';
}

/** Atomic compare-and-delete. A newer registration always survives an older error. */
export async function prunePushBindings(bindings: PushBindingSnapshot[], source: 'push-server' | 'push-receipts') {
  if (!bindings.length) return [] as PushBindingSnapshot[];
  const unique = new Map(bindings.map((row) => [`${row.token}:${row.user_id}:${row.binding_version}`, row]));
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.rpc('prune_native_push_bindings', { p_bindings: [...unique.values()] });
  if (error) throw new Error('Could not safely prune invalid push bindings');
  if (!Array.isArray(data) || !data.every(isBinding)) throw new Error('Invalid push prune acknowledgement');
  await recordPushTokenEventBatch(data.map((row) => ({
    userId: row.user_id, token: row.token, eventType: 'pruned_device_not_registered',
    reason: `DeviceNotRegistered ${source === 'push-server' ? 'ticket' : 'receipt'}; removed exact binding`, source,
  })));
  return data;
}
