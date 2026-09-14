import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { verifyAdminCookieAuth } from '@/lib/admin-auth';

// Keep this route untyped, matching the existing precedent at
// /api/admin/dharm-veer-review/route.ts -- mandali_prompts isn't in the
// hand-maintained Database type (types/database.ts) yet, and this route is
// already gated by verifyAdminCookieAuth() plus the service-role key.
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('mandali_prompts')
    .select('id, text_en, text_hi, text_pa, tradition, active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const textEn = typeof body?.text_en === 'string' ? body.text_en.trim() : '';
  if (!textEn) {
    return NextResponse.json({ error: 'text_en is required.' }, { status: 400 });
  }

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('mandali_prompts')
    .insert({
      text_en: textEn,
      text_hi: body?.text_hi || null,
      text_pa: body?.text_pa || null,
      tradition: body?.tradition || null,
      active: body?.active !== false,
    })
    .select('id, text_en, text_hi, text_pa, tradition, active, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Body must include { id: string, ...fields }' }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.text_en === 'string') {
    if (!body.text_en.trim()) return NextResponse.json({ error: 'text_en cannot be empty.' }, { status: 400 });
    patch.text_en = body.text_en.trim();
  }
  if ('text_hi' in body) patch.text_hi = body.text_hi || null;
  if ('text_pa' in body) patch.text_pa = body.text_pa || null;
  if ('tradition' in body) patch.tradition = body.tradition || null;
  if ('active' in body) patch.active = Boolean(body.active);

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('mandali_prompts')
    .update(patch)
    .eq('id', id)
    .select('id, text_en, text_hi, text_pa, tradition, active, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Body must include { id: string }' }, { status: 400 });
  }

  const supabase = adminSupabase();
  const { error } = await supabase.from('mandali_prompts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
