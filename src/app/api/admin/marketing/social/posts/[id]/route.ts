import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { getDraftImagePreviewUrl } from "@/lib/marketing/social/pipeline";
import { computeSocialVariantContentHash } from "@/lib/marketing/social/content-hash";
import type { SocialPost, SocialPostVariant } from "@/lib/marketing/social/types";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;

  const { data: post, error: postError } = await admin.supabase.from("social_posts").select("*").eq("id", id).single();
  if (postError || !post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const { data: variants, error: variantsError } = await admin.supabase
    .from("social_post_variants")
    .select("*")
    .eq("post_id", id)
    .order("platform");
  if (variantsError) return NextResponse.json({ error: variantsError.message }, { status: 500 });

  let imagePreviewUrl: string | null = null;
  try {
    imagePreviewUrl = await getDraftImagePreviewUrl(admin.supabase, post as SocialPost);
  } catch {
    imagePreviewUrl = null;
  }

  const { data: attempts } = await admin.supabase
    .from("social_publish_attempts")
    .select("*")
    .in("variant_id", (variants ?? []).map((v: { id: string }) => v.id))
    .order("created_at", { ascending: false });

  return NextResponse.json({ post, variants: variants ?? [], imagePreviewUrl, attempts: attempts ?? [] });
}

/** Edits caption/hashtags/cta_url for one variant. The bump_social_variant_content_version
 * trigger clears approval on any real change server-side -- this route does not need to
 * duplicate that logic, only pass the edit through. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const variantId = body.variant_id;
  if (!variantId) return NextResponse.json({ error: "variant_id is required" }, { status: 400 });

  if (typeof body.internal_label === "string" && body.internal_label.trim()) {
    await admin.supabase.from("social_posts").update({ internal_label: body.internal_label.trim() }).eq("id", id);
  }

  const hasContentEdit = typeof body.caption === "string" || Array.isArray(body.hashtags) || typeof body.cta_url === "string";
  if (!hasContentEdit) {
    return NextResponse.json({ ok: true });
  }

  const { data: existing, error: existingError } = await admin.supabase
    .from("social_post_variants")
    .select("*")
    .eq("id", variantId)
    .eq("post_id", id)
    .single();
  if (existingError || !existing) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  const current = existing as SocialPostVariant;

  const merged = {
    caption: typeof body.caption === "string" ? body.caption : current.caption,
    hashtags: Array.isArray(body.hashtags) ? body.hashtags.filter((h: unknown) => typeof h === "string") : current.hashtags,
    cta_url: typeof body.cta_url === "string" ? body.cta_url : current.cta_url
  };

  // content_hash is computed here, in Node, on every write that touches
  // these fields -- matching campaign-service.ts's computeContentHash
  // convention; the DB trigger only bumps content_version/clears approval,
  // it does not compute the hash itself.
  const { data, error } = await admin.supabase
    .from("social_post_variants")
    .update({
      ...merged,
      content_hash: computeSocialVariantContentHash({
        platform: current.platform,
        caption: merged.caption,
        hashtags: merged.hashtags,
        cta_url: merged.cta_url,
        source_citations: current.source_citations
      })
    })
    .eq("id", variantId)
    .eq("post_id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variant: data });
}
