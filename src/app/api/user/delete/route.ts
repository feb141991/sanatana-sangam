import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { error: profileLookupError } = await supabase
    .from('profiles')
    .select('id, is_banned')
    .eq('id', user.id)
    .single();

  if (profileLookupError) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
  }

  const { error: profileDeleteError } = await admin
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileDeleteError) {
    return NextResponse.json({ success: false, error: profileDeleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
