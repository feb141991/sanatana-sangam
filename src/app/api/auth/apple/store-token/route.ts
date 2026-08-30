/**
 * POST /api/auth/apple/store-token
 *
 * Receives the one-time Apple authorization code from the Native client
 * immediately after a successful Apple Sign-In session is established.
 *
 * This route is the P0 fix: it previously did not exist, causing every
 * Native Apple Sign-In to return 404 and lose the authorization code.
 *
 * Security:
 *  - Requires Bearer token or cookie session (getApiUser).
 *  - Returns 503 (not 500) when Apple env vars are absent so the Native
 *    client can distinguish misconfigured deployment from server error.
 *  - Validates authorizationCode presence and type before any Apple call.
 *  - exchangeAndStoreAppleCode enforces identity binding (P1 fix):
 *    id_token.sub from the exchange must match the Supabase user's stored
 *    Apple sub, preventing cross-user code substitution attacks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { exchangeAndStoreAppleCode, isAppleEnvConfigured } from '@/lib/apple-auth-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const { user, error: authError } = await getApiUser(req);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Env check ───────────────────────────────────────────────────────────
  if (!isAppleEnvConfigured()) {
    console.error(
      'apple/store-token: Apple env vars not configured. ' +
      'Set APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_TOKEN_ENC_KEY.'
    );
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 },
    );
  }

  // ── 3. Body validation ─────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).authorizationCode !== 'string' ||
    !(body as Record<string, unknown>).authorizationCode
  ) {
    return NextResponse.json(
      { error: 'authorizationCode is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  const { authorizationCode } = body as { authorizationCode: string };

  // ── 4. Exchange + identity-bind + store ────────────────────────────────────
  try {
    await exchangeAndStoreAppleCode(user.id, authorizationCode);
    return NextResponse.json({ stored: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Identity mismatch is a client error (wrong code submitted).
    if (message.includes('identity mismatch')) {
      return NextResponse.json({ error: 'Identity binding failed' }, { status: 400 });
    }

    console.error('apple/store-token: exchange failed for user', user.id, ':', message);
    return NextResponse.json({ error: 'Failed to store Apple token' }, { status: 500 });
  }
}
