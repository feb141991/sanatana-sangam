import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title.trim();
  if (typeof body.prompt_seed === "string") update.prompt_seed = body.prompt_seed.trim();
  if (typeof body.grounding_material === "string") update.grounding_material = body.grounding_material.trim();
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;
  if (typeof body.display_order === "number") update.display_order = body.display_order;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No recognized fields to update" }, { status: 400 });
  }
  if (update.grounding_material === "") {
    return NextResponse.json({ error: "grounding_material cannot be cleared to empty -- deactivate the theme instead" }, { status: 400 });
  }

  const { data, error } = await admin.supabase.from("social_general_themes").update(update).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ theme: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  // Soft-delete via is_active=false -- a theme referenced by
  // social_posts.source_general_theme_id (on delete set null) must not
  // silently orphan historical posts' source attribution.
  const { error } = await admin.supabase.from("social_general_themes").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
