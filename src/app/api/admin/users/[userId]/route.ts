import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;
  const { userId } = await params;

  const body = await request.json().catch(() => null);
  
  const updateData: any = {};
  if (typeof body?.isAdmin === "boolean") updateData.is_admin = body.isAdmin;
  if (typeof body?.isBanned === "boolean") updateData.is_banned = body.isBanned;
  if (body?.banReason) updateData.ban_reason = body.banReason;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select("id, is_admin, is_banned, ban_reason")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;
  const { userId } = await params;

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const mode = (url.searchParams.get("mode") || body?.mode || "complete").toLowerCase();

  if (mode === "pii") {
    // 1. Scrub Personally Identifiable Information (PII) from profiles
    const anonymizedUsername = `deleted_${userId.slice(0, 8)}`;
    const { error: profileUpdateError } = await admin.supabase
      .from("profiles")
      .update({
        full_name: "Deleted User",
        username: anonymizedUsername,
        avatar_url: null,
        bio: null,
        city: null,
        country: null,
        gotra: null,
        kul_devata: null,
        date_of_birth: null,
        legacy_family_name: null,
        home_town: null,
        home_city: null,
        home_country: null,
        custom_greeting: null,
        onesignal_player_id: null,
        latitude: null,
        longitude: null,
        home_latitude: null,
        home_longitude: null,
        is_banned: true,
        ban_reason: "PII Anonymized by Admin",
      })
      .eq("id", userId);

    if (profileUpdateError) {
      return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
    }

    // 2. Remove/disable Supabase Auth user record so user cannot log in
    await admin.supabase.auth.admin.deleteUser(userId).catch(() => null);

    return NextResponse.json({ success: true, mode: "pii", userId });
  }

  // Complete Deletion (Default): Purge Auth user + hard delete profile row
  const { error: authDeleteError } = await admin.supabase.auth.admin.deleteUser(userId);
  if (authDeleteError && !authDeleteError.message.includes("User not found")) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
  }

  const { error: profileDeleteError } = await admin.supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode: "complete", userId });
}
