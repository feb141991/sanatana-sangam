import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

type PendingRow = { id: string; requester_id: string; created_at: string };
type IdentityRow = { id: string; username: string; avatar_url: string | null };

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('mandali_connections')
    .select('id, requester_id, created_at')
    .eq('recipient_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load requests.' }, { status: 500 });

  const rows = (data ?? []) as unknown as PendingRow[];
  const requesterIds = rows.map((row) => row.requester_id);
  const identityResult = requesterIds.length
    ? await admin.from('profiles').select('id, username, avatar_url').in('id', requesterIds)
    : { data: [], error: null };
  if (identityResult.error) return NextResponse.json({ error: 'Could not load requests.' }, { status: 500 });
  const identities = new Map(((identityResult.data ?? []) as unknown as IdentityRow[]).map((row) => [row.id, row]));

  return NextResponse.json({
    requests: rows.map((row) => {
      const requester = identities.get(row.requester_id);
      return {
        ...row,
        requester: requester ? { full_name: requester.username, username: requester.username, avatar_url: requester.avatar_url } : null,
      };
    }),
  });
}
