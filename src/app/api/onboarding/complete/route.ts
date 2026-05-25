import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as {
      tradition?: string;
      goal?: string;
      name?: string;
      life_stage?: string;
      gender?: string;
      interests?: string[];
    } | null;

    const tradition = body?.tradition?.trim();
    const goal = body?.goal?.trim();
    const name = body?.name?.trim() ?? '';

    const { data: existingProfile, error: existingError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (existingError) throw existingError;

    const updatePayload: {
      tradition?: string;
      onboarding_completed: boolean;
      onboarding_goal?: string | null;
      full_name?: string;
      life_stage?: string;
      gender_context?: string;
      seeking?: string[];
    } = {
      onboarding_completed: true,
    };

    if (tradition) updatePayload.tradition = tradition;
    if (goal) updatePayload.onboarding_goal = goal;
    if (name && name !== existingProfile?.full_name) updatePayload.full_name = name;
    if (body?.life_stage) updatePayload.life_stage = body.life_stage;
    if (body?.gender) updatePayload.gender_context = body.gender;
    if (body?.interests) updatePayload.seeking = body.interests;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload as never)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/onboarding/complete POST]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
