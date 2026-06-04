import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface QuestionInput {
  question_number: number;
  question_text: string;
  options: string[];
  correct_option_idx: number;
  explanation: string;
}

interface PackInput {
  pack_number: number;
  title: string;
  is_free: boolean;
  questions: QuestionInput[];
}

interface SeedRequestBody {
  month: string;
  theme: string;
  theme_sub?: string;
  packs: PackInput[];
}

export async function POST(req: NextRequest) {
  // 1. Authorize using ADMIN_SECRET header
  const secret = req.headers.get('x-admin-secret') ||
                 req.headers.get('admin_secret') ||
                 req.headers.get('admin-secret') ||
                 req.headers.get('ADMIN_SECRET');

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as SeedRequestBody;
    const { month, theme, theme_sub, packs } = body;

    if (!month || !theme || !Array.isArray(packs)) {
      return NextResponse.json(
        { error: 'Required fields: month (YYYY-MM), theme, and packs array.' },
        { status: 400 }
      );
    }

    // Validate month format (e.g. 2026-06)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Month must be in YYYY-MM format.' },
        { status: 400 }
      );
    }

    // 2. Upsert Monthly Challenge
    const { data: challengeData, error: challengeError } = await supabase
      .from('monthly_challenges')
      .upsert(
        { month, theme, theme_sub: theme_sub ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'month' }
      )
      .select('id')
      .single();

    if (challengeError) {
      throw new Error(`Failed to upsert challenge: ${challengeError.message}`);
    }

    const challengeId = challengeData.id;

    // 3. Process Packs and Questions
    for (const pack of packs) {
      if (!pack.pack_number || !pack.title || !Array.isArray(pack.questions)) {
        throw new Error(`Pack is missing pack_number, title, or questions list.`);
      }

      // Upsert challenge pack
      const { data: packData, error: packError } = await supabase
        .from('challenge_packs')
        .upsert(
          {
            challenge_id: challengeId,
            pack_number: pack.pack_number,
            title: pack.title,
            is_free: !!pack.is_free,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'challenge_id,pack_number' }
        )
        .select('id')
        .single();

      if (packError) {
        throw new Error(`Failed to upsert pack ${pack.pack_number}: ${packError.message}`);
      }

      const packId = packData.id;

      // Upsert challenge questions for this pack
      for (const question of pack.questions) {
        if (
          !question.question_number ||
          !question.question_text ||
          !Array.isArray(question.options) ||
          question.options.length !== 4 ||
          typeof question.correct_option_idx !== 'number' ||
          question.correct_option_idx < 0 ||
          question.correct_option_idx > 3 ||
          !question.explanation
        ) {
          throw new Error(
            `Question in pack ${pack.pack_number} has invalid fields. Each question must have 4 options and a correct_option_idx (0-3).`
          );
        }

        const { error: questionError } = await supabase
          .from('challenge_questions')
          .upsert(
            {
              pack_id: packId,
              question_number: question.question_number,
              question_text: question.question_text,
              options: question.options,
              correct_option_idx: question.correct_option_idx,
              explanation: question.explanation,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'pack_id,question_number' }
          );

        if (questionError) {
          throw new Error(
            `Failed to upsert question ${question.question_number} in pack ${pack.pack_number}: ${questionError.message}`
          );
        }
      }
    }

    return NextResponse.json({ success: true, challenge_id: challengeId });
  } catch (err: any) {
    console.error('[challenge/seed] Seeding failed:', err);
    return NextResponse.json({ error: err.message || 'Seeding failed.' }, { status: 500 });
  }
}
