import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { generateCardForPost } from "@/lib/marketing/social/pipeline";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  try {
    const result = await generateCardForPost(admin.supabase, id);
    const { data: variants } = await admin.supabase
      .from("social_post_variants")
      .select("*")
      .eq("post_id", id);

    return NextResponse.json({
      success: true,
      post: result.post,
      imagePreviewUrl: result.imagePreviewUrl,
      variants: variants ?? []
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate social post card" },
      { status: 500 }
    );
  }
}
