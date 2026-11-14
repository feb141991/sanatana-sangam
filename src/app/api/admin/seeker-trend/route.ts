import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { buildSeekerTrend, seekerTrendWindowStart } from "@/lib/admin-seeker-trend";

export const dynamic = "force-dynamic";

const MONTHS = 12;
/** More rows than any month window should hold today; reaching it is reported, never hidden. */
const ROW_LIMIT = 5000;

/** New seekers per UTC month for the last 12 months (admin overview chart). */
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const now = new Date();

  const { data, error } = await (supabase.from("profiles") as any)
    .select("created_at")
    .gte("created_at", seekerTrendWindowStart(now, MONTHS))
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT);

  if (error) {
    // The database error stays in the server log; the admin sees a plain sentence.
    console.error("[admin/seeker-trend] profiles read failed:", error.code ?? "unknown");
    return NextResponse.json({ error: "Could not load the seeker trend" }, { status: 500 });
  }

  const rows = (Array.isArray(data) ? data : []) as Array<{ created_at: string | null }>;
  return NextResponse.json(
    buildSeekerTrend(
      rows.map((row) => row.created_at),
      now,
      MONTHS,
      rows.length >= ROW_LIMIT,
    ),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
