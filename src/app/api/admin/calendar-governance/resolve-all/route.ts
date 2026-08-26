import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  try {
    const { count, error } = await (supabase
      .from("calendar_integrity_findings") as any)
      .update({ is_open: false, resolved_at: new Date().toISOString() })
      .eq("is_open", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resolvedCount: count ?? 0,
      message: "All open calendar integrity findings marked as resolved."
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to resolve findings" },
      { status: 500 }
    );
  }
}
