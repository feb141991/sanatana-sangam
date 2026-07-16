import { NextResponse, type NextRequest } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getApiUser } from '@/lib/api-auth';

// --- Push token registration -------------------------------------------------
// Replaces what OneSignal did invisibly on its own servers: associating a
// device with a user so server-side sends know where to deliver. Since we
// now call Expo's push API ourselves (see src/lib/push-server.ts), we own
// this mapping in our own `push_tokens` table (migration
// 20260716124259_push_tokens.sql).
//
// POST registers/refreshes a token for the signed-in user (idempotent --
// upsert_push_token is keyed on the token itself, so re-registering the
// same token just bumps last_seen_at/reassigns the user if a different
// account signed in on the same device).
//
// DELETE removes one specific token (called on sign-out) -- deliberately
// scoped to a single device's token, not "all of this user's tokens", so
// signing out on one device doesn't kill push for their other devices.

type RegisterBody = { token?: string; platform?: string };

export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: error?.message ?? 'Unauthorized' }, { status: 401 });
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const token = body.token?.trim();
  const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : 'unknown';

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { error: rpcError } = await supabase.rpc('upsert_push_token', {
      p_user_id: user.id,
      p_token: token,
      p_platform: platform,
    });

    if (rpcError) {
      console.error('register-token upsert failed:', rpcError);
      return NextResponse.json({ error: `Could not register token: ${rpcError.message}` }, { status: 500 });
    }

    return NextResponse.json({ registered: true });
  } catch (err) {
    console.error('register-token route crashed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'register-token route crashed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: error?.message ?? 'Unauthorized' }, { status: 401 });
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { error: rpcError } = await supabase.rpc('delete_push_token', {
      p_user_id: user.id,
      p_token: token,
    });

    if (rpcError) {
      console.error('register-token delete failed:', rpcError);
      return NextResponse.json({ error: `Could not remove token: ${rpcError.message}` }, { status: 500 });
    }

    return NextResponse.json({ removed: true });
  } catch (err) {
    console.error('register-token DELETE route crashed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'register-token DELETE route crashed' },
      { status: 500 }
    );
  }
}
