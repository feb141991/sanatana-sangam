import { NextRequest, NextResponse } from 'next/server';
import { normalizeContentLanguage } from '@/lib/language-runtime';
import { createAdminClient } from '@/lib/supabase-admin';
import { getDailyFallbackQuiz } from '@/lib/quiz-fallback';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTradition = searchParams.get('tradition') ?? 'hindu';
  const dateStr      = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const rawLanguage  = searchParams.get('language');
  const tradition = ['hindu', 'sikh', 'buddhist', 'jain', 'all'].includes(rawTradition)
    ? rawTradition
    : 'hindu';
  const requestedLanguage = normalizeContentLanguage(rawLanguage);
  
  // 1. Look up in DB using Admin Client
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('daily_quiz' as unknown as 'quiz_responses')
    .select('id, question, options, answer_index, explanation, fact, source, tradition, date')
    .eq('tradition', tradition)
    .eq('language', requestedLanguage)
    .eq('date', dateStr)
    .maybeSingle();

  if (data) {
    const existingQuiz = data as unknown as {
      question: string; options: string[]; answer_index: number;
      explanation: string; fact: string; source: string; tradition: string; date: string; id: string;
    };
    return NextResponse.json({
      question: existingQuiz.question,
      options: existingQuiz.options,
      answerIndex: existingQuiz.answer_index,
      explanation: existingQuiz.explanation,
      fact: existingQuiz.fact,
      source: existingQuiz.source,
      tradition: existingQuiz.tradition,
      date: existingQuiz.date,
      daily_quiz_id: existingQuiz.id,
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } });
  }

  const { quiz: fallbackQuiz, fallbackLanguage } = getDailyFallbackQuiz(tradition, requestedLanguage, dateStr);
  return NextResponse.json(
    { ...fallbackQuiz, tradition, date: dateStr, fallbackLanguage, ai: { provider: 'fallback', degraded: true }, degraded: true },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
  );
}
