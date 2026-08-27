import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { fetchClientErrorMonitoringMetrics, purgeOldClientErrorEvents } from '@/lib/monitoring/client-error-aggregator';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  try {
    const metrics = await fetchClientErrorMonitoringMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch client error metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  try {
    const body = await request.json().catch(() => ({}));
    const retentionDays = typeof body.retentionDays === 'number' ? body.retentionDays : 30;
    const result = await purgeOldClientErrorEvents(retentionDays);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to purge client error events' },
      { status: 500 }
    );
  }
}
