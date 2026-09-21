import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { data, error } = await admin.supabase
    .from("social_general_themes")
    .select("*")
    .order("display_order")
    .order("title");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ themes: data ?? [] });
}

/**
 * grounding_material is required, not optional -- a general theme with no
 * factual/spiritual backing must stay withheld rather than post generic
 * prose (AGENTS.md Spiritual Content Integrity; theme-selector.ts's
 * selectGeneralThemeCandidate independently re-checks this at selection
 * time too, so this is defense in depth, not the only gate).
 */
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const promptSeed = String(body.prompt_seed ?? "").trim();
  const groundingMaterial = String(body.grounding_material ?? "").trim();

  if (!title || !promptSeed || !groundingMaterial) {
    return NextResponse.json({ error: "title, prompt_seed, and grounding_material are all required" }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from("social_general_themes")
    .insert({
      title,
      prompt_seed: promptSeed,
      grounding_material: groundingMaterial,
      is_active: body.is_active !== false,
      display_order: Number(body.display_order ?? 0) || 0
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ theme: data });
}
