import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const supabase = createAdminClient();

  try {
    let request = supabase
      .from('profiles')
      .select('*');

    if (query) {
      request = request.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
    } else {
      request = request.order('created_at', { ascending: false });
    }

    const { data, error } = await request.limit(50);
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, action } = await req.json();
  const supabase = createAdminClient();

  try {
    if (action === 'ban' || action === 'unban') {
      const { error } = await (supabase.from('profiles') as any)
        .update({ is_banned: action === 'ban' })
        .eq('id', userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
