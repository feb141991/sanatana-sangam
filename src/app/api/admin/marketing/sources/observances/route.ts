import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { fetchPublishedObservancesForDateRange, buildObservanceSourceSnapshot } from "@/lib/marketing/sources/published-observance";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const startDate = searchParams.get("start_date") ?? now.toISOString().slice(0, 10);
  
  const future = new Date(now);
  future.setDate(future.getDate() + 30);
  const endDate = searchParams.get("end_date") ?? future.toISOString().slice(0, 10);

  try {
    const rows = await fetchPublishedObservancesForDateRange(admin.supabase, startDate, endDate);
    const snapshots = rows.map(r => buildObservanceSourceSnapshot(r));
    return NextResponse.json({ observances: snapshots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
