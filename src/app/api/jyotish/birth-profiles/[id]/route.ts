/**
 * GET    /api/jyotish/birth-profiles/[id]   — fetch single profile + chart_data
 * PATCH  /api/jyotish/birth-profiles/[id]   — update label, relation, is_primary
 * DELETE /api/jyotish/birth-profiles/[id]   — delete profile
 *
 * PATCH body: { label?, relation?, is_primary? }
 * Setting is_primary: true will unset the previous primary for this user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* server component */ }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

type RouteContext = { params: Promise<{ id: string }> };

// ── GET — single profile with full chart_data ─────────────────────────────────
export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const userId = await getAuthUserId();

  const db = getServiceClient();

  // Allow guest access via ?session_token= query param
  const sessionToken = req.nextUrl.searchParams.get('session_token');

  let query = db.from('birth_profiles').select('*').eq('id', id);

  if (userId) {
    query = query.eq('owner_id', userId);
  } else if (sessionToken) {
    query = query.eq('session_token', sessionToken).is('owner_id', null);
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await query.single();
  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: data });
}

// ── PATCH — update label / relation / is_primary ──────────────────────────────
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* ok */ }

  const allowed = ['label', 'relation', 'is_primary'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const db = getServiceClient();

  // Verify ownership
  const { data: existing } = await db
    .from('birth_profiles')
    .select('id')
    .eq('id', id)
    .eq('owner_id', userId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // If making primary, unset current primary
  if (updates.is_primary === true) {
    await db
      .from('birth_profiles')
      .update({ is_primary: false })
      .eq('owner_id', userId)
      .eq('is_primary', true)
      .neq('id', id);
  }

  const { data, error } = await db
    .from('birth_profiles')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

// ── DELETE — remove profile ───────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();

  const { error } = await db
    .from('birth_profiles')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
