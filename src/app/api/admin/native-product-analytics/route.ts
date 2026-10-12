import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieError = await verifyAdminCookieAuth(request);
  if (cookieError) return cookieError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const daysParam = Number(request.nextUrl.searchParams.get('days') ?? 28);
  if (!Number.isInteger(daysParam) || daysParam < 1 || daysParam > 90) {
    return NextResponse.json({ error: 'days must be an integer from 1 to 90' }, { status: 400 });
  }

  // The generated Database RPC map still contains PostGIS/test-helper overloads
  // that make Supabase JS infer this typed client as Args=undefined. Keep the
  // explicit local contract narrow rather than widening the shared admin helper.
  const client = createAdminClient() as unknown as {
    rpc: (name: string, args: { p_days: number }) => Promise<{ data: unknown; error: { code?: string } | null }>;
  };
  const { data, error } = await client.rpc('get_native_product_analytics_summary', { p_days: daysParam });
  if (error) {
    console.error('[admin/native-product-analytics] summary query failed', { code: error.code });
    return NextResponse.json({ error: 'Product analytics summary is unavailable' }, { status: 503 });
  }
  return NextResponse.json({ days: daysParam, suppressedBelow: 20, rows: data ?? [] }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
