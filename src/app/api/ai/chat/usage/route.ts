import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { FREE_DAILY_LIMIT, PRO_DAILY_LIMIT } from '@/lib/ai/chat-limits';

export async function GET(req: NextRequest) {
  // Bearer-aware (see /api/ai/chat/route.ts) — this previously used
  // requireUserNotBanned(supabase) against a cookie-only client, which made
  // it unreachable from native. getApiUser(req) tries the cookie session
  // first, then falls back to the Authorization: Bearer header.
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

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
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'ai_chat_message')
    .gte('created_at', todayStart.toISOString());

  const used = error ? 0 : (count ?? 0);

  return NextResponse.json({ used, limit, isPro });
}
