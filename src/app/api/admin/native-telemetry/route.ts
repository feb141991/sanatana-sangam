import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { fetchNativeTelemetryMonitoringMetrics } from '@/lib/monitoring/native-telemetry-aggregator';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  try {
    const metrics = await fetchNativeTelemetryMonitoringMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch native telemetry metrics' },
      { status: 500 }
    );
  }
}
