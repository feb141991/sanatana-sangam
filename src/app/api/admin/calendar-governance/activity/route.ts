import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const { CANONICAL_RULES } = await import('@/lib/calendar/rules');
  const rulesBySlug = new Map(CANONICAL_RULES.map(r => [r.slug, r]));

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('golden_fixture_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (data ?? []).map(row => {
    const rule = rulesBySlug.get(row.festival_id as string);
    return {
      ...row,
      display_name: rule?.display_name ?? row.festival_id,
      emoji: rule?.emoji ?? '📅',
      tradition: rule?.tradition ?? 'unknown',
    };
  });

  return NextResponse.json(enriched);
}
