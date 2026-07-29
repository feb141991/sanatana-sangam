import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// Clears the signed-in user's in-app notification inbox. This is intentionally
// an API route instead of a direct client delete because public.notifications
// only grants users SELECT/UPDATE under RLS; deletes remain server-owned.
export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: error?.message ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { count, error: deleteError } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[notifications/clear] delete failed:', deleteError);
      return NextResponse.json(
        { error: `Could not clear notifications: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ cleared: count ?? 0 });
  } catch (err) {
    console.error('[notifications/clear] route crashed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Clear notifications route crashed' },
      { status: 500 }
    );
  }
}
