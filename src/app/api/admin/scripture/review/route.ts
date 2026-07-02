import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: {
      correction_id?: string;
      status?: 'approved' | 'rejected';
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { correction_id, status } = body;

    if (!correction_id || !status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Missing or invalid fields: correction_id, status must be approved or rejected' },
        { status: 400 }
      );
    }

    // Fetch the correction details first to get the submitter's user_id
    const { data: correction, error: fetchError } = await supabase
      .from('scripture_corrections')
      .select('user_id, status')
      .eq('id', correction_id)
      .single();

    if (fetchError || !correction) {
      return NextResponse.json({ error: 'Correction suggestion not found' }, { status: 404 });
    }

    // Update the correction status
    const { error: updateError } = await supabase
      .from('scripture_corrections')
      .update({ status })
      .eq('id', correction_id);

    if (updateError) {
      console.error('[admin/scripture/review] Status update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update correction status' }, { status: 500 });
    }

    // If approved, award karma to the submitter using the service role admin client
    if (status === 'approved') {
      const adminClient = createAdminClient() as any;
      const today = new Date().toISOString().slice(0, 10);

      const { data: rpcData, error: rpcError } = await adminClient.rpc('award_karma', {
        p_user_id: correction.user_id,
        p_reason: 'scripture_correction',
        p_amount: 50,
        p_date: today,
        p_daily_cap: 500, // Standard daily cap
        p_source_route: '/api/admin/scripture/review',
        p_metadata: null
      });

      if (rpcError) {
        console.error('[admin/scripture/review] Karma award RPC failed:', rpcError);
        // Note: status is updated, but karma award failed. Return warning or error
        return NextResponse.json({
          success: true,
          warning: 'Correction status updated but failed to award karma points automatically.'
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/scripture/review] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
