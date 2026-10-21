import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminCookieAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROBE_TIMEOUT_MS = 15_000;

type ProbeAudience = "public" | "admin";

interface ProbeTarget {
  endpoint: string;
  method: "GET";
  audience: ProbeAudience;
}

interface ProbeResult {
  endpoint: string;
  method: string;
  status: number;
  ok: boolean;
  statusText: string;
  latencyMs: number;
  timestamp: string;
  statusSource: "upstream" | "probe";
  failureKind?: "probe_timeout" | "network_error";
  probeRequestId?: string;
  upstreamStatus?: number;
  error?: string;
  responsePreview?: string;
  headers?: {
    region?: string;
    cacheControl?: string;
    contentType?: string;
    serverTiming?: string;
    upstreamRequestId?: string;
  };
}

// Only explicitly reviewed, read-only GETs can be probed. The admin cookie is
// forwarded solely to the admin stats target; public probes must measure the
// same anonymous/cacheable path that a guest receives.
const PROBE_TARGETS: ProbeTarget[] = [
  { endpoint: "/api/calendar/upcoming?days=7", method: "GET", audience: "public" },
  { endpoint: "/api/calendar/month?month=2026-09", method: "GET", audience: "public" },
  { endpoint: "/api/calendar/day?date=2026-09-08", method: "GET", audience: "public" },
  {
    endpoint: "/api/calendar/day?date=2026-09-08&lat=23.1765&lon=75.7885&tz=Asia/Kolkata",
    method: "GET",
    audience: "public",
  },
  { endpoint: "/api/dharm-veer/roster?tradition=all", method: "GET", audience: "public" },
  { endpoint: "/api/vrat/stats?vrat_id=ekadashi", method: "GET", audience: "public" },
  { endpoint: "/api/health", method: "GET", audience: "public" },
  { endpoint: "/api/admin/stats", method: "GET", audience: "admin" },
];

function findProbeTarget(endpoint: unknown, method: unknown): ProbeTarget | null {
  if (typeof endpoint !== "string" || typeof method !== "string") return null;
  return PROBE_TARGETS.find((target) => target.endpoint === endpoint && target.method === method) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function probeUrl(
  baseUrl: string,
  target: ProbeTarget,
  adminToken: string | undefined,
  probeRequestId: string | undefined,
): Promise<ProbeResult> {
  const url = `${baseUrl}${target.endpoint}`;
  const startedAt = Date.now();
  const controller = new AbortController();
  let timeoutTriggered = false;
  let upstreamStatus: number | undefined;
  let upstreamHeaders: ProbeResult["headers"];
  const timeout = setTimeout(() => {
    timeoutTriggered = true;
    controller.abort();
  }, PROBE_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "x-shoonaya-probe": "admin-monitoring",
      accept: "application/json",
    };
    if (target.audience === "admin" && adminToken) {
      headers.cookie = `${ADMIN_COOKIE}=${adminToken}`;
    }

    const response = await fetch(url, {
      method: target.method,
      signal: controller.signal,
      headers,
    });
    upstreamStatus = response.status;
    upstreamHeaders = {
      region: response.headers.get("x-vercel-id") || response.headers.get("x-matched-path") || undefined,
      cacheControl: response.headers.get("cache-control") || undefined,
      contentType: response.headers.get("content-type") || undefined,
      serverTiming: response.headers.get("server-timing") || undefined,
      upstreamRequestId: response.headers.get("x-request-id") || undefined,
    };

    // Keep the same deadline active through body consumption. Otherwise the
    // displayed round-trip duration could outlive the timeout's protection.
    let preview = "";
    try {
      const body = await response.text();
      preview = body.length > 200 ? `${body.slice(0, 200)}...` : body;
    } catch {
      preview = "[body unavailable]";
      throw new Error("Probe response body could not be read.");
    }

    return {
      endpoint: target.endpoint,
      method: target.method,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText || (response.ok ? "OK" : "Upstream HTTP error"),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      statusSource: "upstream",
      probeRequestId,
      responsePreview: preview,
      headers: upstreamHeaders,
    };
  } catch {
    const isTimeout = timeoutTriggered || controller.signal.aborted;
    return {
      endpoint: target.endpoint,
      method: target.method,
      status: isTimeout ? 504 : 500,
      ok: false,
      statusText: isTimeout ? `Probe timeout (${PROBE_TIMEOUT_MS}ms)` : "Probe network failure",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      statusSource: "probe",
      failureKind: isTimeout ? "probe_timeout" : "network_error",
      probeRequestId,
      upstreamStatus,
      error: isTimeout
        ? `The probe did not complete within ${PROBE_TIMEOUT_MS}ms.`
        : "Network error while the probe called its target.",
      headers: upstreamHeaders,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  try {
    const parsedBody: unknown = await req.json().catch(() => ({}));
    const body = isRecord(parsedBody) ? parsedBody : {};
    const targetEndpoint = body.endpoint;

    const baseUrl = req.nextUrl.origin;
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
    const probeRequestId = req.headers.get("x-request-id") || undefined;

    if (targetEndpoint !== undefined) {
      const target = findProbeTarget(targetEndpoint, body.method);
      if (!target) {
        return NextResponse.json(
          { error: "Probe target is not in the read-only monitoring allowlist." },
          { status: 400 },
        );
      }
      const result = await probeUrl(baseUrl, target, adminToken, probeRequestId);
      return NextResponse.json({ success: true, result });
    }

    const results = await Promise.all(
      PROBE_TARGETS.map((target) => probeUrl(baseUrl, target, adminToken, probeRequestId)),
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
      { status: 500 },
    );
  }
}
