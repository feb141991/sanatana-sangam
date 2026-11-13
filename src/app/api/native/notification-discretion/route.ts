import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** This route ships with the push redaction code. The column alone cannot enable the Native control. */
export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);

  const headers = { 'Cache-Control': 'private, no-store' };
  const unavailable = () => NextResponse.json(
    { code: 'NOTIFICATION_DISCRETION_UNAVAILABLE' },
    { status: 503, headers },
  );
  try {
    const { data, error } = await supabase.from('profiles')
      .select('notification_discreet_mode')
      .eq('id', user.id)
      .maybeSingle();
    const enabled = (data as { notification_discreet_mode?: unknown } | null)?.notification_discreet_mode;
    if (error || typeof enabled !== 'boolean') return unavailable();
    return NextResponse.json({ enabled }, { headers });
  } catch {
    return unavailable();
  }
}
