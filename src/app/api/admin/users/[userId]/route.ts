import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase-admin";

export interface UserActivityEvent {
  id: string;
  domain: "japa" | "nitya" | "mood" | "sadhana" | "sankalpa" | "quiz" | "tirtha" | "karma" | "notification";
  timestamp: string;
  title: string;
  subtitle?: string;
  badge: string;
  badgeColor: string;
  icon: string;
  rawDetail: Record<string, unknown>;
}

// GET/POST here were originally added under a sibling [id] directory
// (feat(admin): 5-tab seeker dossier ...), which Next.js rejects outright --
// every dynamic segment at the same path position must use the same param
// name across the whole route tree, and having both [id] and [userId] here
// crashed EVERY route in the app (middleware/routing fails app-wide, not
// just this endpoint) with "You cannot use different slug names for the
// same dynamic path ('id' !== 'userId')." Merged into this file (the
// longer-lived [userId] convention) rather than the other way around --
// no client fetch URLs change, since the segment's *name* isn't part of the
// URL, only its position.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient() as any;

    // 1. Fetch Profile and Core Data in Parallel
    const [
      profileRes,
      legalRes,
      pushTokensRes,
      pushEventsRes,
      malaRes,
      moodRes,
      nityaRes,
      sadhanaRes,
      sankalpaRes,
      quizRes,
      tirthaRes,
      notifRes,
      karmaLedgerRes,
      karmaAwardRes,
      kulRes,
      reportsRes,
      warningsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("legal_acceptances").select("*").eq("user_id", userId).order("accepted_at", { ascending: false }),
      supabase.from("push_tokens").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("push_token_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("mala_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("user_mood_checkins").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("nitya_karma_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("sadhana_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("sankalpa_checkins").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("quiz_responses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("tirtha_checkins").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("notification_schedule").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("karma_ledger").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("karma_award_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("kul_members").select("*, kuls(*)").eq("user_id", userId),
      supabase.from("content_reports").select("*").or(`reporter_id.eq.${userId},target_user_id.eq.${userId}`).limit(30),
      supabase.from("user_warnings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    if (!profileRes.data) {
      return NextResponse.json({ error: "Seeker profile not found" }, { status: 404 });
    }

    const profile = profileRes.data;

    // 2. Normalize Devotional Timeline into Unified Stream
    const events: UserActivityEvent[] = [];

    // Japa / Mala Sessions
    for (const m of malaRes.data || []) {
      events.push({
        id: `mala_${m.id}`,
        domain: "japa",
        timestamp: m.completed_at || m.created_at || m.date,
        title: `Japa Session: ${m.completed_rounds || m.rounds || 1} Round(s) (${m.completed_beads || m.count || 108} beads)`,
        subtitle: m.mantra || m.intention || "Maha Mantra Japa",
        badge: "📿 Japa Sadhana",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
        icon: "📿",
        rawDetail: m,
      });
    }

    // Nitya Karma
    for (const n of nityaRes.data || []) {
      const completedSteps = [];
      if (n.woke_brahma_muhurta) completedSteps.push("Brahma Muhurta");
      if (n.snana_done) completedSteps.push("Snana");
      if (n.tilak_done) completedSteps.push("Tilak");
      if (n.sandhya_done) completedSteps.push("Sandhya");
      if (n.japa_done) completedSteps.push("Japa");
      if (n.shloka_done) completedSteps.push("Shloka");
      if (n.aarti_done) completedSteps.push("Aarti");

      events.push({
        id: `nitya_${n.id}`,
        domain: "nitya",
        timestamp: n.completed_at || n.created_at || n.date,
        title: `Nitya Karma: ${completedSteps.length} step(s) completed`,
        subtitle: completedSteps.join(" • ") || "Daily devotional sequence",
        badge: "🌅 Nitya Karma",
        badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
        icon: "🌅",
        rawDetail: n,
      });
    }

    // Mood Check-ins
    for (const mo of moodRes.data || []) {
      events.push({
        id: `mood_${mo.id}`,
        domain: "mood",
        timestamp: mo.completed_at || mo.created_at,
        title: `Mood Check-in: ${mo.before_mood || "Reflective"} ${mo.after_mood ? "→ " + mo.after_mood : ""}`,
        subtitle: mo.reflection_note || mo.recommended_action_type ? `Action: ${mo.recommended_action_type}` : undefined,
        badge: "🌿 Inner State",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
        icon: "🌿",
        rawDetail: mo,
      });
    }

    // Sadhana Events
    for (const s of sadhanaRes.data || []) {
      events.push({
        id: `sadhana_${s.id}`,
        domain: "sadhana",
        timestamp: s.created_at,
        title: `Sadhana Event: ${s.event_type}`,
        subtitle: typeof s.event_data === "object" ? JSON.stringify(s.event_data) : undefined,
        badge: "🔥 Sadhana",
        badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
        icon: "🔥",
        rawDetail: s,
      });
    }

    // Sankalpa Checkins
    for (const sk of sankalpaRes.data || []) {
      events.push({
        id: `sankalpa_${sk.id}`,
        domain: "sankalpa",
        timestamp: sk.created_at || sk.checked_date,
        title: `Sankalpa Discipline Completed`,
        subtitle: `Date: ${sk.checked_date}`,
        badge: "🎯 Sankalpa",
        badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
        icon: "🎯",
        rawDetail: sk,
      });
    }

    // Quiz Responses
    for (const q of quizRes.data || []) {
      events.push({
        id: `quiz_${q.id}`,
        domain: "quiz",
        timestamp: q.created_at || q.date,
        title: `Dharma Quiz: ${q.is_correct ? "✅ Correct" : "❌ Incorrect"}`,
        subtitle: q.question || "Daily Sanatan Trivia",
        badge: "🧠 Dharma Quiz",
        badgeColor: q.is_correct ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-rose-100 text-rose-900 border-rose-300",
        icon: "🧠",
        rawDetail: q,
      });
    }

    // Tirtha Checkins
    for (const t of tirthaRes.data || []) {
      events.push({
        id: `tirtha_${t.id}`,
        domain: "tirtha",
        timestamp: t.visited_at || t.created_at,
        title: `Tirtha Darshan Check-in`,
        subtitle: t.reflection || t.seva_note || `Pradakshina count: ${t.pradakshina_count || 1}`,
        badge: "🏛️ Tirtha Darshan",
        badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
        icon: "🏛️",
        rawDetail: t,
      });
    }

    // Karma Ledger
    for (const k of karmaLedgerRes.data || []) {
      const isPositive = (k.amount || 0) >= 0;
      events.push({
        id: `karma_${k.id}`,
        domain: "karma",
        timestamp: k.created_at || k.earned_date,
        title: `Karma ${isPositive ? "+" : ""}${k.amount} Punya`,
        subtitle: k.reason || "Devotional practice award",
        badge: "✨ Karma Points",
        badgeColor: isPositive ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-gray-100 text-gray-800 border-gray-300",
        icon: "✨",
        rawDetail: k,
      });
    }

    // Sort Chronologically Descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 3. Karma Reconciliation Breakdown
    let totalEarned = 0;
    let totalSpent = 0;
    for (const row of karmaLedgerRes.data || []) {
      const amt = row.amount || 0;
      if (amt > 0) totalEarned += amt;
      else totalSpent += Math.abs(amt);
    }

    return NextResponse.json({
      profile,
      legalAcceptances: legalRes.data || [],
      pushTokens: pushTokensRes.data || [],
      pushEvents: pushEventsRes.data || [],
      timeline: events,
      notifications: notifRes.data || [],
      karma: {
        currentBalance: profile.karma_points || 0,
        totalEarned,
        totalSpent,
        ledger: karmaLedgerRes.data || [],
        awards: karmaAwardRes.data || [],
      },
      moderation: {
        kuls: kulRes.data || [],
        reports: reportsRes.data || [],
        warnings: warningsRes.data || [],
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load user dossier" },
      { status: 500 }
    );
  }
}

// POST Action for Manual Admin Karma Adjustment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;

  const { userId } = await params;
  const body = await request.json().catch(() => ({}));
  const { amount, reason } = body;

  if (typeof amount !== "number" || !reason) {
    return NextResponse.json({ error: "Valid amount (number) and reason (string) are required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient() as any;

    // 1. Fetch current profile
    const { data: profile, error: pErr } = await supabase.from("profiles").select("karma_points").eq("id", userId).single();
    if (pErr || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const newBalance = (profile.karma_points || 0) + amount;

    // 2. Insert into karma_ledger
    const { error: lErr } = await supabase.from("karma_ledger").insert({
      user_id: userId,
      amount,
      reason: `Admin adjustment: ${reason}`,
      source_route: "/admin/users/[userId]",
      metadata: { admin_username: admin.username, adjusted_at: new Date().toISOString() },
    });
    if (lErr) throw lErr;

    // 3. Update profile points
    const { error: uErr } = await supabase.from("profiles").update({ karma_points: newBalance }).eq("id", userId);
    if (uErr) throw uErr;

    return NextResponse.json({ ok: true, newBalance });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to adjust karma" },
      { status: 500 }
    );
  }
}

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
      "latitude", "longitude", "home_latitude", "home_longitude"
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
