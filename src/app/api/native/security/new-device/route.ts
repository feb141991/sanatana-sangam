import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { createHmac } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SignInDevicePayload = { installationId?: unknown; platform?: unknown };

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getApiUser(request);
  if (!user) return getApiAuthFailureResponse(authError);

  const secret = process.env.DEVICE_REGISTRY_HMAC_KEY;
  if (!secret) return NextResponse.json({ error: 'Security notification is unavailable' }, { status: 503 });

  let payload: SignInDevicePayload;
  try {
    payload = await request.json() as SignInDevicePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (typeof payload.installationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.installationId)) {
    return NextResponse.json({ error: 'Invalid installation identifier' }, { status: 400 });
  }
  const platform = payload.platform === 'ios' || payload.platform === 'android' ? payload.platform : 'other';
  const deviceHash = createHmac('sha256', secret).update(payload.installationId.toLowerCase()).digest('hex');
  const { data, error } = await createServiceRoleSupabaseClient().rpc('register_email_security_device', {
    p_user_id: user.id,
    p_device_hash: deviceHash,
    p_platform: platform,
  });
  if (error) {
    console.error('[native/security/new-device] registration failed', error.code ?? 'unknown');
    return NextResponse.json({ error: 'Could not record this sign-in' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, newDevice: data === true });
}
