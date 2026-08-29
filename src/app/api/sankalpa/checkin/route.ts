import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';

async function verifyOwnedSankalpa(
  supabase: NonNullable<Awaited<ReturnType<typeof getApiUser>>['supabase']>,
  userId: string,
  sankalpaId: string,
  activeOnly: boolean,
) {
  let query = supabase
    .from('sankalpas')
    .select('id')
    .eq('id', sankalpaId)
    .eq('user_id', userId);
  if (activeOnly) query = query.eq('status', 'active');
  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }
  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  try {
    const body = await req.json();
    const { sankalpa_id } = body;

    if (!sankalpa_id || typeof sankalpa_id !== 'string' || sankalpa_id.trim() === '') {
      return NextResponse.json({ error: 'sankalpa_id is required' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const sankalpaExists = await verifyOwnedSankalpa(supabase, user.id, sankalpa_id, true);
    if (!sankalpaExists) {
      return NextResponse.json({ error: 'Active sankalpa not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('sankalpa_checkins')
      .upsert(
        {
          user_id: user.id,
          sankalpa_id,
          checked_date: today,
        },
        {
          onConflict: 'user_id,sankalpa_id,checked_date',
          ignoreDuplicates: true,
        }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[sankalpa/checkin/POST] Failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }
  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  try {
    const { searchParams } = new URL(req.url);
    const sankalpa_id = searchParams.get('sankalpa_id');

    if (!sankalpa_id || typeof sankalpa_id !== 'string' || sankalpa_id.trim() === '') {
      return NextResponse.json({ error: 'sankalpa_id is required' }, { status: 400 });
    }

    // Historical journeys are read-only but remain owned by the same user;
    // unlike POST, GET must therefore allow completed/abandoned vows.
    const sankalpaExists = await verifyOwnedSankalpa(supabase, user.id, sankalpa_id, false);
    if (!sankalpaExists) {
      return NextResponse.json({ error: 'Sankalpa not found' }, { status: 404 });
    }

    const { data: rows, error } = await supabase
      .from('sankalpa_checkins')
      .select('checked_date')
      .eq('user_id', user.id)
      .eq('sankalpa_id', sankalpa_id);

    if (error) throw error;

    const checkins = rows ? rows.map(r => r.checked_date) : [];

    return NextResponse.json({ checkins });
  } catch (err) {
    console.error('[sankalpa/checkin/GET] Failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
