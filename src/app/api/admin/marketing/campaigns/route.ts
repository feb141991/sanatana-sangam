import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { createCampaign } from "@/lib/marketing/campaign-service";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  let query = admin.supabase
    .from("marketing_campaigns")
    .select("*, marketing_campaign_variants(*)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data ?? [], total: count ?? data?.length ?? 0 });
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const campaignKey = (body.campaign_key ?? "").trim();
  const title = (body.title ?? "").trim();

  if (!campaignKey || !title) {
    return NextResponse.json({ error: "campaign_key and title are required" }, { status: 400 });
  }

  try {
    const campaign = await createCampaign(admin.supabase, {
      campaign_key: campaignKey,
      title,
      campaign_type: body.campaign_type ?? "newsletter",
      source_type: body.source_type ?? "manual",
      source_occurrence_id: body.source_occurrence_id ?? null,
      created_by: admin.username,
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
