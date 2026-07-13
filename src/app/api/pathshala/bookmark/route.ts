import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { getBookmarkedStudySummaries, type PathshalaUserStateRow } from '@/lib/pathshala-state';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  const { data, error } = await supabase
    .from('pathshala_user_state')
    .select('entry_id, section_id, tradition, last_opened_at, bookmarked_at')
    .eq('user_id', user.id)
    .not('bookmarked_at', 'is', null)
    .order('bookmarked_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const saved = getBookmarkedStudySummaries((data ?? []) as PathshalaUserStateRow[], 200);
  return NextResponse.json({ saved });
}
