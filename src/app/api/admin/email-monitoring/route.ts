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
    const unconfirmedRate7d = recent7DaysUsers.length > 0
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

    // This server can verify only whether the Resend API key is configured.
    // It cannot infer Supabase Auth SMTP or DNS authentication from an API key.
    const resendApiKey = process.env.RESEND_API_KEY || "";
    const hasResendConfig = Boolean(resendApiKey && resendApiKey.startsWith("re_"));

    // Configuration visibility is not a delivery health check. Keep this at
    // warning until real provider delivery/bounce telemetry is available.
    const healthStatus: "warning" = "warning";
    const healthMessage = hasResendConfig
      ? "Resend API key is configured. Delivery, domain authentication, and Supabase Auth SMTP are not verified by this view."
      : "Resend API is not configured. Supabase Auth mail settings must be checked separately.";

    return NextResponse.json({
      overview: {
        totalUsers: allUsers.length,
        totalConfirmed,
        totalUnconfirmed,
        recent7DaysCount: recent7DaysUsers.length,
        confirmed7d,
        unconfirmed7d,
        unconfirmedRate7d,
        recent30DaysCount: recent30DaysUsers.length,
      },
      health: {
        status: healthStatus,
        message: healthMessage,
        resendApiConfigured: hasResendConfig,
        authSmtpStatus: "unknown",
        domainAuthenticationStatus: "not_verified",
        provider: hasResendConfig ? "Resend Email API" : "Not configured",
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
