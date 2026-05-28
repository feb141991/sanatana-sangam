import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWithProvider } from '@/lib/ai/providers/inference';

export const revalidate = 86400; // Cache for 24 hours (once per day)

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  // Use service role because this is a global public stat, not bound to a user session
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // We use UTC date since this is a global cached endpoint
  const todayStr = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_sadhana')
    .select('user_id, perfect_day_bonus_given, japa_done')
    .eq('date', todayStr);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activeUsersSet = new Set<string>();
  let perfectDays = 0;
  let japaCount = 0;

  (data || []).forEach((row) => {
    activeUsersSet.add(row.user_id);
    if (row.perfect_day_bonus_given) perfectDays++;
    if (row.japa_done) japaCount++;
  });

  const active_users = activeUsersSet.size;

  if (active_users === 0) {
    return NextResponse.json({
      insight: 'The sangha is quiet today. Be the first to light the lamp of sadhana.',
      stats: { active_users: 0, perfect_days: 0, japa_count: 0 }
    });
  }

  const systemPrompt = `You are Dharma Mitra speaking to the entire Shoonaya community. Write ONE inspiring sentence (under 120 chars) about today's collective sadhana: ${active_users} practitioners active, ${perfectDays} achieved Shuddha Din, ${japaCount} completed japa. Use 'we/our/together'. Include one Sanskrit word.`;
  const userPrompt = `Generate community insight for today.`;

  try {
    const result = await generateWithProvider({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 1024,
      reasoningEffort: 'none',
    }, { responseFormat: 'text' });

    const insight = result.text.trim();

    return NextResponse.json({
      insight,
      stats: { active_users, perfect_days: perfectDays, japa_count: japaCount }
    });
  } catch (err) {
    console.error('Failed to generate community insight', err);
    return NextResponse.json({
      insight: `Together our sangha grows: ${active_users} practitioners active today.`,
      stats: { active_users, perfect_days: perfectDays, japa_count: japaCount }
    });
  }
}
