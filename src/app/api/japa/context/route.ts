import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

// Server-Timing + slow-request logging, matching the established pattern in
// /api/mandali/feed -- added to find out whether the auth step (getApiUser's
// live network round-trip to Supabase Auth via bearerClient.auth.getUser)
// or the get_japa_context RPC itself is the actual source of a reported
// slow first load, rather than guessing further.
export async function GET(req: NextRequest) {
  const startedAt = performance.now();
  const authStartedAt = performance.now();
  const { user, error: authError, supabase } = await getApiUser(req);
  const authMs = performance.now() - authStartedAt;
  if (!user || !supabase) {
    return getApiAuthFailureResponse(authError, {
      'Server-Timing': `auth;dur=${authMs.toFixed(2)}, total;dur=${(performance.now() - startedAt).toFixed(2)}`,
    });
  }

  const rpcStartedAt = performance.now();
  const { data, error } = await supabase.rpc('get_japa_context' as never);
  const rpcMs = performance.now() - rpcStartedAt;
  if (error) {
    console.error('[api/japa/context]', error.code, error.message);
    return NextResponse.json(
      { error: 'Could not load Japa context' },
      {
        status: 500,
        headers: { 'Server-Timing': `auth;dur=${authMs.toFixed(2)}, rpc;dur=${rpcMs.toFixed(2)}, total;dur=${(performance.now() - startedAt).toFixed(2)}` },
      },
    );
  }

  const totalMs = performance.now() - startedAt;
  if (totalMs >= 1_000) {
    console.warn('[japa/context][performance]', JSON.stringify({
      authMs: Math.round(authMs * 100) / 100,
      rpcMs: Math.round(rpcMs * 100) / 100,
      totalMs: Math.round(totalMs * 100) / 100,
      release: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    }));
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Server-Timing': `auth;dur=${authMs.toFixed(2)}, rpc;dur=${rpcMs.toFixed(2)}, total;dur=${totalMs.toFixed(2)}`,
    },
  });
}
