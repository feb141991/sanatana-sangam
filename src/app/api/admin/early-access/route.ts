import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export interface EarlyAccessSeeker {
  id: string;
  email: string;
  name: string | null;
  tradition: string | null;
  source: string | null;
  timezone: string | null;
  founding_number: number | null;
  email_sent: boolean;
  referred_by_number: number | null;
  referral_source: string | null;
  created_at: string;
}

export interface EarlyAccessStats {
  total: number;
  today: number;
  thisWeek: number;
  androidCount: number;
  iosCount: number;
  traditions: Record<string, number>;
}

export async function GET(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";
  const tradition = searchParams.get("tradition") || "all";
  const device = searchParams.get("device") || "all";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  try {
    // 1. Base Query for Registrations
    let dbQuery = (supabase.from("waitlist") as any)
      .select("id, email, name, tradition, source, timezone, founding_number, email_sent, referred_by_number, referral_source, created_at", { count: "exact" });

    // Text search (email, name, or exact founding_number)
    if (query) {
      if (/^\d+$/.test(query)) {
        dbQuery = dbQuery.or(`email.ilike.%${query}%,name.ilike.%${query}%,founding_number.eq.${query}`);
      } else {
        dbQuery = dbQuery.or(`email.ilike.%${query}%,name.ilike.%${query}%`);
      }
    }

    // Tradition filter
    if (tradition !== "all") {
      dbQuery = dbQuery.eq("tradition", tradition);
    }

    // Device / Platform filter (source usually contains -android or -ios)
    if (device === "android") {
      dbQuery = dbQuery.ilike("source", "%android%");
    } else if (device === "ios") {
      dbQuery = dbQuery.ilike("source", "%ios%");
    } else if (device === "web") {
      dbQuery = dbQuery.not("source", "ilike", "%android%").not("source", "ilike", "%ios%");
    }

    // Sorting
    if (sort === "founding_asc") {
      dbQuery = dbQuery.order("founding_number", { ascending: true, nullsFirst: false });
    } else if (sort === "founding_desc") {
      dbQuery = dbQuery.order("founding_number", { ascending: false, nullsFirst: false });
    } else if (sort === "oldest") {
      dbQuery = dbQuery.order("created_at", { ascending: true });
    } else {
      // newest by default
      dbQuery = dbQuery.order("created_at", { ascending: false });
    }

    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: seekers, count, error: listError } = await dbQuery;
    if (listError) throw listError;

    // 2. High-level Statistics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalCount },
      { count: todayCount },
      { count: weekCount },
      { count: androidCount },
      { count: iosCount },
      { data: allTraditions },
    ] = await Promise.all([
      (supabase.from("waitlist") as any).select("*", { count: "exact", head: true }),
      (supabase.from("waitlist") as any).select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      (supabase.from("waitlist") as any).select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      (supabase.from("waitlist") as any).select("*", { count: "exact", head: true }).ilike("source", "%android%"),
      (supabase.from("waitlist") as any).select("*", { count: "exact", head: true }).ilike("source", "%ios%"),
      (supabase.from("waitlist") as any).select("tradition"),
    ]);

    const traditionsMap: Record<string, number> = {};
    if (Array.isArray(allTraditions)) {
      for (const row of allTraditions) {
        const t = row.tradition || "universal";
        traditionsMap[t] = (traditionsMap[t] || 0) + 1;
      }
    }

    const stats: EarlyAccessStats = {
      total: totalCount ?? 0,
      today: todayCount ?? 0,
      thisWeek: weekCount ?? 0,
      androidCount: androidCount ?? 0,
      iosCount: iosCount ?? 0,
      traditions: traditionsMap,
    };

    return NextResponse.json({
      seekers: seekers || [],
      total: count ?? 0,
      page,
      limit,
      stats,
    });
  } catch (err: any) {
    console.error("[admin/early-access] GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch waitlist seekers" },
      { status: 500 }
    );
  }
}
