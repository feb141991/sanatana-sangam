import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { compareOfficialClaims, OFFICIAL_CALENDAR_CLAIMS, type FixtureEvidence } from '@/lib/calendar/official-calendar-claims';

// Read-only comparison. Never writes golden fixtures or occurrences.
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Calendar evidence database is not configured' }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('golden_fixtures')
    .select('case_id, updated_at, festival_id, year, expected, source, reasoning, approved, profile, location')
    .in('festival_id', [...new Set(OFFICIAL_CALENDAR_CLAIMS.map((claim) => claim.slug))])
    .in('year', [...new Set(OFFICIAL_CALENDAR_CLAIMS.map((claim) => Number(claim.date.slice(0, 4))))])
    .order('festival_id', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comparisons = compareOfficialClaims(OFFICIAL_CALENDAR_CLAIMS, (data ?? []) as FixtureEvidence[]);
  return NextResponse.json({
    comparisons,
    notice: 'Official editions are spot-check evidence only. Profile, location, variant and rule convention require human review. Approval does not itself materialize or publish an app date.',
  });
}
