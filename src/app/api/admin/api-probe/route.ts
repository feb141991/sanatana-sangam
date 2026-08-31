import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ProbeResult {
  endpoint: string;
  method: string;
  status: number;
  ok: boolean;
  statusText: string;
  latencyMs: number;
  timestamp: string;
  error?: string;
  responsePreview?: string;
  headers?: {
    region?: string;
    cacheControl?: string;
    contentType?: string;
  };
}

const PROBE_TARGETS = [
  { endpoint: "/api/calendar/upcoming?days=7", method: "GET" },
  { endpoint: "/api/calendar/month?month=2026-09", method: "GET" },
  { endpoint: "/api/calendar/day?date=2026-09-01", method: "GET" },
  { endpoint: "/api/panchang", method: "GET" },
  { endpoint: "/api/dharm-veer/roster", method: "GET" },
  { endpoint: "/api/vrat/occurrence?slug=ekadashi", method: "GET" },
  { endpoint: "/api/live-darshans", method: "GET" },
  { endpoint: "/api/admin/stats", method: "GET" },
];

async function probeUrl(baseUrl: string, endpoint: string, method = "GET"): Promise<ProbeResult> {
  const url = `${baseUrl}${endpoint}`;
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "x-shoonaya-probe": "admin-monitoring",
        "accept": "application/json",
      },
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - t0;
    let preview = "";
    try {
      const text = await res.text();
      preview = text.length > 200 ? text.slice(0, 200) + "..." : text;
    } catch {
      preview = "[binary or unreadable body]";
    }

    return {
      endpoint,
      method,
      status: res.status,
      ok: res.ok,
      statusText: res.statusText || (res.ok ? "OK" : "Error"),
      latencyMs,
      timestamp: new Date().toISOString(),
      responsePreview: preview,
      headers: {
        region: res.headers.get("x-vercel-id") || res.headers.get("x-matched-path") || undefined,
        cacheControl: res.headers.get("cache-control") || undefined,
        contentType: res.headers.get("content-type") || undefined,
      },
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - t0;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return {
      endpoint,
      method,
      status: isTimeout ? 504 : 500,
      ok: false,
      statusText: isTimeout ? "Gateway Timeout (6000ms)" : "Probe Failed",
      latencyMs,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Network error during probe",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const body = await req.json().catch(() => ({}));
    const targetEndpoint = body.endpoint as string | undefined;

    const protocol = req.nextUrl.protocol || "http:";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}//${host}`;

    if (targetEndpoint) {
      const result = await probeUrl(baseUrl, targetEndpoint, body.method || "GET");
      return NextResponse.json({ success: true, result });
    }

    // Probe default fleet
    const results = await Promise.all(
      PROBE_TARGETS.map((t) => probeUrl(baseUrl, t.endpoint, t.method))
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err: unknown) {
    console.error("[POST /api/admin/api-probe] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
