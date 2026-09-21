import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { decryptSocialToken } from "@/lib/marketing/social/token-crypto";
import { findReconciliationCandidates, resolveReconciliation } from "@/lib/marketing/social/reconciliation";
import type { SocialPlatformAccount, SocialPostVariant } from "@/lib/marketing/social/types";

async function loadVariantAndAccount(supabase: any, postId: string, variantId: string) {
  const { data: variant, error: variantError } = await supabase
    .from("social_post_variants")
    .select("*, social_platform_accounts:approved_platform_account_id(*)")
    .eq("id", variantId)
    .eq("post_id", postId)
    .single();
  if (variantError || !variant) throw new Error("Variant not found");
  return variant as SocialPostVariant & { social_platform_accounts: SocialPlatformAccount | null };
}

/** Surfaces candidates for an outcome_unknown variant. Facebook/Instagram
 * get a heuristic recent-posts match; LinkedIn always returns []. Never
 * mutates anything. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id, variantId } = await params;

  try {
    const variant = await loadVariantAndAccount(admin.supabase, id, variantId);
    if (variant.publish_status !== "outcome_unknown") {
      return NextResponse.json({ error: `Variant is '${variant.publish_status}', not outcome_unknown -- nothing to investigate` }, { status: 409 });
    }
    if (!variant.social_platform_accounts?.access_token_enc) {
      return NextResponse.json({ candidates: [], note: "No connected account/token available to search for candidates" });
    }

    const accessToken = decryptSocialToken(variant.social_platform_accounts.access_token_enc, variant.social_platform_accounts.key_version);
    const candidates = await findReconciliationCandidates(variant, variant.social_platform_accounts, accessToken);
    return NextResponse.json({ candidates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Commits a human's investigation result via the transactional RPC. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { variantId } = await params;
  const body = await request.json().catch(() => ({}));
  const resolution = body.resolution;
  if (resolution !== "confirmed_published" && resolution !== "confirmed_not_published") {
    return NextResponse.json({ error: "resolution must be 'confirmed_published' or 'confirmed_not_published'" }, { status: 400 });
  }
  if (resolution === "confirmed_published" && !body.external_post_id) {
    return NextResponse.json({ error: "external_post_id is required when confirming a match was published" }, { status: 400 });
  }

  try {
    await resolveReconciliation(admin.supabase, {
      variantId,
      adminIdentifier: admin.username,
      resolution,
      externalPostId: body.external_post_id ?? null,
      permalinkUrl: body.permalink_url ?? null,
      notes: body.notes ?? null
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
