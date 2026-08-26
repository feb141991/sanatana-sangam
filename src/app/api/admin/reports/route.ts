import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  try {
    const [
      totalUsers,
      onboardedUsers,
      streakUsers,
      bannedUsers,
      proUsers,
      earlyAccessUsers,
      contentReports,
      dharmVeerPending,
      mandalis,
      fixtures,
      integrityFindings,
      recentLogs,
      malaSessions,
      dailySadhanas,
      nityaKarmaLogs,
      vratObservations,
      posts
    ] = await Promise.all([
      supabase.from("profiles").select("id, created_at, tradition, city, is_pro, entitlement_source", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gt("shloka_streak", 0),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_pro", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("entitlement_source", "early_access"),
      (supabase.from("content_reports") as any).select("id, status", { count: "exact" }),
      (supabase.from("dharm_veers") as any).select("slug", { count: "exact", head: true }).eq("review_status", "pending_review"),
      supabase.from("mandalis").select("id", { count: "exact", head: true }),
      (supabase.from("golden_fixtures") as any).select("case_id, approved, expected, source"),
      (supabase.from("calendar_integrity_findings") as any).select("id", { count: "exact", head: true }).eq("is_open", true),
      (supabase.from("cron_logs") as any).select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("mala_sessions").select("id", { count: "exact", head: true }),
      supabase.from("daily_sadhana").select("id", { count: "exact", head: true }),
      supabase.from("nitya_karma_log").select("id", { count: "exact", head: true }),
      supabase.from("vrat_observations").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id, title, likes_count, comments_count", { count: "exact" }).limit(5)
    ]);

    const total = totalUsers.count || 0;
    const active = streakUsers.count || 0;
    const retentionRate = total > 0 ? `${Math.round((active / total) * 100)}%` : "0%";

    // Tradition distribution
    const traditionMap: Record<string, number> = {};
    (totalUsers.data || []).forEach((u: any) => {
      const t = u.tradition || "Universal";
      traditionMap[t] = (traditionMap[t] || 0) + 1;
    });

    const traditionBreakdown = Object.entries(traditionMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, val]) => ({ label, count: val, val: `${val} Seekers` }));

    // Fixture stats
    const fixtureRows: any[] = (fixtures.data as any[]) || [];
    const realFixtures = fixtureRows.filter(f => f.expected != null && !(f.source as any)?.ref?.startsWith("TODO")).length;
    const approvedFixtures = fixtureRows.filter(f => f.approved).length;

    // Report stats
    const reportRows: any[] = (contentReports.data as any[]) || [];
    const pendingReports = reportRows.filter(r => r.status === "pending").length;
    const resolvedReports = reportRows.filter(r => r.status === "resolved").length;

    // Total sadhana count
    const malaCount = malaSessions.count || 0;
    const sadhanaCount = dailySadhanas.count || 0;
    const nityaCount = nityaKarmaLogs.count || 0;
    const vratCount = vratObservations.count || 0;
    const totalSadhanaSessions = malaCount + sadhanaCount + nityaCount + vratCount;

    // Top engaging content from DB
    const topPosts = (posts.data || []).map((p: any) => ({
      label: p.title || "Spiritual Post",
      val: `${(p.likes_count || 0) + (p.comments_count || 0)} interactions`
    }));

    const topContentList = topPosts.length > 0 ? topPosts : [
      { label: "Mantra Japa & Mala Sadhana", val: `${malaCount} completed sessions` },
      { label: "Daily Nitya Karma Practice", val: `${nityaCount} recorded check-ins` },
      { label: "Panchang & Tithi Guide", val: `${sadhanaCount} daily views` },
      { label: "Vrat & Observances Catalog", val: `${vratCount} completed observations` },
    ];

    const activePros = proUsers.count || 0;
    const earlyAccess = earlyAccessUsers.count || 0;

    return NextResponse.json({
      overview: {
        totalSeekers: total,
        onboardedSeekers: onboardedUsers.count || 0,
        activeStreakSeekers: active,
        bannedSeekers: bannedUsers.count || 0,
        retentionRate,
        globalReachMandalis: mandalis.count || 0,
      },
      content: {
        totalSadhanaSessions,
        topContent: topContentList,
        sadhanaSessions: [
          { label: "Mantra Japa (108 Beads)", val: `${malaCount} sessions` },
          { label: "Daily Sadhana Checklist", val: `${sadhanaCount} completed` },
          { label: "Nitya Karma Rituals", val: `${nityaCount} performed` },
          { label: "Vrat Observations", val: `${vratCount} observed` },
        ],
      },
      finance: {
        activeProSeekers: activePros,
        earlyAccessGrants: earlyAccess,
        launchStatus: "100% Free Launch",
        churnRate: "0.0%",
        renewalsDue7d: 0,
        subscriptionItems: [
          { label: "Active Pro Seekers", val: `${activePros} seekers` },
          { label: "Early Access Pro Grants", val: `${earlyAccess} unlocked` },
          { label: "Commercial Lifetime Paid", val: `${Math.max(0, activePros - earlyAccess)} orders` },
          { label: "Free Seeker Tier", val: `${Math.max(0, total - activePros)} seekers` },
        ],
        renewalsList: [
          { label: "Early Access Pro (Active)", val: `${earlyAccess} seekers (No charge)` },
          { label: "Active Mandali Founders", val: `${mandalis.count || 0} leaders` },
          { label: "Commercial Gateway", val: "Disabled for Free Launch" },
        ]
      },
      governance: {
        goldenFixturesTotal: fixtureRows.length,
        realFixtures,
        approvedFixtures,
        openIntegrityFindings: integrityFindings.count || 0,
        pendingDharmVeerReviews: dharmVeerPending.count || 0,
      },
      moderation: {
        totalReports: reportRows.length,
        pendingReports,
        resolvedReports,
      },
      traditions: traditionBreakdown,
      logs: recentLogs.data || [],
    });
  } catch (error) {
    console.error("[admin/reports] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}
