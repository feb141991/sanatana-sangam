import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/csp-report
 * Receives Content-Security-Policy violation reports from browsers.
 * Stores to monitoring_events table; falls back to console.warn on failure.
 */
export async function POST(req: Request) {
  let report: unknown = null;
  try {
    report = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
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
