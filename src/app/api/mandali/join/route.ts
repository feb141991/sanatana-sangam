import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { mandali_id } = await request.json();
    if (!mandali_id) {
      return NextResponse.json({ error: 'mandali_id required' }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    const { error } = await supabase
      .from('profiles')
      .update({ mandali_id } as never)
      .eq('id', user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
