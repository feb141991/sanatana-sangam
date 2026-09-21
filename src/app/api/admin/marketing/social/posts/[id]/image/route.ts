import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { attachImageToPost } from "@/lib/marketing/social/pipeline";
import { isAllowedSocialImageType } from "@/lib/marketing/social/image-storage";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "An image file is required" }, { status: 400 });
  }
  if (!isAllowedSocialImageType(file.type)) {
    return NextResponse.json({ error: "Use webp, jpg, or png artwork" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  try {
    const post = await attachImageToPost(admin.supabase, id, bytes, file.type);
    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
