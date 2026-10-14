import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import type { MarketingChannel } from "@/lib/marketing/types";
import {
  cancelCampaign,
  MarketingCampaignInputError,
  saveVariant,
  submitForReview,
  updateCampaignMetadata,
} from "@/lib/marketing/campaign-service";

const VALID_CHANNELS: MarketingChannel[] = ["email", "whatsapp", "instagram", "twitter", "linkedin"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;

  const { data: campaign, error } = await admin.supabase
    .from("marketing_campaigns")
    .select("*, marketing_campaign_variants(*)")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Fetch dispatch count summary
  const { data: dispatches } = await admin.supabase
    .from("marketing_dispatches")
    .select("status, channel")
    .eq("campaign_id", id);

  const dispatchSummary = (dispatches ?? []).reduce((acc: any, d: any) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ campaign, dispatchSummary });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if ("action" in body && body.action === "cancel") {
      const campaign = await cancelCampaign(admin.supabase, id);
      return NextResponse.json({ campaign });
    }

    if ("action" in body && body.action === "submit_review") {
      const campaign = await submitForReview(admin.supabase, id);
      return NextResponse.json({ campaign });
    }

    if ("action" in body && body.action === "update_metadata") {
      const hasTitle = "title" in body;
      const hasTradition = "target_tradition" in body;
      const hasSampradaya = "target_sampradaya" in body;
      const validTitle = !hasTitle || typeof body.title === "string";
      const validTradition = !hasTradition || typeof body.target_tradition === "string" || body.target_tradition === null;
      const validSampradaya = !hasSampradaya || typeof body.target_sampradaya === "string" || body.target_sampradaya === null;
      if ((!hasTitle && !hasTradition && !hasSampradaya) || !validTitle || !validTradition || !validSampradaya) {
        return NextResponse.json({ error: "Invalid campaign metadata" }, { status: 400 });
      }
      const campaign = await updateCampaignMetadata(admin.supabase, id, {
        target_tradition: "target_tradition" in body && (typeof body.target_tradition === "string" || body.target_tradition === null)
          ? body.target_tradition
          : undefined,
        target_sampradaya: "target_sampradaya" in body && (typeof body.target_sampradaya === "string" || body.target_sampradaya === null)
          ? body.target_sampradaya
          : undefined,
        title: "title" in body && typeof body.title === "string" ? body.title : undefined,
      });
      return NextResponse.json({ campaign });
    }

    if ("variant" in body && isRecord(body.variant)) {
      const variant = body.variant;
      if (!VALID_CHANNELS.includes(variant.channel as MarketingChannel) || typeof variant.body !== "string") {
        return NextResponse.json({ error: "Invalid campaign variant" }, { status: 400 });
      }
      const savedVariant = await saveVariant(admin.supabase, {
        campaign_id: id,
        channel: variant.channel as MarketingChannel,
        locale: typeof variant.locale === "string" ? variant.locale : "en",
        subject: typeof variant.subject === "string" || variant.subject === null ? variant.subject : undefined,
        body: variant.body,
        cta_text: typeof variant.cta_text === "string" || variant.cta_text === null ? variant.cta_text : undefined,
        cta_url: typeof variant.cta_url === "string" || variant.cta_url === null ? variant.cta_url : undefined,
        source_snapshot: isRecord(variant.source_snapshot)
          ? variant.source_snapshot
          : undefined,
      });
      return NextResponse.json({ variant: savedVariant });
    }

    return NextResponse.json({ error: "No recognized action or variant provided" }, { status: 400 });
  } catch (error: unknown) {
    const status = error instanceof MarketingCampaignInputError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Campaign update failed" }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;

  try {
    const campaign = await cancelCampaign(admin.supabase, id);
    return NextResponse.json({ campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
