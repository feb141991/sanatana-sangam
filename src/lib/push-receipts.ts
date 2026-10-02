import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { hashPushToken } from '@/lib/push-token-audit';
import { prunePushBindings, type PushBindingSnapshot } from '@/lib/push-binding';

const EXPO_RECEIPTS_API_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const MIN_AGE_MS = 15 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = 30 * MAX_AGE_MS;
const RECEIPT_BATCH_SIZE = 300;

type PendingReceiptRow = {
  ticket_id: string; token: string; user_id: string | null;
  binding_version: string | null; created_at: string;
};
type Outcome = {
  ticket_id: string; status: 'ok' | 'error' | 'expired'; error: string | null;
  token_hash: string; prune_status: string | null;
};
type ExpoReceipt = { status: 'ok' | 'error'; details?: { error?: string } };

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

export async function checkPendingExpoPushReceipts() {
  const supabase = createServiceRoleSupabaseClient();
  const now = Date.now();
  const readyBefore = new Date(now - MIN_AGE_MS).toISOString();
  // Terminal evidence persists 30 days after checking, including late expiry.
  const { error: retentionError } = await supabase.from('push_receipts_pending').delete()
    .neq('receipt_status', 'pending').lt('checked_at', new Date(now - RETENTION_MS).toISOString());
  if (retentionError) console.warn('Push receipt retention cleanup failed');
  const { data: pending, error: pendingError } = await supabase.from('push_receipts_pending')
    .select('ticket_id, token, user_id, binding_version, created_at')
    .eq('receipt_status', 'pending').lt('created_at', readyBefore)
    .order('created_at', { ascending: true }).limit(1500);
  if (pendingError) throw new Error('Could not read pending push receipts');
  const rows = (pending ?? []) as PendingReceiptRow[];
  if (!rows.length) return { candidates: 0, checked: 0, pruned_tokens: 0, expired_dropped: 0, recorded: 0 };

  const outcomes: Outcome[] = [];
  const available: PendingReceiptRow[] = [];
  for (const row of rows) {
    if (Date.parse(row.created_at) <= now - MAX_AGE_MS) {
      outcomes.push({ ticket_id: row.ticket_id, status: 'expired', error: 'receipt_missing_after_24h',
        token_hash: hashPushToken(row.token), prune_status: null });
    } else available.push(row);
  }
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const invalid = new Map<string, PushBindingSnapshot>();
  let checked = 0;
  for (const batch of chunk(available, RECEIPT_BATCH_SIZE)) {
    try {
      const response = await fetch(EXPO_RECEIPTS_API_URL, {
        method: 'POST', headers, body: JSON.stringify({ ids: batch.map((row) => row.ticket_id) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) { console.warn('Expo receipt batch failed', response.status); continue; }
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object' || !('data' in payload) || !payload.data || typeof payload.data !== 'object') continue;
      const receipts = payload.data as Record<string, ExpoReceipt>;
      for (const row of batch) {
        const receipt = receipts[row.ticket_id];
        if (!receipt || (receipt.status !== 'ok' && receipt.status !== 'error')) continue;
        checked++;
        const code = receipt.status === 'error'
          ? (typeof receipt.details?.error === 'string' ? receipt.details.error.slice(0, 100) : 'unknown_provider_error') : null;
        const outcome: Outcome = { ticket_id: row.ticket_id, status: receipt.status, error: code,
          token_hash: hashPushToken(row.token), prune_status: null };
        if (code === 'DeviceNotRegistered') {
          if (row.binding_version && row.user_id) invalid.set(row.ticket_id, {
            token: row.token, user_id: row.user_id, binding_version: row.binding_version,
          });
          else outcome.prune_status = 'legacy_without_version';
        }
        outcomes.push(outcome);
      }
    } catch { console.warn('Expo receipt batch unavailable; retained for retry'); }
  }
  // A DB failure here leaves every pending ticket intact. An older error cannot
  // erase a refreshed/reassigned registration, and duplicate tickets audit once.
  const removed = await prunePushBindings([...invalid.values()], 'push-receipts');
  const removedKeys = new Set(removed.map((row) => `${row.token}:${row.user_id}:${row.binding_version}`));
  for (const outcome of outcomes) {
    const binding = invalid.get(outcome.ticket_id);
    if (binding) outcome.prune_status = removedKeys.has(`${binding.token}:${binding.user_id}:${binding.binding_version}`) ? 'pruned' : 'preserved_or_absent';
  }
  let recorded = 0;
  if (outcomes.length) {
    const { data, error } = await supabase.rpc('complete_native_push_receipts', { p_results: outcomes });
    if (error || typeof data !== 'number') throw new Error('Could not persist push receipt outcomes; pending receipts retained');
    recorded = data;
  }
  return { candidates: rows.length, checked, pruned_tokens: removed.length,
    // Backwards-compatible counter name; expired records are retained, not dropped.
    expired_dropped: outcomes.filter((row) => row.status === 'expired').length, recorded };
}
