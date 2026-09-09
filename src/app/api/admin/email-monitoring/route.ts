import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch auth users from Supabase Auth admin API
    const { data: userData, error: userErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (userErr) {
      console.error("[admin/email-monitoring] User list error:", userErr);
      return NextResponse.json({ error: userErr.message }, { status: 500 });
    }

    const allUsers = userData.users || [];
    const recent7DaysUsers = allUsers.filter((u) => new Date(u.created_at) >= sevenDaysAgo);
    const recent30DaysUsers = allUsers.filter((u) => new Date(u.created_at) >= thirtyDaysAgo);

    const totalConfirmed = allUsers.filter((u) => u.email_confirmed_at).length;
    const totalUnconfirmed = allUsers.filter((u) => !u.email_confirmed_at).length;

    const confirmed7d = recent7DaysUsers.filter((u) => u.email_confirmed_at).length;
    const unconfirmed7d = recent7DaysUsers.filter((u) => !u.email_confirmed_at).length;
    const bounceRiskRate7d = recent7DaysUsers.length > 0
      ? Math.round((unconfirmed7d / recent7DaysUsers.length) * 100)
      : 0;

    // Domain Breakdown
    const domains: Record<string, { total: number; confirmed: number; unconfirmed: number }> = {};
    for (const u of allUsers) {
      const email = u.email || "";
      const domain = email.includes("@") ? email.split("@")[1].toLowerCase() : "other";
      if (!domains[domain]) domains[domain] = { total: 0, confirmed: 0, unconfirmed: 0 };
      domains[domain].total++;
      if (u.email_confirmed_at) domains[domain].confirmed++;
      else domains[domain].unconfirmed++;
    }

    // Provider Breakdown
    const providers: Record<string, number> = {};
    for (const u of allUsers) {
      const provider = u.app_metadata?.provider || (u.email ? "email" : "unknown");
      providers[provider] = (providers[provider] || 0) + 1;
    }

    // Unconfirmed Users list (Potential bounce / spam sources)
    const unconfirmedList = allUsers
      .filter((u) => !u.email_confirmed_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        provider: u.app_metadata?.provider || "email",
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
      }));

    // Check Resend configuration status
    const resendApiKey = process.env.RESEND_API_KEY || "";
    const hasResendConfig = Boolean(resendApiKey && resendApiKey.startsWith("re_"));

    // Health Assessment
    let healthStatus: "healthy" | "warning" | "critical" = "healthy";
    let healthMessage = "Transactional email delivery healthy.";
    if (bounceRiskRate7d > 20) {
      healthStatus = "critical";
      healthMessage = `High bounce risk (${bounceRiskRate7d}% unconfirmed in last 7 days). Supabase shared mailer may flag project.`;
    } else if (bounceRiskRate7d > 5 || unconfirmed7d >= 2) {
      healthStatus = "warning";
      healthMessage = `Moderate bounce risk (${unconfirmed7d} unconfirmed signups in last 7 days). Ensure Custom SMTP is active.`;
    }

    return NextResponse.json({
      overview: {
        totalUsers: allUsers.length,
        totalConfirmed,
        totalUnconfirmed,
        recent7DaysCount: recent7DaysUsers.length,
        confirmed7d,
        unconfirmed7d,
        bounceRiskRate7d,
        recent30DaysCount: recent30DaysUsers.length,
      },
      health: {
        status: healthStatus,
        message: healthMessage,
        customSmtpConfigured: hasResendConfig,
        provider: hasResendConfig ? "Resend (smtp.resend.com)" : "Default Supabase Shared Pool",
      },
      domains: Object.entries(domains)
        .map(([domain, stats]) => ({ domain, ...stats }))
        .sort((a, b) => b.total - a.total),
      providers: Object.entries(providers).map(([name, count]) => ({ name, count })),
      unconfirmedUsers: unconfirmedList,
    });
  } catch (error) {
    console.error("[admin/email-monitoring] Aggregation failure:", error);
    return NextResponse.json(
      { error: "Failed to load email deliverability data" },
      { status: 500 }
    );
  }
}
