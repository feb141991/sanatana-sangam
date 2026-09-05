import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "seekers";

  try {
    let csvContent = "";
    let filename = `shoonaya_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === "seekers") {
      const { data: users } = await supabase
        .from("profiles")
        .select("id, username, full_name, tradition, city, country, is_pro, entitlement_source, onboarding_completed, shloka_streak, is_banned, created_at")
        .order("created_at", { ascending: false });

      csvContent = "ID,Username,Full Name,Tradition,City,Country,Is Pro,Entitlement,Onboarded,Streak,Is Banned,Created At\n";
      (users || []).forEach((u: any) => {
        csvContent += `"${u.id}","${u.username || ""}","${(u.full_name || "").replace(/"/g, "''")}","${u.tradition || ""}","${u.city || ""}","${u.country || ""}","${u.is_pro ? "Yes" : "No"}","${u.entitlement_source || "free"}","${u.onboarding_completed ? "Yes" : "No"}","${u.shloka_streak || 0}","${u.is_banned ? "Yes" : "No"}","${u.created_at}"\n`;
      });
    } else if (type === "sadhana") {
      const [
        { data: mala },
        { data: sadhana },
        { data: nitya }
      ] = await Promise.all([
        supabase.from("mala_sessions").select("id, user_id, counts, completed_at").limit(500),
        supabase.from("daily_sadhana").select("id, user_id, date, completed").limit(500),
        supabase.from("nitya_karma_log").select("id, user_id, karma_key, completed_at").limit(500)
      ]);

      csvContent = "Type,Session ID,User ID,Details,Timestamp\n";
      (mala || []).forEach((m: any) => {
        csvContent += `"Mala Japa","${m.id}","${m.user_id}","Counts: ${m.counts || 108}","${m.completed_at}"\n`;
      });
      (sadhana || []).forEach((s: any) => {
        csvContent += `"Daily Sadhana","${s.id}","${s.user_id}","Date: ${s.date}","${s.date}"\n`;
      });
      (nitya || []).forEach((n: any) => {
        csvContent += `"Nitya Karma","${n.id}","${n.user_id}","Karma: ${n.karma_key}","${n.completed_at}"\n`;
      });
    } else if (type === "subscriptions") {
      const { data: pros } = await supabase
        .from("profiles")
        .select("id, username, full_name, is_pro, entitlement_source, created_at")
        .eq("is_pro", true);

      csvContent = "User ID,Username,Full Name,Plan Status,Entitlement Source,Member Since\n";
      (pros || []).forEach((p: any) => {
        csvContent += `"${p.id}","${p.username || ""}","${(p.full_name || "").replace(/"/g, "''")}","Active Pro","${p.entitlement_source || "early_access"}","${p.created_at}"\n`;
      });
    } else if (type === "moderation") {
      const { data: reports } = await (supabase.from("content_reports") as any)
        .select("id, reported_by, content_type, reason, status, created_at")
        .order("created_at", { ascending: false });

      csvContent = "Report ID,Reporter ID,Content Type,Reason,Status,Created At\n";
      (reports || []).forEach((r: any) => {
        csvContent += `"${r.id}","${r.reported_by || ""}","${r.content_type || ""}","${(r.reason || "").replace(/"/g, "''")}","${r.status || "pending"}","${r.created_at}"\n`;
      });
    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("[admin/reports/export] Export failed:", error);
    return NextResponse.json({ error: "Failed to generate CSV export" }, { status: 500 });
  }
}
