import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { verifyAdminCookieAuth } from '@/lib/admin-auth';

// Keep this route untyped, matching the existing precedent at
// /api/admin/mandali-prompts/route.ts -- these tables aren't in the
// hand-maintained Database type yet, and the route is already gated by
// verifyAdminCookieAuth() plus the service-role key.
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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

function optionalOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const trimmed = value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
  return trimmed.length === 4 ? trimmed : null;
}

// GET returns both the season list (for the admin UI's grouping/dropdown)
// and every question row across all seasons -- this feature's whole
// question bank is small (10-40 rows), so one combined fetch is simpler
// than paginating per-season.
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = adminSupabase();
  const [{ data: seasons, error: seasonsError }, { data: questions, error: questionsError }] = await Promise.all([
    supabase.from('festival_quiz_seasons').select('id, definition_key, title, badge_slug, active, created_at, updated_at').order('created_at', { ascending: false }),
    supabase.from('festival_quiz_questions').select('*').order('definition_key', { ascending: true }).order('day_sequence', { ascending: true }),
  ]);
  if (seasonsError) return NextResponse.json({ error: seasonsError.message }, { status: 500 });
  if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 500 });

  return NextResponse.json({ seasons: seasons ?? [], questions: questions ?? [] });
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await readBody(request);
  const definitionKey = optionalText(body?.definition_key);
  const daySequence = typeof body?.day_sequence === 'number' ? body.day_sequence : null;
  const questionEn = optionalText(body?.question_en);
  const optionsEn = optionalOptions(body?.options_en);
  const correctOptionIdx = typeof body?.correct_option_idx === 'number' ? body.correct_option_idx : null;

  if (!definitionKey || daySequence === null || !questionEn || !optionsEn || correctOptionIdx === null || correctOptionIdx < 0 || correctOptionIdx > 3) {
    return NextResponse.json(
      { error: 'definition_key, day_sequence, question_en, options_en (exactly 4), correct_option_idx (0-3) are required.' },
      { status: 400 },
    );
  }

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('festival_quiz_questions')
    .insert({
      definition_key: definitionKey,
      day_sequence: daySequence,
      question_en: questionEn,
      question_hi: optionalText(body?.question_hi),
      question_pa: optionalText(body?.question_pa),
      options_en: optionsEn,
      options_hi: optionalOptions(body?.options_hi),
      options_pa: optionalOptions(body?.options_pa),
      correct_option_idx: correctOptionIdx,
      explanation_en: optionalText(body?.explanation_en),
      explanation_hi: optionalText(body?.explanation_hi),
      explanation_pa: optionalText(body?.explanation_pa),
      source: optionalText(body?.source),
      active: body?.active === true,
    })
    .select('*')
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

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.question_en === 'string') {
    const questionEn = optionalText(body.question_en);
    if (!questionEn) return NextResponse.json({ error: 'question_en cannot be empty.' }, { status: 400 });
    patch.question_en = questionEn;
  }
  if ('question_hi' in body) patch.question_hi = optionalText(body.question_hi);
  if ('question_pa' in body) patch.question_pa = optionalText(body.question_pa);
  if ('options_en' in body) {
    const optionsEn = optionalOptions(body.options_en);
    if (!optionsEn) return NextResponse.json({ error: 'options_en must have exactly 4 non-empty entries.' }, { status: 400 });
    patch.options_en = optionsEn;
  }
  if ('options_hi' in body) patch.options_hi = optionalOptions(body.options_hi);
  if ('options_pa' in body) patch.options_pa = optionalOptions(body.options_pa);
  if ('correct_option_idx' in body) {
    if (typeof body.correct_option_idx !== 'number' || body.correct_option_idx < 0 || body.correct_option_idx > 3) {
      return NextResponse.json({ error: 'correct_option_idx must be 0-3.' }, { status: 400 });
    }
    patch.correct_option_idx = body.correct_option_idx;
  }
  if ('explanation_en' in body) patch.explanation_en = optionalText(body.explanation_en);
  if ('explanation_hi' in body) patch.explanation_hi = optionalText(body.explanation_hi);
  if ('explanation_pa' in body) patch.explanation_pa = optionalText(body.explanation_pa);
  if ('source' in body) patch.source = optionalText(body.source);
  if ('active' in body) {
    if (typeof body.active !== 'boolean') return NextResponse.json({ error: 'active must be a boolean.' }, { status: 400 });
    patch.active = body.active;
  }

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('festival_quiz_questions')
    .update(patch as never)
    .eq('id', id)
    .select('*')
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

  const supabase = adminSupabase();
  const { error } = await supabase.from('festival_quiz_questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
