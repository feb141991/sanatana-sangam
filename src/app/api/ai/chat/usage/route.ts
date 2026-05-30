import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { requireUserNotBanned } from '@/lib/api-guards';

const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT = 200;

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { user, error: authError } = await requireUserNotBanned(supabase);
  if (authError) return authError;

  // Fetch Pro status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single();
  const isPro = profile?.is_pro ?? false;

  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  // Count today’s used messages (UTC midnight)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('sadhana_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'ai_chat_message')
    .gte('created_at', todayStart.toISOString());

  const used = error ? 0 : (count ?? 0);

  return NextResponse.json({ used, limit, isPro });
}
