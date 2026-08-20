export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { warmDiagnosticsForYear } from '@/lib/calendar/fixture-engine-hint';

// ─── Warm Calendar Governance Diagnostics Cron ────────────────────────────
// Schedule: daily (see vercel.json)
//
// Pre-pays the ~4-7s-per-year (occasionally ~8-14s on a legacy-map
// fallback) ephemeris computation the Calendar Governance Fixtures admin
// page's GET needs, so a real admin request never has to. Cheap after the
// first run each day: calendar_governance_diagnostics_cache is keyed by
// (year, rules_hash), so a repeat run against unchanged rules.json is just
// one SELECT per year, not a recomputation -- see fixture-engine-hint.ts.
// ────────────────────────────────────────────────────────────────────────

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminSupabase();
  const { data, error } = await supabase.from('golden_fixtures').select('year');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Years actually in use, plus one year ahead so sourcing work that starts
  // targeting a not-yet-present year still lands on a warm cache.
  const years = new Set<number>((data ?? []).map((r) => r.year as number));
  const maxYear = years.size > 0 ? Math.max(...years) : new Date().getFullYear();
  years.add(maxYear + 1);

  const results: Record<number, 'ok' | 'error'> = {};
  for (const year of years) {
    try {
      await warmDiagnosticsForYear(year);
      results[year] = 'ok';
    } catch (err) {
      console.error(`[warm-calendar-governance-diagnostics] Failed for ${year}:`, err);
      results[year] = 'error';
    }
  }

  return NextResponse.json({ success: true, years: Array.from(years), results });
}
