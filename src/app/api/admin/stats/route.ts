import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  try {
    const [
      usersCount, 
      onboardedCount,
      activeCount, 
      reportsCount, 
      mandaliCount,
      traditionsData,
      dharmVeerReviewCount,
      proUsersCount,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gt("shloka_streak", 0),
      supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("mandalis").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("tradition").limit(2000),
      supabase.from("dharm_veers").select("slug", { count: "exact", head: true }).eq("review_status", "pending_review"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_pro", true),
    ]);

    const traditionStats: Record<string, number> = {};
    (traditionsData.data as { tradition: string | null }[] | null)?.forEach(p => {
      const t = p.tradition || "Universal";
      traditionStats[t] = (traditionStats[t] || 0) + 1;
    });

    const total = usersCount.count || 0;
    const onboarded = onboardedCount.count || 0;
    const active = activeCount.count || 0;
    const proSubscribers = proUsersCount.count || 0;
    const retention = total > 0 ? Math.round((active / total) * 100) : 0;

    return NextResponse.json({
      totalSeekers: total,
      onboardedSeekers: onboarded,
      activeNow: active,
      pendingReports: reportsCount.count || 0,
      pendingDharmVeerReview: dharmVeerReviewCount.count || 0,
      globalReach: mandaliCount.count || 0,
      intelligence: {
        retentionRate: retention + "%",
        topTradition: Object.entries(traditionStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sanatan",
        traditionBreakdown: Object.entries(traditionStats).map(([label, val]) => ({ label, val: val + " Seekers" })),
        topContent: [
          { label: "Bhagavad Gita", val: "12.4k views", _placeholder: true, status: "not_implemented" },
          { label: "Hanuman Chalisa", val: "8.2k views", _placeholder: true, status: "not_implemented" },
          { label: "Morning Sadhana", val: "5.1k views", _placeholder: true, status: "not_implemented" }
        ],
        finance: {
          mrr: 0,
          proSubscribers,
          churn: "0%",
          renewalsDue: 0,
          _placeholder: true,
          status: "not_implemented"
        }
      },
      health: {
        database: "up",
        auth: "up",
        functions: "not_monitored",
        storage: "not_monitored",
        _placeholder: true
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
