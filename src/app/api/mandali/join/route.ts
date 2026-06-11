import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { assertNotBanned } from '@/lib/api-guards';

type ProfileMandaliUpdateQuery = {
  update: (value: { mandali_id: string }) => {
    eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>;
  };
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const mandali_id = json.mandali_id;
    if (!mandali_id || typeof mandali_id !== 'string') {
      return NextResponse.json({ error: 'mandali_id required' }, { status: 400 });
    }
    
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    
    const adminClient = createAdminClient();
    const banned = await assertNotBanned(adminClient, user.id);
    if (banned) return banned;

    const profilesTable = adminClient.from('profiles') as unknown as ProfileMandaliUpdateQuery;
    
    const { error } = await profilesTable
      .update({ mandali_id })
      .eq('id', user.id);
    if (error) throw new Error(error.message);
    
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
