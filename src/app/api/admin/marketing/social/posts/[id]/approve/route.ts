import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { approvePost } from "@/lib/marketing/social/pipeline";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const assignments = body.variant_account_assignments;
  if (!assignments || typeof assignments !== "object") {
    return NextResponse.json({ error: "variant_account_assignments (variant_id -> platform_account_id) is required" }, { status: 400 });
  }

  try {
    const post = await approvePost(admin.supabase, id, admin.username, assignments);
    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
