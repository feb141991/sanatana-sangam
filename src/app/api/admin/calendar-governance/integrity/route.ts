import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { calculateObservanceCandidateDiagnosticsForYear } from "@/lib/calendar/engine";

// GET /api/admin/calendar-governance/integrity
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "open"; // "open" | "resolved" | "all"
  const year = searchParams.get("year");
  const issueType = searchParams.get("issue_type");
  const slug = searchParams.get("slug");
  const findingId = searchParams.get("id");

  const supabase = createAdminClient();

  try {
    let query = (supabase.from("calendar_integrity_findings") as any)
      .select("*")
      .order("last_seen_at", { ascending: false });

    if (findingId) {
      query = query.eq("id", findingId);
    } else {
      if (status === "open") {
        query = query.eq("is_open", true);
      } else if (status === "resolved") {
        query = query.eq("is_open", false);
      }

      if (year && year !== "all") {
        query = query.eq("year", parseInt(year, 10));
      }

      if (issueType && issueType !== "all") {
        query = query.eq("issue_type", issueType);
      }

      if (slug) {
        query = query.ilike("slug", `%${slug}%`);
      }
    }

    const { data: findings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also fetch KPI summary counts
    const { data: allRows } = await (supabase.from("calendar_integrity_findings") as any)
      .select("id, is_open, issue_type, year");

    const rows = allRows || [];
    const stats = {
      total: rows.length,
      openCount: rows.filter((r: any) => r.is_open).length,
      resolvedCount: rows.filter((r: any) => !r.is_open).length,
      mismatchCount: rows.filter((r: any) => r.is_open && r.issue_type === "engine_curated_mismatch").length,
      missingSourceCount: rows.filter((r: any) => r.is_open && r.issue_type === "missing_external_source").length,
      multiCandidateCount: rows.filter((r: any) => r.is_open && r.issue_type === "multiple_candidates_needs_review").length,
      unreviewedCount: rows.filter((r: any) => r.is_open && r.issue_type === "unreviewed_or_not_verified").length,
      byYear: {
        2025: rows.filter((r: any) => r.is_open && r.year === 2025).length,
        2026: rows.filter((r: any) => r.is_open && r.year === 2026).length,
        2027: rows.filter((r: any) => r.is_open && r.year === 2027).length,
      }
    };

    return NextResponse.json({
      findings: findings || [],
      stats,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch integrity findings" },
      { status: 500 }
    );
  }
}

// POST /api/admin/calendar-governance/integrity
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const action = body?.action; // "resolve" | "resolve_all" | "unresolve" | "diagnose"
  const supabase = createAdminClient();

  try {
    if (action === "resolve" && body?.id) {
      const { error } = await (supabase.from("calendar_integrity_findings") as any)
        .update({
          is_open: false,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", body.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Finding marked as resolved." });
    }

    if (action === "unresolve" && body?.id) {
      const { error } = await (supabase.from("calendar_integrity_findings") as any)
        .update({
          is_open: true,
          resolved_at: null,
        })
        .eq("id", body.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Finding reopened." });
    }

    if (action === "resolve_all") {
      let query = (supabase.from("calendar_integrity_findings") as any)
        .update({
          is_open: false,
          resolved_at: new Date().toISOString(),
        })
        .eq("is_open", true);

      if (body?.year) {
        query = query.eq("year", body.year);
      }
      if (body?.issue_type) {
        query = query.eq("issue_type", body.issue_type);
      }

      const { count, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        resolvedCount: count ?? 0,
        message: "All matching open findings marked as resolved.",
      });
    }

    if (action === "diagnose" && body?.slug && body?.year) {
      const year = parseInt(body.year, 10);
      const diagnostics = calculateObservanceCandidateDiagnosticsForYear(year, undefined, "corrected");
      const matching = diagnostics.filter((d) => d.slug === body.slug);

      return NextResponse.json({
        success: true,
        slug: body.slug,
        year,
        diagnostics: matching,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: resolve, resolve_all, unresolve, diagnose" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process integrity finding action" },
      { status: 500 }
    );
  }
}
