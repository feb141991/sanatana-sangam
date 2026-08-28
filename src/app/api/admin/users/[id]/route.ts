import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;

  const { id: userId } = await params;
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
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ("response" in admin) return admin.response;

  const { id: userId } = await params;
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
      source_route: "/admin/users/[id]",
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
