import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
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

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;
  const { userId } = await params;

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const mode = (url.searchParams.get("mode") || body?.mode || "complete").toLowerCase();

  // Fetch target profile snapshot before deletion/anonymization for audit trail
  const { data: targetProfile } = await admin.supabase
    .from("profiles")
    .select("id, username, full_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (mode === "pii") {
    // 1. Scrub Personally Identifiable Information (PII) from profiles
    const anonymizedUsername = `deleted_${userId.slice(0, 8)}`;
    const scrubbedFields = [
      "full_name", "username", "avatar_url", "bio", "city", "country",
      "gotra", "kul_devata", "date_of_birth", "legacy_family_name",
      "home_town", "home_city", "home_country", "custom_greeting",
      "onesignal_player_id", "latitude", "longitude", "home_latitude", "home_longitude"
    ];

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

    // 3. Log PII scrub transaction to audit log
    try {
      await admin.supabase
        .from("user_activity_log")
        .insert({
          action: "admin_user_pii_scrubbed",
          entity_type: "profiles",
          entity_id: userId,
          target_id: userId,
          metadata: {
            admin_username: admin.username,
            mode: "pii",
            target_user_id: userId,
            original_username: targetProfile?.username ?? null,
            original_full_name: targetProfile?.full_name ?? null,
            tables_affected: ["public.profiles", "auth.users"],
            fields_scrubbed: scrubbedFields,
            timestamp: new Date().toISOString(),
          },
        });
    } catch {
      // Ignore logging failures
    }

    return NextResponse.json({
      success: true,
      mode: "pii",
      userId,
      tablesAffected: ["public.profiles", "auth.users"],
      fieldsScrubbed: scrubbedFields,
    });
  }

  // Complete Cascading Hard Deletion (Default):
  // 1. Delete user storage files (avatars, uploads)
  try {
    const prefixes = [userId, `profiles/${userId}`];
    for (const prefix of prefixes) {
      const { data: files } = await admin.supabase.storage.from("avatars").list(prefix);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${prefix}/${f.name}`);
        await admin.supabase.storage.from("avatars").remove(paths);
      }
    }
  } catch (err) {
    console.warn("[admin/users/delete] Storage cleanup warning:", err);
  }

  // 2. Clean up all child foreign-key tables in safe dependency order
  const childCleanupTasks = [
    // Push and notifications
    admin.supabase.from("push_tokens").delete().eq("user_id", userId),
    admin.supabase.from("push_receipts_pending").delete().eq("user_id", userId),
    admin.supabase.from("push_token_events").delete().eq("user_id", userId),
    admin.supabase.from("notification_deliveries").delete().eq("user_id", userId),
    admin.supabase.from("notifications").delete().eq("user_id", userId),
    admin.supabase.from("notification_preferences").delete().eq("user_id", userId),

    // Sadhana and practice tracking
    admin.supabase.from("mala_sessions").delete().eq("user_id", userId),
    admin.supabase.from("daily_sadhana").delete().eq("user_id", userId),
    admin.supabase.from("nitya_karma_log").delete().eq("user_id", userId),
    admin.supabase.from("vrat_observations").delete().eq("user_id", userId),
    admin.supabase.from("sankalpa_checkins").delete().eq("user_id", userId),
    admin.supabase.from("sankalpas").delete().eq("user_id", userId),
    admin.supabase.from("guided_path_progress").delete().eq("user_id", userId),
    admin.supabase.from("quiz_attempts").delete().eq("user_id", userId),
    admin.supabase.from("ai_chat_usage").delete().eq("user_id", userId),
    admin.supabase.from("karma_ledger").delete().eq("user_id", userId),
    admin.supabase.from("tirtha_saves").delete().eq("user_id", userId),
    admin.supabase.from("mood_logs").delete().eq("user_id", userId),
    admin.supabase.from("daily_reflections").delete().eq("user_id", userId),

    // Community and social
    admin.supabase.from("post_reactions").delete().eq("user_id", userId),
    admin.supabase.from("post_comments").delete().eq("author_id", userId),
    admin.supabase.from("posts").delete().eq("author_id", userId),
    admin.supabase.from("user_blocked_profiles").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
    admin.supabase.from("user_muted_profiles").delete().or(`muter_id.eq.${userId},muted_id.eq.${userId}`),

    // Settings, birth profiles, and moderation
    admin.supabase.from("user_settings").delete().eq("user_id", userId),
    admin.supabase.from("birth_profiles").delete().eq("user_id", userId),
    admin.supabase.from("user_warnings").delete().eq("user_id", userId),
    admin.supabase.from("user_activity_log").delete().or(`user_id.eq.${userId},target_id.eq.${userId}`),
    admin.supabase.from("deleted_accounts").delete().eq("user_id", userId),
  ];

  await Promise.allSettled(childCleanupTasks);

  // 3. Purge Auth user record
  const { error: authDeleteError } = await admin.supabase.auth.admin.deleteUser(userId);
  if (authDeleteError && !authDeleteError.message.includes("User not found")) {
    console.warn("[admin/users/delete] Auth admin delete warning:", authDeleteError.message);
  }

  // 4. Hard delete profile row cleanly
  const { error: profileDeleteError } = await admin.supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    console.error("[admin/users/delete] Profile delete error:", profileDeleteError);
    return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    mode: "complete",
    userId,
    message: "User and all associated data permanently deleted."
  });
}
