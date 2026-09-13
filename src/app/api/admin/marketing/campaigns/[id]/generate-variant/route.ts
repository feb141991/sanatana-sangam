import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { saveVariant } from "@/lib/marketing/campaign-service";
import { draftChannelCopy } from "@/lib/marketing/ai-generator";
import { getPublishableOccurrenceById, buildObservanceSourceSnapshot } from "@/lib/marketing/sources/published-observance";
import type { MarketingChannel, MarketingSourceSnapshot } from "@/lib/marketing/types";

const VALID_CHANNELS: MarketingChannel[] = ["email", "whatsapp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const { data: campaign } = await admin.supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("id", id)
    .single();
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "draft" && campaign.status !== "in_review") {
    return NextResponse.json(
      { error: "Can only regenerate copy for campaigns in draft or in_review status" },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const channel = body.channel as MarketingChannel;
  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Valid channel (email or whatsapp) is required" }, { status: 400 });
  }

  const strategyPrompt = typeof body.strategy_prompt === "string" && body.strategy_prompt.trim()
    ? body.strategy_prompt.trim()
    : null;

  let sourceSnapshot: MarketingSourceSnapshot | null = null;
  let sourceCitations: unknown[] = [];

  if (campaign.source_type === "published_observance" && campaign.source_occurrence_id) {
    const occurrence = await getPublishableOccurrenceById(admin.supabase, campaign.source_occurrence_id);
    if (!occurrence) {
      return NextResponse.json({ error: "Source occurrence is not currently publishable" }, { status: 422 });
    }
    sourceSnapshot = buildObservanceSourceSnapshot(occurrence);
    sourceCitations = [
      {
        source: sourceSnapshot.verified_source ?? "CANONICAL_RULES",
        occurrence_id: sourceSnapshot.occurrence_id,
        slug: sourceSnapshot.slug,
      },
    ];
  }

  try {
    const draft = await draftChannelCopy({
      channel,
      sourceSnapshot,
      strategyPrompt,
    });

    const bodyOk = Boolean(draft.body?.trim());
    const subjectOk = channel !== "email" || Boolean(draft.subject?.trim());
    if (!bodyOk || !subjectOk) {
      return NextResponse.json({ error: "Generation produced empty content" }, { status: 422 });
    }

    const variant = await saveVariant(admin.supabase, {
      campaign_id: campaign.id,
      channel,
      subject: draft.subject ?? null,
      body: draft.body,
      cta_text: draft.cta_text ?? null,
      cta_url: draft.cta_url ?? null,
      source_snapshot: sourceSnapshot ?? {},
      source_citations: sourceCitations,
      generation_provenance: {
        model_used: draft.modelUsed,
        provider: draft.provider,
        generated_at: new Date().toISOString(),
        regenerated_by: admin.username,
        ...(strategyPrompt ? { strategy_prompt_used: true } : {}),
      },
      generation_metadata: {
        source_type: campaign.source_type,
        ...(strategyPrompt ? { strategy_prompt: strategyPrompt } : {}),
      },
    });

    return NextResponse.json({ ok: true, variant, draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 });
  }
}
