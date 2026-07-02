import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitByIp, rejectLargeRequest, truncateString } from '@/lib/api-security';

const MAX_CSP_REPORT_BYTES = 8 * 1024;
const CSP_RATE_LIMIT = { keyPrefix: 'csp-report', limit: 20, windowMs: 60_000 };

type CspReportBody = {
  'csp-report'?: Record<string, unknown>;
};

function pickString(source: Record<string, unknown>, key: string, maxLength: number) {
  const value = source[key];
  return typeof value === 'string' ? truncateString(value, maxLength) : undefined;
}

function sanitiseCspReport(input: unknown) {
  const report = input && typeof input === 'object'
    ? (input as CspReportBody)['csp-report']
    : null;

  if (!report || typeof report !== 'object') return null;

  return {
    document_uri:       pickString(report, 'document-uri', 300),
    referrer:           pickString(report, 'referrer', 300),
    violated_directive: pickString(report, 'violated-directive', 160),
    effective_directive: pickString(report, 'effective-directive', 160),
    blocked_uri:        pickString(report, 'blocked-uri', 300),
    source_file:        pickString(report, 'source-file', 300),
    status_code:        typeof report['status-code'] === 'number' ? report['status-code'] : undefined,
    disposition:        pickString(report, 'disposition', 40),
  };
}

/**
 * POST /api/csp-report
 * Receives Content-Security-Policy violation reports from browsers.
 * Stores to monitoring_events table; falls back to console.warn on failure.
 */
export async function POST(req: Request) {
  const sizeRejection = rejectLargeRequest(req, MAX_CSP_REPORT_BYTES);
  if (sizeRejection) return sizeRejection;

  const rateRejection = rateLimitByIp(req, CSP_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (rawBody.length > MAX_CSP_REPORT_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const report = sanitiseCspReport(parsed);
  if (!report) {
    return NextResponse.json({ error: 'Invalid CSP report' }, { status: 400 });
  }

  // Persist to Supabase using service role (no user auth context on CSP requests)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.from('monitoring_events').insert({
        event_type: 'csp_violation',
        severity:   'P3',
        route:      '/csp-report',
        metadata:   report,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-fatal — fall through to console
    }
  }

  // Always log for local dev / aggregators
  console.warn('[CSP Violation]', JSON.stringify(report));

  return NextResponse.json({ success: true }, { status: 200 });
}
