import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// --- Push Receipt Check Cron --------------------------------------------------
// Schedule: hourly.
//
// Expo push sends return a "ticket" immediately, but the real delivery
// outcome (including DeviceNotRegistered, meaning the token is dead and
// should stop being sent to) is only known later via a separate receipts
// call. OneSignal did this pruning invisibly on its own servers; this cron
// is the replacement now that we own token storage ourselves.
//
// Reads pending tickets from push_receipts_pending (populated by
// src/lib/push-server.ts at send time), skips anything younger than 15
// minutes (Expo's own guidance -- receipts aren't reliably ready before
// that), checks anything older than a day as expired/unrecoverable and
// just drops it, and for everything in between calls Expo's getReceipts
// endpoint and prunes push_tokens rows that come back DeviceNotRegistered.

const EXPO_RECEIPTS_API_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const MIN_AGE_MS = 15 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RECEIPT_BATCH_SIZE = 300; // Expo's documented per-request limit for getReceipts

type ExpoReceipt = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServiceRoleSupabaseClient();
  const now = Date.now();
  const readyBefore = new Date(now - MIN_AGE_MS).toISOString();
  const expiredBefore = new Date(now - MAX_AGE_MS).toISOString();

  try {
    // Drop anything too old to have a usable receipt anymore.
    const { error: expireError, count: expiredCount } = await supabase
      .from('push_receipts_pending')
      .delete({ count: 'exact' })
      .lt('created_at', expiredBefore);
    if (expireError) console.warn('push_receipts_pending expire cleanup failed:', expireError.message);

    const { data: pending, error: pendingError } = await supabase
      .from('push_receipts_pending')
      .select('ticket_id, token')
      .lt('created_at', readyBefore)
      .limit(1500);

    if (pendingError) {
      return NextResponse.json({ error: `Could not read pending receipts: ${pendingError.message}` }, { status: 500 });
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ message: 'No receipts ready to check', checked: 0, expired: expiredCount ?? 0 });
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
    const processedTicketIds: string[] = [];

    for (const batch of chunk(pending, RECEIPT_BATCH_SIZE)) {
      const ticketIds = batch.map((row) => row.ticket_id);
      const response = await fetch(EXPO_RECEIPTS_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids: ticketIds }),
      });

      if (!response.ok) {
        console.error('Expo getReceipts batch failed:', response.status, await response.text().catch(() => ''));
        continue; // leave this batch in push_receipts_pending, retry next hour
      }

      const payload = (await response.json().catch(() => null)) as { data?: Record<string, ExpoReceipt> } | null;
      const receipts = payload?.data ?? {};

      for (const row of batch) {
        const receipt = receipts[row.ticket_id];
        if (!receipt) continue; // not ready yet -- leave it, try again next run
        checked += 1;
        processedTicketIds.push(row.ticket_id);
        if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
          staleTokens.push(row.token);
        }
      }
    }

    if (staleTokens.length > 0) {
      const { error: pruneError, count } = await supabase
        .from('push_tokens')
        .delete({ count: 'exact' })
        .in('token', Array.from(new Set(staleTokens)));
      if (pruneError) console.warn('stale push_tokens prune failed:', pruneError.message);
      pruned = count ?? 0;
    }

    if (processedTicketIds.length > 0) {
      const { error: cleanupError } = await supabase
        .from('push_receipts_pending')
        .delete()
        .in('ticket_id', processedTicketIds);
      if (cleanupError) console.warn('push_receipts_pending cleanup failed:', cleanupError.message);
    }

    return NextResponse.json({
      message: 'Receipt check complete',
      candidates: pending.length,
      checked,
      pruned_tokens: pruned,
      expired_dropped: expiredCount ?? 0,
    });
  } catch (error) {
    console.error('Push receipt check cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Push receipt check cron crashed' },
      { status: 500 }
    );
  }
}
