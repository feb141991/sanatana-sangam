import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { filterProfileRows, getUserSafetyState } from '@/lib/user-safety';

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 40) return NextResponse.json({ profiles: [] });

  const admin = createAdminClient();
  const [{ data, error }, safety] = await Promise.all([
    admin.from('profiles').select('id, username, avatar_url').ilike('username', `%${query}%`).neq('id', user.id).limit(20),
    getUserSafetyState(admin, user.id),
  ]);
  if (error) return NextResponse.json({ error: 'Search unavailable.' }, { status: 500 });
  return NextResponse.json({ profiles: filterProfileRows(data ?? [], safety) });
}
