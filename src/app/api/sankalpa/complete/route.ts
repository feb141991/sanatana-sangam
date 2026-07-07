import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';

type ProfileKarmaRow = {
  karma_points: number | null;
};

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

    if (!sankalpa_id) {
      return NextResponse.json({ error: 'sankalpa_id is required' }, { status: 400 });
    }

    // Verify the sankalpa belongs to user and status is 'active'
    const { data: sankalpa, error: fetchError } = await supabase
      .from('sankalpas')
      .select('id, status, user_id')
      .eq('id', sankalpa_id)
      .single();

    if (fetchError || !sankalpa || sankalpa.user_id !== user.id) {
      return NextResponse.json({ error: 'Sankalpa not found or not owned by user' }, { status: 404 });
    }

    if (sankalpa.status !== 'active') {
      return NextResponse.json({ error: 'Sankalpa is not active' }, { status: 400 });
    }

    // Update sankalpa status and completed_at timestamp
    const { error: updateError } = await supabase
      .from('sankalpas')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sankalpa_id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Award +50 displayed karma. The existing seva RPCs update seva_score /
    // weekly_seva / monthly_seva, while Home reads profiles.karma_points.
    try {
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('karma_points')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const profile = profileRow as ProfileKarmaRow | null;
      const { error: karmaError } = await supabase
        .from('profiles')
        .update({ karma_points: (profile?.karma_points ?? 0) + 50 })
        .eq('id', user.id);

      if (karmaError) {
        console.error('[sankalpa/complete] karma_points update failed:', karmaError.message);
      }
    } catch (karmaErr) {
      console.error('[sankalpa/complete] karma_points award failed:', karmaErr);
    }

    return NextResponse.json({ success: true, karmaAwarded: 50 });
  } catch (err) {
    console.error('[sankalpa/complete/POST] Failed:', err);
    return NextResponse.json({ error: 'Failed to complete sankalpa' }, { status: 500 });
  }
}
