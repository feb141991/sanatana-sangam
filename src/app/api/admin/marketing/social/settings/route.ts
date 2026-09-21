import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const [configRes, pauseRes] = await Promise.all([
    admin.supabase.from("social_publishing_config").select("*").order("content_type"),
    admin.supabase.from("social_publishing_global_pause").select("*").eq("id", true).maybeSingle()
  ]);

  if (configRes.error) return NextResponse.json({ error: configRes.error.message }, { status: 500 });
  if (pauseRes.error) return NextResponse.json({ error: pauseRes.error.message }, { status: 500 });

  return NextResponse.json({ config: configRes.data ?? [], globalPause: pauseRes.data });
}

/**
 * Updates one content_type's config (automation_mode, destination_account_ids,
 * publish_time_local) OR the global pause flags -- never both in one call, so
 * each change is an explicit, auditable action. version is bumped here, not
 * client-supplied, and social_posts.policy_version is what traces a given
 * post back to which revision produced its frozen policy.
 */
export async function PUT(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = await request.json().catch(() => ({}));

  if (body.target === "config") {
    const contentType = body.content_type;
    if (contentType !== "festival" && contentType !== "general") {
      return NextResponse.json({ error: "content_type must be 'festival' or 'general'" }, { status: 400 });
    }
    const automationMode = body.automation_mode;
    if (!["manual", "automatic", "paused"].includes(automationMode)) {
      return NextResponse.json({ error: "automation_mode must be manual, automatic, or paused" }, { status: 400 });
    }

    const { data: current, error: currentError } = await admin.supabase
      .from("social_publishing_config")
      .select("version")
      .eq("content_type", contentType)
      .single();
    if (currentError || !current) return NextResponse.json({ error: "Config row not found" }, { status: 404 });

    const { data, error } = await admin.supabase
      .from("social_publishing_config")
      .update({
        automation_mode: automationMode,
        destination_account_ids: Array.isArray(body.destination_account_ids) ? body.destination_account_ids : [],
        publish_time_local: body.publish_time_local ?? null,
        version: current.version + 1,
        updated_by: admin.username,
        updated_at: new Date().toISOString()
      })
      .eq("content_type", contentType)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ config: data });
  }

  if (body.target === "global_pause") {
    const { data, error } = await admin.supabase
      .from("social_publishing_global_pause")
      .update({
        generation_paused: Boolean(body.generation_paused),
        publishing_paused: Boolean(body.publishing_paused),
        updated_by: admin.username,
        updated_at: new Date().toISOString()
      })
      .eq("id", true)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ globalPause: data });
  }

  return NextResponse.json({ error: "target must be 'config' or 'global_pause'" }, { status: 400 });
}
