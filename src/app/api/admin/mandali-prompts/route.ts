import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { createMandaliPromptAdminClient } from '@/lib/mandali-prompt-admin';

const PROMPT_TEXT_MAX_LENGTH = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const value: unknown = await request.json().catch(() => null);
  return isRecord(value) ? value : null;
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

function invalidLength(value: string | null): boolean {
  return Boolean(value && value.length > PROMPT_TEXT_MAX_LENGTH);
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = createMandaliPromptAdminClient();
  const { data, error } = await supabase
    .from('mandali_prompts')
    .select('id, text_en, text_hi, text_pa, tradition, observance_tag, active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await readBody(request);
  const textEn = optionalText(body?.text_en) ?? '';
  const textHi = optionalText(body?.text_hi);
  const textPa = optionalText(body?.text_pa);
  if ('active' in (body ?? {}) && typeof body?.active !== 'boolean') {
    return NextResponse.json({ error: 'active must be a boolean.' }, { status: 400 });
  }
  if ('text_hi' in (body ?? {}) && body?.text_hi !== null && typeof body?.text_hi !== 'string') {
    return NextResponse.json({ error: 'text_hi must be text or null.' }, { status: 400 });
  }
  if ('text_pa' in (body ?? {}) && body?.text_pa !== null && typeof body?.text_pa !== 'string') {
    return NextResponse.json({ error: 'text_pa must be text or null.' }, { status: 400 });
  }
  if (!textEn) {
    return NextResponse.json({ error: 'text_en is required.' }, { status: 400 });
  }
  if (invalidLength(textEn) || invalidLength(textHi) || invalidLength(textPa)) {
    return NextResponse.json({ error: `Prompt text must be ${PROMPT_TEXT_MAX_LENGTH} characters or fewer.` }, { status: 400 });
  }

  const supabase = createMandaliPromptAdminClient();
  const { data, error } = await supabase
    .from('mandali_prompts')
    .insert({
      text_en: textEn,
      text_hi: textHi,
      text_pa: textPa,
      tradition: null,
      observance_tag: optionalText(body?.observance_tag),
      active: body?.active !== false,
    })
    .select('id, text_en, text_hi, text_pa, tradition, observance_tag, active, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await readBody(request);
  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Body must include { id: string, ...fields }' }, { status: 400 });
  }

  const patch: {
    updated_at: string;
    text_en?: string;
    text_hi?: string | null;
    text_pa?: string | null;
    active?: boolean;
  } = { updated_at: new Date().toISOString() };
  if (typeof body.text_en === 'string') {
    const textEn = optionalText(body.text_en);
    if (!textEn) return NextResponse.json({ error: 'text_en cannot be empty.' }, { status: 400 });
    if (invalidLength(textEn)) return NextResponse.json({ error: `Prompt text must be ${PROMPT_TEXT_MAX_LENGTH} characters or fewer.` }, { status: 400 });
    patch.text_en = textEn;
  }
  if ('text_hi' in body) {
    if (body.text_hi !== null && typeof body.text_hi !== 'string') {
      return NextResponse.json({ error: 'text_hi must be text or null.' }, { status: 400 });
    }
    const textHi = optionalText(body.text_hi);
    if (invalidLength(textHi)) return NextResponse.json({ error: `Prompt text must be ${PROMPT_TEXT_MAX_LENGTH} characters or fewer.` }, { status: 400 });
    patch.text_hi = textHi;
  }
  if ('observance_tag' in body) {
    (patch as any).observance_tag = optionalText(body.observance_tag);
  }
  if ('text_pa' in body) {
    if (body.text_pa !== null && typeof body.text_pa !== 'string') {
      return NextResponse.json({ error: 'text_pa must be text or null.' }, { status: 400 });
    }
    const textPa = optionalText(body.text_pa);
    if (invalidLength(textPa)) return NextResponse.json({ error: `Prompt text must be ${PROMPT_TEXT_MAX_LENGTH} characters or fewer.` }, { status: 400 });
    patch.text_pa = textPa;
  }
  if ('active' in body) {
    if (typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'active must be a boolean.' }, { status: 400 });
    }
    patch.active = body.active;
  }

  const supabase = createMandaliPromptAdminClient();
  const changesPublishedText = 'text_en' in patch || 'text_hi' in patch || 'text_pa' in patch;
  if (changesPublishedText) {
    const { data: publishedPost, error: publishedLookupError } = await supabase
      .from('posts')
      .select('id')
      .eq('mandali_prompt_id', id)
      .limit(1)
      .maybeSingle();
    if (publishedLookupError) return NextResponse.json({ error: publishedLookupError.message }, { status: 500 });
    if (publishedPost) {
      return NextResponse.json(
        { error: 'Published prompt text cannot be changed. Deactivate it and add a new prompt to preserve discussion history.' },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase
    .from('mandali_prompts')
    .update(patch)
    .eq('id', id)
    .select('id, text_en, text_hi, text_pa, tradition, observance_tag, active, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await readBody(request);
  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Body must include { id: string }' }, { status: 400 });
  }

  const supabase = createMandaliPromptAdminClient();
  const { error } = await supabase.from('mandali_prompts').delete().eq('id', id);
  if (error?.code === '23001' || error?.code === '23503') {
    return NextResponse.json(
      { error: 'This prompt has already been published. Deactivate it to preserve its discussion history.' },
      { status: 409 },
    );
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
