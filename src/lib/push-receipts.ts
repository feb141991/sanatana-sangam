import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { recordPushTokenEventBatch } from '@/lib/push-token-audit';

const EXPO_RECEIPTS_API_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const MIN_AGE_MS = 15 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RECEIPT_BATCH_SIZE = 300;

type ExpoReceipt = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

type PendingReceiptRow = {
  ticket_id: string;
  token: string;
  user_id?: string | null;
};

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

export async function checkPendingExpoPushReceipts() {
  const supabase = createServiceRoleSupabaseClient();
  const now = Date.now();
  const readyBefore = new Date(now - MIN_AGE_MS).toISOString();
  const expiredBefore = new Date(now - MAX_AGE_MS).toISOString();

  const { error: expireError, count: expiredCount } = await supabase
    .from('push_receipts_pending')
    .delete({ count: 'exact' })
    .lt('created_at', expiredBefore);
  if (expireError) console.warn('push_receipts_pending expire cleanup failed:', expireError.message);

  const { data: pending, error: pendingError } = await supabase
    .from('push_receipts_pending')
    .select('ticket_id, token, user_id')
    .lt('created_at', readyBefore)
    .limit(1500);

  if (pendingError) {
    throw new Error(`Could not read pending receipts: ${pendingError.message}`);
  }

  if (!pending || pending.length === 0) {
    return { candidates: 0, checked: 0, pruned_tokens: 0, expired_dropped: expiredCount ?? 0 };
  }

  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let checked = 0;
  let pruned = 0;
  const staleTokens: string[] = [];
  const staleTokenEvents: Array<{ token: string; userId?: string | null }> = [];
  const processedTicketIds: string[] = [];

  for (const batch of chunk(pending as PendingReceiptRow[], RECEIPT_BATCH_SIZE)) {
    const ticketIds = batch.map((row) => row.ticket_id);
    const response = await fetch(EXPO_RECEIPTS_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids: ticketIds }),
    });

    if (!response.ok) {
      console.error('Expo getReceipts batch failed:', response.status, await response.text().catch(() => ''));
      continue;
    }

    const payload = (await response.json().catch(() => null)) as { data?: Record<string, ExpoReceipt> } | null;
    const receipts = payload?.data ?? {};

    for (const row of batch) {
      const receipt = receipts[row.ticket_id];
      if (!receipt) continue;
      checked += 1;
      processedTicketIds.push(row.ticket_id);
      if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
        staleTokens.push(row.token);
        staleTokenEvents.push({ token: row.token, userId: row.user_id });
      }
    }
  }

  if (staleTokens.length > 0) {
    const uniqueStale = Array.from(new Set(staleTokens));
    const { error: pruneError, count } = await supabase
      .from('push_tokens')
      .delete({ count: 'exact' })
      .in('token', uniqueStale);
    if (pruneError) console.warn('stale push_tokens prune failed:', pruneError.message);
    pruned = count ?? 0;

    await recordPushTokenEventBatch(
      staleTokenEvents.map((e) => ({
        userId: e.userId,
        token: e.token,
        eventType: 'pruned_device_not_registered',
        reason: 'DeviceNotRegistered receipt from Expo',
        source: 'push-receipts',
      }))
    );
  }

  if (processedTicketIds.length > 0) {
    const { error: cleanupError } = await supabase
      .from('push_receipts_pending')
      .delete()
      .in('ticket_id', processedTicketIds);
    if (cleanupError) console.warn('push_receipts_pending cleanup failed:', cleanupError.message);
  }

  return {
    candidates: pending.length,
    checked,
    pruned_tokens: pruned,
    expired_dropped: expiredCount ?? 0,
  };
}
