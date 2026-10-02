import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

export const dynamic = 'force-dynamic';

function count(value: unknown, name: string): number {
  if (!value || typeof value !== 'object' || !(name in value)) throw new Error('Missing push count');
  const n = (value as Record<string, unknown>)[name];
  if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0) throw new Error('Invalid push count');
  return n;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess(request);
  if ('response' in admin) return admin.response;
  try {
    const supabase = admin.supabase;
    const now = new Date();
    const until = now.toISOString();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const results = await Promise.all([
      supabase.rpc('native_push_monitoring_counts', { p_since: since, p_until: until }),
      supabase.from('push_receipts_pending').select('ticket_id, token_hash, user_id, created_at')
        .eq('receipt_status', 'pending').order('created_at', { ascending: true }).limit(100),
      supabase.from('notification_deliveries').select('id, user_id, provider, type, status, error_code, error_message, created_at, metadata')
        .eq('status', 'failed').gte('created_at', sevenDaysAgo).lt('created_at', until)
        .order('created_at', { ascending: false }).limit(100),
      supabase.from('notification_deliveries').select('id, user_id, provider, type, status, error_code, error_message, created_at, metadata')
        .gte('created_at', sevenDaysAgo).lt('created_at', until).order('created_at', { ascending: false }).limit(150),
    ]);
    if (results.some((result) => result.error)) throw new Error('Push monitoring query failed');
    const totals: unknown = results[0].data;
    const accepted = count(totals, 'expoAccepted');
    const failed = count(totals, 'expoFailed');
    const attempts = accepted + failed;
    return NextResponse.json({
      activeTokens: count(totals, 'activeTokens'), pendingReceiptsCount: count(totals, 'pendingReceiptsCount'),
      pendingReceipts: results[1].data ?? [],
      receiptOutcomes24h: { providerHandoffOk: count(totals, 'receiptOk'), failed: count(totals, 'receiptError'), expired: count(totals, 'receiptExpired'), trackingFailed: count(totals, 'receiptTrackingFailed') },
      last24h: {
        expo: { sent: accepted, failed, skipped: count(totals, 'expoSkipped'),
          // Compatibility key. This rate describes ticket acceptance, not display.
          successRate: attempts ? Math.round(accepted / attempts * 100) : null },
        onesignal: { sent: count(totals, 'legacyAccepted'), failed: count(totals, 'legacyFailed'), unconfigured: count(totals, 'legacyUnconfigured') },
      },
      recentFailures: results[2].data ?? [], allRecentDeliveries: results[3].data ?? [],
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Failed to aggregate push monitoring data' }, { status: 503 });
  }
}
